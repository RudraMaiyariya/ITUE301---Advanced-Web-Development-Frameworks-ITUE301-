import React, { memo } from 'react';

/**
 * Footer Component - Supplementary Problem 3
 * Wrapped with React.memo to prevent unnecessary re-renders.
 * In React DevTools Profiler, when parent route or state changes in App.jsx,
 * this component will be skipped from rendering because its props (email, phone, city)
 * remain shallowly identical.
 */
function Footer(props) {
    return (
        <section className="footer">
            <h2>Contact</h2>
            <p>Email : {props.email}</p>
            <p>Phone : {props.phone}</p>
            <p>City : {props.city}</p>
            <hr />
            <p>© 2026 Student Portfolio</p>
        </section>
    );
}

// React.memo prevents unnecessary re-rendering identified via React DevTools Profiler
export default memo(Footer);