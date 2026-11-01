/**
 * Supabase bazasining TypeScript turlari.
 * Supabase'dan avtomatik yaratilgan (generate_typescript_types). Migratsiya
 * o'zgarsa qayta yaratiladi: `npx supabase gen types typescript --project-id <ref>`.
 * Qo'lda tahrirlamang (pastdagi qisqa yordamchilardan tashqari).
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type LessonProgressRow = {
  completed_at: string | null;
  current_step: number;
  last_seen_at: string;
  lesson_id: string;
  lesson_version: number;
  max_step_reached: number;
  started_at: string;
  status: Database["public"]["Enums"]["progress_status"];
  user_id: string;
  video_percent: number;
  video_position_sec: number;
};

type LessonProgressSetof = {
  from: "*";
  to: "lesson_progress";
  isOneToOne: true;
  isSetofReturn: false;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      access_grants: {
        Row: {
          course_id: string;
          created_at: string;
          ends_at: string | null;
          granted_by: string | null;
          id: string;
          order_id: string | null;
          plan_id: string | null;
          revoked_at: string | null;
          revoked_reason: string | null;
          source: Database["public"]["Enums"]["access_source"];
          starts_at: string;
          user_id: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          ends_at?: string | null;
          granted_by?: string | null;
          id?: string;
          order_id?: string | null;
          plan_id?: string | null;
          revoked_at?: string | null;
          revoked_reason?: string | null;
          source: Database["public"]["Enums"]["access_source"];
          starts_at?: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["access_grants"]["Insert"]>;
        Relationships: [];
      };
      content_assignments: {
        Row: { assigned_at: string; assigned_by: string | null; course_id: string; user_id: string };
        Insert: { assigned_at?: string; assigned_by?: string | null; course_id: string; user_id: string };
        Update: Partial<Database["public"]["Tables"]["content_assignments"]["Insert"]>;
        Relationships: [];
      };
      course_levels: {
        Row: {
          course_id: string;
          created_at: string;
          description: string | null;
          id: string;
          number: number;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          number: number;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["course_levels"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "course_levels_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      courses: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          slug: string;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          subtitle: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          slug: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          subtitle?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Insert"]>;
        Relationships: [];
      };
      learning_sessions: {
        Row: {
          created_at: string;
          id: number;
          lesson_id: string | null;
          local_day: string;
          seconds: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: never;
          lesson_id?: string | null;
          local_day: string;
          seconds: number;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["learning_sessions"]["Insert"]>;
        Relationships: [];
      };
      lesson_content: {
        Row: {
          body_md: string | null;
          created_at: string;
          data: Json;
          id: string;
          kind: Database["public"]["Enums"]["lesson_step_kind"];
          lesson_id: string;
          sort_order: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          body_md?: string | null;
          created_at?: string;
          data?: Json;
          id?: string;
          kind: Database["public"]["Enums"]["lesson_step_kind"];
          lesson_id: string;
          sort_order: number;
          title: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lesson_content"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "lesson_content_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_media: {
        Row: {
          chapters: Json;
          created_at: string;
          duration_sec: number | null;
          id: string;
          kind: Database["public"]["Enums"]["media_kind"];
          language: string;
          lesson_id: string;
          playback_id: string | null;
          provider: string;
          provider_asset_id: string | null;
          script_hash: string | null;
          status: Database["public"]["Enums"]["media_status"];
          subtitle_url: string | null;
          transcript: string | null;
          updated_at: string;
          version: number;
          voice: string | null;
        };
        Insert: {
          chapters?: Json;
          created_at?: string;
          duration_sec?: number | null;
          id?: string;
          kind: Database["public"]["Enums"]["media_kind"];
          language?: string;
          lesson_id: string;
          playback_id?: string | null;
          provider: string;
          provider_asset_id?: string | null;
          script_hash?: string | null;
          status?: Database["public"]["Enums"]["media_status"];
          subtitle_url?: string | null;
          transcript?: string | null;
          updated_at?: string;
          version?: number;
          voice?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["lesson_media"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "lesson_media_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_progress: {
        Row: LessonProgressRow;
        Insert: Partial<LessonProgressRow> & { lesson_id: string; user_id: string };
        Update: Partial<LessonProgressRow>;
        Relationships: [];
      };
      lessons: {
        Row: {
          completion_rule: Json;
          created_at: string;
          created_by: string | null;
          estimated_minutes: number | null;
          id: string;
          is_free_preview: boolean;
          module_id: string;
          published_at: string | null;
          review_due_at: string | null;
          sort_order: number;
          source_urls: string[];
          status: Database["public"]["Enums"]["content_status"];
          summary: string | null;
          title: string;
          updated_at: string;
          verified_at: string | null;
          version: number;
        };
        Insert: {
          completion_rule?: Json;
          created_at?: string;
          created_by?: string | null;
          estimated_minutes?: number | null;
          id?: string;
          is_free_preview?: boolean;
          module_id: string;
          published_at?: string | null;
          review_due_at?: string | null;
          sort_order?: number;
          source_urls?: string[];
          status?: Database["public"]["Enums"]["content_status"];
          summary?: string | null;
          title: string;
          updated_at?: string;
          verified_at?: string | null;
          version?: number;
        };
        Update: Partial<Database["public"]["Tables"]["lessons"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          },
        ];
      };
      modules: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          level_id: string;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          level_id: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["modules"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "modules_level_id_fkey";
            columns: ["level_id"];
            isOneToOne: false;
            referencedRelation: "course_levels";
            referencedColumns: ["id"];
          },
        ];
      };
      plans: {
        Row: {
          ai_monthly_credit_tiyin: number;
          code: string;
          course_id: string | null;
          created_at: string;
          currency: string;
          description: string | null;
          duration_days: number | null;
          features: string[];
          id: string;
          is_active: boolean;
          name: string;
          price_tiyin: number | null;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          ai_monthly_credit_tiyin?: number;
          code: string;
          course_id?: string | null;
          created_at?: string;
          currency?: string;
          description?: string | null;
          duration_days?: number | null;
          features?: string[];
          id?: string;
          is_active?: boolean;
          name: string;
          price_tiyin?: number | null;
          sort_order?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["plans"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: { created_at: string; full_name: string | null; id: string; timezone: string; updated_at: string };
        Insert: { created_at?: string; full_name?: string | null; id: string; timezone?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      student_enrollments: {
        Row: { course_id: string; enrolled_at: string; start_level_number: number | null; user_id: string };
        Insert: { course_id: string; enrolled_at?: string; start_level_number?: number | null; user_id: string };
        Update: Partial<Database["public"]["Tables"]["student_enrollments"]["Insert"]>;
        Relationships: [];
      };
      user_roles: {
        Row: {
          granted_at: string;
          granted_by: string | null;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          granted_at?: string;
          granted_by?: string | null;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      advance_lesson_step: {
        Args: { p_lesson_id: string; p_step: number };
        Returns: LessonProgressRow;
        SetofOptions: LessonProgressSetof;
      };
      complete_lesson: {
        Args: { p_lesson_id: string };
        Returns: LessonProgressRow;
        SetofOptions: LessonProgressSetof;
      };
      my_course_overview: { Args: { p_course_slug: string }; Returns: Json };
      record_learning_time: { Args: { p_lesson_id: string | null; p_seconds: number }; Returns: undefined };
      record_video_progress: {
        Args: { p_lesson_id: string; p_percent: number; p_position_sec: number };
        Returns: undefined;
      };
      start_lesson: {
        Args: { p_lesson_id: string };
        Returns: LessonProgressRow;
        SetofOptions: LessonProgressSetof;
      };
    };
    Enums: {
      access_source: "payment" | "admin" | "promo";
      app_role: "content_manager" | "admin";
      content_status: "planned" | "draft" | "review" | "published" | "archived";
      lesson_step_kind: "video" | "voice" | "text" | "visual" | "task" | "exercise" | "review" | "mistakes" | "quiz" | "next";
      media_kind: "video" | "audio" | "avatar";
      media_status: "processing" | "ready" | "failed";
      progress_status: "in_progress" | "completed";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

// Qisqa yordamchilar
type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
