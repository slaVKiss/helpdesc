
export class TicketsPage {
  open() {
    cy.visit('/');
  }

  items() {
    return cy.get('[data-testid="ticket-item"]');
  }

  count() {
    return cy.get('[data-testid="ticket-count"]');
  }

  searchFor(text) {
    cy.get('[data-testid="search"]').clear().type(text);
  }

  setStatus(status) {
    cy.get('[data-testid="status-filter"]').select(status);
  }

  setCategory(category) {
    cy.get('[data-testid="category-filter"]').select(category);
  }

  setPriority(priority) {
  cy.get('[data-testid="priority-filter"]').select(priority);
}

  createTicket({ title, description, category = 'hardware', priority = 'medium' }) {
    cy.get('[data-testid="title"]').type(title);
    cy.get('[data-testid="description"]').type(description);
    cy.get('[data-testid="category"]').select(category);
    cy.get('[data-testid="priority"]').select(priority);
    cy.get('[data-testid="submit-ticket"]').click();
  }

  formMessage() {
    return cy.get('[data-testid="form-message"]');
  }

  changeTicketStatus(title, action) {
    this.items()
      .contains('.ticket-title', title)
      .parents('[data-testid="ticket-item"]')
      .contains('button', action)
      .click();
  }

  ticketTitle(index = 0) {
    return this.items().eq(index).find('.ticket-title');
  }
}
