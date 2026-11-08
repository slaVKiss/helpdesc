
'use strict';

const {
  normalizeTitle,
  validateTicketInput,
  canChangeStatus,
  filterAndSort
} = require('../../src/core');

describe('Unit-тестирование HelpDesk', () => {

  // 1. Нормализация темы
  test('удаляет пробелы в начале и конце темы', () => {
    expect(normalizeTitle('  Ошибка принтера  '))
      .toBe('Ошибка принтера');
  });

  test('заменяет повторяющиеся пробелы одним пробелом', () => {
    expect(normalizeTitle('Ошибка   принтера'))
      .toBe('Ошибка принтера');
  });

  // 2. Проверка входных данных
  test('отклоняет неизвестную категорию', () => {
    const errors = validateTicketInput({
      title: 'Ошибка печати',
      description: 'Принтер не печатает документ',
      category: 'unknown',
      priority: 'low'
    });

    expect(errors).toHaveProperty('category');
  });

  test.each([
    ['минимальная допустимая длина', 'Тест1', false],
    ['длина меньше минимальной', 'Тест', true],
    ['максимальная допустимая длина', 'А'.repeat(80), false],
    ['длина больше максимальной', 'А'.repeat(81), true]
  ])('проверка границ темы: %s', (name, title, shouldFail) => {
    const errors = validateTicketInput({
      title,
      description: 'Описание тестовой заявки',
      category: 'hardware',
      priority: 'medium'
    });

    if (shouldFail) {
      expect(errors).toHaveProperty('title');
    } else {
      expect(errors).not.toHaveProperty('title');
    }
  });

  test('отклоняет тему, которая становится слишком короткой после нормализации', () => {
    const errors = validateTicketInput({
      title: '    А    ',
      description: 'Описание тестовой заявки',
      category: 'hardware',
      priority: 'low'
    });

    expect(errors).toHaveProperty('title');
  });

  // 3. Проверка переходов между статусами
  test('запрещает возвращение из закрытого статуса', () => {
    expect(canChangeStatus('resolved', 'new')).toBe(false);
  });

  test('запрещает переход из нового сразу в закрытый статус', () => {
    expect(canChangeStatus('new', 'resolved')).toBe(false);
  });

  test('разрешает переход из нового в работе', () => {
    expect(canChangeStatus('new', 'in_progress')).toBe(true);
  });

  test('разрешает закрытие заявки, находящейся в работе', () => {
    expect(canChangeStatus('in_progress', 'resolved')).toBe(true);
  });

  // 4. Проверка сортировки
  test('сначала отображает заявки с высоким приоритетом', () => {
    const tickets = [
      { id: 1, priority: 'low', createdAt: '2026-01-01' },
      { id: 2, priority: 'high', createdAt: '2026-01-02' },
      { id: 3, priority: 'medium', createdAt: '2026-01-03' }
    ];

    const result = filterAndSort(tickets);

    expect(result.map(ticket => ticket.priority))
      .toEqual(['high', 'medium', 'low']);
  });

  test('при одинаковом приоритете сначала показывает новые заявки', () => {
    const tickets = [
      { id: 1, priority: 'high', createdAt: '2026-01-01' },
      { id: 2, priority: 'high', createdAt: '2026-01-03' }
    ];

    const result = filterAndSort(tickets);

    expect(result[0].id).toBe(2);
  });

  // 5. TDD: фильтрация по приоритету
  test('фильтрует заявки по приоритету', () => {
    const tickets = [
      { id: 1, priority: 'high', createdAt: '2026-01-01' },
      { id: 2, priority: 'low', createdAt: '2026-01-02' },
      { id: 3, priority: 'high', createdAt: '2026-01-03' },
      { id: 4, priority: 'medium', createdAt: '2026-01-04' }
    ];

    const result = filterAndSort(tickets, { priority: 'high' });

    expect(result).toHaveLength(2);
    expect(result.every(ticket => ticket.priority === 'high')).toBe(true);
  });

});
