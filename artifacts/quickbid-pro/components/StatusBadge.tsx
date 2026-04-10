import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { EstimateStatus, InvoiceStatus } from "@/types/models";

type Status = EstimateStatus | InvoiceStatus;

interface Props {
  status: Status;
}

const STATUS_CONFIG: Record<Status, { label: string; bg: string; color: string }> = {
  draft: { label: "Draft", bg: "#f1f5f9", color: "#64748b" },
  sent: { label: "Sent", bg: "#e0f2fe", color: "#0369a1" },
  accepted: { label: "Accepted", bg: "#dcfce7", color: "#15803d" },
  declined: { label: "Declined", bg: "#fee2e2", color: "#dc2626" },
  paid: { label: "Paid", bg: "#dcfce7", color: "#15803d" },
  unpaid: { label: "Unpaid", bg: "#fee2e2", color: "#dc2626" },
  overdue: { label: "Overdue", bg: "#fef3c7", color: "#d97706" },
};

export function StatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
