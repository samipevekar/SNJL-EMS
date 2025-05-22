import { StyleSheet, Text, View, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSaleSheetsAsync,
  selectSaleSheets,
  selectSaleSheetsLoading,
} from '../../redux/slice/saleSheetSlice';
import { getAllExpenseAsync, selectShopExpenses } from '../../redux/slice/shopSlice';
import SaleSheetCard from '../../components/SaleSheetCard';
import EditSaleSheetModal from '../../components/EditSaleSheetModal';
import colors from '../../theme/colors';
import { formatDateLeft } from '../../utils/formatDateLeft';
import { ActivityIndicator } from 'react-native-paper';

const ShopSaleSheets = ({ route }) => {
  const { shop_id, sale_date } = route.params;
  const dispatch = useDispatch();
  const saleSheets = useSelector(selectSaleSheets);
  const shopExpenses = useSelector(selectShopExpenses);
  const loading = useSelector(selectSaleSheetsLoading);
  const [editingSheet, setEditingSheet] = useState(null);

  useEffect(() => {
    dispatch(fetchSaleSheetsAsync({ shop_id, sale_date }));
    dispatch(getAllExpenseAsync({ shop_id, sale_date }));
  }, [shop_id, sale_date, dispatch]);

  const getCumulativeTotals = () => {
    let net_cash = 0;
    let cash_in_hand = 0;
    let upi = 0;
    let total_expenses = 0;
    let canteen = 0;
    let net_sale = 0;

    saleSheets.forEach((sheet) => {
      net_cash += Number(sheet.net_cash || 0);
      cash_in_hand += Number(sheet.cash_in_hand || 0);
      upi += Number(sheet.upi || 0);
      canteen += Number(sheet.canteen || 0);
      net_sale += Number(sheet.daily_sale || 0);

      if (Array.isArray(sheet.expenses)) {
        sheet.expenses.forEach((expense) => {
          total_expenses += Number(expense.amount || 0);
        });
      }
    });

    return {
      net_cash,
      cash_in_hand,
      upi,
      total_expenses,
      canteen,
      net_sale,
    };
  };

  const { net_cash, cash_in_hand, upi, total_expenses, canteen, net_sale } = getCumulativeTotals();

  if (loading) {
    return (
      <ActivityIndicator size={'small'} color={colors.primary} style={styles.ActivityIndicator} />
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Sale Details</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoBadge}>
              <Text style={styles.infoLabel}>SHOP ID</Text>
              <Text style={styles.infoValue}>{shop_id}</Text>
            </View>
            <View style={styles.infoBadge}>
              <Text style={styles.infoLabel}>DATE</Text>
              <Text style={styles.infoValue}>{formatDateLeft(sale_date)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Summary */}
      {saleSheets.length > 0 && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Cumulative Totals</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Net Sale:</Text>
            <Text style={styles.summaryValue}>₹{net_sale.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Expenses:</Text>
            <Text style={styles.summaryValue}>₹{total_expenses.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Canteen:</Text>
            <Text style={styles.summaryValue}>₹{canteen.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Net Cash:</Text>
            <Text style={styles.summaryValue}>₹{net_cash.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>UPI:</Text>
            <Text style={styles.summaryValue}>₹{upi.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cash Collected:</Text>
            <Text style={styles.summaryValue}>₹{cash_in_hand.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {/* Sale Sheets List */}
      {saleSheets.map((item) => (
        <SaleSheetCard
          key={item.id}
          item={item}
          showEditButton={true}
          onEditPress={() => setEditingSheet(item)}
        />
      ))}

      {/* Edit Modal */}
      <EditSaleSheetModal
        visible={!!editingSheet}
        onClose={() => setEditingSheet(null)}
        saleSheet={editingSheet}
      />
    </ScrollView>
  );
};

export default ShopSaleSheets;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  ActivityIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  header: {
    backgroundColor: colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  headerContent: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-between',
  },
  infoBadge: {
    backgroundColor: colors.grayLight,
    padding: 8,
    borderRadius: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textGray,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  summaryContainer: {
    backgroundColor: colors.white,
    padding: 16,
    margin: 16,
    borderRadius: 8,
    shadowColor: colors.black,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.textDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
    paddingBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.primary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
});
