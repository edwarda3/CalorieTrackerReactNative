import React from 'react';
import { MealData } from '../types/Model';
import ContextMenu, { ContextMenuAction } from 'react-native-context-menu-view';
import _ from 'lodash';
import { Text, View, ViewStyle } from 'react-native';
import { styles } from '../styles/Styles';
import { formatToAmPm } from '../types/Dates';

export interface MealEntryContextMenuAction extends ContextMenuAction {
    onPress?: () => void;
    hideOption?: boolean;
}

export interface MealEntryListItemProps {
    meal: MealData;
    actions: Array<MealEntryContextMenuAction>;
    containerStyling?: ViewStyle;
}

export const MealEntryListItem = ({ meal, actions, containerStyling }: MealEntryListItemProps) => (
    <ContextMenu
        previewBackgroundColor='rgba(0,0,0,0)'
        actions={_.map(actions.filter(a => !a.hideOption), (action) => _.omit(action, 'onPress'))}
        onPress={({ nativeEvent }) => {
            const matchedEvent = _.find(actions, (action) => action.title === nativeEvent.name);
            matchedEvent?.onPress?.();
        }}>
        <View style={{ padding: 10, flexDirection: 'row', gap: 20, alignItems: 'center', ...(containerStyling ?? {}) }}>
            <View style={{ flexDirection: 'column', flexGrow: 1, flexShrink: 1 }}>
                <Text style={styles.subLabel}>{formatToAmPm(meal.time)}</Text>
                <Text style={styles.label}>{_.startCase(meal.name)}</Text>
            </View>
            <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                <Text style={styles.subLabel}>{meal.servings} Serving(s)</Text>
                <Text style={styles.subLabel}>{meal.kcalPerServing} kcal/serving</Text>
            </View>
            <Text style={styles.label}>{meal.servings * meal.kcalPerServing}kcal</Text>
        </View>
    </ContextMenu>
)