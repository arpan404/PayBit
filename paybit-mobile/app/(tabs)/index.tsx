<<<<<<< HEAD
import React, { useState } from "react";
import { View, StyleSheet, Alert, ScrollView, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import Header from "../../components/homescreen/Header";
import BalanceCard from "../../components/homescreen/BalanceCard";
import QuickActions from "../../components/homescreen/QuickActions";
import TransactionsList, {
  Transaction,
} from "../../components/homescreen/TransactionsList";
import ProfileScreen from "../../components/Profile";
=======
import React, { useState } from 'react';
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
>>>>>>> 511b7396cac74187a96d7f5b881ef293d4ab047f

interface HomeScreenProps {
  navigation?: any;
}

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: string;
  fiatAmount: string;
  recipient: string;
  timestamp: string;
}

// Mock data
interface User {
  id: string;
  firstName: string;
  lastName: string;
  userImage: string | undefined;
}

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [user, setUser] = useState<User>({
    id: "1",
    firstName: "John",
    lastName: "Doe",
    userImage: undefined,
  });

  const [balance, setBalance] = useState('0.025');
  const [fiatValue, setFiatValue] = useState('1232.50');

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'received',
      amount: '0.001',
      fiatAmount: '$50.00',
      recipient: 'James Wilson',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      type: 'sent',
      amount: '0.002',
      fiatAmount: '$100.00',
      recipient: 'Sarah Johnson',
      timestamp: '1 day ago'
    },
    {
      id: '3',
      type: 'received',
      amount: '0.005',
      fiatAmount: '$250.00',
      recipient: 'Michael Brown',
      timestamp: '2 days ago'
    },
  ]);

  const handleProfilePress = () => {
    setShowProfile(true);
  };

  const handleSettingsPress = () => {
    setShowSettings(true);
  };

  const handleRequest = () => {
    Alert.alert("Request", "Request Bitcoin from a contact");
  };

  const handleQuickPay = () => {
    Alert.alert("Quick Pay", "Make a fast payment to a recent contact");
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
          {user.userImage ? (
            <Image source={{ uri: user.userImage }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{user.firstName.charAt(0)}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
      <Header
        userName={`${user.firstName} ${user.lastName}`}
        onProfilePress={handleProfilePress}
      />
    </View>
  );

  const renderBalanceCard = () => (
    <BalanceCard
      balance={parseFloat(balance)}
      fiatValue={parseFloat(fiatValue)}
      lastUpdated="2 minutes ago"
    />
  );

  const renderQuickActions = () => (
    <QuickActions
      onRequest={handleRequest}
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

      <Modal
        animationType="slide"
        transparent={false}
        visible={showSettings}
        onRequestClose={() => setShowSettings(false)}
      >
        <ProfileScreen onClose={() => setShowSettings(false)} />
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
