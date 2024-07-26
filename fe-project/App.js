import axios from 'axios';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, Alert, Button, TouchableOpacity, Image, Dimensions,
  TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './screens/login/login.js';
import HomeScreen from './screens/login/homeScreen/homeScreen.js';


const stack = createNativeStackNavigator();
export default function App() {
  //here we will use a navigator
  return (
    <NavigationContainer>
      <stack.Navigator>
        <stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
      </stack.Navigator>
    </NavigationContainer>
  )

}


