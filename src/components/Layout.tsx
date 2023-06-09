import React from 'react';
import { ColorValue, StyleSheet, View, ViewStyle } from 'react-native';

export const HorizontalLine = (props: ViewStyle & { children?: never; lineColor?: ColorValue }) => (
    <View style={{ borderBottomColor: props.lineColor ?? 'black', borderBottomWidth: StyleSheet.hairlineWidth, ...props }} />
);
export const VerticalLine = (props: ViewStyle & { children?: never; lineColor?: ColorValue }) => (
    <View style={{ borderRightColor: props.lineColor ?? 'black', borderRightWidth: StyleSheet.hairlineWidth, ...props }} />
);