import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Index from './index';
import Main from './main'; // Import Main component
import StatisticsPage from './StatisticsPage';

export type RootStackParamList = {
    Splash: undefined;
    Main: undefined; // Add Main to the param list
    Home: undefined;
    Statistics: undefined;
    StatisticsPage: {
      totalTime: string;
      averageTime: string;
      correctRatio: string;
    };
  };

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Main" component={Main} /> {/* Add Main screen */}
        <Stack.Screen name="Home" component={Index} />
        <Stack.Screen name="Statistics" component={StatisticsPage} />
        <Stack.Screen name="StatisticsPage" component={StatisticsPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}