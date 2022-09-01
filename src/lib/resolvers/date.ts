import type { Result } from '@sapphire/framework';
import { err, ok } from '@sapphire/framework';

const DATE_REGEX = /^(?<day>\d{1,2})[/-](?<month>\d{1,2})(?:[/-](?<year>\d{1,4}))?(?: (?:a|à)?\s*(?<hour>\d{1,2})[h:](?<minutes>\d{1,2}(?:m(?:in(?:s)?)?)?)?)?$/imu;

const intOrNull = (value: string | undefined): number | null => Number.parseInt(value ?? '', 10) || null;
const isPast = (date: Date): boolean => date.getTime() < Date.now();

export default function resolveDate(parameter: string, options?: { canBePast: boolean }): Result<Date, 'dateError'> {
  if (!DATE_REGEX.test(parameter))
    return err('dateError');

  const groups = DATE_REGEX.exec(parameter)?.groups;
  if (!groups)
    return err('dateError');

  const date = new Date();
  // Start by settings the day to 1, so when we set the month we don't have any problem with months
  // that are not 31 days long. (this took me hours of debugging)
  date.setDate(1);
  const year = intOrNull(groups.year?.padStart(4, '20')) ?? new Date().getFullYear();
  const month = Number.parseInt(groups.month, 10) - 1;
  const day = Number.parseInt(groups.day, 10);

  const hour = intOrNull(groups.hour) ?? new Date().getHours();
  const minutes = typeof groups.hour === 'undefined'
    ? new Date().getMinutes()
    : intOrNull(groups.minutes) ?? 0;
  date.setMonth(month);
  date.setDate(day);
  date.setHours(hour, minutes, 0, 0);

  if (typeof groups.year !== 'undefined')
    date.setFullYear(year);
  else if (isPast(date))
    date.setFullYear(year + 1);

  const time = date.getTime();
  if (Number.isNaN(time) || (!options?.canBePast && isPast(date)))
    return err('dateError');
  return ok(date);
}
