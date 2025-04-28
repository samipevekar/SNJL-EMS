import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "../theme/colors";

const ExpensesTable = ({ expenses, showDateColumn }) => {  // Added showDateColumn prop with default false
  // Calculate total expenses
  const totalExpense = useMemo(() => {
    return expenses?.reduce((sum, exp) => sum + parseFloat(exp?.amount || 0), 0) || 0;
  }, [expenses]);

  // Check if expenses is empty or undefined
  if (!expenses || expenses.length === 0) {
    return (
      <View style={styles.noExpensesContainer}>
        <Text style={styles.noExpensesText}>No Expenses Found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Table Header */}
      <View style={styles.headerRow}>
        {showDateColumn && (  // Conditionally render date column header
          <Text style={[styles.headerText, styles.dateColumn]}>Date</Text>
        )}
        <Text style={styles.headerText}>Message</Text>
        <Text style={[styles.headerText, styles.rightAlign]}>Amount</Text>
      </View>

      {/* Expense Rows */}
      {expenses.map((exp, index) => (
        <View
          key={index}
          style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow]}
        >
          {showDateColumn && (  // Conditionally render date column data
            <Text style={[styles.expenseLabel, styles.dateColumn]}>
              {exp?.sale_date || '-'}
            </Text>
          )}
          <Text style={styles.expenseLabel}>{exp?.message}</Text>
          <Text style={styles.expenseValue}>₹{exp?.amount}</Text>
        </View>
      ))}

      {/* Total Expenses */}
      <View style={styles.totalRow}>
        {showDateColumn && (  // Add empty space if date column is shown
          <Text style={[styles.totalLabel, styles.dateColumn]}></Text>
        )}
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
    marginBottom:30
  },
  noExpensesContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: colors.white,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noExpensesText: {
    fontSize: 16,
    color: colors.grayDark,
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
  dateColumn: {
    flex: 1.5,  // Slightly narrower than other columns
    marginRight: 5,
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