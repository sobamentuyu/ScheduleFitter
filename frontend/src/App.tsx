import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Header } from "./ui";
import { Setting, Top } from "./pages";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-svh font-sans">
        <Header />
        <Routes>
          <Route path="/" element={<Top />} />
          <Route path="/setting" element={<Setting />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
