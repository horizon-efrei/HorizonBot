import type { ArgumentContext, ArgumentResult } from '@sapphire/framework';
import { Argument } from '@sapphire/framework';

const DATE_REGEX = /^(?<day>\d{1,2})[/-](?<month>\d{1,2})$/imu;

export default class HourArgument extends Argument<Date> {
  public run(arg: string, _context: ArgumentContext<Date>): ArgumentResult<Date> {
    if (!DATE_REGEX.test(arg))
      return null;

    const groups = DATE_REGEX.exec(arg)?.groups;
    const date = new Date();
    date.setMonth(Number.parseInt(groups?.month, 10) - 1);
    date.setDate(Number.parseInt(groups?.day, 10));
    date.setHours(0, 0, 0, 0);

    const time = date.getTime();
    if (Number.isNaN(time))
      return this.error({ parameter: arg });

    return this.ok(date);
  }
}
