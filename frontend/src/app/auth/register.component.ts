import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
} from '@angular/core'
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { NgClass } from '@angular/common'
import { AuthService } from '../core/services/auth.service'

// ── Validator de senha avançada ──────────────────────────
function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const v: string = control.value ?? ''
  const errors: Record<string, boolean> = {}
  if (v.length < 8)              errors['minLength']  = true
  if (!/[A-Z]/.test(v))         errors['uppercase']  = true
  if (!/[a-z]/.test(v))         errors['lowercase']  = true
  if (!/[0-9]/.test(v))         errors['number']     = true
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v)) errors['special'] = true
  return Object.keys(errors).length ? errors : null
}

// ── Validator de email ───────────────────────────────────
function emailFormatValidator(control: AbstractControl): ValidationErrors | null {
  const v: string = control.value ?? ''
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
  return v && !valid ? { emailFormat: true } : null
}

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 w-full max-w-sm p-8 space-y-6">

        <!-- Logo -->
        <div class="text-center space-y-2">
          <div class="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto">
            <span class="text-white font-bold text-lg">SF</span>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Criar conta</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Comece a controlar suas finanças</p>
        </div>

        <!-- Feedback global -->
        @if (errorMsg()) {
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3">
            {{ errorMsg() }}
          </div>
        }
        @if (successMsg()) {
          <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm rounded-lg px-4 py-3">
            {{ successMsg() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5" novalidate>

          <!-- Nome -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              formControlName="name"
              placeholder="Seu nome completo"
              [ngClass]="fieldClass('name')"
              class="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />

            @if (showError('name')) {
              <p class="mt-1 text-xs text-red-500">
                @if (form.get('name')?.errors?.['required']) { Nome é obrigatório. }
                @else if (form.get('name')?.errors?.['minlength']) { Mínimo de 5 caracteres. }
                @else if (form.get('name')?.errors?.['maxlength']) { Máximo de 100 caracteres. }
              </p>
            }
          </div>

          <!-- E-mail -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              E-mail <span class="text-red-500">*</span>
            </label>
            <input
              type="email"
              formControlName="email"
              placeholder="seu@email.com"
              [ngClass]="fieldClass('email')"
              class="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />

            @if (showError('email')) {
              <p class="mt-1 text-xs text-red-500">
                @if (form.get('email')?.errors?.['required']) { E-mail é obrigatório. }
                @else if (form.get('email')?.errors?.['emailFormat']) { Digite um e-mail válido. }
              </p>
            }
          </div>

          <!-- Senha -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Senha <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                placeholder="Crie uma senha forte"
                [ngClass]="fieldClass('password')"
                class="w-full px-3 py-2.5 pr-16 rounded-lg border text-sm focus:outline-none focus:ring-2 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              <!-- Mostrar/ocultar -->
              <button
                type="button"
                (click)="showPassword.update(v => !v)"
                class="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm"
                title="{{ showPassword() ? 'Ocultar senha' : 'Mostrar senha' }}">
                {{ showPassword() ? '🙈' : '👁' }}
              </button>
              <!-- Separador -->
              <span class="absolute right-7 top-1/2 -translate-y-1/2 text-gray-200 dark:text-gray-700 select-none">|</span>
              <!-- Gerar senha -->
              <button
                type="button"
                (click)="generatePassword()"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 text-base transition-colors"
                title="Gerar senha forte">
                ⚡
              </button>
            </div>

            <!-- Senha gerada: botão copiar -->
            @if (generatedPassword()) {
              <div class="mt-2 flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2">
                <span class="flex-1 text-xs font-mono text-indigo-700 dark:text-indigo-300 truncate select-all">
                  {{ generatedPassword() }}
                </span>
                <button
                  type="button"
                  (click)="copyPassword()"
                  class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 flex-shrink-0 transition-colors">
                  {{ copied() ? '✓ Copiado' : 'Copiar' }}
                </button>
              </div>
            }

            <!-- Checklist de requisitos -->
            @if (form.get('password')?.dirty || form.get('password')?.touched) {
              <ul class="mt-2 space-y-1">
                @for (rule of passwordRules(); track rule.key) {
                  <li class="flex items-center gap-2 text-xs"
                      [ngClass]="rule.met ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'">
                    <span class="font-bold">{{ rule.met ? '✓' : '○' }}</span>
                    {{ rule.label }}
                  </li>
                }
              </ul>
            }
          </div>

          <!-- Barra de força da senha -->
          @if (form.get('password')?.value) {
            <div class="space-y-1">
              <div class="flex gap-1 h-1.5">
                @for (i of [0,1,2,3]; track i) {
                  <div class="flex-1 rounded-full transition-all duration-300"
                    [ngClass]="{
                      'bg-red-400':    passwordStrength() === 1 && i === 0,
                      'bg-orange-400': passwordStrength() === 2 && i <= 1,
                      'bg-yellow-400': passwordStrength() === 3 && i <= 2,
                      'bg-green-500':  passwordStrength() === 4 && i <= 3,
                      'bg-gray-200 dark:bg-gray-700': i >= passwordStrength()
                    }">
                  </div>
                }
              </div>
              <p class="text-xs"
                [ngClass]="{
                  'text-red-500':    passwordStrength() === 1,
                  'text-orange-500': passwordStrength() === 2,
                  'text-yellow-500': passwordStrength() === 3,
                  'text-green-600 dark:text-green-400':  passwordStrength() === 4
                }">
                {{ passwordStrengthLabel() }}
              </p>
            </div>
          }

          <!-- Botão — só habilitado se o form for válido -->
          <button
            type="submit"
            [disabled]="form.invalid || isLoading()"
            class="w-full font-medium py-2.5 rounded-lg transition-colors text-sm text-white"
            [ngClass]="form.valid && !isLoading()
              ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
              : 'bg-indigo-300 dark:bg-indigo-900 cursor-not-allowed'">
            @if (isLoading()) { Criando conta... } @else { Criar conta }
          </button>

        </form>

        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
          Já tem conta?
          <a routerLink="/login" class="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Entrar</a>
        </p>

      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)
  private readonly fb = inject(FormBuilder)

  readonly isLoading        = signal(false)
  readonly errorMsg         = signal('')
  readonly successMsg       = signal('')
  readonly showPassword     = signal(false)
  readonly generatedPassword = signal('')
  readonly copied           = signal(false)

  readonly form = this.fb.group({
    name:     ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
    email:    ['', [Validators.required, emailFormatValidator]],
    password: ['', [Validators.required, passwordStrengthValidator]],
  })

  // Regras individuais da senha para o checklist
  readonly passwordRules = computed(() => {
    const v: string = this.form.get('password')?.value ?? ''
    return [
      { key: 'minLength',  label: 'Mínimo 8 caracteres',       met: v.length >= 8 },
      { key: 'uppercase',  label: 'Letra maiúscula (A-Z)',      met: /[A-Z]/.test(v) },
      { key: 'lowercase',  label: 'Letra minúscula (a-z)',      met: /[a-z]/.test(v) },
      { key: 'number',     label: 'Número (0-9)',               met: /[0-9]/.test(v) },
      { key: 'special',    label: 'Caractere especial (!@#$…)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v) },
    ]
  })

  readonly passwordStrength = computed(() => {
    const metCount = this.passwordRules().filter(r => r.met).length
    if (metCount <= 1) return 1
    if (metCount === 2) return 1
    if (metCount === 3) return 2
    if (metCount === 4) return 3
    return 4
  })

  readonly passwordStrengthLabel = computed(() => {
    const labels = ['', 'Fraca', 'Regular', 'Boa', 'Forte']
    return labels[this.passwordStrength()]
  })

  showError(field: string): boolean {
    const ctrl = this.form.get(field)
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched))
  }

  fieldClass(field: string): Record<string, boolean> {
    const ctrl = this.form.get(field)
    const invalid = !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched))
    const valid   = !!(ctrl?.valid  && (ctrl.dirty || ctrl.touched))
    return {
      'border-red-400 focus:ring-red-400':       invalid,
      'border-green-400 focus:ring-green-400':   valid,
      'border-gray-300 dark:border-gray-700 focus:ring-indigo-500': !invalid && !valid,
    }
  }

  generatePassword() {
    const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lower   = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const special = '!@#$%^&*()_+-=[]{};<>?'
    const all     = upper + lower + numbers + special

    // Garante ao menos 1 de cada grupo
    const mandatory = [
      upper  [Math.floor(Math.random() * upper.length)],
      lower  [Math.floor(Math.random() * lower.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      special[Math.floor(Math.random() * special.length)],
    ]

    const remaining = Array.from({ length: 8 }, () =>
      all[Math.floor(Math.random() * all.length)]
    )

    // Embaralha tudo
    const pwd = [...mandatory, ...remaining]
      .sort(() => Math.random() - 0.5)
      .join('')

    this.generatedPassword.set(pwd)
    this.showPassword.set(true)
    this.copied.set(false)
    this.form.get('password')!.setValue(pwd)
    this.form.get('password')!.markAsDirty()
  }

  async copyPassword() {
    await navigator.clipboard.writeText(this.generatedPassword())
    this.copied.set(true)
    setTimeout(() => this.copied.set(false), 2000)
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }
    this.isLoading.set(true)
    this.errorMsg.set('')
    const { name, email, password } = this.form.value
    try {
      await this.auth.register(name!, email!, password!)
      this.successMsg.set('Conta criada! Redirecionando para o login...')
      setTimeout(() => void this.router.navigate(['/login']), 1500)
    } catch (err: any) {
      this.errorMsg.set(err?.error?.message ?? 'Erro ao criar conta. Tente novamente.')
    } finally {
      this.isLoading.set(false)
    }
  }
}
