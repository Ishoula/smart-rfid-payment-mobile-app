import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    TextInput, Modal, ScrollView, ActivityIndicator,
    useWindowDimensions, StatusBar, Alert, LayoutAnimation
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { addWebSocketListener, connectWebSocket } from '../services/websocket';
import { useAuth } from '../context/AuthContext';
import ReceiptModal from '../components/ReceiptModal';

const CATEGORIES = ['Food', 'Drink', 'Electronics', 'Clothing', 'Other'];
const CATEGORY_ICONS = { 'Food': '🍔', 'Drink': '🥤', 'Electronics': '⚡', 'Clothing': '👕', 'Other': '📦' };

export default function POSScreen({ navigation }) {
    const { token, colors, businessName, terminalId } = useAuth();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [category, setCategory] = useState('All');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [rfidModal, setRfidModal] = useState(false);
    const [scannedCard, setScannedCard] = useState(null);
    const [checkingOut, setCheckingOut] = useState(false);
    const [receiptVisible, setReceiptVisible] = useState(false);
    const [lastReceipt, setLastReceipt] = useState(null);
    const [paymentModal, setPaymentModal] = useState(false);

    // Parity: Quick Top-Up state
    const [topupModal, setTopupModal] = useState(false);
    const [topupAmount, setTopupAmount] = useState('');

    // Dashboard Stats
    const [dailyTotal, setDailyTotal] = useState(0);
    const [dailyCount, setDailyCount] = useState(0);

    useEffect(() => {
        loadProducts();
        loadStats();
        connectWebSocket();
        return addWebSocketListener((data) => {
            if (data.event === 'rfid_scan') {
                if (topupModal) {
                    setScannedCard(data.user);
                } else if (paymentModal) {
                    if (data.type === 'unregistered') {
                        setPaymentModal(false);
                        Alert.alert('Unregistered Card', 'This card is not in our system. Redirecting to registration...');
                        navigation.navigate('Customers', { scanUid: data.uid });
                    } else {
                        // Registered user
                        const user = data.user;
                        if (user.wallet_balance >= total) {
                            setPaymentModal(false);
                            checkout(data.uid);
                        } else {
                            setPaymentModal(false);
                            setScannedCard(user);
                            setTopupModal(true);
                        }
                    }
                } else if (data.type === 'user') {
                    // Normal peek scan
                    setScannedCard(data.user);
                    setRfidModal(true);
                }
            }
        });
    }, [topupModal, paymentModal, total]);

    const loadProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (e) {
            Alert.alert('Error', 'Could not load products');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const res = await api.get('/api/transactions');
            const today = new Date().toDateString();
            const filtered = res.data.filter(t => new Date(t.timestamp).toDateString() === today);
            setDailyTotal(filtered.reduce((s, t) => s + t.total_amount, 0));
            setDailyCount(filtered.length);
        } catch (e) { /* silent fail for stats */ }
    };

    const addToCart = (p) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCart(prev => {
            const ext = prev.find(i => i.id === p.id.toString());
            if (ext) return prev.map(i => i.id === ext.id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { ...p, id: p.id.toString(), quantity: 1 }];
        });
    };

    const updateQty = (id, d) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + d } : i).filter(i => i.quantity > 0));
    };

    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

    const checkout = async (uid) => {
        if (!cart.length) return;
        setCheckingOut(true);
        try {
            const res = await api.post('/payment/checkout', {
                cartItems: cart.map(i => ({ id: i.id, quantity: i.quantity, price: i.price, name: i.name })),
                totalAmount: total,
                cardUid: uid || undefined,
                token: uid ? undefined : token,
            });

            setLastReceipt({
                ...res.data,
                items: [...cart],
                total,
                customerName: scannedCard?.fullname,
                timestamp: new Date().toLocaleString()
            });

            setCart([]);
            setRfidModal(false);
            setScannedCard(null);
            setReceiptVisible(true);
            loadStats();
        } catch (e) {
            const errorMsg = e.response?.data?.error || 'Unknown error occurred';
            if (errorMsg.toLowerCase().includes('insufficient')) {
                Alert.alert('Insufficient Funds', 'Would you like to top up this card now?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Top Up Now', onPress: () => {
                            setRfidModal(false);
                            setTopupModal(true);
                        }
                    }
                ]);
            } else {
                Alert.alert('Payment Failed', errorMsg);
            }
        } finally {
            setCheckingOut(false);
        }
    };

    const handleQuickTopup = async () => {
        const amount = parseFloat(topupAmount);
        if (isNaN(amount) || amount <= 0) return Alert.alert('Invalid Amount', 'Please enter a valid amount.');
        try {
            setCheckingOut(true);
            await api.post('/wallet/topup', { cardUid: scannedCard.card_uid, amount });
            Alert.alert('Success', 'Wallet topped up!');
            setTopupModal(false);
            if (cart.length > 0) {
                checkout(scannedCard.card_uid);
            } else {
                setRfidModal(true);
            }
        } catch (e) {
            Alert.alert('Top Up Failed', e.response?.data?.error || 'Operation failed');
        } finally {
            setCheckingOut(false);
        }
    };

    const numColumns = isTablet ? 4 : 2;
    const sidePanelWidth = isTablet ? 360 : 0;
    const cardWidth = (width - sidePanelWidth - (numColumns + 1) * 16) / numColumns;

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
            <StatusBar barStyle={colors.bg === '#ffffff' ? 'dark-content' : 'light-content'} backgroundColor={colors.bg} />

            {/* Premium Header */}
            <View style={[styles.header, { backgroundColor: colors.bg }]}>
                <View>
                    <Text style={[styles.greeting, { color: colors.text }]}>{businessName}</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSub }]}>Terminal #{terminalId} · Active</Text>
                </View>
                <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="search-outline" size={18} color={colors.textDim} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search items..."
                        placeholderTextColor={colors.textDim}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <View style={[styles.body, isTablet && styles.bodyTablet]}>
                <View style={{ flex: 1 }}>
                    {/* Dashboard Summary */}
                    <View style={styles.dashStats}>
                        <LinearGradient colors={[colors.surface, colors.bg]} style={[styles.statCard, { borderColor: colors.border }]}>
                            <View style={[styles.statIconBox, { backgroundColor: colors.primaryDim }]}><Ionicons name="wallet-outline" size={20} color={colors.primary} /></View>
                            <View>
                                <Text style={[styles.statLabel, { color: colors.textDim }]}>Today's Sales</Text>
                                <Text style={[styles.statValue, { color: colors.text }]}>{dailyTotal.toLocaleString()} RWF</Text>
                            </View>
                        </LinearGradient>
                        <TouchableOpacity
                            style={[styles.statCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}
                            onPress={() => Alert.alert('Action', 'Go to Customers tab and tap the "TOP UP" button to add balance.')}
                        >
                            <View style={[styles.statIconBox, { backgroundColor: colors.primary }]}><Ionicons name="card" size={20} color="#fff" /></View>
                            <View>
                                <Text style={[styles.statLabel, { color: colors.primary }]}>Quick Action</Text>
                                <Text style={[styles.statValue, { color: colors.primary }]}>TOP UP</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Category Filter */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
                        {['All', ...CATEGORIES].map(cat => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.catChip, { backgroundColor: colors.card, borderColor: colors.border }, category === cat && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                onPress={() => {
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                    setCategory(cat);
                                }}
                            >
                                <Text style={[styles.catChipText, { color: colors.textDim }, category === cat && { color: colors.bg }]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {loading ? (
                        <View style={styles.centerLoading}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.loadingText, { color: colors.textDim }]}>Syncing inventory...</Text></View>
                    ) : (
                        <FlatList
                            data={products.filter(p => (category === 'All' || p.category === category) && p.name.toLowerCase().includes(search.toLowerCase()))}
                            numColumns={numColumns}
                            key={numColumns}
                            keyExtractor={i => i.id?.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.productCard, { width: cardWidth, backgroundColor: colors.card, borderColor: colors.border }]}
                                    onPress={() => addToCart(item)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.productIconBg, { backgroundColor: colors.bg }]}><Text style={styles.productIcon}>{CATEGORY_ICONS[item.category] || '📦'}</Text></View>
                                    <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                                    <View style={styles.productFooter}>
                                        <Text style={[styles.productPrice, { color: colors.primary }]}>{item.price.toLocaleString()}</Text>
                                        <Text style={[styles.priceUnit, { color: colors.textSub }]}>RWF</Text>
                                    </View>
                                    <View style={[styles.stockBadge, item.stock_quantity < 5 && { backgroundColor: colors.error + '15' }]}>
                                        <View style={[styles.dot, { backgroundColor: item.stock_quantity < 5 ? colors.error : colors.success }]} />
                                        <Text style={[styles.stockText, { color: colors.textDim }]}>{item.stock_quantity} in stock</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={{ padding: 16, gap: 16 }}
                            columnWrapperStyle={{ gap: 16 }}
                        />
                    )}
                </View>

                {/* Cart Panel */}
                <View style={[styles.cartPanel, isTablet && [styles.cartPanelTablet, { borderLeftColor: colors.border }], { backgroundColor: colors.surface }]}>
                    <View style={styles.cartHeader}>
                        <Text style={[styles.cartTitle, { color: colors.text }]}>Order Summary</Text>
                        <View style={[styles.cartBadge, { backgroundColor: colors.primary }]}><Text style={[styles.cartBadgeText, { color: colors.bg }]}>{cart.length}</Text></View>
                    </View>

                    <ScrollView style={{ flex: 1 }}>
                        {cart.length === 0 ? (
                            <View style={styles.emptyCart}>
                                <Ionicons name="cart-outline" size={48} color={colors.textSub} />
                                <Text style={[styles.emptyText, { color: colors.textDim }]}>Your cart is empty</Text>
                            </View>
                        ) : cart.map(i => (
                            <View key={i.id} style={[styles.cartItem, { borderBottomColor: colors.border }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.cartItemName, { color: colors.text }]} numberOfLines={1}>{i.name}</Text>
                                    <Text style={[styles.cartItemPrice, { color: colors.primary }]}>{(i.price * i.quantity).toLocaleString()} RWF</Text>
                                </View>
                                <View style={[styles.qtyRow, { backgroundColor: colors.bg }]}>
                                    <TouchableOpacity onPress={() => updateQty(i.id, -1)} style={[styles.qtyBtn, { backgroundColor: colors.card }]}><Ionicons name="remove" size={14} color={colors.text} /></TouchableOpacity>
                                    <Text style={[styles.qtyNum, { color: colors.text }]}>{i.quantity}</Text>
                                    <TouchableOpacity onPress={() => updateQty(i.id, 1)} style={[styles.qtyBtn, { backgroundColor: colors.card }]}><Ionicons name="add" size={14} color={colors.text} /></TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={[styles.checkoutSection, { borderTopColor: colors.border }]}>
                        <View style={styles.totalRow}>
                            <Text style={[styles.totalLabel, { color: colors.textDim }]}>Grand Total</Text>
                            <Text style={[styles.totalAmt, { color: colors.text }]}>{total.toLocaleString()} RWF</Text>
                        </View>
                        <TouchableOpacity onPress={() => setPaymentModal(true)} disabled={!cart.length || checkingOut} activeOpacity={0.9}>
                            <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.checkoutGrad}>
                                {checkingOut ? <ActivityIndicator color="#fff" /> : (
                                    <View style={styles.checkoutBtnRoot}>
                                        <Text style={styles.checkoutText}>PROCEED TO PAY</Text>
                                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Payment Prompt Modal */}
            <Modal visible={paymentModal} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={[styles.rfidModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <LinearGradient colors={[colors.primaryDim, colors.bg]} style={styles.modalCircle}>
                            <Ionicons name="radio-outline" size={44} color={colors.primary} />
                        </LinearGradient>
                        <Text style={[styles.rfidLabel, { color: colors.primary }]}>Ready to Pay</Text>
                        <Text style={[styles.rfidName, { color: colors.text, textAlign: 'center' }]}>Please scan RFID card to complete {total.toLocaleString()} RWF purchase</Text>
                        <TouchableOpacity onPress={() => setPaymentModal(false)} style={{ marginTop: 24 }}>
                            <Text style={{ color: colors.error, fontWeight: '700' }}>CANCEL PAYMENT</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Quick Top-Up Modal (Parity) */}
            <Modal visible={topupModal} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={[styles.rfidModal, { backgroundColor: colors.card, borderColor: colors.border, padding: 24 }]}>
                        <Text style={[styles.rfidLabel, { color: colors.primary }]}>Quick Wallet Top-Up</Text>
                        <Text style={[styles.rfidName, { color: colors.text }]}>{scannedCard?.fullname}</Text>

                        <View style={[styles.balanceCard, { backgroundColor: colors.surface, marginVertical: 12, padding: 15 }]}>
                            <Text style={[styles.balanceLabel, { color: colors.textDim, fontSize: 10 }]}>Requested Amount</Text>
                            <Text style={[styles.rfidBalance, { color: colors.text, fontSize: 20 }]}>{total.toLocaleString()} RWF</Text>
                        </View>

                        <View style={{ width: '100%', gap: 10 }}>
                            <TextInput
                                style={[styles.searchInput, { backgroundColor: colors.bg, marginHorizontal: 0, paddingHorizontal: 15, borderRadius: 12, height: 50, color: colors.text, borderBottomWidth: 0 }]}
                                placeholder="Enter Top-up Amount"
                                placeholderTextColor={colors.textSub}
                                keyboardType="numeric"
                                value={topupAmount}
                                onChangeText={setTopupAmount}
                            />
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {[1000, 5000].map(amt => (
                                    <TouchableOpacity
                                        key={amt}
                                        style={{ flex: 1, height: 44, borderRadius: 12, backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center' }}
                                        onPress={() => setTopupAmount(amt.toString())}
                                    >
                                        <Text style={{ color: colors.primary, fontWeight: '700' }}>+{amt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity onPress={handleQuickTopup} disabled={checkingOut} style={[styles.confirmBtn, { marginTop: 20 }]}>
                            <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.confirmGrad}>
                                {checkingOut ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>ADD FUNDS & CONTINUE</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setTopupModal(false)}><Text style={[styles.cancelText, { color: colors.textDim }]}>Go Back</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ReceiptModal
                visible={receiptVisible}
                receipt={lastReceipt}
                colors={colors}
                businessName={businessName}
                terminalId={terminalId}
                onClose={() => setReceiptVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    greeting: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 12, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
    searchBox: { flex: 0.8, flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1 },
    searchInput: { flex: 1, fontSize: 14, marginLeft: 8 },
    body: { flex: 1 },
    bodyTablet: { flexDirection: 'row' },
    dashStats: { flexDirection: 'row', padding: 16, gap: 12 },
    statCard: { flex: 1, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1 },
    statIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
    statValue: { fontSize: 16, fontWeight: '700' },
    catRow: { maxHeight: 50, marginVertical: 8 },
    catChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22, borderWidth: 1 },
    catChipActive: {},
    catChipText: { fontWeight: '700', fontSize: 13 },
    catChipTextActive: {},
    productCard: { borderRadius: 24, padding: 16, alignItems: 'center', borderWidth: 1, elevation: 2 },
    productIconBg: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    productIcon: { fontSize: 32 },
    productName: { fontWeight: '700', fontSize: 14, textAlign: 'center' },
    productFooter: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
    productPrice: { fontWeight: '800', fontSize: 16 },
    priceUnit: { fontSize: 10, marginLeft: 4 },
    stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    lowStock: {},
    dot: { width: 6, height: 6, borderRadius: 3 },
    stockText: { fontSize: 10, fontWeight: '600' },
    cartPanel: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
    cartPanelTablet: { width: 360, borderTopLeftRadius: 0, borderLeftWidth: 1, height: '100%' },
    cartHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    cartTitle: { fontSize: 20, fontWeight: '800' },
    cartBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cartBadgeText: { fontWeight: '900', fontSize: 12 },
    emptyCart: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, opacity: 0.5 },
    emptyText: { marginTop: 12, fontSize: 15 },
    cartItem: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1 },
    cartItemName: { fontSize: 15, fontWeight: '600' },
    cartItemPrice: { fontSize: 13, marginTop: 2 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 4, gap: 10 },
    qtyBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
    qtyNum: { fontWeight: '800', minWidth: 20, textAlign: 'center' },
    checkoutSection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    totalLabel: { fontSize: 16, fontWeight: '600' },
    totalAmt: { fontWeight: '800', fontSize: 22 },
    checkoutGrad: { borderRadius: 16, padding: 18 },
    checkoutBtnRoot: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    checkoutText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    rfidModal: { borderRadius: 32, padding: 32, alignItems: 'center', width: '85%', maxWidth: 400, borderWidth: 1 },
    modalCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    rfidLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },
    rfidName: { fontSize: 24, fontWeight: '800', marginTop: 8 },
    balanceCard: { width: '100%', padding: 20, borderRadius: 20, marginVertical: 20, alignItems: 'center' },
    balanceLabel: { fontSize: 11, marginBottom: 4 },
    rfidBalance: { fontSize: 26, fontWeight: '800' },
    confirmBtn: { width: '100%', marginBottom: 16 },
    confirmGrad: { padding: 18, borderRadius: 16, alignItems: 'center' },
    confirmText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    cancelText: { fontWeight: '600' },
    centerLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: 12, fontSize: 14 }
});
