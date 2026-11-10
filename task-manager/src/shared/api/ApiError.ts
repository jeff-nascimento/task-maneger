export interface ApiErrorDetail {
  //lembra que no erro tem a chave in que é onde aconteceu o erro e pode dar a resposta como uma dessas
  //3 abaixo, body, params e query
  in: string; // "body" | "params" | "query"
  //field é o campo que deu o erro, que fica dentro de uma das 3 opções acima
  field: string;
  //message é a mensagem de erro
  message: string;
}

// Erro padronizado do front: o formato {error:{code,message,details}} da API vira isto.
// status 0 = nunca houve resposta HTTP (rede, resposta inválida).
// ApiError extends erro porque herda propriedades e comportamentos de Error
export class ApiError extends Error {
  //status é um número (ex: 404)
  readonly status: number;
  //code ("NOT_FOUND")
  readonly code: string;
  //details deverá conter todos os campos de ApiError porém não é obrigatório ter um details, mas se existir ele
  //deve conter os campos, como message (ex: Tarefa não encontrada), mas por que
  //um array? porque uma única requisição pode apresentar vários erros, então vai colocar um array contendo
  //esses erros
  readonly details?: ApiErrorDetail[];

  //o constructo vai receber os 4 parâmetros
  constructor(
    status: number,
    code: string,
    message: string,
    details?: ApiErrorDetail[],
  ) {
    //super(message) porque message não vai ser recebida de fora e sim do erro normal que já ia ser exibido
    //então super chama o valor de erro
    super(message);
    //this.name vai definir o nome do erro, por padrão seria Error, porém aqui está definido como ApiError
    this.name = "ApiError";
    //o status, code e details vão ser recebidos dinâmicamente
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Em um catch o erro é `unknown`: este helper garante que sempre teremos um ApiError.
// aqui vai ser para caso o erro não for algum erro previsto no tratamento de ApiError
export function toApiError(err: unknown): ApiError {
  //se o erro não for uma instancia de ApiError, ou seja, o erro já pertence a ApiError, se for já retorna ele
  if (err instanceof ApiError) return err;
  //caso o erro não pertença a ApiError
  return new ApiError(
    //o status vai ser 0, o code vai ser erro desconhecido
    0,
    "UNKNOWN_ERROR",
    //se o erro pertencer ao Error nativo manda a mensagem dele, se caso não for isso coloca uma mensagem genérica
    //porque não era para acontecer esse erro
    err instanceof Error ? err.message : "Erro inesperado",
  );
}
