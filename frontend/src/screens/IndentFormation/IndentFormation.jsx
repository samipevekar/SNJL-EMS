import React, {useState, useEffect} from 'react';
import {useForm, useFieldArray, Controller} from 'react-hook-form';
import {useDispatch, useSelector} from 'react-redux';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import {selectUser} from '../../redux/slice/authSlice';
import {
  selectIndentStatus,
  addIndentAsync,
  resetIndentState,
  selectIndentData,
  selectIndentError,
} from '../../redux/slice/indentSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import {getBrandsAsync, selectBrands} from '../../redux/slice/brandSlice';
import colors from '../../theme/colors';

const {width} = Dimensions.get('window');

const IndentFormation = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const indentStatus = useSelector(selectIndentStatus);
  const indentData = useSelector(selectIndentData);
  const error = useSelector(selectIndentError);
  const brandOptions = useSelector(selectBrands);

  const [shopIdLocked, setShopIdLocked] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [brandModalVisible, setBrandModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBrandIndex, setCurrentBrandIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    dispatch(getBrandsAsync({type: 'foreign'}));
  }, []);

  const {
    control,
    handleSubmit,
    formState: {errors},
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      shop_id: user?.shop_id || '',
      brand: [{brand_name: '', volume_ml: '', cases: ''}],
    },
  });

  const {fields, append, remove} = useFieldArray({
    control,
    name: 'brand',
  });

  const watchBrands = watch('brand');
  const shopId = watch('shop_id');

  const onSubmit = data => {
    const formattedData = {
      ...data,
      brand: data.brand.map(item => ({
        brand_name: item.brand_name,
        volume_ml: Number(item.volume_ml) || 0,
        cases: Number(item.cases) || 0,
      })),
    };

    dispatch(addIndentAsync(formattedData));
  };

  useEffect(() => {
    if (indentStatus === 'succeeded') {
      Alert.alert('Success', 'Indent added successfully!');
      setPreviewData(indentData); // Store the data for preview
      setShowPreview(true);
      setTimeout(() => {
        dispatch(resetIndentState());
      }, 3000);
    } else if (indentStatus === 'failed') {
      Alert.alert('Error', error || 'Failed to add indent');
    }
  }, [indentStatus, dispatch, error]);

  const totalCases = watchBrands?.reduce(
    (sum, item) => sum + (Number(item.cases) || 0),
    0,
  );

  const handleAddBrand = () => {
    append({brand_name: '', volume_ml: '', cases: ''});
  };

  const handleRemoveAllBrands = () => {
    setValue('brand', [{brand_name: '', volume_ml: '', cases: ''}]);
    setShopIdLocked(false);
    setShowPreview(false);
    setPreviewData(null);
  };

  const generatePDF = async () => {
    setLoading(true);
    const htmlContent = `
      <div style="padding: 24px; text-align: center; font-family: Arial, sans-serif;">
        <h1 style="text-align:center;">Indent Summary</h1>
        <p><strong>Shop ID:</strong> ${previewData?.shop_id}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
        <table style="width:100%; border-collapse:collapse; margin-top: 20px;" border="1">
          <thead>
            <tr>
              <th style="padding: 8px;">Brand</th>
              <th style="padding: 8px;">Volume (ml)</th>
              <th style="padding: 8px;">Cases</th>
              <th style="padding: 8px;">Duty</th>
              <th style="padding: 8px;">Cost Price</th>
            </tr>
          </thead>
          <tbody>
            ${previewData?.brand
              ?.map(
                item => `
                  <tr>
                    <td style="padding: 8px;">${item.brand_name}</td>
                    <td style="padding: 8px;">${item.volume_ml}</td>
                    <td style="padding: 8px;">${item.cases}</td>
                    <td style="padding: 8px;">${item.duty}</td>
                    <td style="padding: 8px;">${item.cost_price}</td>
                  </tr>
                `,
              )
              .join('')}
            <tr>
              <td style="padding: 8px;" colspan="2"><strong>Total</strong></td>
              <td style="padding: 8px;"><strong>${previewData?.total_cases}</strong></td>
              <td style="padding: 8px;"><strong>${previewData?.total_duty}</strong></td>
              <td style="padding: 8px;"><strong>${previewData?.total_cost_price}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    try {
      const options = {
        html: htmlContent,
        fileName: `Indent_${previewData?.shop_id}_${Date.now()}`,
        directory: 'Documents',
      };

      const file = await RNHTMLtoPDF.convert(options);
      await Share.open({
        url: `file://${file.filePath}`,
        type: 'application/pdf',
        title: 'Share Indent PDF',
      });
      setLoading(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to export PDF');
      console.error(err);
      setLoading(false);
    }
  };

  const filteredBrands = brandOptions.filter(brand =>
    brand.brand_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderBrandItem = ({item, index}) => (
    <View style={styles.brandItemContainer}>
      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, {flex: 2}]}>
          <Text style={styles.label}>Brand Name *</Text>
          <Controller
            name={`brand.${index}.brand_name`}
            control={control}
            rules={{required: 'Brand name is required'}}
            render={({field: {value}}) => (
              <>
                <TouchableOpacity
                  style={[
                    styles.brandInput,
                    errors.brand?.[index]?.brand_name && styles.errorInput,
                  ]}
                  onPress={() => {
                    setCurrentBrandIndex(index);
                    setBrandModalVisible(true);
                  }}>
                  <Text
                    style={value ? styles.pickerText : styles.placeholderText}>
                    {value || 'Select Brand'}
                  </Text>
                  <Icon name="arrow-drop-down" size={24} color={colors.primary} />
                </TouchableOpacity>
                {errors.brand?.[index]?.brand_name && (
                  <Text style={styles.errorText}>
                    {errors.brand[index].brand_name.message}
                  </Text>
                )}
              </>
            )}
          />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Volume (ml) *</Text>
          <Controller
            name={`brand.${index}.volume_ml`}
            control={control}
            rules={{
              required: 'Volume is required',
              min: {value: 1, message: 'Must be at least 1'},
            }}
            render={({field: {onChange, value}}) => (
              <TextInput
                style={[styles.input, errors.brand?.[index]?.volume_ml && styles.errorInput]}
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholder="0"
              />
            )}
          />
          {errors.brand?.[index]?.volume_ml && (
            <Text style={styles.errorText}>
              {errors.brand[index].volume_ml.message}
            </Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Cases *</Text>
          <Controller
            name={`brand.${index}.cases`}
            control={control}
            rules={{
              required: 'Cases is required',
              min: {value: 1, message: 'Must be at least 1'},
            }}
            render={({field: {onChange, value}}) => (
              <TextInput
                style={[styles.input, errors.brand?.[index]?.cases && styles.errorInput]}
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholder="0"
              />
            )}
          />
          {errors.brand?.[index]?.cases && (
            <Text style={styles.errorText}>
              {errors.brand[index].cases.message}
            </Text>
          )}
        </View>
      </View>

      {index > 0 && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => remove(index)}>
          <Icon name="remove-circle" size={24} color={colors.danger} />
          <Text style={styles.removeButtonText}>Remove Brand</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.header}>Add New Indent</Text>

      <View style={styles.shopIdContainer}>
        <Text style={styles.label}>Shop ID</Text>
        <Controller
          name="shop_id"
          control={control}
          rules={{required: 'Shop ID is required'}}
          render={({field: {onChange, value}}) => (
            <TextInput
              style={[
                styles.input, 
                shopIdLocked && styles.disabledInput,
                errors.shop_id && styles.errorInput
              ]}
              value={value}
              onChangeText={onChange}
              editable={!shopIdLocked}
              placeholder="Enter Shop ID"
            />
          )}
        />
        {errors.shop_id && (
          <Text style={styles.errorText}>{errors.shop_id.message}</Text>
        )}
      </View>

      <Text style={styles.sectionHeader}>Brand Information</Text>

      <FlatList
        data={fields}
        renderItem={renderBrandItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleAddBrand}>
          <Icon name="add-circle" size={24} color={colors.success} />
          <Text style={styles.secondaryButtonText}>Add Brand</Text>
        </TouchableOpacity>

        {fields.length > 1 && (
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleRemoveAllBrands}>
            <Icon name="delete" size={24} color={colors.danger} />
            <Text style={styles.dangerButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit(onSubmit)}
        disabled={indentStatus === 'loading'}>
        <Text style={styles.submitButtonText}>
          {indentStatus === 'loading' ? 'Submitting...' : 'Submit Indent'}
        </Text>
      </TouchableOpacity>

      {/* Brand Selection Modal */}
      <Modal
        visible={brandModalVisible}
        animationType="slide"
        transparent={false}>
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
              }}>
              <Icon name="close" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={filteredBrands}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.brandItem}
                onPress={() => {
                  setValue(`brand.${currentBrandIndex}.brand_name`, item.brand_name);
                  setValue(`brand.${currentBrandIndex}.volume_ml`, item.volume_ml.toString());
                  setBrandModalVisible(false);
                  setSearchQuery('');
                }}>
                <Text style={styles.brandText}>{item.brand_name} ({item.volume_ml}ml)</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </Modal>

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPreview(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.previewModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Indent Preview</Text>
              <Pressable onPress={() => setShowPreview(false)}>
                <Icon name="close" size={24} color={colors.danger} />
              </Pressable>
            </View>

            <ScrollView style={styles.previewScroll}>
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>
                  Shop ID: <Text style={styles.previewValue}>{previewData?.shop_id}</Text>
                </Text>
                <Text style={styles.previewLabel}>
                  Date:{' '}
                  <Text style={styles.previewValue}>
                    {previewData?.indent_date ? 
                      new Date(previewData.indent_date).toLocaleDateString('en-GB') : 
                      new Date().toLocaleDateString('en-GB')}
                  </Text>
                </Text>
              </View>

              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableHeaderText, styles.brandCol]}>
                    Brand
                  </Text>
                  <Text style={styles.tableHeaderText}>Volume</Text>
                  <Text style={styles.tableHeaderText}>Cases</Text>
                  <Text style={styles.tableHeaderText}>Duty</Text>
                  <Text style={styles.tableHeaderText}>Cost Price</Text>
                </View>

                {previewData?.brand?.map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.brandCol]}>
                      {item.brand_name}
                    </Text>
                    <Text style={styles.tableCell}>{item.volume_ml}ml</Text>
                    <Text style={styles.tableCell}>{item.cases}</Text>
                    <Text style={styles.tableCell}>{item.duty}</Text>
                    <Text style={styles.tableCell}>{item.cost_price}</Text>
                  </View>
                ))}

                <View style={[styles.tableRow, styles.tableFooter]}>
                  <Text style={[styles.tableFooterText, styles.brandCol]}>
                    Total
                  </Text>
                  <Text style={styles.tableFooterText}></Text>
                  <Text style={styles.tableFooterText}>{previewData?.total_cases}</Text>
                  <Text style={styles.tableFooterText}>{previewData?.total_duty}</Text>
                  <Text style={styles.tableFooterText}>{previewData?.total_cost_price}</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, {marginBottom: 10}]}
                onPress={generatePDF}
                disabled={loading}>
                <Text style={styles.modalButtonText}>
                  {loading ? 'Exporting...' : 'Export as PDF'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowPreview(false)}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 20,
    textAlign: 'center',
  },
  shopIdContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    color: '#495057',
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderColor: '#dee2e6',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: 'white',
    fontSize: 16,
  },
  brandInput: {
    height: 50,
    borderColor: '#dee2e6',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabledInput: {
    backgroundColor: '#e9ecef',
    color: '#495057',
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
  },
  placeholderText: {
    flex: 1,
    fontSize: 16,
    color: '#6c757d',
  },
  brandItemContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inputContainer: {
    flex: 1,
    marginRight: 10,
  },
  errorText: {
    color: '#d9534f',
    fontSize: 12,
    marginTop: 5,
  },
  errorInput: {
    borderColor: '#d9534f',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  removeButtonText: {
    color: '#d9534f',
    marginLeft: 5,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 5,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#28a745',
    flex: 1,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#28a745',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9534f',
    flex: 1,
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: '#d9534f',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#495057',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  previewModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: width * 0.9,
    maxHeight: '80%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dee2e6',
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  closeButton: {
    padding: 8,
  },
  brandItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    backgroundColor: 'white',
  },
  brandText: {
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#495057',
  },
  previewScroll: {
    paddingHorizontal: 15,
  },
  previewSection: {
    marginVertical: 15,
  },
  previewLabel: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 5,
    fontWeight: '500',
  },
  previewValue: {
    fontWeight: 'normal',
  },
  table: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#dee2e6',
    padding: 12,
  },
  tableHeader: {
    backgroundColor: '#e9ecef',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  brandCol: {
    flex: 2,
    textAlign: 'left',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
  },
  tableFooter: {
    backgroundColor: '#e9ecef',
  },
  tableFooterText: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  modalFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  modalButton: {
    backgroundColor: '#495057',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default IndentFormation;