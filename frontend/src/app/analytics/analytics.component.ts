import {
  Component, ChangeDetectionStrategy, signal, computed, inject, afterNextRender,
} from '@angular/core'
import { CurrencyPipe, NgClass } from '@angular/common'
import { RouterLink } from '@angular/router'
import { AnalyticsService } from '../core/services/analytics.service'
import { AuthService } from '../core/services/auth.service'

const MONTH_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const BAR_COLORS   = [
  '#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316',
  '#eab308','#22c55e','#14b8a6','#06b6d4','#3b82f6',
]

@Component({
  selector: 'app-analytics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, NgClass, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">

      <!-- Header -->
      <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/dashboard" class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span class="text-white font-bold text-sm">SF</span>
          </a>
          <nav class="flex items-center gap-1">
            <a routerLink="/dashboard"  class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Dashboard</a>
            <a routerLink="/accounts"   class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Contas</a>
            <a routerLink="/categories" class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Categorias</a>
            <a routerLink="/budgets"    class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Orçamentos</a>
            <a routerLink="/analytics"  class="px-3 py-1.5 rounded-lg text-sm text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20 font-medium transition-colors">Analytics</a>
            <a routerLink="/recurring"  class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Recorrentes</a>
          </nav>
        </div>
        <button (click)="logout()" class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Sair">↩</button>
      </header>

      <main class="max-w-5xl mx-auto px-4 py-8 space-y-8">

        <!-- Título + seletor de ano/mês -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold">Analytics</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Visão geral das suas finanças</p>
          </div>
          <div class="flex items-center gap-2">
            <select (change)="onYearChange($event)"
              class="text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              @for (y of yearOptions; track y) {
                <option [value]="y" [selected]="y === selectedYear()">{{ y }}</option>
              }
            </select>
            <select (change)="onMonthChange($event)"
              class="text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              @for (m of monthOptions; track m.value) {
                <option [value]="m.value" [selected]="m.value === selectedMonth()">{{ m.label }}</option>
              }
            </select>
          </div>
        </div>

        <!-- Resumo anual -->
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Receita {{ selectedYear() }}</p>
            <p class="text-2xl font-bold text-green-600">{{ annualIncome() | currency:'BRL':'R$':'1.2-2' }}</p>
          </div>
          <div class="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Despesa {{ selectedYear() }}</p>
            <p class="text-2xl font-bold text-red-600">{{ annualExpense() | currency:'BRL':'R$':'1.2-2' }}</p>
          </div>
          <div class="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Saldo {{ selectedYear() }}</p>
            <p class="text-2xl font-bold" [ngClass]="annualBalance() >= 0 ? 'text-indigo-600' : 'text-red-600'">
              {{ annualBalance() | currency:'BRL':'R$':'1.2-2' }}
            </p>
          </div>
        </div>

        <!-- Gráfico de barras mensal -->
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <h3 class="text-base font-semibold mb-5">Receita vs Despesa por Mês</h3>
          @if (analyticsService.isLoading()) {
            <div class="h-40 flex items-center justify-center text-gray-400 text-sm">Carregando...</div>
          } @else if (monthlyData().length === 0) {
            <div class="h-40 flex items-center justify-center text-gray-400 text-sm">Sem dados para este ano</div>
          } @else {
            <div class="flex items-end gap-2 h-48 mt-2">
              @for (m of monthlyData(); track m.month) {
                <div class="flex-1 flex flex-col items-center gap-1">
                  <div class="w-full flex gap-0.5 items-end" [style.height.px]="160">
                    <div class="flex-1 rounded-t transition-all bg-green-400"
                      [style.height.%]="maxMonthly() > 0 ? (m.income / maxMonthly()) * 100 : 0"
                      [title]="'Receita: ' + (m.income | currency:'BRL':'R$':'1.0-0')">
                    </div>
                    <div class="flex-1 rounded-t transition-all bg-red-400"
                      [style.height.%]="maxMonthly() > 0 ? (m.expense / maxMonthly()) * 100 : 0"
                      [title]="'Despesa: ' + (m.expense | currency:'BRL':'R$':'1.0-0')">
                    </div>
                  </div>
                  <span class="text-xs text-gray-400">{{ monthLabel(m.month) }}</span>
                </div>
              }
            </div>
            <div class="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-green-400 inline-block"></span>Receita</span>
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-red-400 inline-block"></span>Despesa</span>
            </div>
          }
        </div>

        <!-- Distribuição por categoria no mês -->
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <h3 class="text-base font-semibold mb-1">Gastos por Categoria</h3>
          <p class="text-xs text-gray-400 mb-5">{{ monthOptions[selectedMonth() - 1]?.label }} / {{ selectedYear() }}</p>

          @if (analyticsService.isLoading()) {
            <div class="space-y-2">
              @for (n of [1,2,3]; track $index) {
                <div class="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
              }
            </div>
          } @else if (breakdown().length === 0) {
            <p class="text-sm text-gray-400 text-center py-8">Nenhuma despesa neste mês.</p>
          } @else {
            <div class="space-y-3">
              @for (item of breakdown(); track item.categoryId; let i = $index) {
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-2">
                      @if (item.category?.icon) {
                        <span class="text-sm">{{ item.category!.icon }}</span>
                      } @else {
                        <span class="w-3 h-3 rounded-full inline-block" [style.background]="barColor(i)"></span>
                      }
                      <span class="text-sm font-medium">{{ item.category?.name ?? 'Sem categoria' }}</span>
                      <span class="text-xs text-gray-400">({{ item.count }} transações)</span>
                    </div>
                    <div class="text-right">
                      <span class="text-sm font-semibold">{{ item.total | currency:'BRL':'R$':'1.2-2' }}</span>
                      <span class="text-xs text-gray-400 ml-2">{{ item.percentage }}%</span>
                    </div>
                  </div>
                  <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                    <div class="h-1.5 rounded-full" [style.width.%]="item.percentage" [style.background]="barColor(i)"></div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </main>
    </div>
  `,
})
export class AnalyticsComponent {
  readonly analyticsService = inject(AnalyticsService)
  private readonly authService = inject(AuthService)

  readonly selectedYear  = signal(new Date().getFullYear())
  readonly selectedMonth = signal(new Date().getMonth() + 1)

  readonly yearOptions  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
  readonly monthOptions = MONTH_LABELS.map((label, i) => ({ value: i + 1, label }))

  readonly monthlyData = computed(() => this.analyticsService.monthly() ?? [])
  readonly breakdown   = computed(() => this.analyticsService.breakdown() ?? [])

  readonly annualIncome   = computed(() => this.monthlyData().reduce((s, m) => s + m.income, 0))
  readonly annualExpense  = computed(() => this.monthlyData().reduce((s, m) => s + m.expense, 0))
  readonly annualBalance  = computed(() => this.annualIncome() - this.annualExpense())
  readonly maxMonthly     = computed(() =>
    Math.max(...this.monthlyData().map(m => Math.max(m.income, m.expense)), 1)
  )

  constructor() {
    afterNextRender(() => {
      void this.analyticsService.loadMonthly(this.selectedYear())
      void this.analyticsService.loadBreakdown(this.selectedMonth(), this.selectedYear())
    })
  }

  onYearChange(e: Event) {
    this.selectedYear.set(Number((e.target as HTMLSelectElement).value))
    void this.analyticsService.loadMonthly(this.selectedYear())
    void this.analyticsService.loadBreakdown(this.selectedMonth(), this.selectedYear())
  }

  onMonthChange(e: Event) {
    this.selectedMonth.set(Number((e.target as HTMLSelectElement).value))
    void this.analyticsService.loadBreakdown(this.selectedMonth(), this.selectedYear())
  }

  monthLabel(m: number) { return MONTH_LABELS[m - 1] }
  barColor(i: number)   { return BAR_COLORS[i % BAR_COLORS.length] }
  logout()              { void this.authService.logout() }
}
