import React, { useState } from "react";
import {
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
import { useIAP, FREE_CUSTOMER_LIMIT, FREE_DOCS_LIMIT } from "@/context/IAPContext";
import { PaywallModal } from "@/components/PaywallModal";
import { DocCard } from "@/components/DocCard";
import { calcTotal } from "@/utils/calculations";
import * as Haptics from "expo-haptics";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, estimates, invoices, customers } = useApp();
  const { isPro } = useIAP();

  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallReason, setPaywallReason] = useState<"customers" | "docs">("docs");

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top + 16;
  const bottomPad = isWeb ? 34 : insets.bottom + 80;

  const docCount = estimates.length + invoices.length;
  const unpaidCount = invoices.filter((i) => i.status === "unpaid" || i.status === "overdue").length;
  const recentDocs = [
    ...estimates.map((e) => ({ ...e, docType: "estimate" as const })),
    ...invoices.map((i) => ({ ...i, docType: "invoice" as const })),
  ]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const totalOutstanding = invoices
    .filter((i) => i.status === "unpaid" || i.status === "overdue")
    .reduce((sum, i) => sum + calcTotal(i.lineItems, i.discount, i.discountType), 0);

  const navigate = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(path as any);
  };

  const handleNewDoc = (path: "/estimate/new" | "/invoice/new") => {
    if (!isPro && docCount >= FREE_DOCS_LIMIT) {
      setPaywallReason("docs");
      setPaywallVisible(true);
      return;
    }
    navigate(path);
  };

  const handleNewCustomer = () => {
    if (!isPro && customers.length >= FREE_CUSTOMER_LIMIT) {
      setPaywallReason("customers");
      setPaywallVisible(true);
      return;
    }
    navigate("/customer/new");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        reason={paywallReason}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back</Text>
            <Text style={[styles.bizName, { color: colors.foreground }]} numberOfLines={1}>
              {profile.businessName || "QuickBid Pro"}
            </Text>
          </View>
          {unpaidCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
              <Text style={styles.badgeText}>{unpaidCount}</Text>
            </View>
          )}
        </View>

        {/* Outstanding balance card */}
        {totalOutstanding > 0 && (
          <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.statLabel}>Outstanding</Text>
            <Text style={styles.statAmount}>
              {profile.currencySymbol}{totalOutstanding.toFixed(2)}
            </Text>
            <Text style={styles.statSub}>{unpaidCount} unpaid invoice{unpaidCount !== 1 ? "s" : ""}</Text>
          </View>
        )}

        {/* Free tier usage banner */}
        {!isPro && (
          <Pressable
            onPress={() => { setPaywallReason("docs"); setPaywallVisible(true); }}
            style={[styles.usageBanner, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.usageLabel, { color: colors.foreground }]}>
                Free Plan — {docCount}/{FREE_DOCS_LIMIT} documents
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: docCount >= FREE_DOCS_LIMIT ? colors.destructive : colors.primary,
                      width: `${Math.min(100, (docCount / FREE_DOCS_LIMIT) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
            <Text style={[styles.upgradeLink, { color: colors.primary }]}>Upgrade</Text>
          </Pressable>
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <ActionBtn
            icon="file-plus"
            label="New Estimate"
            colors={colors}
            onPress={() => handleNewDoc("/estimate/new")}
            accent={colors.primary}
            locked={!isPro && docCount >= FREE_DOCS_LIMIT}
          />
          <ActionBtn
            icon="dollar-sign"
            label="New Invoice"
            colors={colors}
            onPress={() => handleNewDoc("/invoice/new")}
            accent="#0ea5e9"
            locked={!isPro && docCount >= FREE_DOCS_LIMIT}
          />
          <ActionBtn
            icon="user-plus"
            label="Add Customer"
            colors={colors}
            onPress={handleNewCustomer}
            accent="#22c55e"
            locked={!isPro && customers.length >= FREE_CUSTOMER_LIMIT}
          />
          <ActionBtn
            icon="clock"
            label="History"
            colors={colors}
            onPress={() => navigate("/(tabs)/history")}
            accent="#f59e0b"
            locked={false}
          />
        </View>

        {/* Recent Documents */}
        {recentDocs.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Recent</Text>
              <Pressable onPress={() => router.push("/(tabs)/history" as any)}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </Pressable>
            </View>
            {recentDocs.map((doc) => {
              const cust = doc.customerId
                ? customers.find((c) => c.id === doc.customerId)?.fullName ??
                  doc.customerSnapshot?.fullName
                : undefined;
              return (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  type={doc.docType}
                  customerName={cust}
                  currencySymbol={profile.currencySymbol || "$"}
                  onPress={() => router.push(`/${doc.docType}/${doc.id}` as any)}
                />
              );
            })}
          </>
        )}

        {recentDocs.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="file-text" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Ready to start</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Create your first estimate or invoice above.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ActionBtn({
  icon,
  label,
  colors,
  onPress,
  accent,
  locked,
}: {
  icon: string;
  label: string;
  colors: any;
  onPress: () => void;
  accent: string;
  locked: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: accent + "18" }]}>
        <Feather name={locked ? "lock" : (icon as any)} size={22} color={locked ? colors.mutedForeground : accent} />
      </View>
      <Text style={[styles.actionLabel, { color: locked ? colors.mutedForeground : colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  greeting: { fontSize: 14 },
  bizName: { fontSize: 24, fontWeight: "700" },
  badge: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  statCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  statLabel: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600", marginBottom: 4 },
  statAmount: { color: "#fff", fontSize: 32, fontWeight: "700", fontVariant: ["tabular-nums"] },
  statSub: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 },
  usageBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
  },
  usageLabel: { fontSize: 13, fontWeight: "500", marginBottom: 6 },
  progressTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  upgradeLink: { fontSize: 13, fontWeight: "700" },
  sectionTitle: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  seeAll: { fontSize: 14, fontWeight: "600" },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  actionBtn: { borderRadius: 14, borderWidth: 1, padding: 16, width: "47.5%", alignItems: "flex-start", gap: 10 },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 14, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
