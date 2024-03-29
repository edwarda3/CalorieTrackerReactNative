import React, { useState } from 'react';
import { MealData } from '../types/Model';
import ContextMenu, { ContextMenuAction } from 'react-native-context-menu-view';
import _ from 'lodash';
import { Pressable, Text, View, ViewStyle } from 'react-native';
import { styles } from '../styles/Styles';
import { formatToAmPm, getDifferenceInTimeFromNow } from '../types/Dates';
import { formatMealName } from '../styles/Formatter';

export interface MealEntryContextMenuAction extends ContextMenuAction {
    onPress?: () => void;
    hideOption?: boolean;
}

export interface MealEntryListItemProps {
    meal: MealData;
    actions: Array<MealEntryContextMenuAction>;
    containerStyling?: ViewStyle;
    onTimePressed?: () => void;
    showRelativeTime?: boolean;
}

const maxCharsPerLine = 20;
export const MealEntryListItem = ({ meal, actions, containerStyling, ...props }: MealEntryListItemProps) => {
    const mealName = formatMealName(meal.name);
    const mealNameNumberOfLines = Math.floor(mealName.length / maxCharsPerLine) + 1;
    return <ContextMenu
        previewBackgroundColor='rgba(0,0,0,0)'
        actions={_.map(actions.filter(a => !a.hideOption), (action) => _.omit(action, 'onPress'))}
        onPress={({ nativeEvent }) => {
            const matchedEvent = _.find(actions, (action) => action.title === nativeEvent.name);
            matchedEvent?.onPress?.();
        }}>
        <View style={{ padding: 10, flexDirection: 'row', gap: 20, alignItems: 'center', ...(containerStyling ?? {}) }}>
            <View style={{ flexDirection: 'column', flexGrow: 1, flexShrink: 1 }}>
                <Pressable onPress={() => props.onTimePressed?.()}>
                    <Text style={styles.subLabel}>{!props.showRelativeTime ? formatToAmPm(meal.time) : getDifferenceInTimeFromNow(meal.time)}</Text>
                </Pressable>
                <Text
                    style={styles.label}
                    adjustsFontSizeToFit
                    numberOfLines={mealNameNumberOfLines}
                >{formatMealName(meal.name)}</Text>
            </View>
            <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                <Text style={styles.subLabel}>{meal.servings} Serving(s)</Text>
                <Text style={styles.subLabel}>{meal.kcalPerServing} kcal/serving</Text>
            </View>
            <Text style={styles.label}>{meal.servings * meal.kcalPerServing}kcal</Text>
        </View>
    </ContextMenu>
}