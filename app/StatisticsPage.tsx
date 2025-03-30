import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from "react-native";
import { useRoute, RouteProp, ParamListBase } from "@react-navigation/native";
import { PieChart, BarChart } from "react-native-chart-kit";
import { useRouter } from "expo-router";
import axios from "axios";
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';

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
  const [error, setError] = useState<string | null>(null);
  
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
      name: "Correct",
      population: scorePercent,
      color: "#4285F4",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    },
    {
      name: "Incorrect",
      population: 100 - scorePercent,
      color: "#EA4335",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    }
  ];
  
  // Data for time efficiency analysis (if we have question times)
  const timeEfficiencyData = questionTimes.length > 0 ? {
    labels: ["Very Fast", "Fast", "Average", "Slow", "Very Slow"],
    datasets: [{
      data: [
        questionTimes.filter(t => t < parseFloat(averageTime) * 0.5).length,
        questionTimes.filter(t => t >= parseFloat(averageTime) * 0.5 && t < parseFloat(averageTime) * 0.8).length,
        questionTimes.filter(t => t >= parseFloat(averageTime) * 0.8 && t < parseFloat(averageTime) * 1.2).length,
        questionTimes.filter(t => t >= parseFloat(averageTime) * 1.2 && t < parseFloat(averageTime) * 1.5).length,
        questionTimes.filter(t => t >= parseFloat(averageTime) * 1.5).length
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
      const response = await axios.post("https://7049a0a8d03f.ngrok.app/study-plan", {
        avg_time: parseFloat(averageTime), // Convert to number
        correct_ratio: parseFloat(correctRatio) / 100, // Convert percentage to decimal
      });
      console.log("Data sent successfully:", response.data);
      setSchedule(response.data.schedule); // Extract and set the schedule
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
          <Text style={styles.scoreLabel}>Accuracy</Text>
          
          {/* Gauge Chart */}
          <View style={styles.gaugeContainer}>
            <Svg height="160" width="160" viewBox="0 0 180 90">
              {/* Background Arc */}
              <Path
                d="M 10 90 A 80 80 0 0 1 170 90"
                stroke="#E8EAED"
                strokeWidth="16"
                fill="none"
              />
              {/* Colored Progress Arc */}
              <Path
                d={`M 10 90 A 80 80 0 ${scorePercent > 50 ? 1 : 0} 1 ${
                  10 + 160 * (scorePercent / 100)
                } ${90 - Math.sin((Math.PI * scorePercent) / 100) * 80}`}
                stroke={performanceStatus.color}
                strokeWidth="16"
                fill="none"
                strokeLinecap="round"
              />
              {/* Center Text */}
              <SvgText
                x="90"
                y="70"
                fontSize="24"
                fontWeight="bold"
                fill="#333"
                textAnchor="middle"
              >
                {correctRatio}
              </SvgText>
            </Svg>
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
        <View style={styles.scheduleContainer}>
          <Text style={styles.scheduleTitle}>Personalized Study Plan:</Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
          {schedule ? (
            schedule.map((item) => (
              <View key={item.card_id} style={styles.scheduleItem}>
                <Text style={styles.scheduleItemTitle}>Card ID: {item.card_id}</Text>
                <Text style={styles.scheduleItemDate}>Next Review: {item.next_review_date}</Text>
              </View>
            ))
          ) : (
            !error && <Text style={styles.loadingText}>Generating your personalized study plan...</Text>
          )}
        </View>
        
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
      </View>
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
});