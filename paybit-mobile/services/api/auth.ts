import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (email: string, password: string) => {
    // TODO: Implement actual login logic
    return { success: true, token: 'mock-token' };
};

export const register = async (email: string, password: string) => {
    // TODO: Implement actual registration logic
    return { success: true, token: 'mock-token' };
};

export const logout = async (): Promise<void> => {
    try {
        // Clear all stored data
        await AsyncStorage.clear();
    } catch (error) {
        console.error('Error during logout:', error);
        throw error;
    }
}; 