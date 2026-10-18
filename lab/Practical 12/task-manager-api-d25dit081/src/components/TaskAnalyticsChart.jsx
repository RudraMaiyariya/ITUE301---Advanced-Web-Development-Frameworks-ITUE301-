import React from 'react';

/**
 * TaskAnalyticsChart - Supplementary Problem 1
 * Simulates a heavy third-party chart/analytics module.
 * Lazy loaded on demand using React.lazy() and Suspense to prevent bloating the initial bundle.
 */
function TaskAnalyticsChart({ tasks = [] }) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const highPriority = tasks.filter(t => t.priority === 'high').length;
    const medPriority = tasks.filter(t => t.priority === 'medium').length;
    const lowPriority = tasks.filter(t => t.priority === 'low').length;

    const completedPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div style={{
            background: '#18181b',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📊</span> Task Analytics Dashboard (Lazy Loaded Module)
                </h3>
                <span style={{ fontSize: '12px', background: '#2563eb33', color: '#60a5fa', padding: '3px 10px', borderRadius: '12px', border: '1px solid #3b82f644' }}>
                    Chunk loaded on demand
                </span>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>
                    <span>Completion Rate</span>
                    <strong style={{ color: '#4ade80' }}>{completedPercent}%</strong>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#27272a', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${completedPercent}%`, height: '100%', background: '#22c55e', transition: 'width 0.4s ease' }}></div>
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                <div style={{ background: '#27272a', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#a1a1aa' }}>Total</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f4f4f5' }}>{total}</div>
                </div>
                <div style={{ background: '#22c55e18', border: '1px solid #22c55e33', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#4ade80' }}>Completed</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4ade80' }}>{completed}</div>
                </div>
                <div style={{ background: '#f59e0b18', border: '1px solid #f59e0b33', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#fbbf24' }}>Pending</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fbbf24' }}>{pending}</div>
                </div>
                <div style={{ background: '#ef444418', border: '1px solid #ef444433', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#f87171' }}>High Priority</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f87171' }}>{highPriority}</div>
                </div>
                <div style={{ background: '#3b82f618', border: '1px solid #3b82f633', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#60a5fa' }}>Med / Low</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#60a5fa' }}>{medPriority + lowPriority}</div>
                </div>
            </div>
        </div>
    );
}

export default TaskAnalyticsChart;
