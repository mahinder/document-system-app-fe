// features/qa-interface/components/qa-chat/qa-chat.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { QaService, Question, Answer, QASession } from '../../../../core/services/qa.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { AuthService } from '../../../../core/services/auth.service';

interface ChatMessage {
  type: 'question' | 'answer';
  content: string;
  timestamp: Date;
  sources?: any[];
  confidence?: number;
  isLoading?: boolean;
}

@Component({
  selector: 'app-qa-chat',
  template: `
    <div class="qa-chat-container">
      <!-- Chat Header -->
      <div class="chat-header">
        <h2>{{ currentSession?.title || 'New Conversation' }}</h2>
        <div class="header-actions">
          <button (click)="startNewSession()" class="btn-secondary">New Chat</button>
          <button (click)="showSessionHistory = !showSessionHistory" class="btn-icon">
            📋
          </button>
        </div>
      </div>

      <!-- Session History Sidebar -->
      <div class="session-sidebar" [class.show]="showSessionHistory">
        <h3>Previous Sessions</h3>
        <div class="session-list">
          <div *ngFor="let session of sessions" 
               class="session-item"
               [class.active]="session.id === currentSession?.id"
               (click)="loadSession(session)">
            <div class="session-title">{{ session.title }}</div>
            <div class="session-date">{{ session.lastActivity | date:'short' }}</div>
          </div>
        </div>
      </div>

      <!-- Chat Messages -->
      <div class="chat-messages" #messagesContainer>
        <div *ngIf="messages.length === 0" class="welcome-message">
          <h3>Welcome to Q&A Assistant</h3>
          <p>Ask me anything about your documents!</p>
          
          <div class="popular-questions" *ngIf="popularQuestions.length > 0">
            <h4>Popular Questions:</h4>
            <button *ngFor="let pq of popularQuestions" 
                    class="popular-question-btn"
                    (click)="askPopularQuestion(pq.question)">
              {{ pq.question }}
            </button>
          </div>
        </div>

        <div *ngFor="let message of messages; trackBy: trackByMessage" 
             class="message" 
             [class.question]="message.type === 'question'"
             [class.answer]="message.type === 'answer'">
          
          <!-- Question Message -->
          <div *ngIf="message.type === 'question'" class="question-message">
            <div class="message-avatar">👤</div>
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
              <div class="message-time">{{ message.timestamp | date:'short' }}</div>
            </div>
          </div>

          <!-- Answer Message -->
          <div *ngIf="message.type === 'answer'" class="answer-message">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
              <div *ngIf="message.isLoading" class="loading-indicator">
                <div class="typing-dots">
                  <span></span><span></span><span></span>
                </div>
                <span>Analyzing documents...</span>
              </div>
              
              <div *ngIf="!message.isLoading" class="answer-content">
                <div class="message-text">{{ message.content }}</div>
                
                <div *ngIf="message.confidence" class="confidence-indicator">
                  <span>Confidence: {{ message.confidence * 100 | number:'1.0-0' }}%</span>
                </div>

                <!-- Document Sources -->
                <div *ngIf="message.sources && message.sources.length > 0" class="document-sources">
                  <h5>Sources:</h5>
                  <div *ngFor="let source of message.sources" class="source-item">
                    <div class="source-header">
                      <span class="source-name">📄 {{ source.documentName }}</span>
                      <span class="relevance-score">{{ source.relevanceScore * 100 | number:'1.0-0' }}% relevant</span>
                    </div>
                    <div class="source-excerpt">{{ source.excerpt }}</div>
                    <div *ngIf="source.pageNumber" class="source-page">Page {{ source.pageNumber }}</div>
                  </div>
                </div>

                <!-- Answer Rating -->
                <div class="answer-actions">
                  <button (click)="rateAnswer(message.id, 'helpful')" 
                          class="rate-btn helpful"
                          [class.selected]="message.rating === 'helpful'">
                    👍 Helpful
                  </button>
                  <button (click)="rateAnswer(message.id, 'not_helpful')" 
                          class="rate-btn not-helpful"
                          [class.selected]="message.rating === 'not_helpful'">
                    👎 Not Helpful
                  </button>
                </div>
              </div>
              
              <div class="message-time">{{ message.timestamp | date:'short' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Form -->
      <div class="chat-input-container">
        <form [formGroup]="questionForm" (ngSubmit)="askQuestion()" class="question-form">
          <div class="input-wrapper">
            <textarea formControlName="question" 
                      placeholder="Ask a question about your documents..."
                      rows="2"
                      [disabled]="isLoading"
                      (keydown.enter)="onEnterPress($event)"
                      #questionInput></textarea>
            
            <button type="submit" 
                    [disabled]="!questionForm.valid || isLoading"
                    class="send-btn">
              <span *ngIf="!isLoading">Send</span>
              <span *ngIf="isLoading" class="loading-spinner"></span>
            </button>
          </div>
          
          <div *ngIf="questionForm.get('question')?.errors?.['required']" class="error-message">
            Please enter a question
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./qa-chat.component.scss']
})
export class QaChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('questionInput') questionInput!: ElementRef;

  questionForm: FormGroup;
  messages: ChatMessage[] = [];
  currentSession: QASession | null = null;
  sessions: QASession[] = [];
  popularQuestions: { question: string, count: number }[] = [];
  showSessionHistory = false;
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private qaService: QaService,
    private analyticsService: AnalyticsService,
    private authService: AuthService
  ) {
    this.questionForm = this.fb.group({
      question: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit(): void {
    this.loadSessions();
    this.loadPopularQuestions();
    this.setupAutoSave();
    this.createNewSession();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  askQuestion(): void {
    if (!this.questionForm.valid || this.isLoading) return;

    const questionText = this.questionForm.value.question.trim();
    const currentUser = this.authService.getCurrentUser();

    // Add question message
    const questionMessage: ChatMessage = {
      type: 'question',
      content: questionText,
      timestamp: new Date()
    };
    this.messages.push(questionMessage);

    // Add loading answer message
    const loadingMessage: ChatMessage = {
      type: 'answer',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };
    this.messages.push(loadingMessage);

    this.isLoading = true;
    this.questionForm.reset();
    this.scrollToBottom();

    // Track analytics
    this.analyticsService.trackSearchQuery(
      questionText, 
      0, 
      currentUser?.id
    );

    // Ask question
    this.qaService.askQuestion(questionText, this.currentSession?.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (answer) => {
          // Remove loading message and add real answer
          this.messages.pop();
          
          const answerMessage: ChatMessage = {
            type: 'answer',
            content: answer.text,
            timestamp: answer.timestamp,
            sources: answer.sources,
            confidence: answer.confidence,
            id: answer.id
          };
          
          this.messages.push(answerMessage);
          this.isLoading = false;
          this.scrollToBottom();

          // Update analytics with results count
          this.analyticsService.trackSearchQuery(
            questionText,
            answer.sources.length,
            currentUser?.id
          );
        },
        error: (error) => {
          // Remove loading message and show error
          this.messages.pop();
          
          const errorMessage: ChatMessage = {
            type: 'answer',
            content: 'Sorry, I encountered an error while processing your question. Please try again.',
            timestamp: new Date()
          };
          
          this.messages.push(errorMessage);
          this.isLoading = false;
          console.error('QA Error:', error);
        }
      });
  }

  askPopularQuestion(question: string): void {
    this.questionForm.patchValue({ question });
    this.askQuestion();
  }

  rateAnswer(answerId: string, rating: 'helpful' | 'not_helpful'): void {
    this.qaService.rateAnswer(answerId, rating).subscribe({
      next: () => {
        // Update message rating in UI
        const message = this.messages.find(m => m.id === answerId);
        if (message) {
          (message as any).rating = rating;
        }
        
        this.analyticsService.trackUserAction(
          'rate_answer',
          'qa',
          rating,
          this.authService.getCurrentUser()?.id
        );
      },
      error: (error) => console.error('Rating error:', error)
    });
  }

  startNewSession(): void {
    this.createNewSession();
    this.messages = [];
    this.showSessionHistory = false;
  }

  loadSession(session: QASession): void {
    this.currentSession = session;
    this.showSessionHistory = false;
    
    this.qaService.getConversationHistory(session.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.messages = this.buildMessagesFromHistory(history);
          this.scrollToBottom();
        },
        error: (error) => console.error('Load session error:', error)
      });
  }

  onEnterPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.askQuestion();
    }
  }

  trackByMessage(index: number, message: ChatMessage): any {
    return message.id || index;
  }

  private createNewSession(): void {
    this.qaService.createSession()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (session) => {
          this.currentSession = session;
          this.sessions.unshift(session);
        },
        error: (error) => console.error('Create session error:', error)
      });
  }

  private loadSessions(): void {
    this.qaService.getSessions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sessions) => {
          this.sessions = sessions;
        },
        error: (error) => console.error('Load sessions error:', error)
      });
  }

  private loadPopularQuestions(): void {
    this.qaService.getPopularQuestions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (questions) => {
          this.popularQuestions = questions.slice(0, 5); // Show top 5
        },
        error: (error) => console.error('Load popular questions error:', error)
      });
  }

  private buildMessagesFromHistory(history: any): ChatMessage[] {
    const messages: ChatMessage[] = [];
    
    // Combine and sort questions and answers by timestamp
    const combined = [
      ...history.questions.map(q => ({ ...q, type: 'question' })),
      ...history.answers.map(a => ({ ...a, type: 'answer' }))
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    combined.forEach(item => {
      if (item.type === 'question') {
        messages.push({
          type: 'question',
          content: item.text,
          timestamp: item.timestamp
        });
      } else {
        messages.push({
          type: 'answer',
          content: item.text,
          timestamp: item.timestamp,
          sources: item.sources,
          confidence: item.confidence,
          id: item.id
        });
      }
    });

    return messages;
  }

  private setupAutoSave(): void {
    // Auto-save session title based on first question
    this.questionForm.get('question')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Auto-save logic if needed
      });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }
}