import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "../theme/colors"; // Import colors

const ExpensesTable = ({ expenses }) => {
  // Calculate total expenses
  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.value || 0), 0);
  }, [expenses]);

  return (
    <View style={styles.container}>
      {/* Table Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Message</Text>
        <Text style={[styles.headerText, styles.rightAlign]}>Amount</Text>
      </View>

      {/* Expense Rows */}
      {expenses.map((exp, index) => (
        <View
          key={index}
          style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow]}
        >
          <Text style={styles.expenseLabel}>{exp.label}</Text>
          <Text style={styles.expenseValue}>₹{exp.value}</Text>
        </View>
      ))}

      {/* Total Expenses */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>₹{totalExpense.toFixed(2)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    padding: 10,
    backgroundColor: colors.white,
    borderRadius: 10,
    elevation: 0,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayDark,
    marginBottom: 5,
  },
  headerText: {
    fontWeight: "bold",
    fontSize: 16,
    flex: 2,
  },
  rightAlign: {
    textAlign: "right",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 5,
  },
  evenRow: {
    backgroundColor: colors.grayLight,
  },
  oddRow: {
    backgroundColor: colors.white,
  },
  expenseLabel: {
    fontSize: 14,
    flex: 2,
    flexWrap: "wrap",
  },
  expenseValue: {
    fontSize: 14,
    fontWeight: "bold",
    flex: 1,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.grayDark,
    marginTop: 5,
  },
  totalLabel: {
    fontWeight: "bold",
    fontSize: 16,
    flex: 2,
  },
  totalValue: {
    fontWeight: "bold",
    fontSize: 16,
    color: colors.danger,
    flex: 1,
    textAlign: "right",
  },
});

export default ExpensesTable;