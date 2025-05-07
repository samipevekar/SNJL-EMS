import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import SaleSheetCard from '../../components/SaleSheetCard';
import { 
  fetchSaleSheetsAsync, 
  selectSaleSheets, 
  selectSaleSheetsLoading,
  clearSaleSheets
} from '../../redux/slice/saleSheetSlice';
import colors from '../../theme/colors';
import { selectUser } from '../../redux/slice/authSlice';
import { formatDateLeft } from '../../utils/formatDateLeft';
import EditSaleSheetModal from '../../components/EditSaleSheetModal';

const SaleSheetsPage = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const saleSheets = useSelector(selectSaleSheets);
  const loading = useSelector(selectSaleSheetsLoading);
  const [refreshing, setRefreshing] = useState(false);
  const [totals, setTotals] = useState({
    net_cash: 0,
    cash_in_hand: 0,
    upi: 0,
    total_expenses: 0,
    canteen: 0,
    net_sale: 0,
  });
  const [editingSheet, setEditingSheet] = useState(null);
  const shopId = user?.assigned_shops?.length > 0 ? user.assigned_shops[0] : null;

  const calculateTotals = useCallback((sheets) => {
    let net_sale = 0
    let net_cash = 0;
    let cash_in_hand = 0;
    let upi = 0;
    let total_expenses = 0;
    let canteen = 0;
  
    sheets.forEach(sheet => {
      net_cash += Number(sheet.net_cash || 0);
      cash_in_hand += Number(sheet.cash_in_hand || 0);
      upi += Number(sheet.upi || 0);
      net_sale += Number(sheet.daily_sale || 0)
      canteen += Number(sheet.canteen || 0)
  
      if (Array.isArray(sheet.expenses)) {
        sheet.expenses.forEach(expense => {
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
      net_sale
    };
  }, []);

  const loadData = useCallback(async () => {
    if (shopId) {
      dispatch(fetchSaleSheetsAsync({ shop_id: shopId, latest: 'true' }));
    }
  }, [dispatch, shopId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {
        dispatch(clearSaleSheets());
      };
    }, [loadData, dispatch])
  );

  useEffect(() => {
    if (saleSheets.length > 0) {
      const newTotals = calculateTotals(saleSheets);
      setTotals(newTotals);
    } else {
      setTotals({
        net_cash: 0,
        cash_in_hand: 0,
        upi: 0,
        total_expenses: 0,
        canteen: 0,
        net_sale: 0
      });
    }
  }, [saleSheets, calculateTotals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sale Sheets</Text>
        <Text style={styles.date}>
          {saleSheets[0]?.sale_date ? formatDateLeft(saleSheets[0]?.sale_date) : ''}
        </Text>
      </View>

      {/* Cumulative Summary */}
      {saleSheets.length > 0 && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Cumulative Totals</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Net Sale:</Text>
            <Text style={styles.summaryValue}>₹{totals.net_sale.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Expenses:</Text>
            <Text style={styles.summaryValue}>₹{totals.total_expenses.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Canteen:</Text>
            <Text style={styles.summaryValue}>₹{totals.canteen.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Net Cash:</Text>
            <Text style={styles.summaryValue}>₹{totals.net_cash.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>UPI:</Text>
            <Text style={styles.summaryValue}>₹{totals.upi.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cash Collected:</Text>
            <Text style={styles.summaryValue}>₹{totals.cash_in_hand.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {saleSheets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No sale sheets found</Text>
        </View>
      ) : (
        <FlatList
          data={saleSheets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <SaleSheetCard 
              item={item} 
              showEditButton={true}
              onEditPress={() => setEditingSheet(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}

      <EditSaleSheetModal
        visible={!!editingSheet}
        onClose={() => setEditingSheet(null)}
        saleSheet={editingSheet}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  date: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  summaryContainer: {
    backgroundColor: colors.white,
    padding: 16,
    margin: 16,
    borderRadius: 8,
    shadowColor: colors.black,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6
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
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.grayDark,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default SaleSheetsPage;