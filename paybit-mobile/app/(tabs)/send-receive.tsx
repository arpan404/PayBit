import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
    ActivityIndicator,
    Image,
    FlatList,
    AlertButton
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useStore } from '../../services/store';
import axios from 'axios';
import { apiEndpoint, getImageUrl } from '@/constants/api';
import { useRouter } from 'expo-router';

// Types for contacts from backend
interface Contact {
    id: string;
    contactUid: string;
    user: {
        id: string;
        fullname: string;
        email: string;
        profileImage?: string;
    };
}

// Types for money requests from backend
interface MoneyRequest {
    id: string;
    amount: number;
    createdAt: string;
    isResolved: boolean;
    requester: {
        fullname: string;
        email: string;
        uid: string;
        profileImage?: string;
    };
    sender: {
        fullname: string;
        email: string;
        uid: string;
        profileImage?: string;
    };
}

interface UserData {
    id: string;
    fullname: string;
    email: string;
    uid: string;
    profileImage?: string;
    token?: string;
    btcToUsd?: number;
}

const SendReceiveScreen = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors, isDarkMode } = useTheme();
    const user = useStore((state) => state.user);
    const [activeTab, setActiveTab] = useState<'send' | 'request'>('send');
    const [amount, setAmount] = useState('');
    const [address, setAddress] = useState('');
    const [note, setNote] = useState('');
    const [usdAmount, setUsdAmount] = useState('0.00');
    const btcToUsd = user.btcToUsd || 0;

    // Loading states
    const [isLoading, setIsLoading] = useState(false);
    const [isContactsLoading, setIsContactsLoading] = useState(true);
    const [isRequestsLoading, setIsRequestsLoading] = useState(true);

    // Data states
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [sentRequests, setSentRequests] = useState<MoneyRequest[]>([]);
    const [receivedRequests, setReceivedRequests] = useState<MoneyRequest[]>([]);

    // Fetch contacts from backend
    useEffect(() => {
        const fetchContacts = async () => {
            if (!user.token) return;

            setIsContactsLoading(true);
            try {
                const response = await axios.get(`${apiEndpoint}/api/user/contacts`, {
                    headers: {
                        'x-auth-token': user.token,
                        'Authorization': `Bearer ${user.token}`
                    }
                });

                if (response.data.success) {
                    setContacts(response.data.data.contacts);
                }
            } catch (error) {
                console.error('Error fetching contacts:', error);
            } finally {
                setIsContactsLoading(false);
            }
        };

        fetchContacts();
    }, [user.token]);

    // Fetch requests from backend
    useEffect(() => {
        const fetchRequests = async () => {
            if (!user.token) return;

            setIsRequestsLoading(true);
            try {
                // Fetch sent requests
                const sentResponse = await axios.get(`${apiEndpoint}/api/user/requests`, {
                    headers: {
                        'x-auth-token': user.token,
                        'Authorization': `Bearer ${user.token}`
                    },
                    params: {
                        sender: 'me'
                    }
                });

                // Fetch received requests
                const receivedResponse = await axios.get(`${apiEndpoint}/api/user/requests`, {
                    headers: {
                        'x-auth-token': user.token,
                        'Authorization': `Bearer ${user.token}`
                    },
                    params: {
                        type: 'received'
                    }
                });

                if (sentResponse.data.success) {
                    setSentRequests(sentResponse.data.data.requests);
                }
                if (receivedResponse.data.success) {
                    setReceivedRequests(receivedResponse.data.data.requests);
                }
            } catch (error) {
                console.error('Error fetching requests:', error);
            } finally {
                setIsRequestsLoading(false);
            }
        };

        fetchRequests();
    }, [user.token]);

    // Calculate USD equivalent whenever amount changes
    useEffect(() => {
        if (amount && !isNaN(parseFloat(amount)) && btcToUsd) {
            const btcAmount = parseFloat(amount);
            const usdValue = (btcAmount * btcToUsd).toFixed(2);
            setUsdAmount(usdValue);
        } else {
            setUsdAmount('0.00');
        }
    }, [amount, btcToUsd]);

    const handleSend = async () => {
        if (!amount || (!address && !selectedContact)) {
            Alert.alert("Error", "Please enter both amount and recipient");
            return;
        }

        const recipient = selectedContact
            ? selectedContact.user.fullname
            : address;

        Alert.alert(
            "Confirm Transaction",
            `Are you sure you want to send ${amount} BTC (≈$${usdAmount}) to ${recipient}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            // Call transaction API endpoint
                            const response = await axios.post(
                                `${apiEndpoint}/api/transaction/send`,
                                {
                                    amount: parseFloat(amount),
                                    recipientMail: selectedContact ? selectedContact.user.email : address,
                                },
                                {
                                    headers: {
                                        'x-auth-token': user.token,
                                        'Authorization': `Bearer ${user.token}`
                                    }
                                }
                            );

                            if (response.data.success) {
                                Alert.alert(
                                    "Success",
                                    "Transaction completed successfully!",
                                    [{ text: "OK", onPress: () => router.push('/(tabs)') }]
                                );
                                setAmount("");
                                setAddress("");
                                setNote("");
                                setSelectedContact(null);
                            } else {
                                throw new Error(response.data.message || "Transaction failed");
                            }
                        } catch (error: any) {
                            Alert.alert(
                                "Error",
                                error.response?.data?.message || "Failed to complete transaction"
                            );
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ],
        );
    };

    const handleRequest = async () => {
        if (!amount || (!address && !selectedContact)) {
            Alert.alert("Error", "Please enter both amount and sender");
            return;
        }

        const sender = selectedContact
            ? selectedContact.user.fullname
            : address;

        Alert.alert(
            "Confirm Request",
            `Are you sure you want to request ${amount} BTC (≈$${usdAmount}) from ${sender}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const response = await axios.post(`${apiEndpoint}/api/user/request`,
                                {
                                    amount: parseFloat(amount),
                                    email: selectedContact ? selectedContact.user.email : address,
                                    description: note || "Payment request from mobile app"
                                },
                                {
                                    headers: {
                                        'x-auth-token': user.token,
                                        'Authorization': `Bearer ${user.token}`
                                    }
                                }
                            );

                            if (response.data.success) {
                                Alert.alert(
                                    "Request Sent",
                                    "Your payment request has been sent successfully!",
                                    [{ text: "OK", onPress: () => router.push('/(tabs)') }]
                                );
                                setAmount("");
                                setAddress("");
                                setNote("");
                                setSelectedContact(null);
                            } else {
                                throw new Error(response.data.message || "Request failed");
                            }
                        } catch (error: any) {
                            Alert.alert(
                                "Error",
                                error.response?.data?.message || "Failed to send payment request"
                            );
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ],
        );
    };

    const handleContactSelect = (contact: Contact) => {
        setSelectedContact(contact);
        setAddress(''); // Clear address when contact is selected
    };

    const handleAddressChange = (text: string) => {
        setAddress(text);
        setSelectedContact(null); // Clear selected contact when address is entered
    };

    const handleAddContact = () => {
        if (!address) {
            Alert.alert("Error", "Please enter a user ID first");
            return;
        }

        Alert.alert(
            "Add Contact",
            `Would you like to add ${address} to your contacts?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Add",
                    onPress: async () => {
                        try {
                            const response = await axios.post(
                                `${apiEndpoint}/api/user/contacts`,
                                { email: address },
                                {
                                    headers: {
                                        'x-auth-token': user.token,
                                        'Authorization': `Bearer ${user.token}`
                                    }
                                }
                            );

                            if (response.data.success) {
                                // Refresh contacts
                                const contactsResponse = await axios.get(`${apiEndpoint}/api/user/contacts`, {
                                    headers: {
                                        'x-auth-token': user.token,
                                        'Authorization': `Bearer ${user.token}`
                                    }
                                });

                                if (contactsResponse.data.success) {
                                    setContacts(contactsResponse.data.data.contacts);
                                    const newContact = contactsResponse.data.data.contacts.find(
                                        (c: Contact) => c.contactUid === address
                                    );
                                    if (newContact) {
                                        setSelectedContact(newContact);
                                        setAddress('');
                                    }
                                }

                                Alert.alert("Success", "Contact added successfully");
                            }
                        } catch (error: any) {
                            Alert.alert(
                                "Error",
                                error.response?.data?.message || "Failed to add contact"
                            );
                        }
                    },
                },
            ],
        );
    };

    const handlePayRequest = async (request: MoneyRequest) => {
        if (!request.requester.email) {
            Alert.alert("Error", "Cannot process payment: Recipient email is missing");
            return;
        }

        Alert.alert(
            "Confirm Payment",
            `Are you sure you want to pay ${request.amount.toFixed(8)} BTC (≈$${(request.amount * btcToUsd).toFixed(2)}) to ${request.requester.email}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Pay",
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const response = await axios.post(
                                `${apiEndpoint}/api/transaction/send`,
                                {
                                    amount: request.amount,
                                    recipientMail: request.requester.email,
                                    requestID: request.id,
                                    senderEmail: user.userEmail
                                },
                                {
                                    headers: {
                                        'x-auth-token': user.token,
                                        'Authorization': `Bearer ${user.token}`
                                    }
                                }
                            );

                            if (response.data.success) {
                                Alert.alert(
                                    "Success",
                                    "Payment completed successfully!",
                                    [{
                                        text: "OK", onPress: () => {
                                            // Refresh requests after payment
                                            const fetchRequests = async () => {
                                                try {
                                                    const receivedResponse = await axios.get(`${apiEndpoint}/api/user/requests`, {
                                                        headers: {
                                                            'x-auth-token': user.token,
                                                            'Authorization': `Bearer ${user.token}`
                                                        },
                                                        params: {
                                                            type: 'received'
                                                        }
                                                    });

                                                    if (receivedResponse.data.success) {
                                                        setReceivedRequests(receivedResponse.data.data.requests);
                                                    }
                                                } catch (error) {
                                                    console.error('Error refreshing requests:', error);
                                                }
                                            };
                                            fetchRequests();
                                        }
                                    }]
                                );
                            } else {
                                throw new Error(response.data.message || "Payment failed");
                            }
                        } catch (error: any) {
                            Alert.alert(
                                "Error",
                                error.response?.data?.message || "Failed to complete payment"
                            );
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ],
        );
    };

    const renderContactItem = ({ item }: { item: Contact }) => {
        const isSelected = selectedContact?.id === item.id;

        return (
            <TouchableOpacity
                style={[
                    styles.contactItem,
                    isSelected && {
                        backgroundColor: 'rgba(247, 147, 26, 0.2)',
                        borderColor: colors.primary
                    }
                ]}
                onPress={() => handleContactSelect(item)}
            >
                <View style={[styles.contactAvatar, { backgroundColor: isSelected ? colors.primary : colors.border }]}>
                    {item.user.profileImage ? (
                        <Image
                            source={{ uri: getImageUrl(item.user.profileImage) }}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <Text style={[styles.contactInitial, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                            {item.user.fullname.charAt(0).toUpperCase()}
                        </Text>
                    )}
                </View>
                <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: colors.text }]}>
                        {item.user.fullname}
                    </Text>
                    <Text style={[styles.contactEmail, { color: colors.textSecondary }]}>
                        {item.user.email}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderRequestItem = ({ item }: { item: MoneyRequest }) => {
        const isReceived = item.sender.email === user.userEmail;
        const counterparty = isReceived ? item.requester : item.sender;
        const amount = item.amount.toFixed(8);
        const usdValue = (item.amount * btcToUsd).toFixed(2);

        const handlePress = () => {
            if (isReceived) {
                handlePayRequest(item);
            } else {
                Alert.alert(
                    "Request Details",
                    `Sent to ${counterparty.fullname}\nAmount: ${amount} BTC (≈$${usdValue})\nStatus: ${item.isResolved ? 'Resolved' : 'Pending'}`
                );
            }
        };

        return (
            <TouchableOpacity
                style={[styles.requestItem, { backgroundColor: colors.card }]}
                onPress={handlePress}
            >
                <View style={styles.requestAvatar}>
                    {counterparty.profileImage ? (
                        <Image
                            source={{ uri: getImageUrl(counterparty.profileImage) }}
                            style={styles.requestAvatarImage}
                        />
                    ) : (
                        <Text style={[styles.requestInitial, { color: colors.text }]}>
                            {counterparty.fullname.charAt(0).toUpperCase()}
                        </Text>
                    )}
                </View>
                <View style={styles.requestInfo}>
                    <Text style={[styles.requestName, { color: colors.text }]}>
                        {counterparty.fullname}
                    </Text>
                    <Text style={[styles.requestAmount, { color: colors.primary }]}>
                        {amount} BTC (≈${usdValue})
                    </Text>
                </View>
                <View style={styles.requestActions}>
                    {isReceived ? (
                        <TouchableOpacity
                            style={[styles.payButton, { backgroundColor: colors.primary }]}
                            onPress={() => handlePayRequest(item)}
                            disabled={isLoading}
                        >
                            <Text style={styles.payButtonText}>Pay Now</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={[
                            styles.requestStatus,
                            { backgroundColor: item.isResolved ? colors.success : colors.primary }
                        ]}>
                            <Text style={styles.requestStatusText}>
                                {item.isResolved ? 'Resolved' : 'Pending'}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDarkMode ? "light" : "dark"} />

            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Transfer</Text>
            </View>

            <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'send' && styles.activeTab]}
                    onPress={() => setActiveTab('send')}
                >
                    <Ionicons
                        name="arrow-up-circle-outline"
                        size={20}
                        color={activeTab === 'send' ? colors.primary : colors.text}
                        style={styles.tabIcon}
                    />
                    <Text style={[styles.tabText, activeTab === 'send' && styles.activeTabText]}>Send</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === "request" && styles.activeTab]}
                    onPress={() => setActiveTab("request")}
                >
                    <Ionicons
                        name="arrow-down-circle-outline"
                        size={20}
                        color={activeTab === 'request' ? colors.primary : colors.text}
                        style={styles.tabIcon}
                    />
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === "request" && styles.activeTabText,
                        ]}
                    >
                        Request
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                style={styles.contentContainer}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
                data={[1]} // Dummy data to render once
                renderItem={() => (
                    <>
                        <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} style={styles.formContainer}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount (BTC)</Text>
                                <View style={[styles.amountContainer, { backgroundColor: colors.border }]}>
                                    <TextInput
                                        style={[styles.amountInput, { color: colors.text }]}
                                        value={amount}
                                        onChangeText={setAmount}
                                        placeholder="0.00"
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="decimal-pad"
                                    />
                                    <Text style={[styles.btcLabel, { color: colors.primary }]}>BTC</Text>
                                </View>
                                <Text style={[styles.usdEquivalent, { color: colors.textSecondary }]}>≈ ${usdAmount} USD</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                    {activeTab === 'send' ? 'Recipient' : 'Request From'}
                                </Text>

                                {selectedContact ? (
                                    <View style={[styles.selectedContactContainer, { backgroundColor: colors.border }]}>
                                        <View style={styles.selectedContactInfo}>
                                            {selectedContact.user.profileImage ? (
                                                <Image
                                                    source={{ uri: getImageUrl(selectedContact.user.profileImage) }}
                                                    style={styles.selectedContactAvatar}
                                                />
                                            ) : (
                                                <View style={[styles.selectedContactInitials, { backgroundColor: colors.primary }]}>
                                                    <Text style={styles.selectedContactInitialsText}>
                                                        {selectedContact.user.fullname.charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                            )}
                                            <View style={styles.selectedContactTextContainer}>
                                                <Text style={[styles.selectedContactName, { color: colors.text }]}>
                                                    {selectedContact.user.fullname}
                                                </Text>
                                                <Text style={[styles.selectedContactEmail, { color: colors.textSecondary }]}>
                                                    {selectedContact.user.email}
                                                </Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.clearButton}
                                            onPress={() => setSelectedContact(null)}
                                        >
                                            <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={[styles.addressInputContainer, { backgroundColor: colors.border }]}>
                                        <TextInput
                                            style={[styles.addressInput, { color: colors.text }]}
                                            value={address}
                                            onChangeText={handleAddressChange}
                                            placeholder={activeTab === 'send' ? "Enter User Email" : "Enter User Email"}
                                            placeholderTextColor={colors.textSecondary}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                        <View style={styles.addressButtons}>
                                            <TouchableOpacity
                                                style={styles.addressButton}
                                                onPress={handleAddContact}
                                            >
                                                <Ionicons name="person-add-outline" size={20} color={colors.text} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Note (Optional)</Text>
                                <TextInput
                                    style={[styles.noteInput, { color: colors.text, backgroundColor: colors.border }]}
                                    value={note}
                                    onChangeText={setNote}
                                    placeholder="Add a note"
                                    placeholderTextColor={colors.textSecondary}
                                    multiline
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.actionButton, isLoading && styles.disabledButton]}
                                onPress={activeTab === 'send' ? handleSend : handleRequest}
                                disabled={isLoading}
                            >
                                <LinearGradient
                                    colors={['#F7931A', '#E87B0E']}
                                    style={styles.gradientButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons
                                                name={activeTab === 'send' ? "arrow-up-circle" : "arrow-down-circle"}
                                                size={20}
                                                color="#FFFFFF"
                                                style={styles.buttonIcon}
                                            />
                                            <Text style={styles.actionButtonText}>
                                                {activeTab === 'send' ? 'Send Bitcoin' : 'Request Bitcoin'}
                                            </Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </BlurView>

                        {activeTab === 'request' && (
                            <View style={styles.requestsSection}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Received Requests</Text>
                                {isRequestsLoading ? (
                                    <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
                                ) : sentRequests.length > 0 ? (
                                    <FlatList
                                        data={sentRequests}
                                        renderItem={renderRequestItem}
                                        keyExtractor={(item) => item.id}
                                        scrollEnabled={false}
                                        style={styles.requestsList}
                                    />
                                ) : (
                                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                        No received requests
                                    </Text>
                                )}

                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Sent Requests</Text>
                                {isRequestsLoading ? (
                                    <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
                                ) : receivedRequests.length > 0 ? (
                                    <FlatList
                                        data={receivedRequests}
                                        renderItem={renderRequestItem}
                                        keyExtractor={(item) => item.id}
                                        scrollEnabled={false}
                                        style={styles.requestsList}
                                    />
                                ) : (
                                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                        No sent requests
                                    </Text>
                                )}
                            </View>
                        )}

                        {activeTab === 'send' && (
                            <View style={styles.contactsSection}>
                                <Text style={[styles.contactsTitle, { color: colors.text }]}>
                                    Send To
                                </Text>

                                {isContactsLoading ? (
                                    <ActivityIndicator size="small" color={colors.primary} style={styles.contactsLoader} />
                                ) : contacts.length > 0 ? (
                                    <FlatList
                                        data={contacts}
                                        renderItem={renderContactItem}
                                        keyExtractor={(item) => item.id}
                                        horizontal={false}
                                        showsVerticalScrollIndicator={false}
                                        style={styles.contactsList}
                                    />
                                ) : (
                                    <View style={styles.emptyContactsContainer}>
                                        <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                                        <Text style={[styles.emptyContactsText, { color: colors.textSecondary }]}>
                                            No contacts yet
                                        </Text>
                                        <Text style={[styles.emptyContactsSubtext, { color: colors.textSecondary }]}>
                                            Add contacts to quickly send and request Bitcoin
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </>
                )}
                keyExtractor={() => 'main-content'}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    tabIcon: {
        marginRight: 8,
    },
    activeTab: {
        backgroundColor: 'rgba(247, 147, 26, 0.15)',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#FDFDFD',
    },
    activeTabText: {
        color: '#F7931A',
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    scrollContent: {
        padding: 16,
    },
    formContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        padding: 20,
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 14,
    },
    amountInput: {
        flex: 1,
        fontSize: 18,
        fontWeight: '500',
    },
    btcLabel: {
        fontWeight: '600',
        marginLeft: 4,
        fontSize: 16,
    },
    usdEquivalent: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'right',
    },
    addressInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    addressInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 10,
    },
    addressButtons: {
        flexDirection: 'row',
    },
    addressButton: {
        padding: 8,
        marginRight: 4,
    },
    scanButton: {
        padding: 8,
    },
    noteInput: {
        fontSize: 16,
        padding: 12,
        borderRadius: 12,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    actionButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    disabledButton: {
        opacity: 1,
    },
    gradientButton: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    buttonIcon: {
        marginRight: 8,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    contactsSection: {
        marginTop: 10,
        paddingBottom: 20,
    },
    contactsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    contactsList: {
        maxHeight: 300,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(100, 100, 100, 0.2)',
    },
    contactAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    contactInitial: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    contactEmail: {
        fontSize: 14,
    },
    contactsLoader: {
        marginTop: 20,
    },
    emptyContactsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
    },
    emptyContactsText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyContactsSubtext: {
        fontSize: 14,
        textAlign: 'center',
    },
    selectedContactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        padding: 12,
    },
    selectedContactInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    selectedContactAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    selectedContactInitials: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    selectedContactInitialsText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    selectedContactTextContainer: {
        flex: 1,
    },
    selectedContactName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    selectedContactEmail: {
        fontSize: 14,
    },
    clearButton: {
        padding: 4,
    },
    requestsSection: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    requestsList: {
        marginBottom: 24,
    },
    requestItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(100, 100, 100, 0.2)',
    },
    requestAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
        backgroundColor: 'rgba(100, 100, 100, 0.2)',
    },
    requestAvatarImage: {
        width: '100%',
        height: '100%',
    },
    requestInitial: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    requestInfo: {
        flex: 1,
    },
    requestName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    requestAmount: {
        fontSize: 14,
        fontWeight: '500',
    },
    requestStatus: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    requestStatusText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
    },
    loader: {
        marginVertical: 20,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        marginVertical: 20,
    },
    requestActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    payButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    payButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default SendReceiveScreen;
