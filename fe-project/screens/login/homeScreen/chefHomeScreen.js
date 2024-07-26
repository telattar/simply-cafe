import axios from 'axios';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    StyleSheet, Text, View, TextInput, Alert, Button, TouchableOpacity, Image, Dimensions,
    TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

export default function ChefHomeScreen({ user, navigation }) {
    const { firstName, userType, lastName } = user;
    console.log("in chef page")

    return (
        <View style={styles.container}>
            <Text>Welcome,  </Text>
            <Text>This is the chef homepage.</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF2D7',
        alignItems: 'center',
        justifyContent: 'center',
    }
})