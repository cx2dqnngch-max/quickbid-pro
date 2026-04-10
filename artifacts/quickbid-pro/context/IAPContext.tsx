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
  purchase: () => Promise<void>;
  restorePurchases: () => Promise<void>;
}

const IAPContext = createContext<IAPContextValue | null>(null);

export function IAPProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [productPrice, setProductPrice] = useState("$9.99");

  // Refs for IAP listeners — hold module reference to avoid import at module level
  // (react-native-iap throws on web/non-native if imported unconditionally)
  const iapRef = useRef<any>(null);
  const purchaseUpdateSub = useRef<any>(null);
  const purchaseErrorSub = useRef<any>(null);

  // Load persisted Pro status on mount
  useEffect(() => {
    AsyncStorage.getItem(PRO_STORAGE_KEY).then((val) => {
      if (val === "true") setIsPro(true);
    });
  }, []);

  // Initialize StoreKit connection on native platforms only
  useEffect(() => {
    if (Platform.OS !== "ios" && Platform.OS !== "android") return;

    let mounted = true;

    const init = async () => {
      try {
        const iap = await import("react-native-iap");
        iapRef.current = iap;

        await iap.initConnection();

        // Fetch product price from App Store
        const products = await iap.getProducts({ skus: [IAP_PRODUCT_ID] });
        if (mounted && products.length > 0 && products[0].localizedPrice) {
          setProductPrice(products[0].localizedPrice);
        }

        // Listen for completed purchases
        purchaseUpdateSub.current = iap.purchaseUpdatedListener(
          async (purchase: any) => {
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
          if (mounted) setIsLoading(false);
          if (error?.code !== "E_USER_CANCELLED") {
            Alert.alert(
              "Purchase Failed",
              error?.message ?? "Something went wrong. Please try again."
            );
          }
        });
      } catch (e) {
        console.log("[IAP] Init error:", e);
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
    // Development / web simulation: grant Pro immediately
    if (Platform.OS !== "ios" && Platform.OS !== "android") {
      await AsyncStorage.setItem(PRO_STORAGE_KEY, "true");
      setIsPro(true);
      return;
    }

    if (!iapRef.current) {
      Alert.alert(
        "Not Available",
        "In-app purchases are not available right now. Please try again later."
      );
      return;
    }

    setIsLoading(true);
    try {
      // requestPurchase is non-blocking — result comes via purchaseUpdatedListener
      await iapRef.current.requestPurchase({ sku: IAP_PRODUCT_ID });
    } catch (e: any) {
      setIsLoading(false);
      if (e?.code !== "E_USER_CANCELLED") {
        Alert.alert("Purchase Failed", e?.message ?? "Please try again.");
      }
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    // Development / web simulation
    if (Platform.OS !== "ios" && Platform.OS !== "android") {
      Alert.alert("Restore", "Nothing to restore in development mode.");
      return;
    }

    if (!iapRef.current) return;

    setIsLoading(true);
    try {
      const purchases = await iapRef.current.getAvailablePurchases();
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
      Alert.alert("Restore Failed", e?.message ?? "Could not restore purchases.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <IAPContext.Provider
      value={{ isPro, isLoading, productPrice, purchase, restorePurchases }}
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
