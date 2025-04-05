import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useCurrency } from "../../context/CurrencyContext";
import { useStore, selectUser } from "../../services/store";

interface BalanceCardProps {
    lastUpdated: string;
}

const { width } = Dimensions.get("window");

const BalanceCard = ({ lastUpdated }: BalanceCardProps) => {
    const { selectedCurrency } = useCurrency();
    const [currentSlide, setCurrentSlide] = useState(0);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const user = useStore(selectUser);

    const handleSlide = () => {
        const nextSlide = (currentSlide + 1) % 2;
        Animated.timing(slideAnim, {
            toValue: nextSlide,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setCurrentSlide(nextSlide);
        });
    };

    return (
        <TouchableOpacity onPress={handleSlide} activeOpacity={0.9}>
            <BlurView intensity={20} style={styles.container}>
                <LinearGradient
                    colors={["#F7931A", "#000000"]}
                    style={styles.gradient}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 1 }}
                >
                    <Animated.View
                        style={[
                            styles.slideContainer,
                            {
                                transform: [
                                    {
                                        translateX: slideAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, -width + 32],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <View style={styles.slide}>
                            <View style={styles.slideContent}>
                                <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
                                <View style={styles.balanceRow}>
                                    <Text style={styles.balanceValue}>{parseFloat(user.balance).toFixed(8)}</Text>
                                    <Text style={styles.currencyLabel}>BTC</Text>
                                </View>
                                <View style={styles.fiatRow}>
                                    <Text style={styles.fiatValue}>
                                        {selectedCurrency.symbol}{(parseFloat(user.balance) * user.btcToUsd).toFixed(2)}
                                    </Text>
                                    <Text style={styles.currencyLabel}>{selectedCurrency.code}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.slide}>
                            <View style={styles.slideContent}>
                                <Text style={styles.balanceLabel}>EXCHANGE RATES</Text>
                                <View style={styles.rateContainer}>
                                    <View style={styles.rateRow}>
                                        <Text style={styles.rateLabel}>BTC/USD</Text>
                                        <Text style={styles.rateValue}>
                                            ${user.btcToUsd.toFixed(2)}
                                        </Text>
                                    </View>
                                    <View style={styles.rateRow}>
                                        <Text style={styles.rateLabel}>BTC/EUR</Text>
                                        <Text style={styles.rateValue}>
                                            €{user.btcToEur.toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                    <View style={styles.indicatorContainer}>
                        {[0, 1].map((index) => (
                            <View
                                key={index}
                                style={[
                                    styles.indicator,
                                    index === currentSlide && styles.activeIndicator,
                                ]}
                            />
                        ))}
                    </View>
                </LinearGradient>
                <Text style={styles.lastUpdated}>Last updated: {lastUpdated}</Text>
            </BlurView>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginBottom: 24,
        borderRadius: 16,
        overflow: "hidden",
    },
    gradient: {
        padding: 20,
        borderRadius: 16,
    },
    slideContainer: {
        flexDirection: "row",
        width: width * 2 - 32,
    },
    slide: {
        width: width - 32,
        alignItems: "flex-start",
    },
    slideContent: {
        width: "100%",
        paddingHorizontal: 8,
    },
    balanceLabel: {
        fontSize: 12,
        color: "#FFFFFF",
        opacity: 0.8,
        marginBottom: 16,
        letterSpacing: 1.5,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    balanceRow: {
        flexDirection: "row",
        alignItems: "baseline",
        marginBottom: 12,
    },
    balanceValue: {
        fontSize: 40,
        fontWeight: "700",
        color: "#FFFFFF",
        marginRight: 8,
        letterSpacing: 0.5,
    },
    currencyLabel: {
        fontSize: 20,
        color: "#FFFFFF",
        opacity: 0.9,
        fontWeight: "600",
    },
    fiatRow: {
        flexDirection: "row",
        alignItems: "baseline",
    },
    fiatValue: {
        fontSize: 28,
        fontWeight: "700",
        color: "#FFFFFF",
        marginRight: 8,
        letterSpacing: 0.5,
    },
    rateContainer: {
        width: "100%",
        marginTop: 12,
    },
    rateRow: {
        flexWrap: 'wrap',
        marginRight: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    rateLabel: {
        flex: 1,
        fontSize: 16,
        color: "#FFFFFF",
        opacity: 0.8,
        fontWeight: "600",
    },
    rateValue: {
        flex: 1,
        fontSize: 22,
        fontWeight: "700",
        color: "#FFFFFF",
        letterSpacing: 0.5,
    },
    indicatorContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 20,
    },
    indicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        marginHorizontal: 3,
    },
    activeIndicator: {
        backgroundColor: "#FFFFFF",
    },
    lastUpdated: {
        fontSize: 12,
        color: "#FFFFFF",
        opacity: 0.6,
        textAlign: "center",
        marginTop: 8,
    },
});

export default BalanceCard;