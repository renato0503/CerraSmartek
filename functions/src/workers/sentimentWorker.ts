import { Client } from "@googlemaps/google-maps-services-js";

const googleMapsClient = new Client({});

interface Concorrente {
  place_id: string;
  nome: string;
  endereco: string;
  rating: number;
  total_ratings: number;
}

export async function sentimentWorker(concorrentes: Concorrente[]) {
  const reviewsData: { nome: string; rating: number; reviews: { texto: string; rating: number }[] }[] = [];

  const topConcorrentes = concorrentes.slice(0, 5);

  for (const concorrente of topConcorrentes) {
    try {
      const details = await googleMapsClient.placeDetails({
        params: {
          place_id: concorrente.place_id,
          fields: ["reviews", "name"],
          key: process.env.GOOGLE_PLACES_API_KEY || "",
        },
      });

      reviewsData.push({
        nome: details.data.result.name || concorrente.nome,
        rating: concorrente.rating,
        reviews:
          details.data.result.reviews?.map((r) => ({
            texto: r.text,
            rating: r.rating,
          })) || [],
      });
    } catch {
      reviewsData.push({
        nome: concorrente.nome,
        rating: concorrente.rating,
        reviews: [],
      });
    }
  }

  const allReviews = reviewsData.flatMap((r) => r.reviews);

  const ratingMedio =
    concorrentes.length > 0
      ? concorrentes.reduce((acc, c) => acc + (c.rating || 0), 0) /
        concorrentes.length
      : 0;

  const reclamacoes = extractKeywords(allReviews, "negative");
  const elogios = extractKeywords(allReviews, "positive");

  const palavras = allReviews
    .flatMap((r) => r.texto.toLowerCase().split(/\s+/))
    .filter((w) => w.length > 3 && !stopWords.has(w));

  const wordFreq = new Map<string, number>();
  palavras.forEach((w) => wordFreq.set(w, (wordFreq.get(w) || 0) + 1));

  const nuvemPalavras = [...wordFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word]) => word);

  return {
    total_concorrentes_analisados: reviewsData.length,
    rating_medio_regiao: ratingMedio,
    principais_reclamacoes: reclamacoes.slice(0, 5),
    principais_elogios: elogios.slice(0, 5),
    nuvem_palavras: nuvemPalavras,
    total_reviews: allReviews.length,
  };
}

function extractKeywords(
  reviews: { texto: string; rating: number }[],
  type: "negative" | "positive"
): string[] {
  const filtered =
    type === "negative"
      ? reviews.filter((r) => r.rating <= 2)
      : reviews.filter((r) => r.rating >= 4);

  const keywords = new Set<string>();

  filtered.forEach((r) => {
    const text = r.texto.toLowerCase();

    if (type === "negative") {
      negativeKeywords.forEach((kw) => {
        if (text.includes(kw)) keywords.add(kw);
      });
    } else {
      positiveKeywords.forEach((kw) => {
        if (text.includes(kw)) keywords.add(kw);
      });
    }
  });

  return [...keywords];
}

const stopWords = new Set([
  "com", "que", "para", "uma", "dos", "das", "não", "mais", "muito",
  "foi", "mas", "por", "tem", "bem", "sem", "era", "são", "está",
]);

const negativeKeywords = [
  "demora", "caro", "ruim", "péssimo", "atendimento", "sujo",
  "demorado", "fila", "espera", "mal", "nunca mais", "decepção",
  "horrível", "péssima", "lento", "desorganizado", "frio",
];

const positiveKeywords = [
  "ótimo", "excelente", "bom", "rápido", "atencioso", "limpo",
  "recomendo", "volto", "melhor", "top", "maravilhoso", "incrível",
  "perfeito", "adoro", "saboroso", "qualidade", "preço justo",
];
