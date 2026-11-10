//value is Record<string, unknown> Isso é chamado de Type Predicate (predicado de tipo). Isto é:
//se a função retornar true o valor vai Record<string, unknown>, mas o que é record? e para que serve
//ele vai tipar um objeto, o primeiro valor do record é o tipo da chave e o segundo é o tipo do valor
//então num objeto contendo { maria: 12 } Record<string(para maria), number(para 12)>, então por que vai ser
//unknown? porque no objeto podemos receber vários tipos, então deve colocar um genérico
export function isRecord(value: unknown): value is Record<string, unknown> {
  //return verifica se o tipo do valor é um object (relembrando que record funciona com objetos então o valor
  //deve ser um objeto) e o valor não pode ser nulo
  return typeof value === "object" && value !== null;
}
