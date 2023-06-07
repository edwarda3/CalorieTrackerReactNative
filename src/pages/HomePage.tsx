
import React, { useCallback } from 'react';
import { Button, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native';
import { NavigatedScreenProps, NavigationPages, pageDetails } from '../types/Navigation';
import { BigButton } from '../components/Buttons';
import { HorizontalLine } from '../components/Layout';
import { useFocusEffect } from '@react-navigation/native';
import { DatabaseHandler } from '../data/database';

export interface HomePageProps extends NavigatedScreenProps { }

export function HomePage(props: HomePageProps): JSX.Element {
    const { navigation } = props;
    
    useFocusEffect(useCallback(() => {
        // cache settings
        DatabaseHandler.getInstance().getAppSettings();
    }, []))

    return (
        <SafeAreaView>
            <ScrollView contentContainerStyle={{ flexDirection: 'column', gap: 20, paddingTop: 50 }}>
                <BigButton title='Profile' symbol={{name: pageDetails[NavigationPages.PROFILE].symbolName}} onPress={() => navigation.navigate(NavigationPages.PROFILE)} />
                <HorizontalLine />
                <BigButton title='Calendar' symbol={{name: pageDetails[NavigationPages.CALENDAR].symbolName}} onPress={() => navigation.navigate(NavigationPages.CALENDAR)} />
                <HorizontalLine />
                <BigButton title='Go to Today' symbol={{name: pageDetails[NavigationPages.DAY].symbolName}} onPress={() => navigation.navigate(NavigationPages.DAY)} />
                <HorizontalLine />
                <BigButton title='Quick Add Entry' symbol={{name: pageDetails[NavigationPages.ITEM].symbolName}} onPress={() => {
                    navigation.navigate(NavigationPages.DAY);
                    navigation.navigate(NavigationPages.ITEM);
                }} />
                <HorizontalLine />
                <BigButton title='Manage Presets' symbol={{name: pageDetails[NavigationPages.PRESETS].symbolName}} onPress={() => navigation.navigate(NavigationPages.PRESETS)} />
                <HorizontalLine />
                <BigButton title='Search By Meal' symbol={{name: pageDetails[NavigationPages.SEARCH_BY_MEAL].symbolName}} onPress={() => navigation.navigate(NavigationPages.SEARCH_BY_MEAL)} />
            </ScrollView>
        </SafeAreaView>
    )
}
