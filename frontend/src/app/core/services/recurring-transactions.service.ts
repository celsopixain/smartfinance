import { Injectable, inject, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { z } from 'zod'
import { RecurringTransactionSchema, type RecurringTransaction } from '../schemas/api.schemas'
import { environment } from '../../../environments/environment'

export interface CreateRecurringPayload {
  accountId:   string
  categoryId:  string
  type:        'INCOME' | 'EXPENSE'
  amount:      number
  description: string
  dayOfMonth:  number
}

@Injectable({ providedIn: 'root' })
export class RecurringTransactionsService {
  private readonly http = inject(HttpClient)
  private readonly url  = `${environment.apiUrl}/recurring-transactions`

  private readonly _value   = signal<RecurringTransaction[] | null>(null)
  private readonly _loading = signal(false)

  readonly recurring = {
    value:     this._value.asReadonly(),
    isLoading: this._loading.asReadonly(),
  }

  async load(): Promise<void> {
    this._loading.set(true)
    try {
      const raw = await firstValueFrom(this.http.get(this.url))
      this._value.set(z.array(RecurringTransactionSchema).parse(raw))
    } finally {
      this._loading.set(false)
    }
  }

  reload(): void { void this.load() }

  async create(payload: CreateRecurringPayload): Promise<RecurringTransaction> {
    const raw = await firstValueFrom(this.http.post(this.url, payload))
    return RecurringTransactionSchema.parse(raw)
  }

  async toggle(id: string): Promise<RecurringTransaction> {
    const raw = await firstValueFrom(this.http.patch(`${this.url}/${id}/toggle`, {}))
    return RecurringTransactionSchema.parse(raw)
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.url}/${id}`))
  }

  async generateForMonth(month: number, year: number): Promise<{ created: number }> {
    const raw = await firstValueFrom(
      this.http.post(`${this.url}/generate?month=${month}&year=${year}`, {})
    ) as { created: number }
    return raw
  }
}
