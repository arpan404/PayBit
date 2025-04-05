import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
    userName: string;
    userImage?: string;
    onProfilePress: () => void;
}

const Header: React.FC<HeaderProps> = ({ userName, onProfilePress }) => {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            <Text style={[styles.greeting, { color: colors.text }]}>
                Hello,{'\n'}
                <Text style={styles.name}>{userName}</Text>
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        lineHeight: 32,
    },
    name: {
        color: '#F7931A',
    },
});

export default Header; 