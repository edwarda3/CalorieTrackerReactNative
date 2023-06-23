import { DatabaseHandler } from "../data/database";
import dayjs from 'dayjs';

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

export const getDateStringParts = (dateString: string): { year: string; month: string; day: string } => ({
    year: dateString.slice(0, 4),
    month: dateString.slice(5, 7),
    day: dateString.slice(8, 10),
});

export const getYearMonthIndex = (date: Date): string => `${date.toLocaleDateString('en-US', { year: 'numeric' })}-${date.toLocaleDateString('en-US', { month: '2-digit' })}`;

export const getOnlyDayOfMonth = (date: Date): string => date.toLocaleDateString('en-US', { day: '2-digit' });

export const getDateString = (date: Date): string => `${getYearMonthIndex(date)}-${getOnlyDayOfMonth(date)}`;

export const getTimeHourMinutes = (date: Date): string => {
    const hours = String(date?.getHours()).padStart(2, '0');
    const minutes = String(date?.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

export const formatTime = (time: string, format: '12'|'24') => {
    const [hoursStr, minutesStr] = time.split(":");
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);
    if (isNaN(hours) || isNaN(minutes)) {
        return `!!TIME_ERR`;
    }
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);

    // Format the time to AM/PM
    const formattedTime = date.toLocaleString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: format === '12',
    });

    return formattedTime;
}

// time refers to a 13:52 (MM:SS) timestamp.
export const formatToAmPm = (time: string) => formatTime(time, DatabaseHandler.getInstance().getAppSettingsBestEffortSync().timeFormat);

export const timeToFloat = (hhmm: string) => {
    const [hour, min] = hhmm.split(':');
    const minAs0To1 = Number(min) / 60;
    return Number(hour) + minAs0To1;
}

export const dayBefore = (date: Date): Date => new Date(date.getTime() - 24 * 60 * 60 * 1000);

export type DateFormat = 'Month DD, YYYY'
    | 'DD Month YYYY'
    | 'YYYY Month DD'
    | 'DD-MM-YYYY'
    | 'DD/MM/YYYY'
    | 'MM-DD-YYYY'
    | 'MM/DD/YYYY'
    | 'YYYY-MM-DD'
    | 'YYYY/MM/DD';

// TODO support more locales?
const getLongMonth = (date: Date) => date.toLocaleString('en-US', { month: 'long' });

export const defaultFormat: DateFormat = 'Month DD, YYYY';
const formatter: Record<DateFormat, (dateString: string, showDate: boolean) => string> = {
    // 'Month DD, YYYY': (date, showDate) => dayjs(date).toString(),
    'Month DD, YYYY': (date, showDate) => dayjs(date).format(showDate ? 'MMMM D, YYYY' : 'MMMM, YYYY'),
    'DD Month YYYY': (date, showDate) => dayjs(date).format(showDate ? 'D MMMM YYYY' : 'MMMM YYYY'),
    'YYYY Month DD': (date, showDate) => dayjs(date).format(showDate ? 'YYYY MMMM D' : 'YYYY MMMM'),
    'DD-MM-YYYY': (date, showDate) => dayjs(date).format(showDate ? 'DD-MM-YYYY' : 'MM-YYYY'),
    'DD/MM/YYYY': (date, showDate) => dayjs(date).format(showDate ? 'DD/MM/YYYY' : 'MM/YYYY'),
    'MM-DD-YYYY': (date, showDate) => dayjs(date).format(showDate ? 'MM-DD-YYYY' : 'MM-YYYY'),
    'MM/DD/YYYY': (date, showDate) => dayjs(date).format(showDate ? 'MM/DD/YYYY' : 'MM/YYYY'),
    'YYYY-MM-DD': (date, showDate) => dayjs(date).format(showDate ? 'YYYY-MM-DD' : 'YYYY-MM'),
    'YYYY/MM/DD': (date, showDate) => dayjs(date).format(showDate ? 'YYYY/MM/DD' : 'YYYY/MM'),
}

export const formatDateWithStyle = (dateString: string, style: DateFormat, showDate: boolean): string => {
    let formatFct = formatter[style];
    if (!formatFct) {
        formatFct = formatter[defaultFormat];
    }
    return formatFct(dateString, showDate);
}

export const formatDate = (dateString: string, showDate: boolean = true): string => formatDateWithStyle(dateString, DatabaseHandler.getInstance().getAppSettingsBestEffortSync().dateFormat, showDate);
