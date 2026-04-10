import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRO_STORAGE_KEY = "@quickbid/isPro";
export const IAP_PRODUCT_ID = "quickbid_pro_upgrade";

// Free tier hard limits
export const FREE_CUSTOMER_LIMIT = 3;
export const FREE_DOCS_LIMIT = 5; // estimates + invoices combined

interface IAPContextValue {
  isPro: boolean;
  isLoading: boolean;
  productPrice: string;
  productsLoaded: boolean; // true once StoreKit returned the product
  purchase: () => Promise<void>;
  restorePurchases: () => Promise<void>;
}

const IAPContext = createContext<IAPContextValue | null>(null);

export function IAPProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [productPrice, setProductPrice] = useState("$9.99");
  const [productsLoaded, setProductsLoaded] = useState(false);

  const iapRef = useRef<any>(null);
  const purchaseUpdateSub = useRef<any>(null);
  const purchaseErrorSub = useRef<any>(null);

  // Load persisted Pro status on mount
  useEffect(() => {
    AsyncStorage.getItem(PRO_STORAGE_KEY).then((val) => {
      if (val === "true") setIsPro(true);
    });
  }, []);

  // Initialize StoreKit on native platforms only
  useEffect(() => {
    if (Platform.OS !== "ios" && Platform.OS !== "android") return;

    let mounted = true;

    const init = async () => {
      try {
        const iap = await import("react-native-iap");
        iapRef.current = iap;

        await iap.initConnection();
        console.log("[IAP] StoreKit connection established");

        // v14 renamed getProducts → fetchProducts
        // fetchProducts takes { skus: string[], type: 'in-app' | 'subs' }
        const products = await iap.fetchProducts({
          skus: [IAP_PRODUCT_ID],
          type: "in-app",
        });

        console.log("[IAP] fetchProducts result:", JSON.stringify(products));

        if (mounted && products.length > 0) {
          const p = products[0];
          const price = p.localizedPrice ?? p.price ?? "$9.99";
          setProductPrice(price);
          setProductsLoaded(true);
          console.log("[IAP] Product loaded:", p.productId, "price:", price);
        } else {
          console.warn(
            "[IAP] No products returned for SKU:", IAP_PRODUCT_ID,
            "— check that the product exists in App Store Connect"
          );
          // Still mark loaded so the button isn't blocked forever
          if (mounted) setProductsLoaded(true);
        }

        // Listen for completed purchases (result of requestPurchase)
        purchaseUpdateSub.current = iap.purchaseUpdatedListener(
          async (purchase: any) => {
            console.log("[IAP] purchaseUpdatedListener:", purchase.productId, purchase.transactionId);
            if (purchase.productId === IAP_PRODUCT_ID) {
              await iap.finishTransaction({ purchase, isConsumable: false });
              await AsyncStorage.setItem(PRO_STORAGE_KEY, "true");
              if (mounted) {
                setIsPro(true);
                setIsLoading(false);
              }
            }
          }
        );

        // Listen for purchase errors
        purchaseErrorSub.current = iap.purchaseErrorListener((error: any) => {
          console.log("[IAP] purchaseErrorListener:", error?.code, error?.message);
          if (mounted) setIsLoading(false);
          if (error?.code !== "E_USER_CANCELLED") {
            Alert.alert(
              "Purchase Failed",
              error?.message ?? "Something went wrong. Please try again."
            );
          }
        });
      } catch (e: any) {
        console.error("[IAP] Init error:", e?.message ?? e);
      }
    };

    init();

    return () => {
      mounted = false;
      purchaseUpdateSub.current?.remove();
      purchaseErrorSub.current?.remove();
      iapRef.current?.endConnection?.();
    };
  }, []);

  const purchase = useCallback(async () => {
    // Web / simulator: grant Pro immediately so the UI is testable
    if (Platform.OS !== "ios" && Platform.OS !== "android") {
      await AsyncStorage.setItem(PRO_STORAGE_KEY, "true");
      setIsPro(true);
      return;
    }

    if (!iapRef.current) {
      Alert.alert(
        "Not Available",
        "In-app purchases are not available right now. Please restart the app and try again."
      );
      return;
    }

    setIsLoading(true);
    try {
      console.log("[IAP] Calling requestPurchase for SKU:", IAP_PRODUCT_ID);

      // v14 API: request must be wrapped in { request: { apple: { sku } }, type: 'in-app' }
      await iapRef.current.requestPurchase({
        request: {
          apple: { sku: IAP_PRODUCT_ID },
        },
        type: "in-app",
      });

      // requestPurchase is non-blocking on iOS — result arrives via purchaseUpdatedListener
      console.log("[IAP] requestPurchase dispatched");
    } catch (e: any) {
      setIsLoading(false);
      console.error("[IAP] requestPurchase error:", e?.code, e?.message);
      if (e?.code !== "E_USER_CANCELLED") {
        Alert.alert(
          "Purchase Failed",
          e?.message ?? "Please try again."
        );
      }
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    if (Platform.OS !== "ios" && Platform.OS !== "android") {
      Alert.alert("Restore", "Nothing to restore in development mode.");
      return;
    }

    if (!iapRef.current) return;

    setIsLoading(true);
    try {
      console.log("[IAP] Calling getAvailablePurchases");
      const purchases = await iapRef.current.getAvailablePurchases();
      console.log("[IAP] getAvailablePurchases count:", purchases?.length);

      const hasPro = (purchases as any[]).some(
        (p) => p.productId === IAP_PRODUCT_ID
      );

      if (hasPro) {
        await AsyncStorage.setItem(PRO_STORAGE_KEY, "true");
        setIsPro(true);
        Alert.alert("Restored", "Your Pro upgrade has been restored. Thank you!");
      } else {
        Alert.alert(
          "No Purchases Found",
          "No previous purchase was found for this Apple ID."
        );
      }
    } catch (e: any) {
      console.error("[IAP] restorePurchases error:", e?.message);
      Alert.alert("Restore Failed", e?.message ?? "Could not restore purchases.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <IAPContext.Provider
      value={{ isPro, isLoading, productPrice, productsLoaded, purchase, restorePurchases }}
    >
      {children}
    </IAPContext.Provider>
  );
}

export function useIAP() {
  const ctx = useContext(IAPContext);
  if (!ctx) throw new Error("useIAP must be used within IAPProvider");
  return ctx;
}
