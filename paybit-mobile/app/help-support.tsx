import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

const HelpSupportScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();

    const handleBackPress = () => {
        router.back();
    };

    const handleContactSupport = () => {
        Linking.openURL('mailto:support@paybit.com');
    };

    const handleFAQ = () => {
        Alert.alert('Coming Soon', 'FAQ section will be available soon');
    };

    const handleTerms = () => {
        Alert.alert('Coming Soon', 'Terms and Conditions will be available soon');
    };

    const handlePrivacy = () => {
        Alert.alert('Coming Soon', 'Privacy Policy will be available soon');
    };

    const SupportOption = ({
        icon,
        title,
        subtitle,
        onPress
    }: {
        icon: keyof typeof Ionicons.glyphMap;
        title: string;
        subtitle?: string;
        onPress: () => void;
    }) => (
        <TouchableOpacity style={[styles.option, { borderBottomColor: colors.border }]} onPress={onPress}>
            <View style={styles.optionContent}>
                <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
                    <Ionicons name={icon} size={24} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>
                    {subtitle && <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
                </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? "light" : "dark"} />
            <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.background }]}>
                <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Support</Text>
                <View style={styles.placeholder} />
            </View>

            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
                    showsVerticalScrollIndicator={false}
                >
                    <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} style={[styles.section, { backgroundColor: colors.card }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
                        <SupportOption
                            icon="mail"
                            title="Contact Support"
                            subtitle="Get in touch with our support team"
                            onPress={handleContactSupport}
                        />
                        <SupportOption
                            icon="help-circle"
                            title="FAQ"
                            subtitle="Frequently asked questions"
                            onPress={handleFAQ}
                        />
                    </BlurView>

                    <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} style={[styles.section, { backgroundColor: colors.card }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Legal</Text>
                        <SupportOption
                            icon="document-text"
                            title="Terms of Service"
                            subtitle="Read our terms and conditions"
                            onPress={handleTerms}
                        />
                        <SupportOption
                            icon="shield"
                            title="Privacy Policy"
                            subtitle="Learn about our privacy practices"
                            onPress={handlePrivacy}
                        />
                    </BlurView>

                    <View style={styles.versionContainer}>
                        <Text style={[styles.versionText, { color: colors.textSecondary }]}>Version 1.0.0</Text>
                    </View>
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
    versionContainer: {
        alignItems: 'center',
        marginTop: 24,
    },
    versionText: {
        fontSize: 14,
    },
});

export default HelpSupportScreen; 