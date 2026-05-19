// Customer/src/components/Customer/Transactions/TaxInvoiceA4.js
import React, { useEffect, useState } from "react";
import { Page, Text, View, Document, StyleSheet, Image } from "@react-pdf/renderer";
import { toWords } from "number-to-words";
import QRCode from "qrcode";

const styles = StyleSheet.create({
  page: {
    padding: 5,
    fontSize: 8,
  },
  section: {
    marginBottom: 10,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    marginBottom: 10,
  },
  boldText: {
    fontWeight: "bold",
  },
  image1: {
    width: '90%',
    height: 100,
    marginTop: 0,
  },
  divider: {
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    marginTop: -10,
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: 'black',
    width: '100%',
  },
  leftColumn: {
    marginLeft: 100,
    fontSize: 7,
  },
  rightColumn: {
    flex: 1,
    paddingLeft: 10,
    fontSize: 7,
  },
  flatNo: {
    marginBottom: 2,
  },
  cin: {
    marginBottom: 2,
  },
  branch: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  branchContent: {
    marginBottom: 2,
  },
  divider1: {
    width: 1,
    height: '100%',
    backgroundColor: 'black',
  },
  horizontalLine1: {
    width: '100%',
    height: 1,
    alignSelf: 'center',
    marginBottom: 2,
  },
  horizontalLine: {
    width: '100%',
    height: 1,
    backgroundColor: 'black',
    alignSelf: 'center',
    marginBottom: 2,
  },
  boxContainer: {
    width: '100%',
    height: '100%',
    border: '1px solid black',
    marginBottom: 20,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableCell: {
    padding: 5,
    textAlign: 'center',
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    fontFamily: 'Times-Roman'
  },
  tableCellHeader: {
    width: '4%',
    textAlign: 'right',
    marginTop: '-4'
  },
  tableCellDescription: {
    width: '24%',
    textAlign: 'left',
    marginTop: '-4'
  },
  tableCellHSN: {
    width: '8%',
    textAlign: 'center',
    marginTop: '-4'
  },
  tableCellQty: {
    width: '5%',
    textAlign: 'center',
    marginTop: '-4'
  },
  tableCellPurity: {
    width: '10%',
    textAlign: 'left',
    marginTop: '-4'
  },
  tableCellGrossWt: {
    width: '10%',
    textAlign: 'right',
    marginTop: '-4'
  },
  tableCellStoneWt: {
    width: '10%',
    textAlign: 'right',
    marginTop: '-4'
  },
  tableCellNetWt: {
    width: '10%',
    textAlign: 'right',
    marginTop: '-4'
  },
  tableCellRate: {
    width: '10%',
    textAlign: 'right',
    marginTop: '-4'
  },
  tableCellMC: {
    width: '10%',
    textAlign: 'right',
    marginTop: '-4'
  },
  tableCellStAmt: {
    width: '9%',
    textAlign: 'right',
    marginTop: '-4'
  },
  tableCellTotal: {
    width: '10%',
    textAlign: 'right',
    marginTop: '-4'
  },
  lastheight: {
    height: 28,
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
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 5,
  },
  companyAddress: {
    textAlign: 'center',
    fontSize: 8,
    marginBottom: 10,
    fontFamily: 'Times-Bold',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  leftContainer: {
    width: '2%',
    paddingRight: 10,
    fontFamily: 'Times-Bold',
  },
  customerDetails: {
    width: '56%',
    paddingRight: 10,
    fontFamily: 'Times-Bold',
  },
  taxInvoiceDetails: {
    width: '30%',
    paddingLeft: 10,
    fontFamily: 'Times-Bold',
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detailLabel: {
    flex: 1,
  },
  detailValue: {
    textAlign: "right",
    flex: 1,
  },
  summaryContainer: {
    marginTop: 10,
    width: '100%',
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontFamily: 'Times-Bold',
  },
  summaryLeft: {
    width: '40%',
    paddingLeft: 10,
  },
  summaryMiddle: {
    width: '20%',
    paddingLeft: 10,
  },
  summaryRight: {
    width: '40%',
    paddingRight: 10,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  itemsContainer: {
    minHeight: 200,
    flexDirection: 'column',
  },
  fillerRow: {
    display: 'flex',
    flexDirection: 'row',
    height: 22,
  },
  fillerCell: {
    width: '4%',
  },
  fillerCellDescription: {
    width: '24%',
  },
  fillerCellHSN: {
    width: '8%',
  },
  fillerCellQty: {
    width: '5%',
  },
  fillerCellPurity: {
    width: '10%',
  },
  fillerCellGrossWt: {
    width: '10%',
  },
  fillerCellStoneWt: {
    width: '10%',
  },
  fillerCellNetWt: {
    width: '10%',
  },
  fillerCellRate: {
    width: '10%',
  },
  fillerCellMC: {
    width: '10%',
  },
  fillerCellStAmt: {
    width: '9%',
  },
  fillerCellTotal: {
    width: '10%',
  },
});

const TaxInvoiceA4 = ({
  formData,
  repairDetails,
  cash_amount = 0,
  discountAmt = 0,
  festivalDiscountAmt = 0,
  card_amt = 0,
  chq_amt = 0,
  online_amt = 0,
  taxableAmount = 0,
  taxAmount = 0,
  oldItemsAmount = 0,
  schemeAmount = 0,
  salesNetAmount = 0,
  salesTaxableAmount = 0,
  selectedAdvanceReceiptAmount = 0,
  netAmount = 0,
  netPayableAmount = 0,
  product = [],
  company = null
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(repairDetails[0]?.invoice_number || "", {
          width: 100,
          margin: 2,
        });
        setQrCodeUrl(qrCodeDataUrl);
      } catch (err) {
        console.error("Error generating QR code:", err);
      }
    };

    if (repairDetails && repairDetails.length > 0) {
      generateQRCode();
    }
  }, [repairDetails]);

  // Calculate total values
  const totalValues = (repairDetails || []).reduce(
    (totals, item) => {
      return {
        qty: totals.qty + Number(item.qty || 0),
        grossWeight: totals.grossWeight + Number(item.gross_weight || 0),
        stoneWeight: totals.stoneWeight + Number(item.stone_weight || 0),
        netWeight: totals.netWeight + Number(item.total_weight_av || 0),
        rate: totals.rate + Number(item.rate || 0),
        makingCharges: totals.makingCharges + Number(item.making_charges || 0),
        stonePrice: totals.stonePrice + Number(item.stone_price || 0),
        rateAmount: totals.rateAmount + Number(item.rate_amt || 0),
        hmCharges: totals.hmCharges + Number(item.hm_charges || 0),
      };
    },
    {
      qty: 0,
      grossWeight: 0,
      stoneWeight: 0,
      netWeight: 0,
      rate: 0,
      makingCharges: 0,
      stonePrice: 0,
      rateAmount: 0,
      hmCharges: 0,
    }
  );

  // Convert the value into words
  const netBillValueInWords = netPayableAmount ? toWords(Math.round(netPayableAmount)).replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()) : "ZERO";
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Format company address in one line
  const companyAddress = company ? `${company.address || ""}, ${company.address2 || ""}, ${company.city || ""}, ${company.state || ""} - ${company.pincode || ""}` : "Jiya Jewellery, Mumbai, Maharashtra - 400001";

  // Calculate how many filler rows we need
  const itemCount = (repairDetails || []).length;
  const fillerRowsNeeded = Math.max(0, 10 - itemCount);

  // Get company name
  const companyName = company?.company_name?.toUpperCase() || "JIYA JEWELLERY";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Logo covering full width at the top */}
        <View style={styles.logoContainer}>
          {company?.logo ? (
            <Image style={styles.image1} src={company.logo} />
          ) : (
            <Text style={styles.heading}>JIYA JEWELLERY</Text>
          )}
        </View>

        {/* Company address in one line below logo */}
        <View style={styles.companyAddress}>
          <Text>{companyAddress}</Text>
        </View>

        {/* Customer Details (Left) and Tax Invoice Details (Right) side by side */}
        <View style={styles.detailsContainer}>
          {/* Left Column - Customer Details */}
          <View style={styles.leftContainer}></View>
          <View style={styles.customerDetails}>
            <Text style={[styles.boldText, { marginBottom: 5 }]}>CUSTOMER DETAILS:</Text>
            <Text style={{ marginBottom: 4 }}>{formData?.account_name || ""},</Text>
            <Text style={{ marginBottom: 4 }}>MOBILE: {formData?.mobile || ""}</Text>
            <Text style={{ marginBottom: 4 }}>GSTIN: {formData?.gst_in || ""}</Text>
            <Text style={{ marginBottom: 4 }}>PAN NO: {formData?.pan_card || ""}</Text>
            <Text style={{ marginBottom: 4 }}>Aadhar: {formData?.aadhar_card || ""}</Text>
            <Text style={{ marginBottom: 4 }}>
              Address: {formData?.address1 || ""}, {formData?.address2 || ""}, {formData?.city || ""}, {formData?.state || ""} - {formData?.pincode || ""}
            </Text>
          </View>

          {/* Right Column - Tax Invoice Details */}
          <View style={styles.taxInvoiceDetails}>
            <Text style={{ fontWeight: "bold", fontSize: 12, marginBottom: 10, textAlign: 'center' }}>TAX INVOICE</Text>

            {/* BILL NO */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>BILL NO:</Text>
              <Text style={styles.detailValue}>{formData?.invoice_number || ""}</Text>
            </View>

            {/* DATE */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>DATE:</Text>
              <Text style={styles.detailValue}>{formatDate(formData?.date)}</Text>
            </View>

            {/* TIME */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>TIME:</Text>
              <Text style={styles.detailValue}>{currentTime}</Text>
            </View>

            {/* GSTIN */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>GSTIN:</Text>
              <Text style={styles.detailValue}>{company?.gst_no?.trim() || ""}</Text>
            </View>

            {/* Contact Info */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>MOBILE:</Text>
              <Text style={styles.detailValue}>{company?.mobile || ""}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailValue}>{company?.phone || ""}</Text>
            </View>
          </View>
          <View style={styles.leftContainer}></View>
        </View>

        {/* Rest of the content */}
        <View style={styles.container}>
          <View style={styles.boxContainer}>
            <View style={styles.table}>
              <View style={[styles.tableRow, { fontFamily: 'Times-Bold' }]}>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>SI</Text>
                <View style={styles.divider1} />

                <Text style={[styles.tableCell, styles.tableCellDescription]}>Description</Text>
                <View style={styles.divider1} />

                <Text style={[styles.tableCell, styles.tableCellHSN]}>HSN</Text>
                <View style={styles.divider1} />

                <Text style={[styles.tableCell, styles.tableCellQty]}>Qty</Text>
                <View style={styles.divider1} />

                <Text style={[styles.tableCell, styles.tableCellPurity]}>Purity</Text>
                <View style={styles.divider1} />

                <Text style={[styles.tableCell, styles.tableCellGrossWt]}>Gross.Wt
                  <Text style={{ fontFamily: 'Times-Roman', fontSize: 7 }}>  In Gms</Text>
                </Text>
                <View style={styles.divider1} />

                <Text style={[styles.tableCell, styles.tableCellStoneWt]}>Stone.Wt
                  <Text style={{ fontFamily: 'Times-Roman', fontSize: 7 }}>   In Gms</Text>
                </Text>
                <View style={styles.divider1} />

                <Text style={[styles.tableCell, styles.tableCellNetWt]}>Net.Wt
                  <Text style={{ fontFamily: 'Times-Roman', fontSize: 7 }}>   In Gms</Text>
                </Text>
                <View style={styles.divider1} />

                <Text style={[styles.tableCell, styles.tableCellRate]}>Rate</Text>
                <View style={styles.divider1} />

                <Text style={[styles.tableCell, styles.tableCellMC]}>MC</Text>
                <View style={styles.divider1} />

                <Text style={[styles.tableCell, styles.tableCellStAmt]}>St.Amt</Text>
                <View style={styles.divider1} />

                <Text style={[styles.tableCell, styles.tableCellTotal]}>Total</Text>
              </View>
              <View style={styles.horizontalLine} />

              {/* Items container with actual items and filler rows */}
              <View style={styles.itemsContainer}>
                {/* Actual items */}
                {(repairDetails || []).map((item, index) => {
                  const matchedProduct = (product || []).find(p => p.product_name === item.category);
                  const totalItemValue = (parseFloat(item.rate_amt || 0) + 
                                         parseFloat(item.stone_price || 0) + 
                                         parseFloat(item.making_charges || 0) + 
                                         parseFloat(item.hm_charges || 0)).toFixed(2);

                  return (
                    <View style={[styles.tableRow, { fontFamily: 'Times-Roman' }]} key={index}>
                      <Text style={[styles.tableCell, styles.tableCellHeader]}>{index + 1}</Text>
                      <View style={[styles.divider1, { marginTop: -2 }]} />

                      <Text style={[styles.tableCell, styles.tableCellDescription]}>
                        {item.metal_type || "N/A"}-{item.product_name || "N/A"}
                      </Text>
                      <View style={[styles.divider1, { marginTop: -2 }]} />

                      <Text style={[styles.tableCell, styles.tableCellHSN]}>{matchedProduct?.hsn_code || "7113"}</Text>
                      <View style={[styles.divider1, { marginTop: -2 }]} />

                      <Text style={[styles.tableCell, styles.tableCellQty]}>
                        {item.qty || "0"}
                      </Text>
                      <View style={[styles.divider1, { marginTop: -2 }]} />

                      <Text style={[styles.tableCell, styles.tableCellPurity]}>
                        {item.printing_purity || item.selling_purity || "0.000"}
                      </Text>
                      <View style={[styles.divider1, { marginTop: -2 }]} />

                      <Text style={[styles.tableCell, styles.tableCellGrossWt]}>
                        {Number(item.gross_weight || 0).toFixed(3)}
                      </Text>
                      <View style={[styles.divider1, { marginTop: -2 }]} />

                      <Text style={[styles.tableCell, styles.tableCellStoneWt]}>
                        {Number(item.stone_weight || 0).toFixed(3)}
                      </Text>
                      <View style={[styles.divider1, { marginTop: -2 }]} />

                      <Text style={[styles.tableCell, styles.tableCellNetWt]}>
                        {Number(item.total_weight_av || item.weight_bw || 0).toFixed(3)}
                      </Text>
                      <View style={[styles.divider1, { marginTop: -2 }]} />

                      <Text style={[styles.tableCell, styles.tableCellRate]}>
                        {item.pieace_cost ? Number(item.pieace_cost).toFixed(2) : Number(item.rate || 0).toFixed(2)}
                      </Text>
                      <View style={[styles.divider1, { marginTop: -2 }]} />

                      <Text style={[styles.tableCell, styles.tableCellMC]}>
                        {item.mc_per_gram != null && item.mc_per_gram !== ""
                          ? (['gold', 'diamond', 'others'].includes(item.metal_type?.toLowerCase())
                              ? `${parseFloat(item.mc_per_gram).toFixed(2)} %`
                              : parseFloat(item.mc_per_gram).toFixed(2))
                          : ''}
                      </Text>
                      <View style={[styles.divider1, { marginTop: -2 }]} />

                      <Text style={[styles.tableCell, styles.tableCellStAmt]}>
                        {Number(item.stone_price || 0).toFixed(2)}
                      </Text>
                      <View style={[styles.divider1, { marginTop: -2 }]} />

                      <Text style={[styles.tableCell, styles.tableCellTotal]}>
                        {totalItemValue}
                      </Text>
                    </View>
                  );
                })}

                {/* Filler rows to maintain table structure with borders */}
                {Array.from({ length: fillerRowsNeeded }).map((_, index) => (
                  <View style={[styles.fillerRow, { fontFamily: 'Times-Roman' }]} key={`filler-${index}`}>
                    <Text style={[styles.fillerCell]}></Text>
                    <View style={[styles.divider1, { marginTop: -2 }]} />

                    <Text style={[styles.fillerCellDescription]}></Text>
                    <View style={[styles.divider1, { marginTop: -2 }]} />

                    <Text style={[styles.fillerCellHSN]}></Text>
                    <View style={[styles.divider1, { marginTop: -2 }]} />

                    <Text style={[styles.fillerCellQty]}></Text>
                    <View style={[styles.divider1, { marginTop: -2 }]} />

                    <Text style={[styles.fillerCellPurity]}></Text>
                    <View style={[styles.divider1, { marginTop: -2 }]} />

                    <Text style={[styles.fillerCellGrossWt]}></Text>
                    <View style={[styles.divider1, { marginTop: -2 }]} />

                    <Text style={[styles.fillerCellStoneWt]}></Text>
                    <View style={[styles.divider1, { marginTop: -2 }]} />

                    <Text style={[styles.fillerCellNetWt]}></Text>
                    <View style={[styles.divider1, { marginTop: -2 }]} />

                    <Text style={[styles.fillerCellRate]}></Text>
                    <View style={[styles.divider1, { marginTop: -2 }]} />

                    <Text style={[styles.fillerCellMC]}></Text>
                    <View style={[styles.divider1, { marginTop: -2 }]} />

                    <Text style={[styles.fillerCellStAmt]}></Text>
                    <View style={[styles.divider1, { marginTop: -2 }]} />

                    <Text style={[styles.fillerCellTotal]}></Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.horizontalLine, { marginTop: -2 }]} />

            {/* Total row */}
            <View style={[styles.tableRow, { fontFamily: 'Times-Bold' }]}>
              <Text style={[styles.tableCell, styles.tableCellHeader, styles.lastheight]}></Text>
              <View style={[styles.divider1, { marginTop: -2 }]} />

              <Text style={[styles.tableCell, styles.tableCellDescription, styles.lastheight]}></Text>
              <View style={[styles.divider1, { marginTop: -2 }]} />

              <Text style={[styles.tableCell, styles.tableCellHSN, styles.lastheight]}></Text>
              <View style={[styles.divider1, { marginTop: -2 }]} />

              <Text style={[styles.tableCell, styles.tableCellQty, styles.lastheight]}>
                {Math.round(totalValues.qty)}
              </Text>
              <View style={[styles.divider1, { marginTop: -2 }]} />

              <Text style={[styles.tableCell, styles.tableCellPurity, styles.lastheight]}></Text>
              <View style={[styles.divider1, { marginTop: -2 }]} />

              <Text style={[styles.tableCell, styles.tableCellGrossWt, styles.lastheight]}>
                {totalValues.grossWeight.toFixed(3)}
              </Text>
              <View style={[styles.divider1, { marginTop: -2 }]} />

              <Text style={[styles.tableCell, styles.tableCellStoneWt, styles.lastheight]}></Text>
              <View style={[styles.divider1, { marginTop: -2 }]} />

              <Text style={[styles.tableCell, styles.tableCellNetWt, styles.lastheight]}>
                {totalValues.netWeight.toFixed(3)}
              </Text>
              <View style={[styles.divider1, { marginTop: -2 }]} />

              <Text style={[styles.tableCell, styles.tableCellRate, styles.lastheight]}></Text>
              <View style={[styles.divider1, { marginTop: -2 }]} />

              <Text style={[styles.tableCell, styles.tableCellMC, styles.lastheight]}></Text>
              <View style={[styles.divider1, { marginTop: -2 }]} />

              <Text style={[styles.tableCell, styles.tableCellStAmt, styles.lastheight]}></Text>
              <View style={[styles.divider1, { marginTop: -2 }]} />

              <Text style={[styles.tableCell, styles.tableCellTotal, styles.lastheight]}>
                {(totalValues.rateAmount + totalValues.makingCharges + totalValues.stonePrice + totalValues.hmCharges).toFixed(2)}
              </Text>
            </View>

            <View style={[styles.horizontalLine, { marginTop: -2 }]} />

            {/* Summary section moved to bottom */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                {/* Left Side Content */}
                <View style={styles.summaryLeft}>
                  <View style={styles.summaryItem}>
                    <Text>Cash Recd:</Text>
                    <Text>{Number(cash_amount || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text>Card Recd:</Text>
                    <Text>{Number(card_amt || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text>Cheque Recd:</Text>
                    <Text>{Number(chq_amt || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text>NEFT Recd:</Text>
                    <Text>{Number(online_amt || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text>Balance Amount:</Text>
                    <Text>
                      {(
                        Math.round(Number(netPayableAmount || 0)) -
                        (Number(cash_amount || 0) +
                          Number(chq_amt || 0) +
                          Number(card_amt || 0) +
                          Number(online_amt || 0))
                      ).toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.summaryItem, { marginTop: 20 }]}>
                    <Text>Bank A/C No:</Text>
                    <Text>{company?.bank_account_no || ""}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text>Bank A/C Name:</Text>
                    <Text>{company?.bank_name || ""}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text>IFSC Code:</Text>
                    <Text>{company?.ifsc_code || ""}</Text>
                  </View>
                </View>

                {/* Right Side Content */}
                <View style={styles.summaryRight}>
                  <View style={styles.summaryItem}>
                    <Text>(-) Discount:</Text>
                    <Text>{Number(discountAmt || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text>(-) Fest Discount:</Text>
                    <Text>{Number(festivalDiscountAmt || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text>(-) OLD:</Text>
                    <Text>{Number(oldItemsAmount || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text>GST Value:</Text>
                    <Text>{Number(taxableAmount || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text>CGST @1.50%:</Text>
                    <Text>{(Number(taxAmount || 0) / 2).toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text>SGST @1.50%:</Text>
                    <Text>{(Number(taxAmount || 0) / 2).toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text>Net Bill Value:</Text>
                    <Text>{Number(netAmount || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text>(-) SCHEME:</Text>
                    <Text>{Number(schemeAmount || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text>(-) SALE RETURN:</Text>
                    <Text>{Number(salesNetAmount || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text>(-) ADVANCE RECEIPT:</Text>
                    <Text>{Number(selectedAdvanceReceiptAmount || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text>Net Amount:</Text>
                    <Text>{Math.round(Number(netPayableAmount || 0)).toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={{ alignItems: "center", fontFamily: 'Times-Bold', marginTop: 10 }}>
              <Text>
                (Rupees {netBillValueInWords} Only)
              </Text>
            </View>

            <View style={{ flexDirection: "row", marginTop: 20, justifyContent: "space-between", marginBottom: 3, fontFamily: 'Times-Bold' }}>
              {/* Left Side */}
              <View style={{ alignItems: "flex-start", paddingLeft: 10 }}>
                <Text>For Customer</Text>
              </View>

              {/* Right Side */}
              <View style={{ alignItems: "flex-end", paddingRight: 10 }}>
                <Text>For {companyName}</Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {qrCodeUrl && (
                <Image
                  source={{ uri: qrCodeUrl }}
                  style={styles.qrCode}
                />
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default TaxInvoiceA4;