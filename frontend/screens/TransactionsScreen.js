import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TransactionsScreen() {
    const { colors } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = async () => {
        try {
            const res = await api.get('/api/transactions');
            setHistory(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { load(); }, []);

    const onRefresh = () => {
        setRefreshing(true);
        load();
    };

    const renderItem = ({ item }) => (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardTop}>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'PAID' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)' }]}>
                    <View style={[styles.statusDot, { backgroundColor: item.status === 'PAID' ? colors.success : colors.warning }]} />
                    <Text style={[styles.statusText, { color: item.status === 'PAID' ? colors.success : colors.warning }]}>
                        {item.status || 'PAID'}
                    </Text>
                </View>
                <Text style={[styles.time, { color: colors.textSub }]}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoGroup}>
                    <Text style={[styles.label, { color: colors.textDim }]}>CUSTOMER</Text>
                    <Text style={[styles.customerName, { color: colors.text }]} numberOfLines={1}>{item.customer_name || 'Guest'}</Text>
                </View>
                <View style={styles.amountGroup}>
                    <Text style={[styles.amount, { color: colors.primary }]}>{item.total_amount?.toLocaleString()}</Text>
                    <Text style={[styles.currency, { color: colors.textSub }]}>RWF</Text>
                </View>
            </View>

            <View style={{ marginBottom: 12 }}>
                <Text style={[styles.label, { color: colors.textDim, marginBottom: 4 }]}>TRANSACTION ID: #{item._id.toString().slice(-8).toUpperCase()}</Text>
            </View>

            {item.items && (
                <View style={[styles.itemPreview, { backgroundColor: colors.bg }]}>
                    <Ionicons name="basket-outline" size={14} color={colors.textDim} />
                    <Text style={[styles.itemText, { color: colors.textDim }]} numberOfLines={1}>
                        {item.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </Text>
                </View>
            )}

            <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                <Text style={[styles.date, { color: colors.textSub }]}>{new Date(item.timestamp).toDateString()}</Text>
                <TouchableOpacity style={styles.detailBtn}>
                    <Text style={[styles.detailText, { color: colors.primary }]}>View Receipt</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Sales History</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSub }]}>{history.length} transactions processed</Text>
                </View>
                <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                    <Ionicons name="refresh" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 50 }} /> :
                <FlatList
                    data={history}
                    keyExtractor={i => i._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={60} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.textDim }]}>No transactions found today</Text>
                        </View>
                    }
                />
            }
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    headerTitle: { fontSize: 22, fontWeight: '800' },
    headerSubtitle: { fontSize: 12, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    refreshBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    list: { padding: 16, gap: 16 },
    card: { borderRadius: 24, padding: 16, borderWidth: 1 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    time: { fontSize: 13, fontWeight: '600' },
    cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
    infoGroup: { gap: 4 },
    label: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    txId: { fontSize: 16, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    amountGroup: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    amount: { fontSize: 24, fontWeight: '900' },
    currency: { fontSize: 12, fontWeight: '700' },
    itemPreview: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, marginBottom: 16 },
    itemText: { fontSize: 13, flex: 1 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 12 },
    date: { fontSize: 12, fontWeight: '600' },
    detailBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    detailText: { fontSize: 13, fontWeight: '700' },
    customerName: { fontSize: 16, fontWeight: '800' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, opacity: 0.5 },
    emptyText: { marginTop: 16, fontSize: 16, fontWeight: '600' }
});
