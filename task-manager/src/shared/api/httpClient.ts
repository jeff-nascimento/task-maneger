import { env } from "../config/env.ts";
import { isRecord } from "../utils/guards.ts";
import { ApiError, type ApiErrorDetail } from "../api/ApiError.ts";

// ---------------------------------------------------------------------------
// Sessão em memória (decisão D2): o access token NÃO vai para localStorage.
// ---------------------------------------------------------------------------

//accessToken aqui vai guardar o acess token em código, impedindo assim que o acess token persista quando fechar
//a página ou dar refresh, isso não exclui o risco de invasão, mas diminui
let accessToken: string | null = null;
//essa variável vai ser usada para indicar a aplicação que a seção expirou, ela recebe uma função que não retorna
//nada ou não recebe nada
let onSessionExpired: (() => void) | null = null;

//vai receber o novo access token para passar ele para a variável let que está acima
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// O AuthProvider registra aqui o que fazer quando a sessão não puder ser renovada.
// como o front end não sabe de nada que acontece no back, ele não sabe quando a seção vai expirar, então ele
// precisa de uma função para ser chamada quando a seção expirar e ele mostrar ao usuário
// handler também é uma callback function, lembra que o onSessionExpired só pode receber uma callback ou null
// handler é exatamente assm, mas porque ele foi só instanciado e não já executado? porque ele vai precisar
// acionar apenas quando der o erro 401, que é erro de autorização (quando o token expirar), setsessions ainda
// vai receber as instruções, não deve chamar antes de acontecer o erro
export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

//aqui vai tipar os métodos de requisição
interface RequestOptions {
  //método http só pode ser um desses 4
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  //os dados que vão vir do body, são desconhecidos porque pode receber vários tipos de dados dele
  body?: unknown;
  //sinal, esse sinal é para caso queira abortar a requisição
  //O AbortSignal é uma ferramenta nativa do JavaScript/TypeScript moderno usada para cancelar operações que ainda
  //estão em andamento, como uma requisição HTTP (fetch), um evento de escuta, ou até animações.
  //nesse caso ele vai cancelar uma requisição da api
  signal?: AbortSignal;
  //auth determina se a requisição deve utilizar autenticação, se for false está explicado abaixo
  auth?: boolean; // false: não envia Authorization nem tenta refresh (login, refresh, logout)
}

//essa função vai padronizar todas as requisições que o front faz para a Api
function send(
  //vai receber o path como string (caminho ex: /tasks)
  path: string,
  //um objeto contendo requestOptions que tem método como get caso não for passado, body e sign recebem dinâmicamente
  //auth tem true como default também
  { method = "GET", body, signal, auth = true }: RequestOptions,
  //como fazer uma requisição é assíncrona, essa função retorna uma promise contendo a response da requisição, lembra
  //response tem body, status da resposta e o header
): Promise<Response> {
  //primeiro, o que é Headers? são informações que vão acompanhar a requisição, foi criado um novo para informar
  //para a api as informações recebidas, header cria um objeto cotendo chave e valor
  const headers = new Headers();
  //explicação de como funciona o set:
  //set não vai funcionar para qualquer objeto, ele vai funcionar apenas para os formatos de objetos novos do ts que
  //são como caixas especiais que organizam e protegem dados, são esses objetos:

  //Headers (classe especial para cabeçalhos http)
  //Map (é um objeto normal, porém melhorado, aceita qualquer tipo como chave, no objeto a chave é apenas string...)
  //URLSearchParams (serve para mexer em parâmetros da url)

  //.set(chave, valor) adiciona os dados a esses objetos especiais, primeiro ficaria algo assim neles chave:valor
  //.get(chave) pega a chave e o valor do objeto, precisa passar apenas a chave, ai o valor vem junto (pode vir
  //undefined)
  //.has(chave) retorna um bool, verificando a existência da chave, se tiver true se não false
  //.delete(chave) deleta a chave e o valor, ambos precisam passar apenas a chave que quer manipular

  //então vai adicioanr uma chave e valor contendo Content-Type: application/json
  //isso vai indicar que a aplicação está em formato json

  if (body !== undefined) headers.set("Content-Type", "application/json");

  //se o método auth estiver como true e existir um access token
  if (auth && accessToken)
    //adiciona ao headers uma chave chamada Authorization e a chave tem Bearer com o access token junto, assim
    //como é authorization normal
    headers.set("Authorization", `Bearer ${accessToken}`);
  //return da requisição, fetch vai juntar a url base que está em env (http://localhost:300) com o path (ex: /tasks)
  return fetch(`${env.API_URL}${path}`, {
    //retorna o método http que foi usado
    method,
    //as informações do headers (access token e application/json)
    headers,
    //signal caso o usuário queira cancelar a requisição
    signal,
    //o body vai fazer uma última verificação, se for undefined vai retornar undefined mesmo, agora se tiver algo
    //deve passar isso para formato json antes de entregar
    body: body === undefined ? undefined : JSON.stringify(body),
    //vou explicar esse credentials include:
    //no back end o cors foi configurado para aceitar apenas o domínio do front end, não permite outros domínios
    //mas esse configuração não basta para aceitar os cookies do front, o front precisa habilitar enviar essas
    //informações ao back também, então credentials: 'include' vai permitir isso
    credentials: "include", // necessário para o cookie do refresh token (CORS)
  });
}

