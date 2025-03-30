import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from "react-native";
import { useRoute, RouteProp, ParamListBase } from "@react-navigation/native";
import { PieChart, BarChart, LineChart } from "react-native-chart-kit";
import { useRouter } from "expo-router";
import axios from "axios";
const NGROK_URL = "https://2166cb7087c2.ngrok.app/study-plan";

// Define a param list type
type RootStackParamList = {
  StatisticsPage: {
    totalTime: string;
    averageTime: string;
    correctRatio: string;
    questionTimes?: number[];
    correctAnswers?: number;
    totalQuestions?: number;
  };
};

// Define the route prop type correctly
type StatisticsPageRouteProp = RouteProp<RootStackParamList, 'StatisticsPage'>;

export default function StatisticsPage() {
  const router = useRouter();
  const route = useRoute<StatisticsPageRouteProp>();
  const { totalTime, averageTime, correctRatio } = route.params;
  const [schedule, setSchedule] = useState<{ card_id: number; next_review_date: string }[] | null>(null);
  const [recallDates, setRecallDates] = useState<string[]>([]);
  const [memoryRetention, setMemoryRetention] = useState<number[]>([]);
  const [idealRetention, setIdealRetention] = useState<number[]>([]);
  const [forgettingCurve, setForgettingCurve] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const lineChartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(66, 134, 244, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2, // Optional
    decimalPlaces: 1, // Optional, for Y-axis values
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#ffa726",
    },
  };

  const screenWidth = Dimensions.get("window").width - 40;
  
  // Extract optional params with fallbacks
  const questionTimes = route.params.questionTimes || [];
  const correctAnswers = route.params.correctAnswers || 0;
  const totalQuestions = route.params.totalQuestions || 0;
  
  // Calculate score as percentage
  const scorePercent = Math.round(parseFloat(correctRatio));
  
  // Data for pie chart
  const pieChartData = [
    {
      name: "% Correct",
      population: scorePercent,
      color: "#4285F4",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    },
    {
      name: "% Incorrect",
      population: 100 - scorePercent,
      color: "#EA4335",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    }
  ];

  const masteryScore = Math.max(1, Math.round((scorePercent / 100) * 10));

  // Data for time efficiency analysis (if we have question times)
  const timeEfficiencyData = questionTimes.length > 0 ? {
    labels: ["Very Fast", "Fast", "Average", "Slow", "Very Slow"],
    datasets: [{
      data: [
        questionTimes.filter((t: number) => t < parseFloat(averageTime) * 0.5).length,
        questionTimes.filter((t: number) => t >= parseFloat(averageTime) * 0.5 && t < parseFloat(averageTime) * 0.8).length,
        questionTimes.filter((t: number) => t >= parseFloat(averageTime) * 0.8 && t < parseFloat(averageTime) * 1.2).length,
        questionTimes.filter((t: number) => t >= parseFloat(averageTime) * 1.2 && t < parseFloat(averageTime) * 1.5).length,
        questionTimes.filter((t: number) => t >= parseFloat(averageTime) * 1.5).length
      ]
    }]
  } : {
    labels: ["No Data"],
    datasets: [{
      data: [1]
    }]
  };
  
  // Chart configuration with blue theme
  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#4285F4"
    }
  };

  // Performance status based on score
  const getPerformanceStatus = () => {
    if (scorePercent >= 90) return { text: "Excellent!", color: "#4CAF50" };
    if (scorePercent >= 75) return { text: "Very Good", color: "#8BC34A" };
    if (scorePercent >= 60) return { text: "Good", color: "#CDDC39" };
    if (scorePercent >= 40) return { text: "Needs Improvement", color: "#FFC107" };
    return { text: "Requires Attention", color: "#F44336" };
  };

  const performanceStatus = getPerformanceStatus();

  const sendStatisticsToBackend = async () => {
    try {
      const response = await axios.post(NGROK_URL, {
        avg_time: parseFloat(averageTime), // Convert to number
        correct_ratio: parseFloat(correctRatio) / 100, // Convert percentage to decimal
      });

      setSchedule(response.data.schedule);
      setRecallDates(response.data.recall_dates);
      setMemoryRetention(response.data.memory_retention);
      setIdealRetention(response.data.ideal_retention);
      setForgettingCurve(response.data.forgetting_curve);
      
      console.log("Data sent successfully:", response.data);
    } catch (error: any) {
      console.error("Error sending data to backend:", error);
      if (error.response) {
        setError(`Backend error: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        setError("No response received from the backend. Please check your network connection.");
      } else {
        setError(`Unexpected error: ${error.message}`);
      }
    }
  };

  useEffect(() => {
    sendStatisticsToBackend();
  }, []);
  
  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quiz Results</Text>
      </View>
      
      <View style={styles.container}>
        {/* Score Card with Gauge Chart */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Mastery Score</Text>
          
          {/* Rectangle Progress Bar */}
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(masteryScore / 10) * 100}%`, backgroundColor: performanceStatus.color },
              ]}
            />
          </View>
          
          <Text style={styles.masteryScoreText}>{`${masteryScore}/10`}</Text>

          </View>
          
          <Text style={[styles.performanceStatus, { color: performanceStatus.color }]}>
            {performanceStatus.text}
          </Text>
        </View>
        
        {/* Summary Section */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalTime} s</Text>
            <Text style={styles.summaryLabel}>Total Time</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{averageTime} s</Text>
            <Text style={styles.summaryLabel}>Avg. Time/Question</Text>
          </View>
        </View>
        
        {/* Pie Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Performance Breakdown</Text>
          <PieChart
            data={pieChartData}
            width={screenWidth - 15}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
        
        {/* Study Schedule */}
        <ScrollView style={styles.container}>
        <View style={styles.header}>
        <Text style={styles.headerTitle}>Memory Retention Chart</Text>
      </View>

      <LineChart
        data={{
          labels: recallDates, // X-axis labels
          datasets: [
            {
              data: memoryRetention, // Memory Retention curve
              color: (opacity = 1) => `rgba(34, 202, 236, ${opacity})`, // Blue
              strokeWidth: 2,
            },
            {
              data: idealRetention, // Ideal Retention curve
              color: (opacity = 1) => `rgba(34, 139, 34, ${opacity})`, // Green
              strokeWidth: 2,
            },
            {
              data: forgettingCurve, // Forgetting Curve
              color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`, // Red
              strokeWidth: 2,
            },
          ],
          legend: ["Memory Retention", "Ideal Retrieval Practice", "Forgetting Curve"], // Legend
        }}
        width={screenWidth - 20} // Chart width
        height={300} // Chart height
        chartConfig={{
          ...lineChartConfig,
          propsForLabels: {
            fontSize: 10, // Reduce font size for labels
          },
        }}
        xLabelsOffset={-10} // Adjust X-axis label position
        yLabelsOffset={10} // Adjust Y-axis label position
        horizontalLabelRotation={-45} // Rotate X-axis labels
        bezier // Smooth curves
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    </ScrollView>
        
        {/* Performance Insights */}
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>Performance Insights</Text>
          <View style={styles.insightItem}>
            <View style={styles.insightDot} />
            <Text style={styles.insightText}>
              {scorePercent >= 70 
                ? "Your accuracy is strong! Focus on maintaining consistency." 
                : "Work on improving accuracy through targeted practice."}
            </Text>
          </View>
          <View style={styles.insightItem}>
            <View style={styles.insightDot} />
            <Text style={styles.insightText}>
              {parseFloat(averageTime) < 30 
                ? "You answer quickly! Make sure you're not rushing." 
                : parseFloat(averageTime) > 60 
                  ? "Consider practicing to increase your answer speed." 
                  : "You have a good balance of speed and thoughtfulness."}
            </Text>
          </View>
        </View>
        
        {/* Back button */}
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.replace('/main')}
        >
          <Text style={styles.buttonText}>Back to Main</Text>
        </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#4285F4',
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  container: {
    padding: 20,
  },
  scoreCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginTop: -20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 0,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 0,
  },
  performanceStatus: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
    paddingHorizontal: 5,
  },
  barChart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  scheduleContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  scheduleItem: {
    backgroundColor: '#F1F3F4',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  scheduleItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  scheduleItemDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  errorText: {
    color: '#EA4335',
    marginBottom: 10,
  },
  loadingText: {
    color: '#666',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  chartStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 50,
    paddingHorizontal: 10,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  insightsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4285F4',
    marginRight: 10,
    marginTop: 6,
  },
  insightText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    lineHeight: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: '#E8EAED',
    marginHorizontal: 15,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBarBackground: {
    width: '100%',
    height: 20,
    backgroundColor: '#E8EAED',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  masteryScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
});