import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Keyboard, Modal, Text, TextInput, View } from 'react-native';
import { bespokeStyle, styles } from '../styles/Styles';
import { DataStore, Database, MealData } from '../types/Model';
import _ from 'lodash';
import ContextMenu from 'react-native-context-menu-view';
import { NavigatedScreenProps, NavigationPages } from '../types/Navigation';
import { DatabaseHandler } from '../data/database';
import { useFocusEffect } from '@react-navigation/native';
import { DayPageParams } from '../pages/DayPage';
import { ItemPageParams } from '../pages/ItemPage';
import { HorizontalLine } from './Layout';
import { MealEntryListItem } from './MealEntryListItem';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DaySearchResult {
    dateString: string;
    dayResult: MealData[]
};

const minimumNameSearchLength = 3;

export const SearchByMeal = (props: NavigatedScreenProps) => {
    const [dataStore, setDatastore] = useState<DataStore | null>(null);
    const [nameFilter, setNameFilter] = useState<string>('');
    const [totalKcalFilterStr, setTotalKcalFilterStr] = useState<string>('');

    const refresh = async () => {
        const dataStore = await DatabaseHandler.getInstance().getAllKnownData();
        setDatastore(dataStore);
    }

    useFocusEffect(
        useCallback(() => {
            refresh();
            return () => { };
        }, [])
    );

    const updateFilter = ({ name, kcals }: { name?: string; kcals?: string }) => {
        if (!_.isNil(name)) setNameFilter(name.trim());
        if (kcals === '' || !isNaN(Number(kcals))) setTotalKcalFilterStr(kcals ?? '');
    }

    // key of map will be date in YYYY-MM-DD form.
    const searchResult: Array<DaySearchResult> = [];
    if (dataStore && nameFilter.length >= minimumNameSearchLength) {
        Object.keys(dataStore.database ?? {}).sort().reverse().forEach((ymKey) => {
            Object.keys(dataStore.database[ymKey]).sort().reverse().forEach((dayKey) => {
                const matchedEntriesInThatDay = dataStore.database[ymKey][dayKey].filter((mealData) => {
                    const nameMatches = new RegExp(nameFilter.replace('*', '.*').trim(), 'i').test(mealData.name);
                    const caloriesMeetMinumum = (mealData.kcalPerServing * mealData.servings) >= Number(totalKcalFilterStr);
                    return nameMatches && caloriesMeetMinumum;
                });
                if (!_.isEmpty(matchedEntriesInThatDay)) {
                    searchResult.push({
                        dateString: `${ymKey}-${dayKey}`,
                        dayResult: matchedEntriesInThatDay,
                    });
                }
            });
        });
    }

    const getDaySearchResult = (daySearchResult: DaySearchResult) => (
        <ContextMenu
            previewBackgroundColor='rgba(0,0,0,0)'
            key={daySearchResult.dateString}
            actions={[
                { title: 'Go to Day' }
            ]}
            onPress={({ nativeEvent }) => {
                if (nativeEvent.name === 'Go to Day') {
                    const dayPageParams: DayPageParams = {
                        dateString: daySearchResult.dateString,
                    }
                    props.navigation.navigate(NavigationPages.ITEM, dayPageParams)
                }
            }}
        >
            <View style={{padding: 10}}>
                <Text style={styles.subLabel}>{daySearchResult.dateString}</Text>
                {_.map(daySearchResult.dayResult, (mealData) => (
                    <MealEntryListItem key={`${mealData.name}-${mealData.time}`} meal={mealData} actions={[
                        {
                            title: 'Edit Entry', onPress: () => {
                                const itemPageParams: ItemPageParams = {
                                    dateString: daySearchResult.dateString,
                                    itemName: mealData.name,
                                    itemTime: mealData.time,
                                }
                                props.navigation.navigate(NavigationPages.DAY, _.omit(itemPageParams, 'itemName', 'itemTime'));
                                props.navigation.navigate(NavigationPages.ITEM, itemPageParams);
                            }
                        }
                    ]} />
                ))} 
            </View>
            <HorizontalLine />
        </ContextMenu>
    )

    return (
        <SafeAreaView style={{
            flex: 1, // cuts off the render at the bottom of the screen edge, to prevent FlatList from extending past the screen.
        }}>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: -50 }}>
                <TextInput
                    style={bespokeStyle('input', { flexGrow: 3, flexShrink: 1 })}
                    onChangeText={(name) => updateFilter({ name })}
                    value={nameFilter}
                    placeholder='Search for meal name'
                    placeholderTextColor='grey'
                />
                <TextInput
                    style={bespokeStyle('input', { width: 70 })}
                    onChangeText={(kcals) => updateFilter({ kcals })}
                    value={totalKcalFilterStr}
                    placeholder='Minimum Kcals'
                    placeholderTextColor='grey'
                    inputMode='numeric'
                />
            </View>
            <Text style={bespokeStyle('subLabel', {paddingHorizontal: 10})}>{searchResult.length} results found</Text>
            <HorizontalLine marginTop={10}/>
            <FlatList
                data={searchResult}
                renderItem={({ item }) => getDaySearchResult(item)}
                keyExtractor={item => item.dateString}
            />
        </SafeAreaView>
    );
}