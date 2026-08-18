import React, { useState, useEffect } from 'react';

const Spinner = () => (
    <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid rgba(0,0,0,0.1)',
            borderRadius: '50%',
            borderTopColor: '#3498db',
            animation: 'spin 1s ease-in-out infinite'
        }}></div>
        <style>
            {`
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            `}
        </style>
        <p>Loading repositories...</p>
    </div>
);

const ErrorMessage = ({ message }) => (
    <div style={{ color: 'red', textAlign: 'center', padding: '20px', backgroundColor: '#ffeaea', borderRadius: '5px' }}>
        <h3>Failed to load repositories</h3>
        <p>{message}</p>
    </div>
);

function Projects() {
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('https://api.github.com/users/RudraMaiyariya/repos?sort=updated&per_page=3')
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Error: ${res.status} ${res.statusText}`);
                }
                return res.json();
            })
            .then((data) => setRepos(data))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <section className="section">
            <h2>My Projects</h2>

            {loading && <Spinner />}
            {error && <ErrorMessage message={error} />}
            {!loading && !error && (
                <div className="details" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {repos.map((repo) => (
                        <div key={repo.id} style={{
                            padding: "20px",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            backgroundColor: "#fff"
                        }}>
                            <h3 style={{ fontSize: "20px", marginBottom: "10px" }}>
                                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#0366d6' }}>
                                    {repo.name}
                                </a>
                            </h3>
                            <p style={{ color: '#586069', fontSize: '14px', marginBottom: '15px' }}>
                                {repo.description || 'No description available.'}
                            </p>
                            {/*  
                            <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#586069' }}>
                                {repo.language && <span>🟡 {repo.language}</span>}
                                    <span>⭐ {repo.stargazers_count}</span>
                            </div>
                            */}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

export default Projects;
