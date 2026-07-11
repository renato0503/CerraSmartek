import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

interface IbgeParams {
  cep: string;
}

export async function getDemographicData(params: IbgeParams) {
  const getIbgeFn = httpsCallable<IbgeParams, unknown>(
    functions,
    "getDemographicData"
  );
  const result = await getIbgeFn(params);
  return result.data;
}
