import { ButtonProps, Pressable, StyleProp, Text, TextProps, TextStyle } from 'react-native';

const bigButtonStyle: StyleProp<TextStyle> = {
    fontSize: 32,
    padding: 10,
    margin: 5,
    color: 'navy',
    textAlign: 'center'
};

export const BigButton = ({ onPress, title }: Pick<ButtonProps, 'onPress'|'title'>) => <ExtensibleButton onPress={onPress} title={title} style={bigButtonStyle}/>

export const ExtensibleButton = ({ onPress, title, style }: ButtonProps & TextProps) => <Pressable onPress={onPress}>
    <Text style={style}>{title}</Text>
</Pressable>