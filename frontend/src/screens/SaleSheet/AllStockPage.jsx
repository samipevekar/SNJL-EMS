import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {Controller, useForm} from 'react-hook-form';
import colors from '../../theme/colors';
import StockCard from '../../components/StockCard';
import {
  fetchStockIncrementBrands,
  updateStockIncrement,
  selectStockIncrementBrands,
  selectStockIncrementBrandsStatus,
  selectStockIncrementBrandsError,
  selectUpdateStockStatus,
  selectUpdateStockError,
  resetUpdateStockStatus,
} from '../../redux/slice/stockIncrementSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {ScrollView, TextInput} from 'react-native-gesture-handler';
import {selectUser} from '../../redux/slice/authSlice';
import {getWarehousesAsync, selectWarehouses} from '../../redux/slice/warehouseSlice';
import {getBrandsAsync, selectBrands, selectBrandsStatus, clearBrands} from '../../redux/slice/brandSlice';

const AllStockPage = () => {
  const dispatch = useDispatch();
  const stocks = useSelector(selectStockIncrementBrands);
  const user = useSelector(selectUser);
  const status = useSelector(selectStockIncrementBrandsStatus);
  const error = useSelector(selectStockIncrementBrandsError);
  const updateStatus = useSelector(selectUpdateStockStatus);
  const updateError = useSelector(selectUpdateStockError);
  const shopId = user?.assigned_shops?.[0] || null;
  
  // New state for selection modals
  const [brandModalVisible, setBrandModalVisible] = useState(false);
  const [warehouseModalVisible, setWarehouseModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentField, setCurrentField] = useState(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  
  // Selectors for brands and warehouses
  const brandOptions = useSelector(selectBrands);
  const warehouseOptions = useSelector(selectWarehouses);
  const brandStatus = useSelector(selectBrandsStatus);
  const filteredBrands = brandOptions.filter(brand =>
    brand.brand_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: {errors},
  } = useForm();

  useEffect(() => {
    if (shopId) {
      dispatch(fetchStockIncrementBrands(shopId));
      dispatch(getWarehousesAsync());
    }
  }, [dispatch, shopId]);

  useEffect(() => {
    if (updateStatus === 'succeeded') {
      setIsModalVisible(false);
      dispatch(fetchStockIncrementBrands(shopId));
      dispatch(resetUpdateStockStatus());
      Alert.alert('Success', 'Stock updated successfully');
    }
  }, [updateStatus, dispatch, shopId]);

  const handleEdit = (stock) => {
    setSelectedStock(stock);
    reset({
      bill_id: stock.bill_id.toString(),
      brand_name: stock.brand_name,
      volume_ml: stock.volume_ml.toString(),
      warehouse_name: stock.warehouse_name,
      cases: stock.cases.toString(),
    });
    setIsModalVisible(true);
    
    // Load brands when opening edit modal
    dispatch(clearBrands());
    dispatch(getBrandsAsync({ type: stock.liquor_type }));
  };

  const onSubmit = (data) => {
    const updatedData = {
      shop_id: shopId, // Using the shopId from user directly
      bill_id: parseInt(data.bill_id),
      brand_name: data.brand_name,
      volume_ml: parseInt(data.volume_ml),
      warehouse_name: data.warehouse_name,
      cases: parseInt(data.cases),
    };
    
    dispatch(updateStockIncrement({ 
      id: selectedStock.id, 
      stockData: updatedData 
    }));
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setBrandModalVisible(false);
    setWarehouseModalVisible(false);
    setSearchQuery('');
    dispatch(resetUpdateStockStatus());
  };

  if (status === 'loading') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    Alert.alert('Error', error);
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTxt}>All Stocks</Text>
      </View>

      <FlatList
        data={stocks}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => <StockCard stock={item} onEdit={handleEdit} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No stock records found</Text>
          </View>
        }
      />

      {/* Edit Stock Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Icon name="close" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Stock</Text>
            <View style={{width: 24}} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Bill ID*</Text>
              <Controller
                control={control}
                rules={{required: 'Bill ID is required'}}
                render={({field: {onChange, value}}) => (
                  <TextInput
                    style={[styles.input, errors.bill_id && styles.errorInput]}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    placeholder="Enter bill ID"
                  />
                )}
                name="bill_id"
                defaultValue=""
              />
              {errors.bill_id && (
                <Text style={styles.errorText}>{errors.bill_id.message}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Brand Name*</Text>
              <Controller
                control={control}
                rules={{required: 'Brand name is required'}}
                render={({field: {value}}) => (
                  <>
                    <TouchableOpacity
                      style={[styles.input, errors.brand_name && styles.errorInput]}
                      onPress={() => {
                        setCurrentField('brand_name');
                        setBrandModalVisible(true);
                      }}
                    >
                      <Text style={value ? styles.pickerText : styles.placeholderText}>
                        {value || 'Select Brand'}
                      </Text>
                      <Icon name="chevron-down" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    {errors.brand_name && (
                      <Text style={styles.errorText}>{errors.brand_name.message}</Text>
                    )}
                  </>
                )}
                name="brand_name"
                defaultValue=""
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Volume (ml)*</Text>
              <Controller
                control={control}
                rules={{required: 'Volume is required'}}
                render={({field: {onChange, value}}) => (
                  <TextInput
                    style={[styles.input, errors.volume_ml && styles.errorInput]}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    placeholder="Enter volume in ml"
                    editable={false}
                  />
                )}
                name="volume_ml"
                defaultValue=""
              />
              {errors.volume_ml && (
                <Text style={styles.errorText}>{errors.volume_ml.message}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Warehouse*</Text>
              <Controller
                control={control}
                rules={{required: 'Warehouse is required'}}
                render={({field: {value}}) => (
                  <>
                    <TouchableOpacity
                      style={[styles.input, errors.warehouse_name && styles.errorInput]}
                      onPress={() => {
                        setCurrentField('warehouse_name');
                        setWarehouseModalVisible(true);
                      }}
                    >
                      <Text style={value ? styles.pickerText : styles.placeholderText}>
                        {value || 'Select Warehouse'}
                      </Text>
                      <Icon name="chevron-down" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    {errors.warehouse_name && (
                      <Text style={styles.errorText}>{errors.warehouse_name.message}</Text>
                    )}
                  </>
                )}
                name="warehouse_name"
                defaultValue=""
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Cases*</Text>
              <Controller
                control={control}
                rules={{required: 'Cases is required'}}
                render={({field: {onChange, value}}) => (
                  <TextInput
                    style={[styles.input, errors.cases && styles.errorInput]}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    placeholder="Enter number of cases"
                  />
                )}
                name="cases"
                defaultValue=""
              />
              {errors.cases && (
                <Text style={styles.errorText}>{errors.cases.message}</Text>
              )}
            </View>

            {updateError && (
              <Text style={[styles.errorText, {textAlign: 'center', marginBottom: 16}]}>
                {updateError}
              </Text>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={closeModal}
              disabled={updateStatus === 'loading'}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit(onSubmit)}
              disabled={updateStatus === 'loading'}>
              {updateStatus === 'loading' ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Update</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Brand Selection Modal */}
      <Modal
        visible={brandModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setBrandModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search brands..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setBrandModalVisible(false);
                setSearchQuery('');
              }}
            >
              <Icon name="close" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>
          
          {brandStatus === 'loading' ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : filteredBrands.length === 0 ? (
            <Text style={styles.noResultsText}>
              {searchQuery ? 'No matching brands found' : 'No brands available'}
            </Text>
          ) : (
            <FlatList
              data={filteredBrands}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => {
                    setValue('brand_name', item.brand_name);
                    setValue('volume_ml', item.volume_ml.toString());
                    setBrandModalVisible(false);
                    setSearchQuery('');
                  }}
                >
                  <Text style={styles.listItemText}>
                    {item.brand_name} ({item.volume_ml}ml)
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </Modal>

      {/* Warehouse Selection Modal */}
      <Modal
        visible={warehouseModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setWarehouseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Warehouse</Text>
            <TouchableOpacity onPress={() => setWarehouseModalVisible(false)}>
              <Icon name="close" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={warehouseOptions}
            keyExtractor={(item) => item.id}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => {
                  setValue('warehouse_name', item.warehouse_name);
                  setWarehouseModalVisible(false);
                }}
              >
                <Text style={styles.listItemText}>
                  {item.warehouse_name} ({item.liquor_type})
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTxt: {
    textAlign: 'center',
    fontSize: 25,
    fontWeight: '700',
    color: colors.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 16,
  },
  emptyText: {
    color: colors.textDark,
    fontSize: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginTop: 4,
  },
  errorInput: {
    borderColor: colors.danger,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: colors.textDark,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  placeholderText: {
    flex: 1,
    fontSize: 16,
    color: colors.grayDark,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  cancelButton: {
    backgroundColor: colors.secondary,
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
  },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
    backgroundColor: colors.white,
  },
  listItemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  listContent: {
    paddingBottom: 16,
  },
  noResultsText: {
    textAlign: 'center',
    padding: 16,
    color: colors.grayDark,
  },
  loader: {
    marginTop: 20,
  },
});

export default AllStockPage;