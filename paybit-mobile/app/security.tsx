import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

const SecurityScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
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
        <View style={styles.option}>
            <View style={styles.optionContent}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={24} color="#F7931A" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.optionTitle}>{title}</Text>
                    {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: '#767577', true: '#F7931A' }}
                thumbColor={value ? '#FFFFFF' : '#f4f3f4'}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Security</Text>
                <View style={styles.placeholder} />
            </View>

            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
                    showsVerticalScrollIndicator={false}
                >
                    <BlurView intensity={20} style={styles.section}>
                        <Text style={styles.sectionTitle}>Authentication</Text>
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

                    <BlurView intensity={20} style={styles.section}>
                        <Text style={styles.sectionTitle}>Security Settings</Text>
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
        backgroundColor: '#121212',
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
        backgroundColor: '#121212',
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
        color: '#FFFFFF',
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
        backgroundColor: 'rgba(26, 26, 26, 0.7)',
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
        color: '#FFFFFF',
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
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
        backgroundColor: 'rgba(247, 147, 26, 0.1)',
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
        color: '#FFFFFF',
        marginBottom: 2,
    },
    optionSubtitle: {
        fontSize: 14,
        color: '#AAAAAA',
        lineHeight: 18,
    },
});

export default SecurityScreen; 