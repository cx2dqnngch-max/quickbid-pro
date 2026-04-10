import React, { useEffect, useState } from "react";
import {
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
import { useIAP, FREE_DOCS_LIMIT } from "@/context/IAPContext";
import { PaywallModal } from "@/components/PaywallModal";
import { FormField } from "@/components/FormField";
import { LineItemRow } from "@/components/LineItemRow";
import { TotalsCard } from "@/components/TotalsCard";
import { CustomerPicker } from "@/components/CustomerPicker";
import { generateId, todayISO, addDays } from "@/utils/calculations";
import { Invoice, LineItem } from "@/types/models";
import * as Haptics from "expo-haptics";

export default function NewInvoiceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { customerId: prefillCustomerId } = useLocalSearchParams<{ customerId?: string }>();
  const { addInvoice, generateInvoiceNumber, profile, customers, estimates, invoices } = useApp();
  const { isPro } = useIAP();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const docCount = estimates.length + invoices.length;

  // Safety net: if user somehow opens this screen at the doc limit
  useEffect(() => {
    if (!isPro && docCount >= FREE_DOCS_LIMIT) {
      setPaywallVisible(true);
    }
  }, []);

  const [customerId, setCustomerId] = useState(prefillCustomerId ?? "");
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(addDays(todayISO(), 30));
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: generateId(), title: "", quantity: 1, unitPrice: 0 },
  ]);
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [depositRequested, setDepositRequested] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [notes, setNotes] = useState(profile.defaultNotes ?? "");
  const [terms, setTerms] = useState(profile.defaultTerms ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!customerId) errs.customer = "Please select a customer";
    if (lineItems.length === 0) {
      errs.lineItems = "Add at least one line item";
    } else {
      lineItems.forEach((item, i) => {
        if (!item.title.trim()) errs[`item_${i}`] = "Description required";
      });
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstError = errs.customer
        ? "Please select a customer."
        : "Please fill in all line item descriptions.";
      Alert.alert("Cannot Save", firstError);
    }
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (saving) return;
    if (!validate()) return;
    setSaving(true);
    try {
      const num = await generateInvoiceNumber();
      const invoice: Invoice = {
        id: generateId(),
        invoiceNumber: num,
        customerId,
        customerSnapshot: selectedCustomer,
        status: "unpaid",
        issueDate,
        dueDate: dueDate || undefined,
        lineItems,
        discount: discount ? parseFloat(discount) : undefined,
        discountType,
        depositRequested: depositRequested ? parseFloat(depositRequested) : undefined,
        paymentNote: paymentNote.trim() || undefined,
        notes: notes.trim() || undefined,
        terms: terms.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addInvoice(invoice);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/invoice/${invoice.id}` as any);
    } catch (e) {
      console.error("Save invoice error:", e);
      setSaving(false);
      Alert.alert("Save Failed", "Something went wrong. Please try again.");
    }
  };

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top + 16;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PaywallModal
        visible={paywallVisible}
        onClose={() => { setPaywallVisible(false); if (!isPro) router.back(); }}
        reason="docs"
      />
      <View style={[styles.navBar, { paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>New Invoice</Text>
        <Pressable onPress={save} disabled={saving} hitSlop={10}>
          {saving ? (
            <Text style={[styles.saveText, { color: colors.mutedForeground }]}>Saving…</Text>
          ) : (
            <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Customer</Text>
          {errors.customer ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "40" }]}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorBannerText, { color: colors.destructive }]}>{errors.customer}</Text>
            </View>
          ) : null}
          <CustomerPicker
            selectedId={customerId}
            onSelect={(c) => { setCustomerId(c.id); setErrors((e) => ({ ...e, customer: "" })); }}
          />

          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Dates</Text>
          <View style={styles.datesRow}>
            <View style={{ flex: 1 }}>
              <FormField label="Issue Date" value={issueDate} onChangeText={setIssueDate} placeholder="YYYY-MM-DD" />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Due Date" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" />
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Line Items</Text>
            <Pressable
              onPress={() => setLineItems([...lineItems, { id: generateId(), title: "", quantity: 1, unitPrice: 0 }])}
              style={[styles.addItemBtn, { backgroundColor: colors.primary + "18" }]}
            >
              <Feather name="plus" size={16} color={colors.primary} />
              <Text style={[styles.addItemText, { color: colors.primary }]}>Add Item</Text>
            </Pressable>
          </View>
          {errors.lineItems ? (
            <Text style={[styles.inlineError, { color: colors.destructive }]}>{errors.lineItems}</Text>
          ) : null}

          {lineItems.map((item, i) => (
            <View key={item.id}>
              <LineItemRow
                item={item}
                onChange={(updated) => {
                  setLineItems(lineItems.map((li, idx) => (idx === i ? updated : li)));
                  if (updated.title.trim()) {
                    setErrors((e) => { const n = { ...e }; delete n[`item_${i}`]; return n; });
                  }
                }}
                onRemove={() => setLineItems(lineItems.filter((_, idx) => idx !== i))}
                currencySymbol={profile.currencySymbol || "$"}
              />
              {errors[`item_${i}`] ? (
                <Text style={[styles.inlineError, { color: colors.destructive }]}>
                  {errors[`item_${i}`]}
                </Text>
              ) : null}
            </View>
          ))}

          <TotalsCard
            lineItems={lineItems}
            discount={discount ? parseFloat(discount) : undefined}
            discountType={discountType}
            depositRequested={depositRequested ? parseFloat(depositRequested) : undefined}
            currencySymbol={profile.currencySymbol || "$"}
          />

          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Discount</Text>
          <View style={styles.discountRow}>
            <View style={styles.discountTypeToggle}>
              <Pressable
                onPress={() => setDiscountType("flat")}
                style={[styles.toggleBtn, { backgroundColor: discountType === "flat" ? colors.primary : colors.muted }]}
              >
                <Text style={[styles.toggleText, { color: discountType === "flat" ? "#fff" : colors.mutedForeground }]}>$</Text>
              </Pressable>
              <Pressable
                onPress={() => setDiscountType("percent")}
                style={[styles.toggleBtn, { backgroundColor: discountType === "percent" ? colors.primary : colors.muted }]}
              >
                <Text style={[styles.toggleText, { color: discountType === "percent" ? "#fff" : colors.mutedForeground }]}>%</Text>
              </Pressable>
            </View>
            <TextInput
              style={[styles.discountInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              value={discount}
              onChangeText={setDiscount}
              keyboardType="decimal-pad"
            />
          </View>

          <FormField
            label="Deposit Requested (optional)"
            value={depositRequested}
            onChangeText={setDepositRequested}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />

          <FormField
            label="Payment Instructions (optional)"
            value={paymentNote}
            onChangeText={setPaymentNote}
            placeholder="e.g. Pay via Venmo @mybiz or Cash/Check"
            multiline
            numberOfLines={2}
            style={{ height: 70, textAlignVertical: "top", paddingTop: 10 }}
          />
          <FormField
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Job notes..."
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: "top", paddingTop: 10 }}
          />
          <FormField
            label="Terms"
            value={terms}
            onChangeText={setTerms}
            placeholder="Payment terms..."
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: "top", paddingTop: 10 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  navTitle: { fontSize: 17, fontWeight: "600" },
  saveText: { fontSize: 17, fontWeight: "700" },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  sectionTitle: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  addItemBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  addItemText: { fontSize: 13, fontWeight: "600" },
  inlineError: { fontSize: 12, marginBottom: 8, marginTop: 2 },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 10 },
  errorBannerText: { fontSize: 13, fontWeight: "500", flex: 1 },
  datesRow: { flexDirection: "row", gap: 10 },
  discountRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  discountTypeToggle: { flexDirection: "row", borderRadius: 8, overflow: "hidden" },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  toggleText: { fontSize: 15, fontWeight: "700" },
  discountInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
});
