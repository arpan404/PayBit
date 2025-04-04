import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import Header from '../../components/homescreen/Header';
import BalanceCard from '../../components/homescreen/BalanceCard';
import QuickActions from '../../components/homescreen/QuickActions';
import TransactionsList, { Transaction } from '../../components/homescreen/TransactionsList';
import ProfileScreen from '../../components/Profile';

interface HomeScreenProps {
  navigation?: any; // Optional navigation prop
}

// Mock data
interface User {
  id: string;
  firstName: string;
  lastName: string;
  userImage: string | undefined;
}

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const [showProfile, setShowProfile] = useState(false);

  const [user, setUser] = useState<User>({
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    userImage: undefined,
  });

  const [balance, setBalance] = useState(0.025);
  const [fiatValue, setFiatValue] = useState(1232.50);

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'receive',
      amount: 240.50,
      recipient: 'James Wilson',
      date: '2023-08-15',
      status: 'completed'
    },
    {
      id: '2',
      type: 'send',
      amount: 120.75,
      recipient: 'Sarah Johnson',
      date: '2023-08-14',
      status: 'completed'
    },
    {
      id: '3',
      type: 'receive',
      amount: 500.00,
      recipient: 'Michael Brown',
      date: '2023-08-12',
      status: 'completed'
    },
  ]);

  const handleProfilePress = () => {
    // Show the profile modal
    setShowProfile(true);
  };

  const handleRequest = () => {
    Alert.alert('Request', 'Request Bitcoin from a contact');
  };

  const handleQuickPay = () => {
    Alert.alert('Quick Pay', 'Make a fast payment to a recent contact');
  };

  const handleWallet = () => {
    Alert.alert('Wallet', 'Access your wallet options');
  };

  const handleSeeAllTransactions = () => {
    Alert.alert('All Transactions', 'View all transactions');
  };

  const handleTransactionPress = (transaction: Transaction) => {
    Alert.alert(
      'Transaction Details',
      `${transaction.type === 'send' ? 'Sent to' : 'Received from'}: ${transaction.recipient}\nAmount: $${transaction.amount.toFixed(2)}\nDate: ${transaction.date}\nStatus: ${transaction.status}`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Profile Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showProfile}
        onRequestClose={() => setShowProfile(false)}
      >
        <ProfileScreen onClose={() => setShowProfile(false)} />
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <StatusBar style="light" />

        <Header
          userName={`${user.firstName} ${user.lastName}`}
          userImage={user.userImage}
          onProfilePress={handleProfilePress}
        />

        <View style={styles.content}>
          <BalanceCard
            balance={balance}
            fiatValue={fiatValue}
            lastUpdated="2 minutes ago"
          />

          <QuickActions
            onRequest={handleRequest}
            onQuickPay={handleQuickPay}
            onWallet={handleWallet}
          />

          <TransactionsList
            transactions={recentTransactions}
            onSeeAllPress={handleSeeAllTransactions}
            onTransactionPress={handleTransactionPress}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
});

export default HomeScreen; 