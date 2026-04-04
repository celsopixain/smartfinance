import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { AuthService } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}

const mockRedis = {
  set: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
}

const mockJwt = {
  sign: jest.fn().mockReturnValue('mocked.jwt.token'),
  decode: jest.fn().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 900 }),
}

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService,  useValue: mockRedis  },
        { provide: JwtService,    useValue: mockJwt    },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    jest.clearAllMocks()
  })

  // ── Register ─────────────────────────────────────────────
  describe('register', () => {
    it('deve criar usuário com senha hasheada', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1', name: 'Fulano', email: 'fulano@email.com', createdAt: new Date(),
      })

      const result = await service.register({
        name: 'Fulano', email: 'fulano@email.com', password: 'Senha@123',
      })

      expect(result.email).toBe('fulano@email.com')
      // Senha nunca deve aparecer na resposta
      expect((result as any).password).toBeUndefined()
      expect((result as any).passwordHash).toBeUndefined()
    })

    it('deve lançar ConflictException se email já existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'fulano@email.com' })

      await expect(
        service.register({ name: 'Fulano', email: 'fulano@email.com', password: 'Senha@123' }),
      ).rejects.toThrow(ConflictException)
    })

    it('nunca deve armazenar senha em texto plano', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1', name: 'Fulano', email: 'fulano@email.com', createdAt: new Date(),
      })

      await service.register({ name: 'Fulano', email: 'fulano@email.com', password: 'Senha@123' })

      const createCall = mockPrisma.user.create.mock.calls[0][0]
      // Senha original não deve aparecer no data
      expect(createCall.data.password).toBeUndefined()
      // O hash deve ser diferente da senha original
      const hash = createCall.data.passwordHash
      expect(hash).not.toBe('Senha@123')
      expect(await bcrypt.compare('Senha@123', hash)).toBe(true)
    })
  })

  // ── Login ────────────────────────────────────────────────
  describe('login', () => {
    it('deve retornar tokens ao autenticar com credenciais válidas', async () => {
      const hash = await bcrypt.hash('Senha@123', 10)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'fulano@email.com', passwordHash: hash,
      })
      mockJwt.sign.mockReturnValue('access.token')

      const result = await service.login({ email: 'fulano@email.com', password: 'Senha@123' })

      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
    })

    it('deve lançar UnauthorizedException para senha incorreta', async () => {
      const hash = await bcrypt.hash('SenhaCorreta@1', 10)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'fulano@email.com', passwordHash: hash,
      })

      await expect(
        service.login({ email: 'fulano@email.com', password: 'SenhaErrada@1' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('deve lançar UnauthorizedException para email inexistente', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(
        service.login({ email: 'naoexiste@email.com', password: 'Qualquer@1' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('mensagem de erro deve ser genérica (não revelar se email existe)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      try {
        await service.login({ email: 'naoexiste@email.com', password: 'Qualquer@1' })
      } catch (err: any) {
        expect(err.message).toBe('Credenciais inválidas')
        expect(err.message.toLowerCase()).not.toContain('email')
        expect(err.message.toLowerCase()).not.toContain('usuário')
      }
    })
  })
})