// ---------------------------------------------------------------------------
// Refresh SINGLE-FLIGHT (decisão D3)
// O refresh token é de uso único. Se duas chamadas saíssem juntas com o mesmo
// cookie, a API trataria a segunda como REUSO e derrubaria a sessão.
// Por isso, enquanto um refresh está em andamento, todos recebem a MESMA Promise.
// ---------------------------------------------------------------------------

//essa variável vai ser usada para guardar o refresh token de cada rotação, pode ser uma string ou null, null é
//quando não tiver nenhuma rotação acontecendo ainda
let refreshing: Promise<string | null> | null = null;

//função que vai fazer a troca do refresh token, pode retornar o refresh token ou null (caso não tenha nenhum ainda)
async function doRefresh(): Promise<string | null> {
  try {
    //chama a função send que vai passar o método de requisição e se precisa ou não de autenticação para fazer isso
    //o que isso significa? que não vai precisar passar o access token porque vai mudar ele
    const res = await send("/auth/refresh", { method: "POST", auth: false });
    //.ok é para ver se ta tudo certo, se na variável res não estiver certo
    if (!res.ok) {
      //limpa o access token que está armazenado no frontend e retorna null, porque a requisição recebeu um token
      //falho, então não queremos
      //prosseguir com ele
      accessToken = null;
      return null;
    }

    //cria uma variável do tipo unknown porque não sabe o tipo que vai receber do res que é a requisição
    //transforma essa requisição em um json para a api entender, por quê? porque ela vai vir assim
    // {
    //   "success": true,
    //   "data": {
    //     "accessToken": "novo-token-aqui"
    //   }
    // }
    const json: unknown = await res.json();

    //token vai fazer duas coisas
    const token =
      //isRecord valida um objeto, json é a requisição do refreshToken que foi passsado para json
      //ele valida se a chave é uma string e o valor deixa como uknown, também não pode ser null
      //isRecord também vai ser chamado para json.data, o que isso faz? json.data é onde fica guardado o
      //accessToken, algo parecido com
      //{
      //  data: {
      //          "accessToken: "22q12hjhasdqi1321kh21"
      //        }
      //}
      //então também deve validar se o accesstoken não é nulo
      //isRecord(json.data) ? json.data.accessToken : undefined essa expressão faz o seguinte
      //se isRecord der certo vai retornar json.data.accessToken, ou seja, o accessToken em si
      //caso não der certo, retorna undefined
      isRecord(json) && isRecord(json.data) ? json.data.accessToken : undefined;
    //se o token for diferente de string (token foi tirado do json.data.accessToken caso haja algum)
    if (typeof token !== "string") {
      //accessToken que é a variável que está guardada lá em cima, vira null
      accessToken = null;
      return null;
    }
    //caso dê tudo certo, o accessToken recebe o novo token do rotation
    accessToken = token;
    //retorna esse token
    return token;
  } catch {
    // Falha de rede: não derruba nada; o cookie continua válido para uma nova tentativa.
    return null;
  }
}

