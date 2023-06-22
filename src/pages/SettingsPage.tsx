import React, { useCallback, useState } from 'react';
import { Alert, Button, SafeAreaView, ScrollView, Share, Switch, Text, View, ViewProps, ViewStyle } from 'react-native';
import { NavigatedScreenProps } from '../types/Navigation';
import _ from 'lodash';
import { AppSettings, getDefaultSettings, settingsDescriptions } from '../types/Settings';
import { DatabaseHandler } from '../data/database';
import { useFocusEffect } from '@react-navigation/native';
import { isCancel, pickSingle } from 'react-native-document-picker';
import { readFile } from 'react-native-fs';
import { SettingsSwitch, SettingsSwitchType } from '../components/SettingsSwitch';
import { HorizontalLine } from '../components/Layout';
import { DataStore } from '../types/Model';
import { mergeDataStores, validateJsonStringAsDatastore } from '../data/processing';
import { DateFormat, formatDateWithStyle, getDateString } from '../types/Dates';

export function SettingsPage(props: NavigatedScreenProps): JSX.Element {
    const [dataStore, setDataStore] = useState<DataStore | null>();

    const persistAppSettings = async (changes: Partial<AppSettings>) => {
        const newAppSettings: AppSettings = {
            ...getDefaultSettings(),
            ...dataStore?.settings ?? {},
            ...changes
        };
        await DatabaseHandler.getInstance().setAppSettings(newAppSettings);
        if (dataStore) {
            setDataStore({ ...dataStore, settings: newAppSettings });
        }
    }


    const importAsOverride = async (newDataStore: DataStore) => {
        await DatabaseHandler.getInstance().importJsonFile(newDataStore);
        setDataStore(newDataStore);
        Alert.alert('Success', `Successfully imported ${Object.keys(newDataStore.database).length} months and ${newDataStore.presets.length} presets`);
    }

    const importAsMerge = async (existingDataStore: DataStore, newDataStore: DataStore, prefer: 'existing' | 'imported') => {
        const merged = mergeDataStores({
            preferredDataStore: prefer === 'existing' ? existingDataStore : newDataStore,
            mergingDataStore: prefer === 'existing' ? newDataStore : existingDataStore,
        });
        await DatabaseHandler.getInstance().importJsonFile(merged);
        setDataStore(merged);
        Alert.alert('Success', `Successfully merged and imported ${Object.keys(merged.database).length} months and ${merged.presets.length} presets`);
    }

    const importFile = async () => {
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
                Alert.alert('Error', `Failed to import data store. ${(err as Error).message}`)
            }
        }
    }

    const exportDataStore = (store: DataStore) => {
        Share.share({
            message: JSON.stringify(store),
        })
    }

    const refresh = async () => {
        const loadedStore = await DatabaseHandler.getInstance().getAllKnownData();
        try {
            validateJsonStringAsDatastore(JSON.stringify(loadedStore));
            setDataStore(loadedStore);
        } catch (err) {
            Alert.alert(
                'DataStore Corrupted',
                `Saved Datastore is invalid. Please import a new data store. ${JSON.stringify(err)}`,
                [
                    { text: 'Export Current', onPress: () => exportDataStore(loadedStore) },
                    {
                        text: 'Reset Data', style: 'destructive', onPress: () => importAsOverride({
                            database: {},
                            presets: [],
                            settings: getDefaultSettings(),
                        })
                    },
                ]
            );
        }
    }

    useFocusEffect(useCallback(() => {
        refresh()
    }, []));

    const appSettings = dataStore?.settings ?? getDefaultSettings();

    // effectively ignore time so that we can ignore timezone here.
    const todayUTC = new Date(getDateString(new Date()));

    return (
        <SafeAreaView style={{
            flex: 1, // cuts off the render at the bottom of the screen edge, to prevent FlatList from extending past the screen.
        }}>
            <ScrollView style={{ padding: 10, flexDirection: 'column', flexGrow: 1 }}>
                <Text style={{ alignSelf: 'center' }}>{Object.keys(dataStore?.database ?? {}).length} months tracked.</Text>
                <SettingsSwitch
                    type={SettingsSwitchType.Toggle}
                    value={appSettings.timeFormat === '12'}
                    label='Use 12-hour'
                    description={settingsDescriptions.timeFormat(appSettings)}
                    onValueChanged={(isEnabled) => persistAppSettings({ timeFormat: isEnabled ? '12' : '24' })}
                />
                <SettingsSwitch
                    type={SettingsSwitchType.Select}
                    value={appSettings.dateFormat}
                    label='Date Format'
                    description={settingsDescriptions.dateFormat(appSettings)}
                    onValueChanged={(format) => {
                        console.log(`dateFormat changed to ${format}`)
                        persistAppSettings({ dateFormat: format as DateFormat })
                    }}
                    options={[
                        { value: 'Month DD, YYYY', label: formatDateWithStyle(todayUTC, 'Month DD, YYYY', true) },
                        { value: 'DD Month YYYY', label: formatDateWithStyle(todayUTC, 'DD Month YYYY', true) },
                        { value: 'YYYY Month DD', label: formatDateWithStyle(todayUTC, 'YYYY Month DD', true) },
                        { value: 'DD-MM-YYYY', label: formatDateWithStyle(todayUTC, 'DD-MM-YYYY', true) },
                        { value: 'DD/MM/YYYY', label: formatDateWithStyle(todayUTC, 'DD/MM/YYYY', true) },
                        { value: 'MM-DD-YYYY', label: formatDateWithStyle(todayUTC, 'MM-DD-YYYY', true) },
                        { value: 'MM/DD/YYYY', label: formatDateWithStyle(todayUTC, 'MM/DD/YYYY', true) },
                        { value: 'YYYY-MM-DD', label: formatDateWithStyle(todayUTC, 'YYYY-MM-DD', true) },
                        { value: 'YYYY/MM/DD', label: formatDateWithStyle(todayUTC, 'YYYY/MM/DD', true) },
                    ]}
                />
                <HorizontalLine />
                <SettingsSwitch
                    type={SettingsSwitchType.Toggle}
                    value={appSettings.itemPageHasIntermediateDayPage}
                    label='Going back from Entry always shows Day view'
                    description={settingsDescriptions.itemPageHasIntermediateDayPage(appSettings)}
                    onValueChanged={(isEnabled) => persistAppSettings({ itemPageHasIntermediateDayPage: isEnabled })}
                />
                <HorizontalLine />
                <SettingsSwitch
                    type={SettingsSwitchType.Toggle}
                    value={appSettings.addOneOnAllDays}
                    label='Show "Add 1 Serving" on all days'
                    description={settingsDescriptions.addOneOnAllDays(appSettings)}
                    onValueChanged={(isEnabled) => persistAppSettings({ addOneOnAllDays: isEnabled })}
                />
                <HorizontalLine />
                <SettingsSwitch
                    type={SettingsSwitchType.Toggle}
                    value={appSettings.enableRollover}
                    label='Enable Rollover'
                    description={settingsDescriptions.enableRollover(appSettings)}
                    onValueChanged={(isEnabled) => persistAppSettings({ enableRollover: isEnabled })}
                />
                {appSettings?.enableRollover && <View style={{ flexDirection: 'column', paddingLeft: 10 }}>
                    <SettingsSwitch
                        type={SettingsSwitchType.Time}
                        value={appSettings.rolloverPeriod}
                        label='Rollover Period'
                        description={settingsDescriptions.rolloverPeriod(appSettings)}
                        onValueChanged={(newValue) => persistAppSettings({ rolloverPeriod: newValue })}
                    />
                    <SettingsSwitch
                        type={SettingsSwitchType.Toggle}
                        value={appSettings.promptForRollover}
                        label='Prompt when adding via Rollover'
                        description={settingsDescriptions.promptForRollover(appSettings)}
                        onValueChanged={(isEnabled) => persistAppSettings({ promptForRollover: isEnabled })}
                    />
                </View>}
                <HorizontalLine />

            </ScrollView>
            <View style={{ flexGrow: 1, flexShrink: 1 }}></View>
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'space-evenly', alignItems: 'center' }}>
                {dataStore && <Button title='Export data' onPress={() => exportDataStore(dataStore)} disabled={!dataStore} />}
                <Button title='Import data' onPress={importFile} />
            </View>
            <Button title='Reset Settings to Default' onPress={() => Alert.alert(
                'Reset Settings',
                `Do you want to reset the settings to default? Your current settings will be lost, Export on the Profile page to save them.`,
                [
                    {
                        text: 'Reset',
                        onPress: () => persistAppSettings(getDefaultSettings()),
                        style: 'destructive'
                    },
                    {
                        text: 'Cancel',
                        onPress: () => { },
                        style: 'cancel'
                    },
                ]
            )} />
        </SafeAreaView>
    );
}
