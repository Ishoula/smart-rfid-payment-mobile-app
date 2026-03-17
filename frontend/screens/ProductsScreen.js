import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    ActivityIndicator, Alert, Modal, TextInput, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Food', 'Drink', 'Electronics', 'Clothing', 'Other'];

export default function ProductsScreen() {
    const { colors } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form states
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Other');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [rfidUid, setRfidUid] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (e) {
            Alert.alert('Error', 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name || !price || !rfidUid) return Alert.alert('Error', 'Please fill required fields');
        setSaving(true);
        const pData = { name, category, price, stock_quantity: stock, rfid_uid: rfidUid };
        try {
            if (editingProduct) {
                await api.put(`/api/products/${editingProduct.id}`, pData);
            } else {
                await api.post('/api/products', pData);
            }
            Alert.alert('Success', 'Product saved');
            setModalVisible(false);
            resetForm();
            load();
        } catch (e) {
            Alert.alert('Error', 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert('Delete', 'Are you sure?', [
            { text: 'Cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await api.delete(`/api/products/${id}`);
                        load();
                    } catch (e) { Alert.alert('Error', 'Delete failed'); }
                }
            }
        ]);
    };

    const resetForm = () => {
        setName(''); setCategory('Other'); setPrice(''); setStock(''); setRfidUid(''); setEditingProduct(null);
    };

    const openEdit = (p) => {
        setEditingProduct(p);
        setName(p.name); setCategory(p.category); setPrice(p.price.toString()); setStock(p.stock_quantity.toString()); setRfidUid(p.rfid_uid);
        setModalVisible(true);
    };

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Inventory</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setModalVisible(true); }}>
                    <Ionicons name="add" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 50 }} /> :
                <FlatList
                    data={products}
                    keyExtractor={i => i.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.pName, { color: colors.text }]}>{item.name}</Text>
                                <Text style={[styles.pCategory, { color: colors.textDim }]}>{item.category} · {item.rfid_uid}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.pPrice, { color: colors.primary }]}>{item.price?.toLocaleString()} RWF</Text>
                                <Text style={[styles.pStock, { color: colors.textDim }]}>Stock: {item.stock_quantity}</Text>
                                <View style={styles.actionRow}>
                                    <TouchableOpacity onPress={() => openEdit(item)}><Ionicons name="create-outline" size={20} color={colors.primary} /></TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(item.id)}><Ionicons name="trash-outline" size={20} color={colors.error} /></TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                />
            }

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{editingProduct ? 'Edit Product' : 'Add Product'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={colors.textDim} /></TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ padding: 20 }}>
                            <Text style={[styles.label, { color: colors.text }]}>Product Name</Text>
                            <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} value={name} onChangeText={setName} placeholder="e.g. Bread" placeholderTextColor={colors.textDim} />

                            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
                            <View style={styles.catRow}>
                                {CATEGORIES.map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.catChip,
                                            { backgroundColor: colors.card, borderColor: colors.border },
                                            category === cat && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}
                                        onPress={() => setCategory(cat)}
                                    >
                                        <Text style={[styles.catChipText, { color: colors.textDim }, category === cat && { color: colors.bg, fontWeight: '700' }]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: colors.text }]}>Price (RWF)</Text>
                                    <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="1000" placeholderTextColor={colors.textDim} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: colors.text }]}>Stock</Text>
                                    <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="50" placeholderTextColor={colors.textDim} />
                                </View>
                            </View>

                            <Text style={[styles.label, { color: colors.text }]}>RFID UID</Text>
                            <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} value={rfidUid} onChangeText={setRfidUid} placeholder="TAG_001" placeholderTextColor={colors.textDim} />

                            <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={saving}>
                                <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.btnGrad}>
                                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Product</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    addBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    list: { padding: 12, gap: 10 },
    card: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1 },
    pName: { fontWeight: '700', fontSize: 15 },
    pCategory: { fontSize: 11, marginTop: 2 },
    pPrice: { fontWeight: '800', fontSize: 14 },
    pStock: { fontSize: 11 },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    overlay: { flex: 1, justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    label: { marginBottom: 8, marginTop: 16, fontSize: 14, fontWeight: '600' },
    input: { borderRadius: 12, padding: 14, borderWidth: 1 },
    catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    catChipText: { fontSize: 12 },
    submitBtn: { marginTop: 24, borderRadius: 12, overflow: 'hidden' },
    btnGrad: { padding: 16, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 }
});
