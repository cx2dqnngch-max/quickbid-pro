import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { DocCard } from "@/components/DocCard";

type Filter = "all" | "estimates" | "invoices" | "paid" | "unpaid";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { estimates, invoices, customers, profile } = useApp();
  const [filter, setFilter] = useState<Filter>("all");

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top + 16;
  const bottomPad = isWeb ? 34 : insets.bottom + 80;

  const allDocs = [
    ...estimates.map((e) => ({ ...e, docType: "estimate" as const })),
    ...invoices.map((i) => ({ ...i, docType: "invoice" as const })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const filtered = allDocs.filter((doc) => {
    if (filter === "all") return true;
    if (filter === "estimates") return doc.docType === "estimate";
    if (filter === "invoices") return doc.docType === "invoice";
    if (filter === "paid") return doc.docType === "invoice" && doc.status === "paid";
    if (filter === "unpaid") return doc.docType === "invoice" && (doc.status === "unpaid" || doc.status === "overdue");
    return true;
  });

  const sym = profile.currencySymbol || "$";

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "estimates", label: "Estimates" },
    { key: "invoices", label: "Invoices" },
    { key: "paid", label: "Paid" },
    { key: "unpaid", label: "Unpaid" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>History</Text>
      </View>
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterBtn,
              {
                backgroundColor: filter === f.key ? colors.primary : colors.muted,
                borderColor: filter === f.key ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f.key ? "#fff" : colors.mutedForeground },
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyIcon, { color: colors.border }]}>📄</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No documents</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {filter === "all" ? "Create an estimate or invoice to get started." : "Nothing matches this filter."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: bottomPad }}
          renderItem={({ item }) => {
            const cust = customers.find((c) => c.id === item.customerId)?.fullName ?? item.customerSnapshot?.fullName;
            return (
              <DocCard
                doc={item}
                type={item.docType}
                customerName={cust}
                currencySymbol={sym}
                onPress={() => router.push(`/${item.docType}/${item.id}` as any)}
              />
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: "700" },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: "600" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
});
