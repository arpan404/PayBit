import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

const ScanScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
      </View>

      <View style={styles.cameraContainer}>
        <View style={styles.camera}>
          <View style={styles.overlay}>
            <LinearGradient
              colors={["rgba(247, 147, 26, 0.4)", "rgba(247, 147, 26, 0.1)"]}
              style={styles.scanPlaceholder}
            >
              <Ionicons name="qr-code" size={80} color="#FFFFFF" />
              <Text style={styles.placeholderText}>Scanner Placeholder</Text>
            </LinearGradient>
          </View>
        </View>
      </View>

      <View
        style={[styles.bottomContainer, { paddingBottom: insets.bottom + 80 }]}
      >
        <BlurView
          intensity={20}
          tint="dark"
          style={styles.instructionsContainer}
        >
          <Text style={styles.instructionsText}>
            Scanner functionality coming soon
          </Text>
        </BlurView>

        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="flash-off" size={24} color="#FFFFFF" />
            <Text style={styles.controlText}>Flash Off</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  camera: {
    flex: 1,
    position: "relative",
    backgroundColor: "transparent",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  placeholderText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "bold",
  },
  bottomContainer: {
    alignItems: "center",
    paddingBottom: 30,
  },
  instructionsContainer: {
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 16,
    alignItems: "center",
    overflow: "hidden",
  },
  instructionsText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  controlsContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginHorizontal: 20,
    justifyContent: "space-around",
    width: "100%",
  },
  controlButton: {
    backgroundColor: "rgba(50, 50, 50, 0.8)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  controlText: {
    color: "#FFFFFF",
    fontWeight: "500",
    marginLeft: 8,
  },
  scanAgainButton: {
    backgroundColor: "rgba(247, 147, 26, 0.8)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  gradientButton: {
    flex: 1,
    padding: 12,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  scanAgainText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  middleContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  focusedContainer: {
    flex: 1,
    position: "relative",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  cornerTopLeft: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#F7931A",
    borderTopLeftRadius: 16,
  },
  cornerTopRight: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#F7931A",
    borderTopRightRadius: 16,
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: -2,
    left: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#F7931A",
    borderBottomLeftRadius: 16,
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#F7931A",
    borderBottomRightRadius: 16,
  },
});

export default ScanScreen;
