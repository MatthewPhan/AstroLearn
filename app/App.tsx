import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from './SplashScreen'; // Import SplashScreen
import Index from './index';
import StatisticsPage from './StatisticsPage';

export type RootStackParamList = {
    Splash: undefined;
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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={Index} />
        <Stack.Screen name="StatisticsPage" component={StatisticsPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}