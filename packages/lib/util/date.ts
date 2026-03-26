import { formatInTimeZone } from 'date-fns-tz';
import { isValid } from 'date-fns';

const ukTimeZone = 'Europe/London';

export function formatDateForDisplay(
	date: string | number | Date,
	{ format = 'd MMM yyyy' } = { format: 'd MMM yyyy' }
) {
	if (!date || !isValid(new Date(date))) return '';

	return formatInTimeZone(date, ukTimeZone, format);
}
