/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { HomePage } from './src/pages/HomePage';
import { CalendarPage } from './src/pages/CalendarPage';
import { DayPage } from './src/pages/DayPage';
import { ItemPage } from './src/pages/ItemPage';
import { NavigatedScreenProps, NavigationPages } from './src/types/Navigation';
import _ from 'lodash';
import { PresetsPage } from './src/pages/PresetsPage';
import { ProfilePage } from './src/pages/ProfilePage';
import { SearchByMeal } from './src/components/SearchByMeal';
import { View } from 'react-native';
import { HorizontalLine } from './src/components/Layout';

const Stack = createNativeStackNavigator();

interface PageDetail {
    name: string;
    title?: string;
    component: () => JSX.Element;
}

function App(): JSX.Element {
    const page = ({ name, title, component }: PageDetail) => (
        <Stack.Screen key={name} name={name} options={{ title }} component={component} />
    )

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName='home' screenOptions={{
                headerStyle: {
                    backgroundColor: 'skyblue',
                },
                headerTintColor: '#fff',
            }}>
                {
                    ([
                        { name: NavigationPages.HOME, title: 'Calorie Tracker', component: HomePage },
                        { name: NavigationPages.PROFILE, title: 'Profile', component: ProfilePage },
                        { name: NavigationPages.SEARCH_BY_MEAL, title: 'Search by Meal', component: SearchByMeal },
                        { name: NavigationPages.CALENDAR, component: CalendarPage },
                        { name: NavigationPages.DAY, component: DayPage },
                        { name: NavigationPages.ITEM, component: ItemPage },
                        { name: NavigationPages.PRESETS, title: 'Presets', component: PresetsPage },
                    ] as PageDetail[]).map(page)
                }
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default App;
