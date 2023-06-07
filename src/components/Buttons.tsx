import { ButtonProps, ColorValue, Pressable, StyleProp, Text, TextProps, TextStyle, View } from 'react-native';
import { SFSymbol, SymbolScale, SymbolWeight } from 'react-native-sfsymbols';

const bigButtonStyle: StyleProp<TextStyle> = {
    fontSize: 32,
    padding: 15,
    margin: 5,
    color: 'navy',
    textAlign: 'center'
};

export type ExtensibleButtonProps = ButtonProps & TextProps & {
    symbol?: {
        name?: string;
        scale?: SymbolScale;
        color?: ColorValue;
        weight?: SymbolWeight;
    }
};

export const BigButton = ({ onPress, title, symbol }: Pick<ExtensibleButtonProps, 'onPress' | 'title' | 'symbol'>) => (
    <ExtensibleButton onPress={onPress} title={title} style={bigButtonStyle} symbol={symbol} />
);

export const ExtensibleButton = ({ onPress, title, style, symbol }: ExtensibleButtonProps) => (
    <Pressable onPress={onPress}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            {symbol && symbol.name && <SFSymbol
                name={symbol.name}
                color={symbol.color ?? 'black'}
                weight={symbol.weight ?? 'regular'}
                scale={symbol.scale ?? "large"}
                size={24}
                resizeMode="center"
                multicolor={false}
                style={{ width: 32, height: 32 }}
            />}
            <Text style={style}>
                {title}</Text>
        </View>
    </Pressable>
);