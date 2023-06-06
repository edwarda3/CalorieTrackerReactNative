import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

export const HorizontalLine = (props: ViewStyle & { children?: never }) => <View style={{ borderBottomColor: 'black', borderBottomWidth: StyleSheet.hairlineWidth, ...props }} />