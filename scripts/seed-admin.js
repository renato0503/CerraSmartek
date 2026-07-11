const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = path.resolve(__dirname, "../prevoya-firebase-adminsdk.json");

if (!require("fs").existsSync(serviceAccount)) {
  console.error("ERRO: Baixe a chave de serviço do Firebase em:");
  console.error("https://console.firebase.google.com/project/prevoya/settings/serviceaccounts/adminsdk");
  console.error("Salve como prevoya-firebase-adminsdk.json na raiz do projeto (NUNCA commite)");
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

async function seed() {
  await db.collection("users").doc("C2VodxGmBTfLfYCtLTsPivgMNXr2").set({
    uid: "C2VodxGmBTfLfYCtLTsPivgMNXr2",
    email: "comercial@cerradofinancas.com.br",
    nome: "Admin Prévoya",
    creditos: 999,
    role: "admin",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log("Admin criado com sucesso!");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
