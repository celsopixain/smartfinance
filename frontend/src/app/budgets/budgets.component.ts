import {
  Component, ChangeDetectionStrategy, signal, computed, inject, afterNextRender,
} from '@angular/core'
import { CurrencyPipe, NgClass } from '@angular/common'
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { BudgetService } from '../core/services/budget.service'
import { CategoriesService } from '../core/services/categories.service'
import { AuthService } from '../core/services/auth.service'
import type { Budget } from '../core/schemas/api.schemas'

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

@Component({
  selector: 'app-budgets',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, NgClass, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">

      <!-- Header -->
      <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/dashboard" class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span class="text-white font-bold text-sm">SF</span>
          </a>
          <nav class="flex items-center gap-1">
            <a routerLink="/dashboard"   class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Dashboard</a>
            <a routerLink="/accounts"    class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Contas</a>
            <a routerLink="/categories"  class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Categorias</a>
            <a routerLink="/budgets"     class="px-3 py-1.5 rounded-lg text-sm text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20 font-medium transition-colors">Orçamentos</a>
            <a routerLink="/analytics"   class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Analytics</a>
            <a routerLink="/recurring"   class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Recorrentes</a>
          </nav>
        </div>
        <button (click)="logout()" class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Sair">↩</button>
      </header>

      <main class="max-w-4xl mx-auto px-4 py-8 space-y-6">

        <!-- Título + seletor de mês -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold">Orçamentos</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Defina limites de gastos por categoria</p>
          </div>
          <div class="flex items-center gap-2">
            <select (change)="onMonthChange($event)"
              class="text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              @for (m of monthOptions; track m.value) {
                <option [value]="m.value" [selected]="m.value === selectedMonth()">{{ m.label }}</option>
              }
            </select>
            <select (change)="onYearChange($event)"
              class="text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              @for (y of yearOptions; track y) {
                <option [value]="y" [selected]="y === selectedYear()">{{ y }}</option>
              }
            </select>
            <button (click)="openForm()"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
              + Novo
            </button>
          </div>
        </div>

        <!-- Resumo -->
        @if (budgets().length > 0) {
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm text-center">
              <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Orçado</p>
              <p class="text-xl font-bold text-gray-800 dark:text-gray-100">{{ totalBudget() | currency:'BRL':'R$':'1.2-2' }}</p>
            </div>
            <div class="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm text-center">
              <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Gasto</p>
              <p class="text-xl font-bold text-red-600">{{ totalSpent() | currency:'BRL':'R$':'1.2-2' }}</p>
            </div>
            <div class="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm text-center">
              <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Restante</p>
              <p class="text-xl font-bold" [ngClass]="totalRemaining() >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ totalRemaining() | currency:'BRL':'R$':'1.2-2' }}
              </p>
            </div>
          </div>
        }

        <!-- Lista de orçamentos -->
        @if (budgetService.budgets.isLoading()) {
          <div class="space-y-3">
            @for (n of [1,2,3]; track $index) {
              <div class="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
            }
          </div>
        } @else if (budgets().length === 0) {
          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
            <p class="text-4xl mb-3">🎯</p>
            <p class="text-gray-500 dark:text-gray-400">Nenhum orçamento para este mês.</p>
            <button (click)="openForm()" class="mt-4 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
              Criar primeiro orçamento →
            </button>
          </div>
        } @else {
          <div class="space-y-3">
            @for (b of budgets(); track b.id) {
              <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    @if (b.category.icon) {
                      <span class="text-lg">{{ b.category.icon }}</span>
                    }
                    <span class="font-medium">{{ b.category.name }}</span>
                    @if (b.percentage >= 100) {
                      <span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Excedido</span>
                    } @else if (b.percentage >= 80) {
                      <span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Atenção</span>
                    }
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-sm text-gray-500">
                      {{ b.spent | currency:'BRL':'R$':'1.2-2' }} /
                      {{ b.amount | currency:'BRL':'R$':'1.2-2' }}
                    </span>
                    <button (click)="deleteBudget(b)"
                      class="text-gray-400 hover:text-red-500 transition-colors text-sm">✕</button>
                  </div>
                </div>
                <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                  <div class="h-2 rounded-full transition-all"
                    [style.width.%]="b.percentage"
                    [ngClass]="{
                      'bg-green-500': b.percentage < 80,
                      'bg-amber-500': b.percentage >= 80 && b.percentage < 100,
                      'bg-red-500':   b.percentage >= 100
                    }">
                  </div>
                </div>
                <p class="text-xs text-gray-400 mt-1.5 text-right">{{ b.percentage }}% utilizado</p>
              </div>
            }
          </div>
        }
      </main>

      <!-- Modal novo orçamento -->
      @if (showForm()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeForm()">
          <div class="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-semibold mb-5">Novo Orçamento</h3>

            <form [formGroup]="form" (ngSubmit)="onSave()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                <select formControlName="categoryId"
                  class="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                  <option value="">Selecione uma categoria</option>
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.icon ? cat.icon + ' ' : '' }}{{ cat.name }}</option>
                  }
                </select>
                @if (showError('categoryId')) {
                  <p class="text-xs text-red-500 mt-1">Selecione uma categoria</p>
                }
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Limite (R$)</label>
                <input type="number" formControlName="amount" min="0.01" step="0.01" placeholder="0,00"
                  class="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                @if (showError('amount')) {
                  <p class="text-xs text-red-500 mt-1">Informe um valor válido</p>
                }
              </div>

              @if (saveError()) {
                <p class="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{{ saveError() }}</p>
              }

              <div class="flex gap-3 pt-2">
                <button type="button" (click)="closeForm()"
                  class="flex-1 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancelar
                </button>
                <button type="submit" [disabled]="isSaving()"
                  class="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
                  {{ isSaving() ? 'Salvando...' : 'Salvar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class BudgetsComponent {
  readonly budgetService     = inject(BudgetService)
  readonly categoriesService = inject(CategoriesService)
  private readonly authService  = inject(AuthService)
  private readonly fb           = inject(FormBuilder)

  readonly selectedMonth = signal(new Date().getMonth() + 1)
  readonly selectedYear  = signal(new Date().getFullYear())
  readonly showForm      = signal(false)
  readonly isSaving      = signal(false)
  readonly saveError     = signal('')

  readonly monthOptions = MONTHS.map((label, i) => ({ value: i + 1, label }))
  readonly yearOptions  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  readonly form = this.fb.group({
    categoryId: ['', Validators.required],
    amount:     [null as number | null, [Validators.required, Validators.min(0.01)]],
  })

  readonly budgets   = computed(() => this.budgetService.budgets.value() ?? [])
  readonly categories = computed(() => this.categoriesService.categories.value() ?? [])

  readonly totalBudget    = computed(() => this.budgets().reduce((s, b) => s + b.amount, 0))
  readonly totalSpent     = computed(() => this.budgets().reduce((s, b) => s + b.spent, 0))
  readonly totalRemaining = computed(() => this.totalBudget() - this.totalSpent())

  constructor() {
    afterNextRender(() => {
      this.load()
      this.categoriesService.reload()
    })
  }

  private load() {
    void this.budgetService.load(this.selectedMonth(), this.selectedYear())
  }

  onMonthChange(e: Event) {
    this.selectedMonth.set(Number((e.target as HTMLSelectElement).value))
    this.load()
  }

  onYearChange(e: Event) {
    this.selectedYear.set(Number((e.target as HTMLSelectElement).value))
    this.load()
  }

  openForm() { this.showForm.set(true); this.saveError.set(''); this.form.reset() }
  closeForm() { this.showForm.set(false) }

  showError(field: string) {
    const c = this.form.get(field)
    return !!(c?.invalid && (c.dirty || c.touched))
  }

  async onSave() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return }
    this.isSaving.set(true)
    this.saveError.set('')
    const { categoryId, amount } = this.form.value
    try {
      await this.budgetService.upsert({
        categoryId: categoryId!,
        amount: amount!,
        month: this.selectedMonth(),
        year:  this.selectedYear(),
      })
      this.load()
      this.closeForm()
    } catch (err: any) {
      const msg = err?.error?.message
      this.saveError.set(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao salvar.'))
    } finally {
      this.isSaving.set(false)
    }
  }

  async deleteBudget(b: Budget) {
    await this.budgetService.remove(b.id)
    this.load()
  }

  logout() { void this.authService.logout() }
}
