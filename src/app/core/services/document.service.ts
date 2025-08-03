// core/services/document.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpProgressEvent } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SecurityService } from './security.service';

export interface Document {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  uploadedAt: Date;
  uploadedBy: string;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  metadata?: any;
}

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  constructor(
    private http: HttpClient,
    private securityService: SecurityService
  ) {}

  uploadDocument(file: File, metadata?: any): Observable<UploadProgress | Document> {
    // Validate file security
    const validation = this.securityService.validateFile(file);
    if (!validation.isValid) {
      return throwError(() => new Error(validation.errors.join(', ')));
    }

    // Create secure FormData
    const formData = new FormData();
    const secureFileName = this.securityService.generateSecureFileName(file.name);
    
    formData.append('file', file, secureFileName);
    formData.append('originalName', file.name);
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    return this.http.post<Document>(`${environment.apiUrl}/documents/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round(100 * event.loaded / (event.total || 1));
          return {
            progress,
            status: 'uploading' as const,
            message: `Uploading... ${progress}%`
          };
        } else if (event.type === HttpEventType.Response) {
          return event.body as Document;
        }
        return { progress: 0, status: 'uploading' as const };
      }),
      catchError(error => {
        return throwError(() => new Error('Upload failed: ' + error.message));
      })
    );
  }

  getDocuments(page = 1, limit = 10, search?: string): Observable<{ documents: Document[], total: number }> {
    let params = `page=${page}&limit=${limit}`;
    if (search) {
      params += `&search=${encodeURIComponent(search)}`;
    }

    return this.http.get<{ documents: Document[], total: number }>(
      `${environment.apiUrl}/documents?${params}`
    );
  }

  getDocument(id: string): Observable<Document> {
    return this.http.get<Document>(`${environment.apiUrl}/documents/${id}`);
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/documents/${id}`);
  }

  downloadDocument(id: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/documents/${id}/download`, {
      responseType: 'blob'
    });
  }

  updateDocument(id: string, updates: Partial<Document>): Observable<Document> {
    return this.http.patch<Document>(`${environment.apiUrl}/documents/${id}`, updates);
  }
}