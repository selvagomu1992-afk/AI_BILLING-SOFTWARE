import React, { useState, useEffect } from 'react'
import { aiInvoiceModalStyles } from '../assets/dummyStyles';
import GeminiIcon from './GeminiIcon';
import AnimatedButton from '../assets/GenerateBtn/Gbtn';
import { useNavigate } from 'react-router-dom';

const AiInvoiceModal = ({ open, onClose, onGenerate, initialText = "" }) => {
    const navigate = useNavigate();
    const [text, setText] = useState(initialText || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setText(initialText || "");
        setError("");
        setLoading(false);
    }, [open, initialText]);

    if (!open) return null;

    const handleGenerateClick = async () => {
        setError("");
        const raw = (text || "").trim();
        if (!raw) {
            setError("Please paste  the invoice text to generate from AI");
            return;
        }

        try {
            setLoading(true);
            const maybePromise = onGenerate && onGenerate(raw);

            if (maybePromise && typeof maybePromise.then === "function") {
                await maybePromise;
            }
        } catch (err) {
            console.error("Error generating invoice", err);
            const msg = err && (err.message || (typeof err === "string" ? err : "Failed to generate invoice"));

            if (msg.toLowerCase().includes("limit reached") || msg.includes("LIMIT_REACHED")) {
                alert("Free plan limit reached. Please upgrade your plan.");
                if (onClose) onClose();
                navigate('/pricing');
                return;
            }

            setError(msg || "Failed to generate invoice");
        } finally {
            setLoading(false);
        }

    };
    return (
        <div className={aiInvoiceModalStyles.overlay}>
            <div className={aiInvoiceModalStyles.backdrop} onClick={() => onClose && onClose()} ></div>


            <div className={aiInvoiceModalStyles.modal}>
                <div className='flex items-start justify-between'>
                    <div>
                        <h3 className={aiInvoiceModalStyles.title}>
                            <GeminiIcon className="w-6 h-6 group-hover:scale-110 transition-transform flex-none" />
                            Generate Invoice from AI
                        </h3>
                        <p className={aiInvoiceModalStyles.description}>
                            Paste any text that contain details (client, item, qty, prices)
                            and we'll attempt to extract an invoice
                        </p>
                    </div>
                    <button onClick={() => onClose && onClose()}
                        className={aiInvoiceModalStyles.closeButton}>
                        ✕
                    </button>
                </div>
                <div className='mt-4'>
                    <label className={aiInvoiceModalStyles.label}>
                        Paste Invoice text
                    </label>
                    <textarea value={text} onChange={(e) => setText(e.target.value)}
                        placeholder={`eg. A person wants a logo design for her organic brand "GreenVibe."
                      Quoted for $120 for 2 logo options and final Delivary in PMG and Vector formet `} rows={8}
                        className={aiInvoiceModalStyles.textarea} >

                    </textarea>
                </div>
                {error && (
                    <div className={aiInvoiceModalStyles.error} role="alert">
                        {String(error)
                            .split("\n")
                            .map((line, i) => (
                                <div key={i}>{line}</div>
                            ))}
                        {(/quota|exhausted|resource_exhausted/i.test(String(error)) && (
                            <div style={{ marginTop: 8, fontSize: 13, color: "#374151" }}>
                                Tip: AI is temporarily unavailable (quota). Try again in a few
                                minutes, or create the invoice manually.
                            </div>
                        )) ||
                            null}
                    </div>
                )}
                <div className={aiInvoiceModalStyles.actions}>
                    <AnimatedButton onClick={handleGenerateClick} isLoading={loading}
                        disabled={loading} label="Generate " />

                </div>
            </div>

        </div>
    )
}

export default AiInvoiceModal