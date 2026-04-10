import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { LineItem } from "@/types/models";
import { formatCurrency } from "@/utils/calculations";

interface Props {
  item: LineItem;
  onChange: (updated: LineItem) => void;
  onRemove: () => void;
  currencySymbol: string;
}

export function LineItemRow({ item, onChange, onRemove, currencySymbol }: Props) {
  const colors = useColors();
  const lineTotal = item.quantity * item.unitPrice;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <TextInput
          style={[styles.titleInput, { color: colors.foreground }]}
          placeholder="Item title"
          placeholderTextColor={colors.mutedForeground}
          value={item.title}
          onChangeText={(v) => onChange({ ...item, title: v })}
        />
        <Pressable onPress={onRemove} hitSlop={10}>
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <TextInput
        style={[styles.descInput, { color: colors.mutedForeground }]}
        placeholder="Description (optional)"
        placeholderTextColor={colors.border}
        value={item.description ?? ""}
        onChangeText={(v) => onChange({ ...item, description: v })}
      />
      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Qty</Text>
          <TextInput
            style={[styles.fieldInput, { color: colors.foreground, borderColor: colors.border }]}
            value={String(item.quantity)}
            keyboardType="decimal-pad"
            onChangeText={(v) => {
              const n = parseFloat(v) || 0;
              onChange({ ...item, quantity: n });
            }}
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Unit Price</Text>
          <TextInput
            style={[styles.fieldInput, { color: colors.foreground, borderColor: colors.border }]}
            value={String(item.unitPrice)}
            keyboardType="decimal-pad"
            onChangeText={(v) => {
              const n = parseFloat(v) || 0;
              onChange({ ...item, unitPrice: n });
            }}
          />
        </View>
        <View style={styles.totalField}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Total</Text>
          <Text style={[styles.lineTotal, { color: colors.foreground }]}>
            {formatCurrency(lineTotal, currencySymbol)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  titleInput: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  descInput: {
    fontSize: 13,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
  },
  field: {
    flex: 1,
  },
  totalField: {
    flex: 1,
    alignItems: "flex-end",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
  },
  lineTotal: {
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 8,
  },
});
