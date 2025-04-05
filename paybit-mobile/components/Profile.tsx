import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

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
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    // Close the modal
    if (onClose) {
      onClose();
    }
  };

  const handleChangePhoto = () => {
    Alert.alert("Change Profile Photo", "Choose an option", [
      { text: "Take Photo", onPress: () => console.log("Camera") },
      { text: "Choose from Gallery", onPress: () => console.log("Gallery") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleChangePassword = () => {
    Alert.alert(
      "Change Password",
      "Password change functionality will be implemented here",
    );
  };

  const handleNotificationSettings = () => {
    Alert.alert(
      "Notifications",
      "Notification settings will be implemented here",
    );
  };

  const handleSecuritySettings = () => {
    Alert.alert("Security", "Security settings will be implemented here");
  };

  const handleHelpSupport = () => {
    Alert.alert("Help & Support", "Help and support will be implemented here");
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: () => {
          // Navigate to login screen
          Alert.alert("Logout", "You have been logged out");
        },
        style: "destructive",
      },
    ]);
  };

  const ProfileOption = ({
    icon,
    title,
    subtitle,
    onPress,
    showBorder = true,
    tintColor = "#F7931A",
  }: ProfileOptionProps) => (
    <TouchableOpacity
      style={[styles.option, showBorder && styles.borderBottom]}
      onPress={onPress}
    >
      <View
        style={[styles.iconContainer, { backgroundColor: `${tintColor}20` }]}
      >
        <Ionicons name={icon} size={24} color={tintColor} />
      </View>
      <View style={styles.optionTextContainer}>
        <Text style={styles.optionTitle}>{title}</Text>
        {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.profileSection}>
            <View style={styles.avatarSection}>
              <LinearGradient
                colors={["#F7931A", "#E2761B"]}
                style={styles.profileImage}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>J</Text>
              </LinearGradient>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleChangePhoto}
              >
                <Ionicons name="camera" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>John Doe</Text>
            <Text style={styles.userEmail}>john.doe@example.com</Text>
          </View>

          <BlurView intensity={20} style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>Account Settings</Text>

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

          <BlurView intensity={20} style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>Security</Text>

            <ProfileOption
              icon="shield-checkmark"
              title="Security Settings"
              subtitle="Manage your security preferences"
              onPress={handleSecuritySettings}
              showBorder={false}
            />
          </BlurView>

          <BlurView intensity={20} style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>Support</Text>

            <ProfileOption
              icon="help-circle"
              title="Help & Support"
              onPress={handleHelpSupport}
              showBorder={false}
            />
          </BlurView>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  placeholder: {
    width: 40,
  },
  content: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 30,
  },
  avatarSection: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#F7931A",
  },
  avatarText: {
    fontSize: 60,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  editButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "#F7931A",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#121212",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#AAAAAA",
  },
  optionsSection: {
    backgroundColor: "rgba(26, 26, 26, 0.7)",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(51, 51, 51, 0.5)",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  optionSubtitle: {
    fontSize: 14,
    color: "#AAAAAA",
    marginTop: 2,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "rgba(255, 59, 48, 0.2)",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutText: {
    color: "#FF3B30",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default ProfileScreen;