//vou explicar essa função por partes
//ela também retorna uma promisse porque faz requisição para o banco
//operado ??= operador de atribuição com valor nulo, ou seja, se o valor que ele ta avaliando for nulo ele
//faz o código da direita, se caso já tiver um valor ele mantém o mesmo valor que ele já tinha
export function refreshAccessToken(): Promise<string | null> {
  //se refreshing tiver valor null (variável que armazena o refreshToken)
  //doRefresh vai criar um novo refreshToken, agora refreshing não está mais null então ??= não executa novamente
  //e o finally?
  //quando toda a requisição que precisava ser feita com o refreshToken acabar ele faz o refreshing ser null
  //novamente, para que ele possa ser chamado um novo refreshToken quando quiser
  refreshing ??= doRefresh().finally(() => {
    refreshing = null;
  });
  //retorna o resultado de refreshing
  return refreshing;
}

// ---------------------------------------------------------------------------
// Tratamento de erros HTTP
// ---------------------------------------------------------------------------
//essa função vai verificar o campo de erro, primeiro recebe o valor do erro que ainda não sabemos qual é o tipo
//value is ApiErrorDetail tem 3 campos, in, field e message, essa é a primeira verificação que vai ter para ele
//depois um return que verifica:
//isRecord(value) verifica se é um objeto não nulo
//typeof value.in, value.field e value.message são strings
//se falhar em qualquer uma dessas 5 verificações ele vai retornar false
function isErrorDetail(value: unknown): value is ApiErrorDetail {
  return (
    isRecord(value) &&
    typeof value.in === "string" &&
    typeof value.field === "string" &&
    typeof value.message === "string"
  );
}

// Converte uma resposta não-2xx em ApiError, lendo o formato padrão da API.
//essa função vai receber uma res do tipo response que é a resposta padrão de uma requisição http
//e retorna uma promise do tipo ApiError, então essa função vai transformar o res recebido em um erro aceito
//pelo apierror
async function toError(res: Response): Promise<ApiError> {
  //toda resposta http tem um corpo que está em formato json, então primeiro precisa mudar o formato dessa resposta
  //para json, salvando ela em uma variável, primeiro deve tipar
  //cria uma variável chamada json que pode receber um tipo desconhecido, esse tipo começa com null por padrão
  let json: unknown = null;
  try {
    //tenta transformar essa resposta em .json, salvando na variável acima
    json = await res.json();
  } catch {
    // corpo vazio ou não-JSON: cai no erro genérico abaixo
  }

  if (
    //verifica se a variável json é um objeto não null
    isRecord(json) &&
    //pela api quando da erro ela costuma mandar um formato assim:
    //{
    //  "error": {
    //              "code": "unauthorized",
    //              "message": "Erro ao acessar a tarefa"
    //           }
    //}
    //então deve verificar se esse objeto é uma string e não nulo também
    isRecord(json.error) &&
    //depois deve verificar se a propriedade code do error é uma string
    typeof json.error.code === "string" &&
    //e se a propriedade message também é
    typeof json.error.message === "string"
  ) {
    //Array.isArray serve para verificar se a propriedade é um array, retorna um bool
    //se details de error for um array (o que deveria ser)
    const details = Array.isArray(json.error.details)
      ? //vai pegar a propriedade e fazer um filter nela, quer retorna um bool de acordo com o resultado
        //esse filter vai estar ligado no isErrorDetail que verifica se é ApiErrorDetail e se todos os campos são
        //strings, se caso um resultado der false ele não entra em details, porque só acha os que são true
        json.error.details.filter(isErrorDetail)
      : //se caso o resultado não for um array details recebe undefined
        undefined;
    //vai retornar um novo objeto de ApiError contendo o status retirado diretamente de res
    //json.error.code que é um objeto json com o valor do code
    //json.error.message que é um objeto com o valor de message
    //e details que foi verificado acima
    return new ApiError(
      res.status,
      json.error.code,
      json.error.message,
      details,
    );
  }
  //se caso a resposta não tiver um formato de erro esperado cria um erro genérico contendo o status, um code
  //genérico e uma mensagem genérica
  return new ApiError(res.status, "HTTP_ERROR", `Erro HTTP ${res.status}`);
}

