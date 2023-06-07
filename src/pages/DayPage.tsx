import React, { useCallback, useEffect, useState } from 'react';
import { Button, FlatList, Pressable, SafeAreaView, Text, View } from 'react-native';
import { NavigatedScreenProps, NavigationPages } from '../types/Navigation';
import _ from 'lodash';
import { getDateString } from '../types/Dates';
import { MealData } from '../types/Model';
import { DatabaseHandler } from '../data/database';
import { useFocusEffect } from '@react-navigation/native';
import ContextMenu from 'react-native-context-menu-view';
import {  styles } from '../styles/Styles';
import { sortMealsByTime } from '../data/processing';
import { MealEntryListItem } from '../components/MealEntryListItem';

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
        setMealData(sortMealsByTime(monthData[day] ?? []));
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

    return (
        <SafeAreaView style={{
            flex: 1, // cuts off the render at the bottom of the screen edge, to prevent FlatList from extending past the screen.
        }}>
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
                renderItem={({ item }) => (
                    <MealEntryListItem
                        meal={item}
                        actions={[
                            { title: 'Edit', onPress: () => {
                                props.navigation.navigate(NavigationPages.ITEM, {
                                    ...options,
                                    itemName: item.name,
                                    itemTime: item.time,
                                })
                            } },
                            { title: 'Delete', destructive: true, onPress: () => {
                                DatabaseHandler.getInstance().modifyEntry(
                                    options.dateString,
                                    item.name,
                                    item.time,
                                    null
                                ).then(refresh);
                            } }
                        ]}
                    />
                )}
                keyExtractor={item => item.id}
                refreshing={refreshing}
                onRefresh={refresh}
            />
        </SafeAreaView>
    );
}