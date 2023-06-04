import _ from "lodash";
import { DataStore, Database, MealData, MealPreset, MonthData } from "../types/Model";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sortEntries } from "../pages/DayPage";

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

export function validateJsonStringAsDatastore(jsonString: string): DataStore {
    try {
        // First validate the type is correct
        const parsed = JSON.parse(jsonString);
        if (typeof parsed !== 'object') {
            throw 'Object must be a valid JSON object';
        }
        if (_.union(Object.keys(parsed), ['database', 'presets']).length !== 2) {
            throw 'JSON must have `database` and `presets` top-level fields.';
        }
        const dataStore = parsed as DataStore;

        // Validate the database object
        if (typeof dataStore.database !== 'object' || Array.isArray(dataStore.database)) {
            throw 'Database must be an object with year-month prefixes as keys';
        }
        for (const ymKey of Object.keys(dataStore.database)) {
            if (!(/^\d{4}-\d{2}$/.test(ymKey))) {
                throw `Keys of the database must be of the format 'YYYY-MM', ${ymKey} does not match`;
            }
            for (const dayKey of Object.keys(dataStore.database[ymKey])) {
                if (!(/^\d{2}$/.test(dayKey))) {
                    throw `Keys of a month must be of the format 'DD', ${ymKey}.${dayKey} does not match`;
                }
                const meals = dataStore.database[ymKey][dayKey];
                for (const meal of meals) {
                    if (_.isEmpty(meal.name)) throw `Meal in ${ymKey}.${dayKey} is missing a name.`;
                    if (_.isEmpty(meal.time)) throw `Meal in ${ymKey}.${dayKey} is missing a time.`;
                    if (typeof meal.servings !== 'number' || meal.servings <= 0)
                        throw `Servings of ${meal.name} in ${ymKey}.${dayKey} must be a positive number.`;
                    if (typeof meal.kcalPerServing !== 'number' || meal.kcalPerServing <= 0)
                        throw `KcalPerServing of ${meal.name} in ${ymKey}.${dayKey} must be a positive number.`;
                }
            }
        }

        // validate presets
        if (typeof dataStore.presets !== 'object' || !Array.isArray(dataStore.presets)) {
            throw `Presets must be an array.`;
        }
        for (const preset of dataStore.presets) {
            if (_.isEmpty(preset.name)) throw `Preset is missing a name.`;
            if (typeof preset.kcalPerServing !== 'number' || preset.kcalPerServing <= 0)
                throw `KcalPerServing of preset ${preset.name} must be a positive number.`;
        }
        return dataStore;
    } catch (err) {
        throw new Error(`Failed to validate data. ${err}`);
    }
}

export interface MergeDataStoreInput {
    preferredDataStore: DataStore;
    mergingDataStore: DataStore;
}

export function mergeDataStores({ preferredDataStore, mergingDataStore }: MergeDataStoreInput): DataStore {
    const mergedDataStore: DataStore = {
        database: {},
        presets: [],
    };

    // merge calendar database
    for (const existingKey of Object.keys(preferredDataStore.database)) {
        if (Object.keys(mergingDataStore.database).includes(existingKey)) {
            mergedDataStore.database[existingKey] = {}
            for (const existingDay of Object.keys(preferredDataStore.database[existingKey])) {
                if (Object.keys(mergingDataStore.database[existingKey]).includes(existingDay)) {
                    // Combine the data entries, starting with the perferred store.
                    const combinedDayEntries: MealData[] = [
                        ...preferredDataStore.database[existingKey][existingDay],
                        ...mergingDataStore.database[existingKey][existingDay],
                    ];
                    // Take new entries unless they were already added, effectively removing duplicates favoring those that appeared first (preferred)
                    const pruned = _.reduce(combinedDayEntries, (acc, curr) => {
                        if (!acc.find((savedData) => savedData.name === curr.name && savedData.time === curr.time)) {
                            acc.push(curr);
                        }
                        return acc;
                    }, [] as MealData[]);
                    // Sort it as time entries may have gone out-of-order
                    const sorted = sortEntries(pruned);
                    mergedDataStore.database[existingKey][existingDay] = sorted;
                } else {
                    mergedDataStore.database[existingKey][existingDay] = preferredDataStore.database[existingKey][existingDay];
                }
            }
            // In each month key, if the existing store did not have a date that exists in the new store, we need to bring the new key in.
            for (const newDay of Object.keys(mergingDataStore.database[existingKey])) {
                if (!Object.keys(mergedDataStore.database[existingKey]).includes(newDay)) {
                    mergedDataStore.database[existingKey][newDay] = mergingDataStore.database[existingKey][newDay];
                }
            }
        } else {
            mergedDataStore.database[existingKey] = preferredDataStore.database[existingKey];
        }
    }
    // now we need to handle month keys that only exist in the new store.
    for (const newKey of Object.keys(mergingDataStore.database)) {
        if (!Object.keys(mergedDataStore.database).includes(newKey)) {
            mergedDataStore.database[newKey] = mergedDataStore.database[newKey];
        }
    }

    // merge presets, using same combinatiton and filtering as mealdata.
    const combinedPresets: MealPreset[] = [
        ...preferredDataStore.presets,
        ...mergingDataStore.presets,
    ];
    const pruned = _.reduce(combinedPresets, (acc, curr) => {
        if (!acc.find((savedData) => savedData.id === curr.id)) {
            acc.push(curr);
        }
        return acc;
    }, [] as MealPreset[]);
    mergedDataStore.presets = pruned;

    return mergedDataStore;
}