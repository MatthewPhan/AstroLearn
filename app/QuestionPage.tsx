import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Button, StyleSheet } from "react-native";

interface QuestionPageProps {
  question: {
    questionText: string;
    options: {
      A: string;
      B: string;
      C: string;
      D: string;
    };
    correctAnswer: string;
  };
  onNext: () => void;
  onPrevious: () => void;
  currentIndex: number;
  totalQuestions: number;
}


export default function QuestionPage({
  question,
  onNext,
  onPrevious,
  currentIndex,
  totalQuestions,
}: QuestionPageProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    setSelectedOption(null);
  }, [currentIndex]);

  const handleOptionSelect = (option: string) => {
    if (!selectedOption) {
      setSelectedOption(option);
    }
  };

  const isCorrect = selectedOption === question.correctAnswer;

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>
        Question {currentIndex + 1} of {totalQuestions}
      </Text>
      <Text style={styles.questionText}>{question.questionText}</Text>
      <View style={styles.optionsContainer}>
        {Object.entries(question.options).map(([key, value]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.option,
              selectedOption === key && styles.selectedOption,
              selectedOption === key && (isCorrect ? styles.correctOption : styles.incorrectOption),
            ]}
            onPress={() => handleOptionSelect(key)}
          >
            <Text style={styles.optionText}>
              {key}: {value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {selectedOption && (
        <Text style={[styles.feedbackText, { color: isCorrect ? "green" : "red" }]}>
          {isCorrect ? "Correct!" : `Incorrect. The correct answer is ${question.correctAnswer}.`}
        </Text>
      )}
      <View style={styles.navigationButtons}>
        <Button title="Previous" onPress={onPrevious} disabled={currentIndex === 0} />
        <Button title="Next" onPress={onNext} />
      </View>
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
  questionText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  optionsContainer: {
    marginBottom: 16,
    width: "100%",
  },
  option: {
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    width: "90%",
    alignSelf: "center",
  },
  selectedOption: {
    borderColor: "#007BFF",
    backgroundColor: "#e6f0ff",
  },
  correctOption: {
    borderColor: "green",
    backgroundColor: "#d4edda",
  },
  incorrectOption: {
    borderColor: "red",
    backgroundColor: "#f8d7da",
  },
  optionText: {
    fontSize: 16,
    textAlign: "center",
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginTop: 16,
  },
});
