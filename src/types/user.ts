export interface UserData {
  uid: string;
  email: string;
  nome: string;
  fotoUrl?: string;
  creditos: number;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}
