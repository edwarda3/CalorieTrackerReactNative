import React, { useCallback, useEffect, useState } from 'react';
import { Button, FlatList, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NavigatedScreenProps, NavigationPages } from '../types/Navigation';
import _ from 'lodash';
import { getDateString, getDateStringParts, monthStrings } from '../types/Dates';
import { MealData } from '../types/Model';
import { DatabaseHandler } from '../data/database';
import { useFocusEffect } from '@react-navigation/native';
import ContextMenu from 'react-native-context-menu-view';
import { bespokeStyle, styles } from '../styles/Styles';

export interface DayPageParams {
    dateString: string;
}

export function getDefaultDayPageParams(): DayPageParams {
    return {
        dateString: getDateString(new Date())
    }
}

export function getTotalCaloriesInADay(mealData: MealData[]): number {
    return _.reduce(mealData.filter((meal) => !!meal), (totalKcal, meal) => totalKcal += (meal.kcalPerServing * meal.servings), 0);
}

function sortEntries(meals: MealData[]): MealData[] {
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

export function DayPage(props: NavigatedScreenProps): JSX.Element {
    const { params } = props.route;
    const options: DayPageParams = _.defaults(params as any, getDefaultDayPageParams())

    const [mealData, setMealData] = useState<MealData[]>([]);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const refresh = async () => {
        setRefreshing(true);
        const key = options.dateString.slice(0, 7);
        const day = options.dateString.slice(8, 10);
        const monthData = await DatabaseHandler.getInstance().getData(key);
        setMealData(sortEntries(monthData[day] ?? []));
        setRefreshing(false);
    }

    useEffect(() => {
        props.navigation.setOptions({
            title: options.dateString
        });
        refresh();
    }, []);

    useFocusEffect(
        useCallback(() => {
            refresh();
            return () => { };
        }, [])
    );

    const getItemView = (meal: MealData) => (
        <ContextMenu
            previewBackgroundColor='rgba(0,0,0,0)'
            actions={[
                { title: 'Edit' },
                { title: 'Delete', destructive: true }
            ]}
            onPress={({ nativeEvent }) => {
                if (nativeEvent.name === 'Edit') {
                    props.navigation.navigate(NavigationPages.ITEM, {
                        ...options,
                        itemName: meal.name,
                        itemTime: meal.time,
                    });
                } else if (nativeEvent.name === 'Delete') {
                    DatabaseHandler.getInstance().modifyEntry(
                        options.dateString,
                        meal.name,
                        meal.time,
                        null
                    ).then(refresh);
                }
            }}>
            <View style={{ padding: 10, flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                <View style={{ flexDirection: 'column', flexGrow: 1, flexShrink: 1 }}>
                    <Text style={styles.subLabel}>{meal.time}</Text>
                    <Text style={styles.label}>{_.startCase(meal.name)}</Text>
                </View>
                <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Text style={styles.subLabel}>{meal.servings} Serving(s)</Text>
                    <Text style={styles.subLabel}>{meal.kcalPerServing} kcal/serving</Text>
                </View>
                <Text style={styles.label}>{meal.servings * meal.kcalPerServing}kcal</Text>
            </View>
        </ContextMenu>
    )

    return (
        <SafeAreaView>
            <View style={{ padding: 10, flexDirection: 'row', gap: 20 }}>
                <Pressable style={{ flexGrow: 1 }} onPress={refresh}>
                    <Text style={styles.title}>Total Calories: {getTotalCaloriesInADay(mealData)}</Text>
                </Pressable>
                <Button title='Add' onPress={() => props.navigation.navigate(NavigationPages.ITEM, options)} />
            </View>
            <FlatList
                data={_.map(mealData.filter(meal => !!meal), (meal) => ({
                    ...meal,
                    id: `${meal.time}-${meal.name}`,
                }))}
                renderItem={({ item }) => getItemView(item)}
                keyExtractor={item => item.id}
                refreshing={refreshing}
                onRefresh={refresh}
            />
        </SafeAreaView>
    );
}