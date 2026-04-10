import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Estimate, Invoice } from "@/types/models";
import { StatusBadge } from "./StatusBadge";
import { calcTotal, formatCurrency, formatDate } from "@/utils/calculations";

interface Props {
  doc: Estimate | Invoice;
  type: "estimate" | "invoice";
  customerName?: string;
  currencySymbol: string;
  onPress: () => void;
}

export function DocCard({ doc, type, customerName, currencySymbol, onPress }: Props) {
  const colors = useColors();
  const total = calcTotal(doc.lineItems, doc.discount, doc.discountType);
  const num = type === "estimate" ? (doc as Estimate).estimateNumber : (doc as Invoice).invoiceNumber;
  const date = type === "estimate" ? (doc as Estimate).date : (doc as Invoice).issueDate;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.numRow}>
          <Text style={[styles.num, { color: colors.primary }]}>{num}</Text>
          <StatusBadge status={doc.status} />
        </View>
        <Text style={[styles.amount, { color: colors.foreground }]}>{formatCurrency(total, currencySymbol)}</Text>
      </View>
      <View style={styles.bottomRow}>
        <View style={{ flex: 1 }}>
          {customerName ? (
            <Text style={[styles.customer, { color: colors.foreground }]} numberOfLines={1}>
              {customerName}
            </Text>
          ) : null}
          <Text style={[styles.date, { color: colors.mutedForeground }]}>{formatDate(date)}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  numRow: {
    flexDirection: "column",
    gap: 6,
  },
  num: {
    fontSize: 14,
    fontWeight: "700",
  },
  amount: {
    fontSize: 20,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  customer: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
  },
});
