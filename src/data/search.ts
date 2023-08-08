import _ from "lodash";
import { getDateString } from "../types/Dates";
import { Database, MealData } from "../types/Model";

export interface DaySearchResult {
    dateString: string;
    dayResult: MealData[];
    matchedItemTotalKcal: number;
    daySearchTotalKcal: number;
};

export const MINIMUM_NAME_SEARCH_LENGTH = 3;

export const filterNameByRegexIfValid = (regexFilter: string, kcalFilter: number, mealDataList: MealData[]): MealData[] => {
    let regex: RegExp | null;
    try {
        regex = new RegExp(regexFilter.replace('*', '.*').trim(), 'i');
    } catch (err) {
        regex = null
    }
    return mealDataList.filter((mealData) => {
        const nameMatches = !!regex ? regex.test(mealData.name.trim()) : mealData.name.toLowerCase().trim().includes(regexFilter.toLowerCase());
        const caloriesMeetMinumum = (mealData.kcalPerServing * mealData.servings) >= Number(kcalFilter);
        return nameMatches && caloriesMeetMinumum;
    });
}

export interface SearchForMealsOptions {
    database: Database;
    nameFilter: string;
    minimumKcalFilter?: number;
    minDate?: Date;
    maxDate?: Date;
    startFromDateString?: string | null;
    maxResults?: number;
}

export interface SearchForMealOutput {
    searchResult: Array<DaySearchResult>;
    searchFoundCount: number;
    cursor: string|null;
}

export const searchForMeals = (options: SearchForMealsOptions): SearchForMealOutput => {
    const { database } = options;
    if (_.isEmpty(options.nameFilter?.trim())) {
        return {
            searchResult: [],
            searchFoundCount: 0,
            cursor: null
        };
    }
    // key of map will be date in YYYY-MM-DD form.
    const searchResult: Array<DaySearchResult> = [];
    let totalEntryCount = 0;
    for (const ymKey of Object.keys(database).sort().reverse()) {
        for (const dayKey of Object.keys(database[ymKey]).sort().reverse()) {
            const dateString = `${ymKey}-${dayKey}`;
            if (
                (options.startFromDateString && dateString >= options.startFromDateString) ||
                (options.minDate && dateString < getDateString(options.minDate)) ||
                (options.maxDate && dateString > getDateString(options.maxDate))
            ) {
                continue;
                // pass
            } else {
                const matchedEntriesInThatDay = filterNameByRegexIfValid(options.nameFilter, options.minimumKcalFilter ?? 0, database[ymKey][dayKey]);
                if (!_.isEmpty(matchedEntriesInThatDay)) {
                    const totalSum: number = database[ymKey][dayKey].reduce((acc, current) => acc + (current.kcalPerServing * current.servings), 0);
                    const matchedSum = matchedEntriesInThatDay.reduce((acc, current) => acc + (current.kcalPerServing * current.servings), 0)
                    searchResult.push({
                        dateString,
                        dayResult: matchedEntriesInThatDay,
                        matchedItemTotalKcal: matchedSum,
                        daySearchTotalKcal: totalSum,
                    });
                }
                totalEntryCount += matchedEntriesInThatDay.length;
                if (options.maxResults && totalEntryCount >= options.maxResults) { 
                    return { searchResult, searchFoundCount: totalEntryCount, cursor: dateString };
                }
            }
        }
    }
    return { searchResult, searchFoundCount: totalEntryCount, cursor: null };
}