import React from 'react';
import * as _ from 'lodash';
import { View, Text, Pressable } from 'react-native';

export interface RowButtonSelectorOption<T> {
    value: T;
    label: string;
};

export interface RowButtonSelectorProps<T> {
    options: Array<RowButtonSelectorOption<T>>;
    selected: T;
    onSelectOption: (option: T) => void;
}

export function RowButtonSelector<T>(props: RowButtonSelectorProps<T>) {
    return (
        <View style={{ flexDirection: 'row', gap: 10, padding: 10, marginHorizontal: 10, alignItems: 'center' }}>
            {_.map(props.options, (option, index) => {
                const isSelected = _.isEqual(option.value, props.selected);
                return <Pressable
                    key={`${index}-${option.label}`}
                    onPress={() => props.onSelectOption(option.value)}
                    style={{ paddingHorizontal: 10, paddingVertical: 2, borderWidth: isSelected ? 1 : 0, borderRadius: 3 }}
                >
                    <Text>{option.label}</Text>
                </Pressable>
            })}
        </View>
    )
}