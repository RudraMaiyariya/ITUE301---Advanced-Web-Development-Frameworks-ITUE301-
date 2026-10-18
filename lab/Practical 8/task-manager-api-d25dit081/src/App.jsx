import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PageLoader from "./components/PageLoader";
import lazyWithDelay from "./utils/lazyWithDelay";

// Supplementary Problem 2: Route-based lazy loading with 300ms min-delay fallback to prevent flickering
const Home = lazyWithDelay(() => import("./components/Home"), 300);
const Projects = lazyWithDelay(() => import("./components/Projects"), 300);
const Contact = lazyWithDelay(() => import("./components/Contact"), 300);
const NotFound = lazyWithDelay(() => import("./pages/NotFound"), 300);

function App() {
  return (
    <BrowserRouter>
      <div>
        <Navbar />

        {/* Suspense wrapper with meaningful fallback UI */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tasks" element={<Projects />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>

        <Footer
          email="rudra@email.com"
          phone="+91 1234567891"
          city="Porbandar"
        />
      </div>
    </BrowserRouter>
  );
}

export default App;