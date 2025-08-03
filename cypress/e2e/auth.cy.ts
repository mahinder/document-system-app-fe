// cypress/e2e/auth.cy.ts
describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/auth/login');
  });

  it('should login successfully with valid credentials', () => {
    cy.intercept('POST', '**/auth/login').as('loginRequest');
    
    cy.get('[data-cy=email-input]').type(Cypress.env('testUser').email);
    cy.get('[data-cy=password-input]').type(Cypress.env('testUser').password);
    cy.get('[data-cy=login-button]').click();
    
    cy.waitForApiCall('@loginRequest');
    cy.url().should('include', '/dashboard');
    cy.get('[data-cy=user-menu]').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.intercept('POST', '**/auth/login', { statusCode: 401, body: { message: 'Invalid credentials' } }).as('loginError');
    
    cy.get('[data-cy=email-input]').type('invalid@example.com');
    cy.get('[data-cy=password-input]').type('wrongpassword');
    cy.get('[data-cy=login-button]').click();
    
    cy.wait('@loginError');
    cy.get('[data-cy=error-message]').should('contain', 'Invalid credentials');
  });

  it('should redirect to login after logout', () => {
    cy.login();
    cy.visit('/dashboard');
    
    cy.get('[data-cy=user-menu]').click();
    cy.get('[data-cy=logout-button]').click();
    
    cy.url().should('include', '/auth/login');
  });
});

// cypress/e2e/document-upload.cy.ts
describe('Document Upload', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/documents');
  });

  it('should upload a valid document', () => {
    cy.intercept('POST', '**/documents/upload').as('uploadRequest');
    
    cy.get('[data-cy=upload-button]').click();
    cy.uploadFile('[data-cy=file-input]', 'test-document.pdf');
    
    cy.waitForApiCall('@uploadRequest');
    cy.get('[data-cy=success-message]').should('contain', 'Upload successful');
    cy.get('[data-cy=document-list]').should('contain', 'test-document.pdf');
  });

  it('should reject invalid file types', () => {
    cy.get('[data-cy=upload-button]').click();
    cy.uploadFile('[data-cy=file-input]', 'malicious-file.exe');
    
    cy.get('[data-cy=error-message]').should('contain', 'File type not allowed');
  });

  it('should show upload progress', () => {
    cy.intercept('POST', '**/documents/upload', { delay: 2000 }).as('slowUpload');
    
    cy.get('[data-cy=upload-button]').click();
    cy.uploadFile('[data-cy=file-input]', 'large-document.pdf');
    
    cy.get('[data-cy=progress-bar]').should('be.visible');
    cy.get('[data-cy=progress-text]').should('contain', 'Uploading');
  });
});

// cypress/e2e/user-management.cy.ts
describe('User Management', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/users');
  });

  it('should display user list for admin', () => {
    cy.intercept('GET', '**/users*').as('getUsersRequest');
    
    cy.waitForApiCall('@getUsersRequest');
    cy.get('[data-cy=user-table]').should('be.visible');
    cy.get('[data-cy=user-row]').should('have.length.greaterThan', 0);
  });

  it('should create a new user', () => {
    cy.intercept('POST', '**/users').as('createUserRequest');
    
    cy.get('[data-cy=add-user-button]').click();
    cy.get('[data-cy=user-name-input]').type('Test User');
    cy.get('[data-cy=user-email-input]').type('newuser@example.com');
    cy.get('[data-cy=user-role-select]').select('user');
    cy.get('[data-cy=save-user-button]').click();
    
    cy.waitForApiCall('@createUserRequest');
    cy.get('[data-cy=success-message]').should('contain', 'User created successfully');
  });

  it('should edit user role', () => {
    cy.intercept('PATCH', '**/users/*').as('updateUserRequest');
    
    cy.get('[data-cy=user-row]').first().find('[data-cy=edit-button]').click();
    cy.get('[data-cy=user-role-select]').select('admin');
    cy.get('[data-cy=save-user-button]').click();
    
    cy.waitForApiCall('@updateUserRequest');
    cy.get('[data-cy=success-message]').should('contain', 'User updated successfully');
  });
});