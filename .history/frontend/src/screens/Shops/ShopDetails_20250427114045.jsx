import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {ProgressBar} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import ExpensesTable from '../../components/ExpensesTable';
import colors from '../../theme/colors';

const ShopDetails = ({route, navigation}) => {
  const {shop_name} = route.params;

  // Quota Indicator
  const totalMGQ = 950; // Total quota
  const remainingMGQ = 500; // Remaining quota
  const quotaProgress = (totalMGQ - remainingMGQ) / totalMGQ; // Progress Bar Calculation

  // Date Picker State
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [showExpense, setShowExpense] = useState(false);

  // Handle Date Change
  const onChange = (event, selectedDate) => {
    setShowPicker(false);
    if (event.type === 'dismissed') {
      return; // Do nothing if user cancels
    }
    if (selectedDate) {
      setDate(selectedDate);
      // Navigate to next page with selected date (example)
      console.log('Selected Date:', selectedDate);
    }
    navigation.navigate('SaleSheetsDetails');
  };

  const handleExpenseClick = () => {
    setShowExpense(!showExpense);
  };

  const handleAttendanceClick = ()=>{
    navigation.navigate("AttendanceDetails")
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{shop_name}</Text>

      {/* Sale Sheet */}
      <TouchableOpacity style={styles.card} onPress={() => setShowPicker(true)}>
        <Text style={styles.cardText}>📅 Sale Sheet (Select Date)</Text>
      </TouchableOpacity>

      {/* Quota Indicator */}
      <View style={styles.card}>
        <Text style={styles.cardText}>📊 Quota Indicator</Text>
        <Text style={styles.quotaText}>
          Remaining MGQ: {remainingMGQ}/{totalMGQ}
        </Text>
        <ProgressBar
          progress={quotaProgress}
          color={'green'}
          style={styles.progressBar}
        />
      </View>

      {/* Attendance Report */}
      <TouchableOpacity style={styles.card} onPress={handleAttendanceClick}>
        <Text style={styles.cardText}>✅ Attendance Report</Text>
      </TouchableOpacity>

      {/* Expense Register */}
      <TouchableOpacity onPress={handleExpenseClick} style={styles.card}>
        <Text style={styles.cardText}>
          💰 Expense Register {showExpense ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {showExpense && (
        <ExpensesTable
          expenses={[
            {label: 'Expense A', value: 300},
            {label: 'Expense B', value: 400},
            {label: 'Expense C', value: 400},
            {label: 'Expense D', value: 400},
          ]}
        />
      )}

      {/* Date Picker */}
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onChange}
        />
      )}
    </View>
  );
};

export default ShopDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
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
    // elevation: 2,
  },
  cardText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quotaText: {
    fontSize: 14,
    marginTop: 5,
  },
  progressBar: {
    marginTop: 10,
    height: 10,
    borderRadius: 5,
  },
});
