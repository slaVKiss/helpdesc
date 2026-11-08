
import { TicketsPage } from '../pages/TicketsPage';

const page = new TicketsPage();

describe('HelpDesk — E2E-проверки', () => {
  beforeEach(() => {
    cy.request('POST', '/api/__reset');
    page.open();
  });

  it('показывает исходные заявки', () => {
    cy.get('[data-testid="page-title"]').should('contain', 'HelpDesk');
    page.items().should('have.length', 4);
    page.count().should('have.text', '4');
  });

  it('создает новую заявку', () => {
    page.createTicket({
      title: 'Не работает клавиатура',
      description: 'Клавиатура не реагирует на нажатия клавиш',
      category: 'hardware',
      priority: 'high'
    });

    page.formMessage().should('contain', 'создана');
    page.count().should('have.text', '5');
    page.items().should('contain', 'Не работает клавиатура');
  });

  it('выполняет поиск и фильтрацию заявок', () => {
    page.searchFor('VPN');
    page.items().should('have.length', 1);

    page.setStatus('new');
    page.setCategory('network');

    page.items().should('have.length', 1);
    page.ticketTitle().should('contain', 'VPN недоступен');
  });

  it('фильтрует заявки по приоритету', () => {
    page.setPriority('high');

    page.items().should('have.length', 2);

    page.items().each((item) => {
      cy.wrap(item).should('contain', 'Высокий');
    });

    page.count().should('have.text', '2');
  });

  it('изменяет статус заявки', () => {
    page.changeTicketStatus('VPN недоступен', 'В работу');

    page.items()
      .contains('.ticket-title', 'VPN недоступен')
      .parents('[data-testid="ticket-item"]')
      .should('contain', 'В работе');
  });

  it('безопасно отображает введенный пользователем HTML', () => {
    const xssTitle = '<b data-testid="xss-probe">ПРОВЕРКА</b>';

    page.createTicket({
      title: xssTitle,
      description: 'Проверка безопасного отображения пользовательского текста',
      category: 'software',
      priority: 'medium'
    });

    page.formMessage().should('contain', 'создана');

    page.items()
      .contains('.ticket-title', 'ПРОВЕРКА')
      .find('[data-testid="xss-probe"]')
      .should('not.exist');
  });
});
