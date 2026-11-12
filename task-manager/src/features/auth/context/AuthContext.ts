import { createContext } from "react";
import type { AuthUser, LoginInput, RegisterInput } from "../types";

// União discriminada: o campo `status` define quais outros campos existem.
// o símbolo | significa unionTypes, pode ser qualquer um desses tipos, o tipo vai ser um objeto com status e
// valor, se o status for authenticated deve passar user também, nenhum dado diferente vai ser aceito
//porque união descriminada porque se status for autenthicated então o ts vai enter que tem um usuário, agora
//caso o status seja anonymous então o ts não consegue tirar um usuário desse status
export type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: AuthUser };

//vai criar uma interface que recebe state com o tipo authState, login e register recebem uma função que
//tem o input e logou é apenas uma função vazia
export interface AuthContextValue {
  state: AuthState;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

// `undefined` como valor inicial: só existe valor real dentro do Provider.
// o que é createContext, é um método nativo do react que vai compartilhar um contexto com diferentes
// arquivos, mas como isso acontece? e por quê?

//como no react conectamos muitos arquivos, para não ter que passar várias props que não vão ser usadas
//nesse arquivo criado o prop drilling, tem o context que pode ser associado a uma estação de rádio, que vai
//colocar aquela propriedade diretamente no código que precisa dela, mas como isso é feito? usando
//o provider antes, que vai ser como a antena de rádio, vai passar por ele para que depois no código de destino
//possa ser usado o useContext que vai ser o receptor dos dados
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
