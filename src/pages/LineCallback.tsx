import { useEffect, useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { handleLineCallback } from '@/integrations/line/client';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Heart } from 'lucide-react';

const LineCallback = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [redirected, setRedirected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, refetch } = useAuth();

  useEffect(() => {
    const processLineCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle LINE OAuth errors
        if (errorParam) {
          const errorMsg = errorDescription || errorParam;
          console.error('LINE OAuth error:', errorMsg);
          toast.error('เกิดข้อผิดพลาดจาก LINE', {
            description: errorMsg
          });
          setError(errorMsg);
          setIsLoading(false);
          return;
        }

        if (!code) {
          const msg = 'ไม่ได้รับรหัสจาก LINE';
          console.error(msg);
          toast.error('ไม่สามารถเข้าสู่ระบบได้', {
            description: msg
          });
          setError(msg);
          setIsLoading(false);
          return;
        }

        console.log('Processing LINE callback with code:', code.substring(0, 10) + '...');

        // Get LINE user info from our Edge Function
        const lineUserInfo = await handleLineCallback(code, state || '');
        
        if (!lineUserInfo || !lineUserInfo.userId) {
          throw new Error('ไม่สามารถรับข้อมูลผู้ใช้จาก LINE ได้');
        }

        // Create a unique email using LINE user ID
        const lineEmail = `line_${lineUserInfo.userId}@baanpet.local`;
        const linePassword = lineUserInfo.userId;

        console.log('LINE user authenticated:', {
          userId: lineUserInfo.userId,
          displayName: lineUserInfo.displayName
        });

        // Check if user already exists in profiles
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('line_user_id', lineUserInfo.userId)
          .single();

        if (existingUser) {
          // User exists, try to sign in
          console.log('Existing LINE user found, signing in...');
          try {
            const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
              email: lineEmail,
              password: linePassword,
            });

            if (signInError) {
              console.error('Sign in error:', signInError);
              throw signInError;
            }

            console.log('Successfully signed in');
            toast.success('เข้าสู่ระบบสำเร็จ!', {
              description: `ยินดีต้อนรับ ${lineUserInfo.displayName}`
            });

            // Refetch user to update auth state
            await refetch?.();
            setRedirected(true);
          } catch (signInError: any) {
            console.error('Sign in failed:', signInError);
            throw new Error(`ไม่สามารถเข้าสู่ระบบได้: ${signInError.message}`);
          }
        } else {
          // User doesn't exist, create new account
          console.log('New LINE user, creating account...');
          try {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: lineEmail,
              password: linePassword,
              options: {
                emailRedirectTo: `${window.location.origin}/`,
                data: {
                  full_name: lineUserInfo.displayName,
                  picture_url: lineUserInfo.pictureUrl,
                }
              }
            });

            if (signUpError) {
              console.error('Sign up error:', signUpError);
              // If user already registered in auth, try to sign in
              if (signUpError.message?.includes('User already registered')) {
                console.log('User already registered in auth, attempting to sign in');
                const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
                  email: lineEmail,
                  password: linePassword,
                });

                if (signInError) {
                  throw signInError;
                }

                // Update or insert profiles
                const { data: authUser } = await supabase.auth.getUser();
                if (authUser.user) {
                  const { error: upsertError } = await supabase
                    .from('profiles')
                    .upsert({
                      id: authUser.user.id,
                      full_name: lineUserInfo.displayName,
                      avatar_url: lineUserInfo.pictureUrl,
                      line_user_id: lineUserInfo.userId,
                    });

                  if (upsertError) {
                    console.error('Upsert error:', upsertError);
                  }
                }

                toast.success('เข้าสู่ระบบสำเร็จ!', {
                  description: `ยินดีต้อนรับ ${lineUserInfo.displayName}`
                });

                await refetch?.();
                setRedirected(true);
                return;
              }
              throw signUpError;
            }

            // Store LINE user info in profiles table
            if (signUpData.user) {
              console.log('Creating profile for new user');
              const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                  id: signUpData.user.id,
                  full_name: lineUserInfo.displayName,
                  avatar_url: lineUserInfo.pictureUrl,
                  line_user_id: lineUserInfo.userId,
                });

              if (profileError) {
                console.error('Profile creation error:', profileError);
              }
            }

            toast.success('สมัครสมาชิกสำเร็จ!', {
              description: 'ยินดีต้อนรับสู่ baanpet'
            });

            await refetch?.();
            setRedirected(true);
          } catch (signUpError: any) {
            console.error('Sign up error:', signUpError);
            throw new Error(`ไม่สามารถสร้างบัญชีได้: ${signUpError.message}`);
          }
        }
      } catch (error: any) {
        console.error('Error processing LINE callback:', error);
        const errorMsg = error.message || 'โปรดลองอีกครั้ง';
        toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ', {
          description: errorMsg
        });
        setError(errorMsg);
        setIsLoading(false);
      }
    };

    processLineCallback();
  }, [searchParams, refetch]);

  if (user && redirected) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full p-8 shadow-hover text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Heart className="w-8 h-8 fill-primary text-primary animate-pulse" />
          <span className="text-2xl font-bold font-prompt">CatHome</span>
        </div>
        {error ? (
          <>
            <h1 className="text-xl font-bold mb-4 font-prompt text-red-600">เกิดข้อผิดพลาด</h1>
            <p className="text-muted-foreground font-prompt mb-4">{error}</p>
            <a
              href="/login"
              className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </a>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold mb-4 font-prompt">กำลังเข้าสู่ระบบ...</h1>
            <p className="text-muted-foreground font-prompt">
              กำลังตรวจสอบข้อมูลของคุณ โปรดรอสักครู่
            </p>
            <div className="mt-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default LineCallback;
