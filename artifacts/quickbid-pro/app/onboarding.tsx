import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { FormField } from "@/components/FormField";
import * as Haptics from "expo-haptics";

const STEPS = ["Business", "Contact", "Preferences"];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateProfile } = useApp();

  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [defaultNotes, setDefaultNotes] = useState("");
  const [defaultTerms, setDefaultTerms] = useState("Payment is due within 30 days of invoice date.");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 0 && !businessName.trim()) errs.businessName = "Business name is required";
    if (step === 1 && !ownerName.trim()) errs.ownerName = "Owner name is required";
    if (step === 1 && !phone.trim()) errs.phone = "Phone number is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const finish = async () => {
    await updateProfile({
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      defaultNotes: defaultNotes.trim(),
      defaultTerms: defaultTerms.trim(),
      onboardingComplete: true,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.stepIndicator}>
            {STEPS.map((s, i) => (
              <View key={i} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: i <= step ? colors.primary : colors.border,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.stepLabel,
                    { color: i === step ? colors.primary : colors.mutedForeground },
                  ]}
                >
                  {s}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.hero}>
            <View style={[styles.heroIcon, { backgroundColor: colors.primary + "15" }]}>
              <Text style={{ fontSize: 36 }}>⚡</Text>
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {step === 0 && "Your Business"}
              {step === 1 && "Your Contact Info"}
              {step === 2 && "Default Settings"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {step === 0 && "Let's set up your business profile for estimates and invoices."}
              {step === 1 && "Customers will see this info on all your documents."}
              {step === 2 && "These defaults appear on every new document."}
            </Text>
          </View>

          {step === 0 && (
            <>
              <FormField
                label="Business Name"
                required
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Mike's Pressure Washing"
                error={errors.businessName}
                autoCapitalize="words"
              />
            </>
          )}

          {step === 1 && (
            <>
              <FormField
                label="Your Name"
                required
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="e.g. Mike Johnson"
                error={errors.ownerName}
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
                placeholder="mike@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <FormField
                label="Business Address (optional)"
                value={address}
                onChangeText={setAddress}
                placeholder="123 Main St, City, ST 12345"
                autoCapitalize="words"
              />
            </>
          )}

          {step === 2 && (
            <>
              <FormField
                label="Default Notes (optional)"
                value={defaultNotes}
                onChangeText={setDefaultNotes}
                placeholder="e.g. Thank you for your business!"
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: "top", paddingTop: 10 }}
              />
              <FormField
                label="Default Terms"
                value={defaultTerms}
                onChangeText={setDefaultTerms}
                placeholder="e.g. Payment due within 30 days"
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: "top", paddingTop: 10 }}
              />
            </>
          )}

          <Pressable
            onPress={next}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Text style={styles.btnText}>{step < STEPS.length - 1 ? "Continue" : "Get Started"}</Text>
          </Pressable>

          {step > 0 && (
            <Pressable onPress={() => setStep(step - 1)} style={styles.backBtn}>
              <Text style={[styles.backText, { color: colors.mutedForeground }]}>Back</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginBottom: 36,
  },
  stepItem: { alignItems: "center", gap: 6 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepLabel: { fontSize: 12, fontWeight: "600" },
  hero: { alignItems: "center", marginBottom: 36 },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  btn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  backBtn: { alignItems: "center", paddingVertical: 8 },
  backText: { fontSize: 15 },
});
