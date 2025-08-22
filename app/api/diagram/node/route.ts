export async function GET() {
    return new Response(JSON.stringify({ ok: true, route: "summary/[summaryId]/highlight" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }