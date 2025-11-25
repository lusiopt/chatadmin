import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Client para uso no frontend (com anon key)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Admin client para uso no backend (com service role key)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Types para o banco de dados
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          nome: string;
          avatar: string | null;
          role: 'admin' | 'user';
          status: 'active' | 'inactive';
          stream_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      user_permissions: {
        Row: {
          id: string;
          user_id: string;
          tema: string; // Dinamico - carregado da tabela temas
          can_view_chat: boolean;
          can_send_messages: boolean;
          can_view_announcements: boolean;
          can_create_announcements: boolean;
          can_moderate: boolean;
          can_delete_messages: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_permissions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_permissions']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          module: string | null;
          details: Record<string, any> | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
      temas: {
        Row: {
          id: string;
          slug: string;
          nome: string;
          descricao: string | null;
          cor: string;
          icone: string | null;
          ativo: boolean;
          ordem: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['temas']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['temas']['Insert']>;
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          status: 'draft' | 'published';
          image_url: string | null;
          link_url: string | null;
          link_text: string | null;
          stream_activity_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['announcements']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['announcements']['Insert']>;
      };
      announcement_temas: {
        Row: {
          id: string;
          announcement_id: string;
          tema_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['announcement_temas']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
};
