import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  afterNextRender,
} from '@angular/core'
import { DOCUMENT } from '@angular/common'
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common'
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'
import { Router, RouterLink, RouterLinkActive } from '@angular/router'
import { TransactionsService } from '../core/services/transactions.service'
import { AccountsService } from '../core/services/accounts.service'
import { AuthService } from '../core/services/auth.service'
import type { Transaction, Account, Category } from '../core/schemas/api.schemas'

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CHECKING:   'Conta Corrente',
  SAVINGS:    'Poupança',
  CASH:       'Dinheiro',
  CREDIT:     'Crédito',
  INVESTMENT: 'Investimento',
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, NgClass, ReactiveFormsModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly document  = inject(DOCUMENT)
  private readonly router    = inject(Router)
  private readonly fb        = inject(FormBuilder)
  readonly txService         = inject(TransactionsService)
  readonly accountsService   = inject(AccountsService)
  readonly authService       = inject(AuthService)

  constructor() {
    afterNextRender(() => {
      this.txService.reload()
      this.accountsService.reload()
    })
  }

  // ── UI state ────────────────────────────────────────────
  readonly isDarkMode              = signal(false)
  readonly showNewTransactionModal = signal(false)
  readonly isSaving                = signal(false)
  readonly saveError               = signal('')
  readonly accounts                = signal<Account[]>([])
  readonly categories              = signal<Category[]>([])
  readonly txType                  = signal<'INCOME' | 'EXPENSE'>('EXPENSE')

  // Delete modal
  readonly deletingTx   = signal<Transaction | null>(null)
  readonly isDeleting   = signal(false)

  // ── Formulário ──────────────────────────────────────────
  readonly txForm = this.fb.group({
    description: ['',         [Validators.required, Validators.maxLength(255)]],
    amount:      [null as number | null, [Validators.required, Validators.min(0.01)]],
    date:        [todayIso(), Validators.required],
    accountId:   ['',         Validators.required],
    categoryId:  ['',         Validators.required],
  })

  // ── Dashboard computed ──────────────────────────────────
  readonly allTransactions = computed<Transaction[]>(
    () => this.txService.transactions.value()?.data ?? []
  )

  readonly totalIncome = computed(() =>
    this.allTransactions()
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0)
  )

  readonly totalExpense = computed(() =>
    this.allTransactions()
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0)
  )

  // Saldo real = soma dos saldos de todas as contas
  readonly balance = computed(() =>
    (this.accountsService.accounts.value() ?? [])
      .reduce((sum, acc) => sum + Number(acc.balance), 0)
  )

  // Transações ordenadas por data (mais recente primeiro)
  readonly sortedTransactions = computed(() =>
    this.allTransactions()
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  )

  // ── Helpers ─────────────────────────────────────────────
  accountLabel(type: string): string {
    return ACCOUNT_TYPE_LABELS[type] ?? type
  }

  showTxError(field: string): boolean {
    const ctrl = this.txForm.get(field)
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched))
  }

  // ── Actions ─────────────────────────────────────────────
  toggleDarkMode() {
    const html = this.document.documentElement
    this.isDarkMode.update(v => !v)
    html.classList.toggle('dark', this.isDarkMode())
  }

  setTxType(type: 'INCOME' | 'EXPENSE') {
    this.txType.set(type)
  }

  async openNewTransaction() {
    this.txType.set('EXPENSE')
    this.saveError.set('')
    this.txForm.reset({ description: '', amount: null, date: todayIso(), accountId: '', categoryId: '' })
    this.showNewTransactionModal.set(true)

    const [accs, cats] = await Promise.all([
      this.txService.getAccounts(),
      this.txService.getCategories(),
    ])
    this.accounts.set(accs)
    this.categories.set(cats)
  }

  closeModal() {
    this.showNewTransactionModal.set(false)
  }

  async onSave() {
    if (this.txForm.invalid) {
      this.txForm.markAllAsTouched()
      return
    }
    this.isSaving.set(true)
    this.saveError.set('')
    const { description, amount, date, accountId, categoryId } = this.txForm.value
    try {
      await this.txService.create({
        type:        this.txType(),
        description: description!,
        amount:      amount!,
        date:        date!,
        accountId:   accountId!,
        categoryId:  categoryId!,
      })
      this.txService.reload()
      this.accountsService.reload()
      this.closeModal()
    } catch (err: any) {
      const msg = err?.error?.message
      this.saveError.set(
        Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao salvar transação.')
      )
    } finally {
      this.isSaving.set(false)
    }
  }

  openDeleteModal(tx: Transaction) {
    this.deletingTx.set(tx)
  }

  cancelDelete() {
    this.deletingTx.set(null)
  }

  async confirmDelete() {
    const tx = this.deletingTx()
    if (!tx) return
    this.isDeleting.set(true)
    try {
      await this.txService.remove(tx.id)
      this.txService.reload()
      this.accountsService.reload()
      this.deletingTx.set(null)
    } catch {
      // erro silencioso — em produção exibir toast
    } finally {
      this.isDeleting.set(false)
    }
  }

  logout() {
    void this.authService.logout()
  }
}
