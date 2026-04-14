import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonthlyReport(userId: string, year: number) {
    const startDate = new Date(year, 0, 1)
    const endDate   = new Date(year + 1, 0, 1)

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: startDate, lt: endDate } },
      select: { type: true, amount: true, date: true },
    })

    const monthly: Record<number, { income: number; expense: number }> = {}
    for (let m = 1; m <= 12; m++) monthly[m] = { income: 0, expense: 0 }

    for (const tx of transactions) {
      const m = new Date(tx.date).getMonth() + 1
      if (tx.type === 'INCOME') monthly[m].income += Number(tx.amount)
      else monthly[m].expense += Number(tx.amount)
    }

    return Object.entries(monthly).map(([month, data]) => ({
      month:   Number(month),
      income:  data.income,
      expense: data.expense,
      balance: data.income - data.expense,
    }))
  }

  async getCategoryBreakdown(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1)
    const endDate   = new Date(year, month, 1)

    const result = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'EXPENSE', date: { gte: startDate, lt: endDate } },
      _sum:   { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
    })

    if (result.length === 0) return []

    const categories = await this.prisma.category.findMany({
      where: { id: { in: result.map(r => r.categoryId) } },
      select: { id: true, name: true, color: true, icon: true },
    })

    const catMap = new Map(categories.map(c => [c.id, c]))
    const total  = result.reduce((s, r) => s + Number(r._sum.amount ?? 0), 0)

    return result.map(r => ({
      categoryId: r.categoryId,
      category:   catMap.get(r.categoryId) ?? null,
      total:      Number(r._sum.amount ?? 0),
      count:      r._count.id,
      percentage: total > 0 ? Math.round((Number(r._sum.amount ?? 0) / total) * 100) : 0,
    }))
  }
}
