import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, ArrowRight, ShieldCheck, PawPrint, Sparkles } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { buildAppUrl } from "@/lib/utils";
import Logo from "@/assets/Logo.png";

const loginSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

const signupSchema = loginSchema
  .extend({
    confirmPassword: z.string(),
    fullName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
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
  const { user, signIn, signUp, syncProfileFromUser } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: buildAppUrl("/"),
        },
      });

      if (error) throw error;
      await syncProfileFromUser();
    } catch (error: any) {
      toast.error("ไม่สามารถเข้าสู่ระบบด้วย Google ได้", {
        description: error.message,
      });
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: buildAppUrl("/"),
        },
      });

      if (error) throw error;
      await syncProfileFromUser();
    } catch (error: any) {
      toast.error("ไม่สามารถเข้าสู่ระบบด้วย Facebook ได้", {
        description: error.message,
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
      console.error("Auth error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-warm via-white to-white px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 lg:flex-row">
        <div className="relative overflow-hidden rounded-[32px] bg-white/80 p-8 shadow-[0_40px_120px_rgba(244,162,89,0.25)] backdrop-blur supports-[backdrop-filter]:backdrop-blur-xl lg:w-1/2">
          <div className="absolute inset-x-10 bottom-6 top-6 rounded-3xl bg-gradient-to-b from-orange-50/60 to-transparent blur-3xl"></div>
          <div className="relative space-y-6">
            <div className="flex items-center gap-4">
              <img src={Logo} alt="Petskub logo" className="h-14 w-auto" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Petskub</p>
                <p className="text-3xl font-bold text-slate-900">ชุมชนช่วยสัตว์จร</p>
              </div>
            </div>
            <p className="text-lg leading-relaxed text-slate-600">
              ร่วมเป็นกำลังใจให้สัตว์จร ช่วยกันหาบ้านที่อบอุ่น และรับข้อมูลสำคัญได้รวดเร็วขึ้นผ่านบัญชีเดียว
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: <PawPrint className="h-5 w-5" />, label: "ประกาศช่วยเหลือ",
                  desc: "ตามติดเคสด่วนและลงประกาศใหม่ได้ง่าย",
                },
                {
                  icon: <ShieldCheck className="h-5 w-5" />, label: "ข้อมูลปลอดภัย",
                  desc: "เข้ารหัสตามมาตรฐาน Supabase Auth",
                },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm">
                  <div className="flex items-center gap-3 text-primary">
                    <span className="rounded-full bg-primary/10 p-2 text-primary">{item.icon}</span>
                    <p className="font-semibold text-slate-900">{item.label}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-rose-100 via-white to-amber-100/80 p-5">
              <p className="text-sm font-semibold text-amber-700">สถิติวันนี้</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">+48 คนเข้าร่วมภารกิจ</p>
              <p className="text-sm text-slate-600">ขอบคุณที่เป็นส่วนหนึ่งในการช่วยเหลือสัตว์จร 🧡</p>
            </div>
          </div>
        </div>

        <Card className="w-full rounded-[32px] border-none bg-white/95 p-6 shadow-[0_30px_60px_rgba(15,23,42,0.08)] sm:p-8 lg:w-1/2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">{isLogin ? "ยินดีต้อนรับกลับ" : "เริ่มต้นการเดินทาง"}</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                {isLogin ? "เข้าสู่ระบบ Petskub" : "สมัครสมาชิกใหม่"}
              </h1>
            </div>
            <Sparkles className="hidden h-8 w-8 text-primary lg:block" />
          </div>

          <div className="mb-6 flex rounded-full bg-muted/40 p-1 text-sm font-semibold text-slate-500">
            {[{ label: "ฉันมีบัญชีอยู่แล้ว", value: true }, { label: "ฉันยังไม่มีบัญชี", value: false }].map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => {
                  setIsLogin(tab.value);
                  setErrors({});
                }}
                className={`flex-1 rounded-full px-4 py-2 transition ${
                  isLogin === tab.value ? "bg-white text-primary shadow" : "text-slate-500"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="font-prompt">ชื่อ-นามสกุล (ไม่บังคับ)</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="เช่น มะเหมี่ยว คนใจดี"
                  className="font-prompt"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-prompt">อีเมล</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-prompt">รหัสผ่าน</Label>
                <button type="button" className="text-xs font-semibold text-primary hover:underline">ลืมรหัสผ่าน?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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

            <Button type="submit" className="w-full gap-2 rounded-2xl bg-primary px-6 py-6 text-base font-semibold">
              {isLogin ? "เข้าสู่ระบบทันที" : "สร้างบัญชี Petskub"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-muted-foreground">
              หรือเลือกวิธีที่คุณถนัด
            </span>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full items-center justify-center gap-3 rounded-2xl border-slate-200 py-3 text-slate-700 hover:bg-slate-50"
              type="button"
              onClick={handleGoogleSignIn}
            >
              <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              ดำเนินการต่อด้วย Google
            </Button>

            <Button
              variant="outline"
              className="w-full items-center justify-center gap-3 rounded-2xl border-blue-200 bg-blue-50/70 py-3 text-blue-700 hover:bg-blue-50"
              type="button"
              onClick={handleFacebookSignIn}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M22 12.07C22 6.55 17.52 2.07 12 2.07S2 6.55 2 12.07c0 4.99 3.66 9.13 8.44 9.93v-7.03H7.9v-2.9h2.54V9.64c0-2.5 1.5-3.89 3.79-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22c4.78-.8 8.42-4.94 8.42-9.93z" />
              </svg>
              ดำเนินการต่อด้วย Facebook
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            การเข้าสู่ระบบถือว่ายอมรับ <Link to="/privacy" className="font-semibold text-primary underline-offset-2 hover:underline">นโยบายความเป็นส่วนตัว</Link>
          </p>

          <div className="mt-6 flex flex-col items-center gap-2 border-t border-border pt-6 text-sm text-muted-foreground">
            <p>
              {isLogin ? "ยังไม่มีบัญชี?" : "มีบัญชีอยู่แล้ว?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="font-semibold text-primary hover:underline"
              >
                {isLogin ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
              </button>
            </p>
            <Link to="/" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-primary">
              ← กลับสู่หน้าแรก
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
