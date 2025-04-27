import React, { useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard, 
  Pressable
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';

import StockIncrementCard from '../../components/StockIncrementCard';
import { selectUser } from '../../redux/slice/authSlice';
import { 
  fetchStockIncrementBrands, 
  selectStockIncrementBrands, 
  selectStockIncrementBrandsStatus 
} from '../../redux/slice/stockIncrementSlice';

import { 
  createSaleSheetAsync, 
  clearSaleSheetStatus, 
  selectSaleSheetStatus, 
  selectSaleSheetError 
} from '../../redux/slice/saleSheetSlice';

import colors from '../../theme/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';


const RecordSalePage = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const brands = useSelector(selectStockIncrementBrands);
  const status = useSelector(selectStockIncrementBrandsStatus);
  const createStatus = useSelector(selectSaleSheetStatus);
  const createError = useSelector(selectSaleSheetError);
  const shopId = user?.assigned_shops?.length > 0 ? user.assigned_shops[0] : null;

  useFocusEffect(
    useCallback(() => {
      if (shopId) {
        dispatch(fetchStockIncrementBrands(shopId));
      }
      return () => {
        dispatch(clearSaleSheetStatus());
      };
    }, [dispatch, shopId])
  );

  const handleAddSale = async (saleData) => {
    if (!shopId) {
      Alert.alert('Error', 'Shop ID not available');
      return;
    }

    try {
      const formData = {
        shop_id: shopId,
        brand_name: saleData.brand_name,
        volume_ml: saleData.volume_ml,
        sale: saleData.sale,
        upi: saleData.upi || 0,
        expenses: saleData.expenses || []
      };

      const result = await dispatch(createSaleSheetAsync(formData)).unwrap();

      if (result.success) {
        Alert.alert('Success', 'Sale recorded successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to record sale');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to record sale');
    }
  };

  if (createStatus === 'loading' || status === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (status === 'failed') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load brands</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Record Sales</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('SaleSheetPage')} 
              style={styles.salesBtn}
            >
              <Text style={styles.salesTxt}>All Sales</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.addStock} onPress={()=> navigation.navigate('StockIncrementForm')}>
            <Icon name="add-circle" size={24} color={colors.primary} />
            <Text style={styles.stockTxt}>Add Stock</Text>
          </TouchableOpacity>

          {brands.length === 0 ? (
            <Text style={styles.emptyText}>No brands found for this shop</Text>
          ) : (
            <FlatList
              data={brands}
              keyExtractor={(item, index) => `${item.brand_name}-${item.volume_ml}-${index}`}
              renderItem={({ item, index }) => (
                <StockIncrementCard
                  brand_name={item.brand_name}
                  volume_ml={item.volume_ml}
                  // showUpi={index === 0}
                  onAddSale={handleAddSale}
                />
              )}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 16,
  },
  salesBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 10,
  },
  salesTxt: {
    color: colors.white,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 30,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: colors.grayDark,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: colors.danger,
  },
  addStock:{
    display:'flex',
    flexDirection:'row',
    justifyContent:'center',
    alignItems:'center',
    marginVertical:10,
    gap:5,
    backgroundColor:colors.secondary,
    paddingVertical:5,
    paddingHorizontal:10,
    marginHorizontal:10,
    borderRadius:8


  },
  stockTxt:{
    fontSize:16,
    fontWeight:'500',
    color:colors.primary
  }
});

export default RecordSalePage;