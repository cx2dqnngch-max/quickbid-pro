import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { StatusBadge } from "@/components/StatusBadge";
import { TotalsCard } from "@/components/TotalsCard";
import { LineItemRow } from "@/components/LineItemRow";
import { CustomerPicker } from "@/components/CustomerPicker";
import { FormField } from "@/components/FormField";
import { generateId, formatDate } from "@/utils/calculations";
import { shareEstimatePdf } from "@/utils/sharePdf";
import { Estimate, EstimateStatus, Invoice, LineItem } from "@/types/models";
import * as Haptics from "expo-haptics";

export default function EstimateDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    estimates,
    customers,
    profile,
    updateEstimate,
    deleteEstimate,
    addEstimate,
    addInvoice,
    generateEstimateNumber,
    generateInvoiceNumber,
  } = useApp();

  const estimate = estimates.find((e) => e.id === id);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Estimate | null>(estimate ?? null);
  const [sharing, setSharing] = useState(false);
  // Brief loading window: state may not be committed immediately after navigation
  const [notFoundTimeout, setNotFoundTimeout] = useState(false);
  useEffect(() => {
    if (!estimate) {
      const t = setTimeout(() => setNotFoundTimeout(true), 800);
      return () => clearTimeout(t);
    }
  }, [estimate]);
  // Sync form when estimate becomes available after async context commit
  useEffect(() => {
    if (estimate && !form) setForm(estimate);
  }, [estimate]);

  if (!estimate || !form) {
    if (!notFoundTimeout) {
      return (
        <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={[{ color: colors.mutedForeground }]}>Estimate not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[{ color: colors.primary, marginTop: 12 }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const customer = customers.find((c) => c.id === (editing ? form.customerId : estimate.customerId)) ?? estimate.customerSnapshot;
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top + 16;

  const save = async () => {
    await updateEstimate({ ...form, updatedAt: new Date().toISOString() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditing(false);
  };

  const duplicate = async () => {
    const num = await generateEstimateNumber();
    const copy: Estimate = {
      ...estimate,
      id: generateId(),
      estimateNumber: num,
      status: "draft",
      convertedToInvoiceId: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await addEstimate(copy);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(`/estimate/${copy.id}` as any);
  };

  const convertToInvoice = async () => {
    const num = await generateInvoiceNumber();
    const invoice: Invoice = {
      id: generateId(),
      invoiceNumber: num,
      customerId: estimate.customerId,
      customerSnapshot: estimate.customerSnapshot,
      status: "unpaid",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: undefined,
      lineItems: estimate.lineItems.map((li) => ({ ...li, id: generateId() })),
      discount: estimate.discount,
      discountType: estimate.discountType,
      depositRequested: estimate.depositRequested,
      notes: estimate.notes,
      terms: estimate.terms,
      fromEstimateId: estimate.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await addInvoice(invoice);
    await updateEstimate({ ...estimate, convertedToInvoiceId: invoice.id, status: "accepted", updatedAt: new Date().toISOString() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(`/invoice/${invoice.id}` as any);
  };

  const sharePdf = async () => {
    if (!customer) {
      Alert.alert("No Customer", "Please assign a customer to this estimate before sharing.");
      return;
    }
    setSharing(true);
    try {
      await shareEstimatePdf(estimate, customer as any, profile);
    } finally {
      setSharing(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert("Delete Estimate", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteEstimate(id!);
          router.back();
        },
      },
    ]);
  };

  const setStatus = (status: EstimateStatus) => {
    updateEstimate({ ...estimate, status, updatedAt: new Date().toISOString() });
  };

  const STATUS_OPTIONS: EstimateStatus[] = ["draft", "sent", "accepted", "declined"];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.foreground }]} numberOfLines={1}>
          {estimate.estimateNumber}
        </Text>
        {editing ? (
          <Pressable onPress={save}>
            <Text style={[styles.actionText, { color: colors.primary }]}>Save</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => setEditing(true)}>
            <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          {!editing && (
            <>
              <View style={styles.metaRow}>
                <StatusBadge status={estimate.status} />
                <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                  {formatDate(estimate.date)}
                </Text>
              </View>

              {customer && (
                <View style={[styles.customerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Customer</Text>
                  <Text style={[styles.customerName, { color: colors.foreground }]}>{customer.fullName}</Text>
                  {"serviceAddress" in customer && customer.serviceAddress ? (
                    <Text style={[styles.customerAddr, { color: colors.mutedForeground }]}>{customer.serviceAddress}</Text>
                  ) : null}
                </View>
              )}

              <View style={styles.lineItemsList}>
                <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Line Items</Text>
                {estimate.lineItems.map((item) => (
                  <View key={item.id} style={[styles.lineItemView, { borderColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.title}</Text>
                      {item.description ? (
                        <Text style={[styles.itemDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
                      ) : null}
                    </View>
                    <Text style={[styles.itemAmount, { color: colors.foreground }]}>
                      {item.quantity} × {profile.currencySymbol}{item.unitPrice.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              <TotalsCard
                lineItems={estimate.lineItems}
                discount={estimate.discount}
                discountType={estimate.discountType}
                depositRequested={estimate.depositRequested}
                currencySymbol={profile.currencySymbol || "$"}
              />

              {estimate.notes && (
                <View style={[styles.noteBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.noteLabel, { color: colors.mutedForeground }]}>Notes</Text>
                  <Text style={[styles.noteText, { color: colors.foreground }]}>{estimate.notes}</Text>
                </View>
              )}

              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Status</Text>
              <View style={styles.statusRow}>
                {STATUS_OPTIONS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setStatus(s)}
                    style={[
                      styles.statusBtn,
                      {
                        backgroundColor: estimate.status === s ? colors.primary : colors.muted,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBtnText,
                        { color: estimate.status === s ? "#fff" : colors.mutedForeground },
                      ]}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.actionsColumn}>
                {!estimate.convertedToInvoiceId && (
                  <Pressable
                    onPress={convertToInvoice}
                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  >
                    <Feather name="arrow-right-circle" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Convert to Invoice</Text>
                  </Pressable>
                )}

                {estimate.convertedToInvoiceId && (
                  <Pressable
                    onPress={() => router.push(`/invoice/${estimate.convertedToInvoiceId}` as any)}
                    style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                  >
                    <Feather name="file-text" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>View Invoice</Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={sharePdf}
                  disabled={sharing}
                  style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, opacity: sharing ? 0.6 : 1 }]}
                >
                  <Feather name={sharing ? "loader" : "share-2"} size={18} color={colors.foreground} />
                  <Text style={[styles.actionBtnText, { color: colors.foreground }]}>
                    {sharing ? "Generating PDF…" : "Share PDF"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={duplicate}
                  style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
                >
                  <Feather name="copy" size={18} color={colors.foreground} />
                  <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Duplicate</Text>
                </Pressable>

                <Pressable onPress={confirmDelete} style={styles.deleteBtn}>
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                  <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Delete</Text>
                </Pressable>
              </View>
            </>
          )}

          {editing && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Customer</Text>
              <CustomerPicker
                selectedId={form.customerId}
                onSelect={(c) => setForm({ ...form, customerId: c.id, customerSnapshot: c })}
              />

              <View style={styles.datesRow}>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Date"
                    value={form.date}
                    onChangeText={(v) => setForm({ ...form, date: v })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Expires"
                    value={form.expirationDate ?? ""}
                    onChangeText={(v) => setForm({ ...form, expirationDate: v })}
                  />
                </View>
              </View>

              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Line Items</Text>
                <Pressable
                  onPress={() =>
                    setForm({
                      ...form,
                      lineItems: [...form.lineItems, { id: generateId(), title: "", quantity: 1, unitPrice: 0 }],
                    })
                  }
                  style={[styles.addItemBtn, { backgroundColor: colors.primary + "18" }]}
                >
                  <Feather name="plus" size={16} color={colors.primary} />
                  <Text style={[styles.addItemText, { color: colors.primary }]}>Add Item</Text>
                </Pressable>
              </View>

              {form.lineItems.map((item, i) => (
                <LineItemRow
                  key={item.id}
                  item={item}
                  onChange={(updated) =>
                    setForm({
                      ...form,
                      lineItems: form.lineItems.map((li, idx) => (idx === i ? updated : li)),
                    })
                  }
                  onRemove={() =>
                    setForm({ ...form, lineItems: form.lineItems.filter((_, idx) => idx !== i) })
                  }
                  currencySymbol={profile.currencySymbol || "$"}
                />
              ))}

              <TotalsCard
                lineItems={form.lineItems}
                discount={form.discount}
                discountType={form.discountType}
                depositRequested={form.depositRequested}
                currencySymbol={profile.currencySymbol || "$"}
              />

              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Discount</Text>
              <View style={styles.discountRow}>
                <View style={styles.discountTypeToggle}>
                  <Pressable
                    onPress={() => setForm({ ...form, discountType: "flat" })}
                    style={[styles.toggleBtn, { backgroundColor: (form.discountType ?? "flat") === "flat" ? colors.primary : colors.muted }]}
                  >
                    <Text style={[styles.toggleText, { color: (form.discountType ?? "flat") === "flat" ? "#fff" : colors.mutedForeground }]}>$</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setForm({ ...form, discountType: "percent" })}
                    style={[styles.toggleBtn, { backgroundColor: form.discountType === "percent" ? colors.primary : colors.muted }]}
                  >
                    <Text style={[styles.toggleText, { color: form.discountType === "percent" ? "#fff" : colors.mutedForeground }]}>%</Text>
                  </Pressable>
                </View>
                <TextInput
                  style={[styles.discountInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.discount != null ? String(form.discount) : ""}
                  onChangeText={(v) => setForm({ ...form, discount: v ? parseFloat(v) : undefined })}
                  keyboardType="decimal-pad"
                />
              </View>

              <FormField
                label="Deposit Requested (optional)"
                value={form.depositRequested != null ? String(form.depositRequested) : ""}
                onChangeText={(v) => setForm({ ...form, depositRequested: v ? parseFloat(v) : undefined })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <FormField
                label="Notes"
                value={form.notes ?? ""}
                onChangeText={(v) => setForm({ ...form, notes: v })}
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: "top", paddingTop: 10 }}
              />
              <FormField
                label="Terms"
                value={form.terms ?? ""}
                onChangeText={(v) => setForm({ ...form, terms: v })}
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: "top", paddingTop: 10 }}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  navTitle: { fontSize: 17, fontWeight: "600", flex: 1, textAlign: "center", marginHorizontal: 10 },
  actionText: { fontSize: 17, fontWeight: "600" },
  content: { paddingHorizontal: 20 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  dateText: { fontSize: 14 },
  customerCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
  cardLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  customerName: { fontSize: 16, fontWeight: "600" },
  customerAddr: { fontSize: 13, marginTop: 2 },
  sectionTitle: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  addItemBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  addItemText: { fontSize: 13, fontWeight: "600" },
  lineItemsList: { marginBottom: 16 },
  lineItemView: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1 },
  itemTitle: { fontSize: 15, fontWeight: "600" },
  itemDesc: { fontSize: 13, marginTop: 2 },
  itemAmount: { fontSize: 14, fontWeight: "500" },
  noteBlock: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
  noteLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  noteText: { fontSize: 14, lineHeight: 20 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  statusBtn: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  statusBtnText: { fontSize: 13, fontWeight: "600" },
  actionsColumn: { gap: 10 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, justifyContent: "center" },
  actionBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  deleteBtn: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", paddingVertical: 14 },
  deleteBtnText: { fontSize: 15, fontWeight: "600" },
  datesRow: { flexDirection: "row", gap: 10 },
  discountRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  discountTypeToggle: { flexDirection: "row", borderRadius: 8, overflow: "hidden" },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  toggleText: { fontSize: 15, fontWeight: "700" },
  discountInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
});
