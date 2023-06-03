import React, { useCallback, useEffect, useState } from 'react';
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigatedScreenProps } from '../types/Navigation';
import { DayPageParams, getDefaultDayPageParams } from './DayPage';
import _ from 'lodash';
import { DatabaseHandler } from '../data/database';
import { MealPreset } from '../types/Model';
import { useFocusEffect } from '@react-navigation/native';
import { SelectList } from 'react-native-dropdown-select-list';
import { styles } from '../styles/Styles';

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
    const hours = new Date().getHours().toString().padStart(2, '0');
    const minutes = new Date().getMinutes().toString().padStart(2, '0');
    const [time, setTime] = useState<string>(`${hours}:${minutes}`);
    const [servings, setServings] = useState<number>(1);
    const [kcalPer, setKcalPer] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const submitEntry = async (deleting = false) => {
        if (_.isEmpty(name) || _.isEmpty(time) || !servings || !kcalPer) {
            setError('All Entries are required');
        } else {
            setError(null);
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
        if (_.isEmpty(name) || !kcalPer) {
            setError('Must provide name and kcal per to save a preset');
            return;
        }
        setError(null);
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
                        setServings(meal.servings);
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
                <SelectList
                    boxStyles={{ margin: 20 }}
                    data={_.map(availablePresets ?? [], (preset) => ({ key: preset.id, value: `${preset.name} (${preset.kcalPerServing})` }))}
                    save='key'
                    placeholder='Choose Preset'
                    setSelected={(key: string) => {
                        const preset = availablePresets.find(preset => preset.id === key);
                        if (preset) {
                            setName(preset.name);
                            setKcalPer(preset.kcalPerServing);
                            setCanSavePreset(false);
                        }
                    }}
                />
                <View style={styles.formField}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={(text) => {
                            setName(text);
                            setCanSavePreset(true);
                        }}
                        value={name}
                        placeholder='Name'
                        placeholderTextColor='grey'
                        autoFocus={true}
                    />
                </View>
                <View style={styles.formField}>
                    <Text style={styles.label}>Servings</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={(text) => setServings(Number(text))}
                        value={servings.toString()}
                        placeholder='Servings'
                        placeholderTextColor='grey'
                        inputMode='numeric'
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
                        placeholder='Kcals per serving'
                        placeholderTextColor='grey'
                        inputMode='numeric'
                    />
                </View>
                <View style={styles.formField}>
                    <Text style={{ flexGrow: 1 }}>Total Kcal: {kcalPer * servings}</Text>
                    <Button title={options.itemName ? 'Submit' : 'Add'} onPress={() => submitEntry()} disabled={submitting} />
                </View>
                {error && <Text style={styles.errorText}>{error}</Text>}
                {status && <Text style={styles.statusText}>{status}</Text>}
            </View>
        </SafeAreaView>
    );
}
