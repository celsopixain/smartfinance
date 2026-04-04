import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, throwError } from 'rxjs'
import { AuthService } from '../services/auth.service'

// Flag de módulo para evitar chamadas duplicadas de logout em respostas 401 paralelas
let isLoggingOut = false

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService)
  const router = inject(Router)

  const token = authService.getAccessToken()

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isLoggingOut) {
        isLoggingOut = true
        authService.logout()
        void router.navigate(['/login']).then(() => {
          isLoggingOut = false
        })
      }
      return throwError(() => error)
    }),
  )
}
