import React, { useCallback, useState } from 'react';
import { Button, FlatList, Keyboard, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { NavigatedScreenProps } from '../types/Navigation';
import _ from 'lodash';
import { MealData, MealPreset } from '../types/Model';
import { DatabaseHandler } from '../data/database';
import { useFocusEffect } from '@react-navigation/native';
import ContextMenu from 'react-native-context-menu-view';
import { bespokeStyle, styles } from '../styles/Styles';

export function PresetsPage(props: NavigatedScreenProps): JSX.Element {
    const [presets, setPresets] = useState<MealPreset[]>([]);
    const [filter, setFilter] = useState<string>('');
    const [presetMealId, setPresetMealId] = useState<string | null>(null);
    const [presetMealName, setPresetMealName] = useState<string>('');
    const [presetMealKcals, setPresetMealKcals] = useState<number>(0);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = async () => {
        setRefreshing(true);
        Keyboard.dismiss()
        // get presets
        const presets = await DatabaseHandler.getInstance().getPresets();
        setPresets(presets);
        setRefreshing(false);
    }

    useFocusEffect(
        useCallback(() => {
            refresh();
            return () => { };
        }, [])
    );

    const modifyPreset = async () => {
        if (!presetMealName || !presetMealKcals) {
            setError('Provide Name and Kcals per serving.');
            return;
        }
        setError(null);

        const existingIndex = (presets ?? []).findIndex((preset) => presetMealId !== null && preset.id === presetMealId);
        if (presetMealId && existingIndex >= 0) {
            presets[existingIndex] = {
                id: presetMealId,
                name: presetMealName,
                kcalPerServing: presetMealKcals
            }
        } else {
            presets.push({
                id: Date.now().toString(),
                name: presetMealName,
                kcalPerServing: presetMealKcals
            });
        }
        setPresets(presets);
        await DatabaseHandler.getInstance().setPresets(presets);
        setPresetMealId(null);
        setPresetMealName('');
        setPresetMealKcals(0);
        refresh();
    }

    const deletePreset = async (presetId: string) => {
        const existingIndex = (presets ?? []).findIndex((preset) => presetId !== null && preset.id === presetId);
        if (existingIndex >= 0) {
            presets.splice(existingIndex, 1);
            setPresets(presets);
            await DatabaseHandler.getInstance().setPresets(presets);
            refresh();
        }
    }

    const getPresetView = (preset: MealPreset) => (
        <ContextMenu
            previewBackgroundColor='rgba(0,0,0,0)'
            actions={[
                { title: 'Edit' },
                { title: 'Delete', destructive: true }
            ]}
            onPress={({ nativeEvent }) => {
                if (nativeEvent.name === 'Edit') {
                    setPresetMealId(preset.id);
                    setPresetMealName(preset.name);
                    setPresetMealKcals(preset.kcalPerServing);
                } else if (nativeEvent.name === 'Delete') {
                    deletePreset(preset.id);
                }
            }}>

            <View style={{ flexDirection: 'row', gap: 20, padding: 10 }}>
                <Text style={bespokeStyle('label', { flexGrow: 1 })}>{_.startCase(preset.name)}</Text>
                <Text style={styles.label}>{preset.kcalPerServing}kcal</Text>
            </View>
        </ContextMenu>
    )

    return (
        <SafeAreaView style={{
            flex:1, // cuts off the render at the bottom of the screen edge, to prevent FlatList from extending past the screen.
        }}>
            <Pressable style={{ padding: 10 }} onPress={refresh}>
                <Text style={styles.title}>Total Presets: {presets.length}</Text>
            </Pressable>
            <View style={{ flexDirection: 'column', gap: 4, borderBottomColor: 'black', borderBottomWidth: StyleSheet.hairlineWidth }}>
                <View style={{
                    padding: 10,
                    flexDirection: 'row',
                    gap: 20,
                    alignItems: 'center',
                    flexWrap: 'nowrap'
                }}>
                    <TextInput
                        style={styles.input}
                        onChangeText={(text) => setPresetMealName(text)}
                        value={presetMealName}
                        placeholder='Preset Meal Name'
                    />
                    <TextInput
                        style={bespokeStyle('input', { width: 50 })}
                        onChangeText={(text) => setPresetMealKcals(Number(text))}
                        value={presetMealKcals.toString()}
                        placeholder='Preset Meal Kcals per serving'
                        inputMode='numeric'
                    />
                    <View style={{flexGrow: 1}}>
                        <Button title={presetMealId ? 'Submit' : 'Add'} onPress={() => modifyPreset()} />
                    </View>
                </View>
                {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
            <View>
                <TextInput
                    style={styles.input}
                    onChangeText={(text) => setFilter(text)}
                    value={filter}
                    placeholder='Filter'
                    placeholderTextColor='grey'
                />
            </View>
            <FlatList
                data={presets.filter(preset => (!!preset && preset.name.toLowerCase().includes(filter.toLowerCase())))}
                renderItem={({ item }) => getPresetView(item)}
                keyExtractor={item => item.id}
                refreshing={refreshing}
                onRefresh={refresh}
            />
        </SafeAreaView>
    );
}