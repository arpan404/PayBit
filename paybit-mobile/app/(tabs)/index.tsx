import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Modal, TouchableOpacity, FlatList, Image, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

import Header from '../../components/home/Header';
import BalanceCard from '../../components/home/BalanceCard';
import QuickActions from '../../components/home/QuickActions';
import TransactionsList from '../../components/home/TransactionsList';
import ProfileScreen from '../../components/profile/Profile';
import { useStore } from "../../services/store"
import axios from 'axios';
import { apiEndpoint, getImageUrl } from '@/constants/api';

interface HomeScreenProps { }

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: string;
  fiatAmount: string;
  recipient: string;
  timestamp: string;
}

// Mock data


const HomeScreen = () => {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const [showProfile, setShowProfile] = useState(false);

  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<number>(0)
  useEffect(() => {
    const fetchBitcoinPrice = async () => {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur');
        setUser({
          ...user,
          btcToUsd: response.data.bitcoin.usd,
          btcToEur: response.data.bitcoin.eur
        })
        setLastUpdatedTime(Date.now())
      } catch (error) {
        console.error('Error fetching Bitcoin price:', error);
      }
    };
    if (!user.btcToUsd) {
      fetchBitcoinPrice();
    }
    const interval = setInterval(fetchBitcoinPrice, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      try {
        const response = await axios.get(`${apiEndpoint}/api/transaction/history`, {
          headers: {
            "x-auth-token": `${user.token}`,
          },
          params: {
            page: 1,
            limit: 3,
            sort: 'newest',
          },
        });
        const transactions = response.data.data.transactions.map((tx: any) => ({
          id: tx.id,
          direction: tx.direction === 'sent' ? 'sent' : 'received',
          type: tx.type,
          amount: tx.amount,
          fiatAmount: tx.fiatAmount,
          recipient: tx.counterpartyName,
          timestamp: new Date(tx.date).toLocaleDateString(),
          status: tx.status,
          description: tx.description,
          reference: tx.reference,
          campaignId: tx.campaignId,
        }));
        console.log("Transactions", transactions)
        setRecentTransactions(transactions);
      } catch (error) {
        console.error('Error fetching recent transactions:', error);
      }
    };

    fetchRecentTransactions();
  }, [user.token]);




  const handleProfilePress = () => {
    setShowProfile(true);
  };



  const handleCrowdFund = () => {
    router.push('/crowdfund');
  };

  const handleQuickPay = () => {
    router.push('/quickpay');
  };

  const handleWallet = () => {
    Alert.alert("Wallet", "Access your wallet options");
  };

  const handleSeeAllTransactions = () => {
    router.push('/transactions');
  };

  const handleTransactionPress = (transaction: any) => {
    Alert.alert('Transaction Details', `Transaction ID: ${transaction.id}`);
  };

  const handleQRPress = () => {
    Alert.alert('QR Code', 'QR Code scanner will be implemented here');
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={handleProfilePress} style={styles.avatarButton}>
        <LinearGradient
          colors={['#F7931A', '#000000']}
          style={styles.avatarGradient}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {user.userProfileImage ? (
            <Image source={{ uri: getImageUrl(user.userProfileImage) }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{user.userFullName.charAt(0).toUpperCase()}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
      <Header
        userName={user.userFullName}
        onProfilePress={handleProfilePress}
      />
    </View>
  );
  const changeTimeToString = (time: number) => {
    const currentTime = Date.now();
    const timeDiff = (currentTime - time) / 1000;
    if (timeDiff < 60) return `${timeDiff.toFixed(0)} seconds ago`;
    if (timeDiff < 3600) return `${Math.floor(timeDiff / 60)} minutes ago`;
    if (timeDiff < 86400) return `${Math.floor(timeDiff / 3600)} hours ago`;
    return `${Math.floor(timeDiff / 86400)} days ago`;
  };

  const renderBalanceCard = () => (
    <BalanceCard
      lastUpdated={changeTimeToString(lastUpdatedTime)}
    />
  );

  const renderQuickActions = () => (
    <QuickActions
      onCrowdFund={handleCrowdFund}
      onQuickPay={handleQuickPay}
      onWallet={handleWallet}
    />
  );

  const renderTransactionsList = () => (
    <TransactionsList
      transactions={recentTransactions}
      onSeeAllPress={handleSeeAllTransactions}
      onTransactionPress={handleTransactionPress}
    />
  );

  const renderContent = () => (
    <View style={styles.content}>
      {renderBalanceCard()}
      {renderQuickActions()}
      {renderTransactionsList()}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Modal
        animationType="slide"
        transparent={false}
        visible={showProfile}
        onRequestClose={() => setShowProfile(false)}
      >
        <ProfileScreen onClose={() => setShowProfile(false)} />
      </Modal>



      <StatusBar style={isDarkMode ? "light" : "dark"} />

      <FlatList
        data={[1]} // Single item to render all content
        renderItem={() => (
          <>
            {renderHeader()}
            {renderContent()}
          </>
        )}
        keyExtractor={() => 'home-content'}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.qrButton} onPress={handleQRPress}>
        <LinearGradient
          colors={['#F7931A', '#000000']}
          style={styles.qrButtonGradient}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <Ionicons name="qr-code" size={20} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    flex: 1,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  qrButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  qrButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;
