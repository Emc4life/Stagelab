import { createClient } from '@supabase/supabase-js';

const SUPA_URL = "https://dsegdddquztgkdwyzbai.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZWdkZGRxdXp0Z2tkd3l6YmFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MTMxODUsImV4cCI6MjA5MTE4OTE4NX0.vF76Ptppf7-Z_oNzyr3XEtlwc6xp_3H78Foktx0-En0";

export const supabaseClient = createClient(SUPA_URL, SUPA_KEY);

// Compatibility bridge mapping the old inline client structure to the official SDK.
export const supabase = {
  auth: {
    getSession: async () => {
      return supabaseClient.auth.getSession();
    },
    getUser: async () => {
      return supabaseClient.auth.getUser();
    },
    resetPasswordForEmail: async (email: string, options?: any) => {
      return supabaseClient.auth.resetPasswordForEmail(email, options);
    },
    updateUserPassword: async (password: string) => {
      return supabaseClient.auth.updateUser({ password });
    },
    signInWithPassword: async ({ email, password }: any) => {
      return supabaseClient.auth.signInWithPassword({ email, password });
    },
    signUp: async ({ email, password, options }: any) => {
      return supabaseClient.auth.signUp({ email, password, options });
    },
    signOut: async () => {
      try {
        localStorage.removeItem("sl_profile_cache");
        localStorage.removeItem("sl_stats_cache");
      } catch (e) {}
      return supabaseClient.auth.signOut();
    },
    onAuthStateChange: (fn: any) => {
      const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
        fn(event, session);
      });
      return { data: { subscription } };
    }
  },
  from: (table: string) => {
    return supabaseClient.from(table);
  }
};
