import React, { useState, useEffect } from "react";
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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../services/store';
import axios from 'axios';
import { apiEndpoint } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFromLogout, setIsFromLogout] = useState(false);

  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);

  // Check for existing token and auto-login
  useEffect(() => {
    const checkExistingToken = async () => {
      try {
        // First check for the force logout flag - this overrides everything
        const forceLogoutFlag = await AsyncStorage.getItem('paybit-FORCE-LOGOUT');

        if (forceLogoutFlag === 'true') {
          console.log('Force logout flag detected, preventing auto-login');

          // Clear the flag
          await AsyncStorage.removeItem('paybit-FORCE-LOGOUT');

          // Make sure we clear any other storage that might persist
          await AsyncStorage.removeItem('paybit-storage');
          await AsyncStorage.removeItem('paybit-logout-flag');

          // Reset user state
          setUser({
            token: '',
            userID: '',
            userUID: '',
            userFullName: '',
            userProfileImage: undefined,
            balance: '',
            btcToUsd: 0,
            btcToEur: 0,
            userEmail: '',
            tapRootAddress: undefined
          });

          setIsLoading(false);
          return;
        }

        // Check the original logout flag for backward compatibility
        const logoutFlag = await AsyncStorage.getItem('paybit-logout-flag');
        if (logoutFlag === 'true') {
          console.log('Legacy logout flag detected, preventing auto-login');
          await AsyncStorage.removeItem('paybit-logout-flag');
          await AsyncStorage.removeItem('paybit-storage');
          setIsLoading(false);
          return;
        }

        // No logout flags, check for a valid token
        const storageData = await AsyncStorage.getItem('paybit-storage');
        if (storageData) {
          try {
            const parsedData = JSON.parse(storageData);

            if (parsedData?.state?.user?.token) {
              // Restore the user data from storage
              if (parsedData.state.user) {
                setUser(parsedData.state.user);
                console.log('Found existing token, auto-logging in');
                router.replace('/(tabs)');
                return;
              }
            }
          } catch (error) {
            console.error('Error parsing storage data:', error);
          }
        }

        // No valid token found
        console.log('No valid token found, showing login screen');
        setIsLoading(false);
      } catch (error) {
        console.error('Error during auto-login check:', error);
        setIsLoading(false);
      }
    };

    checkExistingToken();
  }, [router, setUser]);

  const navigateToSignup = () => {
    router.push('/(auth)/signup');
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const fetchSignIn = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${apiEndpoint}/api/auth/login`, { email, password });
      let data = response.data.data;

      // Fetch Bitcoin price in parallel after successful login
      try {
        const priceResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur');

        setUser({
          userID: data.user.uid,
          userUID: data.user.id,
          userFullName: data.user.fullname,
          userProfileImage: data.user.profileImage,
          token: data.token,
          balance: data.user.balance || '0.00',
          btcToUsd: priceResponse.data.bitcoin.usd,
          btcToEur: priceResponse.data.bitcoin.eur,
          userEmail: email,
          tapRootAddress: data.user.tapRootAddress
        });
      } catch (priceError) {
        console.error('Error fetching Bitcoin price:', priceError);

        // Continue with login even if price fetch fails
        setUser({
          userID: data.user.uid,
          userUID: data.user.id,
          userFullName: data.user.fullname,
          userProfileImage: data.user.profileImage,
          token: data.token,
          balance: data.user.balance || '0.00',
          btcToUsd: 0,
          btcToEur: 0,
          userEmail: email,
          tapRootAddress: data.user.tapRootAddress
        });
      }

      console.log('Login successful, token saved');
      router.push('/(tabs)');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', 'Invalid email or password. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    let isValid = true;

    // Reset errors
    setEmailError("");
    setPasswordError("");

    // Validate email
    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email");
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    }

    if (isValid) {
      fetchSignIn();
    }
  };

  // Show loading screen while checking token
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logoLoading}
        />
        <ActivityIndicator size="large" color="#F7931A" style={styles.loadingIndicator} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo and Header */}
            <View style={styles.header}>
              <Image
                source={require("../../assets/images/icon.png")}
                style={styles.logo}
              />
              <Text style={styles.appName}>PayBit</Text>
              <Text style={styles.tagline}>Effortless Bitcoin Transactions</Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Welcome Back</Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#F7931A"
                  style={styles.inputIcon}
                />
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
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}

              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#F7931A"
                  style={styles.inputIcon}
                />
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
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#F7931A"
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => alert("Think Harder")}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSignIn}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#F7931A', '#000000']}
                  style={styles.loginButton}
                  start={{ x: 1, y: 0 }}
                  end={{ x: 0, y: 1 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
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
    backgroundColor: "#000000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  logoLoading: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "#AAAAAA",
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "#333333",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
  },
  eyeButton: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#F7931A",
    fontSize: 14,
  },
  loginButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#333333",
  },
  dividerText: {
    color: "#666666",
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: "#333333",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 36,
    left: 0,
    right: 0,
    backgroundColor: "#000000",
    paddingVertical: 10,
  },
  footerText: {
    color: "#AAAAAA",
    fontSize: 14,
  },
  signupText: {
    color: "#F7931A",
    fontSize: 14,
    fontWeight: "bold",
  },
  errorText: {
    color: "#FF5252",
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
});

export default LoginScreen;
