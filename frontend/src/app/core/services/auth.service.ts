import { Injectable, inject, signal, computed } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router'
import { firstValueFrom } from 'rxjs'
import { TokensSchema, AuthUserSchema, type AuthUser } from '../schemas/api.schemas'
import { environment } from '../../../environments/environment'

const ACCESS_TOKEN_KEY  = 'sf_access_token'
const REFRESH_TOKEN_KEY = 'sf_refresh_token'
// localStorage persiste entre sessões do navegador (fechamento e reabertura de abas)
const storage = localStorage

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient)
  private readonly router = inject(Router)

  private readonly _user = signal<AuthUser | null>(null)
  readonly user = this._user.asReadonly()
  readonly isLoggedIn = computed(() => !!this.getAccessToken())

  async login(email: string, password: string): Promise<void> {
    const raw = await firstValueFrom(
      this.http.post(`${environment.apiUrl}/auth/login`, { email, password })
    )
    const tokens = TokensSchema.parse(raw)
    storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  }

  async register(name: string, email: string, password: string): Promise<void> {
    const raw = await firstValueFrom(
      this.http.post(`${environment.apiUrl}/auth/register`, { name, email, password })
    )
    AuthUserSchema.parse(raw) // valida resposta
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/logout`, {})
      )
    } catch {
      // ignora erros no logout — limpa tokens de qualquer forma
    } finally {
      storage.removeItem(ACCESS_TOKEN_KEY)
      storage.removeItem(REFRESH_TOKEN_KEY)
      this._user.set(null)
      void this.router.navigate(['/login'])
    }
  }

  getAccessToken(): string | null {
    return storage.getItem(ACCESS_TOKEN_KEY)
  }

  getRefreshToken(): string | null {
    return storage.getItem(REFRESH_TOKEN_KEY)
  }

  setTokens(accessToken: string, refreshToken: string): void {
    storage.setItem(ACCESS_TOKEN_KEY, accessToken)
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
}
