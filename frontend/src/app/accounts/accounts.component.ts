import {
  Component, ChangeDetectionStrategy, signal, inject, afterNextRender,
} from '@angular/core'
import { CurrencyPipe, NgClass } from '@angular/common'
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { AccountsService } from '../core/services/accounts.service'
import { AuthService } from '../core/services/auth.service'
import type { AccountFull } from '../core/schemas/api.schemas'

const TYPE_LABELS: Record<string, string> = {
  CHECKING:   'Conta Corrente',
  SAVINGS:    'Poupança',
  CASH:       'Dinheiro',
  CREDIT:     'Crédito',
  INVESTMENT: 'Investimento',
}
const TYPES = Object.entries(TYPE_LABELS)

@Component({
  selector: 'app-accounts',
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
            <a routerLink="/dashboard"
               class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Dashboard
            </a>
            <a routerLink="/accounts"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20">
              Contas
            </a>
            <a routerLink="/categories"
               class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Categorias
            </a>
          </nav>
        </div>
        <button (click)="logout()"
          class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Sair">↩</button>
      </header>

      <main class="max-w-4xl mx-auto px-4 py-8 space-y-6">

        <!-- Título + botão nova conta -->
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold">Contas</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie suas contas financeiras</p>
          </div>
          <button (click)="toggleForm()"
            class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <span class="text-lg leading-none">+</span> Nova Conta
          </button>
        </div>

        <!-- Formulário nova conta -->
        @if (showForm()) {
          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
            <h3 class="font-semibold mb-4">Nova Conta</h3>
            <form [formGroup]="createForm" (ngSubmit)="onSave()" class="grid grid-cols-1 sm:grid-cols-3 gap-4" novalidate>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome <span class="text-red-500">*</span>
                </label>
                <input type="text" formControlName="name" placeholder="Ex: Nubank, Bradesco..."
                  [ngClass]="showErr('name', createForm) ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-700 focus:ring-indigo-500'"
                  class="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                @if (showErr('name', createForm)) {
                  <p class="mt-1 text-xs text-red-500">Nome é obrigatório.</p>
                }
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo <span class="text-red-500">*</span>
                </label>
                <select formControlName="type"
                  [ngClass]="showErr('type', createForm) ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-700 focus:ring-indigo-500'"
                  class="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  <option value="">Selecione...</option>
                  @for (t of types; track t[0]) {
                    <option [value]="t[0]">{{ t[1] }}</option>
                  }
                </select>
                @if (showErr('type', createForm)) {
                  <p class="mt-1 text-xs text-red-500">Selecione um tipo.</p>
                }
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Saldo inicial (R$)</label>
                <input type="number" formControlName="balance" placeholder="0,00" min="0" step="0.01"
                  class="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-indigo-500 text-sm focus:outline-none focus:ring-2 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>

              @if (saveError()) {
                <div class="sm:col-span-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-lg px-3 py-2.5">
                  {{ saveError() }}
                </div>
              }

              <div class="sm:col-span-3 flex justify-end gap-3">
                <button type="button" (click)="toggleForm()"
                  class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancelar
                </button>
                <button type="submit" [disabled]="createForm.invalid || isSaving()"
                  [ngClass]="createForm.valid && !isSaving() ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer' : 'bg-indigo-300 dark:bg-indigo-900 cursor-not-allowed'"
                  class="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors">
                  @if (isSaving()) { Salvando... } @else { Salvar }
                </button>
              </div>
            </form>
          </div>
        }

        <!-- Erro de carregamento -->
        @if (svc.accounts.error()) {
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl px-5 py-4">
            Erro ao carregar contas. Verifique se a API está no ar.
          </div>
        }

        <!-- Skeleton -->
        @if (svc.accounts.isLoading()) {
          <div class="space-y-3">
            @for (_ of [1,2,3]; track $index) {
              <div class="bg-white dark:bg-gray-900 rounded-xl p-5 animate-pulse flex gap-4">
                <div class="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
              </div>
            }
          </div>
        }

        <!-- Lista de contas -->
        @if (!svc.accounts.isLoading()) {
          @if ((svc.accounts.value() ?? []).length === 0) {
            <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm px-6 py-12 text-center text-gray-400 dark:text-gray-600 text-sm">
              Nenhuma conta cadastrada ainda. Clique em "Nova Conta" para começar.
            </div>
          }

          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            @for (acc of svc.accounts.value() ?? []; track acc.id) {
              <div class="px-6 py-4 border-b border-gray-50 dark:border-gray-800/60 last:border-0">

                <!-- Modo visualização -->
                @if (editingId() !== acc.id) {
                  <div class="flex items-center gap-4">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium">{{ acc.name }}</p>
                      <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ typeLabel(acc.type) }}</p>
                    </div>
                    <p class="text-sm font-semibold"
                       [ngClass]="acc.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'">
                      {{ acc.balance | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                    </p>
                    <div class="flex items-center gap-2">
                      <button (click)="startEdit(acc)"
                        class="text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                        Editar
                      </button>
                      @if (confirmDeleteId() === acc.id) {
                        <span class="text-xs text-red-500">Confirmar?</span>
                        <button (click)="onDelete(acc.id)"
                          class="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          Sim
                        </button>
                        <button (click)="confirmDeleteId.set(null)"
                          class="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          Não
                        </button>
                      } @else {
                        <button (click)="confirmDeleteId.set(acc.id)"
                          class="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                          Excluir
                        </button>
                      }
                    </div>
                  </div>
                }

                <!-- Modo edição inline -->
                @if (editingId() === acc.id) {
                  <form [formGroup]="editForm" (ngSubmit)="onUpdate(acc.id)" class="grid grid-cols-1 sm:grid-cols-3 gap-3" novalidate>
                    <input type="text" formControlName="name" placeholder="Nome"
                      class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-indigo-500 text-sm focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                    <select formControlName="type"
                      class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-indigo-500 text-sm focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      @for (t of types; track t[0]) {
                        <option [value]="t[0]">{{ t[1] }}</option>
                      }
                    </select>
                    <input type="number" formControlName="balance" placeholder="Saldo" step="0.01"
                      class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-indigo-500 text-sm focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                    @if (updateError()) {
                      <p class="sm:col-span-3 text-xs text-red-500">{{ updateError() }}</p>
                    }
                    <div class="sm:col-span-3 flex justify-end gap-2">
                      <button type="button" (click)="cancelEdit()"
                        class="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Cancelar
                      </button>
                      <button type="submit" [disabled]="editForm.invalid || isSaving()"
                        [ngClass]="editForm.valid && !isSaving() ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer' : 'bg-indigo-300 dark:bg-indigo-900 cursor-not-allowed'"
                        class="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors">
                        @if (isSaving()) { Salvando... } @else { Salvar }
                      </button>
                    </div>
                  </form>
                }
              </div>
            }
          </div>
        }

      </main>
    </div>
  `,
})
export class AccountsComponent {
  readonly svc  = inject(AccountsService)
  private readonly auth = inject(AuthService)
  private readonly fb   = inject(FormBuilder)

  constructor() {
    afterNextRender(() => this.svc.reload())
  }

  readonly types = TYPES

  readonly showForm        = signal(false)
  readonly editingId       = signal<string | null>(null)
  readonly confirmDeleteId = signal<string | null>(null)
  readonly isSaving        = signal(false)
  readonly saveError       = signal('')
  readonly updateError     = signal('')

  readonly createForm = this.fb.group({
    name:    ['', [Validators.required, Validators.maxLength(100)]],
    type:    ['', Validators.required],
    balance: [0],
  })

  readonly editForm = this.fb.group({
    name:    ['', [Validators.required, Validators.maxLength(100)]],
    type:    ['', Validators.required],
    balance: [0 as number],
  })

  typeLabel(type: string) { return TYPE_LABELS[type] ?? type }

  showErr(field: string, form: typeof this.createForm): boolean {
    const ctrl = form.get(field)
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched))
  }

  toggleForm() {
    this.showForm.update(v => !v)
    this.saveError.set('')
    this.createForm.reset({ name: '', type: '', balance: 0 })
  }

  startEdit(acc: AccountFull) {
    this.editingId.set(acc.id)
    this.updateError.set('')
    this.editForm.setValue({ name: acc.name, type: acc.type, balance: acc.balance })
  }

  cancelEdit() {
    this.editingId.set(null)
    this.editForm.reset()
  }

  async onSave() {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return }
    this.isSaving.set(true)
    this.saveError.set('')
    const { name, type, balance } = this.createForm.value
    try {
      await this.svc.create({ name: name!, type: type!, balance: balance ?? 0 })
      this.svc.reload()
      this.toggleForm()
    } catch (err: any) {
      const msg = err?.error?.message
      this.saveError.set(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao salvar conta.'))
    } finally {
      this.isSaving.set(false)
    }
  }

  async onUpdate(id: string) {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return }
    this.isSaving.set(true)
    this.updateError.set('')
    const { name, type, balance } = this.editForm.value
    try {
      await this.svc.update(id, { name: name!, type: type!, balance: balance ?? 0 })
      this.svc.reload()
      this.cancelEdit()
    } catch (err: any) {
      const msg = err?.error?.message
      this.updateError.set(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao atualizar conta.'))
    } finally {
      this.isSaving.set(false)
    }
  }

  async onDelete(id: string) {
    try {
      await this.svc.remove(id)
      this.svc.reload()
      this.confirmDeleteId.set(null)
    } catch (err: any) {
      const msg = err?.error?.message
      alert(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao excluir conta.'))
    }
  }

  logout() { void this.auth.logout() }
}
