import { Injectable, inject, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { z } from 'zod'
import { CategoryFullSchema, type CategoryFull } from '../schemas/api.schemas'
import { environment } from '../../../environments/environment'

export interface CategoryPayload {
  name: string
  icon?: string
  color?: string
  parentId?: string
}

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient)
  private readonly url  = `${environment.apiUrl}/categories`

  private readonly _value   = signal<CategoryFull[] | null>(null)
  private readonly _loading = signal(false)
  private readonly _error   = signal<unknown>(null)

  // API pública compatível com resource() para não alterar templates
  readonly categories = {
    value:     this._value.asReadonly(),
    isLoading: this._loading.asReadonly(),
    error:     this._error.asReadonly(),
  }

  async load(): Promise<void> {
    this._loading.set(true)
    this._error.set(null)
    try {
      const raw = await firstValueFrom(this.http.get(this.url))
      this._value.set(z.array(CategoryFullSchema).parse(raw))
    } catch (err) {
      this._error.set(err)
    } finally {
      this._loading.set(false)
    }
  }

  reload(): void { void this.load() }

  async create(payload: CategoryPayload): Promise<CategoryFull> {
    const raw = await firstValueFrom(this.http.post(this.url, payload))
    return CategoryFullSchema.parse(raw)
  }

  async update(id: string, payload: Partial<CategoryPayload>): Promise<CategoryFull> {
    const raw = await firstValueFrom(this.http.patch(`${this.url}/${id}`, payload))
    return CategoryFullSchema.parse(raw)
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.url}/${id}`))
  }
}
