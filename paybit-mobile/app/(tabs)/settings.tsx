import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [darkMode, setDarkMode] = React.useState(true);
  const [biometricAuth, setBiometricAuth] = React.useState(false);
  const [pushNotifications, setPushNotifications] = React.useState(true);

  const handleLanguage = () => {
    // TODO: Implement language selection
  };

  const handleCurrency = () => {
    // TODO: Implement currency selection
  };

  const handleAppearance = () => {
    // TODO: Implement appearance settings
  };

  const handlePrivacy = () => {
    // TODO: Implement privacy settings
  };

  const handleAbout = () => {
    // TODO: Implement about screen
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value);
    // TODO: Implement dark mode persistence
  };

  const handlePushNotificationsToggle = (value: boolean) => {
    setPushNotifications(value);
    // TODO: Implement push notifications persistence
  };

  const handleBiometricAuthToggle = (value: boolean) => {
    setBiometricAuth(value);
    // TODO: Implement biometric auth persistence
  };

  const SettingsOption = ({
    icon,
    title,
    subtitle,
    onPress,
    showBorder = true,
    tintColor = "#F7931A",
    showSwitch = false,
    switchValue = false,
    onSwitchChange = () => {},
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showBorder?: boolean;
    tintColor?: string;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
  }) => (
    <View style={[styles.option, showBorder && styles.borderBottom]}>
      <TouchableOpacity style={styles.optionContent} onPress={onPress}>
        <View
          style={[styles.iconContainer, { backgroundColor: `${tintColor}20` }]}
        >
          <Ionicons name={icon} size={24} color={tintColor} />
        </View>
        <View style={styles.optionTextContainer}>
          <Text style={styles.optionTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.optionSubtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.rightContainer}>
        {showSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: "#767577", true: "#F7931A" }}
            thumbColor={switchValue ? "#FFFFFF" : "#f4f3f4"}
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 30 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <BlurView intensity={20} style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>Preferences</Text>

            <SettingsOption
              icon="language"
              title="Language"
              subtitle="Select your preferred language"
              onPress={handleLanguage}
            />

            <SettingsOption
              icon="cash"
              title="Currency"
              subtitle="Set your default currency"
              onPress={handleCurrency}
            />

            <SettingsOption
              icon="moon"
              title="Dark Mode"
              showSwitch={true}
              switchValue={darkMode}
              onSwitchChange={handleDarkModeToggle}
              onPress={() => {}}
            />

            <SettingsOption
              icon="notifications"
              title="Push Notifications"
              showSwitch={true}
              switchValue={pushNotifications}
              onSwitchChange={handlePushNotificationsToggle}
              showBorder={false}
              onPress={() => {}}
            />
          </BlurView>

          <BlurView intensity={20} style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>Security</Text>

            <SettingsOption
              icon="finger-print"
              title="Biometric Authentication"
              subtitle="Use fingerprint or face ID"
              showSwitch={true}
              switchValue={biometricAuth}
              onSwitchChange={handleBiometricAuthToggle}
              showBorder={false}
              onPress={() => {}}
            />
          </BlurView>

          <BlurView intensity={20} style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>About</Text>

            <SettingsOption
              icon="shield-checkmark"
              title="Privacy Policy"
              onPress={handlePrivacy}
            />

            <SettingsOption
              icon="information-circle"
              title="About PayBit"
              onPress={handleAbout}
              showBorder={false}
            />
          </BlurView>
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: "#121212",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  optionsSection: {
    backgroundColor: "rgba(26, 26, 26, 0.7)",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: "hidden",
    width: "auto",
    alignSelf: "stretch",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    width: "100%",
  },
  optionContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  rightContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: "#AAAAAA",
    lineHeight: 18,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
});

export default SettingsScreen;
