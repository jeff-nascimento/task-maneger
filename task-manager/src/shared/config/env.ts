// Único lugar que lê import.meta.env. O resto do código importa daqui.
const apiUrl: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const env = {
  //esse regex faz
  // barra \ e /
  //+ outro caractere
  //$ final da expressão
  //replace vai trocar o primeiro argumento pelo segundo
  //então onde tem a última barra vai trocar por string vazia

  API_URL: apiUrl.replace(/\/+$/, ""), // remove barras finais
};
