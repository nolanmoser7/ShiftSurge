// Re-export the Supabase storage implementation
export type { IStorage } from "./storage-supabase";
export { SupabaseStorage as DbStorage, storage } from "./storage-supabase";
