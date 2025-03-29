import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "./App"; // Adjust the import path if needed

type StatisticsPageRouteProp = RouteProp<RootStackParamList, "StatisticsPage">;

const StatisticsPage: React.FC = () => {
  const route = useRoute<StatisticsPageRouteProp>();
  const { totalTime, averageTime, correctRatio } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quiz Statistics</Text>
      <Text>Total Time Taken: {totalTime} seconds</Text>
      <Text>Average Time Per Question: {averageTime} seconds</Text>
      <Text>Correctness Ratio: {correctRatio}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});

export default StatisticsPage;