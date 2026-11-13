//useContext vai permitir que mais aplicações possam usar os dados de toastcontext
import { useContext } from "react";
//passa os tipos definidos em toastcontext para tipar o retorno
import { ToastContext, type ToastContextValue } from "./ToastContext";

export function useToast(): ToastContextValue {
  //value vai ter o mesmo valor de que foi injetado no provider, porque está usando o useContext que é o hook do
  //react ele tem o mesmo valor para que possa ser feita uma verificação dentro dele
  const value = useContext(ToastContext);
  //se o valor não existir lança um erro na tela, só não vai ter valor se estiver fora do provider
  //por isso a mensagem de erro manda usar no lugar correto
  if (!value)
    throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  //retorna esse valor para que possa ser usado por qualquer componente filho que tente usar ele
  return value;
}
