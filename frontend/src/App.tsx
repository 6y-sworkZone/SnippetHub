import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Editor from "@/pages/Editor";
import Search from "@/pages/Search";
import Templates from "@/pages/Templates";
import Share from "@/pages/Share";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/editor/:id" element={<Editor />} />
        <Route path="/search" element={<Search />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/share/:token" element={<Share />} />
      </Routes>
    </Router>
  );
}
