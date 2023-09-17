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
    const startingMinCalc = 999999;
    let minKcals = startingMinCalc;
    let maxKcals = 0;
    const today = getDateString(new Date());
    const totalKcals = _.reduce(props.monthData ?? {}, (acc, dayData, day) => {
        if (_.isEmpty(dayData) || _.sumBy(dayData, (day) => (day.kcalPerServing ?? 0) * (day.servings ?? 0))) {
            // skip the day if there is a sum of 0
            return acc;
        }
        totalDays += 1;
        const allKcals = _.sum(_.map(dayData, (meal) => meal.kcalPerServing * meal.servings));
        totalPerDay.push(allKcals);
        if (today !== `${props.yearMonthKey}-${day}` && allKcals < minKcals) {
            // exclude "today" from the minimum stat, otherwise the partial day will usually be the lowest 
            minKcals = allKcals;
        }
        maxKcals = Math.max(allKcals, maxKcals)
        return acc + allKcals;
    }, 0);
    const avgKcalsPerDay = totalDays > 0 ? Math.floor(totalKcals / totalDays) : 0;
    const medianKcals = getMedian(totalPerDay);
    const displayMinKcals = minKcals === startingMinCalc ? '-' : minKcals.toLocaleString();
    const displayMaxKcals = maxKcals === 0 ? '-' : maxKcals.toLocaleString()

    return (
        <View style={{ alignItems: 'flex-start' }}>
            <InfoDisplay label='Days tracked' value={totalDays} />
            <InfoDisplay label='Total Calories tracked' value={totalKcals.toLocaleString()} />
            <InfoDisplay
                onPress={() => props.onAverageTypeChange(props.averageType === 'median' ? 'mean' : 'median')}
                label={props.averageType === 'mean' ? 'Average Kcals' : 'Median Kcals'}
                value={props.averageType === 'mean' ? avgKcalsPerDay.toLocaleString() : medianKcals.toLocaleString()}
            />
            <InfoDisplay label='Min Kcals in a day' value={displayMinKcals} />
            <InfoDisplay label='Max Kcals in a day' value={displayMaxKcals} />
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
