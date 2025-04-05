import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../services/store';
import axios from 'axios';
import { apiEndpoint } from '@/constants/api';

const LoginScreen = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const setUser = useStore((state) => state.setUser);
    const navigateToSignup = () => {
        router.push('/(auth)/signup');
    };

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };
    const fetchSignIn = async () => {
        try {
            const response = await axios.post(`${apiEndpoint}/api/auth/login`, { email, password });
            let data = response.data.data

            setUser({
                userID: data.user.uid,
                userUID: data.user.id,
                userFullName: data.user.fullname,
                userProfileImage: data.user.profileImage,
                token: data.token,
                balance: '0.00',
                btcToUsd: 0,
                btcToEur: 0
            });
            router.replace('/(tabs)');

        } catch (error) {
            console.error('Login error:', error);
            Alert.alert('Login Failed', 'An error occurred while logging in', [{ text: 'OK' }]);
        }
    };
    const handleSignIn = () => {
        let isValid = true;

        // Reset errors
        setEmailError('');
        setPasswordError('');

        // Validate email
        if (!email.trim()) {
            setEmailError('Email is required');
            isValid = false;
        } else if (!validateEmail(email)) {
            setEmailError('Please enter a valid email');
            isValid = false;
        }

        // Validate password
        if (!password) {
            setPasswordError('Password is required');
            isValid = false;
        }

        if (isValid) {
            fetchSignIn()
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={[styles.container, { paddingTop: insets.top }]}>
                    <StatusBar style="light" />

                    {/* Logo and Header */}
                    <View style={styles.header}>
                        <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
                        <Text style={styles.appName}>PayBit</Text>
                        <Text style={styles.tagline}>Effortless Bitcoin Transactions</Text>
                    </View>

                    {/* Login Form */}
                    <View style={styles.formContainer}>
                        <Text style={styles.formTitle}>Welcome Back</Text>

                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#F7931A" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email Address"
                                placeholderTextColor="#666666"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#F7931A" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#666666"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color="#F7931A"
                                />
                            </TouchableOpacity>
                        </View>
                        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                        <TouchableOpacity
                            style={styles.forgotPassword}
                            onPress={() => alert("Think Harder")}
                        >
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleSignIn}>
                            <LinearGradient
                                colors={['#F7931A', '#000000']}
                                style={styles.loginButton}
                                start={{ x: 1, y: 0 }}
                                end={{ x: 0, y: 1 }}
                            >
                                <Text style={styles.loginButtonText}>Sign In</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or continue with</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.socialContainer}>
                            <TouchableOpacity
                                onPress={() => alert("Implemented soon!")}
                                style={styles.socialButton}>
                                <Ionicons name="logo-google" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => alert("Implemented soon!")} style={styles.socialButton}>
                                <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => alert("Implemented soon!")}
                                style={styles.socialButton}>
                                <Ionicons name="logo-facebook" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={navigateToSignup}>
                            <Text style={styles.signupText}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 40,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 16,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        color: '#AAAAAA',
    },
    formContainer: {
        paddingHorizontal: 24,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#333333',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
    },
    eyeButton: {
        padding: 8,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#F7931A',
        fontSize: 14,
    },
    loginButton: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#333333',
    },
    dividerText: {
        color: '#666666',
        marginHorizontal: 16,
        fontSize: 14,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    socialButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 12,
        borderWidth: 1,
        borderColor: '#333333',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 36,
        left: 0,
        right: 0,
    },
    footerText: {
        color: '#AAAAAA',
        fontSize: 14,
    },
    signupText: {
        color: '#F7931A',
        fontSize: 14,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#FF5252',
        fontSize: 12,
        marginTop: -12,
        marginBottom: 12,
        marginLeft: 4,
    },
});

export default LoginScreen;
