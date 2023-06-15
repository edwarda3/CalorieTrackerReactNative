import React, { useCallback, useEffect, useState } from 'react';
import { Button, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigatedScreenProps } from '../types/Navigation';
import { DayPageParams, getDefaultDayPageParams } from './DayPage';
import _ from 'lodash';
import { DatabaseHandler } from '../data/database';
import { MealData, MealPreset } from '../types/Model';
import { useFocusEffect } from '@react-navigation/native';
import { bespokeStyle, styles } from '../styles/Styles';
import Collapsible from 'react-native-collapsible';
import Toast from 'react-native-toast-message';
import { sortPresets } from './PresetsPage';

export interface ItemPageParams extends DayPageParams {
    itemName?: string;
    itemTime?: string;
    prefill?: Partial<Omit<MealData, 'time'>>;
}

function getDefaultItemPageParams(): DayPageParams {
    return {
        ...getDefaultDayPageParams()
    }
}

export function ItemPage(props: NavigatedScreenProps): JSX.Element {
    const { params } = props.route;
    const options: ItemPageParams = _.defaults(params as any, getDefaultItemPageParams());
    const yearMonthKey = options.dateString.slice(0, 7);
    const dayKey = options.dateString.slice(8, 10);
    const [availablePresets, setAvailablePresets] = useState<MealPreset[]>([]);
    const [canSavePreset, setCanSavePreset] = useState<boolean>(false);
    const [fetched, setFetched] = useState<boolean>(false);
    const [name, setName] = useState<string>('');
    const [showSuggestions, setShowSuggestions] = useState<boolean>(true);
    const hours = new Date().getHours().toString().padStart(2, '0');
    const minutes = new Date().getMinutes().toString().padStart(2, '0');
    const [time, setTime] = useState<string>(`${hours}:${minutes}`);
    const [servingsStr, setServingsStr] = useState<string>('1');
    const [kcalPer, setKcalPer] = useState<number>(0);
    const [errors, setErrors] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const validateEntry = async (): Promise<string[]> => {
        const validationErrors: string[] = [];
        if (_.isEmpty(name)) validationErrors.push('Entry must have a name.');
        if (_.isEmpty(time)) validationErrors.push('Entry must have a time.');
        const servings = Number(servingsStr);
        if (isNaN(servings) || servings <= 0) validationErrors.push('Servings must be a positive number.');
        if (kcalPer <= 0) validationErrors.push('Entry must have a positive kcal value.');

        // If the name or time changed, detect duplicates. Otherwise, it's an edit so we don't need to.
        if (options.itemName !== name || options.itemTime !== time) {
            try {
                const monthData = await DatabaseHandler.getInstance().getData(yearMonthKey);
                const dayData = monthData[dayKey];
                const existingMealWithSameNameAndTime = _.find(dayData, (meal) => (meal.name === name && meal.time === time));
                if (existingMealWithSameNameAndTime) {
                    validationErrors.push(`${name} at ${time} already exists. Modify that entry instead.`);
                }
            } catch (err) {
                console.log(`Could not get existing day data to validate meal entry.`);
            }
        }
        return validationErrors;
    }

    const submitEntry = async (deleting = false) => {
        const servings = Number(servingsStr);
        const validationResult = await validateEntry();
        if (!_.isEmpty(validationResult)) {
            setErrors(validationResult);
        } else {
            setErrors([]);
            setSubmitting(true);
            setShowSuggestions(false);
            await DatabaseHandler.getInstance().modifyEntry(
                options.dateString,
                options.itemName ?? name,
                options.itemTime ?? time,
                deleting ? null : {
                    name,
                    time,
                    servings,
                    kcalPerServing: kcalPer,
                }
            );
            setSubmitting(false);
            props.navigation.goBack();
        }
    }

    const savePreset = async () => {
        setShowSuggestions(false);
        if (_.isEmpty(name) || !kcalPer) {
            setErrors(['Must provide name and kcal per to save a preset']);
            return;
        }
        setErrors([]);
        const presets = await DatabaseHandler.getInstance().getPresets();
        presets.push({
            id: Date.now().toString(),
            name,
            kcalPerServing: kcalPer
        });
        setAvailablePresets(presets);
        await DatabaseHandler.getInstance().setPresets(presets);
        Toast.show({
            text1: `Successfully saved preset ${_.startCase(name)}`
        });
    }

    useFocusEffect(
        useCallback(() => {
            props.navigation.setOptions({
                title: options.itemName ? `Editing ${options.itemName}` : 'New Item',
                headerRight: () => <Button title='Delete' onPress={() => submitEntry(true)} />
            });

            DatabaseHandler.getInstance().getPresets().then(presets => setAvailablePresets(presets));

            // on first load, if we have a name/time passed, we need to retrieve the value from the database.
            // If adding a new entry, the itemName/itemTime are nullish.
            if (!fetched && options.itemName && options.itemTime) {
                DatabaseHandler.getInstance().getData(yearMonthKey).then(monthData => {
                    setFetched(true);
                    const meal = (monthData[dayKey] ?? []).find((meal) => meal.name === options.itemName && meal.time === options.itemTime);
                    if (meal) {
                        setName(meal.name);
                        setTime(meal.time);
                        setServingsStr(meal.servings.toString());
                        setKcalPer(meal.kcalPerServing);
                        setShowSuggestions(false);
                    }
                }).catch(() => setFetched(true));
            } else if (options.prefill) {
                options.prefill.name && setName(options.prefill.name);
                options.prefill.servings && setServingsStr(options.prefill.servings.toString());
                options.prefill.kcalPerServing && setKcalPer(options.prefill.kcalPerServing);
            }
        }, [])
    );

    const filteredPresets = (availablePresets ?? [])
        .filter((preset) => preset.name.toLowerCase().includes(name.toLowerCase()));
    const sortedPresets = sortPresets(filteredPresets);

    return (
        <SafeAreaView style={{
            flex: 1, // cuts off the render at the bottom of the screen edge, to prevent FlatList from extending past the screen.
        }}>
            <View style={{ paddingVertical: 10, paddingLeft: 10, flexDirection: 'column' }}>
                <View style={styles.formField}>
                    <View style={{ flexDirection: 'row', flexGrow: 1, gap: 30 }}>
                        <Text style={styles.label}>Time</Text>
                        <DateTimePicker
                            onChange={({ type }, date) => {
                                if (type === 'set') {
                                    const hours = String(date?.getHours()).padStart(2, '0');
                                    const minutes = String(date?.getMinutes()).padStart(2, '0');
                                    setTime(`${hours}:${minutes}`)
                                }
                            }}
                            value={new Date(`${options.dateString} ${time}`)}
                            mode='time'
                            locale='en'
                        />
                    </View>
                    <Button title='Save as preset' onPress={savePreset} disabled={!canSavePreset || !name || !kcalPer} />
                </View>
                <View >
                    <View style={styles.formField}>
                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.input}
                            onChangeText={(text) => {
                                setName(text);
                                setCanSavePreset(true);
                            }}
                            clearButtonMode='while-editing'
                            value={name}
                            placeholder='Name'
                            placeholderTextColor='grey'
                            /**
                             * While I want to have setShowSuggestions(false) with onBlur, the blur event doesn't propogate
                             * its event down to the page nodes, namely pressable. This is because during focus, the only
                             * detectable input is in the focus element (TextInput) itself. Any other press is made to be handled
                             * with a Keyboard.dismiss on mobile. Therefore, we will close the suggestions section on:
                             * 1. selection of a suggestion
                             * 1. focus of servings or kcal text inputs
                             * 1. pressing add button
                             * 1. pressing save preset button (which also disables the preset button until it's re-edited)
                             */
                            onFocus={() => setShowSuggestions(true)}
                        />
                    </View>
                    <Collapsible collapsed={!showSuggestions} style={{ padding: 5 }}>
                        <ScrollView style={{ maxHeight: 200 }} indicatorStyle='black'>
                            {_.map(sortedPresets,
                                (preset) => (
                                    <Pressable key={preset.id} style={{ paddingBottom: 10 }} onPress={() => {
                                        setName(preset.name);
                                        setKcalPer(preset.kcalPerServing);
                                        setCanSavePreset(false);
                                        setShowSuggestions(false);
                                    }}>
                                        <Text style={bespokeStyle('label', { color: '#777' })}>{_.startCase(preset.name)} ({preset.kcalPerServing}kcal)</Text>
                                    </Pressable>
                                ))
                            }

                        </ScrollView>
                    </Collapsible>
                </View>
                <View style={styles.formField}>
                    <Text style={styles.label}>Servings</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={(text) => setServingsStr(text)}
                        value={servingsStr}
                        onFocus={() => setShowSuggestions(false)}
                        placeholder='Servings'
                        placeholderTextColor='grey'
                        inputMode='decimal'
                        keyboardType='decimal-pad'
                        selectTextOnFocus={true}
                    />
                </View>
                <View style={styles.formField}>
                    <Text style={styles.label}>Kcal/Serving</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={(text) => {
                            setKcalPer(Number(text));
                            setCanSavePreset(true);
                        }}
                        value={kcalPer.toString()}
                        onFocus={() => setShowSuggestions(false)}
                        placeholder='Kcals per serving'
                        placeholderTextColor='grey'
                        inputMode='numeric'
                        selectTextOnFocus={true}
                    />
                </View>
                <View style={bespokeStyle('formField', {paddingRight: 10})}>
                    <Text style={{ flexGrow: 1 }}>Total Kcal: {kcalPer * (isNaN(Number(servingsStr)) ? 1 : Number(servingsStr))}</Text>
                    <Button title={options.itemName ? 'Submit' : 'Add'} onPress={() => submitEntry()} disabled={submitting} />
                </View>
                {!_.isEmpty(errors) && _.map(errors, (errorText, index) => <Text key={`error-${index}`} style={styles.errorText}>{errorText}</Text>)}
            </View>
            <Toast />
        </SafeAreaView>
    );
}
