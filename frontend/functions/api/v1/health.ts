export async function onRequestGet(context: any) {
  return new Response(
    JSON.stringify({
      status: "healthy",
      app: "SI-KPSPAMS KUAJANG",
      engine: "Cloudflare Pages Edge Functions",
      region: "Singapore",
      timestamp: new Date().toISOString(),
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
