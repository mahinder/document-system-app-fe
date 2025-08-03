// core/services/performance.service.ts
import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PerformanceNavigationTiming } from 'perf_hooks';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  page?: string;
  userId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private currentPage = '';

  constructor(private router: Router) {
    this.initializePerformanceTracking();
    this.trackNavigationPerformance();
  }

  trackCustomMetric(name: string, value: number, userId?: string): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      page: this.currentPage,
      userId
    };

    this.metrics.push(metric);
    this.sendMetricsIfBatchReady();
  }

  trackComponentLoadTime(componentName: string, startTime: number, userId?: string): void {
    const loadTime = performance.now() - startTime;
    this.trackCustomMetric(`component_load_${componentName}`, loadTime, userId);
  }

  trackApiResponseTime(endpoint: string, responseTime: number, userId?: string): void {
    this.trackCustomMetric(`api_response_${endpoint}`, responseTime, userId);
  }

  getPageLoadMetrics(): PerformanceNavigationTiming | null {
    return performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  }

  private initializePerformanceTracking(): void {
    // Track Core Web Vitals
    this.trackCoreWebVitals();
    
    // Track custom performance metrics
    this.trackResourceLoadTimes();
  }

  private trackNavigationPerformance(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentPage = event.url;
        
        // Track page navigation performance
        setTimeout(() => {
          const navTiming = this.getPageLoadMetrics();
          if (navTiming) {
            this.trackCustomMetric('page_load_time', navTiming.loadEventEnd - navTiming.navigationStart);
            this.trackCustomMetric('dom_content_loaded', navTiming.domContentLoadedEventEnd - navTiming.navigationStart);
            this.trackCustomMetric('first_paint', navTiming.loadEventStart - navTiming.navigationStart);
          }
        }, 0);
      });
  }

  private trackCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackCustomMetric('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          this.trackCustomMetric('fid', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.trackCustomMetric('cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  private trackResourceLoadTimes(): void {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource');
      resources.forEach((resource: any) => {
        const loadTime = resource.responseEnd - resource.startTime;
        this.trackCustomMetric(`resource_load_${resource.name.split('/').pop()}`, loadTime);
      });
    });
  }

  private sendMetricsIfBatchReady(): void {
    if (this.metrics.length >= 10) {
      this.sendMetrics();
    }
  }

  private sendMetrics(): void {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    // Send metrics to analytics endpoint
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ metrics: metricsToSend })
    }).catch(error => {
      console.error('Failed to send performance metrics:', error);
      // Re-queue metrics on failure
      this.metrics.unshift(...metricsToSend);
    });
  }
}