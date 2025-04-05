import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface HeaderProps {
    userName: string;
    userImage?: string;
    onProfilePress: () => void;
}

const Header = ({ userName, userImage, onProfilePress }: HeaderProps) => {
    const firstName = userName.split(' ')[0];

    return (
        <View style={styles.headerContainer}>
            <TouchableOpacity onPress={onProfilePress}>
                <View style={styles.avatarContainer}>
                    {userImage ? (
                        <Image source={{ uri: userImage }} style={styles.avatar} />
                    ) : (
                        <LinearGradient
                            colors={['#F7931A', '#E2761B']}
                            style={styles.avatarPlaceholder}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.avatarText}>{firstName.charAt(0)}</Text>
                        </LinearGradient>
                    )}
                </View>
            </TouchableOpacity>
            <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.nameText}>{firstName}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
        marginRight: 12,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    welcomeContainer: {
        justifyContent: 'center',
    },
    welcomeText: {
        color: '#AAAAAA',
        fontSize: 14,
    },
    nameText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default Header; 