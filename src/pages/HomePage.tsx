
import React from 'react';
import { Button, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native';
import { NavigatedScreenProps, NavigationPages } from '../types/Navigation';
import { BigButton } from '../common/Buttons';

export interface HomePageProps extends NavigatedScreenProps {}

export function HomePage(props: HomePageProps): JSX.Element {
    const { navigation } = props;
    return (
        <SafeAreaView>
            <ScrollView contentContainerStyle={{flexDirection: 'column', gap: 20, paddingTop: 50 }}>
                <BigButton title='Profile' onPress={() => navigation.navigate(NavigationPages.PROFILE)} />
                <BigButton title='Calendar' onPress={() => navigation.navigate(NavigationPages.CALENDAR)} />
                <BigButton title='Go to Today' onPress={() => navigation.navigate(NavigationPages.DAY)} />
                <BigButton title='Quick Add Entry' onPress={() => navigation.navigate(NavigationPages.ITEM)} />
                <BigButton title='Manage Presets' onPress={() => navigation.navigate(NavigationPages.PRESETS)} />
            </ScrollView>
        </SafeAreaView>
    )
}
