import { ButtonProps, Pressable, StyleProp, Text, TextProps, TextStyle, View } from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';

const bigButtonStyle: StyleProp<TextStyle> = {
    fontSize: 32,
    padding: 10,
    margin: 5,
    color: 'navy',
    textAlign: 'center'
};

export type ExtensibleButtonProps = ButtonProps & TextProps & {
    symbol?: string;
};

export const BigButton = ({ onPress, title, symbol }: Pick<ExtensibleButtonProps, 'onPress' | 'title' | 'symbol'>) => <ExtensibleButton onPress={onPress} title={title} style={bigButtonStyle} symbol={symbol} />

export const ExtensibleButton = ({ onPress, title, style, symbol }: ExtensibleButtonProps) => (
    <Pressable onPress={onPress}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            {symbol && <SFSymbol
                name={symbol}
                color={'black'}
                weight="regular"
                scale="large"
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