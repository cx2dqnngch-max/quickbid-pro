import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { Customer } from "@/types/models";

interface Props {
  selectedId?: string;
  onSelect: (customer: Customer) => void;
}

export function CustomerPicker({ selectedId, onSelect }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { customers } = useApp();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = customers.find((c) => c.id === selectedId);
  const filtered = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.picker,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {selected ? (
          <View style={{ flex: 1 }}>
            <Text style={[styles.selectedName, { color: colors.foreground }]}>{selected.fullName}</Text>
            {selected.companyName ? (
              <Text style={[styles.selectedCompany, { color: colors.mutedForeground }]}>{selected.companyName}</Text>
            ) : null}
          </View>
        ) : (
          <Text style={[styles.placeholder, { color: colors.mutedForeground }]}>Select customer...</Text>
        )}
        <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
      </Pressable>
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Select Customer</Text>
            <Pressable onPress={() => setOpen(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={[styles.searchBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Search customers..."
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="users" size={36} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No customers found</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(c) => c.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { onSelect(item); setOpen(false); }}
                  style={[
                    styles.customerRow,
                    { backgroundColor: item.id === selectedId ? colors.primary + "15" : colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                      {item.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.customerName, { color: colors.foreground }]}>{item.fullName}</Text>
                    {item.companyName ? (
                      <Text style={[styles.customerCompany, { color: colors.mutedForeground }]}>{item.companyName}</Text>
                    ) : null}
                    <Text style={[styles.customerAddress, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {item.serviceAddress}
                    </Text>
                  </View>
                  {item.id === selectedId && <Feather name="check" size={18} color={colors.primary} />}
                </Pressable>
              )}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  picker: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  selectedName: { fontSize: 16, fontWeight: "600" },
  selectedCompany: { fontSize: 13 },
  placeholder: { fontSize: 16, flex: 1 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 16 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 15 },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "700" },
  customerName: { fontSize: 15, fontWeight: "600" },
  customerCompany: { fontSize: 13 },
  customerAddress: { fontSize: 12 },
});
