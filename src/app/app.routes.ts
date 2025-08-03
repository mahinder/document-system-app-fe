// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { AdminGuard } from './core/guards/admin.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'users',
    loadChildren: () => import('./features/user-management/user-management.module').then(m => m.UserManagementModule),
    canActivate: [AuthGuard, AdminGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'documents',
    loadChildren: () => import('./features/document-management/document-management.module').then(m => m.DocumentManagementModule),
    canActivate: [AuthGuard],
    data: { permissions: ['document_read'] }
  },
  {
    path: 'ingestion',
    loadChildren: () => import('./features/ingestion/ingestion.module').then(m => m.IngestionModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'user'], permissions: ['ingestion_access'] }
  },
  {
    path: 'qa',
    loadChildren: () => import('./features/qa-interface/qa-interface.module').then(m => m.QaInterfaceModule),
    canActivate: [AuthGuard],
    data: { permissions: ['qa_access'] }
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false,
    preloadingStrategy: PreloadAllModules
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }