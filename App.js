// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import PlantCareScreen from './components/PlantCareScreen'; // Make sure PlantCareScreen is correctly implemented

const Tab = createBottomTabNavigator();

// Dummy screens for other tabs
function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Home Screen</Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Profile Screen</Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="PlantCare"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            // Display first letter of each tab as an icon (for simplicity)
            return <Text style={{ fontSize: size, color }}>{route.name[0]}</Text>;
          },
          tabBarActiveTintColor: '#4CAF50',  // Active tab color
          tabBarInactiveTintColor: 'gray',   // Inactive tab color
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen
          name="PlantCare"
          component={PlantCareScreen}
          options={{
            title: 'Plant Care',
          }}
        />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
