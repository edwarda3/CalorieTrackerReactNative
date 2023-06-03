import React, { useCallback, useEffect, useState } from 'react';
import { Button, SafeAreaView, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigatedScreenProps } from '../types/Navigation';
import { DayPageParams, getDefaultDayPageParams } from './DayPage';
import _ from 'lodash';
import { DatabaseHandler } from '../data/database';
import { DataStore, MealPreset, MonthData } from '../types/Model';
import { useFocusEffect } from '@react-navigation/native';
import { SelectList } from 'react-native-dropdown-select-list';
import { pickSingle } from 'react-native-document-picker';
import { readFile } from 'react-native-fs';
import { getYearMonthIndex } from '../types/Dates';
import { styles } from '../styles/Styles';

export function ProfilePage(props: NavigatedScreenProps): JSX.Element {
    const [dataStore, setDatastore] = useState<DataStore | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const defaultInspectionMonth = getYearMonthIndex(new Date());
    const [inspectMonth, setInspectMonth] = useState<string>(defaultInspectionMonth);

    const refresh = async () => {
        setDatastore(await DatabaseHandler.getInstance().getAllKnownData());
    }

    useFocusEffect(
        useCallback(() => {
            refresh();
            return () => { };
        }, [])
    );

    const importFile = async () => {
        setError(null);
        setStatus(null);
        try {
            const file = await pickSingle({
                mode: 'import',
                // type: ['text/plain', 'application/json']
            });
            const resultStr = await readFile(file.uri);
            const imported = JSON.parse(resultStr) as DataStore;
            if (imported.database && imported.presets) {
                await DatabaseHandler.getInstance().importJsonFile(imported);
                setDatastore(imported);
                setStatus(`Successfully imported ${Object.keys(imported.database).length} months and ${imported.presets.length} presets`);
            } else {
                throw new Error(`imported file did not have 'database' and 'presets' properties`);
            }
        } catch (err) {
            console.error(`Failed to import file.`, err);
            setError(`Failed to import data store.`)
        }
    }

    return (
        <SafeAreaView>
            <View style={{ padding: 10, flexDirection: 'column' }}>
                <Text>{Object.keys(dataStore?.database ?? {}).length} months tracked.</Text>
                <Button title='Export data' onPress={() => {
                    Share.share({
                        message: JSON.stringify(dataStore),
                    })
                }} disabled={!dataStore} />
                <Button title='Import data' onPress={importFile} />
                {error && <Text style={styles.errorText}>{error}</Text>}
                {status && <Text style={styles.statusText}>{status}</Text>}
                <SelectList
                    data={_.map(Object.keys(dataStore?.database ?? {}).sort().reverse(), (yearMonth) => ({
                        key: yearMonth,
                        value: yearMonth,
                    }))}
                    defaultOption={{ key: defaultInspectionMonth, value: defaultInspectionMonth }}
                    save='key'
                    setSelected={(key: string) => setInspectMonth(key)}
                />
                {(!dataStore || !dataStore?.database?.[inspectMonth]) ? 
                    <Text>No information for {inspectMonth}</Text> :
                    <YearMonthStats monthData={dataStore.database[inspectMonth]} />
                }
            </View>
        </SafeAreaView>
    );
}

export interface YearMonthStatsProps {
    monthData: MonthData;
}

export const YearMonthStats = ({ monthData }: YearMonthStatsProps) => {
    let totalDays = 0;
    const totalKcals = _.reduce(monthData, (acc, dayData) => {
        if (!_.isEmpty(dayData)) totalDays += 1;
        const allKcals = _.sum(_.map(dayData, (meal) => meal.kcalPerServing * meal.servings));
        return acc + allKcals;
    }, 0);
    const avgKcalsPerDay = Math.floor(totalKcals / totalDays)

    return (
        <ScrollView>
            <InfoDisplay label='Days tracked' value={totalDays} />
            <InfoDisplay label='Total Calories tracked' value={totalKcals.toLocaleString()} />
            <InfoDisplay label='Average Kcals' value={avgKcalsPerDay.toLocaleString()} />
        </ScrollView>
    );
}

interface InfoDisplay {
    label: string;
    value: string | number;
    fontSize?: number;
};
export const InfoDisplay = ({ label, value, fontSize }: InfoDisplay) => {
    return (
        <View style={{ flexDirection: 'row', gap: 10, padding: 5 }}>
            <Text style={{ flexGrow: 1, flexShrink: 1, fontSize: fontSize ?? 20 }}>{label}</Text>
            <Text style={{ fontSize: fontSize ?? 20 }}>{value}</Text>
        </View>
    );
}

