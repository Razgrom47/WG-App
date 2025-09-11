import React, { useContext, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { TaskListContext } from "../../contexts/TaskListContext";
import { Button, TextInput } from "react-native-paper";
import { useRouter } from "expo-router";

export default function TaskListScreen() {
  const { taskLists, fetchTaskLists, createTaskList, deleteTaskList, selectTaskList, selectedTaskList } = useContext(TaskListContext);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const router = useRouter();

  useEffect(() => { fetchTaskLists(); }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>Task Lists</Text>
      <FlatList
        data={taskLists}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              selectTaskList(item);
              router.push("/tasks");
            }}
            style={{
              padding: 12,
              marginVertical: 6,
              backgroundColor: selectedTaskList?.id === item.id ? "#eee" : "#fff",
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 18 }}>{item.title}</Text>
            <Button onPress={() => deleteTaskList(item.id)} compact>Delete</Button>
          </TouchableOpacity>
        )}
      />
      <TextInput
        label="Title"
        value={newTitle}
        onChangeText={setNewTitle}
        style={{ marginVertical: 8 }}
      />
      <TextInput
        label="Description"
        value={newDesc}
        onChangeText={setNewDesc}
        style={{ marginVertical: 8 }}
      />
      <Button mode="contained" onPress={() => { createTaskList(newTitle, newDesc); setNewTitle(""); setNewDesc(""); }}>
        Create Task List
      </Button>
    </View>
  );
}