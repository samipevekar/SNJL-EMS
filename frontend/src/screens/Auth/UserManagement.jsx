import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { 
  getUsersAsync, 
  registerUserAsync, 
  editUserAsync, 
  selectUsersLoading, 
  selectUsersError, 
  selectLoginUserStatus,
  selectUser, 
  selectUsers 
} from '../../redux/slice/authSlice';
import UserCard from '../../components/UserCard';
import colors from '../../theme/colors';

const UserManagement = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers);
  const loading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);
  const currentUser = useSelector(selectUser);
  const formLoading = useSelector(selectLoginUserStatus)
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [assignedShopsInput, setAssignedShopsInput] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'user',
      assigned_shops: []
    }
  });

  useEffect(() => {
    dispatch(getUsersAsync(roleFilter));
  }, [roleFilter]);

  const onSubmit = async (data) => {
    try {
      // Convert assigned shops string to array of NUMBERS
      const assignedShopsArray = assignedShopsInput 
        ? assignedShopsInput.split(',')
            .map(shop => shop.trim())
            .filter(shop => shop)
            .map(shop => Number(shop)) // Convert to numbers
            .filter(shop => !isNaN(shop)) // Remove any NaN values
        : [];

      const userData = {
        name: data.name,
        email: data.email,
        role: data.role,
        assigned_shops: assignedShopsArray
      };

      // Include password only if it's provided (for both edit and create)
      if (data.password) {
        userData.password = data.password;
      }

      if (editMode) {
        const result = await dispatch(editUserAsync({ 
          userId: selectedUser?.id, 
          userData 
        })).unwrap();
        Alert.alert('Success', result.message || 'User updated successfully');
      } else {
        // For new users, password is required
        if (!data.password) {
          throw new Error('Password is required for new users');
        }
        const result = await dispatch(registerUserAsync({
          ...userData,
          password: data.password
        })).unwrap();
        Alert.alert('Success', result.message || 'User created successfully');
      }
      
      closeModal();
      dispatch(getUsersAsync(roleFilter));
    } catch (error) {
      Alert.alert('Error', error.message || error || 'Something went wrong');
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setShowPasswordField(true); // Always show password field for new users
    setAssignedShopsInput('');
    reset({
      name: '',
      email: '',
      password: '',
      role: 'user',
      assigned_shops: []
    });
    setModalVisible(true);
  };

  const openEditModal = (user) => {
    setEditMode(true);
    setSelectedUser(user);
    setShowPasswordField(false); // Initially hide password field for edits
    setAssignedShopsInput(user?.assigned_shops?.join(', ') || '');
    reset({
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      role: user?.role || 'user',
      assigned_shops: user?.assigned_shops || []
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setAssignedShopsInput('');
    setShowPasswordField(false);
  };

  const togglePasswordField = () => {
    setShowPasswordField(!showPasswordField);
    if (!showPasswordField) {
      reset({ ...control._formValues, password: '' });
    }
  };

  const filteredUsers = users?.filter(user => {
    if (!roleFilter) return true;
    return user.role === roleFilter;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        
        {currentUser?.role !== 'user' && (
          <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
            <Icon name="plus" size={24} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, !roleFilter && styles.activeFilter]}
          onPress={() => setRoleFilter('')}
        >
          <Text style={[styles.filterText, !roleFilter && styles.activeFilterText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, roleFilter === 'manager' && styles.activeFilter]}
          onPress={() => setRoleFilter('manager')}
        >
          <Text style={[styles.filterText, roleFilter === 'manager' && styles.activeFilterText]}>Managers</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, roleFilter === 'user' && styles.activeFilter]}
          onPress={() => setRoleFilter('user')}
        >
          <Text style={[styles.filterText, roleFilter === 'user' && styles.activeFilterText]}>Users</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      )}

      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredUsers && filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <UserCard 
              key={user.id} 
              user={user} 
              onEdit={openEditModal}
              currentUserRole={currentUser?.role}
            />
          ))
        ) : (
          <Text style={styles.noUsersText}>No users found</Text>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit User' : 'Add New User'}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Icon name="close" size={24} color={colors.grayDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <Controller
              control={control}
              rules={{ required: 'Name is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    style={styles.input}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="Enter full name"
                  />
                  {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
                </View>
              )}
              name="name"
            />

            <Controller
              control={control}
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="Enter email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={true}
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
                </View>
              )}
              name="email"
            />

            {/* Password Field - Always shown for new users, conditionally for edits */}
            {(!editMode || showPasswordField) && (
              <Controller
                control={control}
                rules={{
                  required: editMode ? false : 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                      {editMode ? 'New Password' : 'Password'}
                    </Text>
                    <TextInput
                      style={styles.input}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder={editMode ? 'Leave blank to keep current' : 'Enter password'}
                      secureTextEntry
                    />
                    {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
                  </View>
                )}
                name="password"
              />
            )}

            {/* Show "Change Password" button for edit mode */}
            {editMode && !showPasswordField && (
              <TouchableOpacity 
                style={styles.changePasswordButton}
                onPress={togglePasswordField}
              >
                <Text style={styles.changePasswordText}>Change Password</Text>
              </TouchableOpacity>
            )}

            {currentUser?.role === 'super_user' && (
              <Controller
                control={control}
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Role</Text>
                    <View style={styles.roleOptions}>
                      <TouchableOpacity
                        style={[styles.roleButton, value === 'manager' && styles.roleButtonActive]}
                        onPress={() => onChange('manager')}
                      >
                        <Text style={[styles.roleButtonText, value === 'manager' && styles.roleButtonTextActive]}>
                          Manager
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.roleButton, value === 'user' && styles.roleButtonActive]}
                        onPress={() => onChange('user')}
                      >
                        <Text style={[styles.roleButtonText, value === 'user' && styles.roleButtonTextActive]}>
                          User
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                name="role"
              />
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Assigned Shops (comma separated)</Text>
              <TextInput
                style={styles.input}
                onChangeText={setAssignedShopsInput}
                value={assignedShopsInput}
                placeholder="e.g. 1, 2, 3"
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmit(onSubmit)}
            >
              <Text style={styles.submitButtonText}>
                {editMode ? (formLoading === 'loading' ? <ActivityIndicator color={colors.white} size={'small'}/> : 'Update User') : (formLoading === 'loading' ? <ActivityIndicator color={colors.white} size={'small'}/> : 'Create User')}
              </Text>
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
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 5,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeFilter: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.textDark,
    fontWeight: '500',
  },
  activeFilterText: {
    color: colors.white,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
    marginVertical: 10,
  },
  noUsersText: {
    textAlign: 'center',
    color: colors.grayDark,
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
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: colors.textDark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.grayLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginTop: 5,
  },
  roleOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
  },
  roleButtonText: {
    color: colors.textDark,
    fontWeight: '500',
  },
  roleButtonTextActive: {
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
  changePasswordButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  changePasswordText: {
    color: colors.white,
    fontWeight: '500',
  },
});

export default UserManagement;