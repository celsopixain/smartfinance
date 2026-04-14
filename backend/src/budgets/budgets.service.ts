import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateBudgetDto } from './dto/create-budget.dto'
import { ListBudgetsDto } from './dto/list-budgets.dto'

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, dto: ListBudgetsDto) {
    const { month, year } = dto

    const budgets = await this.prisma.budget.findMany({
      where: { userId, month, year },
      include: {
        category: { select: { id: true, name: true, color: true, icon: true } },
      },
      orderBy: { category: { name: 'asc' } },
    })

    const startDate = new Date(year, month - 1, 1)
    const endDate   = new Date(year, month, 1)

    const spentByCategory = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startDate, lt: endDate },
        categoryId: { in: budgets.map(b => b.categoryId) },
      },
      _sum: { amount: true },
    })

    const spentMap = new Map(
      spentByCategory.map(s => [s.categoryId, Number(s._sum.amount ?? 0)]),
    )

    return budgets.map(b => {
      const limit   = Number(b.amount)
      const spent   = spentMap.get(b.categoryId) ?? 0
      return {
        id:         b.id,
        categoryId: b.categoryId,
        category:   b.category,
        amount:     limit,
        month:      b.month,
        year:       b.year,
        spent,
        remaining:  limit - spent,
        percentage: limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0,
      }
    })
  }

  async upsert(userId: string, dto: CreateBudgetDto) {
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, userId },
    })
    if (!category) throw new NotFoundException('Categoria não encontrada')

    return this.prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId: dto.categoryId,
          month: dto.month,
          year: dto.year,
        },
      },
      create: {
        userId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        month: dto.month,
        year: dto.year,
      },
      update: { amount: dto.amount },
      include: {
        category: { select: { id: true, name: true, color: true, icon: true } },
      },
    })
  }

  async remove(userId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({ where: { id, userId } })
    if (!budget) throw new NotFoundException('Orçamento não encontrado')
    await this.prisma.budget.delete({ where: { id } })
    return { message: 'Orçamento removido com sucesso' }
  }
}
