import React, { useContext } from "react";
import { View, Text } from "react-native";
import { WGContext } from "../../contexts/WGContext";
import { Button } from "react-native-paper";
import { useRouter } from "expo-router";

export default function WGScreen() {
  const { selectedWG } = useContext(WGContext);
  const router = useRouter();

  if (!selectedWG) return <Text>Select a WG from Home</Text>;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>{selectedWG.name}</Text>
      <Button mode="contained" onPress={() => router.push("/tasklists")}>
        Task Lists
      </Button>
      <Button mode="contained" onPress={() => {/* router.push("/shoppinglists") */}}>
        Shopping Lists
      </Button>
      <Button mode="contained" onPress={() => {/* router.push("/budgetplans") */}}>
        Budget Plans
      </Button>
      <Button mode="outlined" onPress={() => {/* router.push("/managewg") */}}>
        Manage WG
      </Button>
    </View>
  );
}