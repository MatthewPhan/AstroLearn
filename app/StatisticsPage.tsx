import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "./App"; 
import axios from "axios";

type StatisticsPageRouteProp = RouteProp<RootStackParamList, "StatisticsPage">;

const StatisticsPage: React.FC = () => {
  const route = useRoute<StatisticsPageRouteProp>();
  const { totalTime, averageTime, correctRatio } = route.params;
  const [schedule, setSchedule] = useState<{ card_id: number; next_review_date: string }[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const sendStatisticsToBackend = async () => {
    try {
      const response = await axios.post("https://daca24fbc302.ngrok.app/study-plan", {
        avg_time: parseFloat(averageTime), // Convert to number
        correct_ratio: parseFloat(correctRatio) / 100, // Convert percentage to decimal
      });
      console.log("Data sent successfully:", response.data);
      setSchedule(response.data.schedule); // Extract and set the schedule
    } catch (error: any) {
      // Log the full error object for debugging
      console.error("Error sending data to backend:", error);
  
      // Extract and set a meaningful error message
      if (error.response) {
        // Server responded with a status code outside the 2xx range
        setError(`Backend error: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        // Request was made but no response was received
        setError("No response received from the backend. Please check your network connection.");
      } else {
        // Something else caused the error
        setError(`Unexpected error: ${error.message}`);
      }
    }
  };

  useEffect(() => {
    sendStatisticsToBackend();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Quiz Statistics</Text>
      <Text>Total Time Taken: {totalTime} seconds</Text>
      <Text>Average Time Per Question: {averageTime} seconds</Text>
      <Text>Correctness Ratio: {correctRatio}%</Text>

      <View style={styles.scheduleContainer}>
        <Text style={styles.scheduleTitle}>Study Schedule:</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {schedule ? (
          schedule.map((item) => (
            <View key={item.card_id} style={styles.scheduleItem}>
              <Text>Card ID: {item.card_id}</Text>
              <Text>Next Review Date: {item.next_review_date}</Text>
            </View>
          ))
        ) : (
          !error && <Text>Loading schedule...</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  scheduleContainer: {
    marginTop: 20,
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  scheduleItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
});


export default StatisticsPage;