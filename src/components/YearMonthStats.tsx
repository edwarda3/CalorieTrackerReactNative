import React from 'react';
import { MonthData } from "../types/Model";
import { Pressable, Text, View } from 'react-native';
import _ from 'lodash';
import { getMedian } from './InsightsCharts';
import { SettingsSwitch, SettingsSwitchType } from './SettingsSwitch';

export type AverageType = 'mean' | 'median';

export interface YearMonthStatsProps {
    monthData?: MonthData;
    averageType: AverageType;
    onAverageTypeChange: (type: AverageType) => void;
}

export const YearMonthStats = (props: YearMonthStatsProps) => {
    let totalDays = 0;
    const totalPerDay: number[] = [];
    const totalKcals = _.reduce(props.monthData ?? {}, (acc, dayData) => {
        if (!_.isEmpty(dayData)) totalDays += 1;
        const allKcals = _.sum(_.map(dayData, (meal) => meal.kcalPerServing * meal.servings));
        totalPerDay.push(allKcals);
        return acc + allKcals;
    }, 0);
    const avgKcalsPerDay = totalDays > 0 ? Math.floor(totalKcals / totalDays) : 0;
    const medianKcals = getMedian(totalPerDay);

    return (
        <View style={{ alignItems: 'flex-start' }}>
            <InfoDisplay label='Days tracked' value={totalDays} />
            <InfoDisplay label='Total Calories tracked' value={totalKcals.toLocaleString()} />
            <InfoDisplay
                onPress={() => props.onAverageTypeChange(props.averageType === 'median' ? 'mean' : 'median')}
                label={props.averageType === 'mean' ? 'Average Kcals' : 'Median Kcals'}
                value={props.averageType === 'mean' ? avgKcalsPerDay.toLocaleString() : medianKcals.toLocaleString()}
            />
        </View>
    );
}

interface InfoDisplay {
    label: string;
    value: string | number;
    fontSize?: number;
    onPress?: () => void
};
export const InfoDisplay = ({ label, value, fontSize, onPress }: InfoDisplay) => {
    return (
        <Pressable onPress={onPress} style={{ flexDirection: 'row', gap: 10, padding: 5 }}>
            <Text style={{ flexGrow: 1, flexShrink: 1, fontSize: fontSize ?? 20 }}>{label}</Text>
            <Text style={{ fontSize: fontSize ?? 20 }}>{value}</Text>
        </Pressable>
    );
}
