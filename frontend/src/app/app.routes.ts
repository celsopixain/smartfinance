import { Routes } from '@angular/router'
import { authGuard } from './core/guards/auth.guard'

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'accounts',
    loadComponent: () =>
      import('./accounts/accounts.component').then(m => m.AccountsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./categories/categories.component').then(m => m.CategoriesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'budgets',
    loadComponent: () =>
      import('./budgets/budgets.component').then(m => m.BudgetsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./analytics/analytics.component').then(m => m.AnalyticsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'recurring',
    loadComponent: () =>
      import('./recurring/recurring.component').then(m => m.RecurringComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
]
