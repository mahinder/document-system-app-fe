// core/guards/role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> | boolean {
    const requiredRoles = route.data['roles'] as string[];
    const requiredPermissions = route.data['permissions'] as string[];

    return this.authService.currentUser$.pipe(
      map(user => {
        if (!user) {
          this.router.navigate(['/auth/login']);
          return false;
        }

        // Check roles
        if (requiredRoles && !requiredRoles.includes(user.role)) {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        // Check permissions
        if (requiredPermissions && !requiredPermissions.every(permission => 
          this.authService.hasPermission(permission))) {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    );
  }
}