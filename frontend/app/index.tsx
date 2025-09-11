import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { Redirect } from "expo-router";

// Import custom styles for the splash screen
import { styles } from "../styles/IndexStyles";

/**
 * Splash screen component for the app, displayed for 3 seconds before redirecting to the home screen.
 */
export default function Index() {
  const [redirect, setRedirect] = useState(false);

  // Shared values for animations (only controlling opacity)
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);

  // Animate the title and subtitle fade-in on mount
  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 1000 });
    subtitleOpacity.value = withDelay(500, withTiming(1, { duration: 1000 }));
  }, []);

  // Animated style for title
  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  // Animated style for subtitle
  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  // Set a timer to redirect to home after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setRedirect(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Navigate to home screen when redirect state is true
  if (redirect) {
    return <Redirect href="/(tabs)/home" />;
  }

  // Render the splash screen with title and subtitle of the app
  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.title, titleAnimatedStyle]}>
        WG-App
      </Animated.Text>
      <Animated.Text style={[styles.subtitle, subtitleAnimatedStyle]}>
        Stay Organized, Stay Ahead 🚀
      </Animated.Text>
    </View>
  );
}
