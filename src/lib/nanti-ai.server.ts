const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "openai/gpt-5.6-sol";

async function chat(messages: { role: string; content: string }[], json: boolean) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI belum dikonfigurasi.");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      reasoning_effort: "none",
      messages,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (res.status === 429) throw new Error("Terlalu banyak permintaan. Coba lagi sebentar lagi.");
  if (res.status === 402) throw new Error("Kredit AI habis. Tambahkan kredit di workspace Anda.");
  if (!res.ok) throw new Error(`AI error (${res.status})`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

const EXTRACT_SYSTEM = `Kamu adalah NANTI, asisten kerja AI untuk pengguna Indonesia yang bekerja lewat WhatsApp.
Tugasmu: membaca potongan percakapan WhatsApp dan mengekstrak HANYA hal yang benar-benar actionable.

Klasifikasi tipe:
- "task": permintaan pekerjaan ("Tolong cek stok besok")
- "commitment": janji dari pengguna ("Besok saya kirim")
- "deadline": tenggat eksplisit ("Harus selesai Jumat")
- "waiting": pengguna menunggu orang lain ("Saya masih tunggu approval")
- "followup": perlu ditindaklanjuti nanti ("Nanti follow up lagi ya")

JANGAN mengubah setiap kalimat menjadi tugas. Basa-basi, informasi biasa, pertanyaan sederhana, dan pengumuman TIDAK diekstrak.

Balas HANYA JSON valid:
{"summary":"kalimat ringkas Bahasa Indonesia","items":[{"title":"","kind":"task|commitment|deadline|waiting|followup","priority":"high|medium|low","dueOffsetDays":0,"person":"nama atau null","org":"nama perusahaan atau null","source":"nama grup/chat","quote":"kutipan asli","aiNote":"interpretasi singkat Bahasa Indonesia","confidence":0.0}]}
dueOffsetDays: 0 = hari ini, 1 = besok, dst. null jika tidak ada tenggat. Untuk "waiting" gunakan null.`;

export async function extractItems(text: string, sourceHint?: string) {
  const raw = await chat(
    [
      { role: "system", content: EXTRACT_SYSTEM },
      { role: "user", content: `Nama grup/chat (jika tahu): ${sourceHint || "tidak diketahui"}\n\nPercakapan:\n${text}` },
    ],
    true,
  );
  try {
    const parsed = JSON.parse(raw) as { summary?: string; items?: unknown[] };
    return { summary: parsed.summary ?? "", items: Array.isArray(parsed.items) ? parsed.items : [] };
  } catch {
    return { summary: "NANTI tidak dapat membaca percakapan ini.", items: [] };
  }
}

const ASK_SYSTEM = `Kamu adalah NANTI, chief of staff AI berbahasa Indonesia.
Kamu punya memori kerja pengguna (daftar tugas, janji, item menunggu, orang, proyek).
Jawab singkat, tenang, dan konkret. Gunakan Bahasa Indonesia yang natural, bukan robotik.
Sebutkan nama orang dan tenggat bila relevan. Maksimal 180 kata. Gunakan daftar bernomor bila ada beberapa hal.
Jangan mengarang data yang tidak ada dalam konteks.`;

export async function askNanti(question: string, context: string) {
  return chat(
    [
      { role: "system", content: ASK_SYSTEM },
      { role: "user", content: `Memori kerja saat ini:\n${context}\n\nPertanyaan: ${question}` },
    ],
    false,
  );
}
