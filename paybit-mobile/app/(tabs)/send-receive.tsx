import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

const SendReceiveScreen = () => {
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();
    const [activeTab, setActiveTab] = useState<'send' | 'request'>('send');
    const [amount, setAmount] = useState('');
    const [address, setAddress] = useState('');
    const [note, setNote] = useState('');

  const handleSend = () => {
    if (!amount || !address) {
      Alert.alert("Error", "Please enter both amount and address");
      return;
    }

    Alert.alert(
      "Confirm Transaction",
      `Are you sure you want to send ${amount} BTC to ${address}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            Alert.alert("Success", "Transaction initiated!");
            setAmount("");
            setAddress("");
            setNote("");
          },
        },
      ],
    );
  };

  const handleRequest = () => {
    if (!amount) {
      Alert.alert("Error", "Please enter an amount");
      return;
    }

    Alert.alert(
      "Request Created",
      `A request for ${amount} BTC has been created. Share your address with the sender.`,
      [{ text: "OK" }],
    );
  };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? "light" : "dark"} />

            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Transfer</Text>
            </View>

            <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'send' && styles.activeTab]}
                    onPress={() => setActiveTab('send')}
                >
                    <Text style={[styles.tabText, activeTab === 'send' && styles.activeTabText]}>Send</Text>
                </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "request" && styles.activeTab]}
          onPress={() => setActiveTab("request")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "request" && styles.activeTabText,
            ]}
          >
            Request
          </Text>
        </TouchableOpacity>
      </View>

            <ScrollView
                style={styles.contentContainer}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
            >
                <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount (BTC)</Text>
                        <View style={[styles.amountContainer, { backgroundColor: colors.border }]}>
                            <TextInput
                                style={[styles.amountInput, { color: colors.text }]}
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="0.00"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="decimal-pad"
                            />
                            <Text style={[styles.btcLabel, { color: colors.primary }]}>BTC</Text>
                        </View>
                        <Text style={[styles.usdEquivalent, { color: colors.textSecondary }]}>≈ $0.00 USD</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                            {activeTab === 'send' ? 'Recipient Address' : 'Your Address'}
                        </Text>
                        <View style={[styles.addressInputContainer, { backgroundColor: colors.border }]}>
                            <TextInput
                                style={[styles.addressInput, { color: colors.text }]}
                                value={address}
                                onChangeText={setAddress}
                                placeholder={activeTab === 'send' ? "Enter wallet address" : "Your BTC address to share"}
                                placeholderTextColor={colors.textSecondary}
                            />
                            <TouchableOpacity style={styles.scanButton}>
                                <Ionicons name="qr-code-outline" size={20} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Note (Optional)</Text>
                        <TextInput
                            style={[styles.noteInput, { color: colors.text, backgroundColor: colors.border }]}
                            value={note}
                            onChangeText={setNote}
                            placeholder="Add a note"
                            placeholderTextColor={colors.textSecondary}
                            multiline
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={activeTab === 'send' ? handleSend : handleRequest}
                    >
                        <View style={[styles.gradientButton, { backgroundColor: colors.primary }]}>
                            <Text style={styles.actionButtonText}>
                                {activeTab === 'send' ? 'Send Bitcoin' : 'Request Bitcoin'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </BlurView>

                {activeTab === 'send' && (
                    <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} style={styles.recentContactsContainer}>
                        <Text style={[styles.recentContactsTitle, { color: colors.text }]}>Recent Contacts</Text>
                        <View style={styles.contactsList}>
                            {['Alice', 'Bob', 'Charlie'].map((contact, index) => (
                                <TouchableOpacity key={index} style={styles.contactItem}>
                                    <View style={[styles.contactAvatar, { backgroundColor: colors.border }]}>
                                        <Text style={[styles.contactInitial, { color: colors.text }]}>{contact[0]}</Text>
                                    </View>
                                    <Text style={[styles.contactName, { color: colors.text }]}>{contact}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </BlurView>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: 'rgba(247, 147, 26, 0.15)',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '500',
    },
    activeTabText: {
        color: '#F7931A',
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    scrollContent: {
        padding: 16,
    },
    formContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        padding: 20,
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 14,
    },
    amountInput: {
        flex: 1,
        fontSize: 16,
    },
    btcLabel: {
        fontWeight: '500',
        marginLeft: 4,
    },
    usdEquivalent: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'right',
    },
    addressInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 14,
    },
    addressInput: {
        flex: 1,
        fontSize: 16,
    },
    scanButton: {
        padding: 6,
    },
    noteInput: {
        flex: 1,
        fontSize: 16,
        padding: 12,
        borderRadius: 12,
    },
    actionButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientButton: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    recentContactsContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        padding: 20,
        marginBottom: 20,
    },
    recentContactsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    contactsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
        marginBottom: 8,
    },
    contactAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInitial: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    contactName: {
        fontSize: 16,
        marginLeft: 8,
    },
});

export default SendReceiveScreen;
