/**
 * Supabase Database TypeScript Definitions
 * Maps to the PostgreSQL schema after all migrations in supabase/migrations/.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      worlds: {
        Row: {
          id: string;
          display_name: string;
          access_identity_hash: string;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          display_name?: string;
          access_identity_hash: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          access_identity_hash?: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          id: string;
          world_id: string;
          name: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          world_id: string;
          name: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          world_id?: string;
          name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          world_id: string;
          name: string;
          latitude: number | null;
          longitude: number | null;
          address: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          world_id: string;
          name: string;
          latitude?: number | null;
          longitude?: number | null;
          address?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          world_id?: string;
          name?: string;
          latitude?: number | null;
          longitude?: number | null;
          address?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      captions: {
        Row: {
          id: string;
          world_id: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          world_id: string;
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          world_id?: string;
          text?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      caption_groups: {
        Row: {
          id: string;
          world_id: string;
          name: string;
          caption_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          world_id: string;
          name: string;
          caption_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          world_id?: string;
          name?: string;
          caption_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      photos: {
        Row: {
          id: string;
          world_id: string;
          storage_path: string;
          thumbnail_path: string | null;
          width: number | null;
          height: number | null;
          mime_type: string;
          file_size: number;
          created_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          world_id: string;
          storage_path: string;
          thumbnail_path?: string | null;
          width?: number | null;
          height?: number | null;
          mime_type: string;
          file_size: number;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          world_id?: string;
          storage_path?: string;
          thumbnail_path?: string | null;
          width?: number | null;
          height?: number | null;
          mime_type?: string;
          file_size?: number;
          created_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      videos: {
        Row: {
          id: string;
          world_id: string;
          storage_path: string;
          thumbnail_path: string | null;
          duration_seconds: number;
          width: number | null;
          height: number | null;
          mime_type: string;
          file_size: number;
          has_audio: boolean;
          created_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          world_id: string;
          storage_path: string;
          thumbnail_path?: string | null;
          duration_seconds?: number;
          width?: number | null;
          height?: number | null;
          mime_type: string;
          file_size: number;
          has_audio?: boolean;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          world_id?: string;
          storage_path?: string;
          thumbnail_path?: string | null;
          duration_seconds?: number;
          width?: number | null;
          height?: number | null;
          mime_type?: string;
          file_size?: number;
          has_audio?: boolean;
          created_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      tracks: {
        Row: {
          id: string;
          world_id: string;
          track_number: number;
          title: string;
          storage_path: string;
          duration_seconds: number;
          mime_type: string;
          file_size: number;
          created_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          world_id: string;
          track_number: number;
          title: string;
          storage_path: string;
          duration_seconds?: number;
          mime_type?: string;
          file_size?: number;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          world_id?: string;
          track_number?: number;
          title?: string;
          storage_path?: string;
          duration_seconds?: number;
          mime_type?: string;
          file_size?: number;
          created_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      playlists: {
        Row: {
          id: string;
          world_id: string;
          title: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          world_id: string;
          title: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          world_id?: string;
          title?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      playlist_tracks: {
        Row: {
          id: string;
          playlist_id: string;
          track_id: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          playlist_id: string;
          track_id: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          playlist_id?: string;
          track_id?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      moments: {
        Row: {
          id: string;
          world_id: string;
          title: string;
          date: string;
          location_id: string | null;
          is_draft: boolean;
          keep_offline: boolean;
          presentation_settings: Json | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          world_id: string;
          title: string;
          date?: string;
          location_id?: string | null;
          is_draft?: boolean;
          keep_offline?: boolean;
          presentation_settings?: Json | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          world_id?: string;
          title?: string;
          date?: string;
          location_id?: string | null;
          is_draft?: boolean;
          keep_offline?: boolean;
          presentation_settings?: Json | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      moment_photos: {
        Row: {
          id: string;
          moment_id: string;
          photo_id: string;
          sort_order: number;
          caption_id: string | null;
          caption_group_id: string | null;
          presentation_settings: Json | null;
        };
        Insert: {
          id?: string;
          moment_id: string;
          photo_id: string;
          sort_order?: number;
          caption_id?: string | null;
          caption_group_id?: string | null;
          presentation_settings?: Json | null;
        };
        Update: {
          id?: string;
          moment_id?: string;
          photo_id?: string;
          sort_order?: number;
          caption_id?: string | null;
          caption_group_id?: string | null;
          presentation_settings?: Json | null;
        };
        Relationships: [];
      };
      moment_videos: {
        Row: {
          id: string;
          moment_id: string;
          video_id: string;
          sort_order: number;
          caption_id: string | null;
          presentation_settings: Json | null;
        };
        Insert: {
          id?: string;
          moment_id: string;
          video_id: string;
          sort_order?: number;
          caption_id?: string | null;
          presentation_settings?: Json | null;
        };
        Update: {
          id?: string;
          moment_id?: string;
          video_id?: string;
          sort_order?: number;
          caption_id?: string | null;
          presentation_settings?: Json | null;
        };
        Relationships: [];
      };
      moment_tracks: {
        Row: {
          id: string;
          moment_id: string;
          track_id: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          moment_id: string;
          track_id: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          moment_id?: string;
          track_id?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      peshtok_videos: {
        Row: {
          id: string;
          world_id: string;
          video_id: string;
          caption: string;
          visibility: string;
          published_at: string;
          likes_count: number;
          comments_count: number;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          world_id: string;
          video_id: string;
          caption?: string;
          visibility?: string;
          published_at?: string;
          likes_count?: number;
          comments_count?: number;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          world_id?: string;
          video_id?: string;
          caption?: string;
          visibility?: string;
          published_at?: string;
          likes_count?: number;
          comments_count?: number;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          world_id: string;
          video_id: string;
          author_name: string;
          content: string;
          is_simulated: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          world_id: string;
          video_id: string;
          author_name: string;
          content: string;
          is_simulated?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          world_id?: string;
          video_id?: string;
          author_name?: string;
          content?: string;
          is_simulated?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      likes: {
        Row: {
          id: string;
          world_id: string;
          video_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          world_id: string;
          video_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          world_id?: string;
          video_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      archive_items: {
        Row: {
          id: string;
          world_id: string;
          entity_type: 'moment' | 'photo' | 'video' | 'track';
          entity_id: string;
          archived_at: string;
          restored_at: string | null;
        };
        Insert: {
          id?: string;
          world_id: string;
          entity_type: 'moment' | 'photo' | 'video' | 'track';
          entity_id: string;
          archived_at?: string;
          restored_at?: string | null;
        };
        Update: {
          id?: string;
          world_id?: string;
          entity_type?: 'moment' | 'photo' | 'video' | 'track';
          entity_id?: string;
          archived_at?: string;
          restored_at?: string | null;
        };
        Relationships: [];
      };
      offline_assets: {
        Row: {
          id: string;
          world_id: string;
          entity_type: string;
          entity_id: string;
          asset_type: 'photo' | 'video' | 'audio' | 'thumbnail' | 'metadata';
          cache_key: string;
          local_uri: string | null;
          downloaded_at: string;
          size: number;
          version: number;
        };
        Insert: {
          id?: string;
          world_id: string;
          entity_type: string;
          entity_id: string;
          asset_type: 'photo' | 'video' | 'audio' | 'thumbnail' | 'metadata';
          cache_key: string;
          local_uri?: string | null;
          downloaded_at?: string;
          size?: number;
          version?: number;
        };
        Update: {
          id?: string;
          world_id?: string;
          entity_type?: string;
          entity_id?: string;
          asset_type?: 'photo' | 'video' | 'audio' | 'thumbnail' | 'metadata';
          cache_key?: string;
          local_uri?: string | null;
          downloaded_at?: string;
          size?: number;
          version?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      archive_world_entity: {
        Args: {
          p_entity_id: string;
          p_entity_type: 'moment' | 'photo' | 'video' | 'track';
          p_restore?: boolean;
        };
        Returns: string;
      };
      create_next_track: {
        Args: {
          p_file_size: number;
          p_mime_type: string;
          p_storage_path: string;
          p_title: string | null;
        };
        Returns: Database['public']['Tables']['tracks']['Row'][];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
