import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface HeaderProps {
  userName: string;
  userImage?: string;
  onProfilePress: () => void;
}

const Header = ({ userName, userImage, onProfilePress }: HeaderProps) => {
  const firstName = userName.split(" ")[0];
  return (
    <View style={styles.headerContainer}>
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Welcome,</Text>
        <Text style={styles.nameText}>{firstName}</Text>
      </View>

      <TouchableOpacity onPress={onProfilePress} style={styles.avatarContainer}>
        {userImage ? (
          <Image source={{ uri: userImage }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    color: "#FFFFFF",
    fontSize: 16,
    opacity: 0.8,
  },
  nameText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#F7931A",
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F7931A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2761B",
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default Header;
