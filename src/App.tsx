import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import Home from "./pages/Home";
import Adopt from "./pages/Adopt";
import Report from "./pages/Report";
import ReportMap from "./pages/ReportMap";
import Help from "./pages/Help";
import Knowledge from "./pages/Knowledge";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import AddCat from "./pages/AddCat";
import AddUrgentCase from "./pages/AddUrgentCase";
import SuccessStories from "./pages/SuccessStories";
import Forum from "./pages/Forum";
import CreateForumPost from "./pages/CreateForumPost";
import ForumPost from "./pages/ForumPost";
import Profile from "./pages/Profile";
import CreateArticle from "./pages/CreateArticle";
import ArticleDetail from "./pages/ArticleDetail";
import Chat from "./pages/Chat";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
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
          <Routes>
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/adopt" element={<Layout><Adopt /></Layout>} />
            <Route path="/report" element={<Layout><Report /></Layout>} />
            <Route path="/reports/map" element={<Layout><ReportMap /></Layout>} />
            <Route path="/help" element={<Layout><Help /></Layout>} />
            <Route path="/knowledge" element={<Layout><Knowledge /></Layout>} />
            <Route path="/knowledge/create" element={<Layout><CreateArticle /></Layout>} />
            <Route path="/knowledge/:id/edit" element={<Layout><CreateArticle /></Layout>} />
            <Route path="/knowledge/:id" element={<Layout><ArticleDetail /></Layout>} />
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
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
