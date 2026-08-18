import { useState } from "react";
import Header from "./Header";
import About from "./About";
import Skills from "./Skills";

function Home() {
    const [showAbout, setShowAbout] = useState(true);

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
            <Header
                title="Student Portfolio"
                name="Rudra Maiyariya"
                role="Computer Engineering Student"
                themeColor="#ffffff"
            />

            <div style={{ textAlign: "center", margin: "10px 0" }}>
                <button onClick={() => setShowAbout(!showAbout)}>
                    {showAbout ? "Hide About Section" : "Show About Section"}
                </button>
            </div>

            {showAbout && <About />}

            <Skills skillList={skills} />
        </div>
    );
}

export default Home;
