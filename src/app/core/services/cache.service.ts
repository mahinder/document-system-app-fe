// core/services/cache.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Observable wrapper for caching
  cacheObservable<T>(key: string, source$: Observable<T>, ttl?: number): Observable<T> {
    const cached = this.get<T>(key);
    
    if (cached) {
      return of(cached);
    }

    return source$.pipe(
      tap(data => this.set(key, data, ttl))
    );
  }
}