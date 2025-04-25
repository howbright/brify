const BACKEND_SERVERS = [
  "http://localhost:4000",
  "http://localhost:4001",
  "http://localhost:4002",
];

// 서버 비활성화 캐시: { url: timestampUntilActiveAgain }
const disabledServers = new Map<string, number>();

let currentIndex = 0;
function getNextHealthyBackend(): string | null {
  const now = Date.now();

  for (let i = 0; i < BACKEND_SERVERS.length; i++) {
    const backend = BACKEND_SERVERS[currentIndex];
    currentIndex = (currentIndex + 1) % BACKEND_SERVERS.length;

    const disabledUntil = disabledServers.get(backend);
    if (!disabledUntil || now > disabledUntil) {
      return backend;
    }
  }

  return null; // 모두 비활성화된 경우
}

// IP 요청 제한 캐시: { ip: [timestamp, timestamp, ...] }
const ipRequestHistory = new Map<string, number[]>();

const RATE_LIMIT = 10; // 10회
const TIME_WINDOW = 60 * 1000; // 1분

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const history = ipRequestHistory.get(ip) || [];

  // 최근 1분 내 기록만 남김
  const recent = history.filter((ts) => now - ts < TIME_WINDOW);
  recent.push(now);
  ipRequestHistory.set(ip, recent);

  return recent.length > RATE_LIMIT;
}

export async function POST(req: Request) {
  const { url } = await req.json();
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Too many requests from this IP." },
      { status: 429 }
    );
  }

  let lastError = null;

  for (let i = 0; i < BACKEND_SERVERS.length; i++) {
    const backend = getNextHealthyBackend();

    if (!backend) break;

    try {
      const res = await fetch(
        `${backend}/youtube/transcript?url=${encodeURIComponent(url)}`
      );

      if (!res.ok) {
        throw new Error(`Backend error: ${res.statusText}`);
      }

      const data = await res.json();
      return Response.json(data);
    } catch (error) {
      lastError = error;
      console.warn(`[Brify] Backend failed: ${backend}`, error);
      disabledServers.set(backend, Date.now() + 10 * 60 * 1000); // 10분 스킵
    }
  }

  return Response.json(
    { error: "All backends failed.", detail: String(lastError) },
    { status: 500 }
  );
}
