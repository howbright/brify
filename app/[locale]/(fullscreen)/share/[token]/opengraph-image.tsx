import { ImageResponse } from "next/og";
import {
  buildSharedMapOgText,
  getSharedMapMetaByToken,
} from "@/app/lib/sharedMapMeta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type ImageProps = {
  params: Promise<{
    token: string;
  }>;
};

function clampText(value: string, max: number) {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export default async function Image({ params }: ImageProps) {
  const { token } = await params;
  const map = await getSharedMapMetaByToken(token);

  if (!map) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            background:
              "linear-gradient(135deg, #0f172a 0%, #1d4ed8 50%, #22c55e 100%)",
            color: "white",
            padding: 56,
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 28, opacity: 0.85 }}>Brify</div>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1 }}>
            Shared Structure Map
          </div>
        </div>
      ),
      size
    );
  }

  const { title, description } = buildSharedMapOgText(map);
  const tags = map.tags.slice(0, 3);
  const sourceLabel =
    map.channelName?.trim() ||
    (map.sourceType === "youtube"
      ? "YouTube"
      : map.sourceType === "manual"
      ? "Manual"
      : "Shared Map");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at top left, rgba(56,189,248,0.28), transparent 34%), linear-gradient(135deg, #eff6ff 0%, #dbeafe 34%, #ecfeff 100%)",
          color: "#0f172a",
          padding: 54,
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -80,
            top: -120,
            width: 420,
            height: 420,
            borderRadius: 9999,
            background: "rgba(37, 99, 235, 0.16)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 90,
            bottom: -140,
            width: 320,
            height: 320,
            borderRadius: 9999,
            background: "rgba(34, 197, 94, 0.14)",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 28,
              fontWeight: 700,
              color: "#1d4ed8",
            }}
          >
            <div
              style={{
                display: "flex",
                width: 18,
                height: 18,
                borderRadius: 9999,
                background: "#1d4ed8",
              }}
            />
            Brify
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderRadius: 9999,
              padding: "10px 18px",
              fontSize: 24,
              color: "#0f172a",
              background: "rgba(255,255,255,0.72)",
            }}
          >
            {sourceLabel}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            maxWidth: 940,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 60,
              lineHeight: 1.15,
              fontWeight: 800,
              letterSpacing: "-0.03em",
            }}
          >
            {clampText(title, 72)}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              lineHeight: 1.45,
              color: "#334155",
            }}
          >
            {clampText(description, 150)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            {tags.length > 0
              ? tags.map((tag) => (
                  <div
                    key={tag}
                    style={{
                      display: "flex",
                      borderRadius: 9999,
                      padding: "12px 18px",
                      background: "rgba(15, 23, 42, 0.06)",
                      color: "#0f172a",
                      fontSize: 24,
                      fontWeight: 600,
                    }}
                  >
                    #{clampText(tag, 24)}
                  </div>
                ))
              : null}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "#475569",
            }}
          >
            brify.ai
          </div>
        </div>
      </div>
    ),
    size
  );
}
