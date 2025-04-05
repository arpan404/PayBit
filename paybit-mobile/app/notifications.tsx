import React, { useState } from "react";
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
import { useRouter } from "expo-router";

const NotificationsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    transactionAlerts: true,
    priceAlerts: false,
    marketingEmails: false,
  });

  const handleBackPress = () => {
    router.back();
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const NotificationOption = ({
    icon,
    title,
    subtitle,
    value,
    onToggle,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <View style={styles.option}>
      <View style={styles.optionContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color="#F7931A" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.optionTitle}>{title}</Text>
          {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#767577", true: "#F7931A" }}
        thumbColor={value ? "#FFFFFF" : "#f4f3f4"}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
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
          <BlurView intensity={20} style={styles.section}>
            <Text style={styles.sectionTitle}>Push Notifications</Text>
            <NotificationOption
              icon="notifications"
              title="Push Notifications"
              subtitle="Receive push notifications for important updates"
              value={settings.pushNotifications}
              onToggle={() => toggleSetting("pushNotifications")}
            />
            <NotificationOption
              icon="mail"
              title="Email Notifications"
              subtitle="Receive email notifications"
              value={settings.emailNotifications}
              onToggle={() => toggleSetting("emailNotifications")}
            />
          </BlurView>

          <BlurView intensity={20} style={styles.section}>
            <Text style={styles.sectionTitle}>Alerts</Text>
            <NotificationOption
              icon="cash"
              title="Transaction Alerts"
              subtitle="Get notified about your transactions"
              value={settings.transactionAlerts}
              onToggle={() => toggleSetting("transactionAlerts")}
            />
            <NotificationOption
              icon="trending-up"
              title="Price Alerts"
              subtitle="Get notified about price changes"
              value={settings.priceAlerts}
              onToggle={() => toggleSetting("priceAlerts")}
            />
          </BlurView>

          <BlurView intensity={20} style={styles.section}>
            <Text style={styles.sectionTitle}>Marketing</Text>
            <NotificationOption
              icon="megaphone"
              title="Marketing Emails"
              subtitle="Receive marketing and promotional emails"
              value={settings.marketingEmails}
              onToggle={() => toggleSetting("marketingEmails")}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: "#121212",
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
    textAlign: "center",
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
  section: {
    backgroundColor: "rgba(26, 26, 26, 0.7)",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: "hidden",
    width: "100%",
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
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(247, 147, 26, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
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
  },
});

export default NotificationsScreen;
