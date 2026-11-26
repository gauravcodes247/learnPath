// Gemini REST calls (no SDK needed: Node 18+ has fetch).
// Everything here has a local fallback so the app still demos
// without an API key or when the free-tier quota runs out.

export const EMBED_DIM = 768;
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const key = () => process.env.GEMINI_API_KEY;
const chatModel = () => process.env.GEMINI_MODEL || "gemini-flash-latest";
const embedModel = () => process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";

export const embeddingProvider = () => (key() ? `gemini:${embedModel()}` : "local-hash");

// ---------- Embeddings ----------

const STOP = new Set(
  "a an the of to in on for and or is are was be with by as at it this that from how what why when which into your you can".split(" "),
);

// Deterministic "hashing trick" embedding: words + bigrams hashed into
// EMBED_DIM buckets, then L2-normalised. Not as smart as a real model,
// but similar text still gets similar vectors.
export function localEmbed(text) {
  const vec = new Array(EMBED_DIM).fill(0);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w));
  const grams = [...words, ...words.slice(1).map((w, i) => `${words[i]}_${w}`)];
  for (const g of grams) {
    let h = 2166136261;
    for (let i = 0; i < g.length; i++) h = Math.imul(h ^ g.charCodeAt(i), 16777619);
    const idx = Math.abs(h) % EMBED_DIM;
    vec[idx] += (h & 1 ? 1 : -1) * (g.includes("_") ? 0.5 : 1);
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export async function embed(text) {
  if (!key()) return localEmbed(text);
  const res = await fetch(`${BASE}/${embedModel()}:embedContent?key=${key()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      outputDimensionality: EMBED_DIM,
    }),
  });
  if (!res.ok) throw new Error(`Gemini embed failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const v = data.embedding.values;
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

// ---------- Text generation ----------

// Returns parsed JSON from Gemini, or null if no key / call failed.
export async function generateJSON(prompt) {
  if (!key()) return null;
  try {
    const res = await fetch(`${BASE}/${chatModel()}:generateContent?key=${key()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    return JSON.parse(text.replace(/^```json\s*|```$/g, "").trim());
  } catch (err) {
    console.warn("Gemini generation failed, using fallback:", err.message.slice(0, 300));
    return null;
  }
}
