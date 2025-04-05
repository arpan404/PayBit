import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    Alert,
    Platform,
    ActivityIndicator,
    Share,
    Clipboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useStore, selectUser } from '../services/store';
import * as Haptics from 'expo-haptics';
import * as NFC from 'expo-nfc';
import axios from 'axios';
import { apiEndpoint } from '@/constants/api';

const QuickPayScreen = () => {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const user = useStore(selectUser);
    const [isLoading, setIsLoading] = useState(false);
    const [isNFCEnabled, setIsNFCEnabled] = useState(false);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    // Check NFC availability and enable it
    useEffect(() => {
        const checkNFC = async () => {
            try {
                const isAvailable = await NFC.isAvailableAsync();
                if (!isAvailable) {
                    Alert.alert('NFC Not Available', 'Your device does not support NFC payments.');
                    router.back();
                    return;
                }

                const isEnabled = await NFC.isEnabledAsync();
                if (!isEnabled) {
                    Alert.alert('NFC Disabled', 'Please enable NFC in your device settings to use this feature.');
                    router.back();
                    return;
                }

                setIsNFCEnabled(true);
            } catch (error) {
                console.error('Error checking NFC:', error);
                Alert.alert('Error', 'Failed to check NFC availability');
                router.back();
            }
        };

        checkNFC();
    }, []);

    // Start NFC scanning
    const startScanning = async () => {
        if (!isNFCEnabled || isScanning) return;

        try {
            setIsScanning(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Start scanning for NFC tags
            await NFC.startScanningAsync({
                alertMessage: 'Hold your phone near the other device to pay',
                invalidateAfterFirstRead: true,
            });

            // Listen for NFC tag discovery
            NFC.addListener('tagDiscovered', async (tag) => {
                try {
                    // Parse the NFC tag data
                    const paymentData = JSON.parse(tag.data);

                    // Validate the payment data
                    if (!paymentData.userId || !paymentData.userName) {
                        throw new Error('Invalid payment data');
                    }

                    // Show confirmation dialog
                    Alert.alert(
                        'Confirm Payment',
                        `Send ${amount} BTC to ${paymentData.userName}?`,
                        [
                            {
                                text: 'Cancel',
                                style: 'cancel',
                                onPress: () => {
                                    setIsScanning(false);
                                    NFC.stopScanningAsync();
                                }
                            },
                            {
                                text: 'Send',
                                onPress: async () => {
                                    try {
                                        // Make API call to transfer funds
                                        const response = await axios.post(
                                            `${apiEndpoint}/api/transaction/send`,
                                            {
                                                amount: parseFloat(amount),
                                                receiverId: paymentData.userId,
                                                description: note || 'NFC payment'
                                            },
                                            {
                                                headers: {
                                                    'Authorization': `Bearer ${user.token}`
                                                }
                                            }
                                        );

                                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                        Alert.alert('Success', 'Payment sent successfully!');
                                        router.back();
                                    } catch (error) {
                                        console.error('Payment error:', error);
                                        Alert.alert('Error', 'Failed to send payment');
                                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                                    }
                                }
                            }
                        ]
                    );
                } catch (error) {
                    console.error('Error processing NFC tag:', error);
                    Alert.alert('Error', 'Failed to read payment data');
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                }
            });

        } catch (error) {
            console.error('Error starting NFC scan:', error);
            Alert.alert('Error', 'Failed to start NFC scanning');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsScanning(false);
        }
    };

    // Stop NFC scanning
    const stopScanning = async () => {
        try {
            await NFC.stopScanningAsync();
            setIsScanning(false);
        } catch (error) {
            console.error('Error stopping NFC scan:', error);
        }
    };

    // Start broadcasting payment data
    const startBroadcasting = async () => {
        if (!isNFCEnabled || !amount || parseFloat(amount) <= 0) return;

        try {
            setIsLoading(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Create payment data
            const paymentData = {
                userId: user.userID,
                userName: user.userFullName,
                amount: parseFloat(amount),
                note: note,
                timestamp: new Date().toISOString(),
            };

            // Start broadcasting NFC tag
            await NFC.startScanningAsync({
                alertMessage: 'Hold your phone near the other device to receive payment',
                invalidateAfterFirstRead: true,
            });

            // Write payment data to NFC tag
            await NFC.writeTagAsync({
                type: 'NDEF',
                data: JSON.stringify(paymentData),
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Error broadcasting payment:', error);
            Alert.alert('Error', 'Failed to broadcast payment data');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsLoading(false);
            stopScanning();
        }
    };

    const handleBack = () => {
        stopScanning();
        router.back();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? "light" : "dark"} />

            {/* Top Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.screenTitle, { color: colors.text }]}>Quick Pay</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.contentContainer}>
                {/* Amount Input */}
                <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                        Amount (BTC)
                    </Text>
                    <View style={styles.amountInputWrapper}>
                        <TextInput
                            style={[styles.amountInput, { color: colors.text, borderColor: colors.border }]}
                            placeholder="0.0"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="decimal-pad"
                            value={amount}
                            onChangeText={setAmount}
                        />
                        <Text style={[styles.btcLabel, { color: colors.primary }]}>BTC</Text>
                    </View>
                </View>

                {/* Note Input */}
                <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                        Note (Optional)
                    </Text>
                    <TextInput
                        style={[styles.noteInput, { color: colors.text, borderColor: colors.border }]}
                        placeholder="Add a note..."
                        placeholderTextColor={colors.textSecondary}
                        value={note}
                        onChangeText={setNote}
                        multiline
                    />
                </View>

                {/* NFC Status */}
                <View style={[styles.nfcStatusContainer, { backgroundColor: colors.card }]}>
                    <Ionicons
                        name={isNFCEnabled ? "radio" : "radio-outline"}
                        size={24}
                        color={isNFCEnabled ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[styles.nfcStatusText, { color: isNFCEnabled ? colors.primary : colors.textSecondary }]}>
                        {isNFCEnabled ? 'NFC Ready' : 'NFC Not Available'}
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    {/* Send Button */}
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            { backgroundColor: colors.primary },
                            (!amount || parseFloat(amount) <= 0) && styles.disabledButton
                        ]}
                        onPress={startScanning}
                        disabled={!amount || parseFloat(amount) <= 0 || isScanning}
                    >
                        {isScanning ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <>
                                <Ionicons name="send" size={20} color="#ffffff" style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>Send Payment</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Receive Button */}
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            { backgroundColor: colors.success },
                            (!amount || parseFloat(amount) <= 0) && styles.disabledButton
                        ]}
                        onPress={startBroadcasting}
                        disabled={!amount || parseFloat(amount) <= 0 || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <>
                                <Ionicons name="download" size={20} color="#ffffff" style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>Receive Payment</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Instructions */}
                <View style={styles.instructionsContainer}>
                    <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>
                        {isScanning
                            ? 'Hold your phone near the other device to send payment'
                            : 'Enter amount and tap Send to pay or Receive to get paid'}
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    backButton: {
        padding: 8,
    },
    screenTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    placeholder: {
        width: 40,
    },
    contentContainer: {
        flex: 1,
        padding: 16,
    },
    inputContainer: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
    },
    amountInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    amountInput: {
        flex: 1,
        height: 60,
        fontSize: 24,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderRadius: 12,
        textAlign: 'center',
    },
    btcLabel: {
        position: 'absolute',
        right: 15,
        fontSize: 18,
        fontWeight: 'bold',
    },
    noteInput: {
        height: 100,
        padding: 12,
        borderWidth: 1,
        borderRadius: 12,
        textAlignVertical: 'top',
    },
    nfcStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    nfcStatusText: {
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '500',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 12,
        marginHorizontal: 8,
    },
    disabledButton: {
        opacity: 0.7,
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    instructionsContainer: {
        padding: 16,
        alignItems: 'center',
    },
    instructionsText: {
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
    },
});

export default QuickPayScreen;
