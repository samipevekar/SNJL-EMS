// src/screens/Brand/BrandManagement.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import colors from '../../theme/colors';
import BrandCard from '../../components/BrandCard';
import BrandForm from './BrandForm';
import { getBrandsAsync, addBrandAsync, editBrandAsync } from '../../redux/slice/brandSlice';
import { selectBrands, selectBrandsStatus, selectBrandsLoading, selectBrandsError } from '../../redux/slice/brandSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const BrandManagement = () => {
    const dispatch = useDispatch();
    const brands = useSelector(selectBrands);
    const status = useSelector(selectBrandsStatus);
    const loading = useSelector(selectBrandsLoading);
    const error = useSelector(selectBrandsError);

    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);

    useEffect(() => {
        dispatch(getBrandsAsync({ type:'' }));
    }, [dispatch]);

    const filteredBrands = brands.filter(brand => 
        brand.brand_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddBrand = () => {
        setEditingBrand(null);
        setShowForm(true);
    };

    const handleEditBrand = (brand) => {
        setEditingBrand(brand);
        setShowForm(true);
    };

    const handleSubmit = (brandData) => {
        if (editingBrand) {
            dispatch(editBrandAsync({ id: editingBrand.id, brandData }))
                .then(() => setShowForm(false));
        } else {
            dispatch(addBrandAsync(brandData))
                .then(() => setShowForm(false));
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Brand Management</Text>
                <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={handleAddBrand}
                    testID="add-brand-button"
                >
                    <Icon name="plus" size={24} color={colors.white} />
                </TouchableOpacity>
            </View>

            <View style={styles.filterContainer}>
                <View style={styles.searchContainer}>
                    <Icon name="magnify" size={20} color={colors.grayDark} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search brands..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={colors.grayDark}
                    />
                </View>
            </View>

            {status === 'loading' ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : filteredBrands.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>No brands found</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredBrands}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <BrandCard brand={item} onEdit={handleEditBrand} />
                    )}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <Modal
                visible={showForm}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowForm(false)}
            >
                <BrandForm
                    initialData={editingBrand}
                    onSubmit={handleSubmit}
                    loading={loading}
                    onCancel={() => setShowForm(false)}
                />
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
    filterContainer: {
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.secondary,
    },
    searchInput: {
        flex: 1,
        height: 40,
        paddingLeft: 8,
        color: colors.textDark,
    },
    typeFilter: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.secondary,
    },
    activeFilter: {
        backgroundColor: colors.primary,
    },
    filterButtonText: {
        color: colors.white,
        fontWeight: '500',
    },
    listContainer: {
        paddingBottom: 20,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: colors.danger,
        fontSize: 16,
        textAlign: 'center',
    },
    emptyText: {
        color: colors.textDark,
        fontSize: 16,
    },
});

export default BrandManagement;