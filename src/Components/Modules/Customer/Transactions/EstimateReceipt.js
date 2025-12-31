import React, { useEffect, useState } from "react";
import { Page, Text, View, Document, StyleSheet, Image } from "@react-pdf/renderer";
import QRCode from "qrcode";

// Helper function to format the date in dd-mm-yyyy format
const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Helper function to get the current time in HH:mm:ss format
const formatTime = (date) => {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  // Determine AM/PM
  const period = hours >= 12 ? "PM" : "AM";

  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? String(hours).padStart(2, "0") : "12"; // 0 should be 12

  return `${hours}:${minutes}:${seconds} ${period}`;
};

// Styles optimized for thermal receipt printers
const styles = StyleSheet.create({
  page: {
    padding: 8,
    fontSize: 8,
    fontFamily: "Helvetica",
    lineHeight: 1.2,
    backgroundColor: "#fff",
    width: 226, // Approx. 80mm in points
  },
  heading: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  leftText: {
    fontSize: 8,
  },
  rightText: {
    fontSize: 8,
    textAlign: "right",
  },
  timeText: {
    fontSize: 8,
    textAlign: 'right',
  },
  tableHeader: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#000",
    marginTop: 3,
    paddingTop: 3,
  },
  tableHeader1: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginBottom: 3,
    paddingBottom: 3,
  },
  tableHeader2: {
    flexDirection: "row",
    marginBottom: 2,
    paddingBottom: 2,
  },
  tableHeader3: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginBottom: 3,
    paddingBottom: 3,
  },
  tableCell: {
    fontSize: 8,
  },
  snHeader: {
    width: "8%",
  },
  itemHeader: {
    width: "70%",
  },
  stAmtHeader: {
    width: "20%",
    textAlign: "right",
  },
  grHeader: {
    width: "20%",
  },
  ntHeader: {
    width: "20%",
  },
  vaHeader: {
    width: "20%",
  },
  mcHeader: {
    width: "8%",
    marginRight: '30px',
  },
  totalAmtHeader: {
    width: "50%",
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  snBoldHeader: {
    width: "8%",
    fontFamily: "Helvetica-Bold",
  },
  itemBoldHeader: {
    width: "70%",
    fontFamily: "Helvetica-Bold",
  },
  stAmtBoldHeader: {
    width: "20%",
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  grBoldHeader: {
    width: "20%",
    fontFamily: "Helvetica-Bold",
  },
  ntBoldHeader: {
    width: "20%",
    fontFamily: "Helvetica-Bold",
  },
  vaBoldHeader: {
    width: "20%",
    fontFamily: "Helvetica-Bold",
  },
  mcBoldHeader: {
    width: "8%",
    marginRight: '30px',
    fontFamily: "Helvetica-Bold",
  },
  totalAmtBoldHeader: {
    width: "50%",
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  footerRow: {
    flexDirection: "row",
    marginTop: 3,
    paddingBottom: 5,
  },
  footerText: {
    fontSize: 8,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 3,
  },
  leftAlignedText: {
    fontSize: 8,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  rightAlignedText: {
    fontSize: 8,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  qrCodeContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  qrCode: {
    width: 100,
    height: 100,
  },
});

const PDFContent = ({ entries, totalAmount, date, estimateNumber, sellerName }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const currentDate = new Date();
  const formattedDate = formatDate(currentDate);
  const currentTime = formatTime(currentDate);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(entries[0]?.estimate_number || "", {
          width: 100,
          margin: 2,
        });
        setQrCodeUrl(qrCodeDataUrl);
      } catch (err) {
        console.error("Error generating QR code:", err);
      }
    };

    generateQRCode();
  }, [entries]);

  return (
    <Document>
      <Page size={[226, 500]} style={styles.page}>
        <Text style={styles.heading}>Estimation</Text>

        {entries.length > 0 && (
          <View>
            <View style={styles.row}>
              <Text style={styles.leftText}>Est No: {entries[0].estimate_number}</Text>
              <Text style={styles.rightText}>S.E: New Friend's Jewellery</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.leftText}>Rate: {entries[0].rate}</Text>
              <Text style={styles.rightText}>Date: {formattedDate}</Text>
            </View>
          </View>
        )}

        <View>
          <Text style={styles.timeText}>{currentTime}</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.snBoldHeader]}>S.N</Text>
          <Text style={[styles.tableCell, styles.itemBoldHeader]}>Item</Text>
          <Text style={[styles.tableCell, styles.stAmtBoldHeader]}>st.Amt</Text>
        </View>
        <View style={styles.tableHeader1}>
          <Text style={[styles.tableCell, styles.snHeader]}></Text>
          <Text style={[styles.tableCell, styles.grBoldHeader]}>Gr.wt</Text>
          <Text style={[styles.tableCell, styles.ntBoldHeader]}>Nt.wt</Text>
          <Text style={[styles.tableCell, styles.vaBoldHeader]}>VA</Text>
          <Text style={[styles.tableCell, styles.mcBoldHeader]}>MC</Text>
          <Text style={[styles.tableCell, styles.stAmtBoldHeader]}>Amt</Text>
        </View>
        <View>
          {entries.map((entry, index) => (
            <View key={index}>
              <View style={styles.row}>
                <Text style={[styles.tableCell, styles.snHeader]}>{index + 1}</Text>
                <Text style={[styles.tableCell, styles.itemHeader]}>{entry.product_name}</Text>
                <Text style={[styles.tableCell, styles.stAmtHeader]}>{entry.stones_price}</Text>
              </View>
              <View style={styles.tableHeader2}>
                <Text style={[styles.tableCell, styles.snHeader]}></Text>
                <Text style={[styles.tableCell, styles.grHeader]}>{entry.gross_weight}</Text>
                <Text style={[styles.tableCell, styles.ntHeader]}>{entry.total_weight}</Text>
                <Text style={[styles.tableCell, styles.vaHeader]}>{entry.wastage_percent}</Text>
                <Text style={[styles.tableCell, styles.mcHeader]}>{entry.total_mc}</Text>
                <Text style={[styles.tableCell, styles.stAmtHeader]}>{entry.rate_amt}</Text>
              </View>
            </View>
          ))}
        </View>

        {(() => {
          const totalGrossWeight = entries.reduce((sum, entry) => sum + parseFloat(entry.gross_weight || 0), 0);
          const totalNetWeight = entries.reduce((sum, entry) => sum + parseFloat(entry.total_weight || 0), 0);
          const totalAmount = entries.reduce((sum, entry) => sum + parseFloat(entry.rate_amt || 0), 0);
          const totalMakingCharge = entries.reduce((sum, entry) => sum + parseFloat(entry.total_mc || 0), 0);
          const totalStoneAmount = entries.reduce((sum, entry) => sum + parseFloat(entry.stones_price || 0), 0);
          const hmCharges = entries.reduce((sum, entry) => sum + parseFloat(entry.hm_charges || 0), 0);
          const discountAmount = entries.reduce((sum, entry) => sum + parseFloat(entry.disscount || 0), 0);

          const taxPercent = parseFloat(entries[0]?.tax_percent || 0);
          const taxableAmount = totalAmount + totalMakingCharge + totalStoneAmount + hmCharges - discountAmount;
          const gstAmount = taxableAmount * (taxPercent / 100);
          const cgst = gstAmount / 2;
          const sgst = gstAmount / 2;
          const finalAmount = taxableAmount + gstAmount;

          return (
            <>
              <View style={{ borderTopWidth: 1, borderTopColor: "#000", borderBottomWidth: 1, borderBottomColor: "#000", paddingVertical: 5 }}>
                <View style={styles.footerRow}>
                  <Text style={[styles.tableCell, styles.snBoldHeader]}></Text>
                  <Text style={[styles.tableCell, styles.grBoldHeader]}>{totalGrossWeight.toFixed(3)}</Text>
                  <Text style={[styles.tableCell, styles.ntBoldHeader]}>{totalNetWeight.toFixed(3)}</Text>
                  <Text style={[styles.tableCell, styles.totalAmtHeader]}>{taxableAmount.toFixed(2)}</Text>
                </View>
              </View>
              <View>
                <View style={styles.rowContainer}>
                  <Text style={styles.leftAlignedText}>GST Value:</Text>
                  <Text style={styles.rightAlignedText}>  {taxableAmount.toFixed(2)}</Text>
                </View>
                <View style={styles.rowContainer}>
                  <Text style={styles.leftAlignedText}>CGST@{(taxPercent / 2).toFixed(2)}%:</Text>
                  <Text style={styles.rightAlignedText}>  {cgst.toFixed(2)}</Text>
                </View>
                <View style={styles.rowContainer}>
                  <Text style={styles.leftAlignedText}>SGST@{(taxPercent / 2).toFixed(2)}%:</Text>
                  <Text style={styles.rightAlignedText}>  {sgst.toFixed(2)}</Text>
                </View>
                <View style={styles.rowContainer}>
                  <Text style={styles.leftAlignedText}>Final Amt:</Text>
                  <Text style={styles.rightAlignedText}>  {finalAmount.toFixed(2)}</Text>
                </View>
              </View>

              {/* QR Code */}
              <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                {qrCodeUrl && <Image style={styles.qrCode} src={qrCodeUrl} />}
              </View>
            </>
          );
        })()}
      </Page>
    </Document>
  );
};

export default PDFContent;