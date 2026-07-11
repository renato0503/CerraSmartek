import { Client } from "@googlemaps/google-maps-services-js";

const googleMapsClient = new Client({});

interface Supplier {
  place_id: string;
  nome: string;
  endereco: string;
  rating: number;
  tipos: string[];
  coordenadas: { lat: number; lng: number } | null;
}

const SUPPLIER_KEYWORDS: Record<string, string[]> = {
  hamburgueria: ["açougue", "distribuidora de carnes", "padaria industrial"],
  pizzaria: ["distribuidora de alimentos", "atacado", "embalagens"],
  cafeteria: ["torrefação de café", "distribuidora", "padaria"],
  barbearia: ["distribuidora de cosméticos", "produtos de beleza", "wholesale"],
  "pet shop": ["distribuidora pet", "agropecuária", "atacado ração"],
  academia: ["equipamentos fitness", "suplementos", "distribuidora"],
  farmacia: ["distribuidora farmacêutica", "atacado medicamentos"],
  mercado: ["atacarejo", "distribuidora alimentos", "hortifruti"],
  padaria: ["moinho", "distribuidora farinha", "confeitaria atacado"],
  restaurante: ["distribuidora alimentos", "atacado bebidas", "açougue"],
};

export async function supplierWorker(params: {
  coordenadas: { lat: number; lng: number };
  raio: number;
  nicho: string;
}): Promise<Supplier[]> {
  const { coordenadas, raio, nicho } = params;
  const keywords = SUPPLIER_KEYWORDS[nicho.toLowerCase()] || [
    "distribuidora", "atacado", "fornecedor",
  ];

  const allResults: Supplier[] = [];

  for (const keyword of keywords.slice(0, 3)) {
    try {
      const response = await googleMapsClient.placesNearby({
        params: {
          location: coordenadas,
          radius: Math.min(raio * 2, 5000),
          keyword,
          type: "store",
          key: process.env.GOOGLE_PLACES_API_KEY || "",
        },
      });

      response.data.results.slice(0, 5).forEach((place) => {
        if (!allResults.find((s) => s.place_id === place.place_id)) {
          allResults.push({
            place_id: place.place_id || "",
            nome: place.name,
            endereco: place.vicinity || "",
            rating: place.rating || 0,
            tipos: place.types || [],
            coordenadas: place.geometry?.location
              ? { lat: place.geometry.location.lat, lng: place.geometry.location.lng }
              : null,
          });
        }
      });
    } catch (error) {
      console.error(`Erro ao buscar fornecedores "${keyword}":`, error);
    }
  }

  return allResults.slice(0, 15);
}
