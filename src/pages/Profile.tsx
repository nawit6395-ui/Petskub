import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { alert } from '@/lib/alerts';
import { Loader2, Upload, User, Lock } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading, updateProfile, uploadAvatar } = useProfile();
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [lineId, setLineId] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setLineId(profile.line_id || '');
      setProvince(profile.province || '');
      setDistrict(profile.district || '');
    }
  }, [profile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert.error('ไฟล์ใหญ่เกินไป', {
        description: 'กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB'
      });
      return;
    }

    uploadAvatar.mutate(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    updateProfile.mutate({
      full_name: fullName,
      phone,
      line_id: lineId,
      province,
      district,
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      alert.error('รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (newPassword.length < 6) {
      alert.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    try {
      const { error } = await (await import('@/integrations/supabase/client')).supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      alert.success('เปลี่ยนรหัสผ่านสำเร็จ');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      alert.error('เกิดข้อผิดพลาด', {
        description: error.message
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-soft py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8 font-prompt">ข้อมูลโปรไฟล์</h1>

        {/* Avatar Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-prompt">รูปโปรไฟล์</CardTitle>
            <CardDescription>อัปโหลดรูปภาพของคุณ</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="w-32 h-32">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>
                <User className="w-16 h-16" />
              </AvatarFallback>
            </Avatar>
            <div>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={uploadAvatar.isPending}
              />
              <Label htmlFor="avatar-upload">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadAvatar.isPending}
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  className="cursor-pointer font-prompt"
                  asChild
                >
                  <span>
                    {uploadAvatar.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    เลือกรูปภาพ
                  </span>
                </Button>
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-prompt">ข้อมูลส่วนตัว</CardTitle>
            <CardDescription>แก้ไขข้อมูลของคุณ</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <Label htmlFor="email" className="font-prompt">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="fullName" className="font-prompt">ชื่อ-นามสกุล</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ระบุชื่อ-นามสกุล"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="font-prompt">เบอร์โทรศัพท์</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0xx-xxx-xxxx"
                  />
                </div>

                <div>
                  <Label htmlFor="lineId" className="font-prompt">Line ID</Label>
                  <Input
                    id="lineId"
                    type="text"
                    value={lineId}
                    onChange={(e) => setLineId(e.target.value)}
                    placeholder="Line ID"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="province" className="font-prompt">จังหวัด</Label>
                  <Input
                    id="province"
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="จังหวัด"
                  />
                </div>

                <div>
                  <Label htmlFor="district" className="font-prompt">อำเภอ/เขต</Label>
                  <Input
                    id="district"
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="อำเภอ/เขต"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full font-prompt"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                บันทึกข้อมูล
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="font-prompt flex items-center gap-2">
              <Lock className="w-5 h-5" />
              เปลี่ยนรหัสผ่าน
            </CardTitle>
            <CardDescription>ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="newPassword" className="font-prompt">รหัสผ่านใหม่</Label>
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                  startIcon={<Lock className="h-4 w-4" />}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="font-prompt">ยืนยันรหัสผ่านใหม่</Label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="ยืนยันรหัสผ่านใหม่"
                  startIcon={<Lock className="h-4 w-4" />}
                />
              </div>

              <Button
                type="submit"
                className="w-full font-prompt"
                disabled={!newPassword || !confirmPassword}
              >
                เปลี่ยนรหัสผ่าน
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
