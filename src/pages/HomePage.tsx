
import React from 'react';
import { Button, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native';
import { NavigatedScreenProps, NavigationPages } from '../types/Navigation';
import { BigButton } from '../components/Buttons';
import { HorizontalLine } from '../components/Layout';

export interface HomePageProps extends NavigatedScreenProps { }

export function HomePage(props: HomePageProps): JSX.Element {
    const { navigation } = props;

    return (
        <SafeAreaView>
            <ScrollView contentContainerStyle={{ flexDirection: 'column', gap: 20, paddingTop: 50 }}>
                <BigButton title='Profile' onPress={() => navigation.navigate(NavigationPages.PROFILE)} />
                <HorizontalLine />
                <BigButton title='Calendar' onPress={() => navigation.navigate(NavigationPages.CALENDAR)} />
                <HorizontalLine />
                <BigButton title='Go to Today' onPress={() => navigation.navigate(NavigationPages.DAY)} />
                <HorizontalLine />
                <BigButton title='Quick Add Entry' onPress={() => {
                    navigation.navigate(NavigationPages.DAY);
                    navigation.navigate(NavigationPages.ITEM);
                }} />
                <HorizontalLine />
                <BigButton title='Manage Presets' onPress={() => navigation.navigate(NavigationPages.PRESETS)} />
                <HorizontalLine />
                <BigButton title='Search By Meal' onPress={() => navigation.navigate(NavigationPages.SEARCH_BY_MEAL)} />
            </ScrollView>
        </SafeAreaView>
    )
}
