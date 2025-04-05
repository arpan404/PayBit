import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

const SecurityScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();
    const [settings, setSettings] = useState({
        biometricAuth: true,
        twoFactorAuth: false,
        autoLock: true,
        transactionConfirmation: true,
    });

    const handleBackPress = () => {
        router.back();
    };

    const toggleSetting = (key: keyof typeof settings) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const SecurityOption = ({
        icon,
        title,
        subtitle,
        value,
        onToggle
    }: {
        icon: keyof typeof Ionicons.glyphMap;
        title: string;
        subtitle?: string;
        value: boolean;
        onToggle: () => void;
    }) => (
        <View style={[styles.option, { borderBottomColor: colors.border }]}>
            <View style={styles.optionContent}>
                <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
                    <Ionicons name={icon} size={24} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>
                    {subtitle && <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
                </View>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={value ? '#FFFFFF' : '#f4f3f4'}
            />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? "light" : "dark"} />
            <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.background }]}>
                <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Security</Text>
                <View style={styles.placeholder} />
            </View>

            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
                    showsVerticalScrollIndicator={false}
                >
                    <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} style={[styles.section, { backgroundColor: colors.card }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Authentication</Text>
                        <SecurityOption
                            icon="finger-print"
                            title="Biometric Authentication"
                            subtitle="Use fingerprint or face ID to log in"
                            value={settings.biometricAuth}
                            onToggle={() => toggleSetting('biometricAuth')}
                        />
                        <SecurityOption
                            icon="shield-checkmark"
                            title="Two-Factor Authentication"
                            subtitle="Add an extra layer of security"
                            value={settings.twoFactorAuth}
                            onToggle={() => toggleSetting('twoFactorAuth')}
                        />
                    </BlurView>

                    <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} style={[styles.section, { backgroundColor: colors.card }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Security Settings</Text>
                        <SecurityOption
                            icon="lock-closed"
                            title="Auto-Lock"
                            subtitle="Automatically lock the app when inactive"
                            value={settings.autoLock}
                            onToggle={() => toggleSetting('autoLock')}
                        />
                        <SecurityOption
                            icon="checkmark-circle"
                            title="Transaction Confirmation"
                            subtitle="Require confirmation for all transactions"
                            value={settings.transactionConfirmation}
                            onToggle={() => toggleSetting('transactionConfirmation')}
                        />
                    </BlurView>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    placeholder: {
        width: 40,
    },
    scrollContainer: {
        flex: 1,
    },
    content: {
        paddingBottom: 40,
    },
    section: {
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        overflow: 'hidden',
        width: 'auto',
        alignSelf: 'stretch',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
        marginRight: 8,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    optionSubtitle: {
        fontSize: 14,
        lineHeight: 18,
    },
});

export default SecurityScreen; 