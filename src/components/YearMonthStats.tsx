import React from 'react';
import { MonthData } from "../types/Model";
import { Pressable, Text, View } from 'react-native';
import _ from 'lodash';
import { getMedian } from './InsightsCharts';
import { SettingsSwitch, SettingsSwitchType } from './SettingsSwitch';
import { getDateString } from '../types/Dates';

export type AverageType = 'mean' | 'median';

export interface YearMonthStatsProps {
    yearMonthKey: string;
    monthData?: MonthData;
    averageType: AverageType;
    onAverageTypeChange: (type: AverageType) => void;
}

export const YearMonthStats = (props: YearMonthStatsProps) => {
    let totalDays = 0;
    const totalPerDay: number[] = [];
    let minKcals = 999999;
    let maxKcals = 0;
    const today = getDateString(new Date());
    const totalKcals = _.reduce(props.monthData ?? {}, (acc, dayData, day) => {
        if (!_.isEmpty(dayData)) totalDays += 1;
        const allKcals = _.sum(_.map(dayData, (meal) => meal.kcalPerServing * meal.servings));
        totalPerDay.push(allKcals);
        if (today !== `${props.yearMonthKey}-${day}` && allKcals < minKcals) {
            minKcals = allKcals;
        }
        maxKcals = Math.max(allKcals, maxKcals)
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
            <InfoDisplay label='Min Kcals in a day' value={minKcals.toLocaleString()} />
            <InfoDisplay label='Max Kcals in a day' value={maxKcals.toLocaleString()} />
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
