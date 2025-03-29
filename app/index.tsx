import React, { useState } from "react";
import { View, Text, Button, TextInput, TouchableOpacity, StyleSheet } from "react-native";

export default function Index() {
  const [questions, setQuestions] = useState(0);
  const [days, setDays] = useState(0);

  const handleFileUpload = () => {
    // Logic for file upload
    console.log("File uploaded");
  };

  const handleGenerate = () => {
    // Logic for generating spaced repetition schedule
    console.log(`Generating ${questions} questions for ${days} days`);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.uploadButton} onPress={handleFileUpload}>
        <Text style={styles.uploadButtonText}>Upload File</Text>
      </TouchableOpacity>

      <View style={styles.controlGroup}>
        <Text>Questions:</Text>
        <View style={styles.counter}>
          <Button title="-" onPress={() => setQuestions(Math.max(0, questions - 1))} />
          <TextInput
            style={styles.input}
            value={questions.toString()}
            onChangeText={(text) => setQuestions(Number(text) || 0)}
            keyboardType="numeric"
          />
          <Button title="+" onPress={() => setQuestions(questions + 1)} />
        </View>
      </View>

      <View style={styles.controlGroup}>
        <Text>Days:</Text>
        <View style={styles.counter}>
          <Button title="-" onPress={() => setDays(Math.max(0, days - 1))} />
          <TextInput
            style={styles.input}
            value={days.toString()}
            onChangeText={(text) => setDays(Number(text) || 0)}
            keyboardType="numeric"
          />
          <Button title="+" onPress={() => setDays(days + 1)} />
        </View>
      </View>

      <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
        <Text style={styles.generateButtonText}>Generate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  uploadButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  controlGroup: {
    marginBottom: 20,
    alignItems: "center",
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    width: 50,
    textAlign: "center",
    borderBottomWidth: 1,
    marginHorizontal: 10,
  },
  generateButton: {
    backgroundColor: "#28A745",
    padding: 10,
    borderRadius: 5,
  },
  generateButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});