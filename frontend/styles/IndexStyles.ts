/**
 * @file IndexStyles.ts
 *
 * This file contains the styles for the Index component,
 * defining the layout and appearance of the loading screen.
 */
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    fontFamily: "Roboto-Bold",
  },
  subtitle: {
    fontSize: 18,
    marginTop: 10,
    fontFamily: "Roboto-Regular",
  },
});
