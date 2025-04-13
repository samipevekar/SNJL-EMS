import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import colors from "../theme/colors"; // Import colors
import { formatDate } from "../utils/formatDate";

const BalanceSheetTable = ({ data }) => {
  const parseAmount = (amount) => {
    if (typeof amount === "string" && amount.includes("₹")) {
      return parseFloat(amount.replace(/₹|,/g, "")) || 0;
    }
    return Number(amount) || 0;
  };

  const totalDebit = data.reduce((sum, row) => sum + parseAmount(row.debit), 0);
  const totalCredit = data.reduce((sum, row) => sum + parseAmount(row.credit), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const higherTotal = Math.max(totalDebit, totalCredit);
  
  const finalDebit = totalDebit > totalCredit ? higherTotal : higherTotal;
  const finalCredit = totalCredit > totalDebit ? higherTotal : higherTotal;

  return (
    <ScrollView horizontal>
      <ScrollView  style={styles.tableContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.headerCell}>Date</Text>
          <Text style={styles.headerCell}>Details</Text>
          <Text style={styles.headerCell}>Debit</Text>
          <Text style={styles.headerCell}>Credit</Text>
          <Text style={styles.headerCell}>Balance</Text>
        </View>

        {data?.length > 0 ? (
          data.map((row, index) => (
            <View
              key={index}
              style={[
                styles.dataRow,
                { backgroundColor: index % 2 === 0 ? colors.secondary : colors.white },
              ]}
            >
              <Text style={styles.dataCell}>{formatDate(row.date) || "-"}</Text>
              <Text style={styles.dataCell}>{row.details || "-"}</Text>
              <Text style={styles.dataCell}>{row.debit || "-"}</Text>
              <Text style={styles.dataCell}>{row.credit || "-"}</Text>
              <Text style={styles.dataCell}>{row.balance || "-"}</Text>
            </View>
          ))
        ) : (
          <View style={styles.noDataRow}>
            <Text style={styles.noDataText}>No Data Available</Text>
          </View>
        )}

        {["Total", "Difference", "Final"].map((label, index) => (
          <View
            key={label}
            style={[styles.dataRow, { backgroundColor: index % 2 === 0 ? colors.secondary : colors.white }]}
          >
            <Text style={styles.dataCell}>{label}</Text>
            <Text style={styles.dataCell}>-</Text>
            <Text style={styles.dataCell}>
              {label === "Difference" && totalDebit < totalCredit ? `₹${difference.toLocaleString()}` :
               label === "Final" ? `₹${finalDebit.toLocaleString()}` : `₹${totalDebit.toLocaleString()}`}
            </Text>
            <Text style={styles.dataCell}>
              {label === "Difference" && totalCredit < totalDebit ? `₹${difference.toLocaleString()}` :
               label === "Final" ? `₹${finalCredit.toLocaleString()}` : `₹${totalCredit.toLocaleString()}`}
            </Text>
            <Text style={styles.dataCell}>-</Text>
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    borderWidth: 1,
    borderColor: colors.grayDark,
    borderRadius: 5,
    minWidth: 500,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 10,
  },
  headerCell: {
    width: 100,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
  },
  dataRow: {
    flexDirection: "row",
    paddingVertical: 8,
  },
  dataCell: {
    width: 100,
    paddingHorizontal: 10,
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
    color: colors.grayDark,
  },
});

export default BalanceSheetTable;