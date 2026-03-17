import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { THEMES } from '../theme/colors';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Parity Settings
    const [themeName, setThemeName] = useState('dark');
    const [businessName, setBusinessName] = useState('DaryWise Express');
    const [terminalId, setTerminalId] = useState('DW-POS-01');

    const colors = THEMES[themeName] || THEMES.dark;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [storedToken, storedUser, storedTheme, storedBiz, storedTerm] = await Promise.all([
                AsyncStorage.getItem('token'),
                AsyncStorage.getItem('user'),
                AsyncStorage.getItem('theme'),
                AsyncStorage.getItem('businessName'),
                AsyncStorage.getItem('terminalId')
            ]);

            if (storedToken) {
                setToken(storedToken);
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            }
            if (storedUser) setUser(JSON.parse(storedUser));
            if (storedTheme) setThemeName(storedTheme);
            if (storedBiz) setBusinessName(storedBiz);
            if (storedTerm) setTerminalId(storedTerm);
        } catch (e) {
            console.error('Failed to load auth data', e);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token: newToken, user: newUser } = response.data;

            await AsyncStorage.setItem('token', newToken);
            await AsyncStorage.setItem('user', JSON.stringify(newUser));

            setToken(newToken);
            setUser(newUser);
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            return true;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        await AsyncStorage.multiRemove(['token', 'user']);
        setToken(null);
        setUser(null);
    };

    const updateTheme = async (name) => {
        setThemeName(name);
        await AsyncStorage.setItem('theme', name);
    };

    const updateBusinessSettings = async (bizName, termId) => {
        setBusinessName(bizName);
        setTerminalId(termId);
        await AsyncStorage.setItem('businessName', bizName);
        await AsyncStorage.setItem('terminalId', termId);
    };

    return (
        <AuthContext.Provider value={{
            user, token, login, logout, loading,
            themeName, colors, updateTheme,
            businessName, terminalId, updateBusinessSettings
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
