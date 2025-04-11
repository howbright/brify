// app/api/transcript/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    // 유튜브 영상 ID 추출
    const videoId = getYouTubeVideoId(url)
    if (!videoId) return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })

    const transcript = await YoutubeTranscript.fetchTranscript(videoId)

    return NextResponse.json({ transcript })
  } catch (error) {
    console.error('Transcript fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch transcript' }, { status: 500 })
  }
}

// 유튜브 URL에서 영상 ID 추출
function getYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1)
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v')
  } catch {
    return null
  }
  return null
}
