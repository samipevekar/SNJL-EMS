import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import colors from "../../theme/colors";

// Month and Year data
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
const getYears = () => {
  let years = [];
  for (let i = getCurrentYear(); i >= 2020; i--) {
    years.push({ label: `${i}`, value: i });
  }
  return years;
};

// Example backend data format
const dummyAttendanceData = [
  {
    user_id: 2,
    name: "raza",
    email: "raza@gmail.com",
    attendance_count: "1",
    present_dates: ["2025-04-05"],
    absent_dates: [
      "2025-03-31",
      "2025-04-01",
      "2025-04-02",
      "2025-04-03",
      "2025-04-04",
      "2025-04-05",
    ],
  },
  {
    user_id: 3,
    name: "awsi",
    email: "awsi@gmail.com",
    attendance_count: "1",
    present_dates: ["2025-04-05"],
    absent_dates: [
      "2025-03-31",
      "2025-04-01",
      "2025-04-02",
      "2025-04-03",
      "2025-04-04",
      "2025-04-05",
    ],
  },
];

const AttendanceDetails = () => {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Filter data based on selected month and year
  const filteredData = dummyAttendanceData.filter((user) => {
    return user.present_dates.some((dateStr) => {
      const date = new Date(dateStr);
      const monthMatch = selectedMonth ? date.getMonth() + 1 === selectedMonth : true;
      const yearMatch = date.getFullYear() === selectedYear;
      return monthMatch && yearMatch;
    });
  });

  const openModal = (user) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalVisible(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      <Text style={styles.heading}>Attendance Details</Text>
      {/* Dropdowns */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
        <Picker
          selectedValue={selectedMonth}
          onValueChange={(itemValue) => setSelectedMonth(itemValue)}
          style={{
            flex: 1,
            backgroundColor: colors.white,
            borderRadius: 8,
            marginRight: 8,
          }}
        >
          <Picker.Item label="Select Month" value={null} />
          {months.map((month) => (
            <Picker.Item key={month.value} label={month.label} value={month.value} />
          ))}
        </Picker>

        <Picker
          selectedValue={selectedYear}
          onValueChange={(itemValue) => setSelectedYear(itemValue)}
          style={{
            flex: 1,
            backgroundColor: colors.white,
            borderRadius: 8,
          }}
        >
          {getYears().map((year) => (
            <Picker.Item key={year.value} label={year.label} value={year.value} />
          ))}
        </Picker>
      </View>

      {/* Table */}
      <ScrollView horizontal>
        <View style={{ minWidth: 300, borderWidth: 1, borderColor: colors.grayDark, borderRadius: 8 }}>
          {/* Table Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerCell}>Name</Text>
            <Text style={styles.headerCell}>Email</Text>
            <Text style={styles.headerCell}>Days Present</Text>
          </View>

          {/* Table Rows */}
          {filteredData.length > 0 ? (
            filteredData.map((item, index) => (
              <TouchableOpacity
                key={item.user_id}
                onPress={() => openModal(item)}
                style={[
                  styles.row,
                  { backgroundColor: index % 2 === 0 ? colors.white : colors.grayLight },
                ]}
              >
                <Text style={styles.cell}>{item.name}</Text>
                <Text style={styles.cell}>{item.email}</Text>
                <Text style={styles.cell}>{item.attendance_count}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noDataRow}>
              <Text style={styles.noDataText}>No attendance records found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal for Absent Dates */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Absent Dates</Text>
            <ScrollView style={{ marginVertical: 10 }}>
              {selectedUser?.absent_dates.map((date, idx) => (
                <Text key={idx} style={styles.modalText}>{date}</Text>
              ))}
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

// Styles
const styles = {
  heading:{
    fontSize: 25,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign:'center',
    marginVertical:10,
    marginBottom:20

  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 5,
    borderTopRightRadius: 7,
    borderTopLeftRadius: 7,
  },
  headerCell: {
    width: 120,
    paddingVertical: 5,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
  },
  cell: {
    width: 120,
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    paddingVertical: 2,
    textAlign: "center",
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 8,
  },
  modalCloseText: {
    color: colors.white,
    fontWeight: "bold",
    textAlign: "center",
  },
};

export default AttendanceDetails;
