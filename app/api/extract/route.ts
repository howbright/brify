// app/api/extract/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(response.data);

    // 광고/불필요 요소 제거
    $("script, style, noscript, header, footer, nav, iframe").remove();

    const rawText = $("body").text();
    console.log(rawText);
    const cleanText = rawText.replace(/\s{2,}/g, " ").trim();

    return NextResponse.json({ text: cleanText.slice(0, 10000) });

  } catch (error) {
    console.error("크롤링 실패:", error);
    return NextResponse.json({ error: "크롤링 실패" }, { status: 500 });
  }
}
