import { BadRequestException } from '@nestjs/common';

export interface CreateReportInput {
  location: { id: number };
  status: 'ok' | 'not_ok';
  comment: string;
  target: 'general' | 'toilet' | 'water';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseCreateReport(value: unknown): CreateReportInput {
  if (!isObject(value)) {
    throw new BadRequestException('Raportin pitää olla JSON-objekti.');
  }
  if (Object.keys(value).some(key => !['location', 'status', 'comment', 'target'].includes(key))) {
    throw new BadRequestException('Sallitut kentät ovat location, status, comment ja target.');
  }
  const location = value.location;
  if (
    !isObject(location) ||
    Object.keys(location).some(key => key !== 'id') ||
    typeof location.id !== 'number' ||
    !Number.isInteger(location.id) ||
    location.id < 1 ||
    location.id > 2147483647
  ) {
    throw new BadRequestException('Valitse kelvollinen kohde: location.id.');
  }
  if (value.status !== 'ok' && value.status !== 'not_ok') {
    throw new BadRequestException('Tilan pitää olla ok tai not_ok.');
  }
  if (value.comment !== undefined &&
      (typeof value.comment !== 'string' || value.comment.length > 2000)) {
    throw new BadRequestException('Kommentin pitää olla tekstiä, enintään 2000 merkkiä.');
  }
  const target = value.target === undefined ? 'general' : value.target;
  if (target !== 'general' && target !== 'toilet' && target !== 'water') {
    throw new BadRequestException('Valitse raportin aihe: general, toilet tai water.');
  }
  return {
    target,
    location: { id: location.id },
    status: value.status,
    comment: typeof value.comment === 'string' ? value.comment.trim() : '',
  };
}
