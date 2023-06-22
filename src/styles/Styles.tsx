import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from "react-native";

export const rawStyles: Record<string, ViewStyle | TextStyle | ImageStyle> = {
    title: {
        fontSize: 28,
    },
    label: {
        fontSize: 20,
    },
    subLabel: {
        fontSize: 12,
        color: 'grey'
    },
    input: {
        height: 40,
        margin: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        padding: 10,
        flexGrow: 1,
        flexShrink: 1,
    },
    formField: {
        flexDirection: 'row',
        gap: 20,
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 16
    },
    statusText: {
        color: 'navy',
        fontSize: 16
    },
    modalView: {
        margin: 20,
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    }
};

export const styles = StyleSheet.create(rawStyles);

export type GenericStyle = ViewStyle | TextStyle | ImageStyle;
export const bespokeStyle = (baseStyle: keyof typeof rawStyles, extension: GenericStyle): GenericStyle => {
    const newStyle = {
        ...rawStyles[baseStyle],
        ...extension
    };
    return StyleSheet.create({ [baseStyle]: newStyle })[baseStyle];
}