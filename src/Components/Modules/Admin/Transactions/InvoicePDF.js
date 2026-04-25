// Admin/src/components/Admin/Invoices/InvoicePDF.js

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import logo from "../../../Pages/images/jiya_logo.png";
import { toWords } from "number-to-words";

// Register fonts
Font.register({
  family: "Helvetica",
});

Font.register({
  family: "Helvetica-Bold",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
});

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 8,
    fontSize: 8,
    fontFamily: "Helvetica",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  smallBold: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  logo: {
    width: 40,
    height: 40,
    marginHorizontal: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  tagline: {
    fontSize: 9,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
  },
  address: {
    fontSize: 8,
    marginTop: 5,
    textAlign: "center",
  },
  sup: {
    fontSize: 5,
    textBaseline: "alphabetic",
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 2,
  },
  sectionLeft: {
    width: "60%",
  },
  sectionRight: {
    width: "40%",
    textAlign: "right",
  },
  label: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  value: {
    fontSize: 8,
    marginBottom: 1,
  },
  table: {
    display: "table",
    width: "100%",
    borderWidth: 0.5,
    borderColor: "#000",
    marginTop: 6,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableHeaderText: {
    fontSize: 8,
    color: "#fff",
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  tableCell: {
    fontSize: 8,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  summaryRight: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#000",
  },
  summaryHeader: {
    backgroundColor: "#000",
    flexDirection: "row",
  },
  summaryHeaderText: {
    flex: 1,
    color: "#fff",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    padding: 2,
  },
  summaryRowItem: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderColor: "#000",
  },
  summaryCell: {
    flex: 1,
    fontSize: 7,
    textAlign: "center",
    padding: 2,
  },
  amountTotalRow: {
    flexDirection: "row",
    marginTop: 8,
    paddingHorizontal: 2,
  },
  amountSection: {
    flex: 1,
    paddingRight: 6,
  },
  amountInWords: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  amountInWordsText: {
    fontSize: 9,
    marginBottom: 2,
  },
  totalSection: {
    flex: 1,
    paddingLeft: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    width: "60%",
  },
  totalValue: {
    fontSize: 10,
    width: "40%",
    textAlign: "right",
  },
  noteSection: {
    marginTop: 6,
    marginBottom: 8,
  },
  noteHeading: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  noteText: {
    fontSize: 8,
    marginBottom: 2,
  },
  footer: {
    marginTop: 12,
    alignItems: "center",
  },
  thankYou: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  copyright: {
    fontSize: 8,
    marginTop: 6,
  },
  colSNo: {
    width: "8%",
    borderWidth: 0.5,
    borderColor: "#000",
    padding: 2,
    justifyContent: "center",
  },
  colMetal: {
    width: "12%",
    borderWidth: 0.5,
    borderColor: "#000",
    padding: 2,
    justifyContent: "center",
  },
  colParticulars: {
    width: "38%",
    borderWidth: 0.5,
    borderColor: "#000",
    padding: 2,
    justifyContent: "center",
  },
  colNtWt: {
    width: "12%",
    borderWidth: 0.5,
    borderColor: "#000",
    padding: 2,
    justifyContent: "center",
  },
  colHSN: {
    width: "12%",
    borderWidth: 0.5,
    borderColor: "#000",
    padding: 2,
    justifyContent: "center",
  },
  colAmount: {
    width: "18%",
    borderWidth: 0.5,
    borderColor: "#000",
    padding: 2,
    justifyContent: "center",
  },
});

// UTILITY: Safe number formatter - returns string
const formatNumber = (value, defaultValue = "0.00") => {
  if (value === null || value === undefined || value === '') return defaultValue;
  const num = Number(value);
  if (isNaN(num)) return defaultValue;
  return num.toFixed(2);
};

