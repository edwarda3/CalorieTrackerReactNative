import React, { useState } from 'react';
import { MonthData } from '../types/Model';
import { Pressable, Text, View, ViewStyle } from 'react-native';
import { Chart, Line, Area, HorizontalAxis, VerticalAxis, ChartDataPoint } from 'react-native-responsive-linechart'
import _ from 'lodash';
import { sortMealsByTime } from '../data/processing';
import { timeToFloat } from '../types/Dates';
import { YearMonthStats } from './YearMonthStats';
import { styles } from '../styles/Styles';
import ContextMenu from 'react-native-context-menu-view';

export interface InsightsChartProps {
    monthData?: MonthData;
    style?: ViewStyle;
}

type InsightDisplayMode = 'byday' | 'byhour' | 'textstats';

export const InsightsChart = (props: InsightsChartProps) => {
    const [showing, setShowing] = useState<InsightDisplayMode>('byday');

    let earliestTime = 24;
    let latestTime = 24;
    let highestSingleMeal = 0;
    let highestDayKcals = 0;
    const dayTimelineData: ChartDataPoint[][] = [];
    const dayOverallData: ChartDataPoint[] = [];
    const keysInOrder = _.sortBy(Object.keys(props.monthData ?? {}).map((key) => Number(key)));
    _.forEach(keysInOrder, (key) => {
        const stringKey = key.toString().padStart(2, '0');
        let kcalSum = 0;
        const individualDayData: ChartDataPoint[] = [];
        const sortedMeals = sortMealsByTime(props.monthData?.[stringKey] ?? []);
        let dayEarliestTime = 24;
        let dayLatestTime = 0;
        _.forEach(sortedMeals, (mealData) => {
            const mealTime = timeToFloat(mealData.time);
            dayEarliestTime = Math.min(dayEarliestTime, Math.floor(mealTime));
            dayLatestTime = Math.max(dayLatestTime, Math.floor(mealTime) + 1);
        });
        // For each relevant hour range, we add up all the meals in some hour.
        _.forEach(_.range(dayEarliestTime, dayLatestTime + 1), (time) => {
            let hourTotal = 0;
            _.forEach(sortedMeals, (mealData) => {
                if (Math.floor(timeToFloat(mealData.time)) === time) {
                    hourTotal += mealData.servings * mealData.kcalPerServing;
                    kcalSum += mealData.servings * mealData.kcalPerServing;
                }
            });
            // fake bar chart lol
            individualDayData.push({ x: time, y: hourTotal });
            individualDayData.push({ x: time + 1, y: hourTotal });
            highestSingleMeal = Math.max(highestSingleMeal, hourTotal);
        })
        earliestTime = Math.min(earliestTime, dayEarliestTime);
        latestTime = Math.max(latestTime, dayLatestTime);
        dayTimelineData.push(individualDayData);
        // fake bar chart again
        dayOverallData.push({ x: key - .5, y: kcalSum });
        dayOverallData.push({ x: key + .5, y: kcalSum });
        highestDayKcals = Math.max(highestDayKcals, kcalSum);
    });

    console.log(`dayOverall ${JSON.stringify(dayOverallData)}`)

    const roundToNearest = (precise: number, roundInterval: number): number => {
        const toNearestInterval = roundInterval - (precise % roundInterval);
        return precise + toNearestInterval;
    }

    const displayByMode: Record<InsightDisplayMode, () => JSX.Element> = {
        'textstats': () => <YearMonthStats monthData={props.monthData} />,
        'byday': () => {
            if (_.isEmpty(dayOverallData)) {
                return <Text style={styles.subLabel}>No Data</Text>
            }
            const yTickSize = highestDayKcals > 3600 ? 800 : 400;
            const yMax = roundToNearest(highestDayKcals, yTickSize);
            return <NoTypeChart
                style={{ height: 250, width: 400, ...props.style ?? {} }}
                padding={{ left: 60, bottom: 20, right: 20, top: 20 }}
                xDomain={{ min: 0, max: 32 }}
                yDomain={{ min: 0, max: yMax }}
            >
                <VerticalAxis tickCount={Math.floor(yMax / yTickSize) + 1} theme={{ labels: { formatter: (v) => v.toFixed(2) } }} />
                <HorizontalAxis tickCount={17} />
                <Area
                    smoothing='none'
                    theme={{
                        gradient: {
                            from: { color: '#5588aa', opacity: 0.8 },
                            to: { color: '#5588aa', opacity: 0.2 }
                        }
                    }}
                    data={dayOverallData}
                />
            </NoTypeChart>
        },
        'byhour': () => {
            const mealTimeRange = Math.abs(latestTime - earliestTime) + 1;
            const yTickSize = 200;
            const yMax = roundToNearest(highestSingleMeal, yTickSize);
            return <NoTypeChart
                style={{ height: 400, width: 400, ...props.style ?? {} }}
                padding={{ left: 60, bottom: 20, right: 20, top: 20 }}
                xDomain={{ min: Math.floor(earliestTime), max: latestTime }}
                yDomain={{ min: 0, max: yMax }}
            >
                <VerticalAxis tickCount={Math.floor(yMax / yTickSize) + 1} theme={{ labels: { formatter: (v) => v.toFixed(2) } }} />
                <HorizontalAxis tickCount={mealTimeRange} />
                {_.map(dayTimelineData, (timelineData, index) => (
                    <Area
                        key={`day-${index}`}
                        smoothing='none'
                        theme={{
                            gradient: {
                                from: { color: '#5588aa', opacity: 0.2 },
                                to: { color: '#5588aa', opacity: 0.2 }
                            }
                        }}
                        data={timelineData}
                    />
                ))}
            </NoTypeChart>
        }
    }

    // BUG in Chart library causes Children to be invalid, wtf
    const NoTypeChart = Chart as any;
    return (
        <View style={{ alignItems: 'center' }}>
            <RowViewSelector<InsightDisplayMode>
                options={[
                    { value: 'textstats', label: 'Stats' },
                    { value: 'byday', label: 'By Day' },
                    { value: 'byhour', label: 'By Hour' },
                ]}
                selected={showing}
                onSelectOption={(option) => setShowing(option)}
            />
            {displayByMode[showing]()}
        </View >
    )
}

export interface RowViewSelectorOption<T> {
    value: T;
    label: string;
};

export interface RowViewSelectorProps<T> {
    options: Array<RowViewSelectorOption<T>>;
    selected: T;
    onSelectOption: (option: T) => void;
}

export function RowViewSelector<T>(props: RowViewSelectorProps<T>) {
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