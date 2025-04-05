import React, { useState, useEffect } from 'react';
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
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { useStore } from '../services/store';
import axios from 'axios';
import { apiEndpoint, getImageUrl } from '../constants/api';

interface Campaign {
    id: string;
    name: string;
    description: string;
    goalAmount: number;
    collectedAmount: number;
    progress: number;
    image?: string;
    creatorUid: string;
    createdAt: string;
    updatedAt: string;
}

const CrowdFundScreen = () => {
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const { selectedCurrency, formatAmount } = useCurrency();
    const user = useStore((state) => state.user);

    // UI states
    const [showNewCampaign, setShowNewCampaign] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [showDonationModal, setShowDonationModal] = useState(false);

    // Form states
    const [campaignTitle, setCampaignTitle] = useState('');
    const [campaignDescription, setCampaignDescription] = useState('');
    const [campaignGoal, setCampaignGoal] = useState('');
    const [campaignImage, setCampaignImage] = useState('');
    const [donationAmount, setDonationAmount] = useState('');
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch campaigns on component mount
    useEffect(() => {
        fetchCampaigns();
    }, []);

    // Function to fetch campaigns from the API
    const fetchCampaigns = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${apiEndpoint}/api/donation/campaign`, {
                params: {
                    sort: 'newest',
                    limit: 20,
                },
                headers: user.token ? {
                    'x-auth-token': user.token,
                    'Authorization': `Bearer ${user.token}`
                } : {}
            });

            if (response.data.success) {
                setCampaigns(response.data.data.campaigns);
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            Alert.alert(
                'Error',
                'Failed to load campaigns. Please try again later.'
            );
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Handle pull-to-refresh
    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchCampaigns();
    };

    const handleBack = () => {
        router.back();
    };

    // Show donation modal for a campaign
    const handleDonate = (campaignId: string) => {
        if (!user.token) {
            Alert.alert(
                'Login Required',
                'Please login to donate',
                [{ text: 'OK', onPress: () => router.push('/login') }]
            );
            return;
        }

        setSelectedCampaignId(campaignId);
        setDonationAmount('');
        setShowDonationModal(true);
    };

    // Show confirmation dialog for donation
    const showDonationConfirmation = () => {
        if (!selectedCampaignId || !donationAmount || isNaN(parseFloat(donationAmount)) || parseFloat(donationAmount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        const campaign = campaigns.find(c => c.id === selectedCampaignId);
        if (!campaign) return;

        Alert.alert(
            'Confirm Donation',
            `Are you sure you want to donate ${donationAmount} BTC to the campaign "${campaign.name}"?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Donate',
                    onPress: () => processDonation()
                }
            ]
        );
    };

    // Process the donation API call
    const processDonation = async () => {
        if (!selectedCampaignId || !donationAmount) return;

        try {
            setIsSubmitting(true);

            const response = await axios.post(
                `${apiEndpoint}/api/donation/donate/${selectedCampaignId}`,
                { amount: parseFloat(donationAmount) },
                {
                    headers: {
                        'x-auth-token': user.token,
                        'Authorization': `Bearer ${user.token}`
                    }
                }
            );

            if (response.data.success) {
                Alert.alert(
                    'Success',
                    'Thank you for your donation!',
                    [{ text: 'OK' }]
                );

                // Refresh the campaigns list
                fetchCampaigns();
            } else {
                throw new Error(response.data.message || 'Donation failed');
            }
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to process donation'
            );
        } finally {
            setIsSubmitting(false);
            setSelectedCampaignId(null);
            setDonationAmount('');
        }
    };

    const handleCreateCampaign = () => {
        if (!user.token) {
            Alert.alert(
                'Login Required',
                'Please login to create a campaign',
                [{ text: 'OK', onPress: () => router.push('/login') }]
            );
            return;
        }

        // Reset form fields
        setCampaignTitle('');
        setCampaignDescription('');
        setCampaignGoal('');
        setCampaignImage('');
        setShowNewCampaign(true);
    };

    // Submit new campaign to API
    const submitNewCampaign = async () => {
        // Form validation
        if (!campaignTitle || campaignTitle.length < 5 || campaignTitle.length > 100) {
            Alert.alert('Error', 'Campaign name must be between 5 and 100 characters');
            return;
        }

        if (!campaignDescription || campaignDescription.length < 20 || campaignDescription.length > 2000) {
            Alert.alert('Error', 'Description must be between 20 and 2000 characters');
            return;
        }

        if (!campaignGoal || isNaN(parseFloat(campaignGoal)) || parseFloat(campaignGoal) <= 0) {
            Alert.alert('Error', 'Please enter a valid goal amount greater than 0');
            return;
        }

        if (campaignImage && !campaignImage.match(/^https?:\/\/.+/i)) {
            Alert.alert('Error', 'Image URL must be a valid URL starting with http:// or https://');
            return;
        }

        try {
            setIsSubmitting(true);

            const response = await axios.post(
                `${apiEndpoint}/api/donation/campaign`,
                {
                    name: campaignTitle,
                    description: campaignDescription,
                    goalAmount: parseFloat(campaignGoal),
                    image: campaignImage || undefined
                },
                {
                    headers: {
                        'x-auth-token': user.token,
                        'Authorization': `Bearer ${user.token}`
                    }
                }
            );

            if (response.data.success) {
                setShowNewCampaign(false);
                Alert.alert(
                    'Success',
                    'Your campaign has been created!',
                    [{ text: 'OK' }]
                );

                // Refresh the campaigns list
                fetchCampaigns();
            } else {
                throw new Error(response.data.message || 'Campaign creation failed');
            }
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to create campaign'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderCampaignCard = (campaign: Campaign) => {
        const daysCreated = Math.ceil((new Date().getTime() - new Date(campaign.createdAt).getTime()) / (1000 * 3600 * 24));
        const daysLeft = 30 - daysCreated; // Assuming campaigns run for 30 days

        return (
            <TouchableOpacity
                key={campaign.id}
                style={[styles.campaignCard, { backgroundColor: colors.card }]}
                activeOpacity={0.9}
            >
                <View style={styles.campaignImageContainer}>
                    {campaign.image ? (
                        <Image
                            source={{ uri: campaign.image }}
                            style={styles.campaignImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <LinearGradient
                            colors={['#F7931A', '#000000']}
                            style={styles.campaignImagePlaceholder}
                            start={{ x: 1, y: 0 }}
                            end={{ x: 0, y: 1 }}
                        >
                            <Ionicons name="people" size={32} color="#FFFFFF" />
                        </LinearGradient>
                    )}
                </View>
                <View style={styles.campaignInfo}>
                    <Text style={[styles.campaignTitle, { color: colors.text }]}>
                        {campaign.name}
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
                                        width: `${campaign.progress}%`,
                                    },
                                ]}
                            />
                        </View>
                        <View style={styles.progressStats}>
                            <Text style={[styles.progressText, { color: colors.text }]}>
                                {campaign.collectedAmount.toFixed(2)} / {campaign.goalAmount.toFixed(2)} BTC
                            </Text>
                            <Text style={[styles.progressText, { color: colors.text }]}>
                                {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
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
                <Text style={[styles.headerTitle, { color: colors.text }]}>CrowdFund</Text>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreateCampaign}
                >
                    <Ionicons name="add-circle" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {isLoading && !isRefreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Loading campaigns...
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                        />
                    }
                >
                    {campaigns.length > 0 ? (
                        campaigns.map(renderCampaignCard)
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="nutrition-outline" size={64} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.text }]}>
                                No campaigns found
                            </Text>
                            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                                Be the first to create a fundraising campaign!
                            </Text>
                            <TouchableOpacity
                                style={[styles.createCampaignButton, { backgroundColor: colors.primary }]}
                                onPress={handleCreateCampaign}
                            >
                                <Text style={styles.createCampaignButtonText}>
                                    Create Campaign
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Donation Amount Modal */}
            <Modal
                visible={showDonationModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    if (!isSubmitting) {
                        setShowDonationModal(false);
                        setDonationAmount('');
                        setSelectedCampaignId(null);
                    }
                }}
            >
                <BlurView
                    intensity={20}
                    style={[styles.modalContainer, { backgroundColor: colors.background }]}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.card, minHeight: '50%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Donation Amount
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowDonationModal(false);
                                    setDonationAmount('');
                                    setSelectedCampaignId(null);
                                }}
                                disabled={isSubmitting}
                            >
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.donationModalForm}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                How much would you like to donate?
                            </Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                                placeholder="0.001"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="numeric"
                                value={donationAmount}
                                onChangeText={setDonationAmount}
                                autoFocus
                            />

                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    { backgroundColor: colors.primary },
                                    isSubmitting && { opacity: 0.7 }
                                ]}
                                onPress={() => {
                                    setShowDonationModal(false);
                                    showDonationConfirmation();
                                }}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Continue</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </BlurView>
            </Modal>

            <Modal
                visible={showNewCampaign}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    if (!isSubmitting) setShowNewCampaign(false)
                }}
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
                                disabled={isSubmitting}
                            >
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                Campaign Title (5-100 characters)
                            </Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                                placeholder="Campaign Title"
                                placeholderTextColor={colors.textSecondary}
                                value={campaignTitle}
                                onChangeText={setCampaignTitle}
                                maxLength={100}
                            />

                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                Description (20-2000 characters)
                            </Text>
                            <TextInput
                                style={[styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
                                placeholder="Describe your campaign in detail"
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                                value={campaignDescription}
                                onChangeText={setCampaignDescription}
                                maxLength={2000}
                            />

                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                Goal Amount (BTC)
                            </Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                                placeholder="Target Amount (BTC)"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="decimal-pad"
                                value={campaignGoal}
                                onChangeText={setCampaignGoal}
                            />

                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                Image URL (Optional)
                            </Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                                placeholder="https://example.com/image.jpg"
                                placeholderTextColor={colors.textSecondary}
                                value={campaignImage}
                                onChangeText={setCampaignImage}
                            />

                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    { backgroundColor: colors.primary },
                                    isSubmitting && { opacity: 0.7 }
                                ]}
                                onPress={submitNewCampaign}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Create Campaign</Text>
                                )}
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
    campaignImage: {
        width: '100%',
        height: '100%',
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
        minHeight: '80%',
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
    donationModalForm: {
        paddingVertical: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    textArea: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        minHeight: 120,
    },
    submitButton: {
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 300,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    createCampaignButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    createCampaignButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CrowdFundScreen;
