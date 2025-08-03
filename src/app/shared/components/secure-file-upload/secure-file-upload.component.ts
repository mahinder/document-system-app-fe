// shared/components/secure-file-upload/secure-file-upload.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  DocumentService,
  UploadProgress,
} from '../../../core/services/document.service';
import { SecurityService } from '../../../core/services/security.service';

@Component({
  selector: 'app-secure-file-upload',
  template: `
    <div class="upload-container">
      <div
        class="upload-area"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        [class.drag-over]="isDragOver"
      >
        <input
          type="file"
          #fileInput
          (change)="onFileSelected($event)"
          [multiple]="allowMultiple"
          [accept]="acceptedTypes"
          hidden
        />

        <div class="upload-content" *ngIf="!isUploading">
          <i class="upload-icon">📁</i>
          <p>
            Drag and drop files here or
            <button type="button" (click)="fileInput.click()">browse</button>
          </p>
          <small
            >Max file size: 10MB. Allowed types: PDF, DOC, DOCX, TXT, CSV, XLS,
            XLSX</small
          >
        </div>

        <div class="upload-progress" *ngIf="isUploading">
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="uploadProgress"></div>
          </div>
          <p>{{ progressMessage }}</p>
        </div>
      </div>

      <div class="upload-errors" *ngIf="errors.length > 0">
        <div class="error" *ngFor="let error of errors">
          {{ error }}
        </div>
      </div>

      <div class="uploaded-files" *ngIf="uploadedFiles.length > 0">
        <h4>Uploaded Files:</h4>
        <div class="file-item" *ngFor="let file of uploadedFiles">
          <span class="file-name">{{ file.originalName }}</span>
          <span class="file-size">{{ file.size | fileSize }}</span>
          <button (click)="removeFile(file.id)" class="remove-btn">×</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./secure-file-upload.component.scss'],
})
export class SecureFileUploadComponent {
  @Input() allowMultiple = false;
  @Input() acceptedTypes = '.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx';
  @Output() fileUploaded = new EventEmitter<any>();
  @Output() uploadError = new EventEmitter<string>();

  isDragOver = false;
  isUploading = false;
  uploadProgress = 0;
  progressMessage = '';
  errors: string[] = [];
  uploadedFiles: any[] = [];

  constructor(
    private documentService: DocumentService,
    private securityService: SecurityService,
  ) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;

    const files = Array.from(event.dataTransfer?.files || []);
    this.handleFiles(files);
  }

  onFileSelected(event: any): void {
    const files = Array.from(event.target.files || []);
    this.handleFiles(files);
  }

  private handleFiles(files: File[]): void {
    this.errors = [];

    if (!this.allowMultiple && files.length > 1) {
      this.errors.push('Only one file is allowed');
      return;
    }

    files.forEach((file) => this.uploadFile(file));
  }

  private uploadFile(file: File): void {
    // Validate file
    const validation = this.securityService.validateFile(file);
    if (!validation.isValid) {
      this.errors.push(...validation.errors);
      return;
    }

    this.isUploading = true;

    this.documentService.uploadDocument(file).subscribe({
      next: (result) => {
        if ('progress' in result) {
          this.uploadProgress = result.progress;
          this.progressMessage = result.message || '';
        } else {
          // Upload complete
          this.uploadedFiles.push(result);
          this.fileUploaded.emit(result);
          this.isUploading = false;
          this.uploadProgress = 0;
        }
      },
      error: (error) => {
        this.errors.push(error.message);
        this.uploadError.emit(error.message);
        this.isUploading = false;
        this.uploadProgress = 0;
      },
    });
  }

  removeFile(fileId: string): void {
    this.uploadedFiles = this.uploadedFiles.filter((f) => f.id !== fileId);
  }
}
