import React from 'react';
import { MonthData } from "../types/Model";
import { Text, View } from 'react-native';
import _ from 'lodash';

export interface YearMonthStatsProps {
    monthData?: MonthData;
}

export const YearMonthStats = ({ monthData }: YearMonthStatsProps) => {
    let totalDays = 0;
    const totalKcals = _.reduce(monthData ?? {}, (acc, dayData) => {
        if (!_.isEmpty(dayData)) totalDays += 1;
        const allKcals = _.sum(_.map(dayData, (meal) => meal.kcalPerServing * meal.servings));
        return acc + allKcals;
    }, 0);
    const avgKcalsPerDay = totalDays > 0 ? Math.floor(totalKcals / totalDays) : 0;

    return (
        <View style={{alignItems: 'flex-start'}}>
            <InfoDisplay label='Days tracked' value={totalDays} />
            <InfoDisplay label='Total Calories tracked' value={totalKcals.toLocaleString()} />
            <InfoDisplay label='Average Kcals' value={avgKcalsPerDay.toLocaleString()} />
        </View>
    );
}

interface InfoDisplay {
    label: string;
    value: string | number;
    fontSize?: number;
};
export const InfoDisplay = ({ label, value, fontSize }: InfoDisplay) => {
    return (
        <View style={{ flexDirection: 'row', gap: 10, padding: 5 }}>
            <Text style={{ flexGrow: 1, flexShrink: 1, fontSize: fontSize ?? 20 }}>{label}</Text>
            <Text style={{ fontSize: fontSize ?? 20 }}>{value}</Text>
        </View>
    );
}
