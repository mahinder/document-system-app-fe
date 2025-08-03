// features/qa-interface/components/qa-chat/qa-chat.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { QaChatComponent } from './qa-chat.component';
import { QaService } from '../../../../core/services/qa.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { AuthService } from '../../../../core/services/auth.service';

describe('QaChatComponent', () => {
  let component: QaChatComponent;
  let fixture: ComponentFixture<QaChatComponent>;
  let qaServiceSpy: jasmine.SpyObj<QaService>;
  let analyticsServiceSpy: jasmine.SpyObj<AnalyticsService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockUser = {
    id: 'user1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
    permissions: ['qa_access']
  };

  const mockAnswer = {
    id: 'answer1',
    questionId: 'question1',
    text: 'This is a test answer',
    confidence: 0.95,
    sources: [
      {
        documentId: 'doc1',
        documentName: 'Test Document',
        excerpt: 'This is a relevant excerpt',
        relevanceScore: 0.9,
        pageNumber: 1
      }
    ],
    timestamp: new Date(),
    processingTime: 1500
  };

  beforeEach(async () => {
    const qaServiceSpyObj = jasmine.createSpyObj('QaService', [
      'askQuestion', 'getSessions', 'createSession', 'getPopularQuestions', 
      'rateAnswer', 'getConversationHistory'
    ]);
    const analyticsServiceSpyObj = jasmine.createSpyObj('AnalyticsService', [
      'trackSearchQuery', 'trackUserAction'
    ]);
    const authServiceSpyObj = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

    await TestBed.configureTestingModule({
      declarations: [QaChatComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: QaService, useValue: qaServiceSpyObj },
        { provide: AnalyticsService, useValue: analyticsServiceSpyObj },
        { provide: AuthService, useValue: authServiceSpyObj }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QaChatComponent);
    component = fixture.componentInstance;
    qaServiceSpy = TestBed.inject(QaService) as jasmine.SpyObj<QaService>;
    analyticsServiceSpy = TestBed.inject(AnalyticsService) as jasmine.SpyObj<AnalyticsService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Setup default return values
    qaServiceSpy.getSessions.and.returnValue(of([]));
    qaServiceSpy.getPopularQuestions.and.returnValue(of([]));
    qaServiceSpy.createSession.and.returnValue(of({ 
      id: 'session1', 
      title: 'New Session', 
      createdAt: new Date(), 
      lastActivity: new Date(), 
      questionCount: 0 
    }));
    authServiceSpy.getCurrentUser.and.returnValue(mockUser);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty messages', () => {
    fixture.detectChanges();
    expect(component.messages.length).toBe(0);
  });

  it('should ask question and receive answer', async () => {
    qaServiceSpy.askQuestion.and.returnValue(of(mockAnswer));
    
    component.questionForm.patchValue({ question: 'Test question' });
    fixture.detectChanges();

    component.askQuestion();

    expect(qaServiceSpy.askQuestion).toHaveBeenCalledWith('Test question', jasmine.any(String));
    expect(analyticsServiceSpy.trackSearchQuery).toHaveBeenCalledWith('Test question', 1, 'user1');
    expect(component.messages.length).toBe(2); // Question + Answer
    expect(component.messages[0].type).toBe('question');
    expect(component.messages[1].type).toBe('answer');
  });

  it('should handle error during question asking', () => {
    qaServiceSpy.askQuestion.and.returnValue(throwError(() => new Error('API Error')));
    
    component.questionForm.patchValue({ question: 'Test question' });
    component.askQuestion();

    expect(component.messages.length).toBe(2);
    expect(component.messages[1].content).toContain('Sorry, I encountered an error');
    expect(component.isLoading).toBe(false);
  });

  it('should rate answer', () => {
    qaServiceSpy.rateAnswer.and.returnValue(of(void 0));
    
    component.rateAnswer('answer1', 'helpful');

    expect(qaServiceSpy.rateAnswer).toHaveBeenCalledWith('answer1', 'helpful');
    expect(analyticsServiceSpy.trackUserAction).toHaveBeenCalledWith('rate_answer', 'qa', 'helpful', 'user1');
  });

  it('should validate form', () => {
    expect(component.questionForm.valid).toBe(false);
    
    component.questionForm.patchValue({ question: 'Hi' }); // Too short
    expect(component.questionForm.valid).toBe(false);
    
    component.questionForm.patchValue({ question: 'Valid question' });
    expect(component.questionForm.valid).toBe(true);
  });
});