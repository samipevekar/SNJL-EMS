import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, RefreshControl} from 'react-native';
import {ProgressBar} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import ExpensesTable from '../../components/ExpensesTable';
import colors from '../../theme/colors';
import {useDispatch, useSelector} from 'react-redux';
import {
  clearShop,
  getAllExpenseAsync,
  getShopByIdAsync,
  selectShopExpenses,
  selectSpecificShop,
} from '../../redux/slice/shopSlice';
import {formatDate} from '../../utils/formatDate';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { selectUser } from '../../redux/slice/authSlice';
import { ScrollView } from 'react-native-gesture-handler';

const ShopDetails = ({route, navigation}) => {
  const {shop_id} = route.params;
  const dispatch = useDispatch();
  const shop = useSelector(selectSpecificShop);
  const shop_expenses = useSelector(selectShopExpenses);
  const user = useSelector(selectUser)

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [quotaData, setQuotaData] = useState({
    total: 0,
    remaining: 0,
    progress: 0,
    label: '',
  });

  // Determine current quarter
  const getCurrentQuarter = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 1 && month <= 3) return 1; // Q1: Jan-Mar
    if (month >= 4 && month <= 6) return 2; // Q2: Apr-Jun
    if (month >= 7 && month <= 9) return 3; // Q3: Jul-Sep
    return 4; // Q4: Oct-Dec
  };

  // Fetch shop data
  const fetchData = useCallback(async () => {
    try {
      await dispatch(getShopByIdAsync(shop_id));
      await dispatch(getAllExpenseAsync({shop_id: shop_id}));
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [dispatch, shop_id]);

  // Calculate quota based on liquor type
  useEffect(() => {
    if (shop) {
      let total = 0;
      let remaining = 0;
      let label = '';

      if (shop.liquor_type === 'country') {
        yearly = parseFloat(shop.mgq)/9;
        total = parseFloat(yearly)/12
        remaining = parseFloat(shop.monthly_mgq);
        label = 'Monthly MGQ';
      } else if (shop.liquor_type === 'foreign') {
        const quarter = getCurrentQuarter();
        switch (quarter) {
          case 1:
            total = parseFloat(shop?.mgq?.q1);
            remaining = shop?.mgq_q1 || 0;
            label = 'Q1 MGQ';
            break;
          case 2:
            total = parseFloat(shop?.mgq?.q2);
            remaining = shop?.mgq_q2 || 0;
            label = 'Q2 MGQ';
            break;
          case 3:
            total = parseFloat(shop?.mgq?.q3);
            remaining = shop?.mgq_q3 || 0;
            label = 'Q3 MGQ';
            break;
          case 4:
            total = parseFloat(shop?.mgq?.q4);
            remaining = shop?.mgq_q4 || 0;
            label = 'Q4 MGQ';
            break;
        }
      }

      const progress = total > 0 ? (total - remaining) / total : 0;

      setQuotaData({
        total,
        remaining,
        progress,
        label,
      });
    }
  }, [shop]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const onChange = (event, selectedDate) => {
    setShowPicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) {
      setDate(selectedDate);
      navigation.navigate('ShopSaleSheets', {
        shop_id: shop_id,
        sale_date: formatDate(selectedDate),
      });
    }
  };

  const handleExpenseClick = () => {
    setShowExpense(!showExpense);
  };

  const handleAttendanceClick = () => {
    navigation.navigate('AttendanceDetails', {shop_id: shop_id});
  };

  // Initial data load
  useEffect(() => {
    fetchData();
    return () => {
      dispatch(clearShop());
    };
  }, [shop_id]);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={styles.title}>{shop?.shop_name}</Text>
      <Text style={styles.subtitle}>
        Type:{' '}
        {shop?.liquor_type === 'country' ? 'Country Liquor' : 'Foreign Liquor'}
      </Text>

      {/* Sale Sheet */}
      <TouchableOpacity style={styles.card} onPress={() => setShowPicker(true)}>
        <View style={styles.cardRow}>
          <Icon name="file-document-outline" size={24} color={colors.primary} />
          <Text style={styles.cardText}>Sale Sheet</Text>
        </View>
        <Text style={styles.cardSubtext}>Select date to view sale records</Text>
      </TouchableOpacity>

      {/* Quota Indicator */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Icon name="chart-bar" size={24} color={colors.primary} />
          <Text style={styles.cardText}>{quotaData.label} Indicator</Text>
        </View>
        <Text style={styles.quotaText}>
          Remaining: {quotaData.remaining.toLocaleString()}/
          {quotaData.total.toLocaleString()}
        </Text>
        <ProgressBar
          progress={quotaData.progress}
          color={quotaData.progress > 0.8 ? colors.danger : colors.success}
          style={styles.progressBar}
        />
        <Text style={styles.quotaPercentage}>
          {Math.round(quotaData.progress * 100)}% utilized
        </Text>
      </View>

      {/* Attendance Report */}
      {user && user?.role === "super_user" && <TouchableOpacity style={styles.card} onPress={handleAttendanceClick}>
        <View style={styles.cardRow}>
          <Icon name="account-check-outline" size={24} color={colors.primary} />
          <Text style={styles.cardText}>Attendance Report</Text>
        </View>
        <Text style={styles.cardSubtext}>View staff attendance records</Text>
      </TouchableOpacity>}

      {/* Expense Register */}
      <TouchableOpacity onPress={handleExpenseClick} style={styles.card}>
        <View style={styles.cardRow}>
          <Icon name="cash-multiple" size={24} color={colors.primary} />
          <View style={styles.expenseHeader}>
            <Text style={styles.cardText}>Expense Register</Text>
            <Icon
              name={showExpense ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.grayDark}
            />
          </View>
        </View>
        <Text style={styles.cardSubtext}>View shop expenses and records</Text>
      </TouchableOpacity>

      {showExpense && (
        <ExpensesTable expenses={shop_expenses} showDateColumn={true} />
      )}

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: colors.textDark,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  expenseHeader: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  cardSubtext: {
    fontSize: 14,
    color: colors.textDark,
    marginTop: 5,
    marginLeft: 34, // Align with icon
  },
  quotaText: {
    fontSize: 14,
    marginTop: 10,
    marginLeft: 34,
    color: colors.textDark,
  },
  quotaPercentage: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'right',
    color: colors.grayDark,
  },
  progressBar: {
    marginTop: 10,
    marginLeft: 34,
    height: 10,
    borderRadius: 5,
  },
});

export default ShopDetails;