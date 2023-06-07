export interface AppSettings {
    /**
     * Determines default time display between 12 and 24 hour formats
     */
    timeFormat: '12'|'24';
    /**
     * When navigating directly to the item page (not from the day page, such as from home or search),
     * determines whether to insert a day page inbetween the source page and the item page.
     * This influences whether going back from the item page goes to the containing day or to the source page directly.
     */
    itemPageHasIntermediateDayPage: boolean;
    /**
     * Threshold values to color calendar days and show on day pages.
     */
    thresholds: Thresholds;
}

export const getDefaultSettings = (): AppSettings => ({
    timeFormat: '12',
    itemPageHasIntermediateDayPage: true,
    thresholds: getDefaultThresholds(),
});

export type Thresholds = Record<number, Array<number>>
const getDefaultThresholds = (): Thresholds => ({
    3000: [224, 96, 96],
    2400: [255, 127, 80],
    2000: [255, 255, 0],
    1750: [144, 238, 144],
    1500: [173, 216, 230],
    1000: [255, 182, 193],
    0: [197, 182, 269],
});
