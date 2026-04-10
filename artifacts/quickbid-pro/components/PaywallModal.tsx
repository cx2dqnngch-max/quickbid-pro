import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useIAP } from "@/context/IAPContext";

const FEATURES = [
  "Unlimited customers",
  "Unlimited estimates & invoices",
  "Unlimited PDF exports",
  "One-time purchase — no subscription",
];

interface Props {
  visible: boolean;
  onClose: () => void;
  reason?: "customers" | "docs";
}

export function PaywallModal({ visible, onClose, reason }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPro, isLoading, productPrice, productsLoaded, purchase, restorePurchases } = useIAP();

  const handlePurchase = async () => {
    await purchase();
    if (isPro) onClose(); // auto-close handled via isPro state change below
  };

  const handleRestore = async () => {
    await restorePurchases();
  };

  // Close automatically once upgrade succeeds
  React.useEffect(() => {
    if (isPro && visible) onClose();
  }, [isPro, visible]);

  const limitMessage =
    reason === "customers"
      ? "You've reached the free limit of 3 customers."
      : reason === "docs"
      ? "You've reached the free limit of 5 estimates & invoices."
      : "Upgrade to unlock the full app.";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        {/* Close button */}
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={styles.body}>
          {/* Icon */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Feather name="zap" size={34} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.foreground }]}>
            Upgrade to Pro
          </Text>

          {/* Limit message */}
          <Text style={[styles.limitMsg, { color: colors.mutedForeground }]}>
            {limitMessage}
          </Text>

          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            One-time purchase. Unlock everything, forever.
          </Text>

          {/* Feature list */}
          <View
            style={[
              styles.featureCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {FEATURES.map((f, i) => (
              <View
                key={i}
                style={[
                  styles.featureRow,
                  i < FEATURES.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Feather name="check" size={16} color={colors.success} />
                <Text style={[styles.featureText, { color: colors.foreground }]}>
                  {f}
                </Text>
              </View>
            ))}
          </View>

          {/* Purchase button — disabled until StoreKit confirms the product */}
          <Pressable
            onPress={handlePurchase}
            disabled={isLoading || !productsLoaded}
            style={({ pressed }) => [
              styles.purchaseBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed || isLoading || !productsLoaded ? 0.75 : 1,
              },
            ]}
          >
            {isLoading || !productsLoaded ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.purchaseBtnText}>
                Upgrade for {productPrice}
              </Text>
            )}
          </Pressable>

          {/* Restore */}
          <Pressable
            onPress={handleRestore}
            disabled={isLoading}
            style={styles.restoreBtn}
            hitSlop={8}
          >
            <Text style={[styles.restoreText, { color: colors.mutedForeground }]}>
              Restore Purchase
            </Text>
          </Pressable>

          <Text style={[styles.legal, { color: colors.mutedForeground }]}>
            Payment is charged to your Apple ID account. This is a one-time,
            non-consumable purchase.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, alignItems: "flex-end" },
  closeBtn: { padding: 4 },
  body: { flex: 1, paddingHorizontal: 24, alignItems: "center", paddingTop: 8 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  limitMsg: { fontSize: 15, textAlign: "center", marginBottom: 6, fontWeight: "500" },
  subtitle: { fontSize: 14, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  featureCard: {
    width: "100%",
    borderRadius: 14,
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
  featureText: { fontSize: 15, fontWeight: "500", flex: 1 },
  purchaseBtn: {
    width: "100%",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    minHeight: 58,
  },
  purchaseBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  restoreBtn: { marginBottom: 20 },
  restoreText: { fontSize: 14, fontWeight: "500", textDecorationLine: "underline" },
  legal: { fontSize: 11, textAlign: "center", lineHeight: 16, paddingHorizontal: 8 },
});
