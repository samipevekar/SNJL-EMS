import React, { useState, useMemo } from "react";
import { View, Text, FlatList, ScrollView, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import colors from "../theme/colors"; // Import colors


const SaleSheetTable = ({ data, selectedVolume, onVolumeChange }) => {
  const [volume, setVolume] = useState(selectedVolume || "All");

  // Calculate Total Sale Amount
  const totalSaleAmount = useMemo(() => {
    return data.reduce((sum, item) => sum + item.saleAmount, 0);
  }, [data]);

  return (
    <View style={styles.container}>
      {/* Volume Filter Dropdown */}
      <Text style={styles.label}>Volume</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={volume}
          onValueChange={(itemValue) => {
            setVolume(itemValue);
            onVolumeChange && onVolumeChange(itemValue);
          }}
          style={styles.picker}
          mode="dropdown"
        >
          <Picker.Item label="All" value="" />
          <Picker.Item label="750ml" value="750ml" />
          <Picker.Item label="350ml" value="350ml" />
          <Picker.Item label="180ml" value="180ml" />
        </Picker>
      </View>

      {/* Enable Horizontal Scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            {["Brand", "Opening Balance", "MRP", "Sale", "Stock Increment", "Closing Balance", "Sale Amount"].map((header, index) => (
              <Text key={index} style={styles.headerCell} numberOfLines={1}>
                {header}
              </Text>
            ))}
          </View>

          {/* Table Rows */}
          <FlatList
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
                <Text style={styles.cell}>{item.brand}</Text>
                <Text style={styles.cell}>{item.ob}</Text>
                <Text style={styles.cell}>{item.mrp}</Text>
                <Text style={styles.cell}>{item.sale}</Text>
                <Text style={styles.cell}>{item.increment}</Text>
                <Text style={styles.cell}>{item.closingBal}</Text>
                <Text style={[styles.cell, styles.saleAmount]}>₹{item.saleAmount}</Text>
              </View>
            )}
          />

          {/* Total Sale Amount */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>₹{totalSaleAmount}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: colors.background,
    borderRadius: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.grayDark,
    borderRadius: 10,
    overflow: "hidden",
    width: 150,
    marginBottom: 10,
  },
  picker: {
    height: 50,
  },
  tableContainer: {
    backgroundColor: colors.white,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 5,
  },
  headerCell: {
    width: 120,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayDark,
  },
  evenRow: {
    backgroundColor: colors.grayLight,
  },
  oddRow: {
    backgroundColor: colors.white,
  },
  cell: {
    width: 120,
    textAlign: "center",
    overflow: "hidden",
  },
  saleAmount: {
    fontWeight: "bold",
    color: colors.success,
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: colors.secondary,
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
    justifyContent: "space-between",
  },
  totalLabel: {
    width: 600,
    fontWeight: "bold",
    marginLeft: "4%",
    color: colors.textDark,
  },
  totalValue: {
    width: 120,
    fontWeight: "bold",
    color: colors.success,
    textAlign: "center",
  },
});

export default SaleSheetTable;
