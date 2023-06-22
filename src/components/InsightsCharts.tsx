import React, { useState } from 'react';
import { MonthData } from '../types/Model';
import { Pressable, Text, View, ViewStyle, processColor } from 'react-native';
import { Chart, Line, Area, HorizontalAxis, VerticalAxis, ChartDataPoint } from 'react-native-responsive-linechart'
import _ from 'lodash';
import { sortMealsByTime } from '../data/processing';
import { timeToFloat } from '../types/Dates';
import { YearMonthStats } from './YearMonthStats';
import { styles } from '../styles/Styles';
import { BarChart, BarData, BarDataset, BarValue } from 'react-native-charts-wrapper';
import { RowButtonSelector } from './RowButtonSelector';
import { getColorPerCalories } from './ThresholdBar';
import { Thresholds } from '../types/Settings';

export interface InsightsChartProps {
    monthData?: MonthData;
    thresholds?: Thresholds;
    style?: ViewStyle;
}

type InsightDisplayMode = 'byday' | 'byhour' | 'textstats';

export const InsightsChart = (props: InsightsChartProps) => {
    const [showing, setShowing] = useState<InsightDisplayMode>('byday');

    const roundToNearest = (precise: number, roundInterval: number): number => {
        const toNearestInterval = roundInterval - (precise % roundInterval);
        return precise + toNearestInterval;
    }

    const displayByMode: Record<InsightDisplayMode, () => JSX.Element> = {
        'textstats': () => <YearMonthStats monthData={props.monthData} />,
        'byday': () => {
            const { data, xMax, xMin, yMax, yMin } = getChartDataKcalsPerDay(props.monthData ?? {});
            if (_.isEmpty(data)) {
                return <Text style={styles.subLabel}>No Data</Text>
            }
            const yTickSize = yMax > 3600 ? 800 : 400;
            const roundedYMax = roundToNearest(yMax, yTickSize);
            return <BarChart
                style={{ height: 250, width: 400, padding: 10, ...props.style ?? {} }}
                visibleRange={{
                    x: {min: xMin, max: xMax},
                    y: {left: {min: yMin, max: roundedYMax}}
                }}
                highlightFullBarEnabled={false}
                legend={{enabled: false}}
                marker={{enabled: false}}
                doubleTapToZoomEnabled={false}
                pinchZoom={false}
                scaleEnabled={false}
                dragEnabled={false}
                drawGridBackground={false}
                drawBorders={false}
                borderWidth={0}
                xAxis={{
                    enabled: true,
                    position: 'TOP',
                    drawAxisLine: false,
                    textColor: processColor('black'),
                    drawGridLines: true,
                    gridDashedLine: {
                        lineLength: 1,
                        spaceLength: 3,
                        phase: 1,
                    },
                    axisMaximum: xMax,
                    labelCount: Math.floor(data.length / 2)
                }}
                yAxis={{
                    left: {
                        enabled: false,
                        drawGridLines: false,
                        drawAxisLine: false,
                    },
                    right: {
                        enabled: false,
                        drawGridLines: false,
                        drawAxisLine: false,
                    }
                }}
                data={{
                    dataSets: [
                        {
                            label: '',
                            values: data,
                            config: {
                                colors: props.thresholds ? data.map(({ y }) => {
                                    return processColor(getColorPerCalories(props.thresholds!, y as number))
                                }) : undefined,
                                valueTextColor: processColor('darkslategrey'),
                                valueTextSize: 5,
                                valueFormatter: '', // this removes decimal somehow
                            }
                        }
                    ]
                }}
            />
        },
        'byhour': () => {
            const { data, xMax, xMin, yMax, yMin } = getChartDataMealsByHour(props.monthData ?? {});
            const mealTimeRange = Math.abs(xMax - xMin) + 1;
            const yTickSize = 200;
            const roundedYMax = roundToNearest(yMax, yTickSize);
            return <NoTypeChart
                style={{ height: 400, width: 400, ...props.style ?? {} }}
                padding={{ left: 60, bottom: 20, right: 20, top: 20 }}
                xDomain={{ min: Math.floor(xMin), max: xMax }}
                yDomain={{ min: yMin, max: roundedYMax }}
            >
                <VerticalAxis tickCount={Math.floor(roundedYMax / yTickSize) + 1} theme={{ labels: { formatter: (v) => v.toFixed(2) } }} />
                <HorizontalAxis tickCount={mealTimeRange} />
                {_.map(data, (timelineData, index) => (
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
            <RowButtonSelector<InsightDisplayMode>
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

export const getChartDataKcalsPerDay = (monthData: MonthData) => {
    const kcalsOverDays: BarValue[] = [];
    const keysInOrder = _.sortBy(Object.keys(monthData ?? {}).map((key) => Number(key)));
    let yMax = 0;
    _.forEach(keysInOrder, (key) => {
        const stringKey = key.toString().padStart(2, '0');
        const kcalSum = monthData[stringKey].reduce((acc, mealData) => acc + (mealData.kcalPerServing * mealData.servings), 0);
        kcalsOverDays.push({ x: key, y: kcalSum });
        yMax = Math.max(yMax, kcalSum);
    });

    return {
        data: kcalsOverDays,
        xMax: Math.max((_.last(keysInOrder) ?? 0) + .5, 30), xMin: 0,
        yMax, yMin: 0,
    };
}

export const getChartDataMealsByHour = (monthData: MonthData) => {
    let earliestTime = 24;
    let latestTime = 0;
    let highestSingleMeal = 0;
    const dayTimelineData: ChartDataPoint[][] = [];
    const keysInOrder = _.sortBy(Object.keys(monthData ?? {}).map((key) => Number(key)));
    _.forEach(keysInOrder, (key) => {
        // we sorted as numbers so we have to re-pad to 2-char keys.
        const stringKey = key.toString().padStart(2, '0');
        const individualDayData: ChartDataPoint[] = [];
        const sortedMeals = sortMealsByTime(monthData[stringKey] ?? []);
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
    });

    return {
        data: dayTimelineData,
        xMax: latestTime, xMin: earliestTime,
        yMax: highestSingleMeal, yMin: 0,
    };
}
