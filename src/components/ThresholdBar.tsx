import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Thresholds } from '../types/Model';
import { DatabaseHandler } from '../data/database';

export interface ThresholdBarProps {
    threshold?: Thresholds;
    emphasizeKcal?: number;
}

export const ThresholdBar = (props: ThresholdBarProps) => {
    const [thresholds, setThresholds] = useState<Thresholds>(
        props.threshold ?? DatabaseHandler.getInstance().getAppSettingsBestEffortSync().thresholds
    );

    const thresholdsInOrder = Object.keys(thresholds).sort();
    let differences: number[] = [];
    for (let i = 1; i < thresholdsInOrder.length; i++) {
        differences.push(Number(thresholdsInOrder[i]) - Number(thresholdsInOrder[i - 1]));
    }
    // Add one more entry so that we can see the last threshold
    differences.push(_.min(differences) ?? 0);

    // keep state updated.
    useEffect(() => {
        if (props.threshold && !_.isEqual(thresholds, props.threshold)) {
            setThresholds(props.threshold);
        }
    });

    return (
        <View style={{ flexDirection: 'column' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {_.map(differences, (difference, index) => {
                    const currentThresholdValue = Number(thresholdsInOrder[index]);
                    // We set the threshold value to 1 if 0 since 0 is a special case with no color.
                    const kcalThreshold = currentThresholdValue === 0 ? 1 : currentThresholdValue;
                    const style: TextStyle = {
                        backgroundColor: getColorPerCalories(thresholds, kcalThreshold),
                        flexGrow: difference,
                        padding: 3,
                        marginVertical: 2,
                        textAlign: 'left',
                        fontWeight: '100',
                        fontSize: 8
                    };
                    const isKcalToEmphathize = props.emphasizeKcal && (index + 1 >= thresholdsInOrder.length ?
                        // if last element, then only check that kcals is greater than the threshold.
                        props.emphasizeKcal >= currentThresholdValue :
                        // if in middle, check that it is also under the next one.
                        props.emphasizeKcal >= currentThresholdValue && props.emphasizeKcal < Number(thresholdsInOrder[index + 1]));
                    if (isKcalToEmphathize && props.emphasizeKcal) {
                        style.borderColor = 'black'
                        style.borderWidth = 1.5;
                    }

                    return (
                        <Text key={currentThresholdValue} style={style}>
                            &gt;{thresholdsInOrder[index]}
                        </Text>
                    )
                })}
            </View>
        </View>
    )
}

export function getColorPerCalories(thresholds: Thresholds, kcal: number, offset = 0, transparency = 1) {
    if (!kcal) return `rgba(255,255,255,0)`;
    const thresholdsInOrder = Object.keys(thresholds).sort().reverse();
    const [red, blue, green] = ((kcal: number): number[] => {
        const matchingThreshold = thresholdsInOrder.find((th) => kcal >= Number(th));
        if (matchingThreshold) {
            return thresholds[Number(matchingThreshold)];
        } else {
            return thresholds[Number(_.last(thresholdsInOrder))];
        }
    })(kcal).map((hueValue) => _.clamp(hueValue + offset, 0, 255));
    return `rgba(${red},${blue},${green},${transparency})`;
}