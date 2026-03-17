import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';

import POSScreen from '../screens/POSScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import CustomersScreen from '../screens/CustomersScreen';
import ProductsScreen from '../screens/ProductsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
    const { width } = useWindowDimensions();
    const { colors } = useAuth();
    const isTablet = width >= 768;

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    height: isTablet ? 70 : 60,
                    paddingBottom: isTablet ? 10 : 6,
                    paddingTop: 6,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textDim,
                tabBarLabelStyle: {
                    fontSize: isTablet ? 13 : 11,
                    fontWeight: '600',
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    const s = isTablet ? 26 : size;
                    if (route.name === 'POS') iconName = focused ? 'storefront' : 'storefront-outline';
                    if (route.name === 'Transactions') iconName = focused ? 'receipt' : 'receipt-outline';
                    if (route.name === 'Customers') iconName = focused ? 'people' : 'people-outline';
                    if (route.name === 'Products') iconName = focused ? 'cube' : 'cube-outline';
                    if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
                    return <Ionicons name={iconName} size={s} color={color} />;
                },
            })}
        >
            <Tab.Screen name="POS" component={POSScreen} options={{ tabBarLabel: 'POS' }} />
            <Tab.Screen name="Transactions" component={TransactionsScreen} options={{ tabBarLabel: 'Sales' }} />
            <Tab.Screen name="Customers" component={CustomersScreen} options={{ tabBarLabel: 'Customers' }} />
            <Tab.Screen name="Products" component={ProductsScreen} options={{ tabBarLabel: 'Products' }} />
            <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
        </Tab.Navigator>
    );
}
