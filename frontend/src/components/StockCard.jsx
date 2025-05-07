import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const StockCard = ({ stock, onEdit }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.brandName} >
          {stock.brand_name} <Text style={styles.volume}>{stock.volume_ml}ml</Text>
        </Text>
      </View>

      <View style={styles.body}>
        <InfoRow label="Bill ID" value={stock.bill_id} />
        <InfoRow label="Warehouse" value={stock.warehouse_name} />
        <InfoRow label="Cases" value={stock.cases} />
        <InfoRow label="Pieces" value={stock.pieces} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.date}>
          Updated: {new Date(stock.updated_at).toLocaleDateString()}
        </Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(stock)}>
          <Icon name="pencil" size={18} color={colors.primary} />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10
  },
  header: {
    // flexDirection: 'row',
    // justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.secondary,
    paddingBottom: 6,
  },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    flex: 1,
    marginRight: 8,
  },
  volume: {
    fontSize: 14,
    color: colors.textDark,
    minWidth: 50,
    textAlign: 'right',
    fontWeight:'500',
  },
  body: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: colors.textDark,
  },
  value: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: colors.secondary,
    paddingTop: 6,
  },
  date: {
    fontSize: 11,
    color: colors.primary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  editText: {
    marginLeft: 4,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default StockCard;
