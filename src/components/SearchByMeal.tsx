import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Modal, Text, TextInput, View } from 'react-native';
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
import { ExtensibleButton } from './Buttons';
import Collapsible from 'react-native-collapsible';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDateString, getDateStringParts, getYearMonthIndex } from '../types/Dates';

interface DaySearchResult {
    dateString: string;
    dayResult: MealData[];
    daySearchTotalKcal: number;
};

const minimumNameSearchLength = 3;

const filterNameByRegexIfValid = (regexFilter: string, kcalFilter: number, mealDataList: MealData[]): MealData[] => {
    let regex: RegExp | null;
    try {
        regex = new RegExp(regexFilter.replace('*', '.*').trim(), 'i');
    } catch (err) {
        regex = null
    }
    return mealDataList.filter((mealData) => {
        const nameMatches = !!regex ? regex.test(mealData.name) : mealData.name.toLowerCase().includes(regexFilter.toLowerCase());
        const caloriesMeetMinumum = (mealData.kcalPerServing * mealData.servings) >= Number(kcalFilter);
        return nameMatches && caloriesMeetMinumum;
    });
}

export const SearchByMeal = (props: NavigatedScreenProps) => {
    const [dataStore, setDatastore] = useState<DataStore | null>(null);
    const [nameFilter, setNameFilter] = useState<string>('');
    const [totalKcalFilterStr, setTotalKcalFilterStr] = useState<string>('');
    const [showDateFilters, setShowDateFilters] = useState<boolean>(false);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const [minDate, setMinDate] = useState<Date>(monthAgo); // TODO make this 1 month ago (use dayjs?)
    const [maxDate, setMaxDate] = useState<Date>(new Date());

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
        if (!_.isNil(name)) setNameFilter(name);
        if (kcals === '' || !isNaN(Number(kcals))) setTotalKcalFilterStr(kcals ?? '');
    }

    // key of map will be date in YYYY-MM-DD form.
    const searchResult: Array<DaySearchResult> = [];
    if (dataStore && nameFilter.length >= minimumNameSearchLength) {
        Object.keys(dataStore.database ?? {}).sort().reverse().forEach((ymKey) => {
            Object.keys(dataStore.database[ymKey]).sort().reverse().forEach((dayKey) => {
                const dateString = `${ymKey}-${dayKey}`;
                if (showDateFilters && (dateString < getDateString(minDate)) || dateString > getDateString(maxDate)) {
                    return;
                }
                const minimumKcalFilter = isNaN(Number(totalKcalFilterStr)) ? 0 : Number(totalKcalFilterStr);
                const matchedEntriesInThatDay = filterNameByRegexIfValid(nameFilter, minimumKcalFilter, dataStore.database[ymKey][dayKey]);
                if (!_.isEmpty(matchedEntriesInThatDay)) {
                    const totalSum: number = dataStore.database[ymKey][dayKey].reduce((acc, current) => acc + (current.kcalPerServing * current.servings), 0);
                    searchResult.push({
                        dateString,
                        dayResult: matchedEntriesInThatDay,
                        daySearchTotalKcal: totalSum,
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
                    props.navigation.navigate(NavigationPages.DAY, dayPageParams)
                }
            }}
        >
            <View style={{ padding: 10 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Text style={bespokeStyle('subLabel', { flexGrow: 1 })}>{daySearchResult.dateString}</Text>
                    <Text style={styles.subLabel}>Day total: {daySearchResult.daySearchTotalKcal}kcal</Text>
                </View>
                {_.map(daySearchResult.dayResult, (mealData) => (
                    <MealEntryListItem key={`${mealData.name}-${mealData.time}-${daySearchResult.dateString}`} meal={mealData} actions={[
                        {
                            title: 'Edit Entry', onPress: () => {
                                const itemPageParams: ItemPageParams = {
                                    dateString: daySearchResult.dateString,
                                    itemName: mealData.name,
                                    itemTime: mealData.time,
                                }
                                if (dataStore?.settings.itemPageHasIntermediateDayPage) {
                                    props.navigation.navigate(NavigationPages.DAY, _.omit(itemPageParams, 'itemName', 'itemTime'));
                                }
                                props.navigation.navigate(NavigationPages.ITEM, itemPageParams);
                            }
                        },
                        {
                            title: 'Go to Day',
                            onPress: () => {
                                const dayPageParams: DayPageParams = {
                                    dateString: daySearchResult.dateString,
                                }
                                props.navigation.navigate(NavigationPages.DAY, dayPageParams)
                            }
                        }
                    ]} />
                ))}
            </View>
            <HorizontalLine />
        </ContextMenu>
    )

    const { year, month, day } = getDateStringParts(getDateString(new Date()));
    const lastMonthYMKey = (Number(month) - 1 === 0) ? `${Number(year)-1}-${12}` : `${year}-${(Number(month) - 1).toString().padStart(2, '0')}`;

    return (
        <SafeAreaView style={{
            flex: 1, // cuts off the render at the bottom of the screen edge, to prevent FlatList from extending past the screen.
        }}>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: -50, marginHorizontal: 10, alignItems: 'center' }}>
                <TextInput
                    style={bespokeStyle('input', { flexGrow: 3, flexShrink: 1 })}
                    onChangeText={(name) => updateFilter({ name })}
                    value={nameFilter}
                    placeholder='Search for meal'
                    placeholderTextColor='grey'
                />
                <TextInput
                    style={bespokeStyle('input', { width: 70 })}
                    onChangeText={(kcals) => updateFilter({ kcals })}
                    value={totalKcalFilterStr}
                    placeholder='Kcals'
                    placeholderTextColor='grey'
                    inputMode='numeric'
                />
                <ExtensibleButton title='Filter' style={bespokeStyle('subLabel', {padding: 20})} onPress={() => setShowDateFilters(!showDateFilters)} />
            </View>
            <Collapsible collapsed={!showDateFilters} style={{flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center'}}>
                <Text style={styles.subLabel}>From</Text>
                <DateTimePicker
                    onChange={({ type }, date) => {
                        if (type === 'set' && date) {
                            setMinDate(date)
                        }
                    }}
                    value={minDate}
                    mode='date'
                    locale='en'
                />
                <Text style={styles.subLabel}>To</Text>
                <DateTimePicker
                    onChange={({ type }, date) => {
                        if (type === 'set' && date) {
                            setMaxDate(date)
                        }
                    }}
                    value={maxDate}
                    mode='date'
                    locale='en'
                />
            </Collapsible>
            <Text style={bespokeStyle('subLabel', { paddingHorizontal: 10, marginTop: 10 })}>{searchResult.length} results found</Text>
            <HorizontalLine marginTop={10} />
            <FlatList
                data={searchResult}
                renderItem={({ item }) => getDaySearchResult(item)}
                keyExtractor={item => item.dateString}
            />
        </SafeAreaView>
    );
}