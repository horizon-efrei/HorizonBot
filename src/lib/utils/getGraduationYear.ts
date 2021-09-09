import dayjs from 'dayjs';
import { SchoolYear } from '../types';

const yearsLeft = {
  [SchoolYear.L1]: 5,
  [SchoolYear.L2]: 4,
  [SchoolYear.L3]: 3,
};

export default function getGraduationYear(schoolYear: SchoolYear): number {
  const today = dayjs();
  if (today.month() >= 7) // If current month is August or after
    return today.year() + yearsLeft[schoolYear];
  return today.year() + yearsLeft[schoolYear] - 1;
}
