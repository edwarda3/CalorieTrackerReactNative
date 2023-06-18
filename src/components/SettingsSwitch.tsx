import React from 'react';
import { View, ViewProps, Switch, Text } from 'react-native';
import { bespokeStyle, styles } from '../styles/Styles';
import { } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDateString, getTimeHourMinutes } from '../types/Dates';

export type SettingsSwitchProps = SettingsBooleanSwitchProps | SettingsTimeSwitchProps;

interface SettingsSwitchBaseProps extends ViewProps {
    label: string;
    description: string;
    type: SettingsSwitchType;
}

export enum SettingsSwitchType {
    Toggle = 'toggle',
    Time = 'time',
}

export interface SettingsBooleanSwitchProps extends SettingsSwitchBaseProps {
    type: SettingsSwitchType.Toggle;
    value: boolean;
    onValueChanged: (isEnabled: boolean) => void;
}
export interface SettingsTimeSwitchProps extends SettingsSwitchBaseProps {
    type: SettingsSwitchType.Time;
    value: string;
    onValueChanged: (newValue: string) => void;
}

export const SettingsSwitch = (props: SettingsSwitchProps) => {

    const getValueEditorComponent = () => ({
        [SettingsSwitchType.Toggle]: (props: SettingsBooleanSwitchProps) => (
            <Switch
                value={props.value}
                onValueChange={props.onValueChanged}
            />
        ),
        [SettingsSwitchType.Time]: (props: SettingsTimeSwitchProps) => (
            <View>
                <DateTimePicker
                    onChange={({ type }, date) => {
                        if (type === 'set' && date) {
                            props.onValueChanged(getTimeHourMinutes(date))
                        }
                    }}
                    value={new Date(`${getDateString(new Date())} ${props.value}`)}
                    mode='time'
                    locale='en'
                />
            </View>
        )
    } as Record<SettingsSwitchType, (props: SettingsSwitchProps) => JSX.Element>)[props.type](props);


    return (
        <View style={{ flexDirection: 'column', gap: 2, padding: 10 }}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Text style={bespokeStyle('label', { flexGrow: 1, flexShrink: 1 })}>{props.label}</Text>
                {getValueEditorComponent()}
            </View>
            <Text style={styles.subLabel}>{props.description}</Text>
        </View>
    );
}