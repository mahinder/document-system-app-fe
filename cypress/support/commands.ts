// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
      uploadFile(selector: string, fileName: string): Chainable<void>;
      waitForApiCall(alias: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email?: string, password?: string) => {
  const testEmail = email || Cypress.env('testUser').email;
  const testPassword = password || Cypress.env('testUser').password;

  cy.session([testEmail, testPassword], () => {
    cy.visit('/auth/login');
    cy.get('[data-cy=email-input]').type(testEmail);
    cy.get('[data-cy=password-input]').type(testPassword);
    cy.get('[data-cy=login-button]').click();
    cy.url().should('not.include', '/auth/login');
    cy.window().its('localStorage.auth_token').should('exist');
  });
});

Cypress.Commands.add('loginAsAdmin', () => {
  const adminUser = Cypress.env('adminUser');
  cy.login(adminUser.email, adminUser.password);
});

Cypress.Commands.add('uploadFile', (selector: string, fileName: string) => {
  cy.get(selector).selectFile(`cypress/fixtures/${fileName}`, { force: true });
});

Cypress.Commands.add('waitForApiCall', (alias: string) => {
  cy.wait(alias).its('response.statusCode').should('eq', 200);
});