import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

interface Transaction {
  id: string;
  type: "sent" | "received";
  amount: number;
  bitcoinAmount: number;
  name: string;
  date: string;
  status: "completed" | "pending" | "failed";
}

const TransactionsScreen = () => {
  const [activeFilter, setActiveFilter] = useState<"all" | "sent" | "received">(
    "all",
  );

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      type: "received",
      amount: 245.5,
      bitcoinAmount: 0.0048,
      name: "James Wilson",
      date: "2023-08-15",
      status: "completed",
    },
    {
      id: "2",
      type: "sent",
      amount: 120.75,
      bitcoinAmount: 0.0025,
      name: "Sarah Johnson",
      date: "2023-08-14",
      status: "completed",
    },
    {
      id: "3",
      type: "received",
      amount: 500.0,
      bitcoinAmount: 0.0102,
      name: "Michael Brown",
      date: "2023-08-12",
      status: "completed",
    },
    {
      id: "4",
      type: "sent",
      amount: 42.3,
      bitcoinAmount: 0.0008,
      name: "Coffee Shop",
      date: "2023-08-10",
      status: "completed",
    },
    {
      id: "5",
      type: "sent",
      amount: 350.0,
      bitcoinAmount: 0.0072,
      name: "Rent Payment",
      date: "2023-08-05",
      status: "pending",
    },
    {
      id: "6",
      type: "received",
      amount: 180.25,
      bitcoinAmount: 0.0037,
      name: "Refund",
      date: "2023-08-02",
      status: "completed",
    },
    {
      id: "7",
      type: "sent",
      amount: 75.0,
      bitcoinAmount: 0.0015,
      name: "Utility Bill",
      date: "2023-07-28",
      status: "failed",
    },
  ]);

  const filteredTransactions = transactions.filter((transaction) => {
    if (activeFilter === "all") return true;
    return transaction.type === activeFilter;
  });

  const handleTransactionPress = (transaction: Transaction) => {
    Alert.alert(
      "Transaction Details",
      `${transaction.type === "sent" ? "Sent to" : "Received from"}: ${transaction.name}\nAmount: $${transaction.amount.toFixed(2)} (${transaction.bitcoinAmount} BTC)\nDate: ${transaction.date}\nStatus: ${transaction.status}`,
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => handleTransactionPress(item)}
      >
        <BlurView intensity={20} style={styles.transactionItemContent}>
          <View style={styles.transactionIcon}>
            <LinearGradient
              colors={
                item.type === "sent"
                  ? ["#FF6B6B", "#FF5252"]
                  : ["#4CAF50", "#45A049"]
              }
              style={styles.transactionIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons
                name={
                  item.type === "sent"
                    ? "arrow-up-outline"
                    : "arrow-down-outline"
                }
                size={20}
                color="#fff"
              />
            </LinearGradient>
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionName}>{item.name}</Text>
            <View style={styles.transactionMeta}>
              <Text style={styles.transactionDate}>{item.date}</Text>
              {item.status !== "completed" && (
                <View
                  style={[
                    styles.statusBadge,
                    item.status === "pending"
                      ? styles.pendingBadge
                      : styles.failedBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.status === "pending"
                        ? styles.pendingText
                        : styles.failedText,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.transactionAmount}>
            <Text
              style={[
                styles.amountText,
                { color: item.type === "sent" ? "#FF5252" : "#4CAF50" },
              ]}
            >
              {item.type === "sent" ? "-" : "+"}${item.amount.toFixed(2)}
            </Text>
            <Text style={styles.bitcoinText}>
              {item.type === "sent" ? "-" : "+"}
              {item.bitcoinAmount} BTC
            </Text>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === "all" && styles.activeFilterTab,
          ]}
          onPress={() => setActiveFilter("all")}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === "all" && styles.activeFilterText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === "sent" && styles.activeFilterTab,
          ]}
          onPress={() => setActiveFilter("sent")}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === "sent" && styles.activeFilterText,
            ]}
          >
            Sent
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === "received" && styles.activeFilterTab,
          ]}
          onPress={() => setActiveFilter("received")}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === "received" && styles.activeFilterText,
            ]}
          >
            Received
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.transactionsList}
      />
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  filterTabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: "rgba(247, 147, 26, 0.15)",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#AAAAAA",
  },
  activeFilterText: {
    color: "#F7931A",
  },
  transactionsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  transactionItem: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  transactionItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
    color: "#FFFFFF",
  },
  transactionMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionDate: {
    fontSize: 12,
    opacity: 0.7,
    marginRight: 8,
    color: "#FFFFFF",
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingBadge: {
    backgroundColor: "#FFF3E0",
  },
  failedBadge: {
    backgroundColor: "#FFEBEE",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
  },
  pendingText: {
    color: "#FF9800",
  },
  failedText: {
    color: "#F44336",
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  bitcoinText: {
    fontSize: 12,
    color: "#AAAAAA",
  },
});

export default TransactionsScreen;
