import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    ActivityIndicator, Alert, Modal, TextInput, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { addWebSocketListener } from '../services/websocket';
import { useAuth } from '../context/AuthContext';
import { useRoute } from '@react-navigation/native';

export default function CustomersScreen() {
    const { colors } = useAuth();
    const route = useRoute();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [regModal, setRegModal] = useState(false);
    const [topUpModal, setTopUpModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Form states
    const [fullname, setFullname] = useState('');
    const [email, setEmail] = useState('');
    const [cardUid, setCardUid] = useState('');
    const [amount, setAmount] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        load();
        if (route.params?.scanUid) {
            setCardUid(route.params.scanUid);
            setRegModal(true);
        }
        return addWebSocketListener((data) => {
            if (data.event === 'rfid_scan') {
                if (topUpModal && !selectedCustomer) {
                    // Quick Top Up mode: searching for customer by scanned UID
                    findAndSelectCustomer(data.uid);
                } else {
                    setCardUid(data.uid);
                }
            }
        });
    }, [topUpModal, selectedCustomer]);

    const load = async () => {
        try {
            const res = await api.get('/api/customers');
            setCustomers(res.data);
        } catch (e) {
            Alert.alert('Error', 'Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    const findAndSelectCustomer = async (uid) => {
        const c = customers.find(x => x.card_uid === uid);
        if (c) {
            setSelectedCustomer(c);
        } else {
            Alert.alert('Not Found', 'This RFID card is not registered to any customer.');
        }
    };

    const handleRegister = async () => {
        if (!fullname || !email || !cardUid) return Alert.alert('Error', 'Please fill all fields');
        setSaving(true);
        try {
            await api.post('/auth/register', { fullname, email, card_uid: cardUid });
            Alert.alert('Success', 'Customer registered');
            setRegModal(false);
            resetForms();
            load();
        } catch (e) {
            Alert.alert('Error', e.response?.data?.error || 'Registration failed');
        } finally {
            setSaving(false);
        }
    };

    const handleTopUp = async () => {
        if (!amount || isNaN(amount)) return Alert.alert('Error', 'Invalid amount');
        const cardToUse = selectedCustomer?.card_uid || cardUid;
        if (!cardToUse) return Alert.alert('Error', 'Scan a card first');

        setSaving(true);
        try {
            await api.post('/wallet/topup', { cardUid: cardToUse, amount });
            Alert.alert('Success', 'Wallet topped up successfully!');
            setTopUpModal(false);
            resetForms();
            load();
        } catch (e) {
            Alert.alert('Error', 'Top-up failed');
        } finally {
            setSaving(false);
        }
    };

    const resetForms = () => {
        setFullname(''); setEmail(''); setCardUid(''); setAmount(''); setSelectedCustomer(null);
    };

    const openQuickTopUp = () => {
        resetForms();
        setTopUpModal(true);
    };

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Customers</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSub }]}>{customers.length} Members</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.topUpMainBtn} onPress={openQuickTopUp}>
                        <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.topUpGrad}>
                            <Ionicons name="card" size={18} color="#fff" />
                            <Text style={styles.topUpTextBtn}>TOP UP</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setRegModal(true)}>
                        <Ionicons name="person-add" size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 50 }} /> :
                <FlatList
                    data={customers}
                    keyExtractor={i => i.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                            activeOpacity={0.7}
                            onPress={() => { setSelectedCustomer(item); setTopUpModal(true); }}
                        >
                            <View style={[styles.avatar, { backgroundColor: colors.primaryDim }]}><Text style={[styles.avatarText, { color: colors.primary }]}>{item.fullname[0]}</Text></View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.name, { color: colors.text }]}>{item.fullname}</Text>
                                <Text style={[styles.cardInfo, { color: colors.textDim }]}>UID: {item.card_uid}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.balance, { color: colors.text }]}>{item.wallet_balance?.toLocaleString()} RWF</Text>
                                <View style={styles.tapAction}>
                                    <Text style={[styles.tapActionText, { color: colors.success }]}>Tap to Top up</Text>
                                    <Ionicons name="chevron-forward" size={12} color={colors.success} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            }

            {/* Registration Modal */}
            <Modal visible={regModal} transparent animationType="slide">
                <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>New Customer</Text>
                            <TouchableOpacity onPress={() => { setRegModal(false); resetForms(); }}><Ionicons name="close" size={24} color={colors.textDim} /></TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ padding: 20 }}>
                            <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
                            <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} value={fullname} onChangeText={setFullname} placeholder="John Doe" placeholderTextColor={colors.textDim} />
                            <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
                            <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} value={email} onChangeText={setEmail} placeholder="john@example.com" placeholderTextColor={colors.textDim} keyboardType="email-address" />
                            <Text style={[styles.label, { color: colors.text }]}>RFID Card UID (Scan card now)</Text>
                            <View style={[styles.input, styles.rfidInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Text style={{ color: cardUid ? colors.text : colors.textDim }}>{cardUid || 'Waiting for scan...'}</Text>
                                {cardUid && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
                            </View>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={saving}>
                                <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.btnGrad}>
                                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Register Customer</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Top Up Modal */}
            <Modal visible={topUpModal} transparent animationType="slide">
                <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Wallet Top-up</Text>
                            <TouchableOpacity onPress={() => { setTopUpModal(false); resetForms(); }}><Ionicons name="close" size={24} color={colors.textDim} /></TouchableOpacity>
                        </View>
                        <View style={{ padding: 20 }}>
                            {selectedCustomer ? (
                                <View style={[styles.selectedUserInfo, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
                                    <View style={[styles.miniAvatar, { backgroundColor: colors.primaryDim }]}><Text style={[styles.avatarText, { color: colors.primary }]}>{selectedCustomer.fullname[0]}</Text></View>
                                    <View>
                                        <Text style={[styles.customerSummary, { color: colors.text }]}>{selectedCustomer.fullname}</Text>
                                        <Text style={[styles.miniLabel, { color: colors.textDim }]}>Current Balance: {selectedCustomer.wallet_balance?.toLocaleString()} RWF</Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={[styles.rfidWaitBox, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                                    <Ionicons name="radio-outline" size={40} color={colors.primary} />
                                    <Text style={[styles.rfidWaitText, { color: colors.textDim }]}>Please scan the RFID card to Top Up</Text>
                                </View>
                            )}

                            <Text style={[styles.label, { color: colors.text }]}>Top Up Amount (RWF)</Text>
                            <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} value={amount} onChangeText={setAmount} placeholder="e.g. 5000" placeholderTextColor={colors.textDim} keyboardType="numeric" autoFocus />

                            <TouchableOpacity style={styles.submitBtn} onPress={handleTopUp} disabled={saving || (!selectedCustomer && !cardUid)}>
                                <LinearGradient colors={[colors.secondary, colors.primary]} style={[styles.btnGrad, (!selectedCustomer && !cardUid) && { opacity: 0.5 }]}>
                                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirm Top-up</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    headerTitle: { fontSize: 20, fontWeight: '800' },
    headerSubtitle: { fontSize: 12, marginTop: 2 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    topUpMainBtn: { borderRadius: 12, overflow: 'hidden' },
    topUpGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
    topUpTextBtn: { color: '#fff', fontWeight: '800', fontSize: 13 },
    addBtn: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    list: { padding: 16, gap: 12 },
    card: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, borderWidth: 1 },
    avatar: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    avatarText: { fontWeight: '800', fontSize: 18 },
    name: { fontWeight: '700', fontSize: 16 },
    cardInfo: { fontSize: 12, marginTop: 4 },
    balance: { fontWeight: '800', fontSize: 16 },
    tapAction: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, opacity: 0.8 },
    tapActionText: { fontSize: 11, fontWeight: '700' },
    overlay: { flex: 1, justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1 },
    modalTitle: { fontSize: 20, fontWeight: '800' },
    selectedUserInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderLeftWidth: 4, marginBottom: 10 },
    miniAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    customerSummary: { fontSize: 16, fontWeight: '700' },
    miniLabel: { fontSize: 12 },
    rfidWaitBox: { alignItems: 'center', padding: 30, borderRadius: 24, marginBottom: 20, borderWidth: 1, borderStyle: 'dashed' },
    rfidWaitText: { marginTop: 12, textAlign: 'center', fontWeight: '600' },
    label: { marginBottom: 8, marginTop: 16, fontSize: 14, fontWeight: '700' },
    input: { borderRadius: 16, padding: 16, borderWidth: 1, fontSize: 16 },
    rfidInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    submitBtn: { marginTop: 32, borderRadius: 16, overflow: 'hidden' },
    btnGrad: { padding: 18, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '800', fontSize: 16 }
});
