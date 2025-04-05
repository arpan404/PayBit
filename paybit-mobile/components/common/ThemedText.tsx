import React from "react";
import { Text, TextProps } from "react-native";
import { useColorScheme } from "react-native";

export const ThemedText = (props: TextProps) => {
  const colorScheme = useColorScheme();
  const textColor = colorScheme === "dark" ? "#FFFFFF" : "#000000";

  return <Text {...props} style={[{ color: textColor }, props.style]} />;
};
