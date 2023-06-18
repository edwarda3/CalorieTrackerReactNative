import React, { useCallback, useState } from 'react';
import { Alert, Button, SafeAreaView, Switch, Text, View, ViewProps, ViewStyle } from 'react-native';
import { NavigatedScreenProps } from '../types/Navigation';
import _ from 'lodash';
import { AppSettings, getDefaultSettings, settingsDescriptions } from '../types/Settings';
import { DatabaseHandler } from '../data/database';
import { useFocusEffect } from '@react-navigation/native';
import { SettingsSwitch, SettingsSwitchType } from '../components/SettingsSwitch';
import { HorizontalLine } from '../components/Layout';

export function SettingsPage(props: NavigatedScreenProps): JSX.Element {
    const [appSettings, setAppSettings] = useState<AppSettings>(getDefaultSettings());

    const persistAppSettings = async (changes: Partial<AppSettings>) => {
        const newAppSettings = { ...getDefaultSettings(), ...appSettings, ...changes };
        setAppSettings(newAppSettings);
        await DatabaseHandler.getInstance().setAppSettings(newAppSettings);
    }

    useFocusEffect(useCallback(() => {
        DatabaseHandler.getInstance().getAppSettings().then((settings) => setAppSettings(settings));
    }, []));

    return (
        <SafeAreaView style={{
            flex: 1, // cuts off the render at the bottom of the screen edge, to prevent FlatList from extending past the screen.
        }}>
            <View style={{ padding: 10, flexDirection: 'column', flexGrow: 1 }}>

                <SettingsSwitch
                    type={SettingsSwitchType.Toggle}
                    value={appSettings?.timeFormat === '12'}
                    label='Use 12-hour'
                    description={settingsDescriptions.timeFormat(appSettings)}
                    onValueChanged={(isEnabled) => persistAppSettings({ timeFormat: isEnabled ? '12' : '24' })}
                />
                <HorizontalLine />
                <SettingsSwitch
                    type={SettingsSwitchType.Toggle}
                    value={appSettings?.itemPageHasIntermediateDayPage}
                    label='Going back from Entry always shows Day view'
                    description={settingsDescriptions.itemPageHasIntermediateDayPage(appSettings)}
                    onValueChanged={(isEnabled) => persistAppSettings({ itemPageHasIntermediateDayPage: isEnabled })}
                />
                <HorizontalLine />
                <SettingsSwitch
                    type={SettingsSwitchType.Toggle}
                    value={appSettings?.enableRollover}
                    label='Enable Rollover'
                    description={settingsDescriptions.enableRollover(appSettings)}
                    onValueChanged={(isEnabled) => persistAppSettings({ enableRollover: isEnabled })}
                />
                {appSettings?.enableRollover && <View style={{flexDirection: 'column', paddingLeft: 10}}>
                    <SettingsSwitch
                        type={SettingsSwitchType.Time}
                        value={appSettings?.rolloverPeriod}
                        label='Rollover Period'
                        description={settingsDescriptions.rolloverPeriod(appSettings)}
                        onValueChanged={(newValue) => persistAppSettings({ rolloverPeriod: newValue })}
                    />
                    <SettingsSwitch
                        type={SettingsSwitchType.Toggle}
                        value={appSettings?.promptForRollover}
                        label='Prompt when adding via Rollover'
                        description={settingsDescriptions.promptForRollover(appSettings)}
                        onValueChanged={(isEnabled) => persistAppSettings({ promptForRollover: isEnabled })}
                    />
                </View>}
                <HorizontalLine />

                <View style={{ flexGrow: 1, flexShrink: 1 }}></View>
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
            </View>
        </SafeAreaView>
    );
}
