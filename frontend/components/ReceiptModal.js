import React from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    ScrollView, Dimensions, Share, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function ReceiptModal({ visible, receipt, colors, businessName, terminalId, onClose }) {
    if (!receipt) return null;

    const exportToPDF = async () => {
        try {
            const html = `
                <html>
                <body style="font-family: sans-serif; padding: 20px; color: #111;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="margin-bottom: 5px;">${businessName}</h1>
                        <p style="color: #666; margin: 0;">Terminal: ${terminalId}</p>
                        <p style="color: #666; margin: 0;">${receipt.timestamp}</p>
                    </div>
                    <hr/>
                    <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                        <span>Transaction ID:</span>
                        <strong>#${receipt.transactionId?.slice(-6).toUpperCase()}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                        <span>Customer:</span>
                        <strong>${receipt.customerName || 'Walk-in'}</strong>
                    </div>
                    <hr/>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <th style="text-align: left; padding: 8px;">Item</th>
                                <th style="text-align: right; padding: 8px;">Qty</th>
                                <th style="text-align: right; padding: 8px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${receipt.items.map(i => `
                                <tr>
                                    <td style="padding: 8px;">${i.name}</td>
                                    <td style="text-align: right; padding: 8px;">${i.quantity}</td>
                                    <td style="text-align: right; padding: 8px;">${(i.price * i.quantity).toLocaleString()} RWF</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <hr/>
                    <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; margin-top: 20px;">
                        <span>GRAND TOTAL</span>
                        <span>${receipt.total.toLocaleString()} RWF</span>
                    </div>
                    <div style="text-align: center; margin-top: 40px; color: #999; font-style: italic;">
                        Thank you for shopping with us!<br/>
                        ⭐ DaryWise Smart Shop ⭐
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            if (Platform.OS === 'ios') {
                await Sharing.shareAsync(uri);
            } else {
                await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Receipt' });
            }
        } catch (e) {
            console.error('PDF Export failed', e);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {/* Success Header */}
                    <View style={styles.successHeader}>
                        <View style={[styles.checkCircle, { backgroundColor: colors.success }]}>
                            <Ionicons name="checkmark" size={32} color="#fff" />
                        </View>
                        <Text style={[styles.successTitle, { color: colors.text }]}>Payment Successful</Text>
                        <Text style={[styles.successSub, { color: colors.textDim }]}>Transaction completed successfully</Text>
                    </View>

                    {/* Receipt Body */}
                    <View style={[styles.receiptBody, { backgroundColor: '#fff' }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.receiptHeader}>
                                <Text style={styles.bizName}>{businessName}</Text>
                                <Text style={styles.bizSub}>Terminal: {terminalId}</Text>
                                <Text style={styles.bizSub}>{receipt.timestamp}</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Txn ID</Text>
                                <Text style={styles.infoValue}>#{receipt.transactionId?.slice(-6).toUpperCase()}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Customer</Text>
                                <Text style={styles.infoValue}>{receipt.customerName || 'Walk-in'}</Text>
                            </View>

                            <View style={[styles.divider, { borderStyle: 'dashed' }]} />

                            {receipt.items.map((item, idx) => (
                                <View key={idx} style={styles.itemRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemQty}>{item.quantity} × {item.price.toLocaleString()} RWF</Text>
                                    </View>
                                    <Text style={styles.itemTotal}>{(item.price * item.quantity).toLocaleString()} RWF</Text>
                                </View>
                            ))}

                            <View style={styles.divider} />

                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>TOTAL PAID</Text>
                                <Text style={styles.totalValue}>{receipt.total.toLocaleString()} RWF</Text>
                            </View>

                            <View style={styles.footerWrap}>
                                <Text style={styles.footerText}>✅ Payment via RFID Wallet</Text>
                                <Text style={[styles.footerText, { fontStyle: 'italic', marginTop: 8 }]}>Thank you for shopping with us!</Text>
                            </View>
                        </ScrollView>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={exportToPDF}>
                            <Ionicons name="share-outline" size={20} color={colors.bg} />
                            <Text style={[styles.btnText, { color: colors.bg }]}>Share / Save PDF</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]} onPress={onClose}>
                            <Text style={[styles.btnText, { color: colors.text }]}>Close Terminal</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    modal: { width: '90%', maxWidth: 450, borderRadius: 32, padding: 24, borderWidth: 1, maxHeight: '90%' },
    successHeader: { alignItems: 'center', marginBottom: 24 },
    checkCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    successTitle: { fontSize: 22, fontWeight: '800' },
    successSub: { fontSize: 13, marginTop: 4 },
    receiptBody: { borderRadius: 20, padding: 20, minHeight: 300 },
    receiptHeader: { alignItems: 'center', marginBottom: 16 },
    bizName: { fontSize: 18, fontWeight: '900', color: '#111', textTransform: 'uppercase' },
    bizSub: { fontSize: 11, color: '#666', marginTop: 2 },
    divider: { height: 1.5, backgroundColor: '#eee', marginVertical: 12 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    infoLabel: { fontSize: 12, color: '#666' },
    infoValue: { fontSize: 12, fontWeight: '700', color: '#111' },
    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    itemName: { fontSize: 14, fontWeight: '600', color: '#111' },
    itemQty: { fontSize: 11, color: '#666', marginTop: 2 },
    itemTotal: { fontSize: 14, fontWeight: '700', color: '#111' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 15, fontWeight: '900', color: '#111' },
    totalValue: { fontSize: 20, fontWeight: '900', color: '#000' },
    footerWrap: { marginTop: 24, alignItems: 'center' },
    footerText: { fontSize: 11, color: '#999' },
    actions: { marginTop: 24, gap: 12 },
    btn: { height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    btnText: { fontWeight: '800', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 }
});
