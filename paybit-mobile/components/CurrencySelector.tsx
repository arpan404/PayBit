import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCurrency, Currency, currencies } from '../context/CurrencyContext';

interface CurrencySelectorProps {
    visible: boolean;
    onClose: () => void;
}

const CurrencySelector = ({ visible, onClose }: CurrencySelectorProps) => {
    const { colors, isDarkMode } = useTheme();
    const { selectedCurrency, setSelectedCurrency } = useCurrency();

    const renderCurrencyItem = ({ item }: { item: Currency }) => (
        <TouchableOpacity
            style={[
                styles.currencyItem,
                {
                    backgroundColor: colors.card,
                    borderBottomColor: colors.border
                }
            ]}
            onPress={() => {
                setSelectedCurrency(item);
                onClose();
            }}
        >
            <View style={styles.currencyInfo}>
                <Text style={[styles.currencyCode, { color: colors.text }]}>{item.code}</Text>
                <Text style={[styles.currencyName, { color: colors.textSecondary }]}>{item.name}</Text>
            </View>
            {selectedCurrency.code === item.code && (
                <Ionicons name="checkmark" size={24} color={colors.primary} />
            )}
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.title, { color: colors.text }]}>Select Currency</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={currencies}
                    renderItem={renderCurrencyItem}
                    keyExtractor={(item) => item.code}
                    style={styles.list}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        marginTop: 100,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    list: {
        flex: 1,
    },
    currencyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    currencyInfo: {
        flex: 1,
    },
    currencyCode: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    currencyName: {
        fontSize: 14,
    },
});

export default CurrencySelector; 