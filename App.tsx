import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { PageDetail, NavigationPages, pageDetails } from './src/types/Navigation';
import { NativeBaseProvider } from "native-base";
import _ from 'lodash';

const Stack = createNativeStackNavigator();

function App(): JSX.Element {
    const page = ({ name, title, component }: PageDetail) => (
        <Stack.Screen key={name} name={name} options={{ title }} component={component as any} />
    )

    return (
        <NativeBaseProvider>
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName={NavigationPages.HOME}
                    screenOptions={{
                        headerStyle: {
                            backgroundColor: 'skyblue',
                        },
                        headerTintColor: '#fff',
                    }}>
                    {
                        (Object.values(pageDetails)).map(page)
                    }
                </Stack.Navigator>
            </NavigationContainer>
        </NativeBaseProvider>
    );
}

export default App;
