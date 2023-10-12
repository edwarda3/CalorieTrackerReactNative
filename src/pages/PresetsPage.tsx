import React, { useCallback, useState } from 'react';
import { Button, ColorValue, FlatList, Keyboard, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { NavigatedScreenProps, NavigationPages, navigateToItemPage } from '../types/Navigation';
import _ from 'lodash';
import { MealData, MealPreset } from '../types/Model';
import { DatabaseHandler } from '../data/database';
import { useFocusEffect } from '@react-navigation/native';
import ContextMenu from 'react-native-context-menu-view';
import { bespokeStyle, styles } from '../styles/Styles';
import { formatDate, getDateString, getYearMonthIndex } from '../types/Dates';
import { getSurroundingMonths } from './CalendarPage';
import { SearchByMealParams } from './SearchByMeal';
import { formatMealName } from '../styles/Formatter';
import { AppSettings } from '../types/Settings';
import { Select } from 'native-base';
import { RowButtonSelector } from '../components/RowButtonSelector';
import { HorizontalLine } from '../components/Layout';

export const sortPresetsByName = (presets: MealPreset[]): MealPreset[] => {
    return (presets ?? []).sort((preset1, preset2) => preset1.name.localeCompare(preset2.name));
}

export const getPresetsMatchingFilter = (presets: MealPreset[], filter: string = ''): MealPreset[] => {
    let regex: RegExp | null;
    try {
        regex = new RegExp(filter.replace('*', '.*').trim(), 'i');
    } catch (err) {
        regex = null
    }
    const filteredPresets = presets.filter((preset) => 
        !!preset && (!!regex ? 
            regex.test(preset.name.trim()) : 
            preset.name.toLowerCase().includes(filter.toLowerCase())
        )
    );
    return filteredPresets;
}

export enum SortingMode {
    NAME='Name',
    USAGE_COUNT='Usage Count',
    LAST_USAGE='Last Usage Time'
}

export function PresetsPage(props: NavigatedScreenProps): JSX.Element {
    const [presets, setPresets] = useState<MealPreset[]>([]);
    const [settings, setSettings] = useState<AppSettings>(DatabaseHandler.getInstance().getAppSettingsBestEffortSync());
    const [recentMealEntries, setRecentMealEntries] = useState<MealData[]>([]);
    const [filter, setFilter] = useState<string>('');
    const [presetMealId, setPresetMealId] = useState<string | null>(null);
    const [presetMealName, setPresetMealName] = useState<string>('');
    const [presetMealKcals, setPresetMealKcals] = useState<number>(0);
    const [presetMealPastUsage, setPresetMealPastUsage] = useState<number>(0);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [sortMode, setSortMode] = useState<SortingMode>(SortingMode.NAME);

    const refresh = async () => {
        setRefreshing(true);
        Keyboard.dismiss();
        DatabaseHandler.getInstance().getAppSettings().then((appSettings) => setSettings(appSettings));
        const presets = await DatabaseHandler.getInstance().getPresets();
        setPresets(presets);
        const currentMonth = getYearMonthIndex(new Date());
        const { previousMonth } = getSurroundingMonths(currentMonth);
        const currentMonthData = await DatabaseHandler.getInstance().getData(currentMonth);
        const previousMonthData = await DatabaseHandler.getInstance().getData(previousMonth);
        const flat = _.flatten([..._.values(currentMonthData), ..._.values(previousMonthData)]);
        setRecentMealEntries(flat);
        setRefreshing(false);
    }

    useFocusEffect(
        useCallback(() => {
            refresh();
            return () => { };
        }, [])
    );

    const modifyPreset = async () => {
        if (!presetMealName || !presetMealKcals) {
            setError('Provide Name and Kcals per serving.');
            return;
        }
        setError(null);

        const existingIndex = (presets ?? []).findIndex((preset) => presetMealId !== null && preset.id === presetMealId);
        if (presetMealId && existingIndex >= 0) {
            presets[existingIndex] = {
                id: presetMealId,
                name: presetMealName,
                kcalPerServing: presetMealKcals,
                usageCount: presets[existingIndex].usageCount,
                lastUsageTime: presets[existingIndex].lastUsageTime,
            }
        } else {
            presets.push({
                id: Date.now().toString(),
                name: presetMealName,
                kcalPerServing: presetMealKcals,
                usageCount: presetMealPastUsage,
            });
        }
        setPresets(presets);
        await DatabaseHandler.getInstance().setPresets(presets);
        setPresetMealId(null);
        setPresetMealName('');
        setPresetMealKcals(0);
        setPresetMealPastUsage(0);
        refresh();
    }

    const deletePreset = async (presetId: string) => {
        const existingIndex = (presets ?? []).findIndex((preset) => presetId !== null && preset.id === presetId);
        if (existingIndex >= 0) {
            presets.splice(existingIndex, 1);
            setPresets(presets);
            await DatabaseHandler.getInstance().setPresets(presets);
            refresh();
        }
    }

    const resetUsage = async (presetId: string) => {
        const existingIndex = (presets ?? []).findIndex((preset) => presetId !== null && preset.id === presetId);
        if (existingIndex >= 0) {
            presets[existingIndex].usageCount = 0;
            presets[existingIndex].lastUsageTime = undefined;
            setPresets(presets);
            await DatabaseHandler.getInstance().setPresets(presets);
            refresh();
        }
    }

    const getPresetView = (preset: MealPreset) => (
        <ContextMenu
            key={preset.id}
            previewBackgroundColor='rgba(0,0,0,0)'
            actions={[
                { title: preset.lastUsageTime ? `Last used on ${formatDate(getDateString(new Date(preset.lastUsageTime)))}` : 'Never used', disabled: true },
                { title: 'Edit' },
                { title: `Search`, subtitle: `Find "${preset.name}"` },
                { title: `Add to Today` },
                { title: 'Reset Usage', destructive: true },
                { title: 'Delete', destructive: true }
            ]}
            onPress={({ nativeEvent }) => {
                if (nativeEvent.name === 'Edit') {
                    setPresetMealId(preset.id);
                    setPresetMealName(preset.name);
                    setPresetMealKcals(preset.kcalPerServing);
                } else if (nativeEvent.name === 'Search') {
                    const searchString = preset.name.trim();
                    const fixedForRegex = searchString
                        .replace('(', '\\(')
                        .replace(')', '\\)')
                        .replace('[', '\\[')
                        .replace(']', '\\]')
                    const searchParams: SearchByMealParams = {
                        prefillSearch: `^${fixedForRegex}$`
                    };
                    props.navigation.navigate(NavigationPages.SEARCH_BY_MEAL, searchParams);
                } else if (nativeEvent.name === 'Add to Today') {
                    navigateToItemPage({
                        appSettings: settings,
                        navigation: props.navigation,
                        params: {
                            dateString: getDateString(new Date()),
                            prefill: {
                                name: preset.name,
                                kcalPerServing: preset.kcalPerServing,
                                servings: 1
                            },
                        }
                    });
                } else if (nativeEvent.name === 'Reset Usage') {
                    resetUsage(preset.id);
                } else if (nativeEvent.name === 'Delete') {
                    deletePreset(preset.id);
                }
            }}>

            <View style={{ flexDirection: 'row', gap: 20, padding: 3, alignItems: 'center' }}>
                <Text
                    style={bespokeStyle('label', { flexGrow: 1, flexShrink: 1 })}
                    adjustsFontSizeToFit
                    numberOfLines={Math.floor(preset.name.length / 50) + 1}
                >{formatMealName(preset.name)}</Text>
                <View style={{ flexDirection: 'column', gap: 2, alignItems: 'flex-end'}}>
                    <Text style={bespokeStyle('label', { fontSize: 16 })}>{preset.kcalPerServing}kcal</Text>
                    <Text style={styles.subLabel}>{preset.usageCount ?? 0} uses</Text>
                </View>
            </View>
            <HorizontalLine marginHorizontal={5} lineColor={'rgba(0,0,0,0.3)'} />
        </ContextMenu>
    )

    const unsavedRecents = recentMealEntries.reduce((acc, entry) => {
        if (presets.find((preset) => preset.name.trim().toLowerCase() === entry.name.trim().toLowerCase())) {
            // abort if we find a preset with the name already, we don't need to count it.
            return acc;
        }
        const index = acc.findIndex((stored) => {
            return (
                stored.name.trim().toLowerCase() === entry.name.trim().toLowerCase() &&
                stored.kcalPerServing === entry.kcalPerServing
            );
        });
        if (index >= 0) {
            acc[index].times += 1;
            acc[index].times += 1;
        } else {
            acc.push({
                times: 1,
                name: entry.name.trim().toLowerCase(),
                kcalPerServing: entry.kcalPerServing
            });
        }
        return acc;
    }, [] as Array<Omit<MealPreset, 'id'> & { times: number }>);
    const sortedSuggestions = unsavedRecents.sort((a, b) => b.times - a.times)
        // require at least 2 entries to be suggested
        .filter((a) => a.times >= 2)
        // show the first 6 suggestions
        .slice(0, 6);

    const filteredPresets = getPresetsMatchingFilter(presets, filter)
    const sortedPresets = sortPresetsByName(filteredPresets);
    if (sortMode === SortingMode.LAST_USAGE) {
        sortedPresets.sort((preset1, preset2) => (preset2.lastUsageTime ?? 0) - (preset1.lastUsageTime ?? 0));
    }
    if (sortMode === SortingMode.USAGE_COUNT) {
        sortedPresets.sort((preset1, preset2) => (preset2.usageCount ?? 0) - (preset1.usageCount ?? 0));
    }

    return (
        <SafeAreaView style={{
            flex: 1, // cuts off the render at the bottom of the screen edge, to prevent FlatList from extending past the screen.
        }}>
            <Pressable style={{ padding: 10 }} onPress={refresh}>
                <Text style={styles.title}>Total Presets: {presets.length}</Text>
            </Pressable>
            <View style={{ flexDirection: 'column', gap: 4, borderBottomColor: 'black', borderBottomWidth: StyleSheet.hairlineWidth }}>
                <View style={{
                    padding: 10,
                    flexDirection: 'row',
                    gap: 20,
                    alignItems: 'center',
                    flexWrap: 'nowrap',
                }}>
                    <TextInput
                        style={styles.input}
                        onChangeText={(text) => setPresetMealName(text)}
                        value={presetMealName}
                        placeholder='Preset Meal Name'
                    />
                    <TextInput
                        style={bespokeStyle('input', { width: 50 })}
                        onChangeText={(text) => setPresetMealKcals(Number(text))}
                        value={presetMealKcals.toString()}
                        placeholder='Preset Meal Kcals per serving'
                        inputMode='numeric'
                    />
                    <View style={{ flexGrow: 1 }}>
                        <Button title={presetMealId ? 'Submit' : 'Add'} onPress={() => modifyPreset()} />
                    </View>
                </View>
                {error && <Text style={styles.errorText}>{error}</Text>}
                {!_.isEmpty(sortedSuggestions) && (
                    <View style={{flexDirection: 'column', padding: 10}}>
                        <Text style={bespokeStyle('subLabel', {color: 'black'})}>Suggested Presets</Text>
                        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{flexDirection: 'row', gap: 20}}>
                            {_.map(sortedSuggestions, (suggestion) => {
                                return <Pressable key={`${suggestion.name}-${suggestion.kcalPerServing}`} onPress={() => {
                                    setPresetMealName(suggestion.name);
                                    setPresetMealKcals(suggestion.kcalPerServing);
                                    setPresetMealPastUsage(suggestion.times);
                                }} style={{padding: 5}}>
                                    <Text style={styles.subLabel}>{formatMealName(suggestion.name)} ({suggestion.kcalPerServing}kcal)</Text>
                                </Pressable>
                            })}
                        </ScrollView>
                    </View>
                )}
            </View>
            <View style={{paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center'}}>
                <Text style={bespokeStyle('sublabel', {fontSize: 14, flexGrow: 1, flexShrink: 1})}>Sort</Text>
                <RowButtonSelector<SortingMode>
                    options={[
                        { value: SortingMode.NAME, label: 'Name' },
                        { value: SortingMode.USAGE_COUNT, label: 'Usage Count' },
                        { value: SortingMode.LAST_USAGE, label: 'Last Usage' },
                    ]}
                    selected={sortMode}
                    onSelectOption={(option) => setSortMode(option)}
                />
            </View>
            <View>
                <TextInput
                    style={styles.input}
                    onChangeText={(text) => setFilter(text)}
                    value={filter}
                    placeholder='Filter'
                    placeholderTextColor='grey'
                    />
            </View>
            <ScrollView
                style={{flexDirection: 'column'}}
                indicatorStyle='black'
                onScrollBeginDrag={() => Keyboard.dismiss()}
            >
                {_.map(sortedPresets, getPresetView)}
            </ScrollView>
        </SafeAreaView>
    );
}