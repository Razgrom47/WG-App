import React, { useContext, useEffect } from "react";
import {
  View,
  ActivityIndicator,
  ToastAndroid,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { TaskContext } from "../contexts/TaskContext";

/**
 * HOC to guard a screen: shows spinner while loading,
 * redirects & toasts/alerts if unauthenticated.
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
): React.FC<P> {
  const ComponentWithAuth: React.FC<P> = (props) => {
    const { user, loading } = useContext(TaskContext);
    const router = useRouter();

    // Check if user is authenticated
    useEffect(() => {
      if (!loading && !user) {
        const msg = "You must be signed in to access that page.";
        if (Platform.OS === "android") {
          ToastAndroid.show(msg, ToastAndroid.LONG);
        } else {
          Alert.alert("Authentication Required", msg);
        }
        router.replace("/signin");
      }
    }, [user, loading]);

    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    if (!user) {
      return null; // redirect in progress
    }

    // authenticated
    return <WrappedComponent {...props} />;
  };

  ComponentWithAuth.displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return ComponentWithAuth;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
