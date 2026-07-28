function Projects() {
    return (
        <section className="section">
            <h2>My Projects</h2>
            <div className="details">
                <div style={{ marginBottom: "25px" }}>
                    <h3 style={{ fontSize: "22px", marginBottom: "8px" }}>Practical 1 - Portfolio Foundation</h3>
                    <p>Built the initial React portfolio application with reusable components (Header, About, Skills, Footer) and modern UI styling.</p>
                </div>
                <div style={{ marginBottom: "25px" }}>
                    <h3 style={{ fontSize: "22px", marginBottom: "8px" }}>Practical 2 - React Router & Hooks</h3>
                    <p>Extended the portfolio application with multi-page client-side routing using React Router and interactive state management with useState hooks.</p>
                </div>
            </div>
        </section>
    );
}

export default Projects;
