import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BusinessProfile, Customer, Estimate, Invoice } from "@/types/models";

const STORAGE_KEYS = {
  PROFILE: "@quickbid/profile",
  CUSTOMERS: "@quickbid/customers",
  ESTIMATES: "@quickbid/estimates",
  INVOICES: "@quickbid/invoices",
};

const DEFAULT_PROFILE: BusinessProfile = {
  businessName: "",
  ownerName: "",
  phone: "",
  email: "",
  address: "",
  defaultNotes: "",
  defaultTerms: "Payment is due within 30 days of invoice date.",
  estimatePrefix: "EST-",
  invoicePrefix: "INV-",
  currencySymbol: "$",
  nextEstimateNumber: 1001,
  nextInvoiceNumber: 1001,
  onboardingComplete: false,
};

interface AppContextValue {
  profile: BusinessProfile;
  customers: Customer[];
  estimates: Estimate[];
  invoices: Invoice[];
  isLoading: boolean;

  updateProfile: (profile: Partial<BusinessProfile>) => Promise<void>;
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addEstimate: (estimate: Estimate) => Promise<void>;
  updateEstimate: (estimate: Estimate) => Promise<void>;
  deleteEstimate: (id: string) => Promise<void>;
  addInvoice: (invoice: Invoice) => Promise<void>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  generateEstimateNumber: () => Promise<string>;
  generateInvoiceNumber: () => Promise<string>;
}

const AppContext = createContext<AppContextValue | null>(null);

// Yield to the event loop so React can commit pending state updates
// before the caller proceeds (e.g. before navigation).
const flushUpdates = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_PROFILE);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [profileRaw, customersRaw, estimatesRaw, invoicesRaw] =
        await AsyncStorage.multiGet([
          STORAGE_KEYS.PROFILE,
          STORAGE_KEYS.CUSTOMERS,
          STORAGE_KEYS.ESTIMATES,
          STORAGE_KEYS.INVOICES,
        ]);

      if (profileRaw[1]) setProfile(JSON.parse(profileRaw[1]));
      if (customersRaw[1]) setCustomers(JSON.parse(customersRaw[1]));
      if (estimatesRaw[1]) setEstimates(JSON.parse(estimatesRaw[1]));
      if (invoicesRaw[1]) setInvoices(JSON.parse(invoicesRaw[1]));
    } catch (e) {
      console.error("Error loading data", e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = useCallback(async (updates: Partial<BusinessProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next));
      return next;
    });
    await flushUpdates();
  }, []);

  const addCustomer = useCallback(async (customer: Customer) => {
    setCustomers((prev) => {
      const next = [customer, ...prev];
      AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(next));
      return next;
    });
    await flushUpdates();
  }, []);

  const updateCustomer = useCallback(async (customer: Customer) => {
    setCustomers((prev) => {
      const next = prev.map((c) => (c.id === customer.id ? customer : c));
      AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(next));
      return next;
    });
    await flushUpdates();
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    setCustomers((prev) => {
      const next = prev.filter((c) => c.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(next));
      return next;
    });
    await flushUpdates();
  }, []);

  const addEstimate = useCallback(async (estimate: Estimate) => {
    setEstimates((prev) => {
      const next = [estimate, ...prev];
      AsyncStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(next));
      return next;
    });
    // Yield so React commits the state update before caller navigates.
    // Without this, router.replace fires before estimates context is updated,
    // causing the detail screen to render with an empty estimates list.
    await flushUpdates();
  }, []);

  const updateEstimate = useCallback(async (estimate: Estimate) => {
    setEstimates((prev) => {
      const next = prev.map((e) => (e.id === estimate.id ? estimate : e));
      AsyncStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(next));
      return next;
    });
    await flushUpdates();
  }, []);

  const deleteEstimate = useCallback(async (id: string) => {
    setEstimates((prev) => {
      const next = prev.filter((e) => e.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(next));
      return next;
    });
    await flushUpdates();
  }, []);

  const addInvoice = useCallback(async (invoice: Invoice) => {
    setInvoices((prev) => {
      const next = [invoice, ...prev];
      AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(next));
      return next;
    });
    await flushUpdates();
  }, []);

  const updateInvoice = useCallback(async (invoice: Invoice) => {
    setInvoices((prev) => {
      const next = prev.map((i) => (i.id === invoice.id ? invoice : i));
      AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(next));
      return next;
    });
    await flushUpdates();
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
    setInvoices((prev) => {
      const next = prev.filter((i) => i.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(next));
      return next;
    });
    await flushUpdates();
  }, []);

  const generateEstimateNumber = useCallback(async (): Promise<string> => {
    const num = profile.nextEstimateNumber;
    const prefix = profile.estimatePrefix;
    await updateProfile({ nextEstimateNumber: num + 1 });
    return `${prefix}${num}`;
  }, [profile, updateProfile]);

  const generateInvoiceNumber = useCallback(async (): Promise<string> => {
    const num = profile.nextInvoiceNumber;
    const prefix = profile.invoicePrefix;
    await updateProfile({ nextInvoiceNumber: num + 1 });
    return `${prefix}${num}`;
  }, [profile, updateProfile]);

  return (
    <AppContext.Provider
      value={{
        profile,
        customers,
        estimates,
        invoices,
        isLoading,
        updateProfile,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addEstimate,
        updateEstimate,
        deleteEstimate,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        generateEstimateNumber,
        generateInvoiceNumber,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
