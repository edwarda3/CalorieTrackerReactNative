import React from 'react';
import { View, ViewProps, Switch, Text } from 'react-native';
import { bespokeStyle, styles } from '../styles/Styles';
import { } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDateString, getTimeHourMinutes } from '../types/Dates';
import { Select } from 'native-base';
import _ from 'lodash';

export type SettingsSwitchProps = SettingsBooleanSwitchProps | SettingsTimeSwitchProps | SettingsSelectSwitchProps;

interface SettingsSwitchBaseProps extends ViewProps {
    label: string;
    description: string;
    type: SettingsSwitchType;
}

export enum SettingsSwitchType {
    Toggle = 'toggle',
    Time = 'time',
    Select = 'select'
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

export interface SettingsSelectSwitchProps extends SettingsSwitchBaseProps {
    type: SettingsSwitchType.Select;
    defaultValue?: string;
    value: string;
    placeholder?: string;
    options: Array<{value: string, label: string}>;
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
        ),
        [SettingsSwitchType.Select]: (props: SettingsSelectSwitchProps) => (
            <View>
                <Select
                    defaultValue={props.defaultValue}
                    selectedValue={props.value}
                    onValueChange={(text) => props.onValueChanged(text)}
                    accessibilityLabel={props.accessibilityLabel}
                    placeholder={props.placeholder}
                    variant='unstyled'
                    {...{
                        textAlign: 'right',
                        fontSize: 16,
                        minWidth: 200,
                        borderWidth: 0,
                    }}
                >
                    {_.map(props.options, (option) => (
                        <Select.Item key={option.value} label={option.label} value={option.value} />
                    ))}
                </Select>
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