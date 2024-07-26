import axios from 'axios';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    StyleSheet, Text, View, TextInput, Alert, Button, TouchableOpacity, Image, Dimensions,
    TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import ChefHomeScreen from './chefHomeScreen.js';
export default function HomeScreen({ route, navigation }) {
    const { user } = route.params;
    return (
        <View>

            {
                user.userType === 'Chef' ? (<ChefHomeScreen user={user} />) :
                    <Text>Hi</Text>
            }
        </View>
    )
}
