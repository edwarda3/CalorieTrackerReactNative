import _ from "lodash";
import { DateFormat, defaultFormat, formatDateWithStyle, formatTime, getDateString } from "./Dates";

export interface AppSettings {
    /**
     * Determines default time display between 12 and 24 hour formats
     */
    timeFormat: '12'|'24';
    /**
     * Determines default time display between 12 and 24 hour formats
     */
    dateFormat: DateFormat;
    /**
     * When navigating directly to the item page (not from the day page, such as from home or search),
     * determines whether to insert a day page inbetween the source page and the item page.
     * This influences whether going back from the item page goes to the containing day or to the source page directly.
     */
    itemPageHasIntermediateDayPage: boolean;
    /**
     * Determines if the "Add 1 Serving" context menu item will only show on today or on all days
     */
    addOneOnAllDays: boolean;
    /**
     * Determines whether the name field is auto-focused upon opening the item page
     */
    autoFocusMealName: AutoFocusMealNameOption;
    /**
     * Threshold values to color calendar days and show on day pages.
     */
    thresholds: Thresholds;
    /**
     * Controls whether rollover is enabled.
     * Rollover allows the user to "Quick add" or "Copy to Today" to the "previous day" if the current time is before the rolloverPeriod.
     * For instance, if someone quick-adds at 1:30AM (Late night situation), allows them to add to the previous day,
     * which is often contextually the same night.
     */
    enableRollover: boolean;
    /**
     * Whether the prompt the user to rollover if the time is before the rolloverPeriod.
     * If false, always rollsover.
     */
    promptForRollover: boolean;
    /**
     * The time until which the quick add option allows the user to roll over their entry to the previous day.
     * If rolling over, the time becomes 11:59. We DONT allow more than 24hour times, as that can affect graph rendering and analytics.
     */
    rolloverPeriod: string;
}

export type AutoFocusMealNameOption = 'always'|'newOnly'|'never';

export const settingsDescriptions: Record<keyof AppSettings, (settings: AppSettings) => string> = {
    timeFormat: (settings) => settings.timeFormat === '12' ? `3:00PM` : `15:00`,
    dateFormat: (settings) => formatDateWithStyle(getDateString(new Date()), settings.dateFormat, true),
    itemPageHasIntermediateDayPage: (settings) => `${settings.itemPageHasIntermediateDayPage ? `Show` : `Do not show`} the "Today" overview page after "Quick Add" or "Copy to Today" are used`,
    addOneOnAllDays: (settings) => `"Add 1 Serving" option ${settings.addOneOnAllDays ? 'will be shown on all days' : 'will only be shown for the current day'}`,
    autoFocusMealName: (settings) => settings.autoFocusMealName === 'newOnly' ? 'Focus the name field only when adding a new entry' : `${_.startCase(settings.autoFocusMealName)} focus the name field when opening a meal.`,
    thresholds: (_settings) => `Threshold values to color calendar days and show on day pages. Currently not editable.`,
    enableRollover: (settings) => `"Quick Add" or "Copy to Today" ${settings.enableRollover ? 'will' : 'will not'} add to the previous day if current time is before ${formatTime(settings.rolloverPeriod, settings.timeFormat)}.`,
    promptForRollover: (settings) => `If within the rollover period, ${settings.promptForRollover ? 'prompt' : 'do not prompt'} if adding to the previous day or current day.`,
    rolloverPeriod: (settings) => `Rollover ${settings.promptForRollover ? 'is prompted' : 'happens'} when current time is before ${formatTime(settings.rolloverPeriod, settings.timeFormat)}`,
};

export const getDefaultSettings = (): AppSettings => ({
    timeFormat: '12',
    dateFormat: defaultFormat,
    itemPageHasIntermediateDayPage: true,
    addOneOnAllDays: false,
    autoFocusMealName: 'newOnly',
    thresholds: getDefaultThresholds(),
    enableRollover: true,
    promptForRollover: true,
    rolloverPeriod: '03:00',
});

export type Thresholds = Record<number, Array<number>>
const getDefaultThresholds = (): Thresholds => ({
    0: [255, 182, 193], // pastel pink
    1000: [197, 182, 269], // light magenta
    1300: [207, 223, 250], // sky blue
    1600: [167, 222, 217], // teal
    1800: [144, 238, 144], // green
    2000: [205, 245, 157], // greenish-yellow
    2200: [255, 255, 0], // yellow
    2400: [252, 186, 3], // yellow-orange
    2600: [255, 127, 80], // orange
    3000: [224, 96, 96], // red
});
