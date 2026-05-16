import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator, TransitionPresets} from '@react-navigation/stack';
import {LayoutGrid, Calendar, Timer, Settings as SettingsIcon} from 'lucide-react-native';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PermissionsScreen from '../screens/PermissionsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SchedulesScreen from '../screens/SchedulesScreen';
import FocusScreen from '../screens/FocusScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AppSelectionScreen from '../screens/AppSelectionScreen';
import BlockingPreviewScreen from '../screens/BlockingPreviewScreen';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Permissions: undefined;
  MainTabs: undefined;
  AppSelection: {scheduleId: string};
  BlockingPreview: {appName: string; endTime: string};
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#4ADE80',
        tabBarInactiveTintColor: '#A0A0A0',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({color}) => <LayoutGrid color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="Schedules"
        component={SchedulesScreen}
        options={{
          tabBarIcon: ({color}) => <Calendar color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="Focus"
        component={FocusScreen}
        options={{
          tabBarIcon: ({color}) => <Timer color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({color}) => <SettingsIcon color={color} size={24} />,
        }}
      />
    </Tab.Navigator>
  );
}

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          cardStyle: {backgroundColor: '#0A0E1A'},
          ...TransitionPresets.SlideFromRightIOS,
        }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{...TransitionPresets.FadeFromBottomAndroid}} />
        <Stack.Screen name="Permissions" component={PermissionsScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{...TransitionPresets.FadeFromBottomAndroid}} />
        <Stack.Screen name="AppSelection" component={AppSelectionScreen} options={{...TransitionPresets.ModalSlideFromBottomIOS}} />
        <Stack.Screen name="BlockingPreview" component={BlockingPreviewScreen} options={{...TransitionPresets.ModalSlideFromBottomIOS}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
