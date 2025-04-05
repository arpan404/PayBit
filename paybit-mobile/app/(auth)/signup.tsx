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
    Animated,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const SignupScreen = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // Form states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Step management
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 2;

    // Animation values
    const [slideAnim] = useState(new Animated.Value(0));

    // Validation states
    const [nameError, setNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    // Add validation state for password requirements
    const [hasMinLength, setHasMinLength] = useState(false);
    const [hasUppercase, setHasUppercase] = useState(false);
    const [hasNumber, setHasNumber] = useState(false);

    const navigateToLogin = () => {
        router.push('/(auth)/login');
    };

    const goToNextStep = () => {
        if (currentStep < totalSteps) {
            // Slide out animation
            Animated.timing(slideAnim, {
                toValue: -400,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setCurrentStep(currentStep + 1);
                slideAnim.setValue(400);

                // Slide in animation
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        }
    };

    const goToPreviousStep = () => {
        if (currentStep > 1) {
            // Slide out animation
            Animated.timing(slideAnim, {
                toValue: 400,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setCurrentStep(currentStep - 1);
                slideAnim.setValue(-400);

                // Slide in animation
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        }
    };

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password: string): boolean => {
        // Check each condition separately
        const hasMinLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);

        // Update states for each condition
        setHasMinLength(hasMinLength);
        setHasUppercase(hasUppercase);
        setHasNumber(hasNumber);

        // Return true if all conditions are met
        return hasMinLength && hasUppercase && hasNumber;
    };

    const handlePasswordChange = (text: string) => {
        setPassword(text);
        validatePassword(text);
    };

    const validateStep1 = () => {
        let isValid = true;

        // Validate name
        if (!name.trim()) {
            setNameError('Name is required');
            isValid = false;
        } else {
            setNameError('');
        }

        // Validate email
        if (!email.trim()) {
            setEmailError('Email is required');
            isValid = false;
        } else if (!validateEmail(email)) {
            setEmailError('Please enter a valid email');
            isValid = false;
        } else {
            setEmailError('');
        }

        if (isValid) {
            goToNextStep();
        }
    };

    const handleCreateAccount = () => {
        let isValid = true;

        // Validate password
        if (!password) {
            setPasswordError('Password is required');
            isValid = false;
        } else if (!validatePassword(password)) {
            setPasswordError('Password does not meet requirements');
            isValid = false;
        } else {
            setPasswordError('');
        }

        // Validate confirm password
        if (password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            isValid = false;
        } else {
            setConfirmPasswordError('');
        }

        if (isValid) {
            // Proceed with account creation
            Alert.alert(
                "Success",
                "Account created successfully!",
                [{ text: "OK", onPress: () => navigateToLogin() }]
            );
        }
    };

    const renderStepContent = () => {
        return (
            <Animated.View style={[styles.stepContent, { transform: [{ translateX: slideAnim }] }]}>
                {currentStep === 1 && (
                    <>
                        <Text style={styles.formTitle}>Sign Up</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#F7931A" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                placeholderTextColor="#666666"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>
                        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

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

                        {/* Login link for step 1 */}
                        <View style={styles.loginLinkContainer}>
                            <Text style={styles.loginLinkText}>Already have an account? </Text>
                            <TouchableOpacity onPress={navigateToLogin}>
                                <Text style={styles.loginLinkButton}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {currentStep === 2 && (
                    <>
                        <Text style={styles.formTitle}>Create Password</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#F7931A" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#666666"
                                value={password}
                                onChangeText={handlePasswordChange}
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

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#F7931A" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password"
                                placeholderTextColor="#666666"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <Ionicons
                                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color="#F7931A"
                                />
                            </TouchableOpacity>
                        </View>
                        {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

                        <View style={styles.passwordTips}>
                            <Text style={styles.tipHeader}>Password must contain:</Text>
                            <View style={styles.tipItem}>
                                <Ionicons
                                    name={hasMinLength ? "checkmark-circle" : "close-circle"}
                                    size={16}
                                    color={hasMinLength ? "#4CAF50" : "#FF5252"}
                                />
                                <Text style={styles.tipText}>At least 8 characters</Text>
                            </View>
                            <View style={styles.tipItem}>
                                <Ionicons
                                    name={hasUppercase ? "checkmark-circle" : "close-circle"}
                                    size={16}
                                    color={hasUppercase ? "#4CAF50" : "#FF5252"}
                                />
                                <Text style={styles.tipText}>At least one uppercase letter</Text>
                            </View>
                            <View style={styles.tipItem}>
                                <Ionicons
                                    name={hasNumber ? "checkmark-circle" : "close-circle"}
                                    size={16}
                                    color={hasNumber ? "#4CAF50" : "#FF5252"}
                                />
                                <Text style={styles.tipText}>At least one number</Text>
                            </View>
                        </View>

                        <View style={styles.termsContainer}>
                            <Text style={styles.termsText}>
                                By signing up, you agree to our{' '}
                                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                                <Text style={styles.termsLink}>Privacy Policy</Text>
                            </Text>
                        </View>
                    </>
                )}
            </Animated.View>
        );
    };

    const renderActionButtons = () => {
        if (currentStep === 1) {
            return (
                <TouchableOpacity onPress={validateStep1}>
                    <LinearGradient
                        colors={['#F7931A', '#000000']}
                        style={styles.actionButton}
                        start={{ x: 1, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    >
                        <Text style={styles.actionButtonText}>Next</Text>
                    </LinearGradient>
                </TouchableOpacity>
            );
        } else if (currentStep === totalSteps) {
            return (
                <View style={styles.finalButtonsContainer}>
                    <TouchableOpacity style={styles.backButton} onPress={goToPreviousStep}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.createAccountButton} onPress={handleCreateAccount}>
                        <LinearGradient
                            colors={['#F7931A', '#000000']}
                            style={styles.actionButton}
                            start={{ x: 1, y: 0 }}
                            end={{ x: 0, y: 1 }}
                        >
                            <Text style={styles.actionButtonText}>Create Account</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            );
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
                        <Text style={styles.signupText}>Sign Up</Text>
                        <Text style={styles.tagline}>Secure Bitcoin Transactions</Text>
                    </View>

                    {/* Signup Form */}
                    <View style={styles.formContainer}>
                        {renderStepContent()}
                        {renderActionButtons()}
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
        marginTop: 20,
        marginBottom: 20,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 16,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    signupText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#F7931A',
        marginBottom: 4,
    },
    tagline: {
        fontSize: 16,
        color: '#AAAAAA',
    },
    formContainer: {
        paddingHorizontal: 24,
        flex: 1,
    },
    stepContent: {
        marginBottom: 24,
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
    passwordTips: {
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
        marginBottom: 24,
    },
    tipHeader: {
        color: '#FFFFFF',
        fontSize: 14,
        marginBottom: 8,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    tipText: {
        color: '#AAAAAA',
        fontSize: 12,
        marginLeft: 8,
    },
    actionButton: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    finalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        marginLeft: 4,
    },
    createAccountButton: {
        flex: 1,
        marginLeft: 16,
    },
    termsContainer: {
        marginTop: 4,
        marginBottom: 20,
    },
    termsText: {
        color: '#AAAAAA',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        color: '#F7931A',
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
    },
    footerText: {
        color: '#AAAAAA',
        fontSize: 14,
    },
    loginText: {
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
    loginLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    loginLinkText: {
        color: '#AAAAAA',
        fontSize: 14,
    },
    loginLinkButton: {
        color: '#F7931A',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default SignupScreen; 