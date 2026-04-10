import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { FormField } from "@/components/FormField";
import { DocCard } from "@/components/DocCard";
import * as Haptics from "expo-haptics";

export default function CustomerDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { customers, estimates, invoices, updateCustomer, deleteCustomer, profile } = useApp();

  const customer = customers.find((c) => c.id === id);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(customer ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!customer || !form) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Customer not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[{ color: colors.primary, marginTop: 12 }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const customerEstimates = estimates.filter((e) => e.customerId === id);
  const customerInvoices = invoices.filter((i) => i.customerId === id);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    if (!form.serviceAddress.trim()) errs.serviceAddress = "Service address is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    await updateCustomer({ ...form, updatedAt: new Date().toISOString() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditing(false);
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete Customer",
      `Delete ${customer.fullName}? This cannot be undone. Their documents will remain in history.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteCustomer(id!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          },
        },
      ]
    );
  };

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top + 16;
  const sym = profile.currencySymbol || "$";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.foreground }]} numberOfLines={1}>
          {customer.fullName}
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
          {editing ? (
            <>
              <FormField label="Full Name" required value={form.fullName} onChangeText={(v) => setForm({ ...form, fullName: v })} error={errors.fullName} autoCapitalize="words" />
              <FormField label="Company Name" value={form.companyName ?? ""} onChangeText={(v) => setForm({ ...form, companyName: v })} placeholder="Optional" />
              <FormField label="Phone" required value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} error={errors.phone} keyboardType="phone-pad" />
              <FormField label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />
              <FormField label="Service Address" required value={form.serviceAddress} onChangeText={(v) => setForm({ ...form, serviceAddress: v })} error={errors.serviceAddress} autoCapitalize="words" />
              <FormField label="Billing Address" value={form.billingAddress ?? ""} onChangeText={(v) => setForm({ ...form, billingAddress: v })} autoCapitalize="words" />
              <FormField label="Notes" value={form.notes ?? ""} onChangeText={(v) => setForm({ ...form, notes: v })} multiline numberOfLines={3} style={{ height: 80, textAlignVertical: "top", paddingTop: 10 }} />
              <Pressable onPress={confirmDelete} style={styles.deleteBtn}>
                <Feather name="trash-2" size={16} color={colors.destructive} />
                <Text style={[styles.deleteText, { color: colors.destructive }]}>Delete Customer</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {customer.fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.nameText, { color: colors.foreground }]}>{customer.fullName}</Text>
                {customer.companyName && <Text style={[styles.companyText, { color: colors.mutedForeground }]}>{customer.companyName}</Text>}
                <View style={styles.contactRow}>
                  <Feather name="phone" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.contactText, { color: colors.foreground }]}>{customer.phone}</Text>
                </View>
                {customer.email ? (
                  <View style={styles.contactRow}>
                    <Feather name="mail" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.contactText, { color: colors.foreground }]}>{customer.email}</Text>
                  </View>
                ) : null}
                <View style={styles.contactRow}>
                  <Feather name="map-pin" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.contactText, { color: colors.foreground }]}>{customer.serviceAddress}</Text>
                </View>
                {customer.notes ? (
                  <Text style={[styles.notesText, { color: colors.mutedForeground, borderTopColor: colors.border }]}>{customer.notes}</Text>
                ) : null}
              </View>

              <View style={styles.docActions}>
                <Pressable
                  onPress={() => router.push({ pathname: "/estimate/new", params: { customerId: id } } as any)}
                  style={[styles.docActionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}
                >
                  <Feather name="file-plus" size={18} color={colors.primary} />
                  <Text style={[styles.docActionText, { color: colors.primary }]}>New Estimate</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push({ pathname: "/invoice/new", params: { customerId: id } } as any)}
                  style={[styles.docActionBtn, { backgroundColor: colors.accent + "15", borderColor: colors.accent + "30" }]}
                >
                  <Feather name="dollar-sign" size={18} color={colors.accent} />
                  <Text style={[styles.docActionText, { color: colors.accent }]}>New Invoice</Text>
                </Pressable>
              </View>

              {customerEstimates.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Estimates ({customerEstimates.length})</Text>
                  {customerEstimates.slice(0, 3).map((e) => (
                    <DocCard key={e.id} doc={e} type="estimate" currencySymbol={sym} onPress={() => router.push(`/estimate/${e.id}` as any)} />
                  ))}
                </>
              )}

              {customerInvoices.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Invoices ({customerInvoices.length})</Text>
                  {customerInvoices.slice(0, 3).map((i) => (
                    <DocCard key={i.id} doc={i} type="invoice" currencySymbol={sym} onPress={() => router.push(`/invoice/${i.id}` as any)} />
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { fontSize: 16 },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  navTitle: { fontSize: 17, fontWeight: "600", flex: 1, textAlign: "center", marginHorizontal: 10 },
  actionText: { fontSize: 17, fontWeight: "600" },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  infoCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", marginBottom: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: "700" },
  nameText: { fontSize: 20, fontWeight: "700", marginBottom: 2 },
  companyText: { fontSize: 14, marginBottom: 12 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, alignSelf: "stretch" },
  contactText: { fontSize: 14 },
  notesText: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, fontSize: 13, alignSelf: "stretch", textAlign: "center" },
  docActions: { flexDirection: "row", gap: 10, marginBottom: 20 },
  docActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, padding: 14, justifyContent: "center" },
  docActionText: { fontSize: 14, fontWeight: "600" },
  sectionTitle: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  deleteBtn: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", paddingVertical: 14, marginTop: 8 },
  deleteText: { fontSize: 15, fontWeight: "600" },
});
