import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView,
    ActivityIndicator, Alert, TextInput
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
    getAllShopsAsync,
    createShopAsync,
    editShopAsync,
    selectShops,
    selectShopLoading,
    selectShopError,
    selectShopStatus,
    clearShopStatus
} from '../../redux/slice/shopSlice';
import ShopDetailsCard from '../../components/shopDetailsCard';
import colors from '../../theme/colors';

const ShopManagement = () => {
    const dispatch = useDispatch();
    const shops = useSelector(selectShops);
    const loading = useSelector(selectShopLoading);
    const error = useSelector(selectShopError);
    const status = useSelector(selectShopStatus);

    const [modalVisible, setModalVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedShop, setSelectedShop] = useState(null);
    const [formData, setFormData] = useState({
        shop_id: '',
        shop_name: '',
        liquor_type: 'country',
        mgq: '',
        mgq_q1: '',
        mgq_q2: '',
        mgq_q3: '',
        mgq_q4: '',
        canteen: ''
    });

    useEffect(() => {
        dispatch(getAllShopsAsync());
    }, [dispatch]);

    useEffect(() => {
        if (status === 'created') {
            Alert.alert('Success', 'Shop created successfully');
            dispatch(clearShopStatus());
            setModalVisible(false);
        } else if (status === 'updated') {
            Alert.alert('Success', 'Shop updated successfully');
            dispatch(clearShopStatus());
            setModalVisible(false);
        }
    }, [status, dispatch]);

    useEffect(() => {
        if (error) {
            Alert.alert('Error', error);
            dispatch(clearShopStatus());
        }
    }, [error, dispatch]);

    const handleInputChange = (name, value) => {
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const openAddModal = () => {
        setEditMode(false);
        setFormData({
            shop_id: '',
            shop_name: '',
            liquor_type: 'country',
            mgq: '',
            mgq_q1: '',
            mgq_q2: '',
            mgq_q3: '',
            mgq_q4: '',
            canteen: ''
        });
        setModalVisible(true);
    };

    const openEditModal = (shop) => {
        setEditMode(true);
        setSelectedShop(shop);
        setFormData({
            shop_id: shop.shop_id || '',
            shop_name: shop.shop_name || '',
            liquor_type: shop.liquor_type || 'country',
            mgq: shop.mgq?.toString() || '',
            mgq_q1: shop.mgq_q1?.toString() || '',
            mgq_q2: shop.mgq_q2?.toString() || '',
            mgq_q3: shop.mgq_q3?.toString() || '',
            mgq_q4: shop.mgq_q4?.toString() || '',
            canteen: shop.canteen?.toString() || ''
        });
        setModalVisible(true);
    };

    const handleSubmit = () => {
        if (!formData.shop_id || !formData.shop_name) {
            Alert.alert('Error', 'Shop ID and Shop Name are required');
            return;
        }

        if (formData.liquor_type === 'country' && !formData.mgq) {
            Alert.alert('Error', 'MGQ is required for country liquor');
            return;
        }

        if (
            formData.liquor_type === 'foreign' &&
            (!formData.mgq_q1 || !formData.mgq_q2 || !formData.mgq_q3 || !formData.mgq_q4)
        ) {
            Alert.alert('Error', 'All quarter MGQs are required for foreign liquor');
            return;
        }

        const data = {
            ...formData,
            mgq: formData.liquor_type === 'country' ? Number(formData.mgq) || 0 : null,
            mgq_q1: formData.liquor_type === 'foreign' ? Number(formData.mgq_q1) || 0 : null,
            mgq_q2: formData.liquor_type === 'foreign' ? Number(formData.mgq_q2) || 0 : null,
            mgq_q3: formData.liquor_type === 'foreign' ? Number(formData.mgq_q3) || 0 : null,
            mgq_q4: formData.liquor_type === 'foreign' ? Number(formData.mgq_q4) || 0 : null,
            canteen: Number(formData.canteen) || 0
        };

        if (editMode) {
            dispatch(editShopAsync({ id: selectedShop.id, shopData: data }));
        } else {
            dispatch(createShopAsync(data));
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Shops Management</Text>
                <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
                    <Icon name="plus" size={24} color={colors.white} />
                </TouchableOpacity>
            </View>

            {loading && !modalVisible ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {shops.length > 0 ? (
                        shops.map(shop => (
                            <ShopDetailsCard
                                key={shop.id}
                                shop={shop}
                                onEdit={openEditModal}
                            />
                        ))
                    ) : (
                        <Text style={styles.noShopsText}>No shops found</Text>
                    )}
                </ScrollView>
            )}

            {/* Modal */}
            <Modal visible={modalVisible} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {editMode ? 'Edit Shop' : 'Add New Shop'}
                        </Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Icon name="close" size={24} color={colors.grayDark} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Shop ID</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.shop_id}
                                onChangeText={(text) => handleInputChange('shop_id', text)}
                                placeholder="Enter shop ID"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Shop Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.shop_name}
                                onChangeText={(text) => handleInputChange('shop_name', text)}
                                placeholder="Enter shop name"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Liquor Type</Text>
                            <View style={styles.radioGroup}>
                                <TouchableOpacity
                                    style={[
                                        styles.radioButton,
                                        formData.liquor_type === 'country' && styles.radioButtonSelected
                                    ]}
                                    onPress={() => handleInputChange('liquor_type', 'country')}
                                >
                                    <Text style={[
                                        styles.radioButtonText,
                                        formData.liquor_type === 'country' && styles.radioButtonTextSelected
                                    ]}>
                                        Country Liquor
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.radioButton,
                                        formData.liquor_type === 'foreign' && styles.radioButtonSelected
                                    ]}
                                    onPress={() => handleInputChange('liquor_type', 'foreign')}
                                >
                                    <Text style={[
                                        styles.radioButtonText,
                                        formData.liquor_type === 'foreign' && styles.radioButtonTextSelected
                                    ]}>
                                        Foreign Liquor
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {formData.liquor_type === 'country' ? (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>MGQ</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.mgq}
                                    onChangeText={(text) => handleInputChange('mgq', text)}
                                    placeholder="Enter MGQ"
                                    keyboardType="numeric"
                                />
                            </View>
                        ) : (
                            <>
                                {['mgq_q1', 'mgq_q2', 'mgq_q3', 'mgq_q4'].map((q, idx) => (
                                    <View style={styles.inputGroup} key={q}>
                                        <Text style={styles.label}>{`Q${idx + 1} MGQ`}</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={formData[q]}
                                            onChangeText={(text) => handleInputChange(q, text)}
                                            placeholder={`Enter Q${idx + 1} MGQ`}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                ))}
                            </>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Canteen Amount</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.canteen}
                                onChangeText={(text) => handleInputChange('canteen', text)}
                                placeholder="Enter canteen amount"
                                keyboardType="numeric"
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {editMode ? 'Update Shop' : 'Create Shop'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primary,
    },
    addButton: {
        backgroundColor: colors.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    loader: {
        marginVertical: 20,
    },
    noShopsText: {
        textAlign: 'center',
        color: colors.gray,
        marginTop: 20,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: colors.white,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.grayLight,
        paddingBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textDark,
    },
    formContainer: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textDark,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.grayLight,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.grayLight,
    },
    radioGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    radioButton: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
        backgroundColor: colors.grayLight,
        borderRadius: 8,
        marginHorizontal: 5,
    },
    radioButtonSelected: {
        backgroundColor: colors.primary,
    },
    radioButtonText: {
        color: colors.textDark,
        fontWeight: '500',
    },
    radioButtonTextSelected: {
        color: colors.white,
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
});

export default ShopManagement;
