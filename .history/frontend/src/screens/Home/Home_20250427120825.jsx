import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useMemo, useState, useCallback} from 'react';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {removeToken} from '../../storage/AuthStorage';
import {useDispatch, useSelector} from 'react-redux';
import {clearUser, getMeAsync, selectUser} from '../../redux/slice/authSlice';
import {
  clearShop,
  getShopByIdAsync,
  selectSpecificShop,
} from '../../redux/slice/shopSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../theme/colors';
import {ProgressBar} from 'react-native-paper';

const Home = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const shop = useSelector(selectSpecificShop);
  const navigation = useNavigation();
  const [loggingOut, setLoggingOut] = useState(false);
  const [loadingShop, setLoadingShop] = useState(false);
  const [quotaData, setQuotaData] = useState({
    total: 0,
    remaining: 0,
    progress: 0,
    label: '',
  });

  // Determine current quarter
  const getCurrentQuarter = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 1 && month <= 3) return 1; // Q1: Jan-Mar
    if (month >= 4 && month <= 6) return 2; // Q2: Apr-Jun
    if (month >= 7 && month <= 9) return 3; // Q3: Jul-Sep
    return 4; // Q4: Oct-Dec
  };

  // Load user data
  useEffect(() => {
    dispatch(getMeAsync());
  }, []);

  // Load shop data when component focuses or user changes
  useFocusEffect(
    useCallback(() => {
      if (user?.role === 'user' && user?.assigned_shops?.length > 0) {
        setLoadingShop(true);
        dispatch(getShopByIdAsync(user.assigned_shops[0])).finally(() => {
          setLoadingShop(false);
        });
      }
      return () => {
        dispatch(clearShop());
      };
    }, [user?.assigned_shops?.[0]]), // Only re-run if assigned shop changes
  );

  // Calculate quota based on liquor type
  useEffect(() => {
    if (shop && user?.role === 'user') {
      let total = 0;
      let remaining = 0;
      let label = '';

      if (shop.liquor_type === 'country') {
        total = parseFloat(shop.mgq);
        remaining = parseFloat(shop.monthly_mgq);
        label = 'Monthly MGQ';
      } else if (shop.liquor_type === 'foreign') {
        const quarter = getCurrentQuarter();
        switch (quarter) {
          case 1:
            total = parseFloat(shop?.mgq?.q1);
            remaining = shop?.mgq_q1 || 0;
            label = 'Q1 MGQ';
            break;
          case 2:
            total = parseFloat(shop?.mgq?.q2);
            remaining = shop?.mgq_q2 || 0;
            label = 'Q2 MGQ';
            break;
          case 3:
            total = parseFloat(shop?.mgq?.q3);
            remaining = shop?.mgq_q3 || 0;
            label = 'Q3 MGQ';
            break;
          case 4:
            total = parseFloat(shop?.mgq?.q4);
            remaining = shop?.mgq_q4 || 0;
            label = 'Q4 MGQ';
            break;
        }
      }

      const progress = total > 0 ? (total - remaining) / total : 0;

      setQuotaData({
        total,
        remaining,
        progress,
        label,
      });
    }
  }, [shop, user]);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      await removeToken();
      dispatch(clearUser());
      setTimeout(() => {
        navigation.replace('Login');
        setLoggingOut(false);
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      setLoggingOut(false);
    }
  }, [dispatch, navigation, loggingOut]);

  const allMenuItems = [
    {
      title: 'Attendance',
      icon: 'calendar-check',
      screen: 'Attendance',
      roles: ['manager', 'user'],
    },
    {
      title: 'Indent Formation',
      icon: 'file-document',
      screen: 'IndentFormationPage',
      roles: ['manager', 'user', 'super_user'],
    },
    {
      title: 'Add Expense',
      icon: 'cash',
      screen: 'AddExpensePage',
      roles: ['manager', 'super_user'],
    },
    {
      title: 'Warehouse Payment',
      icon: 'warehouse',
      screen: 'AddWarehousePaymentPage',
      roles: ['manager', 'super_user'],
    },
    {
      title: 'Create User',
      icon: 'account-plus-outline',
      screen: 'UserManagementPage',
      roles: ['super_user'],
    },
    {
      title: 'Create Shop',
      icon: 'shopping',
      screen: 'ShopManagementPage',
      roles: ['super_user'],
    },
  ];

  const visibleMenuItems = useMemo(() => {
    if (!user?.role) return [];
    return allMenuItems.filter(item => item.roles.includes(user.role));
  }, [user?.role]);

  if (!user?.id) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.logoutButtonTop,
            loggingOut && {backgroundColor: colors.gray},
          ]}
          onPress={handleLogout}
          disabled={loggingOut}>
          <Text style={styles.logoutTxt}>
            {loggingOut ? 'Logging out...' : 'Logout'}
          </Text>
          <Icon name="logout" size={20} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {user  && <Text style={styles.liquor_type}>role: {user?.role}</Text>}
      </View>

      {/* MGQ Indicator - Only for users with 'user' role */}
      {loadingShop ? (
        <View style={styles.loadingShopContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : user?.role === 'user' && user?.assigned_shops?.length > 0 && shop ? (
        <View style={styles.quotaCard}>
          <View style={styles.cardRow}>
            <Icon name="chart-bar" size={24} color={colors.primary} />
            <Text style={styles.cardText}>{quotaData.label} Indicator</Text>
          </View>
          <Text style={styles.quotaText}>
            Remaining: {quotaData.remaining.toLocaleString()}/
            {quotaData.total.toLocaleString()}
          </Text>
          <ProgressBar
            progress={quotaData.progress}
            color={quotaData.progress > 0.8 ? colors.danger : colors.success}
            style={styles.progressBar}
          />
          <Text style={styles.quotaPercentage}>
            {Math.round(quotaData.progress * 100)}% utilized
          </Text>
          <Text style={styles.shopName}>{shop?.shop_name} ({shop?.liquor_type})</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.menuContainer}>
          {visibleMenuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}>
              <View style={styles.menuIconContainer}>
                <Icon name={item.icon} size={24} color={colors.primary} />
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
    position: 'relative',
  },
  logoutButtonTop: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    top: 40,
    right: 20,
    backgroundColor: colors.danger,
    padding: 8,
    borderRadius: 20,
    gap: 5,
    zIndex: 10,
  },
  logoutTxt: {
    fontWeight: '500',
    color: colors.white,
    marginRight: 4,
  },
  userInfo: {
    marginTop: 10,
  },
  welcomeText: {
    color: colors.white,
    fontSize: 16,
    marginBottom: 5,
  },
  userName: {
    color: colors.white,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    color: colors.secondary,
    fontSize: 14,
  },
  quotaCard: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  quotaText: {
    fontSize: 14,
    marginTop: 10,
    marginLeft: 34,
    color: colors.textDark,
  },
  quotaPercentage: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'right',
    color: colors.grayDark,
  },
  progressBar: {
    marginTop: 10,
    marginLeft: 34,
    height: 10,
    borderRadius: 5,
  },
  shopName: {
    fontSize: 14,
    marginTop: 5,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.textDark,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuIconContainer: {
    backgroundColor: colors.secondary,
    padding: 10,
    borderRadius: 50,
    marginBottom: 8,
  },
  menuText: {
    color: colors.textDark,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingShopContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liquor_type:{
    fontSize:15,
    color:colors.white,
    textAlign:'right',
    marginRight:5,
    fontWeight:'500'
  }
});