import { z } from 'zod'

// ── Contas ────────────────────────────────────────────────
export const AccountSchema = z.object({
  id:   z.string().uuid(),
  name: z.string(),
  type: z.enum(['CHECKING', 'SAVINGS', 'CASH', 'CREDIT', 'INVESTMENT']),
})
export type Account = z.infer<typeof AccountSchema>

export const AccountFullSchema = AccountSchema.extend({
  balance:   z.union([z.string(), z.number()]).transform(v => Number(v)),
  createdAt: z.string(),
})
export type AccountFull = z.infer<typeof AccountFullSchema>

// ── Categorias ────────────────────────────────────────────
export const CategorySchema = z.object({
  id:    z.string().uuid(),
  name:  z.string(),
  icon:  z.string().nullable(),
  color: z.string().nullable(),
})
export type Category = z.infer<typeof CategorySchema>

export const CategoryFullSchema = CategorySchema.extend({
  parentId:  z.string().uuid().nullable(),
  createdAt: z.string(),
})
export type CategoryFull = z.infer<typeof CategoryFullSchema>

// ── Auth ──────────────────────────────────────────────────
export const TokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})
export type Tokens = z.infer<typeof TokensSchema>

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string(),
})
export type AuthUser = z.infer<typeof AuthUserSchema>

// ── Transações ───────────────────────────────────────────
export const TransactionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.union([z.number(), z.string()]).transform(v => Number(v)),
  description: z.string(),
  date: z.string(),
  isAnomaly: z.boolean(),
  category: z.object({ id: z.string(), name: z.string() }),
  account: z.object({ id: z.string(), name: z.string() }),
  createdAt: z.string(),
})
export type Transaction = z.infer<typeof TransactionSchema>

export const PaginatedTransactionsSchema = z.object({
  data: z.array(TransactionSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
})
export type PaginatedTransactions = z.infer<typeof PaginatedTransactionsSchema>

// ── Orçamentos ────────────────────────────────────────────
const BudgetCategorySchema = z.object({
  id:    z.string(),
  name:  z.string(),
  color: z.string().nullable(),
  icon:  z.string().nullable(),
})

export const BudgetSchema = z.object({
  id:         z.string().uuid(),
  categoryId: z.string(),
  category:   BudgetCategorySchema,
  amount:     z.union([z.number(), z.string()]).transform(v => Number(v)),
  month:      z.number(),
  year:       z.number(),
  spent:      z.union([z.number(), z.string()]).transform(v => Number(v)),
  remaining:  z.union([z.number(), z.string()]).transform(v => Number(v)),
  percentage: z.number(),
})
export type Budget = z.infer<typeof BudgetSchema>

// ── Analytics ────────────────────────────────────────────
export const MonthlyDataSchema = z.object({
  month:   z.number(),
  income:  z.union([z.number(), z.string()]).transform(v => Number(v)),
  expense: z.union([z.number(), z.string()]).transform(v => Number(v)),
  balance: z.union([z.number(), z.string()]).transform(v => Number(v)),
})
export type MonthlyData = z.infer<typeof MonthlyDataSchema>

export const CategoryBreakdownSchema = z.object({
  categoryId: z.string(),
  category:   BudgetCategorySchema.nullable(),
  total:      z.union([z.number(), z.string()]).transform(v => Number(v)),
  count:      z.number(),
  percentage: z.number(),
})
export type CategoryBreakdown = z.infer<typeof CategoryBreakdownSchema>

// ── Transações Recorrentes ────────────────────────────────
export const RecurringTransactionSchema = z.object({
  id:          z.string().uuid(),
  type:        z.enum(['INCOME', 'EXPENSE']),
  amount:      z.union([z.number(), z.string()]).transform(v => Number(v)),
  description: z.string(),
  dayOfMonth:  z.number(),
  isActive:    z.boolean(),
  category:    z.object({ id: z.string(), name: z.string(), color: z.string().nullable(), icon: z.string().nullable() }),
  account:     z.object({ id: z.string(), name: z.string() }),
  createdAt:   z.string(),
})
export type RecurringTransaction = z.infer<typeof RecurringTransactionSchema>
