import "./App.css";

import Header from "./components/Header";
import About from "./components/About";
import Skills from "./components/Skills";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

function App() {

  const skills = [
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "Node js",
    "Vite"
  ];

  return (
    <div>
    <Navbar />

      <Header
        title="Student Portfolio"
        name="Rudra Maiyariya"
        role="Computer Engineering Student"
        themeColor="#ffffff"

      />

      <About />

      <Skills skillList={skills} />

      <Footer
        email="rudra@email.com"
        phone="+91 1234567891"
        city="Porbandar"
      />

    </div>
  );
}

export default App;