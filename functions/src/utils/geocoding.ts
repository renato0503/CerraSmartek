export async function geocodeCep(
  cep: string
): Promise<{ lat: number; lng: number; endereco: string }> {
  const cepLimpo = cep.replace(/\D/g, "");
  const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
  const data = await res.json();

  if (data.erro) {
    throw new Error("CEP não encontrado");
  }

  const endereco = `${data.logradouro || ""}, ${data.bairro || ""} - ${data.localidade}/${data.uf}`;
  const enderecoBusca = `${endereco}, Brasil`;

  const geoRes = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoBusca)}&limit=1`
  );
  const geoData = await geoRes.json();

  if (!geoData.length) {
    throw new Error("Coordenadas não encontradas para este CEP");
  }

  return {
    lat: parseFloat(geoData[0].lat),
    lng: parseFloat(geoData[0].lon),
    endereco: endereco.trim(),
  };
}
