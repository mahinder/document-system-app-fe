// features/document-management/document-management.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        loadComponent: () => import('./pages/document-list/document-list.component').then(c => c.DocumentListComponent)
      },
      {
        path: 'upload',
        loadComponent: () => import('./pages/document-upload/document-upload.component').then(c => c.DocumentUploadComponent)
      }
    ])
  ]
})
export class DocumentManagementModule { }