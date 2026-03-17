import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert,
    ScrollView, Dimensions, Switch, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { THEMES } from '../theme/colors';

export default function SettingsScreen() {
    const {
        user, logout, colors, themeName, updateTheme,
        businessName, terminalId, updateBusinessSettings
    } = useAuth();

    const [notifs, setNotifs] = useState(true);
    const [bizNameInput, setBizNameInput] = useState(businessName);
    const [termIdInput, setTermIdInput] = useState(terminalId);

    useEffect(() => {
        setBizNameInput(businessName);
        setTermIdInput(terminalId);
    }, [businessName, terminalId]);

    const handleSaveBiz = () => {
        updateBusinessSettings(bizNameInput, termIdInput);
        Alert.alert('Settings Saved', 'Business and Terminal ID updated successfully.');
    };

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout }
        ]);
    };

    const SettingRow = ({ icon, label, value, color, onPress, toggle, toggleVal, onToggle }) => (
        <TouchableOpacity
            style={[styles.infoRow, { borderBottomColor: colors.border }]}
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={0.7}
        >
            <View style={styles.infoLeft}>
                <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                <Text style={[styles.infoLabel, { color: colors.text }]}>{label}</Text>
            </View>
            <View style={styles.infoRight}>
                {toggle ? (
                    <Switch
                        value={toggleVal}
                        onValueChange={onToggle}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor="#fff"
                    />
                ) : (
                    <>
                        {value && <Text style={[styles.infoValue, { color: colors.textDim }]}>{value}</Text>}
                        {onPress && <Ionicons name="chevron-forward" size={16} color={colors.textDim} />}
                    </>
                )}
            </View>
        </TouchableOpacity>
    );

    const ThemeOption = ({ name, label, mainColor }) => (
        <TouchableOpacity
            style={[
                styles.themeOption,
                { backgroundColor: colors.card, borderColor: themeName === name ? colors.primary : colors.border }
            ]}
            onPress={() => updateTheme(name)}
        >
            <View style={[styles.themeDot, { backgroundColor: mainColor, borderColor: themeName === name ? '#fff' : 'transparent' }]} />
            <Text style={[styles.themeLabel, { color: colors.text }]}>{label}</Text>
            {themeName === name && <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={styles.checkIcon} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>System Configuration</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Business Settings (Parity) */}
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Store Identity</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.inputBox}>
                        <Text style={[styles.inputLabel, { color: colors.textDim }]}>Business Name</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            value={bizNameInput}
                            onChangeText={setBizNameInput}
                            placeholder="Enter Shop Name"
                            placeholderTextColor={colors.textSub}
                            onBlur={handleSaveBiz}
                        />
                    </View>
                    <View style={styles.inputBox}>
                        <Text style={[styles.inputLabel, { color: colors.textDim }]}>Terminal Identifier</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            value={termIdInput}
                            onChangeText={setTermIdInput}
                            placeholder="e.g. DW-POS-01"
                            placeholderTextColor={colors.textSub}
                            onBlur={handleSaveBiz}
                        />
                    </View>
                </View>

                {/* Theme Selection (Parity) */}
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Visual Branding</Text>
                <View style={styles.themeGrid}>
                    <ThemeOption name="dark" label="Premium Dark" mainColor="#00e5ff" />
                    <ThemeOption name="light" label="Clean Light" mainColor="#008ba3" />
                    <ThemeOption name="midnight" label="Midnight Cobalt" mainColor="#536dfe" />
                    <ThemeOption name="forest" label="Forest Emerald" mainColor="#00e676" />
                    <ThemeOption name="sunset" label="Sunset Amethyst" mainColor="#ff4081" />
                </View>

                {/* General Settings */}
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Preferences</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <SettingRow
                        icon="notifications-outline"
                        label="Push Notifications"
                        color={colors.primary}
                        toggle
                        toggleVal={notifs}
                        onToggle={setNotifs}
                    />
                    <SettingRow
                        icon="globe-outline"
                        label="System Language"
                        value="English"
                        color={colors.secondary}
                    />
                </View>

                {/* Account Section */}
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Admin Account</Text>
                <TouchableOpacity
                    style={[styles.profileSection, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.9}
                >
                    <View style={[styles.avatar, { backgroundColor: colors.primaryDim, borderColor: colors.primary }]}>
                        <Text style={[styles.avatarText, { color: colors.primary }]}>{user?.fullname?.[0] || 'A'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.uName, { color: colors.text }]}>{user?.fullname || 'Administrator'}</Text>
                        <Text style={[styles.uEmail, { color: colors.textDim }]}>{user?.email || 'admin@darywise.com'}</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutSm}>
                        <Ionicons name="log-out-outline" size={24} color={colors.error} />
                    </TouchableOpacity>
                </TouchableOpacity>

                <Text style={[styles.footerText, { color: colors.textSub }]}>
                    Terminal Build: 1.0.5-parity{"\n"}
                    © 2026 DaryWise Smart Shop Systems
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { padding: 20, borderBottomWidth: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
    scroll: { padding: 16, paddingBottom: 40 },
    sectionTitle: { fontSize: 11, fontWeight: '900', marginLeft: 6, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 2, opacity: 0.8 },
    card: { borderRadius: 24, borderWidth: 1, marginBottom: 24, overflow: 'hidden' },
    infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
    infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    infoLabel: { fontSize: 14, fontWeight: '600' },
    infoRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoValue: { fontSize: 13, fontWeight: '500' },
    inputBox: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    inputLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
    input: { fontSize: 15, fontWeight: '600', paddingVertical: 4 },
    themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    themeOption: { width: (Dimensions.get('window').width - 42) / 2, padding: 14, borderRadius: 16, borderWidth: 1, alignItems: 'center', flexDirection: 'row', gap: 10 },
    themeDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
    themeLabel: { fontSize: 12, fontWeight: '700' },
    checkIcon: { marginLeft: 'auto' },
    profileSection: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, borderWidth: 1, marginBottom: 24, gap: 14 },
    avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
    avatarText: { fontSize: 20, fontWeight: '800' },
    uName: { fontSize: 16, fontWeight: '700' },
    uEmail: { fontSize: 12 },
    logoutSm: { padding: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12 },
    footerText: { textAlign: 'center', fontSize: 11, marginTop: 24, opacity: 0.6, lineHeight: 18 }
});
