import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto'

@Injectable()
export class RecurringTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.recurringTransaction.findMany({
      where: { userId },
      include: {
        category: { select: { id: true, name: true, color: true, icon: true } },
        account:  { select: { id: true, name: true } },
      },
      orderBy: [{ isActive: 'desc' }, { dayOfMonth: 'asc' }],
    })
  }

  async create(userId: string, dto: CreateRecurringTransactionDto) {
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, userId },
    })
    if (!account) throw new NotFoundException('Conta não encontrada')

    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, userId },
    })
    if (!category) throw new NotFoundException('Categoria não encontrada')

    return this.prisma.recurringTransaction.create({
      data: {
        userId,
        accountId:   dto.accountId,
        categoryId:  dto.categoryId,
        type:        dto.type,
        amount:      dto.amount,
        description: dto.description,
        dayOfMonth:  dto.dayOfMonth,
      },
      include: {
        category: { select: { id: true, name: true, color: true, icon: true } },
        account:  { select: { id: true, name: true } },
      },
    })
  }

  async toggleActive(userId: string, id: string) {
    const rec = await this.prisma.recurringTransaction.findFirst({ where: { id, userId } })
    if (!rec) throw new NotFoundException('Transação recorrente não encontrada')
    return this.prisma.recurringTransaction.update({
      where: { id },
      data:  { isActive: !rec.isActive },
      include: {
        category: { select: { id: true, name: true } },
        account:  { select: { id: true, name: true } },
      },
    })
  }

  async remove(userId: string, id: string) {
    const rec = await this.prisma.recurringTransaction.findFirst({ where: { id, userId } })
    if (!rec) throw new NotFoundException('Transação recorrente não encontrada')
    await this.prisma.recurringTransaction.delete({ where: { id } })
    return { message: 'Transação recorrente removida com sucesso' }
  }

  async generateForMonth(userId: string, month: number, year: number) {
    const recurring = await this.prisma.recurringTransaction.findMany({
      where: { userId, isActive: true },
    })

    const created = []

    for (const r of recurring) {
      const lastDay = new Date(year, month, 0).getDate()
      const day     = Math.min(r.dayOfMonth, lastDay)
      const date    = new Date(year, month - 1, day)

      // Evita duplicatas exatas para o mesmo dia/valor/descrição/conta/categoria
      const exists = await this.prisma.transaction.findFirst({
        where: { userId, description: r.description, date, accountId: r.accountId, categoryId: r.categoryId },
      })
      if (exists) continue

      const [tx] = await this.prisma.$transaction([
        this.prisma.transaction.create({
          data: {
            userId,
            accountId:   r.accountId,
            categoryId:  r.categoryId,
            type:        r.type,
            amount:      r.amount,
            description: r.description,
            date,
            isAnomaly:   false,
          },
          select: {
            id: true, type: true, amount: true, description: true, date: true,
            category: { select: { id: true, name: true } },
            account:  { select: { id: true, name: true } },
          },
        }),
        this.prisma.account.update({
          where: { id: r.accountId },
          data: {
            balance: r.type === 'INCOME'
              ? { increment: r.amount }
              : { decrement: r.amount },
          },
        }),
      ])

      created.push(tx)
    }

    return { created: created.length, transactions: created }
  }
}
