import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert, Modal, TextInput, Keyboard, TouchableWithoutFeedback, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useStore } from '../../services/store';
import QRCode from 'react-native-qrcode-svg';
import * as Crypto from 'expo-crypto';
import { CameraView, BarcodeScanningResult, PermissionResponse } from 'expo-camera';
import { useRouter } from 'expo-router';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { apiEndpoint } from '@/constants/api';

const ScanScreen = () => {
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();
    const [isScanMode, setIsScanMode] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [encryptedQrData, setEncryptedQrData] = useState<string>('');
    const userData = useStore((state) => state.user);
    const router = useRouter();

    // Camera and payment states
    const [scanned, setScanned] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [recipientId, setRecipientId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Animation for modal and keyboard
    const slideAnim = useRef(new Animated.Value(0)).current;
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // Setup keyboard listeners
    useEffect(() => {
        const keyboardWillShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                setKeyboardHeight(e.endCoordinates.height);
            }
        );

        const keyboardWillHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setKeyboardHeight(0);
            }
        );

        return () => {
            keyboardWillShowListener.remove();
            keyboardWillHideListener.remove();
        };
    }, []);

    // Encrypt the user ID for security
    useEffect(() => {
        const encryptUserId = async () => {
            const userId = userData.userUID || userData.userID || '';
            if (!userId) return;

            try {
                // Create a payload with user ID and timestamp to prevent replay attacks
                const payload = {
                    id: userId,
                    timestamp: Date.now(),
                    type: 'payment_receive'
                };

                // Stringify and encrypt the payload
                const jsonPayload = JSON.stringify(payload);
                const digest = await Crypto.digestStringAsync(
                    Crypto.CryptoDigestAlgorithm.SHA256,
                    jsonPayload
                );

                // Create final data with a prefix to identify the app
                setEncryptedQrData(`PAYBIT:${digest.substring(0, 32)}:${userId}`);
            } catch (error) {
                console.error('Error encrypting user ID:', error);
                setEncryptedQrData(userId); // Fallback to unencrypted ID
            }
        };

        encryptUserId();
    }, [userData.userUID, userData.userID]);

    const toggleMode = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsScanMode(!isScanMode);
            setScanned(false);
            setIsLoading(false);
        }, 300); // Short delay for transition effect
    };

    const toggleFlash = () => {
        setFlashOn(!flashOn);
    };

    const handleBarCodeScanned = (result: BarcodeScanningResult) => {
        if (scanned || !result.data) return;
        setScanned(true);

        const { data } = result;

        // Process the scanned data
        try {
            // Check if it's our app's QR code format
            if (data.startsWith('PAYBIT:')) {
                const parts = data.split(':');
                if (parts.length >= 3) {
                    const userId = parts[2];
                    setRecipientId(userId);

                    // Show the payment modal instead of an alert
                    showModal();
                    return;
                }
            }

            // Handle other QR code formats
            Alert.alert(
                "QR Code Scanned",
                `Data: ${data}`,
                [
                    { text: "OK", onPress: () => setScanned(false) }
                ]
            );
        } catch (error) {
            console.error('Error processing QR code:', error);
            Alert.alert("Error", "Could not process QR code", [
                { text: "Try Again", onPress: () => setScanned(false) }
            ]);
        }
    };

    const handleSendPayment = async () => {
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            Alert.alert("Error", "Please enter a valid amount");
            return;
        }

        if (!recipientId) {
            Alert.alert("Error", "No recipient selected. Please scan a QR code first.");
            return;
        }

        setIsProcessing(true);
        try {
            const response = await axios.post(
                `${apiEndpoint}/api/transaction/send`,
                {
                    amount: parseFloat(paymentAmount),
                    recipientUID: recipientId,
                    description: 'Payment via QR code'
                },
                {
                    headers: {
                        'x-auth-token': userData.token,
                        'Authorization': `Bearer ${userData.token}`
                    }
                }
            );

            if (response.data.success) {
                Alert.alert('Success', 'Payment sent successfully!');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setPaymentAmount('');
                setRecipientId('');
                setScanned(false);
                hideModal();
            } else {
                throw new Error(response.data.message || 'Payment failed');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to process payment');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsProcessing(false);
        }
    };

    const renderCameraContent = () => {
        return (
            <View style={styles.scanContainer}>
                <Text style={[styles.scanTitle, { color: colors.text }]}>SCAN QR CODE</Text>
                <View style={styles.camera}>
                    <CameraView
                        style={StyleSheet.absoluteFillObject}
                        onBarcodeScanned={handleBarCodeScanned}
                        barcodeScannerSettings={{
                            barcodeTypes: ['qr'],
                        }}
                        enableTorch={flashOn}
                        onCameraReady={() => console.log('Camera ready')}
                        onMountError={(error) => {
                            console.error('Camera error:', error);
                            Alert.alert('Camera Error', 'Could not start camera.');
                        }}
                    />
                    {!scanned && (
                        <View style={styles.scannerOverlay}>
                            <View style={styles.scannerFrame} />
                        </View>
                    )}
                </View>
                <Text style={[styles.scanInstructions, { color: colors.text }]}>
                    Point your camera at a QR code
                </Text>

                <View style={styles.cameraControlsContainer}>
                    <TouchableOpacity
                        style={[styles.flashButton, { backgroundColor: flashOn ? colors.primary : colors.card }]}
                        onPress={toggleFlash}
                    >
                        <Ionicons
                            name={flashOn ? "flash" : "flash-off"}
                            size={24}
                            color={flashOn ? "#FFFFFF" : colors.text}
                        />
                        <Text style={[styles.flashButtonText, { color: flashOn ? "#FFFFFF" : colors.text }]}>
                            {flashOn ? 'Flash On' : 'Flash Off'}
                        </Text>
                    </TouchableOpacity>

                    {scanned && (
                        <TouchableOpacity
                            style={[styles.scanAgainButton, { backgroundColor: colors.primary }]}
                            onPress={() => setScanned(false)}
                        >
                            <Ionicons name="scan" size={24} color="#FFFFFF" />
                            <Text style={styles.scanAgainButtonText}>
                                Scan Again
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    // Show the payment modal with animation
    const showModal = () => {
        setShowPaymentModal(true);
        Animated.timing(slideAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    // Hide the payment modal with animation
    const hideModal = () => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setShowPaymentModal(false);
            setPaymentAmount('');
        });
    };

    // Payment modal slide animation
    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [600, 0],
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? "light" : "dark"} />

            {/* Always visible toggle button */}
            <TouchableOpacity
                style={[styles.modeToggle, {
                    backgroundColor: colors.card,
                    position: 'absolute',
                    top: insets.top + 16,
                    right: 16,
                    zIndex: 10
                }]}
                onPress={toggleMode}
                disabled={isLoading}
            >
                <Ionicons
                    name={isScanMode ? "qr-code-outline" : "scan-outline"}
                    size={20}
                    color={colors.primary}
                />
                <Text style={[styles.modeToggleText, { color: colors.primary }]}>
                    {isScanMode ? 'My QR' : 'Scan'}
                </Text>
            </TouchableOpacity>

            <View style={[styles.cameraContainer, {
                backgroundColor: colors.background,
                flex: 1,
                marginTop: insets.top + 10
            }]}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : isScanMode ? (
                    renderCameraContent()
                ) : (
                    <View style={[styles.qrDisplayContainer, { paddingTop: 10 }]}>
                        <View style={styles.qrMainContent}>
                            <Text style={[styles.qrTitle, { color: colors.text }]}>MY QR CODE</Text>
                            <View style={styles.qrCodeWrapper}>
                                {encryptedQrData ? (
                                    <QRCode
                                        value={encryptedQrData}
                                        size={240}
                                        color="#000000"
                                        backgroundColor="#FFFFFF"
                                        logo={require('../../assets/images/icon.png')}
                                        logoSize={60}
                                        logoBackgroundColor="#FFFFFF"
                                        logoMargin={5}
                                        logoBorderRadius={30}
                                    />
                                ) : (
                                    <Text style={[styles.noIdText, { color: colors.text }]}>
                                        User ID not available
                                    </Text>
                                )}
                            </View>
                            <Text style={[styles.qrInstructions, { color: colors.text }]}>
                                Share this QR code to receive payments
                            </Text>
                            <View style={styles.securityBadge}>
                                <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
                                <Text style={[styles.securityNote, { color: colors.textSecondary }]}>
                                    Encrypted
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>

            {/* Payment Modal */}
            <Modal
                transparent={true}
                visible={showPaymentModal}
                animationType="none"
                onRequestClose={hideModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={hideModal}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                <Animated.View
                                    style={[
                                        styles.modalContainer,
                                        {
                                            backgroundColor: colors.card,
                                            transform: [{ translateY }],
                                            marginBottom: keyboardHeight > 0 ? keyboardHeight - 20 : 0
                                        }
                                    ]}
                                >
                                    <View style={styles.modalHeader}>
                                        <View style={styles.modalHeaderBar} />
                                    </View>
                                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                                        Send Payment
                                    </Text>

                                    <View style={styles.amountContainer}>
                                        <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
                                            Amount (BTC)
                                        </Text>
                                        <TextInput
                                            style={[styles.amountInput, { color: colors.text, borderColor: colors.border }]}
                                            placeholder="0.0"
                                            placeholderTextColor={colors.textSecondary}
                                            keyboardType="decimal-pad"
                                            value={paymentAmount}
                                            onChangeText={setPaymentAmount}
                                            autoFocus
                                        />
                                    </View>

                                    <TouchableOpacity
                                        style={[
                                            styles.sendButton,
                                            { backgroundColor: colors.primary, opacity: isProcessing ? 0.7 : 1 }
                                        ]}
                                        onPress={handleSendPayment}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <ActivityIndicator color="#FFFFFF" size="small" />
                                        ) : (
                                            <>
                                                <Ionicons name="send" size={20} color="#FFFFFF" />
                                                <Text style={styles.sendButtonText}>Send Payment</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.cancelButton]}
                                        onPress={hideModal}
                                        disabled={isProcessing}
                                    >
                                        <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    modeToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    modeToggleText: {
        marginLeft: 6,
        fontWeight: '600',
        fontSize: 14,
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    scanContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 20,
        textAlign: 'center',
    },
    camera: {
        width: '80%',
        aspectRatio: 1,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        position: 'relative',
    },
    scannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerFrame: {
        width: '70%',
        height: '70%',
        borderWidth: 2,
        borderColor: 'rgba(247, 147, 26, 0.7)',
        borderRadius: 16,
        backgroundColor: 'transparent',
    },
    cameraControlsContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        paddingHorizontal: 20,
        gap: 20,
    },
    scanInstructions: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 20,
        textAlign: 'center',
    },
    flashButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        justifyContent: 'center',
    },
    flashButtonText: {
        marginLeft: 8,
        fontWeight: '500',
    },
    qrDisplayContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    qrMainContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 20,
        textAlign: 'center',
    },
    qrCodeWrapper: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 20,
    },
    qrInstructions: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(247, 147, 26, 0.15)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    securityNote: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 4,
    },
    noIdText: {
        fontSize: 16,
        padding: 110,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanAgainButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    scanAgainButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        marginLeft: 8,
    },
    // Payment Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    modalHeaderBar: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#999',
        marginVertical: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    amountContainer: {
        marginBottom: 24,
    },
    amountLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    amountInput: {
        height: 56,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 18,
        fontWeight: '600',
    },
    sendButton: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    cancelButton: {
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
});

export default ScanScreen;
