"use client";

import { useState } from "react";
import SourceTabs, { SourceType } from "./SourceTabs";
import InputSection from "./InputSection";
import ExtractedText from "./ExtractedText";
import SummarizeButton from "./SummarizeButton";
import SummaryResult from "./SummaryResult";

export default function SummarizePage() {
    const [sourceType, setSourceType] = useState<SourceType>("youtube");
    const [rawText, setRawText] = useState("");
    const [summary, setSummary] = useState("");
    const [loading, setLoading] = useState(false);
  
    function summarizeText(rawText: string) {
        alert("요약시작")
        return rawText;
    }

    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        <SourceTabs selected={sourceType} onChange={setSourceType} />
  
        <InputSection
          type={sourceType}
          onExtracted={(text) => setRawText(text)}
          isLoading={loading}
          setIsLoading={setLoading}
        />
  
        {rawText && (
          <>
            <ExtractedText value={rawText} onChange={setRawText} />
            
            <SummarizeButton
              onSummarize={async () => {
                setLoading(true);
                const result = await summarizeText(rawText); // GPT 호출
                setSummary(result);
                setLoading(false);
              }}
              loading={loading}
            />
          </>
        )}
  
        {summary && <SummaryResult text={summary} />}
      </div>
    );
  }
  