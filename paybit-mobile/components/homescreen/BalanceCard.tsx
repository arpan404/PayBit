import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface BalanceCardProps {
  balance: number;
  fiatValue: number;
  lastUpdated: string;
}

const BalanceCard = ({ balance, fiatValue, lastUpdated }: BalanceCardProps) => {
  return (
    <LinearGradient
      colors={["#F7931A", "#E2761B", "#000000"]}
      style={styles.balanceCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.balanceLabel}>Available Balance</Text>
      <Text style={styles.balanceAmount}>₿ {balance.toFixed(6)}</Text>
      <Text style={styles.balanceSubtext}>
        ≈ ${fiatValue.toFixed(2)} • Last updated {lastUpdated}
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  balanceCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    elevation: 8,
    shadowColor: "#F7931A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  balanceLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 8,
    opacity: 0.9,
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 4,
  },
  balanceSubtext: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.8,
  },
});

export default BalanceCard;
