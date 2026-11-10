import { requestJson, requestVoid } from "./httpClient";
import { ApiError } from "../../../shared/api/ApiError.ts";
import { isRecord } from "../../../shared/utils/guards.ts";
import type {
  CreateTaskInput,
  ListTasksParams,
  PageMeta,
  Paginated,
  Task,
  UpdateTaskInput,
} from "../types/task.types";

// Código responsável por fazer a comunicação do frontend com a API

// ---------------------------------------------------------------------------
// Type guards: a fronteira entre "JSON desconhecido" e "tipo confiável".
// (Na Fase 10 trocaremos estes guards por schemas Zod.)
// ---------------------------------------------------------------------------

// A função isTask vai fazer a validação de uma tarefa, verifica se tem as mesmas chaves de Task
export function isTask(value: unknown): value is Task {
  return (
    // isRecord verifica se é um objeto e se não é nulo, value é o dado recebido
    isRecord(value) &&
    // Verifica o tipo de dado de cada propriedade
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    // Como description pode existir ou não, verifica se é null ou string
    (value.description === null || typeof value.description === "string") &&
    typeof value.completed === "boolean" &&
    typeof value.userId === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
  // O && foi usado em todas as linhas porque todas as condições precisam ser verdadeiras para retornar true
}

// Verifica os dados de paginação assim como fez com a tarefa
function isPageMeta(value: unknown): value is PageMeta {
  return (
    // Verifica se é um objeto válido e se os tipos numéricos batem
    isRecord(value) &&
    typeof value.page === "number" &&
    typeof value.limit === "number" &&
    typeof value.total === "number" &&
    typeof value.totalPages === "number"
  );
}

// Essa função vai fazer a junção dos dois para verificar a resposta da API como um todo
// Imagine que a API retorne algo como:
// {
//   "data": [
//     {
//       "id": "1",
//       "title": "Estudar",
//       "description": null,
//       "completed": false,
//       "userId": "10",
//       "createdAt": "2026-11-09",
//       "updatedAt": "2026-11-09"
//     }
//   ],
//   "meta": {
//     "page": 1,
//     "limit": 10,
//     "total": 1,
//     "totalPages": 1
//   }
// }
function isPaginatedTasks(value: unknown): value is Paginated<Task> {
  return (
    // isRecord verifica se é um objeto não nulo
    isRecord(value) &&
    // Array.isArray() verifica se value.data é um array
    Array.isArray(value.data) &&
    // O método .every percorre todos os elementos do array e verifica se todos passam na condição (isTask)
    value.data.every(isTask) &&
    // isPageMeta verifica os tipos dos metadados da paginação
    isPageMeta(value.meta)
  );
}

// Variável de erro caso a resposta seja inválida
const invalidResponse = () =>
  // Cria uma nova instância de ApiError que recebe o código HTTP, o status customizado e a mensagem
  new ApiError(
    0,
    "INVALID_RESPONSE",
    "A resposta do servidor não tem o formato esperado",
  );

// Respostas de item único vêm como { data: ... }
// Isso vai verificar o formato de data recebendo um JSON desconhecido e retornando uma Task
// Quando analisamos várias tarefas, data vem como um array.
// Porém, quando a resposta é para apenas uma tarefa (ex: findById), o formato muda e data
// vem como um objeto único, algo como:
// {
//   "data": {
//     "id": "123",
//     "title": "Estudar TypeScript",
//     "description": null,
//     "completed": false,
//     "userId": "456",
//     "createdAt": "2026-11-09",
//     "updatedAt": "2026-11-09"
//   }
// }
function parseTask(json: unknown): Task {
  // Verifica se o objeto recebido não é nulo; se for, pega a propriedade data, senão retorna undefined
  const data = isRecord(json) ? json.data : undefined;
  // Se os dados de data não baterem com a tipagem de isTask, dispara o erro criado acima
  if (!isTask(data)) throw invalidResponse();
  return data;
}

// ---------------------------------------------------------------------------
// Chamadas à API (não conhecem React)
// ---------------------------------------------------------------------------

// Funções que realmente vão fazer as requisições HTTP para a API
// getTasks vai buscar a listagem de tarefas com paginação/filtros
export async function getTasks(
  // Pega os parâmetros que contêm os dados de paginação e filtros que vão para a URL
  params: ListTasksParams = {},
  // Signal é opcional, usado para abortar/cancelar a requisição HTTP se necessário
  signal?: AbortSignal,
  // Explicação detalhada do retorno (lido de trás para frente):
  // 1. Task: o formato individual de cada tarefa
  // 2. Paginated<Task>: estrutura que engloba o array de tarefas e os dados de paginação (meta)
  // 3. Promise<...>: indica que é uma função assíncrona que vai resolver esses dados no futuro
): Promise<Paginated<Task>> {
  // URLSearchParams é um objeto nativo do JavaScript excelente para gerenciar parâmetros de URL.
  // Ele permite adicionar chaves e valores dinamicamente sem precisar concatenar strings manualmente.
  const query = new URLSearchParams();

  // Se params.page não for undefined, adiciona à query convertendo para string
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.completed !== undefined)
    query.set("completed", String(params.completed)); // "true" | "false"

  // Transforma os parâmetros acumulados no objeto em uma string de query (ex: "page=1&limit=10")
  const qs = query.toString();

  // Realiza a requisição combinando a rota com a query string gerada (se existir)
  const json = await requestJson(`/tasks${qs ? `?${qs}` : ""}`, { signal });

  // Se o retorno não passar na validação de tarefas paginadas, dispara o erro genérico
  if (!isPaginatedTasks(json)) throw invalidResponse();

  // Caso tudo dê certo, retorna os dados validados
  return json;
}

// Pega uma única task por ID usando o parseTask e o signal, retornando uma Task
export async function getTask(id: string, signal?: AbortSignal): Promise<Task> {
  return parseTask(await requestJson(`/tasks/${id}`, { signal }));
}

// Método POST para criar uma nova tarefa, enviando os dados no corpo (body) da requisição
export async function createTask(input: CreateTaskInput): Promise<Task> {
  return parseTask(
    await requestJson("/tasks", { method: "POST", body: input }),
  );
}

// Método PATCH para atualizar uma tarefa. Recebe o ID e os campos alterados (não precisa enviar todos)
export async function updateTask(
  id: string,
  changes: UpdateTaskInput,
): Promise<Task> {
  return parseTask(
    await requestJson(`/tasks/${id}`, { method: "PATCH", body: changes }),
  );
}

// Método DELETE faz a exclusão da tarefa informada pelo ID (retorna void, pois não há corpo na resposta)
export async function deleteTask(id: string): Promise<void> {
  await requestVoid(`/tasks/${id}`, { method: "DELETE" });
}
