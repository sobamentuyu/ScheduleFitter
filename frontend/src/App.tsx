import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { Header } from "@/ui/container/Header.tsx";
import { Account } from "@/pages/Account.tsx";
import { Setting } from "@/pages/Setting.tsx";
import { ThemeSelector } from "@/ui/theme/ThemeSelector.tsx";
import { Top } from "@/pages/Top";
import Login from "./pages/Login";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div className="flex h-svh flex-col font-sans">
        <Header />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<Top />} />
            <Route path="/setting" element={<Setting />} />
            <Route path="/setting/account" element={<Account />} />
            <Route path="/setting/theme" element={<ThemeSelector />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
