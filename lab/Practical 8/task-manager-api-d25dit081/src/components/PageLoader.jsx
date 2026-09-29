import React from 'react';

function PageLoader() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
            color: '#a1a1aa'
        }}>
            <div style={{
                width: '36px',
                height: '36px',
                border: '3px solid #27272a',
                borderRadius: '50%',
                borderTopColor: '#3b82f6',
                animation: 'spin 0.8s linear infinite'
            }}></div>
            <style>
                {`@keyframes spin { to { transform: rotate(360deg); } }`}
            </style>
            <p style={{ marginTop: '16px', fontSize: '14px', color: '#71717a' }}>
                Loading module...
            </p>
        </div>
    );
}

export default PageLoader;
