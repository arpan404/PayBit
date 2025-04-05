import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ProfileScreen from '@/components/profile/Profile';

export default function ProfilePage() {
    const userData = {
        userProfileImage: 'https://example.com/image.jpg',
        userFullName: 'John Doe',
    };

    return (
        <View style={styles.container}>
            <ProfileScreen />
            <View style={styles.profileSection}>
                <View style={styles.avatarSection}>
                    {userData.userProfileImage ? (
                        <Image
                            source={{ uri: userData.userProfileImage }}
                            style={styles.profileImage}
                        />
                    ) : (
                        <LinearGradient
                            colors={['#F7931A', '#E2761B']}
                            style={styles.profileImage}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.initialsText}>
                                {userData.userFullName?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                        </LinearGradient>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    profileSection: {
        marginTop: 20,
        alignItems: 'center',
    },
    avatarSection: {
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    initialsText: {
        color: '#fff',
        fontSize: 40,
        textAlign: 'center',
        lineHeight: 100,
    },
});