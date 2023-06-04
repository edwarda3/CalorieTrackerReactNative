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

    // Gets the data for the month and the prev and future months.
    const refreshDatabaseForMonth = async (ymKey: string) => {
        const year = ymKey.slice(0, 4);
        const month = ymKey.slice(5, 7);
        const prevMonth = Number(month) - 1 <= 0 ?
            `${(Number(year)-1).toString().padStart(4, '0')}-12` :
            `${year}-${(Number(month)-1).toString().padStart(2, '0')}`;
        const futureMonth = Number(month) + 1 > 12 ?
            `${(Number(year)+1).toString().padStart(4, '0')}-01` :
            `${year}-${(Number(month)+1).toString().padStart(2, '0')}`;
        console.log(`Fetching months: ${prevMonth}, ${ymKey}, ${futureMonth}`);
        const monthData = await DatabaseHandler.getInstance().getData(ymKey)
        const prevMonthData = await DatabaseHandler.getInstance().getData(prevMonth)
        const futureMonthData = await DatabaseHandler.getInstance().getData(futureMonth)
        setDatabase({
            ...database,
            [ymKey]: monthData,
            [prevMonth]: prevMonthData,
            [futureMonth]: futureMonthData,
        });
    }

    useEffect(() => {
        navigation.setOptions({
            title: 'Calendar',
            headerRight: () => <Button title='Today' onPress={() => (navigation.navigate(NavigationPages.DAY))} />
        });
    });

    useFocusEffect(useCallback(() => {
        refreshDatabaseForMonth(currentYearMonth);
    }, []));

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
                    refreshDatabaseForMonth(key);
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