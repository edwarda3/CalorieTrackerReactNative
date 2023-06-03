import { NativeStackNavigationOptions } from "@react-navigation/native-stack";

export enum NavigationPages {
    HOME='home',
    PROFILE='profile',
    CALENDAR='calendar',
    DAY='day',
    ITEM='item',
    PRESETS='presets'
};

type NavFunction = (routeName: string, params?: Record<string, any>) => void;

type OptionsFunction = (props: NavigatedScreenProps) => NativeStackNavigationOptions

export interface NavigatedScreenProps {
    navigation: {
        navigate: NavFunction;
        push: NavFunction;
        goBack: () => void;
        setOptions: (options: NativeStackNavigationOptions | OptionsFunction) => void
    }
    route: {
        params: Record<string, any>;
    }
};
