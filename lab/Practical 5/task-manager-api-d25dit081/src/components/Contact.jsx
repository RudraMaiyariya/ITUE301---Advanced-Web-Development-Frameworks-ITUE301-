import { useState } from "react";

function Contact() {
    const [message, setMessage] = useState("");

    return (
        <section className="section">
            <h2>Contact Page</h2>
            <p>Send a message below and see real-time updates:</p>

            <div className="details" style={{ marginTop: "25px" }}>
                <label htmlFor="messageInput" style={{ display: "block", marginBottom: "10px", color: "#bdbdbd" }}>
                    Write Message:
                </label>
                <input
                    id="messageInput"
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message"
                    style={{
                        padding: "12px 20px",
                        width: "100%",
                        maxWidth: "450px",
                        borderRadius: "8px",
                        border: "1px solid #333",
                        background: "#1b1b1b",
                        color: "#fff",
                        fontSize: "16px",
                        outline: "none"
                    }}
                />

<div style={{ marginTop: "25px" }}>
    <p><strong>Entered Text (Real Time):</strong></p>
    <p style={{ color: "#fff", marginTop: "10px" }}>
        {message || "No text entered yet..."}
    </p>

    <div style={{ marginTop: "15px" }}>
        <p><strong>Character Count:</strong> {message.length}</p>
    </div>
</div>

            </div>
        </section>
    );
}

export default Contact;
