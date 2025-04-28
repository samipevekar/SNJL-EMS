import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getShopBalanceSheetsAsync,
  getWarehouseBalanceSheetsAsync,
  selectShopBalanceSheets,
  selectWarehouseBalanceSheets,
  selectBalanceSheetError,
} from "../../redux/slice/balanceSheetSlice";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Button,
  Platform,
  PermissionsAndroid,
  Alert,
} from "react-native";
import BalanceSheetTable from "../../components/BalanceSheetTable";
import colors from "../../theme/colors";
import RNHTMLtoPDF from "react-native-html-to-pdf";
import RNFS from "react-native-fs";
import RNBlobUtil from "react-native-blob-util";
import Share from "react-native-share";
import {formatDateLeft } from "../../utils/formatDateLeft";

const BalanceSheetPage = ({ route }) => {
  const { shop_id, fromDate, toDate, category, type, warehouse_name, isOverall } = route.params;

  const dispatch = useDispatch();
  const shopBalanceSheets = useSelector(selectShopBalanceSheets);
  const warehouseBalanceSheets = useSelector(selectWarehouseBalanceSheets);
  const error = useSelector(selectBalanceSheetError);
  const status = useSelector((state) => state.balanceSheet.status);

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (type === "shop" && isOverall) {
      dispatch(getShopBalanceSheetsAsync({ date1: fromDate, date2: toDate }));
    } else if (type === "shop" && shop_id) {
      dispatch(getShopBalanceSheetsAsync({ shop_id, date1: fromDate, date2: toDate }));
    } else if (type === "warehouse" && isOverall) {
      dispatch(getWarehouseBalanceSheetsAsync({ date1: fromDate, date2: toDate }));
    } else if (type === "warehouse" && warehouse_name) {
      dispatch(getWarehouseBalanceSheetsAsync({ warehouse_name, date1: fromDate, date2: toDate }));
    }
  }, [dispatch, shop_id, warehouse_name, fromDate, toDate, type, isOverall]);

  const balanceSheetData = type === "shop" ? shopBalanceSheets : warehouseBalanceSheets;

  

  const generatePDF = async () => {
    try {
      if (Platform.OS === "android" && Platform.Version < 30) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("Permission Denied", "Storage permission is required to save PDF.");
          return;
        }
      }

      const totalDebit = balanceSheetData.reduce(
        (sum, row) => sum + (parseFloat(row.debit?.replace(/₹|,/g, "")) || 0),
        0
      );
      const totalCredit = balanceSheetData.reduce(
        (sum, row) => sum + (parseFloat(row.credit?.replace(/₹|,/g, "")) || 0),
        0
      );
      const difference = Math.abs(totalDebit - totalCredit);
      const finalDebit = Math.max(totalDebit, totalCredit);
      const finalCredit = finalDebit;

      const htmlContent = `
        <div style="padding: 20px 30px;">
          <h1 style="text-align:center;">Balance Sheet</h1>
          ${warehouse_name ? `<p style="text-align:center;"><strong>Name:</strong> ${warehouse_name}</p>` : ""}
          ${shop_id ? `<p style="text-align:center;"><strong>Shop ID:</strong> ${shop_id}</p>` : ""}
          <p style="text-align:center;"> ${formatDateLeft(fromDate)} to ${formatDateLeft(toDate)}</p>

          <table border="1" cellspacing="0" cellpadding="5" style="width:100%; border-collapse:collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color:#f2f2f2; font-weight:bold;">
                <th>Date</th>
                <th>Details</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              ${
                balanceSheetData?.length > 0
                  ? balanceSheetData
                      .map(
                        (row, index) => `
                  <tr style="background-color:${index % 2 === 0 ? "#f9f9f9" : "#ffffff"};">
                    <td>${formatDateLeft(row.date)}</td>
                    <td>${row.details || "-"}</td>
                    <td>${row.debit || "-"}</td>
                    <td>${row.credit || "-"}</td>
                    <td>${row.balance || "-"}</td>
                  </tr>
                `
                      )
                      .join("")
                  : `<tr><td colspan="5" style="text-align:center;">No Data Available</td></tr>`
              }

              <tr style="background-color:#f2f2f2; font-weight:bold;">
                <td>Total</td>
                <td>-</td>
                <td>₹${totalDebit.toLocaleString()}</td>
                <td>₹${totalCredit.toLocaleString()}</td>
                <td>-</td>
              </tr>

              <tr style="background-color:#ffffff; font-weight:bold;">
                <td>Difference</td>
                <td>-</td>
                <td>${totalDebit < totalCredit ? `₹${difference.toLocaleString()}` : "-"}</td>
                <td>${totalCredit < totalDebit ? `₹${difference.toLocaleString()}` : "-"}</td>
                <td>-</td>
              </tr>

              <tr style="background-color:#f2f2f2; font-weight:bold;">
                <td>Final</td>
                <td>-</td>
                <td>₹${finalDebit.toLocaleString()}</td>
                <td>₹${finalCredit.toLocaleString()}</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      const fileName = `BalanceSheet_${Date.now()}`;
      let filePath;

      if (Platform.OS === "android" && Platform.Version >= 30) {
        filePath = `${RNFS.DocumentDirectoryPath}/${fileName}.pdf`;
      } else {
        filePath = `${RNFS.DownloadDirectoryPath}/${fileName}.pdf`;
      }

      const options = {
        html: htmlContent,
        fileName,
        filePath,
      };

      const file = await RNHTMLtoPDF.convert(options);
      console.log("PDF Path:", file.filePath);

      setLoading(true)

      if (Platform.OS === "android") {
        RNBlobUtil.fs
          .scanFile([{ path: file.filePath, mime: "application/pdf" }])
          .then(() => setLoading(false))
          .catch((err) => setLoading(false));
      }

      const fileExists = await RNFS.exists(file.filePath);

      if (fileExists) {
        // Alert.alert("Success", `PDF saved successfully.`);
        await Share.open({
          url: `file://${file.filePath}`,
          type: "application/pdf",
          title: "Share Balance Sheet PDF",
        });
      } else {
        Alert.alert("Error", "PDF file not found after creation.");
      }
    } catch (err) {
      console.error("PDF generation error:", JSON.stringify(err, null, 2));
      Alert.alert("Error", `Failed to generate PDF: ${err.message || err}`);
    }
  };

  if (status === "loading") {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Balance Sheet</Text>
      {(type === "warehouse" || type === "shop") && warehouse_name && (
        <Text style={styles.subHeading}>{warehouse_name}</Text>
      )}
      <Text style={styles.dateText}>
        {formatDateLeft(fromDate)} to {formatDateLeft(toDate)}
      </Text>

      <BalanceSheetTable data={balanceSheetData} />

      <View style={styles.downloadBtn}>
        <Button title={loading ? "Exporting..." : "Export as PDF"} color={colors.primary} onPress={generatePDF} />
      </View>
    </View>
  );
};

export default BalanceSheetPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    alignItems: "center",
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
  },
  subHeading: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 15,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 15,
  },
  downloadBtn: {
    marginTop: 30,
    width: "100%",
  },
});
