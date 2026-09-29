import React from 'react';

function ConfirmModal({ isOpen, title = 'Confirm Action', message, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999
        }}>
            <div style={{
                background: '#18181b',
                border: '1px solid #27272a',
                padding: '24px',
                borderRadius: '12px',
                maxWidth: '440px',
                width: '90%',
                boxShadow: '0 20px 30px rgba(0,0,0,0.5)',
                textAlign: 'left'
            }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#f4f4f5', fontSize: '18px' }}>
                    {title}
                </h3>
                <p style={{ margin: '0 0 24px 0', color: '#a1a1aa', fontSize: '14px', lineHeight: '1.5' }}>
                    {message}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            padding: '7px 16px',
                            border: '1px solid #3f3f46',
                            borderRadius: '6px',
                            backgroundColor: '#27272a',
                            color: '#e4e4e7',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        style={{
                            padding: '7px 16px',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: '#dc2626',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
