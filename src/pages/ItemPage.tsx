import React, { useCallback, useEffect, useState } from 'react';
import { Button, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigatedScreenProps } from '../types/Navigation';
import { DayPageParams, getDefaultDayPageParams } from './DayPage';
import _ from 'lodash';
import { DatabaseHandler } from '../data/database';
import { MealPreset } from '../types/Model';
import { useFocusEffect } from '@react-navigation/native';
import { bespokeStyle, styles } from '../styles/Styles';
import Collapsible from 'react-native-collapsible';

export interface ItemPageParams extends DayPageParams {
    itemName?: string;
    itemTime?: string;
}

function getDefaultItemPageParams(): DayPageParams {
    return {
        ...getDefaultDayPageParams()
    }
}

export function ItemPage(props: NavigatedScreenProps): JSX.Element {
    const { params } = props.route;
    const options: ItemPageParams = _.defaults(params as any, getDefaultItemPageParams());
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
    const [status, setStatus] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const validateEntry = (): string[] => {
        const validationErrors: string[] = [];
        if (_.isEmpty(name)) validationErrors.push('Entry must have a name.');
        if (_.isEmpty(time)) validationErrors.push('Entry must have a time.');
        const servings = Number(servingsStr);
        if (isNaN(servings) || servings <= 0) validationErrors.push('Servings must be a positive number.');
        if (kcalPer <= 0) validationErrors.push('Entry must have a positive kcal value.');
        return validationErrors;
    }

    const submitEntry = async (deleting = false) => {
        const servings = Number(servingsStr);
        const validationResult = validateEntry();
        setShowSuggestions(false);
        if (!_.isEmpty(validationResult)) {
            setErrors(validationResult);
        } else {
            setErrors([]);
            setSubmitting(true);
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
        setStatus(null);
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
        setStatus(`Saved preset ${name} successfully`);
    }

    useFocusEffect(
        useCallback(() => {
            props.navigation.setOptions({
                title: options.itemName ? `Editing ${options.itemName}` : 'New Item',
                headerRight: () => <Button title='Delete' onPress={() => submitEntry(true)} />
            });

            DatabaseHandler.getInstance().getPresets().then(presets => setAvailablePresets(presets));

            if (!fetched && options.itemName && options.itemTime) {
                const key = options.dateString.slice(0, 7);
                const day = options.dateString.slice(8, 10);
                DatabaseHandler.getInstance().getData(key).then(monthData => {
                    setFetched(true);
                    const meal = (monthData[day] ?? []).find((meal) => meal.name === options.itemName && meal.time === options.itemTime);
                    console.log(JSON.stringify(meal));
                    if (meal) {
                        setName(meal.name);
                        setTime(meal.time);
                        setServingsStr(meal.servings.toString());
                        setKcalPer(meal.kcalPerServing);
                    }
                }).catch(() => setFetched(true));
            }
        }, [])
    );

    return (
        <SafeAreaView>
            <View style={{ padding: 10, flexDirection: 'column' }}>
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
                            clearButtonMode='always'
                            value={name}
                            placeholder='Name'
                            placeholderTextColor='grey'
                            onFocus={() => setShowSuggestions(true)}
                        />
                    </View>
                    <Collapsible collapsed={!showSuggestions} style={{ padding: 5 }}>
                        <ScrollView style={{ maxHeight: 200 }}>
                            {_.map(availablePresets.filter((preset) => preset.name.toLowerCase().includes(name.toLowerCase())) ?? [],
                                (preset) => (
                                    <Pressable key={preset.id} style={{ paddingBottom: 10 }} onPress={() => {
                                        setName(preset.name);
                                        setKcalPer(preset.kcalPerServing);
                                        setCanSavePreset(false);
                                        setShowSuggestions(false);
                                    }}>
                                        <Text style={bespokeStyle('label', { color: '#777' })}>{preset.name} ({preset.kcalPerServing}kcal)</Text>
                                    </Pressable>
                                ))
                            }

                        </ScrollView>
                    </Collapsible>
                </View>
                <View style={styles.formField}>
                    <Text style={styles.label}>Servings Test</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={(text) => setServingsStr(text)}
                        value={servingsStr}
                        onFocus={() => setShowSuggestions(false)}
                        placeholder='Servings'
                        placeholderTextColor='grey'
                        inputMode='decimal'
                        keyboardType='decimal-pad'
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
                    />
                </View>
                <View style={styles.formField}>
                    <Text style={{ flexGrow: 1 }}>Total Kcal: {kcalPer * (isNaN(Number(servingsStr)) ? 1 : Number(servingsStr))}</Text>
                    <Button title={options.itemName ? 'Submit' : 'Add'} onPress={() => submitEntry()} disabled={submitting} />
                </View>
                {!_.isEmpty(errors) && _.map(errors, (errorText, index) => <Text key={`error-${index}`} style={styles.errorText}>{errorText}</Text>)}
                {status && <Text style={styles.statusText}>{status}</Text>}
            </View>
        </SafeAreaView>
    );
}
