import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useIAP, FREE_CUSTOMER_LIMIT, FREE_DOCS_LIMIT } from "@/context/IAPContext";
import { PaywallModal } from "@/components/PaywallModal";
import { FormField } from "@/components/FormField";
import * as Haptics from "expo-haptics";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, estimates, invoices, customers } = useApp();
  const { isPro, productPrice } = useIAP();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ ...profile });
  const [paywallVisible, setPaywallVisible] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top + 16;
  const tabBarHeight = useBottomTabBarHeight();
  const bottomPad = isWeb ? 32 : (tabBarHeight > 0 ? tabBarHeight : 49 + insets.bottom) + 24;

  const docCount = estimates.length + invoices.length;

  const save = async () => {
    await updateProfile(form);
    setSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setSaved(false), 2000);
  };

  const SettingRow = ({ label, value }: { label: string; value?: string }) => (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.settingLabel, { color: colors.foreground }]}>{label}</Text>
      {value && <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{value}</Text>}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>

        {/* Pro status / Upgrade card */}
        {isPro ? (
          <View style={[styles.proCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
            <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
              <Feather name="zap" size={14} color="#fff" />
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.proTitle, { color: colors.foreground }]}>You're on Pro</Text>
              <Text style={[styles.proSub, { color: colors.mutedForeground }]}>
                Unlimited customers, estimates & invoices.
              </Text>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setPaywallVisible(true)}
            style={({ pressed }) => [
              styles.upgradeCard,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={styles.upgradeCardLeft}>
              <Feather name="zap" size={20} color="#fff" />
              <View>
                <Text style={styles.upgradeCardTitle}>Upgrade to Pro</Text>
                <Text style={styles.upgradeCardSub}>
                  {docCount}/{FREE_DOCS_LIMIT} docs · {customers.length}/{FREE_CUSTOMER_LIMIT} customers used
                </Text>
              </View>
            </View>
            <View style={styles.upgradePriceBadge}>
              <Text style={styles.upgradePriceText}>{productPrice}</Text>
            </View>
          </Pressable>
        )}

        {/* Business Profile */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Business Profile</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <FormField
            label="Business Name"
            value={form.businessName}
            onChangeText={(v) => setForm({ ...form, businessName: v })}
            placeholder="Your Business Name"
          />
          <FormField
            label="Owner Name"
            value={form.ownerName}
            onChangeText={(v) => setForm({ ...form, ownerName: v })}
            placeholder="Your Name"
          />
          <FormField
            label="Phone"
            value={form.phone}
            onChangeText={(v) => setForm({ ...form, phone: v })}
            placeholder="(555) 000-0000"
            keyboardType="phone-pad"
          />
          <FormField
            label="Email"
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormField
            label="Business Address"
            value={form.address}
            onChangeText={(v) => setForm({ ...form, address: v })}
            placeholder="123 Main St, City, ST"
          />
        </View>

        {/* Document Defaults */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Document Defaults</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <FormField
            label="Default Notes"
            value={form.defaultNotes}
            onChangeText={(v) => setForm({ ...form, defaultNotes: v })}
            placeholder="e.g. Thank you for your business!"
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: "top", paddingTop: 10 }}
          />
          <FormField
            label="Default Terms"
            value={form.defaultTerms}
            onChangeText={(v) => setForm({ ...form, defaultTerms: v })}
            placeholder="e.g. Payment due within 30 days"
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: "top", paddingTop: 10 }}
          />
        </View>

        {/* Numbering */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Numbering</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <FormField
            label="Estimate Prefix"
            value={form.estimatePrefix}
            onChangeText={(v) => setForm({ ...form, estimatePrefix: v })}
            placeholder="EST-"
            autoCapitalize="characters"
          />
          <FormField
            label="Invoice Prefix"
            value={form.invoicePrefix}
            onChangeText={(v) => setForm({ ...form, invoicePrefix: v })}
            placeholder="INV-"
            autoCapitalize="characters"
          />
          <FormField
            label="Currency Symbol"
            value={form.currencySymbol}
            onChangeText={(v) => setForm({ ...form, currencySymbol: v })}
            placeholder="$"
            maxLength={3}
          />
        </View>

        {/* App Info */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>App Info</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow label="Version" value="1.0.0" />
          <SettingRow label="Plan" value={isPro ? "Pro" : "Free"} />
          <SettingRow label="Estimates Created" value={String(estimates.length)} />
          <SettingRow label="Invoices Created" value={String(invoices.length)} />
          <SettingRow label="Customers" value={String(customers.length)} />
        </View>

        {/* Save Changes */}
        <Pressable
          onPress={save}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: saved ? colors.success : colors.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Feather name={saved ? "check" : "save"} size={18} color="#fff" />
          <Text style={styles.saveBtnText}>{saved ? "Saved" : "Save Changes"}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 8 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20 },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  settingLabel: { fontSize: 15, fontWeight: "500" },
  settingValue: { fontSize: 14 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16, marginTop: 8 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  // Pro card
  proCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  proBadgeText: { color: "#fff", fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  proTitle: { fontSize: 15, fontWeight: "700" },
  proSub: { fontSize: 13, marginTop: 2 },
  // Upgrade card
  upgradeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  upgradeCardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  upgradeCardTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  upgradeCardSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  upgradePriceBadge: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  upgradePriceText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
