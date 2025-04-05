import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface Transaction {
    id: string;
    type: 'sent' | 'received';
    amount: string;
    fiatAmount: string;
    recipient: string;
    timestamp: string;
}

interface TransactionsListProps {
    transactions: Transaction[];
    onSeeAllPress: () => void;
    onTransactionPress: (transaction: Transaction) => void;
}

const TransactionItem: React.FC<{ transaction: Transaction; onPress: () => void }> = ({ transaction, onPress }) => {
    const { colors } = useTheme();

    return (
        <TouchableOpacity
            style={[styles.transactionItem, { backgroundColor: colors.card }]}
            onPress={onPress}
        >
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(247, 147, 26, 0.1)' }]}>
                <Ionicons
                    name={transaction.type === 'received' ? 'arrow-down' : 'arrow-up'}
                    size={24}
                    color="#F7931A"
                />
            </View>
            <View style={styles.transactionInfo}>
                <Text style={[styles.recipient, { color: colors.text }]}>{transaction.recipient}</Text>
                <Text style={[styles.timestamp, { color: colors.text }]}>{transaction.timestamp}</Text>
            </View>
            <View style={styles.amountContainer}>
                <Text style={[styles.amount, { color: colors.text }]}>{transaction.amount}</Text>
                <Text style={[styles.fiatAmount, { color: colors.text }]}>{transaction.fiatAmount}</Text>
            </View>
        </TouchableOpacity>
    );
};

const EmptyTransactions: React.FC = () => {
    const { colors } = useTheme();
    return (
        <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No transactions to show
            </Text>
        </View>
    );
};

const TransactionsList: React.FC<TransactionsListProps> = ({
    transactions,
    onSeeAllPress,
    onTransactionPress,
}) => {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Recent Transactions</Text>
                <TouchableOpacity onPress={onSeeAllPress}>
                    <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
                </TouchableOpacity>
            </View>
            {transactions.length > 0 ? (
                <FlatList
                    data={transactions}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TransactionItem
                            transaction={item}
                            onPress={() => onTransactionPress(item)}
                        />
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            ) : (
                <EmptyTransactions />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: 'transparent',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.7,
    },
    container: {
        margin: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    seeAll: {
        fontSize: 14,
        fontWeight: '500',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionInfo: {
        flex: 1,
    },
    recipient: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    timestamp: {
        fontSize: 12,
        opacity: 0.7,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    fiatAmount: {
        fontSize: 12,
        opacity: 0.7,
    },
    separator: {
        height: 12,
    },
});

export default TransactionsList; 