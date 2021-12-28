import dayjs from 'dayjs';

/**
 * Gets the first day of the current semester
 * @returns The dayjs object representing the first day of the current semester
 */
export default function firstSemesterDay(): dayjs.Dayjs {
  const today = dayjs();
  if (today.month() >= 1 && today.month() <= 6)
    return today.startOf('year').set('month', 1);
  return today.subtract(2, 'months').startOf('year').set('month', 8);
}
