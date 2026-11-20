import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, Observable, switchMap, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }
      if (err.status !== 401 || req.url.endsWith('/auth/refresh-token') || req.url.endsWith('/auth/login')) {
        return throwError(() => err);
      }
      if (req.headers.has('X-Skip-Refresh')) {
        return throwError(() => err);
      }
      return auth.refreshAccessToken().pipe(
        switchMap((newTokens) => {
          if (!newTokens) {
            auth.clearAll();
            window.location.href = '/login';
            return throwError(() => err);
          }
          const cloned = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${newTokens.accessToken}`),
          });
          return next(cloned);
        }),
        catchError((refreshErr) => {
          return throwError(() => refreshErr ?? err);
        })
      );
    })
  );
};
