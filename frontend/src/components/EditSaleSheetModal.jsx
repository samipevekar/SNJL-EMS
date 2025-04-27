import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updateSaleSheetAsync } from '../redux/slice/saleSheetSlice';
import colors from '../theme/colors';

const EditSaleSheetModal = ({ visible, onClose, saleSheet }) => {
  const dispatch = useDispatch();
  const [sale, setSale] = useState('');
  const [upi, setUpi] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({ message: '', amount: '' });
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);

  useEffect(() => {
    if (saleSheet) {
      setSale(saleSheet.sale.toString());
      setUpi(saleSheet.upi?.toString() || '');
      setExpenses(Array.isArray(saleSheet.expenses) ? 
        saleSheet.expenses : 
        JSON.parse(saleSheet.expenses || '[]'));
    }
  }, [saleSheet]);

  const handleUpdate = () => {
    if (Number(sale) > saleSheet.opening_balance) {
      Alert.alert('Error', 'Sale cannot be greater than opening balance');
      return;
    }

    dispatch(updateSaleSheetAsync({
      id: saleSheet.id,
      sale: Number(sale),
      upi: Number(upi) || 0,
      expenses: expenses
    })).then(() => {
      onClose();
    });
  };

  const addExpense = () => {
    if (!newExpense.message || !newExpense.amount) {
      Alert.alert('Error', 'Please fill all expense fields');
      return;
    }

    setExpenses([...expenses, {
      message: newExpense.message,
      amount: Number(newExpense.amount)
    }]);
    setNewExpense({ message: '', amount: '' });
    setExpenseModalVisible(false);
  };

  const removeExpense = (index) => {
    const newExpenses = [...expenses];
    newExpenses.splice(index, 1);
    setExpenses(newExpenses);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit Sale Sheet</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          {/* Sale Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sale Quantity</Text>
            <TextInput
              style={styles.input}
              value={sale}
              onChangeText={setSale}
              keyboardType="numeric"
              placeholder={`Current: ${saleSheet?.sale}`}
            />
            <Text style={styles.availableText}>
              Available: {saleSheet?.opening_balance}
            </Text>
          </View>

          {/* UPI Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>UPI Amount</Text>
            <TextInput
              style={styles.input}
              value={upi}
              onChangeText={setUpi}
              keyboardType="numeric"
              placeholder={`Current: ${saleSheet?.upi || 0}`}
            />
          </View>

          {/* Expenses Section */}
          <View style={styles.expensesHeader}>
            <Text style={styles.label}>Expenses</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setExpenseModalVisible(true)}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {expenses.length > 0 ? (
            <FlatList
              data={expenses}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.expenseItem}>
                  <View style={styles.expenseTextContainer}>
                    <Text 
                      style={styles.expenseMessage} 
                    //   numberOfLines={1} 
                      ellipsizeMode="tail"
                    >
                      {item.message}
                    </Text>
                    <Text style={styles.expenseAmount}>₹{item.amount}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => removeExpense(index)}
                  >
                    <Text style={styles.deleteButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          ) : (
            <Text style={styles.noExpensesText}>No expenses added</Text>
          )}

          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleUpdate}
          >
            <Text style={styles.submitButtonText}>Update Sale Sheet</Text>
          </TouchableOpacity>
        </View>

        {/* Expense Add Modal */}
        <Modal
          visible={expenseModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setExpenseModalVisible(false)}
        >
          <View style={styles.expenseModalContainer}>
            <View style={styles.expenseModal}>
              <Text style={styles.expenseModalTitle}>Add New Expense</Text>
              
              <TextInput
                style={styles.expenseInput}
                placeholder="Expense description"
                value={newExpense.message}
                onChangeText={(text) => setNewExpense({...newExpense, message: text})}
              />
              
              <TextInput
                style={styles.expenseInput}
                placeholder="Amount"
                value={newExpense.amount}
                onChangeText={(text) => setNewExpense({...newExpense, amount: text})}
                keyboardType="numeric"
              />
              
              <View style={styles.expenseModalButtons}>
                <TouchableOpacity 
                  style={[styles.expenseModalButton, styles.cancelButton]}
                  onPress={() => setExpenseModalVisible(false)}
                >
                  <Text style={styles.expenseModalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.expenseModalButton, styles.addExpenseButton]}
                  onPress={addExpense}
                >
                  <Text style={styles.expenseModalButtonText}>Add Expense</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  closeButton: {
    fontSize: 24,
    color: colors.danger,
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  availableText: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 5,
  },
  expensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  expenseTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  expenseMessage: {
    fontSize: 14,
    color: colors.textDark,
    flexShrink: 1,
    maxWidth: '70%',
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
    // marginLeft: 10,
  },
  deleteButton: {
    backgroundColor: colors.dangerLight,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  noExpensesText: {
    textAlign: 'center',
    color: colors.gray,
    marginVertical: 10,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  expenseModal: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  expenseModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  expenseInput: {
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  expenseModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expenseModalButton: {
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.grayLight,
  },
  addExpenseButton: {
    backgroundColor: colors.primary,
  },
  expenseModalButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default EditSaleSheetModal;