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
                <Text style={styles.name}>{userName.split(' ')[0]}</Text>
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
        fontSize: 16,
        lineHeight: 26,
    },
    name: {
        fontWeight: 'bold',
        fontSize: 24,
        color: '#F7931A',
    },
});

export default Header;
