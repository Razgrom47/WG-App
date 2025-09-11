import React, { useContext, useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { WGContext } from "../../contexts/WGContext";
import { AuthContext } from "../../contexts/AuthContext";
import { Button, TextInput } from "react-native-paper";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const { wgs, fetchWGs, createWG, joinWG, deleteWG, selectWG, selectedWG } = useContext(WGContext);
  const router = useRouter();
  // WG creation form state
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [etage, setEtage] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Join WG state
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    if (user) fetchWGs();
  }, [user]);

  if (!user) return null; // Prevent rendering before redirect

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>Your WGs</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={wgs}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              selectWG(item);
              router.push("/wg");
            }}
            style={{
              padding: 12,
              marginVertical: 6,
              backgroundColor: selectedWG?.id === item.id ? "#eee" : "#fff",
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 18 }}>{item.title}</Text>
            <Button onPress={() => deleteWG(item.id)} compact>Delete</Button>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 24 }}>
            You are not a member of any WG yet.
          </Text>
        }
      />

      <Text style={styles.sectionTitle}>Create a new WG</Text>
      <TextInput
        label="Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        left={<TextInput.Icon icon="home" />}
      />
      <TextInput
        label="Address"
        value={address}
        onChangeText={setAddress}
        style={styles.input}
        left={<TextInput.Icon icon="map-marker" />}
      />
      <TextInput
        label="Etage"
        value={etage}
        onChangeText={setEtage}
        style={styles.input}
        left={<TextInput.Icon icon="stairs" />}
      />
      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        left={<TextInput.Icon icon="text" />}
      />
      <Button
        mode="contained"
        onPress={handleCreateWG}
        loading={loading}
        style={styles.button}
      >
        Create WG
      </Button>

      <Text style={styles.sectionTitle}>Join a WG</Text>
      <TextInput
        label="Join WG Code"
        value={joinCode}
        onChangeText={setJoinCode}
        style={styles.input}
        left={<TextInput.Icon icon="key" />}
      />
      <Button
        mode="contained"
        onPress={handleJoinWG}
        style={styles.button}
      >
        Join WG
      </Button>
    </View>
  );

  async function handleCreateWG() {
    setError(null);
    setLoading(true);
    try {
      await createWG(title, address, etage, description);
      setTitle("");
      setAddress("");
      setEtage("");
      setDescription("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinWG() {
    setError(null);
    try {
      await joinWG(joinCode);
      setJoinCode("");
    } catch (e: any) {
      setError(e.message);
    }
  }
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    marginTop: 24,
    marginBottom: 8,
    fontWeight: "bold",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  button: {
    marginTop: 8,
  },
  error: {
    marginBottom: 16,
    textAlign: "center",
    color: "red",
  },
});