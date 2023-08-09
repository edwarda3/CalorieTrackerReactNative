import React, { useCallback, useState } from 'react';
import { Button, FlatList, Keyboard, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { NavigatedScreenProps, NavigationPages } from '../types/Navigation';
import _ from 'lodash';
import { MealData, MealPreset } from '../types/Model';
import { DatabaseHandler } from '../data/database';
import { useFocusEffect } from '@react-navigation/native';
import ContextMenu from 'react-native-context-menu-view';
import { bespokeStyle, styles } from '../styles/Styles';
import { getYearMonthIndex } from '../types/Dates';
import { getSurroundingMonths } from './CalendarPage';
import { SearchByMealParams } from './SearchByMeal';
import { formatMealName } from '../styles/Formatter';

export const sortPresets = (presets: MealPreset[]): MealPreset[] => {
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

export function PresetsPage(props: NavigatedScreenProps): JSX.Element {
    const [presets, setPresets] = useState<MealPreset[]>([]);
    const [recentMealEntries, setRecentMealEntries] = useState<MealData[]>([]);
    const [filter, setFilter] = useState<string>('');
    const [presetMealId, setPresetMealId] = useState<string | null>(null);
    const [presetMealName, setPresetMealName] = useState<string>('');
    const [presetMealKcals, setPresetMealKcals] = useState<number>(0);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = async () => {
        setRefreshing(true);
        Keyboard.dismiss()
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
                kcalPerServing: presetMealKcals
            }
        } else {
            presets.push({
                id: Date.now().toString(),
                name: presetMealName,
                kcalPerServing: presetMealKcals
            });
        }
        setPresets(presets);
        await DatabaseHandler.getInstance().setPresets(presets);
        setPresetMealId(null);
        setPresetMealName('');
        setPresetMealKcals(0);
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

    const getPresetView = (preset: MealPreset) => (
        <ContextMenu
            key={preset.id}
            previewBackgroundColor='rgba(0,0,0,0)'
            actions={[
                { title: 'Edit' },
                { title: `Search`, subtitle: `Find "${preset.name}"` },
                { title: 'Delete', destructive: true }
            ]}
            onPress={({ nativeEvent }) => {
                if (nativeEvent.name === 'Edit') {
                    setPresetMealId(preset.id);
                    setPresetMealName(preset.name);
                    setPresetMealKcals(preset.kcalPerServing);
                } else if (nativeEvent.name === 'Search') {
                    const searchParams: SearchByMealParams = {
                        prefillSearch: `^${preset.name.trim()}$`
                    };
                    props.navigation.navigate(NavigationPages.SEARCH_BY_MEAL, searchParams);
                } else if (nativeEvent.name === 'Delete') {
                    deletePreset(preset.id);
                }
            }}>

            <View style={{ flexDirection: 'row', gap: 20, padding: 10 }}>
                <Text style={bespokeStyle('label', { flexGrow: 1 })}>{formatMealName(preset.name)}</Text>
                <Text style={styles.label}>{preset.kcalPerServing}kcal</Text>
            </View>
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
    const sortedPresets = sortPresets(filteredPresets);

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
                                }} style={{padding: 5}}>
                                    <Text style={styles.subLabel}>{formatMealName(suggestion.name)} ({suggestion.kcalPerServing}kcal)</Text>
                                </Pressable>
                            })}
                        </ScrollView>
                    </View>
                )}
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