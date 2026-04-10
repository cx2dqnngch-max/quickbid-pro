import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useIAP, FREE_CUSTOMER_LIMIT } from "@/context/IAPContext";
import { PaywallModal } from "@/components/PaywallModal";
import { Customer } from "@/types/models";
import * as Haptics from "expo-haptics";

export default function CustomersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { customers, estimates, invoices } = useApp();
  const { isPro } = useIAP();
  const [search, setSearch] = useState("");
  const [paywallVisible, setPaywallVisible] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top + 16;
  const bottomPad = isWeb ? 34 : insets.bottom + 80;

  const filtered = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const handleNewCustomer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isPro && customers.length >= FREE_CUSTOMER_LIMIT) {
      setPaywallVisible(true);
      return;
    }
    router.push("/customer/new" as any);
  };

  const getDocCount = (customerId: string) => {
    const e = estimates.filter((doc) => doc.customerId === customerId).length;
    const i = invoices.filter((doc) => doc.customerId === customerId).length;
    return e + i;
  };

  const atLimit = !isPro && customers.length >= FREE_CUSTOMER_LIMIT;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        reason="customers"
      />

      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Customers</Text>
          {!isPro && (
            <Text style={[styles.limitHint, { color: atLimit ? colors.destructive : colors.mutedForeground }]}>
              {customers.length}/{FREE_CUSTOMER_LIMIT} free
            </Text>
          )}
        </View>
        <Pressable
          onPress={handleNewCustomer}
          style={[styles.addBtn, { backgroundColor: atLimit ? colors.muted : colors.primary }]}
        >
          <Feather name={atLimit ? "lock" : "plus"} size={18} color={atLimit ? colors.mutedForeground : "#fff"} />
        </Pressable>
      </View>

      <View style={[styles.searchRow, { paddingHorizontal: 20 }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search customers..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="users" size={48} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {search ? "No results" : "No customers yet"}
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {search ? "Try a different search" : "Tap + to add your first customer"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: bottomPad }}
          renderItem={({ item }) => (
            <CustomerRow
              customer={item}
              docCount={getDocCount(item.id)}
              colors={colors}
              onPress={() => router.push(`/customer/${item.id}` as any)}
            />
          )}
        />
      )}
    </View>
  );
}

function CustomerRow({ customer, docCount, colors, onPress }: { customer: Customer; docCount: number; colors: any; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.customerRow,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
        <Text style={[styles.avatarText, { color: colors.primary }]}>
          {customer.fullName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.customerName, { color: colors.foreground }]}>{customer.fullName}</Text>
        {customer.companyName ? (
          <Text style={[styles.customerCompany, { color: colors.mutedForeground }]}>{customer.companyName}</Text>
        ) : null}
        <Text style={[styles.customerMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
          {customer.phone}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        {docCount > 0 && (
          <View style={[styles.docBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.docBadgeText, { color: colors.mutedForeground }]}>{docCount} doc{docCount !== 1 ? "s" : ""}</Text>
          </View>
        )}
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: "700" },
  limitHint: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  searchRow: { marginBottom: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  emptyText: { fontSize: 14 },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "700" },
  customerName: { fontSize: 15, fontWeight: "600" },
  customerCompany: { fontSize: 13 },
  customerMeta: { fontSize: 13 },
  docBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  docBadgeText: { fontSize: 12, fontWeight: "600" },
});
