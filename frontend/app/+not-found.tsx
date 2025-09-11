import React from "react";
import { View, Text } from "react-native";
import { Link } from "expo-router";

// Import custom styles for the NotFound component
import { styles } from "../styles/NotFoundStyles";

/**
 * Simple 404 Not Found component for handling non-existent routes.
 */
export default function NotFound() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>404 - Not Found</Text>
      <Text style={styles.subtext}>This route does not exist.</Text>
      <Link href="/(tabs)/home" style={styles.link}>
        Go to Home
      </Link>
    </View>
  );
}
