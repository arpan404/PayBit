import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Modal, TouchableOpacity, FlatList, Image, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const HomeScreen = () => {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const logout = useStore((state) => state.logout);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<number>(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  // Verify token on mount and redirect to login if invalid
  useEffect(() => {
    const verifyToken = async () => {
      // Check for force logout flag first - highest priority
      const forceLogoutFlag = await AsyncStorage.getItem('paybit-FORCE-LOGOUT');
      if (forceLogoutFlag === 'true') {
        console.log('Force logout flag detected on home screen, redirecting to login');
        await AsyncStorage.removeItem('paybit-FORCE-LOGOUT');
        router.replace('/(auth)/login');
        return;
      }

      // Check for regular logout flag (backward compatibility)
      const logoutFlag = await AsyncStorage.getItem('paybit-logout-flag');
      if (logoutFlag === 'true') {
        console.log('Legacy logout flag detected, redirecting to login');
        await AsyncStorage.removeItem('paybit-logout-flag');
        router.replace('/(auth)/login');
        return;
      }

      // Now check if we actually have a token
      if (!user.token) {
        console.log('No token found, redirecting to login');
        router.replace('/(auth)/login');
        return;
      }

      try {
        // Try to fetch user's transactions to verify if the token is still valid
        const response = await axios.get(`${apiEndpoint}/api/transaction/history`, {
          headers: {
            'x-auth-token': user.token,
            'Authorization': `Bearer ${user.token}`,
          },
          params: {
            limit: 1, // Just request a minimal amount of data
          }
        });

        // If we got a successful response, the token is valid
        console.log('Token is valid, showing dashboard');
        setIsLoading(false);
      } catch (error) {
        console.error('Token verification failed:', error);

        // Check if the error is due to authentication
        if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
          console.log('Authentication failed, redirecting to login');

          // Just clear the token and redirect - don't set any logout flags
          setUser({ token: '' });

          Alert.alert(
            'Session Expired',
            'Your session has expired. Please login again.',
            [{
              text: 'OK',
              onPress: () => router.replace('/(auth)/login')
            }]
          );
        } else {
          // If it's a different error (like network), still allow user in but show a warning
          console.log('Network or server error, continuing anyway');
          setIsLoading(false);
          Alert.alert(
            'Connection Issue',
            'There was a problem connecting to the server. Some features may be limited.',
            [{ text: 'OK' }]
          );
        }
      }
    };

    verifyToken();
  }, [user.token, router, setUser]);

  const fetchBitcoinPrice = async (forceUpdate = false) => {
    try {
      // Only fetch if we don't already have a price, it's been more than 30 minutes, or forced
      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
      if (forceUpdate || user.btcToUsd <= 0 || lastUpdatedTime < thirtyMinutesAgo) {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur');
        setUser({
          ...user,
          btcToUsd: response.data.bitcoin.usd,
          btcToEur: response.data.bitcoin.eur
        });
        setLastUpdatedTime(Date.now());
        console.log('Bitcoin price updated successfully');
      }
    } catch (error) {
      console.error('Error fetching Bitcoin price:', error);
    }
  };

  // Fetch Bitcoin price only when necessary
  useEffect(() => {
    if (!isLoading) {
      fetchBitcoinPrice();
      // Fetch once every hour instead of every minute to avoid rate limiting
      const interval = setInterval(() => fetchBitcoinPrice(), 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  // Fetch recent transactions
  useEffect(() => {
    const fetchRecentTransactions = async () => {
      if (!user.token || isLoading) return;

      try {
        const response = await axios.get(`${apiEndpoint}/api/transaction/history`, {
          headers: {
            'x-auth-token': user.token,
            'Authorization': `Bearer ${user.token}`,
          },
          params: {
            page: 1,
            limit: 3,
            sort: 'newest',
          },
        });

        if (response.data && response.data.success && response.data.data) {
          const transactionsData = response.data.data.transactions || [];
          const formattedTransactions = transactionsData.map((tx: any) => ({
            id: tx.id,
            type: tx.direction,
            amount: tx.amount.toString(),
            fiatAmount: (tx.amount * user.btcToUsd).toFixed(2),
            recipient: tx.counterpartyName || 'Unknown',
            timestamp: tx.date,
          }));

          setRecentTransactions(formattedTransactions);
        }
      } catch (error) {
        console.error('Error fetching recent transactions:', error);
      }
    };

    fetchRecentTransactions();
  }, [user.token, isLoading, user.btcToUsd]);

  // Loading screen
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.loadingLogo}
        />
        <ActivityIndicator size="large" color="#F7931A" style={styles.loadingIndicator} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

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
    router.push('/wallet');
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
    if (!time) return 'Never updated';

    const currentTime = Date.now();
    const timeDiff = Math.max(0, currentTime - time) / 1000; // in seconds, ensure non-negative

    if (timeDiff < 5) return 'Just now';
    if (timeDiff < 60) return `${Math.floor(timeDiff)} seconds ago`;
    if (timeDiff < 3600) {
      const minutes = Math.floor(timeDiff / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    if (timeDiff < 86400) {
      const hours = Math.floor(timeDiff / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }

    const days = Math.floor(timeDiff / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  };

  const handleRefreshPrice = () => {
    fetchBitcoinPrice(true);
  };

  const renderBalanceCard = () => (
    <BalanceCard
      lastUpdated={changeTimeToString(lastUpdatedTime)}
      onRefresh={handleRefreshPrice}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HomeScreen;
