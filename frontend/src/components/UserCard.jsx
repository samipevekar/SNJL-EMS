import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../theme/colors';

const UserCard = ({user, onEdit, currentUserRole}) => {
  const canEdit = currentUserRole === 'super_user' || 
                 (currentUserRole === 'manager' && user.role === 'user');

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Icon 
          name={user.role === 'super_user' ? 'shield-crown' : 
                user.role === 'manager' ? 'account-tie' : 'account'} 
          size={24} 
          color={colors.primary} 
        />
        <Text style={styles.name}>{user.name}</Text>
        {canEdit && (
          <TouchableOpacity onPress={() => onEdit(user)} style={styles.editButton}>
            <Icon name="pencil" size={18} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={styles.email}>{user.email}</Text>
      <View style={styles.roleContainer}>
        <Text style={[
          styles.role,
          user.role === 'super_user' && styles.superUser,
          user.role === 'manager' && styles.manager,
          user.role === 'user' && styles.user
        ]}>
          {user.role.toUpperCase()}
        </Text>
      </View>
      
      {user.assigned_shops?.length > 0 && (
        <View style={styles.shopsContainer}>
          <Text style={styles.shopsLabel}>Assigned Shops:</Text>
          {user.assigned_shops.map((shopId, index) => (
            <Text key={index} style={styles.shopId}>#{shopId}</Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginLeft: 10,
    flex: 1,
  },
  email: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 8,
  },
  roleContainer: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  role: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  superUser: {
    backgroundColor: colors.dangerLight,
    color: colors.danger,
  },
  manager: {
    backgroundColor: colors.warningLight,
    color: colors.warning,
  },
  user: {
    backgroundColor: colors.successLight,
    color: colors.success,
  },
  shopsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  shopsLabel: {
    fontSize: 12,
    color: colors.textDark,
    marginRight: 5,
  },
  shopId: {
    fontSize: 12,
    backgroundColor: colors.grayLight,
    color: colors.textDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 5,
    marginBottom: 3,
  },
  editButton: {
    backgroundColor: colors.primary,
    padding: 6,
    borderRadius: 20,
  },
});

export default UserCard;