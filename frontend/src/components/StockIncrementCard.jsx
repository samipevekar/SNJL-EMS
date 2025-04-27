import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import colors from '../theme/colors';

const StockIncrementCard = ({ brand_name, volume_ml, onAddSale, showUpi }) => {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      sale: '',
      upi: ''
    }
  });
  const [expenses, setExpenses] = useState([]);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [newExpense, setNewExpense] = useState({ message: '', amount: '' });

  const handleAddExpense = () => {
    if (!newExpense.message || !newExpense.amount) return;
    
    setExpenses([...expenses, {
      message: newExpense.message,
      amount: parseInt(newExpense.amount)
    }]);
    setNewExpense({ message: '', amount: '' });
  };

  const removeExpense = (index) => {
    const updatedExpenses = [...expenses];
    updatedExpenses.splice(index, 1);
    setExpenses(updatedExpenses);
  };

  const onSubmit = (data) => {
    if (!data.sale) return;
    onAddSale({
      brand_name: brand_name,
      volume_ml,
      sale: parseInt(data.sale),
      upi: data.upi ? parseInt(data.upi) : 0,
      expenses: expenses.length > 0 ? expenses : undefined
    });
    reset();
    setExpenses([]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandText}>
            {brand_name}
          </Text>
          <Text style={styles.volumeText}>{volume_ml}ml</Text>
        </View>
      </View>
      
      <View style={styles.inputRow}>
        <Controller
          control={control}
          name="sale"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, styles.saleInput]}
              placeholder="Sale Qty"
              keyboardType="numeric"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        
        <Controller
          control={control}
          name="upi"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, styles.upiInput]}
              placeholder="UPI Amount"
              keyboardType="numeric"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
      </View>

      {/* Expenses Section */}
      <TouchableOpacity 
        style={styles.expenseButton} 
        onPress={() => setExpenseModalVisible(true)}
      >
        <Text style={styles.expenseButtonText}>Add Expenses</Text>
      </TouchableOpacity>

      {expenses.length > 0 && (
        <View style={styles.expensesList}>
          <FlatList
            data={expenses}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.expenseItem}>
                <Text style={styles.expenseText}>{item.message}: ₹{item.amount}</Text>
                <TouchableOpacity onPress={() => removeExpense(index)}>
                  <Text style={styles.removeExpense}>×</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}

      <TouchableOpacity 
        style={styles.addButton} 
        onPress={handleSubmit(onSubmit)}
      >
        <Text style={styles.addButtonText}>Add Sale</Text>
      </TouchableOpacity>

      {/* Expense Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={expenseModalVisible}
        onRequestClose={() => setExpenseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Expense Description"
              value={newExpense.message}
              onChangeText={(text) => setNewExpense({...newExpense, message: text})}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Amount"
              keyboardType="numeric"
              value={newExpense.amount}
              onChangeText={(text) => setNewExpense({...newExpense, amount: text})}
            />
            
            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setExpenseModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.addExpenseButton]}
                onPress={handleAddExpense}
              >
                <Text style={styles.modalButtonText}>Add Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '95%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  brandContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    flexShrink: 1,
    marginRight: 8,
  },
  volumeText: {
    fontSize: 14,
    color: colors.primary,
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  input: {
    height: 40,
    borderColor: colors.secondary,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    fontSize: 14,
  },
  saleInput: {
    flex: 2,
    marginRight: 8,
  },
  upiInput: {
    flex: 3,
  },
  expenseButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  expenseButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  expensesList: {
    marginBottom: 12,
    maxHeight: 100,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  expenseText: {
    fontSize: 14,
    color: colors.textDark,
  },
  removeExpense: {
    color: colors.danger,
    fontSize: 20,
    paddingHorizontal: 8,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.textDark,
    textAlign: 'center',
  },
  modalInput: {
    height: 40,
    borderColor: colors.secondary,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: colors.white,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: colors.lightGray,
  },
  addExpenseButton: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default StockIncrementCard;