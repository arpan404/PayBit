import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface ActionProps {
    icon: string;
    label: string;
    onPress: () => void;
}

interface QuickActionsProps {
    onRequest: () => void;
    onQuickPay: () => void;
    onWallet: () => void;
}

const Action = ({ icon, label, onPress }: ActionProps) => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
        <LinearGradient
            colors={['#F7931A', '#000000']}
            style={styles.actionIcon}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
        >

            <Ionicons name={icon as any} size={24} color="#fff" />

        </LinearGradient>
        <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
);

const QuickActions = ({ onRequest, onQuickPay, onWallet }: QuickActionsProps) => {
    return (
        <BlurView intensity={20} style={styles.quickActionsContainer}>
            <View style={styles.quickActions}>
                <Action icon="people-outline" label="Crowdfund" onPress={onRequest} />
                <Action icon="flash-outline" label="Quick Pay" onPress={onQuickPay} />
                <Action icon="wallet-outline" label="Wallet" onPress={onWallet} />
            </View>
        </BlurView>
    );
};

const styles = StyleSheet.create({
    quickActionsContainer: {
        marginHorizontal: 16,
        marginBottom: 24,
        borderRadius: 16,
        overflow: 'hidden',
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
    },
    actionButton: {
        alignItems: 'center',
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFFFFF',
    },
});

export default QuickActions; 