import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const QuickPayScreen = () => {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();

    const handleBack = () => {
        router.back();
    };

    const [amount, setAmount] = useState('');

    const handleSend = () => {
        // TODO: Implement send functionality with amount
        console.log('Sending amount:', amount);
    };

    const handleReceive = () => {
        router.push('/receive');
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
                <Text style={[styles.headerTitle, { color: colors.text }]}>Quick Pay</Text>
                <View style={styles.backButton} />
            </View>

            <View style={styles.content}>
                <TouchableOpacity
                    style={styles.receiveButton}
                    onPress={handleReceive}
                >
                    <Ionicons name="arrow-down-circle" size={24} color={colors.primary} />
                    <Text style={[styles.receiveButtonText, { color: colors.primary }]}>Receive</Text>
                </TouchableOpacity>

                <View style={styles.sendContainer}>
                    <View style={[styles.amountContainer, { backgroundColor: colors.card }]}>
                        <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Amount (BTC)</Text>
                        <TextInput
                            style={[styles.amountInput, { color: colors.text }]}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    <View style={styles.instructionContainer}>
                        <Ionicons name="phone-portrait" size={24} color={colors.primary} />
                        <Text style={[styles.instructionText, { color: colors.text }]}>
                            Tap or bring your device close to the receiver
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.sendButton, { backgroundColor: colors.primary }]}
                        onPress={handleSend}
                    >
                        <Text style={styles.sendButtonText}>Send Bitcoin</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>
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
    content: {
        flex: 1,
        padding: 16,
    },
    receiveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        padding: 8,
        gap: 4,
    },
    receiveButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    sendContainer: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 24,
    },
    amountContainer: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    amountLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    amountInput: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    instructionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        marginTop: 330,
    },
    instructionText: {
        flex: 1,
        fontSize: 16,
    },
    sendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default QuickPayScreen;
