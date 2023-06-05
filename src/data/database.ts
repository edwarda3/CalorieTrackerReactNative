import _ from "lodash";
import { DataStore, Database, MealData, MealPreset, MonthData } from "../types/Model";
import AsyncStorage from '@react-native-async-storage/async-storage';

export class DatabaseHandler {
    private static instance: DatabaseHandler;
    static getInstance() {
        if (!DatabaseHandler.instance) {
            DatabaseHandler.instance = new DatabaseHandler();
        }
        return DatabaseHandler.instance;
    }
    private static readonly prefix = '@swiwa_calories';

    private cache: Database;
    constructor() {
        this.cache = {};
    }

    public async getAllKnownData(): Promise<DataStore> {
        const keys = await AsyncStorage.getAllKeys();
        const dataStore = {
            database: {} as Database,
            presets: await this.getPresets(),
        };
        for (const key of keys) {
            if (!key.includes(DatabaseHandler.presetKey)) {
                const [_prefix, yearMonth] = key.split('/');
                const data = await this.getData(yearMonth);
                dataStore.database[yearMonth] = data;
            }
        }
        return dataStore;
    }
    public async importJsonFile(dataStore: DataStore): Promise<void> {
        console.log(`Importing ${Object.keys(dataStore.database).length} months and ${dataStore.presets.length} presets`);
        for (const key in dataStore.database) {
            await DatabaseHandler.getInstance().setData(key, dataStore.database[key]);
        }
        await DatabaseHandler.getInstance().setPresets(dataStore.presets);
    }

    private async getDataFromAsyncStore(key: string): Promise<MonthData> {
        try {
            const value = await AsyncStorage.getItem(`${DatabaseHandler.prefix}/${key}`);
            const monthData = JSON.parse(value ?? '{}') as MonthData;
            this.cache[key] = monthData;
            return monthData;
        } catch (err) {
            console.error(`Could not retrieve value for ${key}.`);
            return {};
        }
    }

    public async getData(yearMonthString: string): Promise<MonthData> {
        if (this.cache[yearMonthString]) {
            return this.cache[yearMonthString];
        } else {
            return this.getDataFromAsyncStore(yearMonthString);
        }
    };

    public async setData(key: string, monthData: MonthData): Promise<void> {
        console.log(`Setting the key ${key} with ${Object.keys(monthData).length} days`)
        this.cache[key] = monthData;
        await AsyncStorage.setItem(`${DatabaseHandler.prefix}/${key}`, JSON.stringify(monthData));
        return;
    }

    public async modifyEntry(dateString: string, originalName: string, originalTime: string, entry: MealData | null): Promise<void> {
        const key = dateString.slice(0, 7);
        const day = dateString.slice(8, 10);
        const yearMonth = await this.getData(key);
        const existingIndex = (yearMonth[day] ?? []).findIndex((meal) => meal.name === originalName && meal.time === originalTime);
        if (!entry) {
            if (existingIndex >= 0) {
                yearMonth[day].splice(existingIndex, 1);
            }
        } else if (existingIndex >= 0) {
            yearMonth[day][existingIndex] = entry;
        } else {
            if (!yearMonth[day]) {
                yearMonth[day] = [];
            }
            yearMonth[day].push(entry);
        }
        this.setData(key, yearMonth);
    }

    private static readonly presetKey = 'PRESETS';
    public async getPresets(): Promise<MealPreset[]> {
        try {
            const value = await AsyncStorage.getItem(`${DatabaseHandler.prefix}/${DatabaseHandler.presetKey}`);
            return JSON.parse(value ?? '[]') as MealPreset[];
        } catch (err) {
            console.error(`Could not retrieve value for presets.`);
            return [];
        }
    }
    public async setPresets(mealPresets: MealPreset[]): Promise<void> {
        try {
            console.log(`Setting the presets with ${Object.keys(mealPresets).length} presets`)
            await AsyncStorage.setItem(`${DatabaseHandler.prefix}/${DatabaseHandler.presetKey}`, JSON.stringify(mealPresets));
            return
        } catch (err) {
            console.error(`Could not set value for presets.`);
            return;
        }
    }
}
