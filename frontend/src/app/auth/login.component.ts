import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { AuthService } from '../core/services/auth.service'

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
            <span class="text-white font-bold text-lg">SF</span>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">SmartFinance</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Entre na sua conta</p>
        </div>

        <!-- Erro -->
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
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              placeholder="••••••••"
              class="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
          </div>

          <button
            type="submit"
            [disabled]="isLoading()"
            class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
            @if (isLoading()) { Entrando... } @else { Entrar }
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
export class LoginComponent {
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)

  email = ''
  password = ''
  readonly isLoading = signal(false)
  readonly errorMsg = signal('')

  async onSubmit() {
    if (!this.email || !this.password) return
    this.isLoading.set(true)
    this.errorMsg.set('')
    try {
      await this.auth.login(this.email, this.password)
      void this.router.navigate(['/dashboard'])
    } catch {
      this.errorMsg.set('E-mail ou senha inválidos.')
    } finally {
      this.isLoading.set(false)
    }
  }
}
