import React, { useCallback, useEffect, useState } from 'react';
import * as _ from 'lodash';
import { Button, Pressable, SafeAreaView, Text, View } from 'react-native';
import { NavigatedScreenProps, NavigationPages } from '../types/Navigation';
import { Calendar } from 'react-native-calendars';
import { formatToAmPm, getDateStringParts, getYearMonthIndex, monthStrings } from '../types/Dates';
import { Database } from '../types/Model';
import { MarkedDates } from 'react-native-calendars/src/types';
import { DatabaseHandler } from '../data/database';
import { getTotalCaloriesInADay } from './DayPage';
import { useFocusEffect } from '@react-navigation/native';
import { YearMonthStats } from './ProfilePage';
import Collapsible from 'react-native-collapsible';
import { bespokeStyle, styles } from '../styles/Styles';
import ContextMenu from 'react-native-context-menu-view';

function getColorPerCalories(kcal: number, offset = 0, transparency = 1) {
    if (!kcal) return `rgba(255,255,255,0)`;
    const [red, blue, green] = ((kcal: number): number[] => {
        if (kcal >= 3000) return [224, 96, 96];
        if (kcal >= 2400) return [255, 127, 80];
        if (kcal >= 2000) return [255, 255, 0];
        if (kcal >= 1750) return [144, 238, 144];
        if (kcal >= 1500) return [173, 216, 230];
        if (kcal >= 1000) return [255, 182, 193];
        else return [197, 182, 269];
    })(kcal).map((hueValue) => _.clamp(hueValue + offset, 0, 255));
    return `rgba(${red},${blue},${green},${transparency})`;
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
            `${(Number(year) - 1).toString().padStart(4, '0')}-12` :
            `${year}-${(Number(month) - 1).toString().padStart(2, '0')}`;
        const futureMonth = Number(month) + 1 > 12 ?
            `${(Number(year) + 1).toString().padStart(4, '0')}-01` :
            `${year}-${(Number(month) + 1).toString().padStart(2, '0')}`;
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
                    color: totalCaloriesForDay.toString()
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
                dayComponent={(dayProps) => {
                    if (dayProps && dayProps.date) {
                        const { year, month, day } = getDateStringParts(dayProps.date.dateString);
                        // We set this as kcal on purpose when we setup markedDates
                        const dayKcals = Number(dayProps.marking?.color);
                        const inCurrentMonth = currentYearMonth === `${year}-${month}`;
                        const backgroundColor = getColorPerCalories(
                            dayKcals,
                            inCurrentMonth ? 0 : 30,
                            inCurrentMonth ? 1 : 0.5,
                        );
                        const databaseInfo = database?.[`${year}-${month}`]?.[day];
                        return (
                            <ContextMenu
                                key={dayProps.date.dateString}
                                // Basically an expandable details section using the actions submenus
                                actions={database &&
                                    [
                                        {title: `${monthStrings[Number(month)-1]} ${day} ${year} - ${dayKcals}kcals`},
                                        ..._.map(databaseInfo ?? [], (mealData) => ({
                                            title: `[${formatToAmPm(mealData.time)}] ${_.startCase(mealData.name)}`,
                                            subtitle: `(${mealData.servings} × ${mealData.kcalPerServing}kcal) → ${mealData.kcalPerServing * mealData.servings}kcal`,
                                            disabled: true,
                                        }))
                                    ]
                                }
                                onPress={() => {
                                    navigation.navigate(NavigationPages.DAY, { dateString: dayProps.date?.dateString })
                                }}
                                disabled={_.isEmpty(databaseInfo)}
                            >
                                <Pressable
                                    style={{
                                        borderRadius: 5,
                                        backgroundColor,
                                        padding: 4,
                                        width: 50,
                                        height: 50,
                                    }}
                                    onPress={() => dayProps.onPress?.(dayProps.date)}
                                >
                                    <View style={{ flexDirection: 'row', padding: 4 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '400' }}>{dayProps.date.day}</Text>
                                    </View>
                                    {dayKcals > 0 && <View style={{ flexDirection: 'row-reverse' }}>
                                        <Text style={bespokeStyle('subLabel', { fontWeight: '300' })}>{dayKcals}</Text>
                                    </View>}
                                </Pressable>

                            </ContextMenu>
                        );
                    } return null;
                }}
                markingType='period'
                markedDates={markedDates}
            />
            <Button title={showingLegend ? 'Hide Legend' : 'Show Legend'} onPress={() => setShowingLegend(!showingLegend)} />
            <Collapsible collapsed={!showingLegend} style={{ alignItems: 'center' }}>
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