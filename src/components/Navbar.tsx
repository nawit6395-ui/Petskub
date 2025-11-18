import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Heart, LogIn, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";

const Navbar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isAdmin = useIsAdmin();
  const { profile } = useProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  
  const navLinks = [
    { path: "/", iconClass: "fa-solid fa-house", color: "#2E8BFD", label: "หน้าแรก" },
    { path: "/adopt", iconClass: "fa-solid fa-magnifying-glass", color: "#F472B6", label: "หาบ้านให้แมว" },
    { path: "/success-stories", iconClass: "fa-solid fa-wand-magic-sparkles", color: "#F59E0B", label: "เรื่องราวความสำเร็จ" },
    { path: "/report", iconClass: "fa-solid fa-location-dot", color: "#22C55E", label: "แจ้งเจอแมวจร" },
    { path: "/help", iconClass: "fa-solid fa-triangle-exclamation", color: "#EF4444", label: "ช่วยเหลือด่วน" },
    { path: "/knowledge", iconClass: "fa-solid fa-book-open", color: "#A855F7", label: "ความรู้" },
    { path: "/forum", iconClass: "fa-regular fa-comments", color: "#F97316", label: "เว็บบอร์ด" },
  ];

  const adminLinks = isAdmin ? [{ path: "/admin", label: "Admin" }] : [];

  return (
    <nav className="sticky top-0 z-50 bg-card shadow-card border-b border-border backdrop-blur-sm bg-card/95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Hamburger Menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px]">
                <div className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <Link key={link.path} to={link.path} onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant={isActive(link.path) ? "secondary" : "ghost"}
                        className="w-full justify-start font-prompt gap-2"
                      >
                        <i
                          className={`${link.iconClass} text-base`}
                          style={{ color: link.color, minWidth: "1rem" }}
                          aria-hidden="true"
                        />
                        {link.label}
                      </Button>
                    </Link>
                  ))}
                  {adminLinks.map((link) => (
                    <Link key={link.path} to={link.path} onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant={isActive(link.path) ? "secondary" : "ghost"}
                        className="w-full justify-start font-prompt"
                      >
                        {link.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <Heart className="w-6 h-6 fill-primary" />
            <span className="font-prompt">CatHome</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button
                  variant={isActive(link.path) ? "secondary" : "ghost"}
                  className="font-prompt gap-2"
                >
                  <i
                    className={`${link.iconClass} text-base`}
                    style={{ color: link.color, minWidth: "1rem" }}
                    aria-hidden="true"
                  />
                  {link.label}
                </Button>
              </Link>
            ))}
            {adminLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button
                  variant={isActive(link.path) ? "secondary" : "ghost"}
                  className="font-prompt"
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="font-prompt gap-2 h-auto py-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline font-medium">
                    {profile?.full_name || user.email?.split("@")[0] || "ผู้ใช้"}
                  </span>
                </Button>
              </Link>
              <Button onClick={signOut} variant="outline" size="sm" className="font-prompt gap-1 sm:gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm" className="font-prompt gap-1 sm:gap-2">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">เข้าสู่ระบบ</span>
              </Button>
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
