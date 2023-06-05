import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, SafeAreaView, ScrollView, Share, Text, View } from 'react-native';
import { NavigatedScreenProps } from '../types/Navigation';
import _ from 'lodash';
import { DatabaseHandler } from '../data/database';
import { mergeDataStores, validateJsonStringAsDatastore } from '../data/processing';
import { DataStore, MonthData } from '../types/Model';
import { useFocusEffect } from '@react-navigation/native';
import { SelectList } from 'react-native-dropdown-select-list';
import { isCancel, pickSingle } from 'react-native-document-picker';
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
        try {
            const dataStore = await DatabaseHandler.getInstance().getAllKnownData();
            validateJsonStringAsDatastore(JSON.stringify(dataStore));
            setDatastore(dataStore);
        } catch (err) {
            setError(`Saved Datastore is invalid. Please import a new data store.`);
        }
    }

    useFocusEffect(
        useCallback(() => {
            refresh();
            return () => { };
        }, [])
    );

    const importAsOverride = async (newDataStore: DataStore) => {
        await DatabaseHandler.getInstance().importJsonFile(newDataStore);
        setDatastore(newDataStore);
        setStatus(`Successfully imported ${Object.keys(newDataStore.database).length} months and ${newDataStore.presets.length} presets`);
    }

    const importAsMerge = async (existingDataStore: DataStore, newDataStore: DataStore, prefer: 'existing'|'imported') => {
        const merged = mergeDataStores({
            preferredDataStore: prefer === 'existing' ? existingDataStore : newDataStore,
            mergingDataStore: prefer === 'existing' ? newDataStore : existingDataStore,
        });
        await DatabaseHandler.getInstance().importJsonFile(merged);
        setDatastore(merged);
        setStatus(`Successfully merged and imported ${Object.keys(merged.database).length} months and ${merged.presets.length} presets`);
    }

    const importFile = async () => {
        setError(null);
        setStatus(null);
        try {
            const file = await pickSingle({
                mode: 'import',
            });
            const resultStr = await readFile(file.uri);
            const imported = validateJsonStringAsDatastore(resultStr);
            if (dataStore && (!_.isEmpty(dataStore.database) || !_.isEmpty(dataStore.presets))) {
                Alert.alert(
                    'Import options',
                    `You currently have an existing data store with ${Object.keys(dataStore.database).length} months and ${dataStore.presets.length} presets. \
                    Do you want to replace this with the new datastore with ${Object.keys(imported.database).length} months and ${imported.presets.length} presets or merge?`,
                    [
                        {
                            text: 'Merge, preferring existing',
                            onPress: () => importAsMerge(dataStore, imported, 'existing'),
                            style: 'default'
                        },
                        {
                            text: 'Merge, preferring imported',
                            onPress: () => importAsMerge(dataStore, imported, 'imported'),
                            style: 'default'
                        },
                        {
                            text: 'Replace',
                            onPress: () => importAsOverride(imported),
                            style: 'destructive'
                        },
                        {
                            text: 'Cancel',
                            onPress: () => {},
                            style: 'cancel'
                        },
                    ]
                );
            } else {
                importAsOverride(imported);
            }
        } catch (err) {
            if (!isCancel(err)) {
                setError(`Failed to import data store. ${(err as Error).message}`)
            }
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

