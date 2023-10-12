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
    let totalKcals = 0;
    const totalPerDay: number[] = [];
    const startingMinCalc = 999999;
    let minKcals = startingMinCalc;
    let maxKcals = 0;
    const today = getDateString(new Date());
    _.forEach(props.monthData ?? {}, (dayData, day) => {
        if (_.isEmpty(dayData) || _.sumBy(dayData, (day) => (day.kcalPerServing ?? 0) * (day.servings ?? 0)) === 0) {
            // skip the day if there is a sum of 0
            return;
        }
        totalDays += 1;
        const allKcals = _.sum(_.map(dayData, (meal) => meal.kcalPerServing * meal.servings));
        totalKcals += allKcals;
        totalPerDay.push(allKcals);
        if (today !== `${props.yearMonthKey}-${day}` && allKcals < minKcals) {
            // exclude "today" from the minimum stat, otherwise the partial day will usually be the lowest 
            minKcals = allKcals;
        }
        maxKcals = Math.max(allKcals, maxKcals)
    });
    const avgKcalsPerDay = totalDays > 0 ? Math.floor(totalKcals / totalDays) : 0;
    const medianKcals = getMedian(totalPerDay);
    const halfIndex = Math.floor(totalPerDay.length / 2);
    const p25 = getMedian(totalPerDay.slice(0, halfIndex));
    const p75 = getMedian(totalPerDay.slice(halfIndex, totalPerDay.length));
    const displayMinKcals = minKcals === startingMinCalc ? '-' : minKcals.toLocaleString();
    const displayP25Kcals = p25 === 0 ? '-' : p25.toLocaleString()
    const displayP75Kcals = p75 === 0 ? '-' : p75.toLocaleString()
    const displayMaxKcals = maxKcals === 0 ? '-' : maxKcals.toLocaleString()

    return (
        <View style={{ alignItems: 'flex-start' }}>
            <InfoDisplay label='Days tracked' value={totalDays} />
            <InfoDisplay label='Total Calories tracked' value={totalKcals.toLocaleString()} />
            <InfoDisplay fontSize={14} label='Min Kcals in a day' value={displayMinKcals} />
            <InfoDisplay fontSize={14} label='25th Percentile Kcals' value={displayP25Kcals} />
            <InfoDisplay
                onPress={() => props.onAverageTypeChange(props.averageType === 'median' ? 'mean' : 'median')}
                label={props.averageType === 'mean' ? 'Average Kcals' : '50th Percentile Kcals (Median)'}
                value={props.averageType === 'mean' ? avgKcalsPerDay.toLocaleString() : medianKcals.toLocaleString()}
            />
            <InfoDisplay fontSize={14} label='75th Percentile Kcals' value={displayP75Kcals} />
            <InfoDisplay fontSize={14} label='Max Kcals in a day' value={displayMaxKcals} />
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
