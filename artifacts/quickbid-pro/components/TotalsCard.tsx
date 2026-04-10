import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { LineItem } from "@/types/models";
import { calcDiscount, calcSubtotal, calcTotal, formatCurrency } from "@/utils/calculations";

interface Props {
  lineItems: LineItem[];
  discount?: number;
  discountType?: "flat" | "percent";
  depositRequested?: number;
  currencySymbol: string;
}

export function TotalsCard({ lineItems, discount, discountType, depositRequested, currencySymbol }: Props) {
  const colors = useColors();
  const subtotal = calcSubtotal(lineItems);
  const discountAmt = calcDiscount(subtotal, discount, discountType);
  const total = calcTotal(lineItems, discount, discountType);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Row label="Subtotal" value={formatCurrency(subtotal, currencySymbol)} colors={colors} />
      {discountAmt > 0 && (
        <Row
          label={`Discount${discountType === "percent" ? ` (${discount}%)` : ""}`}
          value={`-${formatCurrency(discountAmt, currencySymbol)}`}
          colors={colors}
          valueColor={colors.success}
        />
      )}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.totalRow}>
        <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
        <Text style={[styles.totalValue, { color: colors.foreground }]}>{formatCurrency(total, currencySymbol)}</Text>
      </View>
      {depositRequested && depositRequested > 0 ? (
        <View style={styles.depositRow}>
          <Text style={[styles.depositLabel, { color: colors.primary }]}>Deposit Requested</Text>
          <Text style={[styles.depositValue, { color: colors.primary }]}>{formatCurrency(depositRequested, currencySymbol)}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Row({ label, value, colors, valueColor }: { label: string; value: string; colors: any; valueColor?: string }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.value, { color: valueColor ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: "600" },
  divider: { height: 1, marginVertical: 8 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 18, fontWeight: "700" },
  totalValue: { fontSize: 20, fontWeight: "700" },
  depositRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    marginTop: 4,
  },
  depositLabel: { fontSize: 14, fontWeight: "600" },
  depositValue: { fontSize: 14, fontWeight: "700" },
});
