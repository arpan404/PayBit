import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';

interface Campaign {
    id: string;
    title: string;
    description: string;
    targetAmount: number;
    raisedAmount: number;
    daysLeft: number;
    imageUrl: string;
}

const mockCampaigns: Campaign[] = [
    {
        id: '1',
        title: 'Community Solar Project',
        description: 'Help us install solar panels in our local community center',
        targetAmount: 2.5,
        raisedAmount: 1.2,
        daysLeft: 15,
        imageUrl: 'https://example.com/solar.jpg',
    },
    {
        id: '2',
        title: 'Tech Education Fund',
        description: 'Providing coding education to underprivileged students',
        targetAmount: 1.8,
        raisedAmount: 0.8,
        daysLeft: 20,
        imageUrl: 'https://example.com/education.jpg',
    },
];

const CrowdFundScreen = () => {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const { selectedCurrency, formatAmount } = useCurrency();
    const [showNewCampaign, setShowNewCampaign] = useState(false);
    const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);

    const handleBack = () => {
        router.back();
    };

    const handleDonate = (campaignId: string) => {
        // TODO: Implement donation flow
        Alert.alert('Donate', 'Enter amount to donate', [
            {
                text: 'Cancel',
                style: 'cancel'
            },
            {
                text: 'Donate',
                onPress: () => {
                    // TODO: Process donation
                }
            }
        ]);
    };

    const handleCreateCampaign = () => {
        setShowNewCampaign(true);
    };

    const renderCampaignCard = (campaign: Campaign) => (
        <TouchableOpacity
            key={campaign.id}
            style={[styles.campaignCard, { backgroundColor: colors.card }]}
            activeOpacity={0.9}
        >
            <View style={styles.campaignImageContainer}>
                <LinearGradient
                    colors={['#F7931A', '#000000']}
                    style={styles.campaignImagePlaceholder}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 1 }}
                >
                    <Ionicons name="people" size={32} color="#FFFFFF" />
                </LinearGradient>
            </View>
            <View style={styles.campaignInfo}>
                <Text style={[styles.campaignTitle, { color: colors.text }]}>
                    {campaign.title}
                </Text>
                <Text
                    style={[styles.campaignDescription, { color: colors.textSecondary }]}
                    numberOfLines={2}
                >
                    {campaign.description}
                </Text>
                <View style={styles.progressContainer}>
                    <View
                        style={[
                            styles.progressBar,
                            {
                                backgroundColor: colors.border,
                                width: '100%',
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${(campaign.raisedAmount / campaign.targetAmount) * 100}%`,
                                },
                            ]}
                        />
                    </View>
                    <View style={styles.progressStats}>
                        <Text style={[styles.progressText, { color: colors.text }]}>
                            {campaign.raisedAmount} BTC raised
                        </Text>
                        <Text style={[styles.progressText, { color: colors.text }]}>
                            {campaign.daysLeft} days left
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.donateButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleDonate(campaign.id)}
                >
                    <Text style={styles.donateButtonText}>Donate</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

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
                <Text style={[styles.headerTitle, { color: colors.text }]}>CrowdFund</Text>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreateCampaign}
                >
                    <Ionicons name="add-circle" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {campaigns.map(renderCampaignCard)}
            </ScrollView>

            <Modal
                visible={showNewCampaign}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowNewCampaign(false)}
            >
                <BlurView
                    intensity={20}
                    style={[styles.modalContainer, { backgroundColor: colors.background }]}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Create Campaign
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowNewCampaign(false)}
                            >
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                                placeholder="Campaign Title"
                                placeholderTextColor={colors.textSecondary}
                            />
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                                placeholder="Description"
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                numberOfLines={4}
                            />
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                                placeholder="Target Amount (BTC)"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="decimal-pad"
                            />

                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                                onPress={() => {
                                    // TODO: Handle campaign creation
                                    setShowNewCampaign(false);
                                }}
                            >
                                <Text style={styles.submitButtonText}>Create Campaign</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </BlurView>
            </Modal>
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
    createButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    donateButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 12,
        alignSelf: 'flex-start',
    },
    donateButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    campaignCard: {
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    campaignImageContainer: {
        height: 160,
        width: '100%',
    },
    campaignImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    campaignInfo: {
        padding: 16,
    },
    campaignTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    campaignDescription: {
        fontSize: 14,
        marginBottom: 16,
    },
    progressContainer: {
        width: '100%',
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#F7931A',
    },
    progressStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '500',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        minHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalForm: {
        flex: 1,
    },
    input: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    submitButton: {
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CrowdFundScreen;
