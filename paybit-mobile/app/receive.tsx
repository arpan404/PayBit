import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Animated,
    Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

const ReceiveScreen = () => {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const spinValue = new Animated.Value(0);

    React.useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const handleBack = () => {
        router.back();
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
                <Text style={[styles.headerTitle, { color: colors.text }]}>Receive</Text>
                <View style={styles.backButton} />
            </View>

            <View style={styles.content}>
                <View style={styles.searchingContainer}>
                    <Animated.View style={[styles.searchingIcon, { transform: [{ rotate: spin }] }]}>
                        <Ionicons name="radio-outline" size={80} color={colors.primary} />
                    </Animated.View>
                    <Text style={[styles.searchingText, { color: colors.text }]}>
                        Searching for nearby devices...
                    </Text>
                    <Text style={[styles.searchingSubtext, { color: colors.textSecondary }]}>
                        Make sure the sending device is nearby and has QuickPay open
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
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    searchingContainer: {
        alignItems: 'center',
        padding: 20,
    },
    searchingIcon: {
        marginBottom: 24,
    },
    searchingText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    searchingSubtext: {
        fontSize: 14,
        textAlign: 'center',
        maxWidth: 280,
    },
});

export default ReceiveScreen;
