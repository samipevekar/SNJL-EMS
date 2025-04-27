// src/screens/AddExpenseScreen.js
import React, { useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { addExpenseAsync, resetExpenseState, selectExpenseError, selectExpenseStatus, selectExpenseSuccess } from '../../redux/slice/expenseSlice';
import colors from '../../theme/colors';
import { selectUser } from '../../redux/slice/authSlice';

const ExpenseForm = () => {
  const dispatch = useDispatch();
  const status = useSelector(selectExpenseStatus);
  const error = useSelector(selectExpenseError);
  const success = useSelector(selectExpenseSuccess);
  const user = useSelector(selectUser);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      shop_id: '',
      user_id: user?.id || '',
      amount: '',
      message: '',
    }
  });


  const onSubmit = (data) => {
    if (!data.amount || !data.message) {
      Alert.alert('Error', 'Amount and message are required');
      return;
    }

    const expenseData = {
      ...data,
      amount: parseFloat(data.amount),
      user_id: user?.id
    };

    dispatch(addExpenseAsync(expenseData));
  };

  useEffect(() => {
    if (success) {
      Alert.alert('Success', 'Expense added successfully');
      reset({
        shop_id: '',
        user_id: user?.id || '',
        amount: '',
        message: '',
      });
      dispatch(resetExpenseState());
    }

    if (error) {
      Alert.alert('Error', error);
      dispatch(resetExpenseState());
    }
  }, [success, error, reset, dispatch, user]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Add Expense</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Shop ID</Text>
        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Enter Shop ID"
              keyboardType="numeric"
            />
          )}
          name="shop_id"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Amount</Text>
        <Controller
          control={control}
          rules={{
            required: 'Amount is required',
            pattern: {
              value: /^\d+(\.\d{1,2})?$/,
              message: 'Please enter a valid amount'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.amount && styles.errorInput]}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Enter Amount"
              keyboardType="numeric"
            />
          )}
          name="amount"
        />
        {errors.amount && (
          <Text style={styles.errorText}>{errors.amount.message}</Text>
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Message</Text>
        <Controller
          control={control}
          rules={{
            required: 'Message is required',
            minLength: {
              value: 3,
              message: 'Message should be at least 3 characters'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.message && styles.errorInput]}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Enter Message"
              multiline
            />
          )}
          name="message"
        />
        {errors.message && (
          <Text style={styles.errorText}>{errors.message.message}</Text>
        )}
      </View>

      {/* <View style={styles.formGroup}>
        <Text style={styles.label}>Liquor Type</Text>
        <View style={styles.radioGroup}>
          {liquorTypes.map((type) => (
            <Controller
              key={type}
              control={control}
              name="liquor_type"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => onChange(type)}
                >
                  <View style={[
                    styles.radioOuter,
                    value === type && styles.radioOuterSelected
                  ]}>
                    {value === type && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.radioLabel}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              )}
            />
          ))}
        </View>
      </View> */}

      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={handleSubmit(onSubmit)}
        disabled={status === 'loading'}
      >
        <Text style={styles.submitButtonText}>
          {status === 'loading' ? 'Submitting...' : 'Submit Expense'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 80,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: colors.textDark,
  },
  input: {
    height: 40,
    borderColor: colors.grayDark,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: colors.white,
  },
  errorInput: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 5,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 10,
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: 16,
    color: colors.textDark,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ExpenseForm;