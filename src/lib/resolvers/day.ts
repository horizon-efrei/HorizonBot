import type { Result } from '@sapphire/framework';
import { err, ok } from '@sapphire/framework';

const DATE_REGEX = /^(?<day>\d{1,2})[/-](?<month>\d{1,2})(?:[/-](?<year>\d{1,4}))?$/imu;

export default function resolveDay(parameter: string): Result<Date, 'dayError'> {
  if (!DATE_REGEX.test(parameter))
    return this.error({ parameter });

  const groups = DATE_REGEX.exec(parameter)?.groups;
  const date = new Date();
  // Start by settings the day to 1, so when we set the month we don't have any problem with months
  // that are not 31 days long. (this took me hours of debugging)
  date.setDate(1);
  const month = Number.parseInt(groups?.month, 10) - 1;
  const day = Number.parseInt(groups?.day, 10);
  const year = Number.parseInt(groups?.year, 10);
  date.setMonth(month);
  date.setDate(day);
  date.setHours(0, 0, 0, 0);

  if (groups.year)
    date.setFullYear(year);
  else if (month < new Date().getMonth())
    date.setFullYear(year + 1);

  const time = date.getTime();
  if (Number.isNaN(time))
    return err('dayError');
  return ok(date);
}
