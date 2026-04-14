import { Injectable, inject, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { z } from 'zod'
import { BudgetSchema, type Budget } from '../schemas/api.schemas'
import { environment } from '../../../environments/environment'

export interface BudgetPayload {
  categoryId: string
  amount: number
  month: number
  year: number
}

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly http = inject(HttpClient)
  private readonly url  = `${environment.apiUrl}/budgets`

  private readonly _value   = signal<Budget[] | null>(null)
  private readonly _loading = signal(false)
  private readonly _error   = signal<unknown>(null)

  readonly budgets = {
    value:     this._value.asReadonly(),
    isLoading: this._loading.asReadonly(),
    error:     this._error.asReadonly(),
  }

  async load(month: number, year: number): Promise<void> {
    this._loading.set(true)
    this._error.set(null)
    try {
      const raw = await firstValueFrom(
        this.http.get(`${this.url}?month=${month}&year=${year}`)
      )
      this._value.set(z.array(BudgetSchema).parse(raw))
    } catch (err) {
      this._error.set(err)
    } finally {
      this._loading.set(false)
    }
  }

  async upsert(payload: BudgetPayload): Promise<Budget> {
    const raw = await firstValueFrom(this.http.post(this.url, payload))
    return BudgetSchema.parse(raw)
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.url}/${id}`))
  }
}
