export interface DataStore {
    database: Database;
    presets: MealPreset[];
    settings: AppSettings;
};

// key string is YYYY-MM with MM being 01-12
export type Database = Record<string, MonthData>;

export interface MonthData {
    [dateNumber: string]: MealData[];
}

export interface MealData {
    time: string;
    name: string;
    servings: number;
    kcalPerServing: number;
}

export type MealPreset = Omit<MealData, 'time'|'servings'> & { id: string };

export interface AppSettings {
    timeFormat: '12'|'24';
    itemPageHasIntermediateDayPage: boolean;
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
