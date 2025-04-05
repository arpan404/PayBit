import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Alert,
    ActivityIndicator,
    Image,
    TextInput,
    Animated,
    Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useStore } from '../services/store';
import axios from 'axios';

// Function to generate a mock taproot address based on user ID or UID
const generateMockTaprootAddress = (id: string) => {
    // Create a simple hash from the input string
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    // Use the hash to generate a valid-looking taproot address
    // Taproot addresses start with "bc1p" and are typically 62 characters long
    const prefix = "bc1p";
    const charset = "0123456789abcdefghjklmnpqrstuvwxyz";
    let address = prefix;

    // Use the hash to seed our character selection
    for (let i = 0; i < 58; i++) {
        const index = Math.abs(hash + i * 11) % charset.length;
        address += charset[index];
    }

    return address;
};

const WalletScreen = () => {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const user = useStore((state) => state.user);
    const setUser = useStore((state) => state.setUser);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importOption, setImportOption] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');

    // Animation for copy button
    const opacityAnim = useRef(new Animated.Value(0)).current;

    // Get the taproot address from user data or generate one if not available
    const taprootAddress = user.tapRootAddress ||
        generateMockTaprootAddress(user.userUID || user.userID || 'default');

    // Log the taproot address when component mounts or address changes
    useEffect(() => {
        console.log('Current Taproot Address:', user.tapRootAddress || 'Not found, using generated address');
    }, [user.tapRootAddress]);

    const handleBack = () => {
        router.back();
    };

    const handleCopyAddress = () => {
        Clipboard.setString(taprootAddress);
        setCopiedAddress(true);

        // Animate the copy notification
        Animated.sequence([
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.delay(1500),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => setCopiedAddress(false));
    };

    const handleImportWallet = (provider: string) => {
        setImportOption(provider);
        setApiKey('');
        setApiSecret('');
        setShowImportModal(true);
    };

    const handleImportSubmit = async () => {
        if (!apiKey || !apiSecret) {
            Alert.alert('Error', 'Please enter both API Key and Secret');
            return;
        }

        setIsLoading(true);

        try {
            // In a real app, this would connect to the provider's API
            // For this demo, we'll just simulate a successful connection
            await new Promise(resolve => setTimeout(resolve, 1500));

            setShowImportModal(false);
            Alert.alert('Success', `Successfully connected to ${importOption}`);
        } catch (error) {
            Alert.alert('Error', 'Failed to connect to exchange. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? "light" : "dark"} />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Bitcoin Wallet</Text>
                <View style={styles.placeholderIcon} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.walletCard, { backgroundColor: colors.card }]}>
                    <LinearGradient
                        colors={['#F7931A', '#F7931A50']}
                        style={styles.walletGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.walletHeader}>
                            <View>
                                <Text style={styles.walletLabel}>Your Bitcoin Balance</Text>
                                <Text style={styles.walletBalance}>{user.balance} BTC</Text>
                                <Text style={styles.walletFiatBalance}>
                                    ≈ ${(parseFloat(user.balance) * user.btcToUsd).toFixed(2)} USD
                                </Text>
                            </View>
                            <Image
                                source={require('../assets/images/icon.png')}
                                style={styles.bitcoinLogo}
                            />
                        </View>
                    </LinearGradient>
                </View>

                <View style={[styles.addressCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.addressTitle, { color: colors.text }]}>Your Taproot Address</Text>
                    <Text style={[styles.addressSubtitle, { color: colors.textSecondary }]}>
                        Bitcoin P2TR
                    </Text>

                    <View style={styles.qrContainer}>
                        <QRCode
                            value={taprootAddress}
                            size={180}
                            color="#000000"
                            backgroundColor="#ffffff"
                        />
                        {!user.tapRootAddress && (
                            <View style={styles.generatedBadge}>
                                <Text style={styles.generatedBadgeText}>Auto-generated</Text>
                            </View>
                        )}
                    </View>

                    <View style={[styles.addressBox, { backgroundColor: colors.background }]}>
                        <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={1}>
                            {taprootAddress}
                        </Text>
                        <TouchableOpacity onPress={handleCopyAddress} style={styles.copyButton}>
                            <Ionicons
                                name={copiedAddress ? "checkmark" : "copy-outline"}
                                size={24}
                                color={colors.primary}
                            />
                        </TouchableOpacity>
                    </View>

                    {!user.tapRootAddress && (
                        <TouchableOpacity
                            style={[styles.saveAddressButton, { backgroundColor: colors.primary }]}
                            onPress={() => {
                                // Save the generated address to user data
                                setUser({ tapRootAddress: taprootAddress });
                                Alert.alert('Success', 'Taproot address saved!');
                            }}
                        >
                            <Text style={styles.saveAddressButtonText}>Save This Address</Text>
                        </TouchableOpacity>
                    )}

                    <Animated.View
                        style={[
                            styles.copiedNotification,
                            {
                                backgroundColor: colors.primary,
                                opacity: opacityAnim
                            }
                        ]}
                    >
                        <Text style={styles.copiedText}>Taproot Address Copied!</Text>
                    </Animated.View>
                </View>

                <View style={styles.importSection}>
                    <Text style={[styles.importTitle, { color: colors.text }]}>
                        Import from External Providers
                    </Text>
                    <Text style={[styles.importSubtitle, { color: colors.textSecondary }]}>
                        Connect your exchange accounts to manage all your Bitcoin in one place
                    </Text>

                    <View style={styles.importButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.importButton, { backgroundColor: colors.card }]}
                            onPress={() => handleImportWallet('Binance')}
                        >
                            <Ionicons name="logo-bitcoin" size={40} color="#F7931A" style={styles.providerLogo} />
                            <Text style={[styles.importButtonText, { color: colors.text }]}>Binance</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.importButton, { backgroundColor: colors.card }]}
                            onPress={() => handleImportWallet('CoinDCX')}
                        >
                            <Ionicons name="logo-usd" size={40} color="#F7931A" style={styles.providerLogo} />
                            <Text style={[styles.importButtonText, { color: colors.text }]}>CoinDCX</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.importButton, { backgroundColor: colors.card }]}
                            onPress={() => handleImportWallet('Coinbase')}
                        >
                            <Ionicons name="wallet-outline" size={40} color="#F7931A" style={styles.providerLogo} />
                            <Text style={[styles.importButtonText, { color: colors.text }]}>Coinbase</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.infoTitle, { color: colors.text }]}>
                        About Taproot Addresses
                    </Text>
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Taproot addresses (P2TR) represent the newest Bitcoin address format, activated in November 2021. They provide:
                    </Text>
                    <View style={styles.bulletPoints}>
                        <View style={styles.bulletPoint}>
                            <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                            <Text style={[styles.bulletText, { color: colors.text }]}>
                                Enhanced privacy through signature aggregation
                            </Text>
                        </View>
                        <View style={styles.bulletPoint}>
                            <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                            <Text style={[styles.bulletText, { color: colors.text }]}>
                                Lower transaction fees with smaller scripts
                            </Text>
                        </View>
                        <View style={styles.bulletPoint}>
                            <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                            <Text style={[styles.bulletText, { color: colors.text }]}>
                                Support for complex smart contracts
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Your taproot address always starts with "bc1p" and is a secure way to receive Bitcoin.
                    </Text>
                </View>
            </ScrollView>

            {/* Import Modal */}
            <Modal
                visible={showImportModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowImportModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Connect to {importOption}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowImportModal(false)}
                                disabled={isLoading}
                            >
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                            Enter your API credentials from {importOption}
                        </Text>

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                            placeholder="API Key"
                            placeholderTextColor={colors.textSecondary}
                            value={apiKey}
                            onChangeText={setApiKey}
                            editable={!isLoading}
                        />

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                            placeholder="API Secret"
                            placeholderTextColor={colors.textSecondary}
                            value={apiSecret}
                            onChangeText={setApiSecret}
                            secureTextEntry
                            editable={!isLoading}
                        />

                        <TouchableOpacity
                            style={[
                                styles.importSubmitButton,
                                { backgroundColor: colors.primary },
                                isLoading && { opacity: 0.7 }
                            ]}
                            onPress={handleImportSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.importSubmitText}>Connect</Text>
                            )}
                        </TouchableOpacity>

                        <Text style={[styles.securityNote, { color: colors.textSecondary }]}>
                            Note: Your API credentials are stored securely and only used to access your account balance and transactions.
                        </Text>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    placeholderIcon: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    walletCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    walletGradient: {
        padding: 20,
    },
    walletHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    walletLabel: {
        fontSize: 14,
        color: '#FFFFFF',
        marginBottom: 8,
    },
    walletBalance: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    walletFiatBalance: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.8,
    },
    bitcoinLogo: {
        width: 40,
        height: 40,
    },
    addressCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        alignItems: 'center',
    },
    addressTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    addressSubtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    qrContainer: {
        padding: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        marginBottom: 20,
    },
    noQRPlaceholder: {
        width: 180,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    addressBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        width: '100%',
    },
    addressText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    copyButton: {
        padding: 6,
    },
    copiedNotification: {
        position: 'absolute',
        bottom: -15,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    copiedText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    importSection: {
        marginBottom: 30,
    },
    importTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    importSubtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    importButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    importButton: {
        flex: 1,
        alignItems: 'center',
        padding: 15,
        borderRadius: 16,
        marginHorizontal: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    providerLogo: {
        width: 40,
        height: 40,
        marginBottom: 8,
    },
    importButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    input: {
        width: '100%',
        padding: 16,
        borderRadius: 10,
        marginBottom: 16,
    },
    importSubmitButton: {
        width: '100%',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    importSubmitText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    securityNote: {
        fontSize: 12,
        textAlign: 'center',
    },
    generatedBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 4,
        borderRadius: 10,
        backgroundColor: '#F7931A',
    },
    generatedBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    saveAddressButton: {
        width: '100%',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    saveAddressButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    infoCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        marginBottom: 20,
    },
    bulletPoints: {
        marginBottom: 20,
    },
    bulletPoint: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    bullet: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    bulletText: {
        fontSize: 14,
        fontWeight: '500',
    },
    demoButton: {
        marginTop: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    demoButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
    },
});

export default WalletScreen; 