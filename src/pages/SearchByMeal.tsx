import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Keyboard, Modal, Text, TextInput, View } from 'react-native';
import { bespokeStyle, styles } from '../styles/Styles';
import { DataStore, Database, MealData } from '../types/Model';
import _ from 'lodash';
import ContextMenu from 'react-native-context-menu-view';
import { NavigatedScreenProps, NavigationPages, navigateToItemPage } from '../types/Navigation';
import { DatabaseHandler } from '../data/database';
import { useFocusEffect } from '@react-navigation/native';
import { DayPageParams } from './DayPage';
import { ItemPageParams } from './ItemPage';
import { HorizontalLine } from '../components/Layout';
import { MealEntryListItem } from '../components/MealEntryListItem';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExtensibleButton } from '../components/Buttons';
import Collapsible from 'react-native-collapsible';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDate, getDateString, getDateStringParts, getYearMonthIndex } from '../types/Dates';
import Toast from 'react-native-toast-message';
import { ScrollView } from 'native-base';
import { DaySearchResult, SearchForMealsOptions, searchForMeals } from '../data/search';

export const SearchByMeal = (props: NavigatedScreenProps) => {
    const [dataStore, setDatastore] = useState<DataStore | null>(null);
    const [nameFilter, setNameFilter] = useState<string>('');
    const [totalKcalFilterStr, setTotalKcalFilterStr] = useState<string>('');
    const [showDateFilters, setShowDateFilters] = useState<boolean>(false);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const [minDate, setMinDate] = useState<Date>(monthAgo); // TODO make this 1 month ago (use dayjs?)
    const [maxDate, setMaxDate] = useState<Date>(new Date());
    const [dateStringCursor, setDateStringCursor] = useState<string | null>(null);
    const [foundResult, setFoundResult] = useState<Array<DaySearchResult>>([]);
    const [totalFound, setTotalFound] = useState<number>(0);

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

    const performSearch = (options?: Partial<SearchForMealsOptions>, replace: boolean = false) => {
        if (dataStore?.database) {
            const searchOptionsByState: SearchForMealsOptions = {
                nameFilter: nameFilter,
                minimumKcalFilter: isNaN(Number(totalKcalFilterStr)) ? 0 : Number(totalKcalFilterStr),
                startFromDateString: replace ? null : dateStringCursor,
                maxResults: 100,
            };
            if (showDateFilters) {
                searchOptionsByState.minDate = minDate;
                searchOptionsByState.maxDate = maxDate;
            }
            const { searchResult, searchFoundCount, cursor } = searchForMeals(dataStore.database, {
                ...searchOptionsByState,
                ...(options ?? {})
            });
            setFoundResult(replace ? searchResult : [...foundResult, ...searchResult]);
            setTotalFound(replace ? searchFoundCount : totalFound + searchFoundCount)
            setDateStringCursor(cursor);
        }
    }

    const updateFilter = ({ name, kcals }: { name?: string; kcals?: string }) => {
        if (_.isEmpty(name) && _.isNil(kcals)) {
            setNameFilter('');
            setFoundResult([]);
            setTotalFound(0)
            setDateStringCursor(null);
        } else {
            const toUpdate: Partial<SearchForMealsOptions> = {};
            if (!_.isNil(name)) {
                toUpdate.nameFilter = name;
                setNameFilter(name);
            }
            if (kcals === '' || !isNaN(Number(kcals))) {
                toUpdate.minimumKcalFilter = isNaN(Number(kcals)) ? 0 : Number(kcals);
                setTotalKcalFilterStr(kcals ?? '')
            }
            setDateStringCursor(null);
            performSearch(toUpdate, true);
        }
    }

    const getDaySearchResultDisplay = (daySearchResult: DaySearchResult) => {
        const { dayResult, dateString, matchedItemTotalKcal, daySearchTotalKcal } = daySearchResult;
        return <ContextMenu
            previewBackgroundColor='rgba(0,0,0,0)'
            key={dateString}
            actions={[
                { title: 'Go to Day' }
            ]}
            onPress={({ nativeEvent }) => {
                if (nativeEvent.name === 'Go to Day') {
                    const dayPageParams: DayPageParams = {
                        dateString: dateString,
                    }
                    props.navigation.navigate(NavigationPages.DAY, dayPageParams)
                }
            }}
        >
            <View style={{ padding: 10 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Text style={bespokeStyle('subLabel', { flexGrow: 1 })}>{formatDate(new Date(dateString))}</Text>
                    <Text style={styles.subLabel}>{matchedItemTotalKcal} of {daySearchTotalKcal}kcal ({Math.round(100 * (matchedItemTotalKcal / daySearchTotalKcal))}% of day)</Text>
                </View>
                {_.map(dayResult, (mealData) => {
                    const existingPreset = dataStore?.presets.find((preset) => preset.name === mealData.name);
                    return <MealEntryListItem key={`${mealData.name}-${mealData.time}-${dateString}`} meal={mealData} actions={[
                        {
                            title: 'Edit Entry', onPress: () => {
                                navigateToItemPage(dataStore?.settings!, props.navigation, {
                                    dateString: dateString,
                                    itemName: mealData.name,
                                    itemTime: mealData.time,
                                })
                            }
                        },
                        {
                            title: 'Copy Entry to Today', onPress: () => {
                                navigateToItemPage(dataStore?.settings!, props.navigation, {
                                    dateString: getDateString(new Date()),
                                    prefill: _.omit(mealData, 'time'),
                                });
                            }
                        },
                        {
                            title: !!existingPreset ? 'Preset Exists' : 'Save as Preset', disabled: !!existingPreset || !dataStore, onPress: async () => {
                                if (!dataStore) return;
                                const newPresets = _.cloneDeep(dataStore?.presets);
                                newPresets.push({
                                    id: Date.now().toString(),
                                    name: mealData.name,
                                    kcalPerServing: mealData.kcalPerServing
                                })
                                await DatabaseHandler.getInstance().setPresets(newPresets);
                                setDatastore({
                                    ...dataStore,
                                    presets: newPresets
                                });
                                Toast.show({
                                    type: 'success',
                                    text1: `Successfully saved preset ${_.startCase(mealData.name)}`
                                })
                            }
                        },
                        {
                            title: 'Go to Day',
                            onPress: () => {
                                const dayPageParams: DayPageParams = {
                                    dateString: dateString,
                                }
                                props.navigation.navigate(NavigationPages.DAY, dayPageParams)
                            }
                        }
                    ]} />
                })}
            </View>
            <HorizontalLine />
        </ContextMenu>
    }

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
                <ExtensibleButton title='Filters' style={bespokeStyle('subLabel', { padding: 20 })} onPress={() => {
                    setShowDateFilters(!showDateFilters);
                    setDateStringCursor(null);
                    performSearch(showDateFilters ? { minDate, maxDate } : {}, true);
                }} />
            </View>
            <Collapsible collapsed={!showDateFilters} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                <Text style={styles.subLabel}>From</Text>
                <DateTimePicker
                    onChange={({ type }, date) => {
                        if (type === 'set' && date) {
                            setMinDate(date);
                            setDateStringCursor(null);
                            performSearch({ minDate: date }, true);
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
                            setMaxDate(date);
                            setDateStringCursor(null);
                            performSearch({ maxDate: date }, true);
                        }
                    }}
                    value={maxDate}
                    mode='date'
                    locale='en'
                />
            </Collapsible>
            <Text style={bespokeStyle('subLabel', { paddingHorizontal: 10, marginTop: 10 })}>{totalFound}{dateStringCursor ? '+' : ''} results found</Text>
            <HorizontalLine marginTop={10} />
            <ScrollView indicatorStyle='black' onScrollBeginDrag={() => Keyboard.dismiss()}>
                {_.map(foundResult, getDaySearchResultDisplay)}
                {dateStringCursor && <Button title='Load more results' onPress={() => performSearch()} />}
            </ScrollView>
            <Toast />
        </SafeAreaView>
    );
}