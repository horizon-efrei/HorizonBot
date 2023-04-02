import type { Result } from '@sapphire/framework';
import { err, ok } from '@sapphire/framework';
import { fr as chrono } from 'chrono-node';

const isPast = (date: Date): boolean => date.getTime() < Date.now();

export default function resolveDate(parameter: string, options?: { canBePast: boolean }): Result<Date, 'dateError'> {
  const expandedParameter = parameter
    .replace(/ajrd/i, 'aujourd\'hui')
    .replace(/apr[eè]s[ -]demain/i, 'dans 2 jours');

  const date = chrono.parseDate(expandedParameter);

  // TODO: Separate error for past dates
  if (!date || (!options?.canBePast && isPast(date)))
    return err('dateError');
  return ok(date);
}
