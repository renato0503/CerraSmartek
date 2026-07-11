import { Client } from "@googlemaps/google-maps-services-js";

const googleMapsClient = new Client({});

interface Concorrente {
  place_id: string;
  nome: string;
  endereco: string;
  rating: number;
  total_ratings: number;
  tipos: string[];
  coordenadas: { lat: number; lng: number } | null;
  aberto_agora: boolean | null;
}

interface PlacesWorkerParams {
  coordenadas: { lat: number; lng: number };
  raio: number;
  nicho: string;
}

export async function placesWorker(
  params: PlacesWorkerParams
): Promise<Concorrente[]> {
  const { coordenadas, raio, nicho } = params;

  try {
    const response = await googleMapsClient.placesNearby({
      params: {
        location: coordenadas,
        radius: raio,
        keyword: nicho,
        type: "establishment",
        key: process.env.GOOGLE_PLACES_API_KEY || "",
      },
    });

    const concorrentes: Concorrente[] = response.data.results
      .slice(0, 15)
      .map((place) => ({
        place_id: place.place_id || "",
        nome: place.name,
        endereco: place.vicinity || "",
        rating: place.rating || 0,
        total_ratings: place.user_ratings_total || 0,
        tipos: place.types || [],
        coordenadas: place.geometry?.location
          ? {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            }
          : null,
        aberto_agora: place.opening_hours?.open_now ?? null,
      }));

    return concorrentes;
  } catch (error) {
    console.error("Erro no Places API:", error);
    throw new Error("Falha ao consultar concorrentes");
  }
}
