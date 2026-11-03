import type { TaskFilter } from "../types/task.types";

//filter vai armazenar os dados de taskfilter que vai ser um array, mas o que vai ser readonly, isso vai indicar
//que os dados não podem ser mudados por essa instancia, ele só vai poder aceitar um array que contém uma
//das 3 opções listadas ao lado,
const FILTERS: readonly TaskFilter[] = ["all", "pending", "completed"];

// Type guard: transforma um valor qualquer (ex.: vindo da URL) em TaskFilter.
// Evita o `as TaskFilter` cego, que mentiria para o compilador.
// Primeiro: o que isTaskFilter faz? ele pega o valor que vem da url algo como: task?filter=pending
// o valor pending que vai ser recebido como value
// mas porque value: unknown? porque eu ainda não sei o tipo de value, é diferente de any que não verifica nada
// unknown não permite fazer nada até saber que tipo vai ser recebido, já any permite porque ele não quer checar nada
// retorna value é taskFilter, ou seja, value é algum dos 3 valores de taskfilter
export function isTaskFilter(value: unknown): value is TaskFilter {
  return (
    //se o tipo do valor for string e (filters as readonly string[] deve passar o mesmo tipo da const filter lá em
    //cima, porque aqui estamos definindo que o value deve ser um valor que está dentro de taskfilter, então
    //o tipo deve ser o mesmo).includes(value) a variável filter que guarda os valores com all, pending, etc
    //verifica se o value do parâemtro é algum desses 3 valores
    typeof value === "string" && (FILTERS as readonly string[]).includes(value)
  );
}

// TaskFilter -> parâmetro `completed` da API
// Porque fazer essa função? porque completed espera um bool, e como taskfilter tem 3 valores então precisa passar
// para true or false, vai receber um filter que já tem os valores de taskfilter e retorna um bool ou undefined
export function filterToCompleted(filter: TaskFilter): boolean | undefined {
  //se filter for completed retorna true
  if (filter === "completed") return true;
  //se filter não for completed, vai retornar as que não foram, ou seja, as pendentes
  if (filter === "pending") return false;
  //se caso não for passado o filtro de completed, então quer dizer que é all, então esse filtertocompleted pode
  //retornar undefined, porque não é com ele
  return undefined; // "all": não envia o parâmetro
}
