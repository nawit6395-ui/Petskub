import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { buildAppUrl } from '@/lib/utils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  syncProfileFromUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
  }, []);

  const syncProfileFromUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const currentUser = data.user;
    if (!currentUser) return;

    const fullName =
      (currentUser.user_metadata as any)?.full_name ||
      (currentUser.user_metadata as any)?.name ||
      currentUser.email?.split('@')[0] ||
      'ผู้ใช้';

    const avatarUrl =
      (currentUser.user_metadata as any)?.avatar_url ||
      (currentUser.user_metadata as any)?.picture ||
      null;

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: currentUser.id,
        full_name: fullName,
        avatar_url: avatarUrl,
      });

    if (error) {
      console.error('syncProfileFromUser error:', error);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const redirectUrl = buildAppUrl('/');
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || email
          }
        }
      });

      if (error) throw error;

      toast.success('สมัครสมาชิกสำเร็จ!', {
        description: 'ยินดีต้อนรับสู่ CatHome Community'
      });

      navigate('/');
      return { error: null };
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาด', {
        description: error.message
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('เข้าสู่ระบบสำเร็จ!', {
        description: 'ยินดีต้อนรับกลับ'
      });

      await syncProfileFromUser();

      navigate('/');
      return { error: null };
    } catch (error: any) {
      toast.error('เข้าสู่ระบบไม่สำเร็จ', {
        description: error.message
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success('ออกจากระบบสำเร็จ');
      navigate('/');
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาด', {
        description: error.message
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, refreshUser, syncProfileFromUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
