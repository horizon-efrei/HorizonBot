import type { Result } from '@sapphire/framework';
import { err, ok } from '@sapphire/framework';
import { fr /* French */ as chrono } from 'chrono-node';

const isPast = (date: Date): boolean => date.getTime() < Date.now();

export default function resolveDate(parameter: string, options?: { canBePast: boolean }): Result<Date, 'dateError'> {
  const date = chrono.parseDate(parameter);

  if (!date || (!options?.canBePast && isPast(date)))
    return err('dateError');
  return ok(date);
}
