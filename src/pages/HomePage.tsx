
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native';
import { NavigatedScreenProps, NavigationPages, pageDetails } from '../types/Navigation';
import { BigButton } from '../components/Buttons';
import { HorizontalLine } from '../components/Layout';
import { useFocusEffect } from '@react-navigation/native';
import { DatabaseHandler } from '../data/database';
import { AppSettings } from '../types/Model';

export interface HomePageProps extends NavigatedScreenProps { }

export function HomePage(props: HomePageProps): JSX.Element {
    const { navigation } = props;
    const [ settings, setAppSettings ] = useState<AppSettings>(DatabaseHandler.getInstance().getAppSettingsBestEffortSync());
    
    useFocusEffect(useCallback(() => {
        // cache settings
        DatabaseHandler.getInstance().getAppSettings().then((settings) => setAppSettings(settings));
    }, []))

    return (
        <SafeAreaView style={{
            flex: 1, // cuts off the render at the bottom of the screen edge, to prevent FlatList from extending past the screen.
        }}>
            <View style={{ flexDirection: 'column', justifyContent: 'space-evenly', flexGrow: 1, padding: 10 }}>
                <HorizontalLine lineColor={'rgba(0,0,0,0)'} />
                <BigButton title='Profile' symbol={{name: pageDetails[NavigationPages.PROFILE].symbolName}} onPress={() => navigation.navigate(NavigationPages.PROFILE)} />
                <HorizontalLine />
                <BigButton title='Calendar' symbol={{name: pageDetails[NavigationPages.CALENDAR].symbolName}} onPress={() => navigation.navigate(NavigationPages.CALENDAR)} />
                <HorizontalLine />
                <BigButton title='Go to Today' symbol={{name: pageDetails[NavigationPages.DAY].symbolName}} onPress={() => navigation.navigate(NavigationPages.DAY)} />
                <HorizontalLine />
                <BigButton title='Quick Add Entry' symbol={{name: pageDetails[NavigationPages.ITEM].symbolName}} onPress={() => {
                    if (settings.itemPageHasIntermediateDayPage) navigation.navigate(NavigationPages.DAY);
                    navigation.navigate(NavigationPages.ITEM);
                }} />
                <HorizontalLine />
                <BigButton title='Manage Presets' symbol={{name: pageDetails[NavigationPages.PRESETS].symbolName}} onPress={() => navigation.navigate(NavigationPages.PRESETS)} />
                <HorizontalLine />
                <BigButton title='Search By Meal' symbol={{name: pageDetails[NavigationPages.SEARCH_BY_MEAL].symbolName}} onPress={() => navigation.navigate(NavigationPages.SEARCH_BY_MEAL)} />
                <HorizontalLine lineColor={'rgba(0,0,0,0)'} />
            </View>
        </SafeAreaView>
    )
}
