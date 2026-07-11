import axios from "axios";
import { checkCache, saveCache } from "../utils/cache";

export async function ibgeWorker(params: { cep: string; raio: number }) {
  const cacheKey = `${params.cep}_ibge`;
  const cached = await checkCache(cacheKey);
  if (cached?.demografia) return cached.demografia;

  try {
    const cepLimpo = params.cep.replace(/\D/g, "");
    const viaCepRes = await axios.get(
      `https://viacep.com.br/ws/${cepLimpo}/json/`
    );

    if (viaCepRes.data.erro) {
      return dadosInsuficientes();
    }

    const { ibge: codigoIbge, localidade, uf } = viaCepRes.data;

    if (!codigoIbge) return dadosInsuficientes();

    const censoRes = await axios.get(
      `https://servicodados.ibge.gov.br/api/v1/censos/nomes/ranking?localidade=${codigoIbge}&sexo=T`
    );

    const municipioRes = await axios.get(
      `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${codigoIbge}`
    );

    const demografia = {
      municipio: localidade,
      uf,
      populacao: municipioRes.data?.populacao || null,
      densidade: null,
      renda_media: null,
      faixa_etaria: {},
    };

    await saveCache(cacheKey, { demografia });
    return demografia;
  } catch (error) {
    console.error("Erro no IBGE Worker:", error);
    return dadosInsuficientes();
  }
}

function dadosInsuficientes() {
  return {
    municipio: "",
    uf: "",
    populacao: null,
    densidade: null,
    renda_media: null,
    faixa_etaria: {},
  };
}
