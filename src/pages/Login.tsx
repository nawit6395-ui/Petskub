import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Heart, Mail, Lock } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { initiateLineLogin } from "@/integrations/line/client";

const loginSchema = z.object({
  email: z.string().email('กรุณากรอกอีเมลให้ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
});

const signupSchema = loginSchema.extend({
  confirmPassword: z.string(),
  fullName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { user, signIn, signUp } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error('ไม่สามารถเข้าสู่ระบบด้วย Google ได้', {
        description: error.message
      });
    }
  };

  const handleLineSignIn = () => {
    try {
      if (!import.meta.env.VITE_LINE_CHANNEL_ID) {
        toast.error('ไม่สามารถเข้าสู่ระบบด้วย LINE ได้', {
          description: 'ค่า LINE Channel ID ยังไม่ถูกตั้งค่า โปรดติดต่อผู้ดูแลระบบ'
        });
        return;
      }
      initiateLineLogin();
    } catch (error: any) {
      toast.error('ไม่สามารถเข้าสู่ระบบด้วย LINE ได้', {
        description: error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      if (isLogin) {
        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0].toString()] = err.message;
            }
          });
          setErrors(fieldErrors);
          return;
        }
        await signIn(email, password);
      } else {
        const result = signupSchema.safeParse({ email, password, confirmPassword, fullName });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0].toString()] = err.message;
            }
          });
          setErrors(fieldErrors);
          return;
        }
        await signUp(email, password, fullName || undefined);
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full p-8 shadow-hover">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-8 h-8 fill-primary text-primary" />
            <span className="text-2xl font-bold font-prompt">CatHome</span>
          </div>
          <h1 className="text-2xl font-bold mb-2 font-prompt">
            {isLogin ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </h1>
          <p className="text-muted-foreground font-prompt">
            {isLogin 
              ? "เข้าสู่ระบบเพื่อช่วยเหลือแมวด้วยกัน ❤️"
              : "ร่วมเป็นส่วนหนึ่งของชุมชนช่วยเหลือแมว"
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName" className="font-prompt">ชื่อ-นามสกุล (ไม่บังคับ)</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="ชื่อของคุณ"
                className="font-prompt"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="font-prompt">อีเมล</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="pl-10 font-prompt"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && <p className="text-sm text-urgent font-prompt">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-prompt">รหัสผ่าน</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10 font-prompt"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {errors.password && <p className="text-sm text-urgent font-prompt">{errors.password}</p>}
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="font-prompt">ยืนยันรหัสผ่าน</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 font-prompt"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {errors.confirmPassword && <p className="text-sm text-urgent font-prompt">{errors.confirmPassword}</p>}
            </div>
          )}

          <Button type="submit" className="w-full font-prompt">
            {isLogin ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </Button>
        </form>

        <div className="relative my-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground font-prompt">
            หรือ
          </span>
        </div>

        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full font-prompt flex items-center justify-center gap-3 h-12 px-6 border hover:bg-gray-50" 
            type="button"
            onClick={handleGoogleSignIn}
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48" style={{ minWidth: '20px' }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            <span className="text-[15px] text-gray-700">ดำเนินการต่อด้วย Google</span>
          </Button>

          <Button 
            className="w-full font-prompt flex items-center justify-center gap-3 h-12 px-6 bg-[#00B900] hover:bg-[#00A000] text-white"
            type="button"
            onClick={handleLineSignIn}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white" style={{ minWidth: '20px' }}>
              <path d="M12 2C6.48 2 2 5.58 2 10c0 3.25 2.29 6.08 5.5 7.28-.18.72-.85 3.82-.99 4.46-.22 1.02.61 1.89 1.62 1.62l5.08-2.94c.4.05.81.08 1.22.08 5.52 0 10-3.58 10-8 0-4.42-4.48-8-10-8zm2.41 11.23h-3.67v2.89h-2.17v-2.89H4.97v-2.02h3.6v-2.78h2.17v2.78h3.67v2.02z"/>
            </svg>
            <span className="text-[15px]">Log in with LINE</span>
          </Button>
        </div>

        <p className="text-center mt-6 text-sm text-muted-foreground font-prompt">
          {isLogin ? "ยังไม่มีบัญชี? " : "มีบัญชีอยู่แล้ว? "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrors({});
            }}
            className="text-primary hover:underline font-semibold"
          >
            {isLogin ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
          </button>
        </p>

        <div className="mt-8 pt-6 border-t border-border">
          <Link to="/">
            <Button variant="ghost" className="w-full font-prompt">
              ← กลับสู่หน้าแรก
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;
