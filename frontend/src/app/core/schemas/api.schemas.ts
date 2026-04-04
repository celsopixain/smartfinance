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
