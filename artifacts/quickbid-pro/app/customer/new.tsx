import React, { useEffect, useState } from "react";
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
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useIAP, FREE_CUSTOMER_LIMIT } from "@/context/IAPContext";
import { PaywallModal } from "@/components/PaywallModal";
import { FormField } from "@/components/FormField";
import { generateId } from "@/utils/calculations";
import { Customer } from "@/types/models";
import * as Haptics from "expo-haptics";

export default function NewCustomerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addCustomer, customers } = useApp();
  const { isPro } = useIAP();
  const [paywallVisible, setPaywallVisible] = useState(false);

  // Safety net: if user somehow opens this screen at the customer limit
  useEffect(() => {
    if (!isPro && customers.length >= FREE_CUSTOMER_LIMIT) {
      setPaywallVisible(true);
    }
  }, []);

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Full name is required";
    if (!phone.trim()) errs.phone = "Phone number is required";
    if (!serviceAddress.trim()) errs.serviceAddress = "Service address is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const customer: Customer = {
        id: generateId(),
        fullName: fullName.trim(),
        companyName: companyName.trim() || undefined,
        phone: phone.trim(),
        email: email.trim(),
        serviceAddress: serviceAddress.trim(),
        billingAddress: billingAddress.trim() || undefined,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addCustomer(customer);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setSaving(false);
    }
  };

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top + 16;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PaywallModal
        visible={paywallVisible}
        onClose={() => { setPaywallVisible(false); if (!isPro) router.back(); }}
        reason="customers"
      />
      <View style={[styles.navBar, { paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>New Customer</Text>
        <Pressable onPress={save} disabled={saving} hitSlop={10}>
          <Text style={[styles.saveText, { color: saving ? colors.mutedForeground : colors.primary }]}>
            {saving ? "Saving…" : "Save"}
          </Text>
        </Pressable>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <FormField
            label="Full Name"
            required
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. John Smith"
            error={errors.fullName}
            autoCapitalize="words"
          />
          <FormField
            label="Company Name"
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="Optional"
            autoCapitalize="words"
          />
          <FormField
            label="Phone"
            required
            value={phone}
            onChangeText={setPhone}
            placeholder="(555) 000-0000"
            error={errors.phone}
            keyboardType="phone-pad"
          />
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="customer@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormField
            label="Service Address"
            required
            value={serviceAddress}
            onChangeText={setServiceAddress}
            placeholder="123 Main St, City, ST 12345"
            error={errors.serviceAddress}
            autoCapitalize="words"
          />
          <FormField
            label="Billing Address"
            value={billingAddress}
            onChangeText={setBillingAddress}
            placeholder="Same as service address if different"
            autoCapitalize="words"
          />
          <FormField
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Any notes about this customer..."
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
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  navTitle: { fontSize: 17, fontWeight: "600" },
  saveText: { fontSize: 17, fontWeight: "700" },
  content: { paddingHorizontal: 20, paddingTop: 16 },
});
