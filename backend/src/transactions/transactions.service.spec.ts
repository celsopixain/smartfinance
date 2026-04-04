import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { TransactionsService } from './transactions.service'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { AiService } from '../ai/ai.service'
import { TransactionType } from '@prisma/client'

// ── Mocks ─────────────────────────────────────────────────
const mockPrisma = {
  account: {
    findFirst: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
  },
  category: {
    findFirst: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  aiSpendingLog: {
    upsert: jest.fn(),
  },
  // Executa as operações em paralelo como o Prisma faz internamente
  $transaction: jest.fn().mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops)),
}

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  scanDel: jest.fn().mockResolvedValue(undefined),
}

const mockAi = {
  checkAnomaly: jest.fn().mockResolvedValue({
    is_anomaly: false,
    score: 1.0,
    media_historica: 0,
  }),
}

const FAKE_USER_ID    = 'user-uuid-123'
const FAKE_ACCOUNT_ID = 'account-uuid-456'
const FAKE_CATEGORY_ID = 'category-uuid-789'

describe('TransactionsService', () => {
  let service: TransactionsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService,  useValue: mockRedis  },
        { provide: AiService,     useValue: mockAi     },
      ],
    }).compile()

    service = module.get<TransactionsService>(TransactionsService)
    jest.clearAllMocks()
  })

  // ── Valor inválido ────────────────────────────────────────
  describe('create — validação de valor', () => {
    it('deve rejeitar valor zero', async () => {
      await expect(
        service.create(FAKE_USER_ID, {
          amount: 0,
          date: '2026-04-01',
          description: 'Teste',
          categoryId: FAKE_CATEGORY_ID,
          accountId: FAKE_ACCOUNT_ID,
          type: TransactionType.EXPENSE,
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('deve rejeitar valor negativo', async () => {
      await expect(
        service.create(FAKE_USER_ID, {
          amount: -100,
          date: '2026-04-01',
          description: 'Teste',
          categoryId: FAKE_CATEGORY_ID,
          accountId: FAKE_ACCOUNT_ID,
          type: TransactionType.EXPENSE,
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('deve aceitar valor positivo', async () => {
      mockPrisma.account.findFirst.mockResolvedValue({ id: FAKE_ACCOUNT_ID })
      mockPrisma.category.findFirst.mockResolvedValue({ id: FAKE_CATEGORY_ID })
      mockPrisma.transaction.findMany.mockResolvedValue([])
      mockPrisma.transaction.create.mockResolvedValue({
        id: 'tx-1',
        type: TransactionType.EXPENSE,
        amount: 100,
        description: 'Teste',
        date: new Date(),
        isAnomaly: false,
        category: { id: FAKE_CATEGORY_ID, name: 'Alimentação' },
        account:  { id: FAKE_ACCOUNT_ID,  name: 'Nubank' },
        createdAt: new Date(),
      })
      mockPrisma.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 100 }, _count: { id: 1 }, _avg: { amount: 100 },
      })
      mockPrisma.aiSpendingLog.upsert.mockResolvedValue({})

      const result = await service.create(FAKE_USER_ID, {
        amount: 100,
        date: '2026-04-01',
        description: 'Teste',
        categoryId: FAKE_CATEGORY_ID,
        accountId: FAKE_ACCOUNT_ID,
        type: TransactionType.EXPENSE,
      })

      expect(result).toBeDefined()
      expect(result.amount).toBe(100)
    })
  })

  // ── user_id vem do JWT, nunca do body ─────────────────────
  describe('create — isolamento do user_id', () => {
    it('deve usar o user_id do JWT e não aceitar outro', async () => {
      mockPrisma.account.findFirst.mockResolvedValue({ id: FAKE_ACCOUNT_ID })
      mockPrisma.category.findFirst.mockResolvedValue({ id: FAKE_CATEGORY_ID })
      mockPrisma.transaction.findMany.mockResolvedValue([])
      mockPrisma.transaction.create.mockResolvedValue({
        id: 'tx-2', type: TransactionType.EXPENSE, amount: 50,
        description: 'Teste', date: new Date(), isAnomaly: false,
        category: { id: FAKE_CATEGORY_ID, name: 'Cat' },
        account:  { id: FAKE_ACCOUNT_ID,  name: 'Acc' },
        createdAt: new Date(),
      })
      mockPrisma.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 50 }, _count: { id: 1 }, _avg: { amount: 50 },
      })
      mockPrisma.aiSpendingLog.upsert.mockResolvedValue({})

      await service.create(FAKE_USER_ID, {
        amount: 50,
        date: '2026-04-01',
        description: 'Teste',
        categoryId: FAKE_CATEGORY_ID,
        accountId: FAKE_ACCOUNT_ID,
        type: TransactionType.EXPENSE,
      })

      // Verifica que o Prisma recebeu o userId correto (do JWT)
      expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: FAKE_USER_ID }),
        }),
      )
    })

    it('deve retornar 404 se a conta não pertencer ao usuário', async () => {
      // findFirst retorna null — conta não pertence ao userId
      mockPrisma.account.findFirst.mockResolvedValue(null)

      await expect(
        service.create(FAKE_USER_ID, {
          amount: 100,
          date: '2026-04-01',
          description: 'Teste',
          categoryId: FAKE_CATEGORY_ID,
          accountId: 'conta-de-outro-usuario',
          type: TransactionType.EXPENSE,
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it('deve retornar 404 se a categoria não pertencer ao usuário', async () => {
      mockPrisma.account.findFirst.mockResolvedValue({ id: FAKE_ACCOUNT_ID })
      mockPrisma.category.findFirst.mockResolvedValue(null)

      await expect(
        service.create(FAKE_USER_ID, {
          amount: 100,
          date: '2026-04-01',
          description: 'Teste',
          categoryId: 'categoria-de-outro-usuario',
          accountId: FAKE_ACCOUNT_ID,
          type: TransactionType.EXPENSE,
        }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  // ── Detecção de anomalia ──────────────────────────────────
  describe('create — anomalia', () => {
    it('deve marcar isAnomaly=true quando a IA detectar anomalia', async () => {
      mockAi.checkAnomaly.mockResolvedValueOnce({
        is_anomaly: true, score: 2.8, media_historica: 300,
      })
      mockPrisma.account.findFirst.mockResolvedValue({ id: FAKE_ACCOUNT_ID })
      mockPrisma.category.findFirst.mockResolvedValue({ id: FAKE_CATEGORY_ID })
      mockPrisma.transaction.findMany.mockResolvedValue([{ amount: 300 }, { amount: 280 }])
      mockPrisma.transaction.create.mockResolvedValue({
        id: 'tx-3', type: TransactionType.EXPENSE, amount: 840,
        description: 'Gasto suspeito', date: new Date(), isAnomaly: true,
        category: { id: FAKE_CATEGORY_ID, name: 'Cat' },
        account:  { id: FAKE_ACCOUNT_ID,  name: 'Acc' },
        createdAt: new Date(),
      })
      mockPrisma.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 840 }, _count: { id: 1 }, _avg: { amount: 840 },
      })
      mockPrisma.aiSpendingLog.upsert.mockResolvedValue({})

      const result = await service.create(FAKE_USER_ID, {
        amount: 840,
        date: '2026-04-01',
        description: 'Gasto suspeito',
        categoryId: FAKE_CATEGORY_ID,
        accountId: FAKE_ACCOUNT_ID,
        type: TransactionType.EXPENSE,
      })

      expect(result.isAnomaly).toBe(true)
      expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isAnomaly: true }),
        }),
      )
    })

    it('não deve chamar checkAnomaly para receitas (INCOME)', async () => {
      mockPrisma.account.findFirst.mockResolvedValue({ id: FAKE_ACCOUNT_ID })
      mockPrisma.category.findFirst.mockResolvedValue({ id: FAKE_CATEGORY_ID })
      mockPrisma.transaction.findMany.mockResolvedValue([])
      mockPrisma.transaction.create.mockResolvedValue({
        id: 'tx-4', type: TransactionType.INCOME, amount: 5000,
        description: 'Salário', date: new Date(), isAnomaly: false,
        category: { id: FAKE_CATEGORY_ID, name: 'Salário' },
        account:  { id: FAKE_ACCOUNT_ID,  name: 'Nubank' },
        createdAt: new Date(),
      })
      mockPrisma.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 5000 }, _count: { id: 1 }, _avg: { amount: 5000 },
      })
      mockPrisma.aiSpendingLog.upsert.mockResolvedValue({})

      await service.create(FAKE_USER_ID, {
        amount: 5000,
        date: '2026-04-01',
        description: 'Salário',
        categoryId: FAKE_CATEGORY_ID,
        accountId: FAKE_ACCOUNT_ID,
        type: TransactionType.INCOME,
      })

      expect(mockAi.checkAnomaly).not.toHaveBeenCalled()
    })
  })
})
