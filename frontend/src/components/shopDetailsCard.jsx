import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';

const ShopDetailsCard = ({ shop, onEdit }) => {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.shopName}>{shop.shop_name}</Text>
                <Text style={styles.shopId}>ID: {shop.shop_id}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Type:</Text>
                <Text style={styles.value}>{shop.liquor_type === 'country' ? 'Country' : 'Foreign'}</Text>
            </View>

            {shop.liquor_type === 'country' ? (
                <>
                    <View style={styles.row}>
                        <Text style={styles.label}>MGQ:</Text>
                        <Text style={styles.value}>{shop.mgq}</Text>
                    </View>
                    <View style={styles.rowWrap}>
                        <View style={styles.halfRow}>
                            <Text style={styles.label}>Yearly:</Text>
                            <Text style={styles.value}>{shop.yearly_mgq}</Text>
                        </View>
                        <View style={styles.halfRow}>
                            <Text style={styles.label}>Monthly:</Text>
                            <Text style={styles.value}>{shop.monthly_mgq}</Text>
                        </View>
                    </View>
                </>
            ) : (
                <>
                    <View style={styles.rowWrap}>
                        <View style={styles.halfRow}>
                            <Text style={styles.label}>Q1:</Text>
                            <Text style={styles.value}>{shop.mgq_q1}</Text>
                        </View>
                        <View style={styles.halfRow}>
                            <Text style={styles.label}>Q2:</Text>
                            <Text style={styles.value}>{shop.mgq_q2}</Text>
                        </View>
                    </View>
                    <View style={styles.rowWrap}>
                        <View style={styles.halfRow}>
                            <Text style={styles.label}>Q3:</Text>
                            <Text style={styles.value}>{shop.mgq_q3}</Text>
                        </View>
                        <View style={styles.halfRow}>
                            <Text style={styles.label}>Q4:</Text>
                            <Text style={styles.value}>{shop.mgq_q4}</Text>
                        </View>
                    </View>
                </>
            )}

            <View style={styles.row}>
                <Text style={styles.label}>Canteen:</Text>
                <Text style={styles.value}>₹{shop.canteen || 0}</Text>
            </View>

            <TouchableOpacity style={styles.editButton} onPress={() => onEdit(shop)}>
                <Text style={styles.editButtonText}>Edit Shop</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: 10,
        padding: 12,
        marginVertical: 8,
        marginHorizontal: 12,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: colors.grayLight,
        paddingBottom: 4,
    },
    shopName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textDark,
    },
    shopId: {
        fontSize: 13,
        color: colors.gray,
    },
    row: {
        flexDirection: 'row',
        marginTop: 4,
        flexWrap: 'wrap',
    },
    rowWrap: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    halfRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
        marginRight: 4,
    },
    value: {
        fontSize: 13,
        color: colors.textDark,
        marginRight: 8,
    },
    editButton: {
        backgroundColor: colors.primary,
        paddingVertical: 8,
        borderRadius: 5,
        marginTop: 10,
        alignItems: 'center',
    },
    editButtonText: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 14,
    },
});

export default ShopDetailsCard;
