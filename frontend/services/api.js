import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your backend server IP/port
// Use your Wi-Fi local IP so the phone can reach the backend
export const BASE_URL = 'http://10.12.73.240:3001';

export const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
});

export function setAuthToken(token) {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
}

// Auto-attach token from storage on every request
api.interceptors.request.use(async (config) => {
    if (!config.headers['Authorization']) {
        const token = await AsyncStorage.getItem('darywise_token');
        if (token) config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});
