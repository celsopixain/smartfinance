import {
  Component, ChangeDetectionStrategy, signal, computed, inject, afterNextRender,
} from '@angular/core'
import { CurrencyPipe, NgClass } from '@angular/common'
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { RecurringTransactionsService } from '../core/services/recurring-transactions.service'
import { CategoriesService } from '../core/services/categories.service'
import { AccountsService } from '../core/services/accounts.service'
import { AuthService } from '../core/services/auth.service'
import type { RecurringTransaction } from '../core/schemas/api.schemas'

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

@Component({
  selector: 'app-recurring',
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
            <a routerLink="/dashboard"  class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Dashboard</a>
            <a routerLink="/accounts"   class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Contas</a>
            <a routerLink="/categories" class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Categorias</a>
            <a routerLink="/budgets"    class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Orçamentos</a>
            <a routerLink="/analytics"  class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Analytics</a>
            <a routerLink="/recurring"  class="px-3 py-1.5 rounded-lg text-sm text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20 font-medium transition-colors">Recorrentes</a>
          </nav>
        </div>
        <button (click)="logout()" class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Sair">↩</button>
      </header>

      <main class="max-w-4xl mx-auto px-4 py-8 space-y-6">

        <!-- Título + ações -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold">Transações Recorrentes</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Automatize lançamentos mensais fixos</p>
          </div>
          <div class="flex items-center gap-2">
            <select (change)="onGenMonthChange($event)"
              class="text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              @for (m of monthOptions; track m.value) {
                <option [value]="m.value" [selected]="m.value === genMonth()">{{ m.label }}</option>
              }
            </select>
            <select (change)="onGenYearChange($event)"
              class="text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              @for (y of yearOptions; track y) {
                <option [value]="y" [selected]="y === genYear()">{{ y }}</option>
              }
            </select>
            <button (click)="generate()" [disabled]="isGenerating()"
              class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              {{ isGenerating() ? 'Gerando...' : '⚡ Gerar' }}
            </button>
            <button (click)="openForm()"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
              + Nova
            </button>
          </div>
        </div>

        @if (generateMsg()) {
          <div class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl px-4 py-3 text-sm">
            {{ generateMsg() }}
          </div>
        }

        <!-- Lista -->
        @if (recurringService.recurring.isLoading()) {
          <div class="space-y-3">
            @for (n of [1,2,3]; track $index) {
              <div class="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
            }
          </div>
        } @else if (items().length === 0) {
          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
            <p class="text-4xl mb-3">🔄</p>
            <p class="text-gray-500 dark:text-gray-400">Nenhuma transação recorrente cadastrada.</p>
            <button (click)="openForm()" class="mt-4 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
              Criar primeira recorrente →
            </button>
          </div>
        } @else {
          <div class="space-y-2">
            @for (item of items(); track item.id) {
              <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-5 py-4 shadow-sm flex items-center justify-between gap-4"
                [ngClass]="{ 'opacity-50': !item.isActive }">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    [ngClass]="item.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'">
                    {{ item.type === 'INCOME' ? '↑' : '↓' }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-medium text-sm truncate">{{ item.description }}</p>
                    <p class="text-xs text-gray-400">
                      Dia {{ item.dayOfMonth }} · {{ item.category.name }} · {{ item.account.name }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-3 flex-shrink-0">
                  <span class="font-semibold text-sm" [ngClass]="item.type === 'INCOME' ? 'text-green-600' : 'text-red-600'">
                    {{ item.amount | currency:'BRL':'R$':'1.2-2' }}
                  </span>
                  <button (click)="toggleItem(item)"
                    class="text-xs px-2 py-1 rounded-full border transition-colors"
                    [ngClass]="item.isActive
                      ? 'border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                      : 'border-gray-300 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'">
                    {{ item.isActive ? 'Ativo' : 'Inativo' }}
                  </button>
                  <button (click)="deleteItem(item)" class="text-gray-400 hover:text-red-500 transition-colors text-sm">✕</button>
                </div>
              </div>
            }
          </div>
        }
      </main>

      <!-- Modal novo -->
      @if (showForm()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeForm()">
          <div class="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-semibold mb-5">Nova Transação Recorrente</h3>

            <form [formGroup]="form" (ngSubmit)="onSave()" class="space-y-4">
              <!-- Tipo -->
              <div class="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <button type="button" (click)="form.patchValue({ type: 'EXPENSE' })"
                  class="flex-1 py-2 text-sm font-medium transition-colors"
                  [ngClass]="form.value.type === 'EXPENSE' ? 'bg-red-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50'">
                  Despesa
                </button>
                <button type="button" (click)="form.patchValue({ type: 'INCOME' })"
                  class="flex-1 py-2 text-sm font-medium transition-colors"
                  [ngClass]="form.value.type === 'INCOME' ? 'bg-green-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50'">
                  Receita
                </button>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                <input type="text" formControlName="description" placeholder="Ex: Aluguel, Netflix..."
                  class="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$)</label>
                  <input type="number" formControlName="amount" min="0.01" step="0.01"
                    class="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dia do mês</label>
                  <input type="number" formControlName="dayOfMonth" min="1" max="28"
                    class="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conta</label>
                <select formControlName="accountId"
                  class="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                  <option value="">Selecione uma conta</option>
                  @for (acc of accounts(); track acc.id) {
                    <option [value]="acc.id">{{ acc.name }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                <select formControlName="categoryId"
                  class="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                  <option value="">Selecione uma categoria</option>
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.icon ? cat.icon + ' ' : '' }}{{ cat.name }}</option>
                  }
                </select>
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
export class RecurringComponent {
  readonly recurringService  = inject(RecurringTransactionsService)
  readonly categoriesService = inject(CategoriesService)
  readonly accountsService   = inject(AccountsService)
  private readonly authService = inject(AuthService)
  private readonly fb          = inject(FormBuilder)

  readonly showForm    = signal(false)
  readonly isSaving    = signal(false)
  readonly isGenerating = signal(false)
  readonly saveError   = signal('')
  readonly generateMsg = signal('')

  readonly genMonth = signal(new Date().getMonth() + 1)
  readonly genYear  = signal(new Date().getFullYear())

  onGenMonthChange(e: Event) { this.genMonth.set(Number((e.target as HTMLSelectElement).value)) }
  onGenYearChange(e: Event)  { this.genYear.set(Number((e.target as HTMLSelectElement).value)) }

  readonly monthOptions = MONTHS.map((label, i) => ({ value: i + 1, label }))
  readonly yearOptions  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  readonly form = this.fb.group({
    type:        ['EXPENSE'],
    description: ['', [Validators.required, Validators.maxLength(255)]],
    amount:      [null as number | null, [Validators.required, Validators.min(0.01)]],
    dayOfMonth:  [1, [Validators.required, Validators.min(1), Validators.max(28)]],
    accountId:   ['', Validators.required],
    categoryId:  ['', Validators.required],
  })

  readonly items      = computed(() => this.recurringService.recurring.value() ?? [])
  readonly categories = computed(() => this.categoriesService.categories.value() ?? [])
  readonly accounts   = computed(() => this.accountsService.accounts.value() ?? [])

  constructor() {
    afterNextRender(() => {
      this.recurringService.reload()
      this.categoriesService.reload()
      this.accountsService.reload()
    })
  }

  openForm() { this.showForm.set(true); this.saveError.set(''); this.form.reset({ type: 'EXPENSE', dayOfMonth: 1 }) }
  closeForm() { this.showForm.set(false) }

  async onSave() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return }
    this.isSaving.set(true)
    this.saveError.set('')
    const v = this.form.value
    try {
      await this.recurringService.create({
        type:        v.type as 'INCOME' | 'EXPENSE',
        description: v.description!,
        amount:      v.amount!,
        dayOfMonth:  v.dayOfMonth!,
        accountId:   v.accountId!,
        categoryId:  v.categoryId!,
      })
      this.recurringService.reload()
      this.closeForm()
    } catch (err: any) {
      const msg = err?.error?.message
      this.saveError.set(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao salvar.'))
    } finally {
      this.isSaving.set(false)
    }
  }

  async toggleItem(item: RecurringTransaction) {
    await this.recurringService.toggle(item.id)
    this.recurringService.reload()
  }

  async deleteItem(item: RecurringTransaction) {
    await this.recurringService.remove(item.id)
    this.recurringService.reload()
  }

  async generate() {
    this.isGenerating.set(true)
    this.generateMsg.set('')
    try {
      const result = await this.recurringService.generateForMonth(this.genMonth(), this.genYear())
      const mes = MONTHS[this.genMonth() - 1]
      this.generateMsg.set(
        result.created > 0
          ? `✅ ${result.created} transação(ões) gerada(s) para ${mes}/${this.genYear()}.`
          : `ℹ️ Nenhuma nova transação para gerar em ${mes}/${this.genYear()} (já geradas ou sem recorrentes ativas).`
      )
    } catch {
      this.generateMsg.set('Erro ao gerar transações.')
    } finally {
      this.isGenerating.set(false)
    }
  }

  logout() { void this.authService.logout() }
}
