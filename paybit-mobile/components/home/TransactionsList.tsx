import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export interface Transaction {
    id: string;
    type: 'send' | 'receive';
    amount: number;
    recipient: string;
    date: string;
    status: 'completed' | 'pending';
}

interface TransactionsListProps {
    transactions: Transaction[];
    onSeeAllPress: () => void;
    onTransactionPress: (transaction: Transaction) => void;
}

const TransactionsList = ({ transactions, onSeeAllPress, onTransactionPress }: TransactionsListProps) => {
    return (
        <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <TouchableOpacity onPress={onSeeAllPress}>
                    <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.transactionsList}>
                {transactions.map((transaction) => (
                    <TouchableOpacity
                        key={transaction.id}
                        onPress={() => onTransactionPress(transaction)}
                    >
                        <BlurView intensity={20} style={styles.transactionItem}>
                            <View style={styles.transactionIcon}>
                                <LinearGradient
                                    colors={transaction.type === 'send' ? ['#FF6B6B', '#FF5252'] : ['#4CAF50', '#45A049']}
                                    style={styles.transactionIconGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Ionicons
                                        name={transaction.type === 'send' ? 'arrow-up-outline' : 'arrow-down-outline'}
                                        size={20}
                                        color="#fff"
                                    />
                                </LinearGradient>
                            </View>
                            <View style={styles.transactionDetails}>
                                <Text style={styles.transactionRecipient}>{transaction.recipient}</Text>
                                <View style={styles.transactionMeta}>
                                    <Text style={styles.transactionDate}>{transaction.date}</Text>
                                    {transaction.status === 'pending' && (
                                        <View style={styles.pendingBadge}>
                                            <Text style={styles.pendingText}>Pending</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <Text
                                style={[
                                    styles.transactionAmount,
                                    { color: transaction.type === 'send' ? '#FF5252' : '#4CAF50' },
                                ]}
                            >
                                {transaction.type === 'send' ? '-' : '+'}${transaction.amount.toFixed(2)}
                            </Text>
                        </BlurView>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    transactionsSection: {
        flex: 1,
        backgroundColor: '#1A1A1A',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    seeAllText: {
        fontSize: 14,
        color: '#F7931A',
        fontWeight: '500',
    },
    transactionsList: {
        flex: 1,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
    },
    transactionIcon: {
        marginRight: 12,
    },
    transactionIconGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    transactionDetails: {
        flex: 1,
    },
    transactionRecipient: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
        color: '#FFFFFF',
    },
    transactionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    transactionDate: {
        fontSize: 12,
        opacity: 0.7,
        marginRight: 8,
        color: '#FFFFFF',
    },
    pendingBadge: {
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    pendingText: {
        fontSize: 10,
        color: '#FF9800',
        fontWeight: '500',
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default TransactionsList; 