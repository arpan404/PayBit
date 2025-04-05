import React from 'react';
import { View, ViewProps } from 'react-native';
import { useColorScheme } from 'react-native';

export const ThemedView = (props: ViewProps) => {
    const colorScheme = useColorScheme();
    const backgroundColor = colorScheme === 'dark' ? '#1A1A1A' : '#FFFFFF';

    return <View {...props} style={[{ backgroundColor }, props.style]} />;
}; 