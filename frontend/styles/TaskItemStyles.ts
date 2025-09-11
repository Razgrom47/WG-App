/**
 * @file TaskItemStyles.ts
 *
 * This file contains the styles for the TaskItem component,
 * defining the layout and appearance of a single task item.
 */
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 8,
    marginVertical: 6,
    padding: 8,
    alignItems: "center",
    zIndex: 1000,
  },
  dragHandle: {
    marginRight: 6,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  taskArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  textArea: {
    flex: 1,
    marginLeft: 4,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    flexWrap: "wrap",
    flexShrink: 1,
  },
  dueDate: {
    fontSize: 12,
    opacity: 0.7,
  },
});
