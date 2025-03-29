import React, { useState } from "react";
import { View, Text, Button, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";

export default function Index() {
  const [questions, setQuestions] = useState(0);
  const [days, setDays] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result) {
        setUploadedFile(result);
        Alert.alert("File Uploaded", `File Name: ${result.name}`);
        console.log("Uploaded File:", result);
      } else {
        console.log("File upload canceled");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      Alert.alert("Error", "An error occurred while uploading the file.");
    }
  };

  const handleGenerate = () => {
    if (!uploadedFile) {
      Alert.alert("No File Uploaded", "Please upload a PDF file before generating.");
      return;
    }
    console.log(`Generating ${questions} questions for ${days} days`);
    console.log("Using file:", uploadedFile.name);
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