import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAttendanceByShop,
  selectAttendanceData,
  selectAttendanceError,
  selectAttendanceLoading
} from "../../redux/slice/attendanceSlice";
import colors from "../../theme/colors";

const months = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];

const getCurrentYear = () => new Date().getFullYear();
const getCurrentMonth = () => new Date().getMonth() + 1;
const getYears = () => {
  let years = [];
  for (let i = getCurrentYear(); i >= 2020; i--) {
    years.push({ label: `${i}`, value: i });
  }
  return years;
};

const AttendanceDetails = ({ route }) => {
  const { shop_id } = route.params;
  const dispatch = useDispatch();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const attendanceData = useSelector(selectAttendanceData);
  const loading = useSelector(selectAttendanceLoading);
  const error = useSelector(selectAttendanceError);

  const fetchData = () => {
    dispatch(
      fetchAttendanceByShop({
        shop_id,
        month: selectedMonth,
        year: selectedYear,
      })
    );
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
    setRefreshing(false);
  };

  const openModal = (user) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalVisible(false);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      <Text style={styles.heading}>Attendance Details</Text>

      {/* Dropdowns */}
      <View style={styles.filterContainer}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedMonth}
            onValueChange={setSelectedMonth}
            style={styles.picker}
          >
            {months.map((month) => (
              <Picker.Item
                key={month.value}
                label={month.label}
                value={month.value}
              />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedYear}
            onValueChange={setSelectedYear}
            style={styles.picker}
          >
            {getYears().map((year) => (
              <Picker.Item key={year.value} label={year.label} value={year.value} />
            ))}
          </Picker>
        </View>
      </View>

      {loading && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView
        horizontal
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.tableContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.headerCell}>Name</Text>
            <Text style={styles.headerCell}>Email</Text>
            <Text style={styles.headerCell}>Days Present</Text>
          </View>

          {attendanceData.length > 0 ? (
            attendanceData.map((item, index) => (
              <TouchableOpacity
                key={item.user_id}
                onPress={() => openModal(item)}
                style={[
                  styles.row,
                  {
                    backgroundColor:
                      index % 2 === 0 ? colors.white : colors.grayLight,
                  },
                ]}
              >
                <Text style={styles.cell}>{item.name}</Text>
                <Text style={styles.cell}>{item.email}</Text>
                <Text style={styles.cell}>{item.attendance_count}</Text>
              </TouchableOpacity>
            ))
          ) : (
            !loading && (
              <View style={styles.noDataRow}>
                <Text style={styles.noDataText}>No attendance records found</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Absent Dates for {selectedUser?.name}
            </Text>

            <ScrollView style={styles.modalScroll}>
              {selectedUser?.absent_dates?.length > 0 ? (
                selectedUser.absent_dates.map((date, idx) => (
                  <View key={idx} style={styles.dateItem}>
                    <Text style={styles.dateText}>{formatDate(date)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noAbsentDates}>No absent dates recorded</Text>
              )}
            </ScrollView>

            <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = {
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "center",
    marginVertical: 10,
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    gap: 10,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  tableContainer: {
    minWidth: "100%",
    borderWidth: 1,
    borderColor: colors.grayDark,
    borderRadius: 8,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderTopRightRadius: 7,
    borderTopLeftRadius: 7,
  },
  headerCell: {
    width: 150,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 12,
    alignItems: "center",
  },
  cell: {
    width: 150,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.textDark,
    textAlign: "center",
  },
  noDataRow: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 16,
    color: colors.textDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorContainer: {
    backgroundColor: colors.dangerLight,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: colors.danger,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 10,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: colors.primary,
  },
  modalScroll: {
    maxHeight: "80%",
  },
  dateItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  dateText: {
    fontSize: 16,
    textAlign: "center",
  },
  noAbsentDates: {
    textAlign: "center",
    color: colors.grayDark,
    paddingVertical: 15,
  },
  modalCloseButton: {
    marginTop: 15,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
  },
  modalCloseText: {
    color: colors.white,
    fontWeight: "bold",
    textAlign: "center",
  },
};

export default AttendanceDetails;
