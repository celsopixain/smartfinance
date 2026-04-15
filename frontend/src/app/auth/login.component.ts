import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { HttpErrorResponse } from '@angular/common/http'
import { AuthService } from '../core/services/auth.service'

type BackendStatus = 'checking' | 'waking' | 'online' | 'timeout'

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 w-full max-w-sm p-8 space-y-6">

        <!-- Logo -->
        <div class="text-center space-y-2">
          <div class="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto">
            <span class="text-white font-bold text-lg"><img src="favicon.svg" alt="SmartFinance" class="w-full h-full object-contain" /></span>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">SmartFinance</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Entre na sua conta</p>
        </div>

        <!-- Banner: verificando servidor -->
        @if (backendStatus() === 'checking') {
          <div class="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm rounded-lg px-4 py-3">
            <svg class="w-4 h-4 animate-spin shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
            </svg>
            Verificando servidor...
          </div>
        }

        <!-- Banner: servidor acordando -->
        @if (backendStatus() === 'waking') {
          <div class="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm rounded-lg px-4 py-3">
            <svg class="w-4 h-4 animate-spin shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
            </svg>
            <span>Servidor iniciando, aguarde...<br><span class="opacity-75 text-xs">Pode levar até 30 segundos após inatividade.</span></span>
          </div>
        }

        <!-- Banner: timeout -->
        @if (backendStatus() === 'timeout') {
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3">
            Servidor indisponível. Tente novamente em alguns instantes.
          </div>
        }

        <!-- Erro de login -->
        @if (errorMsg()) {
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3">
            {{ errorMsg() }}
          </div>
        }

        <!-- Formulário -->
        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              placeholder="seu@email.com"
              class="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
            <div class="relative">
              <input
                [type]="showPassword() ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                required
                placeholder="••••••••"
                class="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
              <button
                type="button"
                (click)="showPassword.set(!showPassword())"
                class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                @if (showPassword()) {
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              </button>
            </div>
          </div>

          <button
            type="submit"
            [disabled]="isLoading() || backendStatus() !== 'online'"
            class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
            @if (backendStatus() === 'checking') { Verificando... }
            @else if (backendStatus() === 'waking') { Aguardando servidor... }
            @else if (isLoading()) { Entrando... }
            @else { Entrar }
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
          Não tem conta?
          <a routerLink="/register" class="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Cadastre-se</a>
        </p>

      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)

  email = ''
  password = ''
  readonly isLoading = signal(false)
  readonly errorMsg = signal('')
  readonly showPassword = signal(false)
  readonly backendStatus = signal<BackendStatus>('checking')

  private pollInterval: ReturnType<typeof setInterval> | null = null
  private pollAttempts = 0
  private readonly MAX_ATTEMPTS = 20 // 20 × 4s = 80s

  ngOnInit(): void {
    void this.startHealthCheck()
  }

  ngOnDestroy(): void {
    this.clearPoll()
  }

  private async startHealthCheck(): Promise<void> {
    const online = await this.auth.checkHealth()
    if (online) {
      this.backendStatus.set('online')
      return
    }
    this.backendStatus.set('waking')
    this.pollInterval = setInterval(() => void this.pollHealth(), 4000)
  }

  private async pollHealth(): Promise<void> {
    this.pollAttempts++
    if (this.pollAttempts >= this.MAX_ATTEMPTS) {
      this.clearPoll()
      this.backendStatus.set('timeout')
      return
    }
    const online = await this.auth.checkHealth()
    if (online) {
      this.clearPoll()
      this.backendStatus.set('online')
    }
  }

  private clearPoll(): void {
    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }

  async onSubmit() {
    if (!this.email || !this.password) return
    this.isLoading.set(true)
    this.errorMsg.set('')
    try {
      await this.auth.login(this.email, this.password)
      void this.router.navigate(['/dashboard'])
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 0) {
        this.errorMsg.set('Servidor offline. Aguarde o servidor iniciar e tente novamente.')
        this.backendStatus.set('waking')
        void this.startHealthCheck()
      } else {
        this.errorMsg.set('E-mail ou senha inválidos.')
      }
    } finally {
      this.isLoading.set(false)
    }
  }
}
