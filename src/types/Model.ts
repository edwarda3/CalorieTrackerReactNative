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
}

export const getDefaultSettings = (): AppSettings => ({
    timeFormat: '12',
});