// ---------------------------------------------------------------------------
// Execução: envia, renova a sessão em caso de 401 (uma vez) e converte erros.
// ---------------------------------------------------------------------------

async function execute(
  //vai receber tanto o path quanto os options que vão ser usados para o método send
  //path é o caminho da url e o options é o método http
  path: string,
  options: RequestOptions,
  //retorna uma primise com response do http
): Promise<Response> {
  //variável res recebe o tipo de response
  let res: Response;
  try {
    //res agora vai receber o valor de path e de options que são capturados no send
    res = await send(path, options);
    //aqui é para caso o token estiver vencido, como código 401 é para unauthorized (não autorizado) isso é para
    //quem não tem o token ativo && option.auth diferente de false (true) ou seja, o usuário já foi autenticado
    //com um token no authorization
    if (res.status === 401 && options.auth !== false) {
      //ai chama um novo token para ele não precisar fazer login novamente
      const token = await refreshAccessToken();
      //se a chamada para um novo refresh token der certo
      if (token)
        //chama o res de novo só que dessa vez com o token novo que funciona
        res = await send(path, options); // repete UMA vez com o token novo
      //se caso o refreshToken também expirou chama onSessionExpired?.(), o que é o ?.
      //se caso der undefined ou algum erro não vai quebrar o código, onSessionExpired é vazio
      //porque ele não vai saber o que será passado para ele nesse arquivo, repare que a estrutura é a seguinte
      //onSession recebe uma função callback, setSessionExpiredHandler recebe uma função também e passa essa
      //função para dentro do callback de onSession, porém nenhuma delas faz nada nesse arquivo ainda
      else onSessionExpired?.();
    }
  } catch (err) {
    // Cancelamentos (AbortController) não são erros de rede: deixa passar.
    //if o erro recebido for uma instancia de DOMException, mas o que é isso?
    //DOMException é um erro que que acontece na api mas do lado externo, imagine que no seu código peça para o
    //usuário abrir a câmera mas na hora o usuário bloqueia, o navegador deve passar para sua api que isso falhou
    //ai que o domexception entra, ele tem code, name e message

    //lembra do abortController que permite que o usuário cancele uma requisição http? imagine que o usuário
    //faz uma requisição de tarefa mas saia antes dela terminar, ai o navegador pode responder com um erro do
    //domexception que chama AbortError, indicando que deu erro e o usuário não está mais na aba para receber
    //a requisição, se isso acontecer, throw err envia o erro do dom
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    //caso o erro não for um erro do dom cria um novo erro contendo o status, o code e a mensagem
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Não foi possível conectar ao servidor",
    );
  }

  //se não estiver tudo certo com o res salvo acima chama uma nova instancia de toError que pega o formato de
  //response do navegador e transforma em um erro aceito por ApiError passando o res dentro dela
  if (!res.ok) throw await toError(res);
  //retornando o resultado desse res agora em formato json
  return res;
}

// Devolve `unknown` DE PROPÓSITO: quem chama precisa validar antes de usar.
//função que vai executar uma requisição e devolver o resultado em formato json
//usada para requisições que tem corpo
export async function requestJson(
  //recebe o caminho e as opções que foram tratadas os tipos lá em cima
  path: string,
  options: RequestOptions = {},
): Promise<unknown> {
  //cria uma variável para armazenar o res que por sua vez executa o execute que renova a seção passando o path e as
  //opções
  const res = await execute(path, options);
  //depois devolve essa resposta em um formato json desconhecido como já explicado acima
  const json: unknown = await res.json();
  //no final só retorna essa repsosta em json
  return json;
}

// Para respostas 204 (sem corpo).
//já vai ser usada para requisição que não tem corpo, algo como delete que não retorna nada, apenas
//executa
export async function requestVoid(
  path: string,
  options: RequestOptions = {},
): Promise<void> {
  await execute(path, options);
}
