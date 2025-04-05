import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

const ScanScreen = () => {
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? "light" : "dark"} />

            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Scan QR Code</Text>
            </View>

            <View style={[styles.cameraContainer, { backgroundColor: colors.card }]}>
                <View style={styles.camera}>
                    <View style={styles.overlay}>
                        <LinearGradient
                            colors={['rgba(247, 147, 26, 0.4)', 'rgba(247, 147, 26, 0.1)']}
                            style={styles.scanPlaceholder}
                        >
                            <Ionicons name="qr-code" size={80} color={colors.text} />
                            <Text style={[styles.placeholderText, { color: colors.text }]}>Scanner Placeholder</Text>
                        </LinearGradient>
                    </View>
                </View>
            </View>

            <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 80 }]}>
                <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} style={styles.instructionsContainer}>
                    <Text style={[styles.instructionsText, { color: colors.text }]}>
                        Scanner functionality coming soon
                    </Text>
                </BlurView>

                <View style={styles.controlsContainer}>
                    <TouchableOpacity style={[styles.controlButton, { backgroundColor: colors.card }]}>
                        <Ionicons name="flash-off" size={24} color={colors.text} />
                        <Text style={[styles.controlText, { color: colors.text }]}>Flash Off</Text>
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
        padding: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    camera: {
        flex: 1,
        position: 'relative',
        backgroundColor: 'transparent',
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanPlaceholder: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    placeholderText: {
        fontSize: 16,
        marginTop: 16,
        fontWeight: 'bold',
    },
    bottomContainer: {
        alignItems: 'center',
        paddingBottom: 30,
    },
    instructionsContainer: {
        borderRadius: 16,
        marginHorizontal: 20,
        padding: 16,
        alignItems: 'center',
        overflow: 'hidden',
    },
    instructionsText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    controlsContainer: {
        flexDirection: 'row',
        marginTop: 20,
        marginHorizontal: 20,
        justifyContent: 'space-around',
        width: '100%',
    },
    controlButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    controlText: {
        fontWeight: '500',
        marginLeft: 8,
    },
});

export default ScanScreen;
