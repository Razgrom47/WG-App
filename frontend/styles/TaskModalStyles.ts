/**
 * @file TaskModalStyles.ts
 *
 * This file contains the styles for the TaskAddModal component,
 * defining the layout and appearance of the modal used to add tasks.
 */
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  title: {
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    marginLeft: 8,
  },
  label: {
    marginBottom: 8,
    fontWeight: "600",
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  colorButton: {
    marginRight: 6,
    marginBottom: 6,
    width: 38,
    height: 38,
  },
  datePickerContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
});
