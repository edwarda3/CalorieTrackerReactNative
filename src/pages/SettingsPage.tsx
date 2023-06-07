import React, { useCallback, useEffect, useState } from 'react';
import { Button, SafeAreaView, Switch, Text, TextInput, View } from 'react-native';
import { NavigatedScreenProps } from '../types/Navigation';
import _ from 'lodash';
import { AppSettings, getDefaultSettings } from '../types/Model';
import { DatabaseHandler } from '../data/database';
import { useFocusEffect } from '@react-navigation/native';
import { bespokeStyle, styles } from '../styles/Styles';

export function SettingsPage(props: NavigatedScreenProps): JSX.Element {
    const [appSettings, setAppSettings] = useState<AppSettings | null>();

    const persistAppSettings = async (changes: Partial<AppSettings>) => {
        const newAppSettings = {...getDefaultSettings(), ...appSettings, ...changes};
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
                <View style={{ flexDirection: 'row', gap: 10, padding: 10 }}>
                    <Text style={bespokeStyle('label', { flexGrow: 1, flexShrink: 1 })}>Use 12-hour</Text>
                    <Switch
                        value={appSettings?.timeFormat === '12'}
                        onValueChange={(newVal) => persistAppSettings({ timeFormat: newVal ? '12' : '24' })}
                    />
                </View>
                <View style={{ flexDirection: 'row', gap: 10, padding: 10 }}>
                    <Text style={bespokeStyle('label', { flexGrow: 1, flexShrink: 1 })}>Going back from Entry always shows Day view</Text>
                    <Switch
                        value={appSettings?.itemPageHasIntermediateDayPage}
                        onValueChange={(newVal) => persistAppSettings({ itemPageHasIntermediateDayPage: newVal })}
                    />
                </View>
                <View style={{flexGrow: 1, flexShrink: 1}}></View>
                <Button title='Reset Settings to Default' onPress={() => persistAppSettings(getDefaultSettings())} />
            </View>
        </SafeAreaView>
    );
}
