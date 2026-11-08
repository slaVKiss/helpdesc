
'use strict';

const VALID_CATEGORIES = ['hardware', 'software', 'network'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_STATUSES = ['new', 'in_progress', 'resolved'];

function normalizeTitle(title) {
  return String(title || '').trim().replace(/\s+/g, ' ');
}

function validateTicketInput(input) {
  const errors = {};
  const title = normalizeTitle(input.title);
  const description = String(input.description || '').trim();

  if (title.length < 5 || title.length > 80) {
    errors.title = 'Тема должна содержать от 5 до 80 символов';
  }

  if (description.length < 10 || description.length > 500) {
    errors.description = 'Описание должно содержать от 10 до 500 символов';
  }

  if (!VALID_CATEGORIES.includes(input.category)) {
    errors.category = 'Неизвестная категория';
  }

  if (!VALID_PRIORITIES.includes(input.priority)) {
    errors.priority = 'Неизвестный приоритет';
  }

  return errors;
}

function canChangeStatus(currentStatus, nextStatus) {
  const transitions = {
    new: ['in_progress'],
    in_progress: ['resolved'],
    resolved: []
  };

  return VALID_STATUSES.includes(currentStatus) &&
    transitions[currentStatus].includes(nextStatus);
}

function filterAndSort(tickets, filters = {}) {
  const search = String(filters.search || '').trim().toLowerCase();
  const status = String(filters.status || '').trim();
  const category = String(filters.category || '').trim();
  const priority = String(filters.priority || '').trim();

  return tickets
    .filter((ticket) => {
      if (status && ticket.status !== status) return false;
      if (category && ticket.category !== category) return false;
      if (priority && ticket.priority !== priority) return false;

      if (!search) return true;

      return (
        String(ticket.title || '').toLowerCase().includes(search) ||
        String(ticket.description || '').toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      const priorityOrder = {
        high: 3,
        medium: 2,
        low: 1
      };

      const priorityDifference =
        priorityOrder[b.priority] - priorityOrder[a.priority];

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

module.exports = {
  normalizeTitle,
  validateTicketInput,
  canChangeStatus,
  filterAndSort
};
