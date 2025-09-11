import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Platform,
  TouchableOpacity,
} from "react-native";
import { IconButton } from "react-native-paper";
import Animated, {
  Layout,
  FadeInDown,
  FadeOutUp,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

// Import custom styles, TaskEditModal component, and utility functions
import TaskEditModal from "./TaskEditModal";
import { getContrastTextColor } from "../constants/Colors";
import { Task } from "../types/types";
import { styles } from "../styles/TaskItemStyles";

/**
 * Props for the TaskItem component.
 */
interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (
    id: number,
    newText: string,
    newColor: string,
    newDueDate: Date,
  ) => void;
  drag?: () => void;
}

/**
 * TaskItem component displays a single task item with options to toggle completion,
 * delete, and edit the task.
 */
export default function TaskItem({
  task,
  onToggleComplete,
  onDelete,
  onEdit,
  drag,
}: TaskItemProps) {
  const [hovered, setHovered] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const textColor = getContrastTextColor(task.color);

  const containerStyle = [
    styles.container,
    {
      backgroundColor: task.color,
      opacity: hovered ? 0.9 : 1,
      borderWidth: task.completed ? 2 : 0,
      borderColor: task.completed ? "#2ecc71" : "transparent",
    },
  ];

  // Calculate if there's a meaningful time component (non-midnight)
  // By default, the time is set to 08:00 PM of the due date (if not provided)
  // Or the current time if the user is creating a new task
  const dueDate = task.dueDate;
  const hours = dueDate.getHours();
  const minutes = dueDate.getMinutes();
  const hasTime = hours !== 0 || minutes !== 0;

  // Format time (2-digit hour and minute) for better readability
  const formattedTime = dueDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <Animated.View
        entering={FadeInDown}
        exiting={FadeOutUp}
        layout={Layout}
        style={containerStyle}
      >
        <TouchableOpacity
          onLongPress={drag}
          style={styles.dragHandle}
          activeOpacity={0.6}
        >
          <Ionicons name="menu" size={20} color="#999" />
        </TouchableOpacity>

        <Pressable
          style={styles.taskArea}
          onHoverIn={() => Platform.OS === "web" && setHovered(true)}
          onHoverOut={() => Platform.OS === "web" && setHovered(false)}
        >
          <IconButton
            icon={
              task.completed ? "check-circle" : "checkbox-blank-circle-outline"
            }
            onPress={() => onToggleComplete(task.id)}
            iconColor={task.completed ? "#2ecc71" : "#333"}
            size={26}
          />

          <View style={styles.textArea}>
            <Text
              style={[
                styles.title,
                task.completed && {
                  textDecorationLine: "line-through",
                  opacity: 0.6,
                },
                { color: textColor },
              ]}
            >
              {task.text}
            </Text>
            <Text style={[styles.dueDate, { color: textColor }]}>
              Due: {dueDate.toLocaleDateString()}
              {hasTime ? ` at ${formattedTime}` : ""}
            </Text>
          </View>
        </Pressable>

        {/* Edit icon */}
        <IconButton
          icon="pencil"
          onPress={() => setEditModalVisible(true)}
          iconColor="#3498db"
        />

        {/* Delete icon */}
        <IconButton
          icon="delete"
          onPress={() => onDelete(task.id)}
          iconColor="#e74c3c"
        />
      </Animated.View>

      {/* Edit Modal */}
      {editModalVisible && (
        <TaskEditModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          task={task}
          onEdit={(newText, newColor, newDueDate) => {
            onEdit(task.id, newText, newColor, newDueDate);
            setEditModalVisible(false);
          }}
        />
      )}
    </>
  );
}
