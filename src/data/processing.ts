import _ from "lodash";
import { DataStore, MealData, MealPreset } from "../types/Model";
import { getDefaultSettings } from "../types/Settings";

export function sortMealsByTime(meals: MealData[]): MealData[] {
    return meals.sort((a, b) => {
        const timeA = a.time.split(':');
        const timeB = b.time.split(':');

        const hourA = parseInt(timeA[0]);
        const hourB = parseInt(timeB[0]);

        const minuteA = parseInt(timeA[1]);
        const minuteB = parseInt(timeB[1]);

        if (hourA !== hourB) {
            return hourA - hourB;
        } else {
            return minuteA - minuteB;
        }
    });
}

export function validateJsonStringAsDatastore(jsonString: string): DataStore {
    try {
        // First validate the type is correct
        const parsed = JSON.parse(jsonString);
        if (typeof parsed !== 'object') {
            throw 'Object must be a valid JSON object';
        }
        const requiredKeys = ['database', 'presets', 'settings'];
        if (_.intersection(Object.keys(parsed), requiredKeys).length !== 3) {
            throw `JSON must have the top-level keys: ${requiredKeys.join(', ')}`;
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
            if (_.isEmpty(preset.id)) throw `Preset is missing an id.`;
            if (typeof preset.kcalPerServing !== 'number' || preset.kcalPerServing <= 0)
                throw `KcalPerServing of preset ${preset.name} must be a positive number.`;
        }
        if (dataStore.settings.thresholds) {
            _.forOwn(dataStore.settings.thresholds, (color, key) => {
                if (isNaN(Number(key))) {
                    throw `All threshold strings must be numbers. ${key} was NaN`;
                }
                if (!color || color.length !== 3) {
                    throw `Threshold colors must be specified as an array of [red, green, blue] where each value is between 0-255`;
                }
            })
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
        settings: getDefaultSettings(),
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
                    const sorted = sortMealsByTime(pruned);
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
            mergedDataStore.database[newKey] = mergingDataStore.database[newKey];
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

    mergedDataStore.settings = {
        ...(getDefaultSettings()),
        ...(mergingDataStore.settings ?? {}),
        ...(preferredDataStore.settings ?? {})
    };

    return mergedDataStore;
}