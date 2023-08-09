import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { HomePage } from '../pages/HomePage';
import { CalendarPage } from '../pages/CalendarPage';
import { DayPage, DayPageParams } from '../pages/DayPage';
import { ItemPage, ItemPageParams } from '../pages/ItemPage';
import { PresetsPage } from '../pages/PresetsPage';
import { SearchByMeal, SearchByMealParams } from '../pages/SearchByMeal';
import { SettingsPage } from "../pages/SettingsPage";
import { AppSettings } from "./Settings";
import _ from "lodash";
import { dayBefore, formatDateWithStyle, formatTime, getDateString, getTimeHourMinutes, timeToFloat } from "./Dates";
import { Alert } from "react-native";

export enum NavigationPages {
    HOME = 'home',
    SETTINGS = 'settings',
    CALENDAR = 'calendar',
    DAY = 'day',
    ITEM = 'item',
    PRESETS = 'presets',
    SEARCH_BY_MEAL = 'search-by-meal',
};

type NavRouteParams = DayPageParams | ItemPageParams | SearchByMealParams;

type NavFunction = (routeName: string, params?: NavRouteParams) => void;

type OptionsFunction = (props: NavigatedScreenProps) => NativeStackNavigationOptions

export interface NavigatedScreenProps {
    navigation: NavigationControls,
    route: {
        params: NavRouteParams;
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

export interface NavigateToItemPageOptions {
    appSettings: AppSettings;
    /**
     * In some cases, such as when editing from the containing day page,
     * we want to skip the itemPageHasIntermediateDayPage even if it's enabled.
     * This prevents a duplicate page from being pushed into the nav stack
     */
    forceSkipIntermediateDaypage?: boolean;
    /**
     * The navigation object that comes from the navigated screen props.
     */
    navigation: NavigationControls;
    /**
     * Params to pass into the item page, such as prefill or edit keys.
     */
    params?: ItemPageParams;
}

export function navigateToItemPage({appSettings, forceSkipIntermediateDaypage, navigation, params}: NavigateToItemPageOptions) {
    const navigateWithDay = (specifiedDate?: string, specifiedTime?: string) => {
        const itemPageParams: ItemPageParams = {
            ...params,
            dateString: specifiedDate ?? params?.dateString ?? getDateString(new Date()),
        };
        if (specifiedTime) {
            itemPageParams.prefill = {
                ...(itemPageParams.prefill ?? {}),
                time: specifiedTime,
            };
        }
        if (!forceSkipIntermediateDaypage && appSettings?.itemPageHasIntermediateDayPage) {
            navigation.push(NavigationPages.DAY, (specifiedDate || params) ? _.pick(itemPageParams, 'dateString') : undefined);
        }
        navigation.navigate(NavigationPages.ITEM, itemPageParams);
    }
    // TODO Encapsulate navigation with daypage and itempage with Copy to Today and Quick add, plus from daypage
    const currentTime = timeToFloat(getTimeHourMinutes(new Date()));
    const rolloverLimit = timeToFloat(appSettings.rolloverPeriod);
    if (appSettings.enableRollover && currentTime <= rolloverLimit) {
        const yesterday = getDateString(dayBefore(new Date()));
        const yesterdayString = formatDateWithStyle(yesterday, appSettings.dateFormat, true);
        const today = getDateString(new Date());
        const todayString = formatDateWithStyle(today, appSettings.dateFormat, true);
        if (appSettings.promptForRollover) {
            Alert.alert(
                'Rollover',
                `Current time is before ${formatTime(appSettings.rolloverPeriod, appSettings.timeFormat)}, do you want to add to ${yesterdayString}?`,
                [
                    {
                        text: `Add to Yesterday (${yesterdayString})`,
                        onPress: () => navigateWithDay(yesterday, '23:59'),
                    },
                    {
                        text: `Add to Today (${todayString})`,
                        onPress: () => navigateWithDay(),
                    },
                    {
                        text: `Cancel`,
                        onPress: () => {},
                        style: 'cancel'
                    },
                ]
            )
        } else {
            navigateWithDay(yesterday);
        }
    } else {
        navigateWithDay();
    }
}