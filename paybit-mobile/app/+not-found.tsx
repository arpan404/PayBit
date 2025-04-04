import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: number;
  recipient: string;
  date: string;
  status: 'completed' | 'pending';
}

const HomeScreen = () => {
  const insets = useSafeAreaInsets();

  // Mock data for recent transactions
  const recentTransactions: Transaction[] = [
    {
      id: '1',
      type: 'send',
      amount: 50.00,
      recipient: 'John Doe',
      date: '2024-04-04',
      status: 'completed',
    },
    {
      id: '2',
      type: 'receive',
      amount: 25.00,
      recipient: 'Jane Smith',
      date: '2024-04-03',
      status: 'completed',
    },
    {
      id: '3',
      type: 'send',
      amount: 100.00,
      recipient: 'Amazon',
      date: '2024-04-02',
      status: 'pending',
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Balance Card */}
      <LinearGradient
        colors={['#4A90E2', '#357ABD']}
        style={styles.balanceCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>$1,234.56</Text>
        <Text style={styles.balanceSubtext}>Last updated 2 minutes ago</Text>
      </LinearGradient>

      {/* Quick Actions */}
      <BlurView intensity={20} style={styles.quickActionsContainer}>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#4A90E2', '#357ABD']}
              style={styles.actionIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="send" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#4A90E2', '#357ABD']}
              style={styles.actionIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="download" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionText}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#4A90E2', '#357ABD']}
              style={styles.actionIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="card" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionText}>Cards</Text>
          </TouchableOpacity>
        </View>
      </BlurView>

      {/* Recent Transactions */}
      <View style={styles.transactionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.transactionsList}>
          {recentTransactions.map((transaction) => (
            <BlurView key={transaction.id} intensity={20} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                <LinearGradient
                  colors={transaction.type === 'send' ? ['#FF6B6B', '#FF5252'] : ['#4CAF50', '#45A049']}
                  style={styles.transactionIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons
                    name={transaction.type === 'send' ? 'arrow-up' : 'arrow-down'}
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
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  balanceCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  balanceLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
    opacity: 0.9,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceSubtext: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },
  quickActionsContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  transactionsSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    color: '#000000',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4A90E2',
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
    color: '#000000',
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionDate: {
    fontSize: 12,
    opacity: 0.7,
    marginRight: 8,
    color: '#000000',
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

export default HomeScreen;