"use client";

import { useState } from "react";

import dummyCVData from "./dummy-cv.json";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dummyCVData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate PDF");
      }

      // Trigger download of the PDF blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cvitae-resume.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <header className="hero">
        <h1>CVitae</h1>
        <p>The Magic, Zero-Cost CV Builder</p>
      </header>
      
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem 0' }}>
        <button 
          onClick={generatePDF} 
          disabled={loading}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.25rem',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.2s',
            fontWeight: 'bold',
          }}
        >
          {loading ? "Compiling PDF via Cloud Run..." : "Export PDF (Magic)"}
        </button>

        {error && (
          <div style={{ marginTop: '1rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '0.5rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </section>

      <section className="features">
        <div className="feature-card">
          <h2>Serverless Engine</h2>
          <p>Compiles your CV using Google Cloud Run for 100% reliability and zero idle costs.</p>
        </div>
        <div className="feature-card">
          <h2>AI Tailoring</h2>
          <p>Powered by Gemini, seamlessly adapting your experience to any job description.</p>
        </div>
      </section>
    </main>
  );
}
