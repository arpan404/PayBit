import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
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
import { useStore } from '../../services/store';
import axios from 'axios';
import { apiEndpoint } from '@/constants/api';

interface Transaction {
    id: string;
    date: string;
    type: 'sent' | 'received';
    counterpartyName: string;
    counterpartyId: string;
    amount: number;
    fiatAmount: number;
    status: 'pending' | 'completed' | 'failed' | 'reversed';
    description: string;
    reference: string;
    campaignId?: string;
}

interface TransactionItemProps {
    item: Transaction;
}

const EmptyTransactionList = memo((): React.ReactElement => {
    const { colors } = useTheme();
    return (
        <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Transactions</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Your transaction history will appear here
            </Text>
        </View>
    );
});

const TransactionItem = memo(({ item }: TransactionItemProps): React.ReactElement => {
    const { colors } = useTheme();
    const isSent = item.type === 'sent';

    return (
        <TouchableOpacity
            style={[styles.transactionItem, { backgroundColor: colors.card }]}
            activeOpacity={0.7}
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
});

const TransactionsScreen = (): React.ReactElement => {
    const { colors, isDarkMode } = useTheme();
    const { user } = useStore((state: { user: any; }) => ({ user: state.user }));
    const token = user?.token; // Access token from user if it exists

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);

    // Filter states
    const [activeFilter, setActiveFilter] = useState<'all' | 'sent' | 'received'>('all');
    const [activeStatus, setActiveStatus] = useState<'all' | 'pending' | 'completed' | 'failed' | 'reversed'>('all');
    type SortOption = 'newest' | 'oldest' | 'amount-high' | 'amount-low';
    const [sort, setSort] = useState<SortOption>('newest');

    const fetchTransactions = useCallback(async (pageNum: number, refresh: boolean = false) => {
        if (!user?.token) {
            console.log('No auth token available');
            return;
        }

        // Prevent concurrent requests
        if (isLoading) return;
        
        try {
            setIsLoading(true);
            const response = await axios.get(`${apiEndpoint}/api/transaction/history`, {
                params: {
                    page: pageNum,
                    limit: 10,
                    direction: activeFilter === 'all' ? undefined : activeFilter,
                    status: activeStatus === 'all' ? undefined : activeStatus,
                    sort
                },
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const newTransactions = response.data.data;
            
            if (refresh) {
                setTransactions(newTransactions);
                setPage(1);
            } else {
                setTransactions(prev => [...prev, ...newTransactions]);
                setPage(pageNum);
            }
            
            setHasMore(newTransactions.length === 10);
        } catch (error: any) {
            console.error('Error fetching transactions:', error.response?.data || error.message);
            if (error.response?.status === 401) {
                // Handle unauthorized error - could trigger a logout or token refresh
                Alert.alert('Session Expired', 'Please login again');
                // Add your logout logic here if needed
            } else {
                Alert.alert('Error', 'Failed to load transactions');
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user?.token, activeFilter, activeStatus, sort]); // Remove isLoading from dependencies

    // Modified useEffect to prevent infinite fetching
    useEffect(() => {
        const initialFetch = () => {
            setPage(1);
            setTransactions([]); // Clear existing transactions
            fetchTransactions(1, true);
        };

        if (user?.token) {
            initialFetch();
        }
    }, [activeFilter, activeStatus, sort, user?.token]); // Add user.token to dependencies

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchTransactions(1, true);
        setIsRefreshing(false);
    }, [fetchTransactions]);

    const handleLoadMore = useCallback(() => {
        if (!isLoading && hasMore) {
            fetchTransactions(page + 1, false);
        }
    }, [isLoading, hasMore, page, fetchTransactions]);

    // Single effect to handle both initial load and filter changes
    useEffect(() => {
        // Reset page and fetch only when filters change
        setPage(1);
        setTransactions([]); // Clear existing transactions
        fetchTransactions(1, true);
    }, [activeFilter, activeStatus, sort]); // Remove fetchTransactions from dependency array

    const filteredTransactions = useMemo(() => {
        return transactions.filter(transaction => {
            if (activeFilter === 'all') return true;
            return transaction.type === activeFilter;
        });
    }, [transactions, activeFilter]);

    const handleTransactionPress = (transaction: Transaction): void => {
        Alert.alert(
            'Transaction Details',
            `${transaction.type === 'sent' ? 'Sent to' : 'Received from'}: ${transaction.amount} BTC\nDate: ${transaction.date}`
        );
    };

    const renderTransaction = ({ item }: { item: Transaction }): React.ReactElement => {
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

            <View style={styles.filterRow}>
                <TouchableOpacity
                    style={[styles.sortButton, { backgroundColor: colors.card }]}
                    onPress={() => {
                        const sorts: ('newest' | 'oldest' | 'amount-high' | 'amount-low')[] =
                            ['newest', 'oldest', 'amount-high', 'amount-low'];
                        const currentIndex = sorts.indexOf(sort);
                        setSort(sorts[(currentIndex + 1) % sorts.length]);
                    }}
                >
                    <Ionicons name="funnel-outline" size={20} color={colors.text} />
                    <Text style={[styles.sortText, { color: colors.text }]}>
                        {sort.charAt(0).toUpperCase() + sort.slice(1)}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.statusButton, { backgroundColor: colors.card }]}
                    onPress={() => {
                        const statuses: ('all' | 'pending' | 'completed' | 'failed' | 'reversed')[] =
                            ['all', 'pending', 'completed', 'failed', 'reversed'];
                        const currentIndex = statuses.indexOf(activeStatus);
                        setActiveStatus(statuses[(currentIndex + 1) % statuses.length]);
                    }}
                >
                    <Text style={[styles.statusText, { color: colors.text }]}>
                        Status: {activeStatus.charAt(0).toUpperCase() + activeStatus.slice(1)}
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredTransactions}
                renderItem={renderTransaction}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={() => (
                    isLoading ? null : <EmptyTransactionList />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.text}
                    />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() => (
                    isLoading && !isRefreshing ? (
                        <ActivityIndicator
                            color={colors.text}
                            style={styles.loader}
                        />
                    ) : null
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
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

    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
    loader: {
        padding: 20,
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
    },
    sortText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    statusButton: {
        padding: 8,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
    },
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

export default memo(TransactionsScreen);