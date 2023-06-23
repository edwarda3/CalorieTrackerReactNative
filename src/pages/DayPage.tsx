import React, { useCallback, useEffect, useState } from 'react';
import { Button, FlatList, Pressable, SafeAreaView, Text, View } from 'react-native';
import { NavigatedScreenProps, NavigationPages, navigateToItemPage } from '../types/Navigation';
import _ from 'lodash';
import { formatDate, getDateString } from '../types/Dates';
import { MealData, MealPreset } from '../types/Model';
import { DatabaseHandler } from '../data/database';
import { useFocusEffect } from '@react-navigation/native';
import ContextMenu from 'react-native-context-menu-view';
import { styles } from '../styles/Styles';
import { sortMealsByTime } from '../data/processing';
import { MealEntryListItem } from '../components/MealEntryListItem';
import { ThresholdBar } from '../components/ThresholdBar';
import { AppSettings } from '../types/Settings';
import Toast from 'react-native-toast-message';

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
    const [settings, setSettings] = useState<AppSettings>(DatabaseHandler.getInstance().getAppSettingsBestEffortSync());
    const [presets, setPresets] = useState<MealPreset[]|null>(null);
    const options: DayPageParams = _.defaults(params as any, getDefaultDayPageParams())

    const [mealData, setMealData] = useState<MealData[]>([]);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const refresh = async () => {
        setRefreshing(true);
        DatabaseHandler.getInstance().getAppSettings().then((appSettings) => setSettings(appSettings));
        DatabaseHandler.getInstance().getPresets().then(savedPresets => setPresets(savedPresets));
        const key = options.dateString.slice(0, 7);
        const day = options.dateString.slice(8, 10);
        const monthData = await DatabaseHandler.getInstance().getData(key);
        setMealData(sortMealsByTime(monthData[day] ?? []));
        setRefreshing(false);
    }

    useEffect(() => {
        props.navigation.setOptions({
            title: formatDate(options.dateString),
            headerRight: () => <Button title='Add' onPress={() => props.navigation.navigate(NavigationPages.ITEM, options)} />
        });
        refresh();
    }, []);

    useFocusEffect(
        useCallback(() => {
            refresh();
            return () => { };
        }, [])
    );

    const dayTotalKcal = getTotalCaloriesInADay(mealData);
    const isToday = options.dateString === getDateString(new Date());

    return (
        <SafeAreaView style={{
            flex: 1, // cuts off the render at the bottom of the screen edge, to prevent FlatList from extending past the screen.
        }}>
            <View style={{ padding: 10, flexDirection: 'row', gap: 20 }}>
                <Pressable style={{ flexGrow: 1 }} onPress={refresh}>
                    <Text style={styles.title}>Total Calories: {dayTotalKcal}</Text>
                </Pressable>
            </View>
            {dayTotalKcal > 0 && <ThresholdBar emphasizeKcal={dayTotalKcal} />}
            <FlatList
                data={_.map(mealData.filter(meal => !!meal), (meal) => ({
                    ...meal,
                    id: `${meal.time}-${meal.name}`,
                }))}
                renderItem={({ item }) => {
                    const existingPreset = presets?.find((preset) => preset.name === item.name);
                    return <MealEntryListItem
                        meal={item}
                        actions={[
                            {
                                title: 'Edit',
                                onPress: () => {
                                    navigateToItemPage(settings, props.navigation, {
                                        ...options,
                                        itemName: item.name,
                                        itemTime: item.time,
                                    })
                                }
                            },
                            {
                                title: 'Add 1 Serving',
                                hideOption: !settings.addOneOnAllDays && !isToday,
                                onPress: () => {
                                    DatabaseHandler.getInstance().modifyEntry(
                                        options.dateString,
                                        item.name,
                                        item.time,
                                        {
                                            name: item.name,
                                            time: item.time,
                                            servings: item.servings + 1,
                                            kcalPerServing: item.kcalPerServing,
                                        }
                                    ).then(refresh);
                                }
                            },
                            {
                                title: `Copy${isToday ? '' : ' to Today'}`,
                                onPress: () => {
                                    navigateToItemPage(settings, props.navigation, {
                                        dateString: getDateString(new Date()),
                                        prefill: {
                                            name: item.name,
                                            servings: item.servings,
                                            kcalPerServing: item.kcalPerServing,
                                        }
                                    });
                                }
                            },
                            {
                                title: !!existingPreset ? 'Preset Exists' : 'Save as Preset',
                                disabled: !!existingPreset || !presets,
                                onPress: async () => {
                                    if (!presets) return;
                                    const newPresets = _.cloneDeep(presets);
                                    newPresets.push({
                                        id: Date.now().toString(),
                                        name: item.name,
                                        kcalPerServing: item.kcalPerServing
                                    })
                                    await DatabaseHandler.getInstance().setPresets(newPresets);
                                    setPresets(newPresets);
                                    Toast.show({
                                        type: 'success',
                                        text1: `Successfully saved preset ${_.startCase(item.name)}`
                                    })
                                }
                            },
                            {
                                title: 'Delete',
                                destructive: true,
                                onPress: () => {
                                    DatabaseHandler.getInstance().modifyEntry(
                                        options.dateString,
                                        item.name,
                                        item.time,
                                        null
                                    ).then(refresh);
                                }
                            },
                        ]}
                    />
                }}
                keyExtractor={item => item.id}
                refreshing={refreshing}
                onRefresh={refresh}
            />
            <Toast />
        </SafeAreaView>
    );
}