
'use strict';

const { createApp } = require('../../src/app');

let server;
let base;

beforeEach(async () => {
  server = createApp({ seed: [] });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function createTicket(title, category = 'hardware') {
  return fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title,
      description: 'Подробное описание проблемы',
      category,
      priority: 'medium'
    })
  });
}

test('GET /api/health отвечает HTTP 200', async () => {
  const response = await fetch(`${base}/api/health`);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok' });
});

test('POST /api/tickets создает корректную заявку', async () => {
  const response = await fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Сбой принтера',
      description: 'Принтер в аудитории не отвечает',
      category: 'hardware',
      priority: 'medium'
    })
  });

  const body = await response.json();
  expect(response.status).toBe(201);
  expect(body.ticket.id).toBe(1);
  expect(body.ticket.status).toBe('new');
});

// 3. Проверка фильтрации заявок по статусу и категории
test('GET /api/tickets фильтрует заявки по статусу и категории', async () => {
  await createTicket('Проблема с мышью', 'hardware');
  await createTicket('Ошибка программы', 'software');

  await fetch(`${base}/api/tickets/1/status`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'in_progress' })
  });

  const statusResponse = await fetch(`${base}/api/tickets?status=in_progress`);
  const statusBody = await statusResponse.json();

  expect(statusResponse.status).toBe(200);
  expect(statusBody.total).toBe(1);
  expect(statusBody.items[0].status).toBe('in_progress');

  const categoryResponse = await fetch(`${base}/api/tickets?category=software`);
  const categoryBody = await categoryResponse.json();

  expect(categoryResponse.status).toBe(200);
  expect(categoryBody.total).toBe(1);
  expect(categoryBody.items[0].category).toBe('software');
});

// 4. Проверка обработки некорректного JSON
test('POST /api/tickets возвращает HTTP 400 при некорректном JSON', async () => {
  const response = await fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{invalid json'
  });

  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body.error).toBe('Ожидается корректный JSON');
});

// 5. Проверка обработки заявки с некорректными данными
test('POST /api/tickets отклоняет заявку с некорректными данными', async () => {
  const response = await fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'abc',
      description: 'Коротко',
      category: 'unknown',
      priority: 'urgent'
    })
  });

  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body.errors).toBeDefined();
  expect(body.errors.title).toBeDefined();
  expect(body.errors.category).toBeDefined();
  expect(body.errors.priority).toBeDefined();
});

// 6. Проверка запрета недопустимого перехода статуса
test('PATCH /api/tickets запрещает переход new → resolved', async () => {
  await createTicket('Проблема с компьютером');

  const response = await fetch(`${base}/api/tickets/1/status`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'resolved' })
  });

  const body = await response.json();

  expect(response.status).toBe(409);
  expect(body.error).toBe('Недопустимый переход');
});

// 7. Проверка фильтрации заявок по приоритету
test('GET /api/tickets фильтрует заявки по приоритету', async () => {
  await fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Срочно восстановить сеть',
      description: 'Не работает сеть в офисе',
      category: 'network',
      priority: 'high'
    })
  });

  await createTicket('Плановая настройка мыши');

  const response = await fetch(`${base}/api/tickets?priority=high`);
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.total).toBe(1);
  expect(body.items[0].priority).toBe('high');
});

// 8. Проверка последовательных запросов к API
test('API сохраняет заявку между последовательными запросами', async () => {
  const createResponse = await createTicket('Не работает клавиатура');

  expect(createResponse.status).toBe(201);

  const listResponse = await fetch(`${base}/api/tickets`);
  const listBody = await listResponse.json();

  expect(listResponse.status).toBe(200);
  expect(listBody.total).toBe(1);
  expect(listBody.items[0].title).toBe('Не работает клавиатура');
});
