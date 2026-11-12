//lembrando que requestjson e requestVoid fazem a requisição ao backend
import { requestJson, requestVoid } from "../../../shared/api/httpClient";
import { ApiError } from "../../../shared/api/ApiError";
import { isRecord } from "../../../shared/utils/guards";
import type { AuthUser, LoginInput, RegisterInput } from "../types";

//esse código é responsável por fazer a integração da api com o frontend na parte de autenticação de login
//e cadastro

//erro genérico criado para uma resposta não previsa, usada para quando os dados passados não tem o formato
//correto ou não tem os campos esperados
const invalidResponse = () =>
  new ApiError(
    0,
    "INVALID_RESPONSE",
    "A resposta do servidor não tem o formato esperado",
  );

// Aceita objetos com campos a mais (ex.: roles, createdAt) e devolve só o que usamos.
//essa função vai validar os dados referente ao usuário passando unknown porque não sabemos os dados que vão ser
//recebidos, retorna o tipo AuthUser
function toAuthUser(value: unknown): AuthUser {
  if (
    //verifica se não é um objeto não null, ou se o tipo é diferente de string, foi usado || porque se qualquer
    //um desses falhar já vai cair no erro
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.email !== "string"
  ) {
    //se der erro nisso coloca o erro personalizado
    throw invalidResponse();
  }
  //caso não cair no if envia todos os dados separados
  return { id: value.id, name: value.name, email: value.email };
}

//função responsável por fazer o login
export async function login(
  //vai receber o campo do imput que vão ser os dados
  input: LoginInput,
  //vai retornar uma promisse contendo dois campos, o usuário e o access token dele que foi gerado
): Promise<{ user: AuthUser; accessToken: string }> {
  // auth: false -> sem Authorization e SEM tentar refresh se der 401 (senha errada é 401!)
  //porque sem autorização? porque auth apenas adiciona o token ao usuário, como o usuário ainda não tem token ele
  //não pode ser adicionado a ele
  const json = await requestJson("/auth/login", {
    //passa o path que é auth/login
    //method é post, body são os dados do input que vai ser pego e auth já foi explicado
    method: "POST",
    body: input,
    auth: false,
  });

  //const data vai fazer a verificação do objeto json se for true ele retorna os dados do usuário que estão assim
  //{
  //    "id": "jej23jwewhef09eu32h",
  //    "name": "jefferson",
  //    "email": "jefferson@email.com",
  //    "createdAt..."
  //}
  const data = isRecord(json) ? json.data : undefined;
  //segunda verificação, se o data não for válido ou o tipo de data.accesstoken for diferente de string retorna um
  //erro
  if (!isRecord(data) || typeof data.accessToken !== "string")
    throw invalidResponse();
  //se tudo der certo retorna os dados de usuário e o accessToken, o accessToken é tirado diretamente do backend
  //ele vai criar ele no momento que chamar a url de login para o usuário autenticado
  return { user: toAuthUser(data.user), accessToken: data.accessToken };
}

//register apenas recebe o input dos campos que o usuário cadastrou e retorna um usuário autenticado
export async function register(input: RegisterInput): Promise<AuthUser> {
  //faz um requestJson com a url de register passando o método e o body necessário para ela, não precisa
  //auth porque vai apenas criar, não precisa de autenticação para um usuário que depois vai ser autenticado no
  //login
  const json = await requestJson("/auth/register", {
    method: "POST",
    body: input,
    auth: false,
  });
  //retorna a autenticação de usuário com is record dentro para certificar que é um objeto não nulo, caso não
  //for retorna undefined
  return toAuthUser(isRecord(json) ? json.data : undefined);
}

//logout apenas vai sair da conta então também não precisa de autenticar, porque vai apenas sair da conta
export async function logout(): Promise<void> {
  await requestVoid("/auth/logout", { method: "POST", auth: false });
}

//users/me vai pegar todos os dados referente ao usuário, então ele vai apenas autenticar esse usuário e verificar
//precisa verificar o usuário usa isRecord
export async function getMe(): Promise<AuthUser> {
  const json = await requestJson("/users/me");
  return toAuthUser(isRecord(json) ? json.data : undefined);
}
