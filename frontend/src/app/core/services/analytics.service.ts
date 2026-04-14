import { Injectable, inject, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { z } from 'zod'
import { MonthlyDataSchema, CategoryBreakdownSchema, type MonthlyData, type CategoryBreakdown } from '../schemas/api.schemas'
import { environment } from '../../../environments/environment'

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient)
  private readonly base = `${environment.apiUrl}/analytics`

  private readonly _monthly    = signal<MonthlyData[] | null>(null)
  private readonly _breakdown  = signal<CategoryBreakdown[] | null>(null)
  private readonly _loading    = signal(false)

  readonly monthly   = this._monthly.asReadonly()
  readonly breakdown = this._breakdown.asReadonly()
  readonly isLoading = this._loading.asReadonly()

  async loadMonthly(year: number): Promise<void> {
    this._loading.set(true)
    try {
      const raw = await firstValueFrom(this.http.get(`${this.base}/monthly?year=${year}`))
      this._monthly.set(z.array(MonthlyDataSchema).parse(raw))
    } finally {
      this._loading.set(false)
    }
  }

  async loadBreakdown(month: number, year: number): Promise<void> {
    this._loading.set(true)
    try {
      const raw = await firstValueFrom(
        this.http.get(`${this.base}/categories?month=${month}&year=${year}`)
      )
      this._breakdown.set(z.array(CategoryBreakdownSchema).parse(raw))
    } finally {
      this._loading.set(false)
    }
  }
}
