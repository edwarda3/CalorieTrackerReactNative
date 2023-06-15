import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Modal, Pressable, SafeAreaView, ScrollView, Share, Text, View } from 'react-native';
import { NavigatedScreenProps, NavigationPages, pageDetails } from '../types/Navigation';
import _ from 'lodash';
import { DatabaseHandler } from '../data/database';
import { mergeDataStores, validateJsonStringAsDatastore } from '../data/processing';
import { DataStore, MonthData } from '../types/Model';
import { useFocusEffect } from '@react-navigation/native';
import { Select } from 'native-base';
import { isCancel, pickSingle } from 'react-native-document-picker';
import { readFile } from 'react-native-fs';
import { getYearMonthIndex } from '../types/Dates';
import { styles } from '../styles/Styles';
import { HorizontalLine } from '../components/Layout';
import { ExtensibleButton } from '../components/Buttons';
import { InsightsChart } from '../components/InsightsCharts';
import { getSurroundingMonths } from './CalendarPage';
import { SFSymbol } from 'react-native-sfsymbols';

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
            props.navigation.setOptions({
                headerRight: () => (
                    <ExtensibleButton
                        title=''
                        symbol={{
                            name: pageDetails[NavigationPages.SETTINGS].symbolName,
                            color: 'white',
                            scale: 'medium',
                            weight: 'thin',
                        }}
                        onPress={() => props.navigation.navigate(NavigationPages.SETTINGS)}
                    />
                )
            });
            refresh();
            return () => { };
        }, [])
    );

    const importAsOverride = async (newDataStore: DataStore) => {
        await DatabaseHandler.getInstance().importJsonFile(newDataStore);
        setDatastore(newDataStore);
        setStatus(`Successfully imported ${Object.keys(newDataStore.database).length} months and ${newDataStore.presets.length} presets`);
    }

    const importAsMerge = async (existingDataStore: DataStore, newDataStore: DataStore, prefer: 'existing' | 'imported') => {
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
                            onPress: () => { },
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

    const { previousMonth, nextMonth } = getSurroundingMonths(inspectMonth);
    const yearMonthsSelectOptions = Object.keys(dataStore?.database ?? {}).sort().reverse();

    return (
        <SafeAreaView style={{
            flex: 1, // cuts off the render at the bottom of the screen edge, to prevent FlatList from extending past the screen.
        }}>
            <View style={{ padding: 10, flexDirection: 'column' }}>
                <Text style={{ alignSelf: 'center' }}>{Object.keys(dataStore?.database ?? {}).length} months tracked.</Text>
                <Button title='Export data' onPress={() => {
                    Share.share({
                        message: JSON.stringify(dataStore),
                    })
                }} disabled={!dataStore} />
                <Button title='Import data' onPress={importFile} />
                {error && <Text style={styles.errorText}>{error}</Text>}
                {status && <Text style={styles.statusText}>{status}</Text>}
                <HorizontalLine marginVertical={10} />
                <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 10, justifyContent: 'center', alignItems: 'center' }}>
                    <ExtensibleButton title='' symbol={{ name: 'arrowtriangle.left.fill' }} onPress={() => setInspectMonth(previousMonth)} />
                    <Select
                        defaultValue={defaultInspectionMonth}
                        selectedValue={inspectMonth}
                        onValueChange={(text) => setInspectMonth(text)}
                        accessibilityLabel='Select Month to Inspect'
                        placeholder='Select Month'
                        variant='unstyled'
                        _selectedItem={{
                            bg: "lightblue",
                        }}
                        dropdownIcon={<></>}
                        {...{
                            textAlign: 'center',
                            fontSize: 16,
                            minWidth: 150,
                            borderWidth: 0,
                        }}
                    >
                        {_.map(yearMonthsSelectOptions, (ym) => (
                            <Select.Item key={ym} label={ym} value={ym} />
                        ))}
                        {!yearMonthsSelectOptions.includes(inspectMonth) && <Select.Item key={inspectMonth} label={inspectMonth} value={inspectMonth} />}
                        <Text>{inspectMonth}</Text>
                    </Select>
                    <ExtensibleButton title='' symbol={{ name: 'arrowtriangle.right.fill' }} onPress={() => setInspectMonth(nextMonth)} />
                </View>
                {(!dataStore || !dataStore?.database?.[inspectMonth]) ?
                    <Text>No information for {inspectMonth}</Text> :
                    <View>
                        <YearMonthStats monthData={dataStore.database[inspectMonth]} />
                        <InsightsChart monthData={dataStore.database[inspectMonth]} />
                    </View>
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

