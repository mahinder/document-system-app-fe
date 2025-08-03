// core/services/analytics.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  metadata?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private eventQueue: AnalyticsEvent[] = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds

  constructor(private http: HttpClient) {
    this.startBatchFlush();
  }

  track(event: Omit<AnalyticsEvent, 'timestamp'>): void {
    const analyticsEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.eventQueue.push(analyticsEvent);

    if (this.eventQueue.length >= this.batchSize) {
      this.flush();
    }
  }

  trackPageView(page: string, userId?: string): void {
    this.track({
      event: 'page_view',
      category: 'navigation',
      action: 'view',
      label: page,
      userId
    });
  }

  trackUserAction(action: string, category: string, label?: string, userId?: string): void {
    this.track({
      event: 'user_action',
      category,
      action,
      label,
      userId
    });
  }

  trackFileUpload(fileName: string, fileSize: number, userId?: string): void {
    this.track({
      event: 'file_upload',
      category: 'documents',
      action: 'upload',
      label: fileName,
      value: fileSize,
      userId
    });
  }

  trackSearchQuery(query: string, resultsCount: number, userId?: string): void {
    this.track({
      event: 'search',
      category: 'qa',
      action: 'query',
      label: query,
      value: resultsCount,
      userId
    });
  }

  private flush(): void {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    this.http.post(`${environment.apiUrl}/analytics/events`, { events })
      .subscribe({
        error: (error) => {
          console.error('Failed to send analytics events:', error);
          // Re-queue failed events
          this.eventQueue.unshift(...events);
        }
      });
  }

  private startBatchFlush(): void {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }
}