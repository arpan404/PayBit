import React from 'react';
import { View, StyleSheet } from 'react-native';
import ProfileScreen from '@/components/profile/Profile';

export default function ProfilePage() {
    return (
        <View style={styles.container}>
            <ProfileScreen />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
}); 