// UTILITY: Safe number parser - returns number
const parseNum = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const InvoicePDF = ({
  estimateData,
  products,
  customerDetails,
}) => {
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString();
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Get current time
  const currentTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Calculate total values with safe number conversion
  const totalValues = products?.reduce(
    (totals, item) => ({
      qty: totals.qty + parseNum(item.qty),
      grossWeight: totals.grossWeight + parseNum(item.gross_weight),
      stoneWeight: totals.stoneWeight + parseNum(item.stone_weight),
      netWeight: totals.netWeight + parseNum(item.total_weight_av),
      makingCharges: totals.makingCharges + parseNum(item.making_charges),
      stonePrice: totals.stonePrice + parseNum(item.stone_price),
      totalPrice: totals.totalPrice + parseNum(item.total_price),
    }),
    { qty: 0, grossWeight: 0, stoneWeight: 0, netWeight: 0, makingCharges: 0, stonePrice: 0, totalPrice: 0 }
  ) || { qty: 0, grossWeight: 0, stoneWeight: 0, netWeight: 0, makingCharges: 0, stonePrice: 0, totalPrice: 0 };

  // Parse ALL numeric values from estimateData as numbers
  const netAmount = parseNum(estimateData?.net_amount) || totalValues.totalPrice;
  const discountAmount = parseNum(estimateData?.disscount);
  const taxAmount = parseNum(estimateData?.tax_amount);
  const taxableAmount = parseNum(estimateData?.taxable_amount) || netAmount;
  
  const netPayableAmount = parseNum((netAmount - discountAmount).toFixed(2));

  // Convert amount to words
  let amountInWords = "ZERO";
  try {
    amountInWords = toWords(Math.round(netPayableAmount)).replace(
      /(^\w|\s\w)/g,
      (m) => m.toUpperCase()
    );
  } catch (error) {
    console.error('Error converting to words:', error);
    amountInWords = String(Math.round(netPayableAmount));
  }

  const invoiceNumber = estimateData?.order_number || estimateData?.estimate_number || "N/A";

  // Pre-format all display values as strings
  const displayNetAmount = formatNumber(netAmount);
  const displayTaxableAmount = formatNumber(taxableAmount);
  const displayDiscountAmount = formatNumber(discountAmount);
  const displayNetPayableAmount = formatNumber(netPayableAmount);

  // ================================================================
  // ONLY ONE PAGE - NO SECOND PAGE
  // ================================================================
  return (
    <Document>
      <Page size={[300, 500]} style={styles.page}>
        {/* Top Row: GSTIN | Logo | Contact */}
        <View style={styles.topRow}>
          <Text style={styles.smallBold}>GSTIN: 29ADOPG5916E1ZE</Text>
          <Image src={logo} style={styles.logo} />
          <View>
            <Text style={styles.smallBold}>Contact: 916 916 9680</Text>
            <Text style={[styles.smallBold, { marginLeft: 33 }]}>
              080 26719107
            </Text>
          </View>
        </View>

        {/* Title + tagline + address */}
        <Text style={styles.title}>Sri Mahaganapathi Jewellers</Text>
        <Text style={[styles.tagline, { marginLeft: 50 }]}>
          Our Craft For Your Precious Stories
        </Text>
        <Text style={styles.address}>
          No 606, 14<Text style={styles.sup}>th</Text> Main Road, Siddanna
          Layout, BSK 2<Text style={styles.sup}>nd</Text> Stage
        </Text>

        {/* Customer Details + Invoice Info */}
        <View style={styles.sectionRow}>
          <View style={styles.sectionLeft}>
            <Text style={styles.label}>Customer Details:</Text>
            <Text style={styles.value}>
              Name: {customerDetails?.customer_name || estimateData?.customer_name || "N/A"}
            </Text>
            <Text style={styles.value}>
              Mobile: {customerDetails?.mobile || "N/A"}
            </Text>
          </View>
          <View style={styles.sectionRight}>
            <Text style={styles.value}>
              Invoice No: {invoiceNumber}
            </Text>
            <Text style={styles.value}>Date: {formatDate(estimateData?.order_date || estimateData?.date)}</Text>
            <Text style={styles.value}>Time: {currentTime}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableRow}>
            <View style={[styles.colSNo, { backgroundColor: "#000" }]}>
              <Text style={styles.tableHeaderText}>S.No</Text>
            </View>
            <View style={[styles.colMetal, { backgroundColor: "#000" }]}>
              <Text style={styles.tableHeaderText}>Metal</Text>
            </View>
            <View style={[styles.colParticulars, { backgroundColor: "#000" }]}>
              <Text style={styles.tableHeaderText}>Particulars / Gr. Wt</Text>
            </View>
            <View style={[styles.colNtWt, { backgroundColor: "#000" }]}>
              <Text style={styles.tableHeaderText}>WAW</Text>
            </View>
            <View style={[styles.colHSN, { backgroundColor: "#000" }]}>
              <Text style={styles.tableHeaderText}>HSN</Text>
            </View>
            <View style={[styles.colAmount, { backgroundColor: "#000" }]}>
              <Text style={styles.tableHeaderText}>Amount</Text>
            </View>
          </View>

          {/* Table Rows */}
          {products?.map((item, index) => {
            const mcValue = parseNum(item.mc_per_gram);
            const stonePrice = parseNum(item.stone_price);
            const itemAmount = formatNumber(
              parseNum(item.rate_amt) + parseNum(item.stone_price) + parseNum(item.making_charges)
            );

            return (
              <React.Fragment key={index}>
                {/* Main Item Row */}
                <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                  <View style={[styles.colSNo, { borderBottomWidth: 0 }]}>
                    <Text style={styles.tableCell}>{index + 1}</Text>
                  </View>
                  <View style={[styles.colMetal, { borderBottomWidth: 0 }]}>
                    <Text style={styles.tableCell}>
                      {item.metal_type || "N/A"}
                    </Text>
                  </View>
                  <View style={[styles.colParticulars, { borderBottomWidth: 0 }]}>
                    <Text style={styles.tableCell}>
                      {item.product_name || "N/A"}{" "}
                      {item.gross_weight ? `${item.gross_weight}g` : ""}
                    </Text>
                  </View>
                  <View style={[styles.colNtWt, { borderBottomWidth: 0 }]}>
                    <Text style={styles.tableCell}>
                      {item.total_weight_av || "0.000"}
                    </Text>
                  </View>
                  <View style={[styles.colHSN, { borderBottomWidth: 0 }]}>
                    <Text style={styles.tableCell}>7113</Text>
                  </View>
                  <View style={[styles.colAmount, { borderBottomWidth: 0 }]}>
                    <Text style={styles.tableCell}>
                      {itemAmount}
                    </Text>
                  </View>
                </View>

                {/* MC and Stone Price Row */}
                {(mcValue > 0 || stonePrice > 0) && (
                  <View style={[styles.tableRow, { backgroundColor: "#f9f9f9", borderTopWidth: 0 }]}>
                    <View style={[styles.colSNo, { justifyContent: "center", borderTopWidth: 0, borderBottomWidth: 0.5 }]}>
                      <Text style={[styles.tableCell, { fontSize: 7, color: "#666" }]}></Text>
                    </View>
                    <View style={[styles.colMetal, { justifyContent: "center", borderTopWidth: 0, borderBottomWidth: 0.5 }]}>
                      <Text style={[styles.tableCell, { fontSize: 7, color: "#666" }]}></Text>
                    </View>
                    <View style={[styles.colParticulars, { justifyContent: "center", borderTopWidth: 0, borderBottomWidth: 0.5 }]}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={[styles.tableCell, { fontSize: 7, color: "#666", textAlign: "left" }]}>
                          MC: {formatNumber(mcValue)}
                        </Text>
                        <Text style={[styles.tableCell, { fontSize: 7, color: "#666", textAlign: "right", marginLeft: 10 }]}>
                          Stn Rs. {formatNumber(stonePrice)}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.colNtWt, { justifyContent: "center", borderTopWidth: 0, borderBottomWidth: 0.5 }]}>
                      <Text style={[styles.tableCell, { fontSize: 7, color: "#666" }]}></Text>
                    </View>
                    <View style={[styles.colHSN, { justifyContent: "center", borderTopWidth: 0, borderBottomWidth: 0.5 }]}>
                      <Text style={[styles.tableCell, { fontSize: 7, color: "#666" }]}></Text>
                    </View>
                    <View style={[styles.colAmount, { justifyContent: "center", borderTopWidth: 0, borderBottomWidth: 0.5 }]}>
                      <Text style={[styles.tableCell, { fontSize: 7, color: "#666" }]}></Text>
                    </View>
                  </View>
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Summary Section */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryRight}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryHeaderText}>GST Val</Text>
              <Text style={styles.summaryHeaderText}>
                {displayTaxableAmount}
              </Text>
            </View>
            <View style={styles.summaryRowItem}>
              <Text style={styles.summaryCell}>CGST 1.5%</Text>
              <Text style={styles.summaryCell}>
                {formatNumber(taxAmount / 2)}
              </Text>
            </View>
            <View style={styles.summaryRowItem}>
              <Text style={styles.summaryCell}>SGST 1.5%</Text>
              <Text style={styles.summaryCell}>
                {formatNumber(taxAmount / 2)}
              </Text>
            </View>
            <View style={styles.summaryRowItem}>
              <Text style={styles.summaryCell}>Total</Text>
              <Text style={styles.summaryCell}>
                {displayNetAmount}
              </Text>
            </View>
          </View>
        </View>

        {/* Amount in Words + Total Section */}
        <View style={styles.amountTotalRow}>
          <View style={styles.amountSection}>
            <Text style={styles.amountInWords}>Amount In Words:</Text>
            <Text style={styles.amountInWordsText}>
              {amountInWords} Rupees Only
            </Text>
          </View>

          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>
                {displayNetAmount}
              </Text>
            </View>
            {discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount:</Text>
                <Text style={styles.totalValue}>
                  (-) {displayDiscountAmount}
                </Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amt Payable:</Text>
              <Text style={styles.totalValue}>
                {displayNetPayableAmount}
              </Text>
            </View>
          </View>
        </View>

        {/* Note Section */}
        <View style={styles.noteSection}>
          <Text style={styles.noteHeading}>Note:</Text>
          <Text style={styles.noteText}>
            1. Goods once sold will not be taken back or exchanged.
          </Text>
          <Text style={styles.noteText}>
            2. The above-mentioned goods are delivered to you with complete
            approval and are accepted by you after full checking.
          </Text>
          <Text style={styles.noteText}>
            3. We are responsible only for the purity of 916 Gold Ornaments, not
            for any other damages.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.thankYou}>Thank You | Visit Again</Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              alignItems: "center",
            }}
          >
            <Text style={styles.copyright}>SMJ Authorized Sign</Text>
          </View>
        </View>
      </Page>
      {/* ================================================================ */}
      {/* END OF DOCUMENT - NO SECOND PAGE */}
      {/* ================================================================ */}
    </Document>
  );
};

export default InvoicePDF;