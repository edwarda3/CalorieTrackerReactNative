import React, { useCallback, useEffect, useState } from 'react';
import * as _ from 'lodash';
import { Button, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { NavigatedScreenProps, NavigationPages } from '../types/Navigation';
import { Calendar } from 'react-native-calendars';
import { formatDate, formatToAmPm, getDateStringParts, getYearMonthIndex, monthStrings } from '../types/Dates';
import { Database } from '../types/Model';
import { AppSettings } from '../types/Settings';
import { MarkedDates } from 'react-native-calendars/src/types';
import { DatabaseHandler } from '../data/database';
import { getTotalCaloriesInADay } from './DayPage';
import { useFocusEffect } from '@react-navigation/native';
import Collapsible from 'react-native-collapsible';
import { bespokeStyle, styles } from '../styles/Styles';
import ContextMenu from 'react-native-context-menu-view';
import { ThresholdBar, getColorPerCalories } from '../components/ThresholdBar';
import { InsightsChart } from '../components/InsightsCharts';
import { YearMonthStats } from '../components/YearMonthStats';

export const getSurroundingMonths = (ymKey: string): { previousMonth: string; nextMonth: string } => {
    const year = ymKey.slice(0, 4);
    const month = ymKey.slice(5, 7);
    const previousMonth = Number(month) - 1 <= 0 ?
        `${(Number(year) - 1).toString().padStart(4, '0')}-12` :
        `${year}-${(Number(month) - 1).toString().padStart(2, '0')}`;
    const nextMonth = Number(month) + 1 > 12 ?
        `${(Number(year) + 1).toString().padStart(4, '0')}-01` :
        `${year}-${(Number(month) + 1).toString().padStart(2, '0')}`;
    return { previousMonth, nextMonth };
}

export function CalendarPage({ navigation }: NavigatedScreenProps): JSX.Element {
    const [database, setDatabase] = useState<Database>(DatabaseHandler.getInstance().getCachedData());
    const [settings, setSettings] = useState<AppSettings>(DatabaseHandler.getInstance().getAppSettingsBestEffortSync());
    const [currentYearMonth, setCurrentYearMonth] = useState<string>(getYearMonthIndex(new Date()))

    // Gets the data for the month and the prev and future months.
    const refreshDatabaseForMonth = async (ymKey: string) => {
        const { previousMonth, nextMonth } = getSurroundingMonths(ymKey);
        const monthData = await DatabaseHandler.getInstance().getData(ymKey)
        const prevMonthData = await DatabaseHandler.getInstance().getData(previousMonth)
        const nextMonthData = await DatabaseHandler.getInstance().getData(nextMonth)
        setDatabase({
            ...database,
            [ymKey]: monthData,
            [previousMonth]: prevMonthData,
            [nextMonth]: nextMonthData,
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
        DatabaseHandler.getInstance().getAppSettings().then((appSettings) => setSettings(appSettings));
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
        <SafeAreaView style={{
            flex: 1, // cuts off the render at the bottom of the screen edge, to prevent FlatList from extending past the screen.
        }}>
            <ScrollView>
                <ThresholdBar threshold={settings.thresholds} />
                <Calendar
                    enableSwipeMonths={true}
                    onDayPress={(day) => navigation.navigate(NavigationPages.DAY, { dateString: day.dateString })}
                    onMonthChange={(day) => {
                        const key = getYearMonthIndex(new Date(day.dateString));
                        refreshDatabaseForMonth(key);
                        setCurrentYearMonth(key);
                    }}
                    renderHeader={(date: string) => {
                        return <View style={{ flexDirection: 'column' }}>
                            <Text style={styles.label}>{formatDate(new Date(date), false)}</Text>
                        </View>
                    }}
                    dayComponent={(dayProps) => {
                        if (dayProps && dayProps.date) {
                            const { year, month, day } = getDateStringParts(dayProps.date.dateString);
                            // We set this as kcal on purpose when we setup markedDates
                            const dayKcals = Number(dayProps.marking?.color);
                            const inCurrentMonth = currentYearMonth === `${year}-${month}`;
                            const backgroundColor = getColorPerCalories(
                                settings.thresholds,
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
                                            { title: `${formatDate(new Date(dayProps.date.dateString))} - ${dayKcals}kcals` },
                                            ..._.map(databaseInfo ?? [], (mealData) => ({
                                                title: `[${formatToAmPm(mealData.time)}] ${_.startCase(mealData.name)}`,
                                                subtitle: `(${mealData.servings} × ${mealData.kcalPerServing}kcal) → ${mealData.kcalPerServing * mealData.servings}kcal`,
                                                disabled: true,
                                            }))
                                        ]
                                    }
                                    onPress={() => {
                                        dayProps.date?.dateString && navigation.navigate(NavigationPages.DAY, { dateString: dayProps.date.dateString })
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
                {database[currentYearMonth] && (
                    // <ScrollView style={{ flexDirection: 'column' }}>
                    // </ScrollView>
                    <InsightsChart monthData={database[currentYearMonth]} thresholds={settings.thresholds} />
                )}
            </ScrollView>
        </SafeAreaView>
    );
}