
export const monthStrings = [
    'January',
    'Febrary',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

export const dayOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];

export const getDateStringParts = (dateString: string): {year: string; month: string; day: string} => ({
    year: dateString.slice(0,4),
    month: dateString.slice(5,7),
    day: dateString.slice(8,10),
});

export const getYearMonthIndex = (date: Date): string => `${date.toLocaleDateString('en-US', {year: 'numeric'})}-${date.toLocaleDateString('en-US', {month: '2-digit'})}`;

export const getOnlyDayOfMonth = (date: Date): string => date.toLocaleDateString('en-US', {day: '2-digit'});

export const getDateString = (date: Date): string => `${getYearMonthIndex(date)}-${getOnlyDayOfMonth(date)}`;
