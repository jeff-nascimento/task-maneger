//nessa função vamos usar o createContext também, porém em vez de disponibilizar informações sobre o usuário
//vamos disponibilizar informações sobre essas mensagens
import { createContext } from "react";
//esse arquivo vai ser responsável por mostrar pequenas mensagens na tela, por exemplo, sabe quando faz login que
//aparece aquelas mensagens tipo "login realizado com sucesso!"

//aqui o tipo é para apenas dois casos, se a operação ocorreu com sucesso e se ocorreu com erro
export type ToastKind = "success" | "error";

//aqui vamos fazer uma interface que serve para tipar um objeto, ela vai receber alguns valores
//primeiro terá uma função chamada notify, que será responsável por dar a notificação
export interface ToastContextValue {
  //notify pode receber duas coisas:
  //primeiro é a mensagem da notificação
  //segundo é uma propriedade opcional, que vai ser o kind, ele vai ser do tipo toastkind, que só pode ter dois
  //valores success ou error, a função não retorna nada
  notify: (message: string, kind?: ToastKind) => void;
}

//aqui é o context propriamente dito, aqui ele vai estar disponibilizando os dados, depois um provider
//vai passar o valor e um use vai ser o receptor desses dados, pode ter o valor de toascontext ou de undefined
//começa com undefined por padrão
export const ToastContext = createContext<ToastContextValue | undefined>(
  undefined,
);
