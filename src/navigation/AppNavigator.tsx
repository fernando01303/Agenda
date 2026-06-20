import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AddTaskScreen } from '../screens/AddTaskScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { RoutineScreen } from '../screens/RoutineScreen';
import { AddRoutineScreen } from '../screens/AddRoutineScreen';
import { RegistroScreen } from '../screens/RegistroScreen';
import { AddDayLogScreen } from '../screens/AddDayLogScreen';
import { useTheme } from '../context/ThemeContext';
import { ActivityTag } from '../database/storage';

export type RootStackParamList = {
  MainTabs: undefined;
  AddTask: undefined;
  AddRoutine: { selectedDate: string };
  AddDayLog: { selectedDate: string; tags: ActivityTag[] };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Routine: undefined;
  Registro: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { colors, isDarkMode } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Routine') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Registro') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
        }
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'Agenda' }} 
      />
      <Tab.Screen 
        name="Routine" 
        component={RoutineScreen} 
        options={{ title: 'Rotina' }} 
      />
      <Tab.Screen 
        name="Registro" 
        component={RegistroScreen} 
        options={{ title: 'Registro' }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Opções' }} 
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { colors, isDarkMode } = useTheme();
  
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="MainTabs"
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background }
        }}
      >
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="AddTask" 
          component={AddTaskScreen} 
          options={{ title: 'Nova Tarefa', presentation: 'modal' }} 
        />
        <Stack.Screen 
          name="AddRoutine" 
          component={AddRoutineScreen} 
          options={{ title: 'Novo Hábito', presentation: 'modal' }} 
        />
        <Stack.Screen 
          name="AddDayLog" 
          component={AddDayLogScreen} 
          options={{ title: 'Novo Registro', presentation: 'modal' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
