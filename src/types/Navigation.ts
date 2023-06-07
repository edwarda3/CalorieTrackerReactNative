import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { HomePage } from '../pages/HomePage';
import { CalendarPage } from '../pages/CalendarPage';
import { DayPage } from '../pages/DayPage';
import { ItemPage } from '../pages/ItemPage';
import { PresetsPage } from '../pages/PresetsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { SearchByMeal } from '../components/SearchByMeal';
import { SettingsPage } from "../pages/SettingsPage";

export enum NavigationPages {
    HOME = 'home',
    PROFILE = 'profile',
    SETTINGS = 'settings',
    CALENDAR = 'calendar',
    DAY = 'day',
    ITEM = 'item',
    PRESETS = 'presets',
    SEARCH_BY_MEAL = 'search-by-meal',
};

type NavFunction = (routeName: string, params?: Record<string, any>) => void;

type OptionsFunction = (props: NavigatedScreenProps) => NativeStackNavigationOptions

export interface NavigatedScreenProps {
    navigation: NavigationControls,
    route: {
        params: Record<string, any>;
    }
};

export interface NavigationControls {
    navigate: NavFunction;
    push: NavFunction;
    goBack: () => void;
    setOptions: (options: NativeStackNavigationOptions | OptionsFunction) => void;
}

export interface PageDetail {
    name: string;
    title?: string;
    component: (props: NavigatedScreenProps) => JSX.Element;
    symbolName?: string;
}

export const pageDetails: Record<NavigationPages, PageDetail> = {
    [NavigationPages.HOME]: {
        name: NavigationPages.HOME,
        title: 'Calorie Tracker',
        component: HomePage
    },
    [NavigationPages.PROFILE]: {
        name: NavigationPages.PROFILE,
        title: 'Profile',
        symbolName: 'person.fill',
        component: ProfilePage
    },
    [NavigationPages.SETTINGS]: {
        name: NavigationPages.SETTINGS,
        title: 'Settings',
        symbolName: 'gearshape.fill',
        component: SettingsPage
    },
    [NavigationPages.SEARCH_BY_MEAL]: {
        name: NavigationPages.SEARCH_BY_MEAL,
        symbolName: 'magnifyingglass',
        title: 'Search by Meal',
        component: SearchByMeal
    },
    [NavigationPages.CALENDAR]: {
        name: NavigationPages.CALENDAR,
        symbolName: 'calendar',
        component: CalendarPage
    },
    [NavigationPages.DAY]: {
        name: NavigationPages.DAY,
        symbolName: 'note.text',
        component: DayPage
    },
    [NavigationPages.ITEM]: {
        name: NavigationPages.ITEM,
        symbolName: 'plus.square',
        component: ItemPage
    },
    [NavigationPages.PRESETS]: {
        name: NavigationPages.PRESETS,
        title: 'Presets',
        symbolName: 'book.closed',
        component: PresetsPage
    },
}
