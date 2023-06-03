import React, { useCallback, useEffect, useState } from 'react';
import * as _ from 'lodash';
import { Button, SafeAreaView, Text } from 'react-native';
import { NavigatedScreenProps, NavigationPages } from '../types/Navigation';
import { Calendar } from 'react-native-calendars';
import { getYearMonthIndex } from '../types/Dates';
import { Database } from '../types/Model';
import { MarkedDates } from 'react-native-calendars/src/types';
import { DatabaseHandler } from '../data/database';
import { getTotalCaloriesInADay } from './DayPage';
import { useFocusEffect } from '@react-navigation/native';
import { YearMonthStats } from './ProfilePage';
import Collapsible from 'react-native-collapsible';

function getColorPerCalories(kcal: number) {
    if (kcal >= 3000) return 'red';
    if (kcal >= 2400) return 'orange';
    if (kcal >= 2000) return 'yellow';
    if (kcal >= 1750) return 'lightgreen';
    if (kcal >= 1500) return 'lightblue';
    if (kcal >= 1000) return 'pink';
    else return 'magenta';
}

export function CalendarPage({ navigation }: NavigatedScreenProps): JSX.Element {
    const [database, setDatabase] = useState<Database>({});
    const [currentYearMonth, setCurrentYearMonth] = useState<string>(getYearMonthIndex(new Date()))
    const [showingLegend, setShowingLegend] = useState<boolean>(false);

    const fetchNewEntryForDatabase = async (key: string) => {
        if (database[key]) {
            return;
        } else {
            const monthData = await DatabaseHandler.getInstance().getData(key)
            setDatabase({
                ...database,
                [key]: monthData
            });
        }
    }

    useEffect(() => {
        navigation.setOptions({
            title: 'Calendar',
            headerRight: () => <Button title='Today' onPress={() => (navigation.navigate(NavigationPages.DAY))} />
        });
        fetchNewEntryForDatabase(currentYearMonth);
    });

    const markedDates: MarkedDates = {};
    _.forOwn(database, (monthData, yearMonthKey) => {
        _.forEach(monthData, (mealData, date) => {
            const totalCaloriesForDay = getTotalCaloriesInADay(mealData);
            if (totalCaloriesForDay > 0) {
                markedDates[`${yearMonthKey}-${date}`] = {
                    startingDay: true,
                    endingDay: true,
                    color: getColorPerCalories(totalCaloriesForDay),
                };
            }
        });
    });
    return (
        <SafeAreaView>
            <Calendar
                enableSwipeMonths={true}
                onDayPress={(day) => navigation.navigate(NavigationPages.DAY, { dateString: day.dateString })}
                onMonthChange={(day) => {
                    const key = getYearMonthIndex(new Date(day.dateString));
                    fetchNewEntryForDatabase(key);
                    setCurrentYearMonth(key);
                }}
                markingType='period'
                markedDates={markedDates}
            />
            <Button title={showingLegend ? 'Hide Legend' : 'Show Legend'} onPress={() => setShowingLegend(!showingLegend)} />
            <Collapsible collapsed={!showingLegend} style={{alignItems: 'center'}}>
                {_.map([0, 1000, 1500, 1750, 2000, 2400, 3000], (threshold) => (
                    <Text key={threshold} style={{
                        backgroundColor: getColorPerCalories(threshold),
                        padding: 3,
                        width: 200,
                        margin: 2,
                        textAlign: 'center',
                    }}>
                        Kcal &gt; {threshold}
                    </Text>
                ))}
            </Collapsible>
            {database[currentYearMonth] && <YearMonthStats monthData={database[currentYearMonth]} />}
        </SafeAreaView>
    );
}