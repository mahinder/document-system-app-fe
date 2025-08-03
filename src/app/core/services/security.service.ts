// core/services/security.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private readonly ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly MALICIOUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js'];

  validateFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size exceeds maximum limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Check file type
    if (!this.ALLOWED_FILE_TYPES.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasMaliciousExtension = this.MALICIOUS_EXTENSIONS.some(ext => fileName.endsWith(ext));
    
    if (hasMaliciousExtension) {
      errors.push('File extension is not allowed for security reasons');
    }

    // Check for double extensions
    if (this.hasDoubleExtension(fileName)) {
      errors.push('Files with double extensions are not allowed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  sanitizeFileName(fileName: string): string {
    // Remove or replace dangerous characters
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.+/g, '.')
      .replace(/^\./, '')
      .slice(0, 255);
  }

  generateSecureFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    
    return `${timestamp}_${random}.${extension}`;
  }

  private hasDoubleExtension(fileName: string): boolean {
    const parts = fileName.split('.');
    return parts.length > 2;
  }
}