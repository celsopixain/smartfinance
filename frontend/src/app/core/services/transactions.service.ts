import { Injectable, inject, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { z } from 'zod'
import {
  PaginatedTransactionsSchema,
  TransactionSchema,
  AccountSchema,
  CategorySchema,
  type PaginatedTransactions,
  type Transaction,
  type Account,
  type Category,
} from '../schemas/api.schemas'
import { environment } from '../../../environments/environment'

export interface CreateTransactionPayload {
  type: 'INCOME' | 'EXPENSE'
  description: string
  amount: number
  date: string
  accountId: string
  categoryId: string
}

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private readonly http = inject(HttpClient)

  readonly page  = signal(1)
  readonly limit = signal(100)

  // Estado interno com sinais simples — carrega SOMENTE quando load() é chamado
  private readonly _value    = signal<PaginatedTransactions | null>(null)
  private readonly _loading  = signal(false)
  private readonly _error    = signal<unknown>(null)

  // API pública compatível com resource() para não alterar templates
  readonly transactions = {
    value:     this._value.asReadonly(),
    isLoading: this._loading.asReadonly(),
    error:     this._error.asReadonly(),
  }

  async load(): Promise<void> {
    this._loading.set(true)
    this._error.set(null)
    try {
      const raw = await firstValueFrom(
        this.http.get(
          `${environment.apiUrl}/transactions?page=${this.page()}&limit=${this.limit()}`
        )
      )
      this._value.set(PaginatedTransactionsSchema.parse(raw))
    } catch (err) {
      this._error.set(err)
    } finally {
      this._loading.set(false)
    }
  }

  reload(): void { void this.load() }

  async create(payload: CreateTransactionPayload): Promise<Transaction> {
    const raw = await firstValueFrom(
      this.http.post(`${environment.apiUrl}/transactions`, payload)
    )
    return TransactionSchema.parse(raw)
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${environment.apiUrl}/transactions/${id}`))
  }

  async getAccounts(): Promise<Account[]> {
    const raw = await firstValueFrom(this.http.get(`${environment.apiUrl}/accounts`))
    return z.array(AccountSchema).parse(raw)
  }

  async getCategories(): Promise<Category[]> {
    const raw = await firstValueFrom(this.http.get(`${environment.apiUrl}/categories`))
    return z.array(CategorySchema).parse(raw)
  }
}
