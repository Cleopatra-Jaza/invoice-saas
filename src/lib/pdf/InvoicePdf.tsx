import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatMoney } from "@/lib/money";
import type { InvoicePlain } from "@/lib/invoice-data";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111827" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  orgName: { fontSize: 14, fontWeight: 700 },
  title: { fontSize: 22, fontWeight: 700, textAlign: "right" },
  meta: { marginTop: 4, textAlign: "right", color: "#374151" },
  section: { marginBottom: 16 },
  label: { fontSize: 9, color: "#374151", marginBottom: 2, fontWeight: 700 },
  billTo: { marginTop: 2 },
  table: { marginTop: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  rowLast: { flexDirection: "row" },
  th: { padding: 6, backgroundColor: "#F9FAFB", fontWeight: 700 },
  td: { padding: 6 },
  desc: { flex: 3 },
  qty: { flex: 1, textAlign: "right" },
  price: { flex: 1.5, textAlign: "right" },
  amt: { flex: 1.5, textAlign: "right" },
  totals: { marginTop: 12, marginLeft: "auto", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalLabel: { color: "#374151" },
  grand: { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: "#E5E7EB", fontWeight: 700 },
  notes: { marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#E5E7EB" },
});

export function InvoicePdf({ invoice }: { invoice: InvoicePlain }) {
  const date = (iso: string) => iso.slice(0, 10);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.orgName}>{invoice.organization.name}</Text>
          </View>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.meta}>{invoice.number}</Text>
            <Text style={styles.meta}>Status: {invoice.status}</Text>
            <Text style={styles.meta}>Issue: {date(invoice.issueDate)}</Text>
            <Text style={styles.meta}>Due: {date(invoice.dueDate)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Bill to</Text>
          <Text style={styles.billTo}>{invoice.client.name}</Text>
          {invoice.client.company ? <Text>{invoice.client.company}</Text> : null}
          <Text>{invoice.client.email}</Text>
          {invoice.client.address ? <Text>{invoice.client.address}</Text> : null}
        </View>

        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.th, styles.desc]}>Description</Text>
            <Text style={[styles.th, styles.qty]}>Qty</Text>
            <Text style={[styles.th, styles.price]}>Unit price</Text>
            <Text style={[styles.th, styles.amt]}>Amount</Text>
          </View>
          {invoice.items.map((item, idx) => (
            <View key={idx} style={idx === invoice.items.length - 1 ? styles.rowLast : styles.row}>
              <Text style={[styles.td, styles.desc]}>{item.description}</Text>
              <Text style={[styles.td, styles.qty]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.price]}>{formatMoney(item.unitPrice, invoice.currency)}</Text>
              <Text style={[styles.td, styles.amt]}>{formatMoney(item.amount, invoice.currency)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text>{formatMoney(invoice.subtotal, invoice.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>VAT ({invoice.taxRate}%)</Text>
            <Text>{formatMoney(invoice.tax, invoice.currency)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grand]}>
            <Text>Total</Text>
            <Text>{formatMoney(invoice.total, invoice.currency)}</Text>
          </View>
        </View>

        {invoice.notes ? (
          <View style={styles.notes}>
            <Text style={styles.label}>Notes</Text>
            <Text>{invoice.notes}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}