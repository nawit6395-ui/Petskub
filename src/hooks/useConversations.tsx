import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { alert } from '@/lib/alerts';

export interface ConversationParticipant {
  id: string;
  full_name?: string;
  avatar_url?: string;
}

export interface ConversationCat {
  id: string;
  name: string;
  image_url?: string[];
  province?: string;
  district?: string;
  user_id: string;
}

export interface Conversation {
  id: string;
  cat_id: string;
  owner_id: string;
  adopter_id: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  last_message_at: string;
  cat?: ConversationCat;
  owner?: ConversationParticipant;
  adopter?: ConversationParticipant;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  attachment_url?: string | null;
  created_at: string;
  read_at?: string | null;
}

export const useConversations = (userId?: string) => {
  return useQuery<Conversation[]>({
    queryKey: ['conversations', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          cat:cats(id, name, image_url, province, district, user_id),
          owner:profiles!conversations_owner_id_fkey(id, full_name, avatar_url),
          adopter:profiles!conversations_adopter_id_fkey(id, full_name, avatar_url)
        `)
        .or(`owner_id.eq.${userId},adopter_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Conversation[];
    },
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      catId,
      ownerId,
      adopterId,
    }: {
      catId: string;
      ownerId: string;
      adopterId: string;
    }) => {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('cat_id', catId)
        .eq('adopter_id', adopterId)
        .maybeSingle();

      if (existing) {
        return existing;
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          cat_id: catId,
          owner_id: ownerId,
          adopter_id: adopterId,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      alert.error('ไม่สามารถเริ่มแชทได้', {
        description: error.message,
      });
    },
  });
};

export const useMessages = (conversationId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          queryClient.setQueryData<Message[]>(['messages', conversationId], (old) => {
            if (!old) return [payload.new as Message];
            return [...old, payload.new as Message];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as Message[];
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      senderId,
      content,
    }: {
      conversationId: string;
      senderId: string;
      content: string;
    }) => {
      const trimmed = content.trim();
      if (!trimmed) throw new Error('กรุณาพิมพ์ข้อความ');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: trimmed,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data as Message;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      alert.error('ไม่สามารถส่งข้อความได้', {
        description: error.message,
      });
    },
  });
};
