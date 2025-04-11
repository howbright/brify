"use client";

import { useState } from "react";

export default function YouTubeTranscript() {
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState<any[] | null>(null);
  const [error, setError] = useState("");

  const handleFetch = async () => {
    setError("");
    setTranscript(null);
    const res = await fetch("/api/transcript", {
      method: "POST",
      body: JSON.stringify({ url }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (res.ok) {
        console.log(data.transcript)
      setTranscript(data.transcript);
    } else {
      setError(data.error || "오류가 발생했어요");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-20 px-4 space-y-6">
      <h1 className="text-2xl font-bold">🎬 유튜브 자막 추출</h1>
      <input
        type="text"
        placeholder="유튜브 링크를 붙여넣으세요"
        className="w-full border p-2 rounded"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button
        className="px-4 py-2 bg-black text-white rounded"
        onClick={handleFetch}
      >
        자막 가져오기
      </button>

      {error && <p className="text-red-500">{error}</p>}

      {transcript && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold mt-4">📄 자막</h2>
          <div className="text-sm whitespace-pre-wrap">
            {transcript.map((t, i) => (
              <p key={i}>
                [{t.offset ? t.offset.toFixed(1) + "s" : "??s"}] {t.text}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
