import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

interface PlacesSearchParams {
  cep: string;
  nicho: string;
  raio: number;
  coordenadas: { lat: number; lng: number };
}

export async function searchPlaces(params: PlacesSearchParams) {
  const searchPlacesFn = httpsCallable<PlacesSearchParams, unknown>(
    functions,
    "searchPlaces"
  );
  const result = await searchPlacesFn(params);
  return result.data;
}

export async function getPlaceDetails(placeId: string) {
  const getPlaceDetailsFn = httpsCallable<{ placeId: string }, unknown>(
    functions,
    "getPlaceDetails"
  );
  const result = await getPlaceDetailsFn({ placeId });
  return result.data;
}
