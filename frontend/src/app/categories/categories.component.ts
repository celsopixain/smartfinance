import {
  Component, ChangeDetectionStrategy, signal, computed, inject, afterNextRender,
} from '@angular/core'
import { NgClass, NgStyle } from '@angular/common'
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { CategoriesService } from '../core/services/categories.service'
import { AuthService } from '../core/services/auth.service'
import type { CategoryFull } from '../core/schemas/api.schemas'

@Component({
  selector: 'app-categories',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, NgStyle, ReactiveFormsModule, RouterLink],
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
               class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Contas
            </a>
            <a routerLink="/categories"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20">
              Categorias
            </a>
            <a routerLink="/budgets"
               class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Orçamentos
            </a>
            <a routerLink="/analytics"
               class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Analytics
            </a>
            <a routerLink="/recurring"
               class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Recorrentes
            </a>
          </nav>
        </div>
        <button (click)="logout()"
          class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Sair">↩</button>
      </header>

      <main class="max-w-4xl mx-auto px-4 py-8 space-y-6">

        <!-- Título -->
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold">Categorias</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie as categorias de transações</p>
          </div>
          <button (click)="toggleForm()"
            class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <span class="text-lg leading-none">+</span> Nova Categoria
          </button>
        </div>

        <!-- Formulário nova categoria -->
        @if (showForm()) {
          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
            <h3 class="font-semibold mb-4">Nova Categoria</h3>
            <form [formGroup]="createForm" (ngSubmit)="onSave()" class="grid grid-cols-1 sm:grid-cols-2 gap-4" novalidate>

              <!-- Nome -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome <span class="text-red-500">*</span>
                </label>
                <input type="text" formControlName="name" placeholder="Ex: Alimentação, Salário..."
                  [ngClass]="showErr('name', createForm) ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-700 focus:ring-indigo-500'"
                  class="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                @if (showErr('name', createForm)) {
                  <p class="mt-1 text-xs text-red-500">Nome é obrigatório.</p>
                }
              </div>

              <!-- Ícone -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ícone (emoji)</label>
                <input type="text" formControlName="icon" placeholder="🍔 🚗 🏠..."
                  class="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-indigo-500 text-sm focus:outline-none focus:ring-2 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>

              <!-- Cor -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor</label>
                <div class="flex items-center gap-3">
                  <input type="color" formControlName="color"
                    class="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer bg-white dark:bg-gray-800 p-0.5" />
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{ createForm.get('color')?.value }}</span>
                </div>
              </div>

              <!-- Categoria pai -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subcategoria de</label>
                <select formControlName="parentId"
                  class="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-indigo-500 text-sm focus:outline-none focus:ring-2 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  <option value="">Nenhuma (categoria raiz)</option>
                  @for (cat of rootCategories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.icon ? cat.icon + ' ' : '' }}{{ cat.name }}</option>
                  }
                </select>
              </div>

              @if (saveError()) {
                <div class="sm:col-span-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-lg px-3 py-2.5">
                  {{ saveError() }}
                </div>
              }

              <div class="sm:col-span-2 flex justify-end gap-3">
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
        @if (svc.categories.error()) {
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl px-5 py-4">
            Erro ao carregar categorias. Verifique se a API está no ar.
          </div>
        }

        <!-- Skeleton -->
        @if (svc.categories.isLoading()) {
          <div class="space-y-3">
            @for (_ of [1,2,3]; track $index) {
              <div class="bg-white dark:bg-gray-900 rounded-xl p-5 animate-pulse flex gap-4">
                <div class="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div class="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
              </div>
            }
          </div>
        }

        <!-- Lista de categorias -->
        @if (!svc.categories.isLoading()) {
          @if ((svc.categories.value() ?? []).length === 0) {
            <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm px-6 py-12 text-center text-gray-400 dark:text-gray-600 text-sm">
              Nenhuma categoria cadastrada ainda. Clique em "Nova Categoria" para começar.
            </div>
          }

          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            @for (cat of svc.categories.value() ?? []; track cat.id) {
              <div class="px-6 py-4 border-b border-gray-50 dark:border-gray-800/60 last:border-0"
                   [ngClass]="cat.parentId ? 'pl-12' : ''">

                <!-- Modo visualização -->
                @if (editingId() !== cat.id) {
                  <div class="flex items-center gap-3">
                    <!-- Cor + ícone -->
                    <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                         [ngStyle]="{ background: cat.color ?? '#e5e7eb' }">
                      {{ cat.icon ?? '📁' }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium">{{ cat.name }}</p>
                      @if (cat.parentId) {
                        <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          Subcategoria de: {{ parentName(cat.parentId) }}
                        </p>
                      }
                    </div>
                    <div class="flex items-center gap-2">
                      <button (click)="startEdit(cat)"
                        class="text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                        Editar
                      </button>
                      @if (confirmDeleteId() === cat.id) {
                        <span class="text-xs text-red-500">Confirmar?</span>
                        <button (click)="onDelete(cat.id)"
                          class="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          Sim
                        </button>
                        <button (click)="confirmDeleteId.set(null)"
                          class="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          Não
                        </button>
                      } @else {
                        <button (click)="confirmDeleteId.set(cat.id)"
                          class="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                          Excluir
                        </button>
                      }
                    </div>
                  </div>
                }

                <!-- Modo edição inline -->
                @if (editingId() === cat.id) {
                  <form [formGroup]="editForm" (ngSubmit)="onUpdate(cat.id)" class="grid grid-cols-1 sm:grid-cols-2 gap-3" novalidate>
                    <input type="text" formControlName="name" placeholder="Nome"
                      class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-indigo-500 text-sm focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                    <input type="text" formControlName="icon" placeholder="Ícone (emoji)"
                      class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-indigo-500 text-sm focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                    <div class="flex items-center gap-2">
                      <input type="color" formControlName="color"
                        class="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer p-0.5" />
                      <span class="text-sm text-gray-500 dark:text-gray-400">Cor</span>
                    </div>
                    <select formControlName="parentId"
                      class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-indigo-500 text-sm focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option value="">Nenhuma (raiz)</option>
                      @for (c of editableParents(); track c.id) {
                        <option [value]="c.id">{{ c.icon ? c.icon + ' ' : '' }}{{ c.name }}</option>
                      }
                    </select>
                    @if (updateError()) {
                      <p class="sm:col-span-2 text-xs text-red-500">{{ updateError() }}</p>
                    }
                    <div class="sm:col-span-2 flex justify-end gap-2">
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
export class CategoriesComponent {
  readonly svc  = inject(CategoriesService)
  private readonly auth = inject(AuthService)
  private readonly fb   = inject(FormBuilder)

  constructor() {
    afterNextRender(() => this.svc.reload())
  }

  readonly showForm        = signal(false)
  readonly editingId       = signal<string | null>(null)
  readonly confirmDeleteId = signal<string | null>(null)
  readonly isSaving        = signal(false)
  readonly saveError       = signal('')
  readonly updateError     = signal('')

  // Categorias raiz disponíveis para seleção como pai
  readonly rootCategories = computed(() =>
    (this.svc.categories.value() ?? []).filter(c => !c.parentId)
  )

  // Categorias disponíveis como pai ao editar (exclui a própria categoria)
  readonly editableParents = computed(() => {
    const id = this.editingId()
    return (this.svc.categories.value() ?? []).filter(c => !c.parentId && c.id !== id)
  })

  readonly createForm = this.fb.group({
    name:     ['', [Validators.required, Validators.maxLength(100)]],
    icon:     [''],
    color:    ['#6366f1'],
    parentId: [''],
  })

  readonly editForm = this.fb.group({
    name:     ['', [Validators.required, Validators.maxLength(100)]],
    icon:     [''],
    color:    ['#6366f1'],
    parentId: [''],
  })

  parentName(parentId: string): string {
    const cats = this.svc.categories.value() ?? []
    return cats.find(c => c.id === parentId)?.name ?? parentId
  }

  showErr(field: string, form: typeof this.createForm): boolean {
    const ctrl = form.get(field)
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched))
  }

  toggleForm() {
    this.showForm.update(v => !v)
    this.saveError.set('')
    this.createForm.reset({ name: '', icon: '', color: '#6366f1', parentId: '' })
  }

  startEdit(cat: CategoryFull) {
    this.editingId.set(cat.id)
    this.updateError.set('')
    this.editForm.setValue({
      name:     cat.name,
      icon:     cat.icon ?? '',
      color:    cat.color ?? '#6366f1',
      parentId: cat.parentId ?? '',
    })
  }

  cancelEdit() {
    this.editingId.set(null)
    this.editForm.reset()
  }

  private buildPayload(v: typeof this.createForm.value) {
    return {
      name:     v.name!,
      icon:     v.icon || undefined,
      color:    v.color || undefined,
      parentId: v.parentId || undefined,
    }
  }

  async onSave() {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return }
    this.isSaving.set(true)
    this.saveError.set('')
    try {
      await this.svc.create(this.buildPayload(this.createForm.value))
      this.svc.reload()
      this.toggleForm()
    } catch (err: any) {
      const msg = err?.error?.message
      this.saveError.set(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao salvar categoria.'))
    } finally {
      this.isSaving.set(false)
    }
  }

  async onUpdate(id: string) {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return }
    this.isSaving.set(true)
    this.updateError.set('')
    try {
      await this.svc.update(id, this.buildPayload(this.editForm.value))
      this.svc.reload()
      this.cancelEdit()
    } catch (err: any) {
      const msg = err?.error?.message
      this.updateError.set(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao atualizar categoria.'))
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
      alert(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao excluir categoria.'))
    }
  }

  logout() { void this.auth.logout() }
}
