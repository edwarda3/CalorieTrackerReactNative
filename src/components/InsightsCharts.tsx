import React, { useState } from 'react';
import { MonthData } from '../types/Model';
import { Pressable, Text, View, ViewStyle } from 'react-native';
import { Chart, Line, Area, HorizontalAxis, VerticalAxis, ChartDataPoint } from 'react-native-responsive-linechart'
import _ from 'lodash';
import { sortMealsByTime } from '../data/processing';
import { timeToFloat } from '../types/Dates';

export interface InsightsChartProps {
    monthData: MonthData;
    style?: ViewStyle;
}

export const InsightsChart = (props: InsightsChartProps) => {
    const [showing, setShowing] = useState<'byday' | 'byhour'>('byday');

    let earliestTime = 24;
    let latestTime = 24;
    let highestSingleMeal = 0;
    let highestDayKcals = 0;
    const dayTimelineData: ChartDataPoint[][] = [];
    const dayOverallData: ChartDataPoint[] = [];
    const keysInOrder = _.sortBy(Object.keys(props.monthData).map((key) => Number(key)));
    _.forEach(keysInOrder, (key) => {
        const stringKey = key.toString().padStart(2, '0');
        let kcalSum = 0;
        const individualDayData: ChartDataPoint[] = [];
        const sortedMeals = sortMealsByTime(props.monthData[stringKey]);
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
        dayOverallData.push({ x: key-.5, y: kcalSum });
        dayOverallData.push({ x: key+.5, y: kcalSum });
        highestDayKcals = Math.max(highestDayKcals, kcalSum);
    });

    let mealTimeRange = Math.abs(latestTime - earliestTime) + 1;
    const xMin = showing === 'byday' ? 0 : Math.floor(earliestTime);
    const xMax = showing === 'byday' ? 32 : latestTime;

    let yTickSize = 200;
    const dataYMax = (showing === 'byday' ? highestDayKcals : highestSingleMeal);
    if (dataYMax > 3600) {
        yTickSize = 400;
    }
    const toNearest500 = yTickSize - (dataYMax % yTickSize);
    const yMax = dataYMax + toNearest500;

    // BUG in Chart library causes Children to be invalid, wtf
    const NoTypeChart = Chart as any;
    return (
        <View style={{ alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', gap: 10, padding: 10, marginHorizontal: 10, alignItems: 'center' }}>
                <Pressable onPress={() => setShowing('byday')} style={{ paddingHorizontal: 10, paddingVertical: 2, borderWidth: showing === 'byday' ? 1 : 0, borderRadius: 3 }} >
                    <Text>By Day</Text>
                </Pressable>
                <Pressable onPress={() => setShowing('byhour')} style={{ paddingHorizontal: 10, paddingVertical: 2, borderWidth: showing === 'byhour' ? 1 : 0, borderRadius: 3 }} >
                    <Text>By Hour</Text>
                </Pressable>
            </View>
            <NoTypeChart
                style={{ height: 400, width: 400, ...props.style ?? {} }}
                padding={{ left: 60, bottom: 20, right: 20, top: 20 }}
                xDomain={{ min: xMin, max: xMax }}
                yDomain={{ min: 0, max: yMax }}
            >
                <VerticalAxis tickCount={Math.floor(yMax / yTickSize) + 1} theme={{ labels: { formatter: (v) => v.toFixed(2) } }} />
                <HorizontalAxis tickCount={showing === 'byday' ? 17 : mealTimeRange} />
                {showing === 'byday' ? (
                    <Area smoothing='none' theme={{
                        gradient: {
                            from: { color: '#5588aa', opacity: 0.8 },
                            to: { color: '#5588aa', opacity: 0.2 }
                        }
                    }} data={dayOverallData} />
                ) : (
                    _.map(dayTimelineData, (timelineData, index) => (
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
                    ))
                )}
            </NoTypeChart>
        </View >
    )
}