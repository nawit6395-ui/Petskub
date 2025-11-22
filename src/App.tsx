import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import BackToTopButton from "./components/BackToTopButton";

const Home = lazy(() => import("./pages/Home"));
const Adopt = lazy(() => import("./pages/Adopt"));
const Report = lazy(() => import("./pages/Report"));
const ReportMap = lazy(() => import("./pages/ReportMap"));
const Help = lazy(() => import("./pages/Help"));
const Knowledge = lazy(() => import("./pages/Knowledge"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));
const AddCat = lazy(() => import("./pages/AddCat"));
const AddUrgentCase = lazy(() => import("./pages/AddUrgentCase"));
const SuccessStories = lazy(() => import("./pages/SuccessStories"));
const Forum = lazy(() => import("./pages/Forum"));
const CreateForumPost = lazy(() => import("./pages/CreateForumPost"));
const ForumPost = lazy(() => import("./pages/ForumPost"));
const Profile = lazy(() => import("./pages/Profile"));
const CreateArticle = lazy(() => import("./pages/CreateArticle"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const Chat = lazy(() => import("./pages/Chat"));
const Privacy = lazy(() => import("./pages/Privacy"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 15,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="py-16 text-center text-muted-foreground font-prompt">กำลังโหลด...</div>
);

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
    <BackToTopButton />
    <CookieConsent />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/adopt" element={<Layout><Adopt /></Layout>} />
              <Route path="/report" element={<Layout><Report /></Layout>} />
              <Route path="/reports/map" element={<Layout><ReportMap /></Layout>} />
              <Route path="/help" element={<Layout><Help /></Layout>} />
              <Route path="/knowledge" element={<Layout><Knowledge /></Layout>} />
              <Route path="/knowledge/create" element={<Layout><CreateArticle /></Layout>} />
              <Route path="/knowledge/:id/edit" element={<Layout><CreateArticle /></Layout>} />
              <Route path="/knowledge/:slugOrId" element={<Layout><ArticleDetail /></Layout>} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<Layout><Admin /></Layout>} />
              <Route path="/add-cat" element={<Layout><AddCat /></Layout>} />
              <Route path="/add-urgent-case" element={<Layout><AddUrgentCase /></Layout>} />
              <Route path="/success-stories" element={<Layout><SuccessStories /></Layout>} />
              <Route path="/forum" element={<Layout><Forum /></Layout>} />
              <Route path="/forum/create" element={<Layout><CreateForumPost /></Layout>} />
              <Route path="/forum/:id/edit" element={<Layout><CreateForumPost /></Layout>} />
              <Route path="/forum/:id" element={<Layout><ForumPost /></Layout>} />
              <Route path="/chat" element={<Layout><Chat /></Layout>} />
              <Route path="/profile" element={<Layout><Profile /></Layout>} />
              <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
