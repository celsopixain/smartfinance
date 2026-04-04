import { Injectable, inject, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { z } from 'zod'
import { AccountFullSchema, type AccountFull } from '../schemas/api.schemas'
import { environment } from '../../../environments/environment'

export interface AccountPayload {
  name: string
  type: string
  balance?: number
}

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private readonly http = inject(HttpClient)
  private readonly url  = `${environment.apiUrl}/accounts`

  private readonly _value   = signal<AccountFull[] | null>(null)
  private readonly _loading = signal(false)
  private readonly _error   = signal<unknown>(null)

  // API pública compatível com resource() para não alterar templates
  readonly accounts = {
    value:     this._value.asReadonly(),
    isLoading: this._loading.asReadonly(),
    error:     this._error.asReadonly(),
  }

  async load(): Promise<void> {
    this._loading.set(true)
    this._error.set(null)
    try {
      const raw = await firstValueFrom(this.http.get(this.url))
      this._value.set(z.array(AccountFullSchema).parse(raw))
    } catch (err) {
      this._error.set(err)
    } finally {
      this._loading.set(false)
    }
  }

  reload(): void { void this.load() }

  async create(payload: AccountPayload): Promise<AccountFull> {
    const raw = await firstValueFrom(this.http.post(this.url, payload))
    return AccountFullSchema.parse(raw)
  }

  async update(id: string, payload: Partial<AccountPayload>): Promise<AccountFull> {
    const raw = await firstValueFrom(this.http.patch(`${this.url}/${id}`, payload))
    return AccountFullSchema.parse(raw)
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.url}/${id}`))
  }
}
