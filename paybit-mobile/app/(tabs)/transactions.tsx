import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useStore, Transaction } from '../../services/store';
import axios from 'axios';
import { apiEndpoint } from '@/constants/api';

const TransactionsScreen = (): React.ReactElement => {
    // Get theme and user data from store
    const { colors, isDarkMode } = useTheme();
    const user = useStore((state) => state.user);
    const storeTransactions = useStore((state) => state.transactions) || [];
    const setStoreTransactions = useStore((state) => state.setTransactions);

    // Local state for UI
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'sent' | 'received'>('all');
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    // Fetch transactions from API
    const fetchTransactions = useCallback(async () => {
        if (!user.token) {
            console.log('No auth token available');
            return;
        }

        // Log the token to help with debugging
        console.log('Using token:', user.token);

        try {
            setIsLoading(true);

            const response = await axios.get(`${apiEndpoint}/api/transaction/history`, {
                params: {
                    direction: activeFilter === 'all' ? undefined : activeFilter,
                    sort: 'newest',  // Default sort by newest
                    page: 1,        // Start with first page
                    limit: 50,      // Get up to 50 transactions
                },
                headers: {
                    'x-auth-token': user.token,
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('API Response:', response.data);

            // Check for proper response structure and store transactions
            if (response.data && response.data.success) {
                // Check if transactions array exists in response
                const transactionsData = response.data.data?.transactions || [];
                console.log('Transactions data:', transactionsData);

                setTransactions(transactionsData);
                setStoreTransactions(transactionsData);
            } else {
                console.log('No transactions data found in response');
                setTransactions([]);
                setStoreTransactions([]);
            }
        } catch (error: any) {
            console.error('Error fetching transactions:', error);

            // More detailed error logging
            if (error.response) {
                console.log('Error response status:', error.response.status);
                console.log('Error response data:', error.response.data);
            }

            // Keep existing transactions in case of error
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user.token, activeFilter, setStoreTransactions]);

    // Initial fetch with slight delay to ensure initialization
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTransactions();
        }, 500);

        return () => clearTimeout(timer);
    }, [fetchTransactions]);

    // Filter change handler
    useEffect(() => {
        if (activeFilter) {
            fetchTransactions();
        }
    }, [activeFilter, fetchTransactions]);

    // Refresh handler
    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchTransactions();
    };

    // Filter transactions based on selected filter
    const filteredTransactions = useCallback(() => {
        // Ensure transactions is an array
        const transactionsArray = Array.isArray(transactions) ? transactions : [];

        if (transactionsArray.length === 0) {
            return [];
        }

        if (activeFilter === 'all') {
            return transactionsArray;
        }

        return transactionsArray.filter(transaction =>
            transaction && transaction.direction === activeFilter
        );
    }, [transactions, activeFilter]);

    // Render an individual transaction
    const renderTransaction = ({ item }: { item: Transaction }) => {
        // Add null check and default values
        if (!item) return null;

        // Make sure amount is a number before using toFixed
        const amount = typeof item.amount === 'number' ? item.amount : 0;
        const isSent = item.direction === 'sent';

        return (
            <TouchableOpacity
                style={[styles.transactionItem, { backgroundColor: colors.card }]}
                activeOpacity={0.7}
            >
                <View style={[
                    styles.iconContainer,
                    { backgroundColor: isSent ? 'rgba(255, 59, 48, 0.1)' : 'rgba(52, 199, 89, 0.1)' }
                ]}>
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
                        {item.date || 'Unknown date'}
                    </Text>
                    {item.description && (
                        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={1}>
                            {item.description}
                        </Text>
                    )}
                </View>

                <View style={styles.amountContainer}>
                    <Text style={[styles.amount, { color: isSent ? '#FF3B30' : '#34C759' }]}>
                        {isSent ? '-' : '+'}{amount.toFixed(8)}
                    </Text>
                    <Text style={[styles.status, { color: colors.textSecondary }]}>
                        {item.status || 'Unknown'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    // Empty state component
    const EmptyTransactionList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Transactions
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Your transaction history will appear here
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? "light" : "dark"} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Transactions</Text>
            </View>

            {/* Filter tabs */}
            <View style={[styles.filterTabs, { backgroundColor: colors.card }]}>
                <TouchableOpacity
                    style={[styles.filterTab, activeFilter === 'all' && styles.activeFilterTab]}
                    onPress={() => setActiveFilter('all')}
                >
                    <Text style={[
                        styles.filterText,
                        activeFilter === 'all' && styles.activeFilterText
                    ]}>
                        All
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterTab, activeFilter === 'sent' && styles.activeFilterTab]}
                    onPress={() => setActiveFilter('sent')}
                >
                    <Text style={[
                        styles.filterText,
                        activeFilter === 'sent' && styles.activeFilterText
                    ]}>
                        Sent
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterTab, activeFilter === 'received' && styles.activeFilterTab]}
                    onPress={() => setActiveFilter('received')}
                >
                    <Text style={[
                        styles.filterText,
                        activeFilter === 'received' && styles.activeFilterText
                    ]}>
                        Received
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Transaction list */}
            <FlatList
                data={filteredTransactions()}
                renderItem={renderTransaction}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.listContent,
                    filteredTransactions().length === 0 && styles.emptyListContent
                ]}
                ListEmptyComponent={!isLoading ? EmptyTransactionList : null}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                    />
                }
                ListFooterComponent={
                    isLoading && !isRefreshing ? (
                        <ActivityIndicator
                            size="large"
                            color={colors.primary}
                            style={styles.loader}
                        />
                    ) : null
                }
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
    emptyListContent: {
        flexGrow: 1,
        justifyContent: 'center',
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
        marginBottom: 2,
    },
    description: {
        fontSize: 13,
        opacity: 0.8,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    status: {
        fontSize: 12,
        textTransform: 'capitalize',
    },
    loader: {
        padding: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.7,
    },
});

export default TransactionsScreen;