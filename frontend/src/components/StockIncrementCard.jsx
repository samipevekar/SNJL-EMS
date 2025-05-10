import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import colors from '../theme/colors';

const StockIncrementCard = ({ brand_name, volume_ml,id, onChange }) => {
  const { control, watch, setValue } = useForm({
    defaultValues: {
      sale: '',
    }
  });

  const saleValue = watch('sale');

  // Notify parent component about changes
  React.useEffect(() => {
    onChange({
      brand_name,
      volume_ml,
      sale: parseInt(saleValue) || 0,
      id
    });
  }, [saleValue]);

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
        <TextInput
          style={[styles.input, styles.saleInput]}
          placeholder="Sale Qty"
          keyboardType="numeric"
          onChangeText={(text) => {
            // Only allow numbers
            if (/^\d*$/.test(text)) {
              setValue('sale', text);
            }
          }}
          value={saleValue}
        />
      </View>
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
    flex: 1,
  },
});

export default StockIncrementCard;