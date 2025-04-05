import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';
import CurrencySelector from '../../components/CurrencySelector';

const SettingsScreen = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { isDarkMode, toggleTheme, colors } = useTheme();
    const { selectedCurrency } = useCurrency();
    const [biometricAuth, setBiometricAuth] = React.useState(false);
    const [pushNotifications, setPushNotifications] = React.useState(true);
    const [showCurrencySelector, setShowCurrencySelector] = React.useState(false);

    const handleLanguage = () => {
        // TODO: Implement language selection
    };

    const handleCurrency = () => {
        setShowCurrencySelector(true);
    };

    const handleAppearance = () => {
        // TODO: Implement appearance settings
    };

    const handlePrivacy = () => {
        // TODO: Implement privacy settings
    };

    const handleAbout = () => {
        // TODO: Implement about screen
    };

    const handlePushNotificationsToggle = () => {
        setPushNotifications(prev => !prev);
    };

    const handleBiometricAuthToggle = () => {
        setBiometricAuth(prev => !prev);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <StatusBar style={isDarkMode ? "light" : "dark"} />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
                    <View style={styles.backButton} />
                </View>

                <BlurView intensity={20} tint={colors.blurTint as 'light' | 'dark'} style={[styles.optionsSection, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
                    <SettingsOption
                        icon="language"
                        title="Language"
                        subtitle="English"
                        onPress={handleLanguage}
                    />
                    <SettingsOption
                        icon="cash"
                        title="Currency"
                        subtitle={`${selectedCurrency.code} (${selectedCurrency.symbol})`}
                        onPress={handleCurrency}
                    />
                    <SettingsOption
                        icon="moon"
                        title="Dark Mode"
                        onPress={toggleTheme}
                        showSwitch
                        switchValue={isDarkMode}
                        onSwitchChange={toggleTheme}
                    />
                </BlurView>

                <BlurView intensity={20} tint={colors.blurTint as 'light' | 'dark'} style={[styles.optionsSection, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>
                    <SettingsOption
                        icon="notifications"
                        title="Push Notifications"
                        onPress={() => { }}
                        showSwitch
                        switchValue={pushNotifications}
                        onSwitchChange={handlePushNotificationsToggle}
                    />
                    <SettingsOption
                        icon="finger-print"
                        title="Biometric Authentication"
                        onPress={() => { }}
                        showSwitch
                        switchValue={biometricAuth}
                        onSwitchChange={handleBiometricAuthToggle}
                    />
                </BlurView>

                <BlurView intensity={20} tint={colors.blurTint as 'light' | 'dark'} style={[styles.optionsSection, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
                    <SettingsOption
                        icon="shield-checkmark"
                        title="Privacy Policy"
                        onPress={handlePrivacy}
                    />
                    <SettingsOption
                        icon="information-circle"
                        title="About"
                        onPress={handleAbout}
                    />
                </BlurView>
            </ScrollView>

            <CurrencySelector
                visible={showCurrencySelector}
                onClose={() => setShowCurrencySelector(false)}
            />
        </SafeAreaView>
    );
};

const SettingsOption = ({
    icon,
    title,
    subtitle,
    onPress,
    showSwitch = false,
    switchValue,
    onSwitchChange,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: () => void;
}) => {
    const { colors } = useTheme();

    return (
        <TouchableOpacity
            style={[styles.option, { borderBottomColor: colors.border }]}
            onPress={onPress}
        >
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name={icon} size={24} color={colors.primary} />
            </View>
            <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>
                {subtitle && <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
            </View>
            {showSwitch ? (
                <Switch
                    value={switchValue}
                    onValueChange={onSwitchChange}
                    trackColor={{ false: '#767577', true: colors.primary }}
                    thumbColor={switchValue ? '#FFFFFF' : '#f4f3f4'}
                />
            ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
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
    optionsSection: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        padding: 16,
        paddingBottom: 8,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    optionSubtitle: {
        fontSize: 14,
        opacity: 0.7,
    },
});

export default SettingsScreen; 