import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { AiService } from '../ai/ai.service'
import { CreateTransactionDto } from './dto/create-transaction.dto'
import { ListTransactionsDto } from './dto/list-transactions.dto'

const CACHE_TTL = 60 // segundos

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly ai: AiService,
  ) {}

  async create(userId: string, dto: CreateTransactionDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('O valor da transação deve ser maior que zero')
    }

    // Verifica se a conta pertence ao usuário
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, userId },
    })
    if (!account) throw new NotFoundException('Conta não encontrada')

    // Verifica se a categoria pertence ao usuário
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, userId },
    })
    if (!category) throw new NotFoundException('Categoria não encontrada')

    // Busca histórico de valores da categoria para detecção de anomalia
    const historicoValores = await this.prisma.transaction.findMany({
      where: { userId, categoryId: dto.categoryId, type: 'EXPENSE' },
      select: { amount: true },
      orderBy: { date: 'desc' },
      take: 20,
    }).then(rows => rows.map(r => Number(r.amount)))

    // Verifica anomalia (falha silenciosa — não bloqueia criação)
    const anomaly = dto.type === 'EXPENSE'
      ? await this.ai.checkAnomaly(userId, dto.categoryId, dto.amount, historicoValores)
      : { is_anomaly: false, score: 1, media_historica: 0 }

    // Cria a transação e atualiza o saldo da conta atomicamente
    const [transaction] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          userId,
          accountId: dto.accountId,
          categoryId: dto.categoryId,
          type: dto.type,
          amount: dto.amount,
          description: dto.description,
          date: new Date(dto.date),
          isAnomaly: anomaly.is_anomaly,
        },
        select: {
          id: true,
          type: true,
          amount: true,
          description: true,
          date: true,
          isAnomaly: true,
          category: { select: { id: true, name: true } },
          account:  { select: { id: true, name: true } },
          createdAt: true,
        },
      }),
      this.prisma.account.update({
        where: { id: dto.accountId },
        data: {
          balance: dto.type === 'INCOME'
            ? { increment: dto.amount }
            : { decrement: dto.amount },
        },
      }),
    ])

    // Atualiza log da IA de forma assíncrona (não bloqueia a resposta)
    void this.updateAiLog(userId, dto.categoryId, new Date(dto.date)).catch(err =>
      this.logger.error('Falha ao atualizar AI log', err),
    )

    // Invalida cache de listagem deste usuário
    await this.invalidateCache(userId)

    return transaction
  }

  async findAll(userId: string, dto: ListTransactionsDto) {
    const cacheKey = `transactions:${userId}:page:${dto.page}:limit:${dto.limit}`

    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const [data, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        skip: (dto.page - 1) * dto.limit,
        take: dto.limit,
        select: {
          id: true,
          type: true,
          amount: true,
          description: true,
          date: true,
          isAnomaly: true,
          category: { select: { id: true, name: true } },
          account:  { select: { id: true, name: true } },
          createdAt: true,
        },
      }),
      this.prisma.transaction.count({ where: { userId } }),
    ])

    const result = {
      data,
      meta: {
        total,
        page: dto.page,
        limit: dto.limit,
        totalPages: Math.ceil(total / dto.limit),
      },
    }

    await this.redis.set(cacheKey, JSON.stringify(result), CACHE_TTL)
    return result
  }

  async remove(userId: string, id: string) {
    const tx = await this.prisma.transaction.findFirst({ where: { id, userId } })
    if (!tx) throw new NotFoundException('Transação não encontrada')

    // Reverte o saldo da conta atomicamente
    await this.prisma.$transaction([
      this.prisma.transaction.delete({ where: { id } }),
      this.prisma.account.update({
        where: { id: tx.accountId },
        data: {
          balance: tx.type === 'INCOME'
            ? { decrement: tx.amount }
            : { increment: tx.amount },
        },
      }),
    ])

    await this.invalidateCache(userId)
    return { message: 'Transação removida com sucesso' }
  }

  // Invalida todas as páginas em cache do usuário via SCAN + DEL por padrão
  private async invalidateCache(userId: string) {
    await this.redis.scanDel(`transactions:${userId}:page:*:limit:*`)
  }

  // Atualiza tabela ai_spending_logs com upsert (soma o mês atual)
  private async updateAiLog(userId: string, categoryId: string, date: Date) {
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    const agg = await this.prisma.transaction.aggregate({
      where: { userId, categoryId, date: { gte: new Date(year, month - 1, 1) } },
      _sum: { amount: true },
      _count: { id: true },
      _avg: { amount: true },
    })

    await this.prisma.aiSpendingLog.upsert({
      where: { userId_categoryId_month_year: { userId, categoryId, month, year } },
      update: {
        totalAmount: agg._sum.amount ?? 0,
        transactionCount: agg._count.id,
        avgAmount: agg._avg.amount ?? 0,
      },
      create: {
        userId,
        categoryId,
        month,
        year,
        totalAmount: agg._sum.amount ?? 0,
        transactionCount: agg._count.id,
        avgAmount: agg._avg.amount ?? 0,
      },
    })
  }
}
