import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import CurrencySelector from '../components/CurrencySelector';
import { StatusBar } from 'expo-status-bar';

const SettingsScreen = () => {
    const { colors, isDarkMode } = useTheme();
    const { selectedCurrency } = useCurrency();
    const [showCurrencySelector, setShowCurrencySelector] = useState(false);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? "light" : "dark"} />
            <View style={[styles.section, { backgroundColor: colors.card }]}>
                <TouchableOpacity
                    style={styles.option}
                    onPress={() => setShowCurrencySelector(true)}
                >
                    <Text style={[styles.optionText, { color: colors.text }]}>Currency</Text>
                    <Text style={[styles.optionValue, { color: colors.textSecondary }]}>
                        {selectedCurrency.code} ({selectedCurrency.symbol})
                    </Text>
                </TouchableOpacity>
            </View>

            <CurrencySelector
                visible={showCurrencySelector}
                onClose={() => setShowCurrencySelector(false)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    section: {
        borderRadius: 12,
        marginBottom: 16,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    optionText: {
        fontSize: 16,
    },
    optionValue: {
        fontSize: 16,
    },
});

export default SettingsScreen; 