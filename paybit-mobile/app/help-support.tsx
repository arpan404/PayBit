import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";

const HelpSupportScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    router.back();
  };

  const handleContactSupport = () => {
    Linking.openURL("mailto:support@paybit.com");
  };

  const handleFAQ = () => {
    // Navigate to FAQ page or open FAQ modal
    Alert.alert("Coming Soon", "FAQ section will be available soon");
  };

  const handleTerms = () => {
    // Navigate to Terms page or open Terms modal
    Alert.alert("Coming Soon", "Terms and Conditions will be available soon");
  };

  const handlePrivacy = () => {
    // Navigate to Privacy page or open Privacy modal
    Alert.alert("Coming Soon", "Privacy Policy will be available soon");
  };

  const SupportOption = ({
    icon,
    title,
    subtitle,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.option} onPress={onPress}>
      <View style={styles.optionContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color="#F7931A" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.optionTitle}>{title}</Text>
          {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
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
            <Text style={styles.sectionTitle}>Support</Text>
            <SupportOption
              icon="mail"
              title="Contact Support"
              subtitle="Get in touch with our support team"
              onPress={handleContactSupport}
            />
            <SupportOption
              icon="help-circle"
              title="FAQ"
              subtitle="Frequently asked questions"
              onPress={handleFAQ}
            />
          </BlurView>

          <BlurView intensity={20} style={styles.section}>
            <Text style={styles.sectionTitle}>Legal</Text>
            <SupportOption
              icon="document-text"
              title="Terms of Service"
              subtitle="Read our terms and conditions"
              onPress={handleTerms}
            />
            <SupportOption
              icon="shield"
              title="Privacy Policy"
              subtitle="Learn about our privacy practices"
              onPress={handlePrivacy}
            />
          </BlurView>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
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
  versionContainer: {
    alignItems: "center",
    marginTop: 24,
  },
  versionText: {
    fontSize: 14,
    color: "#666666",
  },
});

export default HelpSupportScreen;
