import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PREMIUM_OPEN_KEY = "premium_open";
export const PAYMENT_ENABLED_KEY = "payment_enabled";

function settingQuery(key: string) {
  return {
    queryKey: ["settings", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("bool_value")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return data?.bool_value ?? true;
    },
    refetchInterval: 30000,
  };
}

export const premiumOpenQuery = settingQuery(PREMIUM_OPEN_KEY);
export const paymentEnabledQuery = settingQuery(PAYMENT_ENABLED_KEY);

export function usePremiumOpen() {
  const { data } = useQuery(premiumOpenQuery);
  return data ?? true;
}

export function usePaymentEnabled() {
  const { data } = useQuery(paymentEnabledQuery);
  return data ?? true;
}
