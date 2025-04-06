import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface PaymentNotificationProps {
    visible: boolean;
    amount: string;
    senderName: string;
    isSimulated?: boolean;
    onDismiss: () => void;
}

const { width } = Dimensions.get('window');

const PaymentNotification = ({ visible, amount, senderName, isSimulated = false, onDismiss }: PaymentNotificationProps) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Provide haptic feedback when notification appears
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Animate notification in
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto dismiss after 5 seconds
            const timeout = setTimeout(() => {
                handleDismiss();
            }, 5000);

            return () => clearTimeout(timeout);
        }
    }, [visible]);

    const handleDismiss = () => {
        // Animate notification out
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Reset values
            translateY.setValue(-100);
            opacity.setValue(0);
            onDismiss();
        });
    };

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY }],
                    opacity,
                    backgroundColor: isSimulated ? '#9747FF' : '#F7931A'
                }
            ]}
        >
            <View style={styles.iconContainer}>
                <Ionicons name={isSimulated ? "hardware-chip" : "arrow-down-circle"} size={24} color="#FFFFFF" />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>
                    {isSimulated ? 'Simulated Payment!' : 'Payment Received!'}
                </Text>
                <Text style={styles.description}>
                    {`${amount} BTC from ${senderName}`}
                </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: (width - 320) / 2,
        width: 320,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 1000,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 2,
    },
    description: {
        color: '#FFFFFF',
        fontSize: 14,
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default PaymentNotification; 