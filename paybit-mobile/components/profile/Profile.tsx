import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useStore } from '@/services/store';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

interface ProfileOptionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showBorder?: boolean;
  tintColor?: string;
}

interface ProfileScreenProps {
  onClose?: () => void;
}

const ProfileScreen = ({ onClose }: ProfileScreenProps = {}) => {
  const userData = useStore((state) => state.user);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode } = useTheme();

  const handleBackPress = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        // Handle the selected image
        // Add your image upload logic here
        console.log('Selected image:', result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleChooseFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant gallery permissions to select photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        // Handle the selected image
        // Add your image upload logic here
        console.log('Selected image:', result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      "Change Profile Photo",
      "Choose an option",
      [
        { text: "Take Photo", onPress: handleTakePhoto },
        { text: "Choose from Gallery", onPress: handleChooseFromGallery },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleChangePassword = () => {
    onClose?.();
    router.push('/change-password');
  };

  const handleNotificationSettings = () => {
    onClose?.();
    router.push('/notifications');
  };

  const handleSecuritySettings = () => {
    onClose?.();
    router.push('/security');
  };

  const handleHelpSupport = () => {
    onClose?.();
    router.push('/help-support');
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          onPress: () => {
            router.replace('/(auth)/login');
          },
          style: "destructive"
        }
      ]
    );
  };

  const ProfileOption = ({
    icon,
    title,
    subtitle,
    onPress,
    showBorder = true,
    tintColor = colors.primary
  }: ProfileOptionProps) => (
    <TouchableOpacity
      style={[styles.option, showBorder && { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${tintColor}20` }]}>
        <Ionicons name={icon} size={24} color={tintColor} />
      </View>
      <View style={styles.optionTextContainer}>
        <Text style={[styles.optionTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>{subtitle}</Text>}
      </View>
      <View style={styles.rightContainer}>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatarSection}>
              {userData.userProfileImage ? (
                <Image
                  source={{ uri: userData.userProfileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImage}>
                  <Text style={styles.initialsText}>
                    {userData.userFullName?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={[styles.editButton, { backgroundColor: colors.primary }]} onPress={handleChangePhoto}>
                <Ionicons name="camera" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.userName, { color: colors.text }]}>{userData.userFullName}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{userData.userEmail}</Text>
          </View>

          <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} style={[styles.optionsSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Settings</Text>

            <ProfileOption
              icon="camera"
              title="Change Profile Photo"
              onPress={handleChangePhoto}
            />

            <ProfileOption
              icon="key"
              title="Change Password"
              onPress={handleChangePassword}
            />

            <ProfileOption
              icon="notifications"
              title="Notifications"
              subtitle="Manage your notification preferences"
              onPress={handleNotificationSettings}
              showBorder={false}
            />
          </BlurView>

          <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} style={[styles.optionsSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>

            <ProfileOption
              icon="shield-checkmark"
              title="Security Settings"
              subtitle="Manage your security preferences"
              onPress={handleSecuritySettings}
              showBorder={false}
            />
          </BlurView>

          <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} style={[styles.optionsSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>

            <ProfileOption
              icon="help-circle"
              title="Help & Support"
              onPress={handleHelpSupport}
              showBorder={false}
            />
          </BlurView>

          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: `${colors.error}20` }]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F7931A',
  },
  initialsText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#121212',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  optionsSection: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    width: 'auto',
    alignSelf: 'stretch',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    borderBottomWidth: 1,
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  rightContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ProfileScreen;
