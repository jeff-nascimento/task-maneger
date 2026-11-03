// Espelha o que a API devolve em GET /tasks/:id (veja o schema Prisma da API).
export interface Task {
  id: string;
  title: string;
  description: string | null; // a coluna é nullable
  completed: boolean;
  userId: string;
  createdAt: string; // ISO 8601: JSON não tem Date
  updatedAt: string;
}

// POST /tasks: a API ignora campos extras; description é opcional (e não aceita null na criação).
//por que não usa todos os dados de task de uma vez? porque quando cria uma tarefa ela ainda não tem id, createdAt,
//etc, então os dados que precisamos receber do usuário para criar ela é o título que é obrigatório e a descrição
//que é opcional
export interface CreateTaskInput {
  //o que é esse Task["title"]
  //isso vai servir para pegar a propriedade do tipo task que desejar, então o title do create vai ter o mesmo
  //formato do title em task, mas por que não foi usado isso em description? porque description não é obrigatório
  //mas se for passado deve receber uma string, não pode receber um valor null
  title: Task["title"];
  description?: string;
}

// PATCH /tasks/:id: parcial; description aceita null para "limpar".
//vamos destrinchar esse código:
//pick vai pegar uma propriedade do tipo, então ele vai pegar de task o title ou description ou completed
//partial vai transformar todas as propriedades desse tipo em opcionais, então title:string seria title?:string
export type UpdateTaskInput = Partial<
  Pick<Task, "title" | "description" | "completed">
>;

// Filtro da UI (NÃO existe na API: ela só conhece o boolean `completed`).
//taskfilter pode ser all, pending ou completed
export type TaskFilter = "all" | "pending" | "completed";

//tipos para a paginação
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

//lembrado que em paginate data vão ser os dados das tarefas e meta vão ser os dados da página (metadados)
//paginated recebe um tipo genérico, diferença de genérico para any que any vai aceitar qualquer tipo sem nem sequer
//saber qual tipo inferido, o genérico vai receber o tipo no momento da execução e depois disso vai aceitar apenas
//os tipos estabelecidos na execução, se for string e number não vai poder adicionar um bool depois da execução
export interface Paginated<T> {
  //data vai receber o tipo genérico enquanto o meta vai receber os dados de pageMeta
  data: T[];
  meta: PageMeta;
}

// Parâmetros aceitos por GET /tasks nesta aplicação.
//os parâmetros da url algo assim: GET /tasks?page=1&limit=20&completed=false
//todos vão ser opcionais
export interface ListTasksParams {
  page?: number;
  limit?: number;
  completed?: boolean;
}
