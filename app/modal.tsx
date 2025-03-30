import React, { useState } from "react";
import { View, Text, Button, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import axios from 'axios';
import { useNavigation } from "@react-navigation/native";
import QuestionPage from "./QuestionPage";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  StatisticsPage: {
    totalTime: string;
    averageTime: string;
    correctRatio: string;
  };
};

export default function Index() {
  const [questions, setQuestions] = useState(0);
  const [days, setDays] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewingFlashcards, setViewingFlashcards] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [performanceData, setPerformanceData] = useState<{ timeTaken: number; isCorrect: boolean }[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.canceled === false) {
        setUploadedFile(result);
        setApiResponse(null); // Clear previous results
        Alert.alert("File Uploaded", `File Name: ${result.assets[0].name}`);
        console.log("Uploaded File:", result);
        
        // Read the PDF content as base64
        try {
          setIsLoading(true);
          setPdfContent("Processing PDF content...");
          
          // Get the PDF file URI
          const fileUri = result.assets[0].uri;
          
          // Read the file as base64
          const base64Content = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64
          });
          
          setPdfContent(`PDF content loaded (${Math.round(base64Content.length / 1024)} KB)`);
          console.log(`PDF content loaded as base64 (${Math.round(base64Content.length / 1024)} KB)`);
          
        } catch (readError) {
          console.error("Error reading PDF content:", readError);
          setPdfContent(null);
          Alert.alert("Error", "Could not read the PDF content. Please try another file.");
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log("File upload canceled");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      Alert.alert("Error", "An error occurred while uploading the file.");
    }
  };

  async function generateQuestions(numQuestions: number, pdfFileUri: string) {
    const API_KEY = 'AIzaSyBNIMV9UmNt_BJTxt5n0wqAF8cxbjgv7g4'; 
    const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
    
    try {
      // Read the PDF file as base64
      const base64Content = await FileSystem.readAsStringAsync(pdfFileUri, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      // Create a prompt that references the PDF content
      const prompt = `I'm going to share a PDF document with you. Please analyze the content and generate ${numQuestions} multiple-choice questions based on the important information in this document.

Your response must be a single valid JSON object with the exact structure shown below.
Do not include any text before or after the JSON.
Do not include markdown formatting, code blocks, or explanations.
Ensure all JSON syntax is valid with proper quotes, commas, and brackets.

The JSON structure must be exactly:
{
  "questions": [
    {
      "questionText": "What is [concept from the PDF]?",
      "options": {
        "A": "First option",
        "B": "Second option",
        "C": "Third option",
        "D": "Fourth option"
      },
      "correctAnswer": "A"
    }
    // Additional questions will follow this exact same structure
  ]
}

Each question should test understanding of key concepts from the document and have exactly 4 options (A, B, C, D) with one correct answer.
`;

      console.log("Sending request to Gemini API with PDF content...");

      // Send the request to the Gemini API with the PDF content
      const response = await axios.post(
        `${API_URL}?key=${API_KEY}`,
        {
          contents: [
            {
              parts: [
                { text: prompt },
                { 
                  inline_data: {
                    mime_type: "application/pdf",
                    data: base64Content
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048
          }
        }
      );

      // Extract the text from the response
      const responseText = response.data.candidates[0].content.parts[0].text;
      console.log("Raw API Response:", responseText);
      
      // Clean up the response if it contains non-JSON content
      let cleanedResponse = responseText;
      
      // Remove any markdown code block indicators
      cleanedResponse = cleanedResponse.replace(/```json|```/g, '');
      
      // Remove any text before the first '{'
      const firstBraceIndex = cleanedResponse.indexOf('{');
      if (firstBraceIndex > 0) {
        cleanedResponse = cleanedResponse.substring(firstBraceIndex);
      }
      
      // Remove any text after the last '}'
      const lastBraceIndex = cleanedResponse.lastIndexOf('}');
      if (lastBraceIndex !== -1 && lastBraceIndex < cleanedResponse.length - 1) {
        cleanedResponse = cleanedResponse.substring(0, lastBraceIndex + 1);
      }
      
      console.log("Cleaned Response:", cleanedResponse);
      
      try {
        // Parse the cleaned JSON response
        const parsedJson = JSON.parse(cleanedResponse);
        return parsedJson;
      } catch (parseError) {
        console.error("Failed to parse cleaned response as JSON:", parseError);
        
        // Fallback: Try to extract JSON using regex as a last resort
        const jsonMatch = responseText.match(/{[\s\S]*}/);
        if (jsonMatch) {
          try {
            const extractedJson = JSON.parse(jsonMatch[0]);
            console.log("Extracted JSON using regex:", extractedJson);
            return extractedJson;
          } catch (regexError) {
            console.error("Failed to parse regex-extracted JSON:", regexError);
          }
        }
        
        throw new Error("Could not parse the API response as valid JSON.");
      }
    } catch (error) {
      console.error('Error generating questions from PDF:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("API error details:", error.response.data);
      }
      throw error;
    }
  }

  const handleGenerate = async () => {
    if (questions <= 0) {
      Alert.alert("Invalid Input", "Please enter a positive number of questions.");
      return;
    }
    
    if (!uploadedFile || !uploadedFile.assets || uploadedFile.assets.length === 0) {
      Alert.alert("Missing PDF", "Please upload a PDF file first.");
      return;
    }
    
    setIsLoading(true);
    setApiResponse(null);
    setErrorMessage(null);
    
    try {
      console.log(`Generating ${questions} questions for ${days} days based on uploaded PDF`);
      
      // Call the generateQuestions function with the PDF file URI
      const questionsData = await generateQuestions(questions, uploadedFile.assets[0].uri);
      
      // Store the response in state for display
      setApiResponse(questionsData);
      console.log("Setting API response state:", questionsData);
      
      // Display a success message
      Alert.alert(
        "Success", 
        `Generated ${questionsData.questions?.length || 0} questions based on your PDF.`
      );
    } catch (error) {
      console.error("Error in handleGenerate:", error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unknown error occurred");
      }
      const errorMessage = error instanceof Error ? error.message : "Failed to generate questions. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewFlashcards = () => {
    if (!apiResponse || !apiResponse.questions || apiResponse.questions.length === 0) {
      Alert.alert("No Questions", "Please generate questions first.");
      return;
    }

    // Start viewing flashcards
    setViewingFlashcards(true);
    setCurrentQuestionIndex(0);
  };


  const handleNextQuestion = () => {
    const timeTaken = (Date.now() - startTime) / 1000; // Time in seconds
    const currentQuestion = apiResponse.questions[currentQuestionIndex];
    console.log("Correct Answer:", currentQuestion.correctAnswer);
    const isCorrect = currentQuestion.isCorrect;

    // Log the metrics for the current question
    console.log(`Question ${currentQuestionIndex + 1} completed:`);
    console.log(`Time Taken: ${timeTaken.toFixed(2)} seconds`);
    console.log(`Correct: ${isCorrect ? "Yes" : "No"}`);

    // Update performance data for the current question
    setPerformanceData((prevData) => [
      ...prevData,
      { timeTaken, isCorrect },
    ]);
    if (currentQuestionIndex === apiResponse.questions.length - 1) {
      // Ensure performance data is updated before calling handleFinishQuiz
      console.log("Last question reached. Navigating to StatisticsPage...");
      const updatedPerformanceData = [
        ...performanceData,
        { timeTaken, isCorrect },
      ];
      handleFinishQuiz(updatedPerformanceData);
    } else {
      // Move to the next question
      setCurrentQuestionIndex((prevIndex) =>
        Math.min(prevIndex + 1, apiResponse.questions.length - 1)
      );
      setStartTime(Date.now()); // Reset the start time for the next question
    }
  };

  const handlePreviousQuestion = () => {
    setCurrentQuestionIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  const handleFinishQuiz = (performanceData: { timeTaken: number; isCorrect: boolean }[]) => {
    const totalQuestions = performanceData.length;
    const totalTime = performanceData.reduce((sum, p) => sum + p.timeTaken, 0);
    const correctAnswers = performanceData.filter((p) => p.isCorrect).length;
  
    const averageTime = totalTime / totalQuestions;
    const correctRatio = correctAnswers / totalQuestions;
  
    navigation.navigate("StatisticsPage", {
      totalTime: totalTime.toFixed(2),
      averageTime: averageTime.toFixed(2),
      correctRatio: (correctRatio * 100).toFixed(2),
    });
  };

  const handleAnswerCheck = (isCorrect: boolean) => {
    setApiResponse((prevApiResponse: { questions: { isCorrect?: boolean }[] } | null) => {
      if (!prevApiResponse) return prevApiResponse;
    
      // Create a deep copy of the questions array
      const updatedQuestions = [...prevApiResponse.questions];
      updatedQuestions[currentQuestionIndex] = {
      ...updatedQuestions[currentQuestionIndex],
      isCorrect, // Update the correctness of the current question
      };
    
      // Return a new apiResponse object with updated questions
      return {
      ...prevApiResponse,
      questions: updatedQuestions,
      };
    });
  
    console.log(`Question ${currentQuestionIndex + 1}: ${isCorrect ? "Correct" : "Incorrect"}`);
  };

  if (viewingFlashcards) {
    return (
      <QuestionPage
              question={apiResponse.questions[currentQuestionIndex]}
              onNext={handleNextQuestion}
              onPrevious={handlePreviousQuestion}
              currentIndex={currentQuestionIndex}
              totalQuestions={apiResponse.questions.length}
              onAnswerCheck={handleAnswerCheck} 
        />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>AstroLearn</Text>
        <Text style={styles.subtitle}>Generate questions from your study materials</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Number of Questions:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={questions === 0 ? "" : questions.toString()}
            onChangeText={(text) => setQuestions(parseInt(text) || 0)}
            placeholder="Enter number of questions"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Days to Spread Questions:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={days === 0 ? "" : days.toString()}
            onChangeText={(text) => setDays(parseInt(text) || 0)}
            placeholder="Enter number of days"
          />
        </View>
        
        <TouchableOpacity 
          style={styles.uploadButton} 
          onPress={handleFileUpload}>
          <Text style={styles.buttonText}>Upload PDF</Text>
        </TouchableOpacity>
        
        {uploadedFile && (
          <Text style={styles.fileInfo}>
            Uploaded: {uploadedFile?.assets?.[0]?.name || "No file name available"}
          </Text>
        )}
        
        <TouchableOpacity 
          style={[styles.generateButton, isLoading && styles.disabledButton]} 
          onPress={handleGenerate}
          disabled={isLoading}>
          <Text style={styles.buttonText}>
            {isLoading ? "Generating..." : "Generate Questions"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.viewButton} onPress={handleViewFlashcards}>
          <Text style={styles.buttonText}>View Flashcards</Text>
        </TouchableOpacity>
        
        {/* Show loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#32cd32" />
            <Text style={styles.loadingText}>Calling Gemini API...</Text>
          </View>
        )}
        
        {/* Show error message if any */}
        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error:</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
        
        {/* Display JSON response */}
        {apiResponse && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseTitle}>Generated Questions:</Text>
            
            {/* Display the questions in a readable format */}
            {apiResponse.questions && apiResponse.questions.length > 0 ? (
              <View style={styles.questionsContainer}>
                {apiResponse.questions.map((q: { questionText: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; options: { A: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; B: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; C: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; D: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; }; correctAnswer: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; }, index: React.Key | null | undefined) => (
                  <View key={index} style={styles.questionCard}>
                    <Text style={styles.questionText}>Q{(typeof index === 'number' ? index + 1 : 0)}: {q.questionText}</Text>
                    <Text style={styles.optionText}>A: {q.options.A}</Text>
                    <Text style={styles.optionText}>B: {q.options.B}</Text>
                    <Text style={styles.optionText}>C: {q.options.C}</Text>
                    <Text style={styles.optionText}>D: {q.options.D}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noQuestionsText}>No questions found in the response.</Text>
            )}
          </View>
        )}
        
        {/* Debug section to confirm the component is rendering */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            Debug: Component is rendering. API response state is {apiResponse ? "populated" : "null"}.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}



const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: '#666',
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  uploadButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  generateButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#32cd32',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fileInfo: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
    color: '#666',
  },
  responseContainer: {
    width: '100%',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  jsonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    color: '#333',
  },
  jsonContainer: {
    maxHeight: 200,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  jsonText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  questionsContainer: {
    width: '100%',
  },
  questionCard: {
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  optionText: {
    fontSize: 14,
    marginBottom: 5,
    paddingLeft: 10,
  },
  correctAnswer: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#32cd32',
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    width: '100%',
    marginTop: 20,
    padding: 15,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#d32f2f',
  },
  errorText: {
    fontSize: 14,
    color: '#333',
  },
  noQuestionsText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
    width: '100%',
  },
  debugText: {
    fontSize: 12,
    color: '#0d47a1',
  },
  viewButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
  },
});

