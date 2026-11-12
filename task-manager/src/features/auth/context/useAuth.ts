import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "./AuthContext";
//esse arquivo vai ser um custom hook para autenticação (custom hooks que são funções para auxiliar no react
//devem começar com use antes do seu nome, como useAuth)

//esse hook deve retornar uma estrutua igual a authContext definida no esquema anterior
// export interface AuthContextValue {
//   state: AuthState;
//   login: (input: LoginInput) => Promise<void>;
//   register: (input: RegisterInput) => Promise<void>;
//   logout: () => Promise<void>;
// }

export function useAuth(): AuthContextValue {
  //como explicado no arquivo de authcontext o createContext precisa de um receptor que é onde ele vai
  //disponibilizar o código dele, então precisa usar o useContext para receber esses dados, porém o valor
  //que authContext vai receber não está nem nesse arquivo nem no arquivo AuthContext, ele vai estar no
  //Provider que vai estar no arquivo base desse código, provavelmente em um arquivo chamado authprovider ou no app
  //esse valor vai receber algo como Provider={valor recebido}
  const value = useContext(AuthContext);
  //se o valor for undefined, ou seja, não seguir o padrão de authContextValue estabelecido no código de authContexts
  if (!value)
    //cria um novo erro passando uma mensagem
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return value;
}
