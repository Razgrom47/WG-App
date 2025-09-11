import React, { useState } from "react";
import {
  View,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  Animated,
  Easing,
} from "react-native";
import {
  Modal,
  Portal,
  Text,
  TextInput,
  Button,
  useTheme,
} from "react-native-paper";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

// Import styles
import { styles } from "../styles/TaskModalStyles";

/**
 * Props for the TaskAddModal component.
 */
interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (text: string, color: string, dueDate: string) => void;
}

// Predefined colors for the user to choose from (though they can also enter a custom hex code)
const PRESET_COLORS = [
  "#ffffff", // white
  "#ffe4b5", // moccasin
  "#ffd700", // gold
  "#ff69b4", // hot pink
  "#b0e0e6", // powder blue
  "#90ee90", // light green
  "#cccccc", // light gray
  "#ffcccb", // light red
  "#8a2be2", // blue violet
  "#00ced1", // dark turquoise
  "#ff4500", // orange red
  "#32cd32", // lime green
];

/**
 * ContentWrapper component conditionally wraps children in TouchableWithoutFeedback on mobile,
 * or a plain View on web. This is to dismiss the keyboard when tapping outside of an input field.
 */
const ContentWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  if (Platform.OS === "web") {
    return <View>{children}</View>;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {children}
    </TouchableWithoutFeedback>
  );
};

/**
 * TaskAddModal component is a modal that allows the user to add a new task.
 *
 * @param visible - Whether the modal is visible.
 * @param onClose - Function to close the modal.
 * @param onAdd - Function to add a new task.
 */
export default function TaskAddModal({ visible, onClose, onAdd }: Props) {
  const { colors } = useTheme();
  const [text, setText] = useState("");
  // Store a full Date (date and time) so that the user can set both
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [customColor, setCustomColor] = useState("");

  /**
   * Handles adding a new task to the list of tasks.
   */
  const handleAddTask = () => {
    if (!text.trim()) return;
    let finalColor = color;

    // Check if the user entered a valid custom hex color
    if (customColor.trim().length >= 3 && customColor.startsWith("#")) {
      finalColor = customColor;
    }

    // Pass the full ISO string including time
    const dueString = date.toISOString();
    onAdd(text.trim(), finalColor, dueString);

    // Reset the form
    setText("");
    setCustomColor("");
    setColor("#ffffff");
    setDate(new Date());
    handleClose();
  };

  /**
   * Opens the date picker modal.
   */
  const openDatePicker = () => {
    if (showTimePicker) {
      setShowTimePicker(false);
      setTimeout(() => setShowDatePicker(true), 200);
    } else {
      setShowDatePicker(true);
    }
  };

  /**
   * Opens the time picker modal.
   */
  const openTimePicker = () => {
    if (showDatePicker) {
      setShowDatePicker(false);
      setTimeout(() => setShowTimePicker(true), 200);
    } else {
      setShowTimePicker(true);
    }
  };

  /**
   * Closes the modal.
   */
  const handleClose = () => {
    setShowDatePicker(false);
    setShowTimePicker(false);
    onClose();
  };

  /**
   * Handles the date change event from the date picker.
   *
   * @param event - The event that triggered the change.
   * @param selectedDate - The selected date.
   */
  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false); // Android doesn't close the date picker automatically
    if (selectedDate) {
      // Update only the date part, preserving the existing time
      const current = new Date(date);
      current.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
      );
      setDate(current);
    }
  };

  /**
   * Handles the time change event from the time picker.
   *
   * @param event - The event that triggered the change.
   * @param selectedTime - The selected time.
   */
  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === "android") setShowTimePicker(false); // Android doesn't close the time picker automatically
    if (selectedTime) {
      // Update only the time part, preserving the existing date
      const current = new Date(date);
      current.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setDate(current);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleClose}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.surface },
        ]}
      >
        <ContentWrapper>
          <View>
            <Text
              variant="titleLarge"
              style={[styles.title, { color: colors.onBackground }]}
            >
              Add a New Task
            </Text>

            <TextInput
              label="Task Description"
              value={text}
              onChangeText={setText}
              style={[styles.input]}
              mode="outlined"
              placeholderTextColor={colors.onBackground}
              theme={{ colors: { onSurfaceVariant: colors.onBackground } }}
            />

            {/* DATE PICKER BUTTON */}
            <Button
              mode="outlined"
              style={[styles.input, { alignSelf: "stretch" }]}
              onPress={openDatePicker}
              textColor={colors.onBackground}
            >
              Due Date: {date.toLocaleDateString()}
            </Button>
            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onDateChange}
                  textColor={colors.onBackground}
                />
              </View>
            )}

            {/* TIME PICKER BUTTON */}
            <Button
              mode="outlined"
              style={[styles.input, { alignSelf: "stretch" }]}
              onPress={openTimePicker}
              textColor={colors.onBackground}
            >
              Due Time:{" "}
              {date.getHours() !== 0 || date.getMinutes() !== 0
                ? date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Not Set"}
            </Button>
            {showTimePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={date}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onTimeChange}
                  textColor={colors.onBackground}
                />
              </View>
            )}

            <Text style={[styles.label, { color: colors.onBackground }]}>
              Pick a Color
            </Text>
            <View style={styles.colorRow}>
              {PRESET_COLORS.map((c) => (
                <Button
                  key={c}
                  mode={color === c ? "contained" : "outlined"}
                  onPress={() => {
                    setColor(c);
                    setCustomColor("");
                  }}
                  style={[styles.colorButton, { backgroundColor: c }]}
                  labelStyle={{ color: "#000" }}
                >
                  {color === c ? "✓" : ""}
                </Button>
              ))}
            </View>
            <TextInput
              label="Or custom hex (#ffffff)"
              value={customColor}
              onChangeText={setCustomColor}
              style={styles.input}
              mode="outlined"
              placeholderTextColor={colors.onBackground}
              theme={{ colors: { onSurfaceVariant: colors.onBackground } }}
            />

            <View style={styles.row}>
              <Button onPress={handleClose} style={styles.button}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleAddTask}
                style={styles.button}
              >
                Add
              </Button>
            </View>
          </View>
        </ContentWrapper>
      </Modal>
    </Portal>
  );
}
