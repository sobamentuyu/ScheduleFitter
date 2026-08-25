import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Header } from "./ui";
import { Setting, Top, Account, Theme } from "./pages";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-svh font-sans">
        <Header />
        <Routes>
          <Route path="/" element={<Top />} />
          <Route path="/setting" element={<Setting />} />
          <Route path="/setting/account" element={<Account />} />
          <Route path="/setting/theme" element={<Theme />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
