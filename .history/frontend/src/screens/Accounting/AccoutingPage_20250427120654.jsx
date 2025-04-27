import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import colors from '../../theme/colors';
import {useNavigation} from '@react-navigation/native';
import {formatDate} from '../../utils/formatDate';
import {useDispatch, useSelector} from 'react-redux';
import {getAllShopsAsync, selectShops} from '../../redux/slice/shopSlice';
import {ScrollView} from 'react-native-gesture-handler';

const AccountingPage = () => {
  const [expandedTab, setExpandedTab] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFromDate, setShowFromDate] = useState(false);
  const [showToDate, setShowToDate] = useState(false);
  const navigation = useNavigation();

  // Fetch shops from Redux

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getAllShopsAsync());
  }, []);

  const shops = useSelector(selectShops);

  const data = [
    {title: 'Shop', type: 'shop', items: shops},
    {
      title: 'Warehouse',
      type: 'warehouse',
      items: [
        {shop_name: 'Warehouse A'},
        {shop_name: 'Warehouse B'},
        {shop_name: 'Warehouse C'},
      ],
    },
    {
      title: 'Overall',
      type: 'overall',
      items: [
        {shop_name: 'Cumulative Shop Revenue', category: 'shop'},
        {shop_name: 'Warehouse Balance Ledger', category: 'warehouse'},
      ],
    },
  ];

  const handleCardPress = section => {
    if (expandedTab !== section.title) {
      setFromDate(null);
      setToDate(null);
    }
    setExpandedTab(expandedTab === section.title ? null : section.title);
  };

  const handleItemPress = (
    type,
    shop_id,
    warehouse_name = null,
    category = null,
  ) => {
    if (fromDate && toDate) {
      if (type === 'overall') {
        // For overall, we pass the category instead of shop_id/warehouse_name
        navigation.navigate('BalanceSheetPage', {
          type: category, // This will be either "shop" or "warehouse"
          shop_id: null,
          warehouse_name: null,
          fromDate,
          toDate,
          isOverall: true, // Add this flag to indicate it's an overall request
        });
      } else {
        // Normal shop/warehouse case
        navigation.navigate('BalanceSheetPage', {
          type,
          shop_id,
          warehouse_name,
          fromDate,
          toDate,
          isOverall: false,
        });
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Accounting</Text>
      {data.map(section => (
        <View key={section.title}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleCardPress(section)}>
            <Text style={styles.cardText}>{section.title}</Text>
          </TouchableOpacity>
          {expandedTab === section.title && (
            <View style={styles.expandedSection}>
              <View style={styles.dateContainer}>
                <TouchableOpacity
                  onPress={() => setShowFromDate(true)}
                  style={styles.dateButton}>
                  <Text style={styles.dateText}>
                    {fromDate ? formatDate(fromDate) : 'From Date'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowToDate(true)}
                  style={styles.dateButton}>
                  <Text style={styles.dateText}>
                    {toDate ? formatDate(toDate) : 'To Date'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showFromDate && (
                <DateTimePicker
                  value={fromDate ? new Date(fromDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowFromDate(false);
                    if (event.type === 'set' && date) {
                      setFromDate(formatDate(date));
                    }
                  }}
                />
              )}

              {showToDate && (
                <DateTimePicker
                  value={toDate ? new Date(toDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowToDate(false);
                    if (event.type === 'set' && date) {
                      setToDate(formatDate(date));
                    }
                  }}
                />
              )}

              {section.items.length > 0 &&
                section.items.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.item}
                    onPress={() =>
                      handleItemPress(
                        section.type,
                        item?.shop_id,
                        item?.shop_name,
                        item?.category,
                      )
                    }>
                    <Text style={styles.itemText}>{item.shop_name} {item?.shop_id && `(${item?.shop_id})`}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
    paddingBottom: 50,
  },
  heading: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    padding: 20,
    borderRadius: 8,
    marginVertical: 10,
  },
  cardText: {
    fontSize: 18,
    color: colors.textDark,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  expandedSection: {
    backgroundColor: colors.grayLight,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateButton: {
    backgroundColor: colors.secondary,
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: colors.textDark,
    fontWeight: 'bold',
  },
  item: {
    backgroundColor: colors.white,
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    shadowColor: colors.grayDark,
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 1},
  },
  itemText: {
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default AccountingPage;
