import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    ActivityIndicator, ImageBackground, Dimensions,
    KeyboardAvoidingView, Platform, ScrollView, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const { login, colors } = useAuth();

    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(30))[0];

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) return;
        setLoading(true);
        try {
            await login(email, password);
        } catch (error) {
            // Error managed by context/alert
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop' }}
            style={styles.bg}
            blurRadius={10}
        >
            <View style={styles.overlay}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.center}>

                        <Animated.View style={[styles.brandContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <LinearGradient colors={[colors.secondary, colors.primary]} style={[styles.logoBox, { shadowColor: colors.primary }]}>
                                <Ionicons name="flash" size={40} color="#fff" />
                            </LinearGradient>
                            <Text style={styles.title}>DaryWise</Text>
                            <Text style={[styles.subtitle, { color: colors.primary }]}>RFID SMART SHOP SYSTEM</Text>
                        </Animated.View>

                        <Animated.View style={[styles.glassCard, { opacity: fadeAnim }]}>
                            <Text style={styles.loginTitle}>Welcome Back</Text>
                            <Text style={styles.loginText}>Sign in to manage your terminal</Text>

                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email Address"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPass}
                                />
                                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                                    <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color="rgba(255,255,255,0.4)" />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
                                <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.btnGrad}>
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>SIGN IN</Text>}
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.forgotBtn}>
                                <Text style={styles.forgotText}>Forgot Credentials?</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        <Text style={styles.footerText}>Secure Terminal Connection v1.0.4</Text>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1, width, height },
    overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)' },
    center: { flexGrow: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
    brandContainer: { alignItems: 'center', marginBottom: 40 },
    logoBox: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16, elevation: 20, shadowOpacity: 0.5, shadowRadius: 15 },
    title: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
    subtitle: { fontSize: 12, fontWeight: '800', letterSpacing: 2, marginTop: 4 },
    glassCard: { width: '100%', maxWidth: 400, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' },
    loginTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
    loginText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4, marginBottom: 24 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, color: '#fff', fontSize: 16 },
    loginBtn: { marginTop: 8, borderRadius: 16, overflow: 'hidden', elevation: 10 },
    btnGrad: { padding: 18, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
    forgotBtn: { alignSelf: 'center', marginTop: 20 },
    forgotText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' },
    footerText: { color: 'rgba(255,255,255,0.2)', fontSize: 11, position: 'absolute', bottom: 20, fontWeight: '600', letterSpacing: 1 }
});
