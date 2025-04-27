// SaleSheetDetails.js
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearCurrentSaleSheet,
  fetchSaleSheetByIdAsync,
  selectCurrentSaleSheet,
  selectDetailLoading,
} from '../../redux/slice/saleSheetSlice';
import colors from '../../theme/colors';
import { formatDateLeft } from '../../utils/formatDateLeft';

const SaleSheetDetails = ({ route, navigation }) => {
  const { id } = route.params;
  const dispatch = useDispatch();
  const saleSheet = useSelector(selectCurrentSaleSheet);
  const loading = useSelector(selectDetailLoading);

  useEffect(() => {
    dispatch(fetchSaleSheetByIdAsync(id));

    return () => {
      dispatch(clearCurrentSaleSheet());
    };
  }, [id]);

  if (loading || !saleSheet) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const formatCurrency = (amount) => {
    return '₹' + parseFloat(amount).toFixed(2);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{saleSheet.brand_name}</Text>
        <Text style={styles.subtitle}>{saleSheet.volume_ml} ml</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Shop ID:</Text>
          <Text style={styles.value}>{saleSheet.shop_id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Sale Date:</Text>
          <Text style={styles.value}>{formatDateLeft(saleSheet.sale_date)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Liquor Type:</Text>
          <Text style={styles.value}>{saleSheet.liquor_type}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stock Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Opening Balance:</Text>
          <Text style={styles.value}>{saleSheet.opening_balance}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Sale:</Text>
          <Text style={styles.value}>{saleSheet.sale}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Closing Balance:</Text>
          <Text style={styles.value}>{saleSheet.closing_balance}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>MRP:</Text>
          <Text style={styles.value}>{formatCurrency(saleSheet.mrp)}</Text>
        </View>
      </View>

      {saleSheet.stock_increment && saleSheet.stock_increment.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Increment</Text>
          {saleSheet.stock_increment.map((item, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>Warehouse:</Text>
                <Text style={styles.value}>{item.warehouse_name}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Cases:</Text>
                <Text style={styles.value}>{item.cases}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {saleSheet.expenses && saleSheet.expenses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expenses</Text>
          {saleSheet.expenses.map((item, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.rowColumn}>
                <Text style={styles.label}>Detail:</Text>
                <Text style={styles.valueWrap}>{item.message}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Amount:</Text>
                <Text style={styles.value}>{formatCurrency(item.amount)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Summary</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Daily Sale:</Text>
          <Text style={styles.value}>{formatCurrency(saleSheet.daily_sale)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>UPI:</Text>
          <Text style={styles.value}>{formatCurrency(saleSheet.upi)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Net Cash:</Text>
          <Text style={styles.value}>{formatCurrency(saleSheet.net_cash)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Cash in Hand:</Text>
          <Text style={styles.value}>{formatCurrency(saleSheet.cash_in_hand)}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.primary,
  },
  section: {
    marginBottom: 20,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowColumn: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: colors.textDark,
  },
  valueWrap: {
    fontSize: 14,
    color: colors.textDark,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.grayLight,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
});

export default SaleSheetDetails;
