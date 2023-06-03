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

const Stack = createNativeStackNavigator();

function App(): JSX.Element {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName='home' screenOptions={{
                headerStyle: {
                    backgroundColor: 'skyblue',
                },
                headerTintColor: '#fff',
            }}>
                <Stack.Screen name={NavigationPages.HOME} options={{ title: 'Calorie Tracker' }} component={HomePage as any} />
                <Stack.Screen name={NavigationPages.PROFILE} options={{ title: 'Profile' }} component={ProfilePage as any} />
                <Stack.Screen name={NavigationPages.CALENDAR} component={CalendarPage as any} />
                <Stack.Screen name={NavigationPages.DAY} component={DayPage as any} />
                <Stack.Screen name={NavigationPages.ITEM} component={ItemPage as any} />
                <Stack.Screen name={NavigationPages.PRESETS} component={PresetsPage as any} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default App;
