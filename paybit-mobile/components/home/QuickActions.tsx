<<<<<<< HEAD:paybit-mobile/components/homescreen/QuickActions.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

interface ActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
=======
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface QuickActionsProps {
    onCrowdFund: () => void;
    onQuickPay: () => void;
    onWallet: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onCrowdFund, onQuickPay, onWallet }) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.actionButton} onPress={onCrowdFund}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(247, 147, 26, 0.1)' }]}>
                    <Ionicons name="people" size={24} color="#F7931A" />
                </View>
                <Text style={[styles.actionText, { color: colors.text }]}>CrowdFund</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={onQuickPay}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(247, 147, 26, 0.1)' }]}>
                    <Ionicons name="flash" size={24} color="#F7931A" />
                </View>
                <Text style={[styles.actionText, { color: colors.text }]}>Quick Pay</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={onWallet}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(247, 147, 26, 0.1)' }]}>
                    <Ionicons name="wallet" size={24} color="#F7931A" />
                </View>
                <Text style={[styles.actionText, { color: colors.text }]}>Wallet</Text>
            </TouchableOpacity>
        </View>
    );
>>>>>>> 511b7396cac74187a96d7f5b881ef293d4ab047f:paybit-mobile/components/home/QuickActions.tsx
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        margin: 16,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    actionButton: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '500',
    },
});

export default QuickActions;
