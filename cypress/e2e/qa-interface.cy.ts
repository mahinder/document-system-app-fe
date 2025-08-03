// cypress/e2e/qa-interface.cy.ts
describe('Q&A Interface', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/qa');
    cy.intercept('GET', '**/qa/sessions').as('getSessions');
    cy.intercept('GET', '**/qa/popular-questions').as('getPopularQuestions');
    cy.intercept('POST', '**/qa/sessions').as('createSession');
  });

  it('should display welcome message for new session', () => {
    cy.waitForApiCall('@getSessions');
    cy.waitForApiCall('@getPopularQuestions');
    cy.waitForApiCall('@createSession');
    
    cy.get('[data-cy=welcome-message]').should('be.visible');
    cy.get('[data-cy=welcome-message]').should('contain', 'Welcome to Q&A Assistant');
  });

  it('should ask a question and receive an answer', () => {
    const mockAnswer = {
      id: 'answer1',
      text: 'This is a test answer',
      confidence: 0.95,
      sources: [
        {
          documentId: 'doc1',
          documentName: 'Test Document.pdf',
          excerpt: 'This is a relevant excerpt from the document.',
          relevanceScore: 0.9,
          pageNumber: 1
        }
      ],
      timestamp: new Date().toISOString(),
      processingTime: 1500
    };

    cy.intercept('POST', '**/qa/ask', { body: mockAnswer }).as('askQuestion');
    
    cy.get('[data-cy=question-input]').type('What is the main topic of the documents?');
    cy.get('[data-cy=send-button]').click();
    
    // Check question appears
    cy.get('[data-cy=message]').should('have.length', 1);
    cy.get('[data-cy=question-message]').should('contain', 'What is the main topic');
    
    // Check loading state
    cy.get('[data-cy=loading-indicator]').should('be.visible');
    
    cy.waitForApiCall('@askQuestion');
    
    // Check answer appears
    cy.get('[data-cy=message]').should('have.length', 2);
    cy.get('[data-cy=answer-message]').should('contain', 'This is a test answer');
    cy.get('[data-cy=confidence-indicator]').should('contain', '95%');
    cy.get('[data-cy=document-sources]').should('be.visible');
    cy.get('[data-cy=source-item]').should('contain', 'Test Document.pdf');
  });

  it('should display popular questions', () => {
    const mockPopularQuestions = [
      { question: 'What is the main topic?', count: 15 },
      { question: 'How does this work?', count: 12 },
      { question: 'What are the requirements?', count: 8 }
    ];

    cy.intercept('GET', '**/qa/popular-questions', { body: mockPopularQuestions }).as('getPopularQuestions');
    
    cy.waitForApiCall('@getPopularQuestions');
    
    cy.get('[data-cy=popular-questions]').should('be.visible');
    cy.get('[data-cy=popular-question-btn]').should('have.length', 3);
    cy.get('[data-cy=popular-question-btn]').first().should('contain', 'What is the main topic?');
  });

  it('should click popular question and ask it', () => {
    const mockPopularQuestions = [
      { question: 'What is the main topic?', count: 15 }
    ];
    const mockAnswer = { id: 'answer1', text: 'Answer to popular question', sources: [] };

    cy.intercept('GET', '**/qa/popular-questions', { body: mockPopularQuestions }).as('getPopularQuestions');
    cy.intercept('POST', '**/qa/ask', { body: mockAnswer }).as('askQuestion');
    
    cy.waitForApiCall('@getPopularQuestions');
    
    cy.get('[data-cy=popular-question-btn]').first().click();
    cy.get('[data-cy=question-input]').should('have.value', 'What is the main topic?');
    
    cy.waitForApiCall('@askQuestion');
    cy.get('[data-cy=answer-message]').should('contain', 'Answer to popular question');
  });

  it('should rate an answer', () => {
    const mockAnswer = {
      id: 'answer1',
      text: 'Test answer',
      sources: []
    };

    cy.intercept('POST', '**/qa/ask', { body: mockAnswer }).as('askQuestion');
    cy.intercept('POST', '**/qa/answers/answer1/rate').as('rateAnswer');
    
    cy.get('[data-cy=question-input]').type('Test question');
    cy.get('[data-cy=send-button]').click();
    
    cy.waitForApiCall('@askQuestion');
    
    cy.get('[data-cy=rate-helpful]').click();
    cy.waitForApiCall('@rateAnswer');
    
    cy.get('[data-cy=rate-helpful]').should('have.class', 'selected');
  });

  it('should manage sessions', () => {
    const mockSessions = [
      {
        id: 'session1',
        title: 'Previous Chat',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        questionCount: 3
      }
    ];

    cy.intercept('GET', '**/qa/sessions', { body: mockSessions }).as('getSessions');
    cy.intercept('POST', '**/qa/sessions').as('createNewSession');
    
    // Show session history
    cy.get('[data-cy=session-history-btn]').click();
    cy.get('[data-cy=session-sidebar]').should('have.class', 'show');
    
    cy.waitForApiCall('@getSessions');
    cy.get('[data-cy=session-item]').should('have.length', 1);
    cy.get('[data-cy=session-item]').should('contain', 'Previous Chat');
    
    // Create new session
    cy.get('[data-cy=new-chat-btn]').click();
    cy.waitForApiCall('@createNewSession');
    cy.get('[data-cy=session-sidebar]').should('not.have.class', 'show');
  });

  it('should handle errors gracefully', () => {
    cy.intercept('POST', '**/qa/ask', { statusCode: 500, body: { error: 'Server error' } }).as('askQuestionError');
    
    cy.get('[data-cy=question-input]').type('Test question');
    cy.get('[data-cy=send-button]').click();
    
    cy.wait('@askQuestionError');
    
    cy.get('[data-cy=answer-message]').should('contain', 'Sorry, I encountered an error');
    cy.get('[data-cy=send-button]').should('not.be.disabled');
  });

  it('should prevent empty questions', () => {
    cy.get('[data-cy=send-button]').should('be.disabled');
    
    cy.get('[data-cy=question-input]').type('  '); // Just spaces
    cy.get('[data-cy=send-button]').should('be.disabled');
    
    cy.get('[data-cy=question-input]').clear().type('Hi'); // Too short
    cy.get('[data-cy=send-button]').should('be.disabled');
    
    cy.get('[data-cy=question-input]').clear().type('Valid question');
    cy.get('[data-cy=send-button]').should('not.be.disabled');
  });
});