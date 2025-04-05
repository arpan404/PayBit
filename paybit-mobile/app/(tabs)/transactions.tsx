import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

interface Transaction {
    id: string;
    type: 'sent' | 'received';
    amount: string;
    fiatAmount: string;
    date: string;
}

const TransactionItem = ({ item }: { item: Transaction }) => {
    const { colors } = useTheme();
    const isSent = item.type === 'sent';

    return (
        <TouchableOpacity
            style={[styles.transactionItem, { backgroundColor: colors.card }]}
            onPress={() => {
                // Handle transaction press
            }}
        >
            <View style={[styles.iconContainer, { backgroundColor: isSent ? 'rgba(255, 59, 48, 0.1)' : 'rgba(52, 199, 89, 0.1)' }]}>
                <Ionicons
                    name={isSent ? "arrow-up" : "arrow-down"}
                    size={24}
                    color={isSent ? '#FF3B30' : '#34C759'}
                />
            </View>
            <View style={styles.transactionInfo}>
                <Text style={[styles.transactionType, { color: colors.text }]}>
                    {isSent ? 'Sent' : 'Received'} Bitcoin
                </Text>
                <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                    {item.date}
                </Text>
            </View>
            <View style={styles.amountContainer}>
                <Text style={[styles.amount, { color: isSent ? '#FF3B30' : '#34C759' }]}>
                    {isSent ? '-' : '+'}{item.amount} BTC
                </Text>
                <Text style={[styles.fiatAmount, { color: colors.textSecondary }]}>
                    ${item.fiatAmount} USD
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const TransactionsScreen = () => {
    const { colors, isDarkMode } = useTheme();
    const [activeFilter, setActiveFilter] = useState<'all' | 'sent' | 'received'>('all');

    const [transactions, setTransactions] = useState<Transaction[]>([
        {
            id: '1',
            type: 'received',
            amount: '0.0012',
            fiatAmount: '50.00',
            date: '2 hours ago',
        },
        {
            id: '2',
            type: 'sent',
            amount: '0.0005',
            fiatAmount: '20.00',
            date: '1 day ago',
        },
        {
            id: '3',
            type: 'received',
            amount: '0.0012',
            fiatAmount: '50.00',
            date: '2 hours ago',
        },
        {
            id: '4',
            type: 'sent',
            amount: '0.0005',
            fiatAmount: '20.00',
            date: '1 day ago',
        },
        {
            id: '5',
            type: 'sent',
            amount: '0.0005',
            fiatAmount: '20.00',
            date: '1 day ago',
        },
        {
            id: '6',
            type: 'received',
            amount: '0.0012',
            fiatAmount: '50.00',
            date: '2 hours ago',
        },
        {
            id: '7',
            type: 'sent',
            amount: '0.0005',
            fiatAmount: '20.00',
            date: '1 day ago',
        },
    ]);

    const filteredTransactions = transactions.filter(transaction => {
        if (activeFilter === 'all') return true;
        return transaction.type === activeFilter;
    });

    const handleTransactionPress = (transaction: Transaction) => {
        Alert.alert(
            'Transaction Details',
            `${transaction.type === 'sent' ? 'Sent to' : 'Received from'}: ${transaction.amount} BTC\nDate: ${transaction.date}`
        );
    };

    const renderTransaction = ({ item }: { item: Transaction }) => {
        return (
            <TouchableOpacity
                style={[styles.transactionItem, { backgroundColor: colors.card }]}
                onPress={() => handleTransactionPress(item)}
            >
                <View style={[styles.iconContainer, { backgroundColor: item.type === 'sent' ? 'rgba(255, 59, 48, 0.1)' : 'rgba(52, 199, 89, 0.1)' }]}>
                    <Ionicons
                        name={item.type === 'sent' ? 'arrow-up' : 'arrow-down'}
                        size={24}
                        color={item.type === 'sent' ? '#FF3B30' : '#34C759'}
                    />
                </View>
                <View style={styles.transactionInfo}>
                    <Text style={[styles.transactionType, { color: colors.text }]}>
                        {item.type === 'sent' ? 'Sent' : 'Received'} Bitcoin
                    </Text>
                    <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                        {item.date}
                    </Text>
                </View>
                <View style={styles.amountContainer}>
                    <Text style={[styles.amount, { color: item.type === 'sent' ? '#FF3B30' : '#34C759' }]}>
                        {item.type === 'sent' ? '-' : '+'}${item.fiatAmount}
                    </Text>
                    <Text style={[styles.fiatAmount, { color: colors.textSecondary }]}>
                        ${item.amount} BTC
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? "light" : "dark"} />

            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Transactions</Text>
            </View>

            <View style={[styles.filterTabs, { backgroundColor: colors.card }]}>
                <TouchableOpacity
                    style={[styles.filterTab, activeFilter === 'all' && styles.activeFilterTab]}
                    onPress={() => setActiveFilter('all')}
                >
                    <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>
                        All
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterTab, activeFilter === 'sent' && styles.activeFilterTab]}
                    onPress={() => setActiveFilter('sent')}
                >
                    <Text style={[styles.filterText, activeFilter === 'sent' && styles.activeFilterText]}>
                        Sent
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterTab, activeFilter === 'received' && styles.activeFilterTab]}
                    onPress={() => setActiveFilter('received')}
                >
                    <Text style={[styles.filterText, activeFilter === 'received' && styles.activeFilterText]}>
                        Received
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredTransactions}
                renderItem={renderTransaction}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    filterTabs: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 4,
    },
    filterTab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 8,
    },
    activeFilterTab: {
        backgroundColor: 'rgba(247, 147, 26, 0.15)',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#AAAAAA',
    },
    activeFilterText: {
        color: '#F7931A',
    },
    listContent: {
        padding: 16,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionType: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 14,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    fiatAmount: {
        fontSize: 14,
    },
});

export default TransactionsScreen; 