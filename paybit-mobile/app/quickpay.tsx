import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    ActivityIndicator,
    TextInput,
    FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useStore, selectUser } from '../services/store';
import * as Haptics from 'expo-haptics';

interface NearbyDevice {
    id: string;
    name: string;
    ip: string;
    lastSeen: number;
}

function QuickPayScreen() {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const user = useStore(selectUser);
    const [isLoading, setIsLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [usdAmount, setUsdAmount] = useState('0.00');
    const [devices, setDevices] = useState<NearbyDevice[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<NearbyDevice | null>(null);
    const btcToUsd = user.btcToUsd || 0;

    // Demo devices
    const demoDevices: NearbyDevice[] = [
        {
            id: '1',
            name: 'iPhone 13 Pro',
            ip: '192.168.1.100',
            lastSeen: Date.now()
        },
        {
            id: '2',
            name: 'Samsung Galaxy S21',
            ip: '192.168.1.101',
            lastSeen: Date.now()
        },
        {
            id: '3',
            name: 'Google Pixel 6',
            ip: '192.168.1.102',
            lastSeen: Date.now()
        }
    ];

    const scanNetwork = async () => {
        setIsLoading(true);
        setIsScanning(true);
        try {
            // Simulate network scanning delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            setDevices(demoDevices);
        } catch (error) {
            console.error('Error scanning network:', error);
            Alert.alert('Error', 'Failed to scan for devices');
        } finally {
            setIsLoading(false);
            setIsScanning(false);
        }
    };

    // Calculate USD equivalent whenever amount changes
    useEffect(() => {
        if (amount && !isNaN(parseFloat(amount)) && btcToUsd) {
            const btcAmount = parseFloat(amount);
            const usdValue = (btcAmount * btcToUsd).toFixed(2);
            setUsdAmount(usdValue);
        } else {
            setUsdAmount('0.00');
        }
    }, [amount, btcToUsd]);

    const handleBack = () => {
        router.back();
    };

    const handlePay = async () => {
        if (!selectedDevice || !amount || parseFloat(amount) <= 0) return;

        try {
            setIsLoading(true);
            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            Alert.alert('Success', 'Payment sent successfully!');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
        } catch (error: any) {
            console.error('Error sending payment:', error);
            Alert.alert('Error', 'Failed to send payment');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={handleBack}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Quick Pay</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.text }]}>Amount (BTC)</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="decimal-pad"
                        placeholder="0.00000000"
                        placeholderTextColor={colors.text + '80'}
                    />
                    <Text style={[styles.usdAmount, { color: colors.text }]}>
                        ≈ ${usdAmount} USD
                    </Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.text }]}>Note (optional)</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                        value={note}
                        onChangeText={setNote}
                        placeholder="Add a note"
                        placeholderTextColor={colors.text + '80'}
                    />
                </View>

                <View style={styles.devicesContainer}>
                    <View style={styles.devicesHeader}>
                        <Text style={[styles.devicesTitle, { color: colors.text }]}>Nearby Devices</Text>
                        <TouchableOpacity
                            onPress={scanNetwork}
                            disabled={isLoading || isScanning}
                            style={[styles.refreshButton, { opacity: isLoading || isScanning ? 0.5 : 1 }]}
                        >
                            <Ionicons
                                name={isScanning ? "scan" : "refresh"}
                                size={24}
                                color={colors.text}
                            />
                        </TouchableOpacity>
                    </View>

                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color={colors.primary} />
                            <Text style={[styles.loadingText, { color: colors.text }]}>Scanning for devices...</Text>
                        </View>
                    )}

                    {!isLoading && devices.length === 0 && (
                        <Text style={[styles.noDevicesText, { color: colors.text }]}>
                            No devices found. Tap refresh to scan again.
                        </Text>
                    )}

                    <FlatList
                        data={devices}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.deviceItem,
                                    { backgroundColor: colors.card },
                                    selectedDevice?.id === item.id && { borderColor: colors.primary }
                                ]}
                                onPress={() => setSelectedDevice(item)}
                            >
                                <Ionicons name="phone-portrait" size={24} color={colors.text} />
                                <View style={styles.deviceInfo}>
                                    <Text style={[styles.deviceName, { color: colors.text }]}>
                                        {item.name}
                                    </Text>
                                    <Text style={[styles.deviceIP, { color: colors.text + '80' }]}>
                                        {item.ip}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.devicesList}
                    />
                </View>

                {selectedDevice && (
                    <TouchableOpacity
                        style={[styles.payButton, { backgroundColor: colors.primary }]}
                        onPress={handlePay}
                        disabled={!amount || parseFloat(amount) <= 0}
                    >
                        <Text style={styles.payButtonText}>
                            Pay {amount} BTC to {selectedDevice.name}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    usdAmount: {
        fontSize: 14,
        marginTop: 4,
    },
    devicesContainer: {
        flex: 1,
        marginBottom: 24,
    },
    devicesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    devicesTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    refreshButton: {
        padding: 8,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 16,
    },
    noDevicesText: {
        textAlign: 'center',
        fontSize: 16,
        marginTop: 16,
    },
    devicesList: {
        paddingBottom: 16,
    },
    deviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    deviceInfo: {
        marginLeft: 12,
        flex: 1,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '500',
    },
    deviceIP: {
        fontSize: 14,
        marginTop: 2,
    },
    payButton: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    payButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default QuickPayScreen;

