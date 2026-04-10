import { Platform, Alert } from "react-native";
import { BusinessProfile, Customer, Estimate, Invoice } from "@/types/models";
import { buildEstimatePdfHtml, buildInvoicePdfHtml } from "./pdf";

/**
 * Generates a real PDF file from HTML and opens the native iOS/Android share sheet.
 * On web, opens the HTML in a new tab so the user can print/save as PDF via the browser.
 */
export async function shareEstimatePdf(
  estimate: Estimate,
  customer: Customer,
  profile: BusinessProfile
): Promise<void> {
  const html = buildEstimatePdfHtml(estimate, customer, profile);
  const label = `Estimate ${estimate.estimateNumber}`;
  await generateAndShare(html, label);
}

export async function shareInvoicePdf(
  invoice: Invoice,
  customer: Customer,
  profile: BusinessProfile
): Promise<void> {
  const html = buildInvoicePdfHtml(invoice, customer, profile);
  const label = `Invoice ${invoice.invoiceNumber}`;
  await generateAndShare(html, label);
}

async function generateAndShare(html: string, label: string): Promise<void> {
  if (Platform.OS === "web") {
    await shareOnWeb(html);
    return;
  }

  try {
    // expo-print renders HTML to a temporary .pdf file on-device
    const Print = await import("expo-print");
    const { uri } = await Print.printToFileAsync({
      html,
      width: 595,   // A4 width in points
      height: 842,  // A4 height in points
    });

    // expo-sharing opens the native iOS/Android share sheet for the file
    const Sharing = await import("expo-sharing");
    const isAvailable = await Sharing.isAvailableAsync();

    if (!isAvailable) {
      Alert.alert(
        "Sharing Unavailable",
        "File sharing is not supported on this device. Please test on a physical iPhone."
      );
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Share ${label}`,
      UTI: "com.adobe.pdf",
    });
  } catch (error: any) {
    const msg =
      typeof error?.message === "string" && error.message.length < 200
        ? error.message
        : "An unexpected error occurred.";
    Alert.alert(
      "PDF Generation Failed",
      `Could not create the PDF.\n\n${msg}\n\nPlease make sure the document has at least one line item.`
    );
  }
}

/**
 * Web fallback: opens the HTML in a new tab. The user can print/save as PDF
 * using their browser's native print dialog (File → Print → Save as PDF).
 */
async function shareOnWeb(html: string): Promise<void> {
  try {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) {
      Alert.alert(
        "Popup Blocked",
        'Please allow popups for this site, then tap "Share PDF" again to open the document.'
      );
      URL.revokeObjectURL(url);
      return;
    }
    // Trigger browser print dialog once the page has loaded
    win.addEventListener("load", () => {
      setTimeout(() => {
        try { win.print(); } catch { /* user can print manually */ }
        URL.revokeObjectURL(url);
      }, 400);
    });
  } catch {
    Alert.alert("Error", "Could not open the PDF preview.");
  }
}
