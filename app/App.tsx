import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Index from './index';
import StatisticsPage from './StatisticsPage';

// Export the type for use in other files
export type RootStackParamList = {
  Home: undefined;
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
        <Stack.Screen name="Home" component={Index} />
        <Stack.Screen name="StatisticsPage" component={StatisticsPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}