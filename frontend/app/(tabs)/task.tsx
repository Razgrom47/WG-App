import React, { useContext, useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { TaskContext } from "../../contexts/TaskContext";
import { TaskListContext } from "../../contexts/TaskListContext";
import { Button, TextInput } from "react-native-paper";

export default function TaskScreen() {
  const { selectedTaskList } = useContext(TaskListContext);
  const { tasks, fetchTasks, addTask, deleteTask, toggleTask } = useContext(TaskContext);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => { fetchTasks(); }, [selectedTaskList]);

  if (!selectedTaskList) return <Text>Select a Task List first</Text>;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>Tasks for {selectedTaskList.title}</Text>
      <FlatList
        data={tasks}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 12, marginVertical: 6, backgroundColor: "#fff", borderRadius: 8 }}>
            <Text style={{ fontSize: 18 }}>{item.title}</Text>
            <Text>{item.description}</Text>
            <Button onPress={() => toggleTask(item.id)} compact>
              {item.isDone ? "Mark Undone" : "Mark Done"}
            </Button>
            <Button onPress={() => deleteTask(item.id)} compact>Delete</Button>
          </View>
        )}
      />
      <TextInput
        label="Title"
        value={title}
        onChangeText={setTitle}
        style={{ marginVertical: 8 }}
      />
      <TextInput
        label="Description"
        value={desc}
        onChangeText={setDesc}
        style={{ marginVertical: 8 }}
      />
      <TextInput
        label="Due Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
        style={{ marginVertical: 8 }}
      />
      <Button mode="contained" onPress={() => { addTask(title, desc, new Date(date), null, []); setTitle(""); setDesc(""); setDate(""); }}>
        Add Task
      </Button>
    </View>
  );
}