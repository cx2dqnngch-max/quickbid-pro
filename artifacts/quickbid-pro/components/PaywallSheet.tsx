import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
  feature?: string;
}

const PRO_FEATURES = [
  "Unlimited estimates",
  "Unlimited invoices",
  "Unlimited customers",
  "Unlimited PDF exports",
  "Duplicate documents",
  "Priority templates (coming soon)",
];

export function PaywallSheet({ visible, onClose, feature }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleSubscribe = (_plan: "monthly" | "annual") => {
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="zap" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Upgrade to Pro</Text>
          {feature ? (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {feature} requires a Pro subscription.
            </Text>
          ) : (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Everything you need to run your business.
            </Text>
          )}

          <View style={[styles.featureList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {PRO_FEATURES.map((f, i) => (
              <View key={i} style={[styles.featureRow, i < PRO_FEATURES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <Feather name="check-circle" size={18} color={colors.success} />
                <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => handleSubscribe("annual")}
            style={({ pressed }) => [
              styles.planBtn,
              styles.planBtnPrimary,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View>
              <Text style={styles.planBtnLabel}>Annual — $59.99/year</Text>
              <Text style={[styles.planBtnSub, { color: "rgba(255,255,255,0.75)" }]}>Save 50% — $5/month</Text>
            </View>
            <View style={styles.bestBadge}>
              <Text style={styles.bestBadgeText}>Best Value</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => handleSubscribe("monthly")}
            style={({ pressed }) => [
              styles.planBtn,
              { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.planBtnLabel, { color: colors.foreground }]}>Monthly — $9.99/month</Text>
          </Pressable>

          <Text style={[styles.legal, { color: colors.mutedForeground }]}>
            Subscriptions renew automatically. Cancel anytime in App Store settings.
            Prices are in USD.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8, alignItems: "flex-end" },
  content: { paddingHorizontal: 24, paddingBottom: 24, alignItems: "center" },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 8,
  },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, textAlign: "center", marginBottom: 28, lineHeight: 22 },
  featureList: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  featureText: { fontSize: 15, fontWeight: "500" },
  planBtn: {
    width: "100%",
    borderRadius: 14,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  planBtnPrimary: {},
  planBtnLabel: { fontSize: 16, fontWeight: "700", color: "#fff" },
  planBtnSub: { fontSize: 13, marginTop: 2 },
  bestBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bestBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  legal: { fontSize: 11, textAlign: "center", lineHeight: 16, marginTop: 8 },
});
