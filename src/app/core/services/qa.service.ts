// core/services/qa.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Question {
  id: string;
  text: string;
  timestamp: Date;
  userId: string;
  sessionId: string;
}

export interface Answer {
  id: string;
  questionId: string;
  text: string;
  confidence: number;
  sources: DocumentExcerpt[];
  timestamp: Date;
  processingTime: number;
}

export interface DocumentExcerpt {
  documentId: string;
  documentName: string;
  excerpt: string;
  relevanceScore: number;
  pageNumber?: number;
}

export interface QASession {
  id: string;
  title: string;
  createdAt: Date;
  lastActivity: Date;
  questionCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class QaService {
  private questionStream = new Subject<Question>();
  private answerStream = new Subject<Answer>();

  constructor(private http: HttpClient) {}

  askQuestion(text: string, sessionId?: string): Observable<Answer> {
    const payload = {
      question: text,
      sessionId: sessionId || this.generateSessionId()
    };

    return this.http.post<Answer>(`${environment.apiUrl}/qa/ask`, payload);
  }

  getConversationHistory(sessionId: string): Observable<{ questions: Question[], answers: Answer[] }> {
    return this.http.get<{ questions: Question[], answers: Answer[] }>(
      `${environment.apiUrl}/qa/sessions/${sessionId}/history`
    );
  }

  getSessions(): Observable<QASession[]> {
    return this.http.get<QASession[]>(`${environment.apiUrl}/qa/sessions`);
  }

  createSession(title?: string): Observable<QASession> {
    return this.http.post<QASession>(`${environment.apiUrl}/qa/sessions`, { title });
  }

  deleteSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/qa/sessions/${sessionId}`);
  }

  getPopularQuestions(): Observable<{ question: string, count: number }[]> {
    return this.http.get<{ question: string, count: number }[]>(
      `${environment.apiUrl}/qa/popular-questions`
    );
  }

  rateAnswer(answerId: string, rating: 'helpful' | 'not_helpful'): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/qa/answers/${answerId}/rate`, { rating });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}