import type { ReactNode } from "react";
import type { ApiError } from "../../shared/api/ApiError";

//esse arquivo vai criar três componentes reutilizáveis, um para spinner de carregamento, outro com uma mensagem
//de erro com um botão opcional para tentar novamente e outra quando não existem dados para apresentar

//primeiro um spinner que recebe um label, porém se não for passado começa como carregando, o retorno é um label
//que pode existir ou não, então é string ou undefined
export function Spinner({ label = "Carregando..." }: { label?: string }) {
  return (
    //apenas cria um componente de parágrafo, relembrando o componente role="status" que avisa para o leitor de
    //página que nesse ponto apareceu uma janela para ele ler, porém que não é de urgência
    <p role="status" className="muted">
      {label}
    </p>
  );
}

//cria uma interface que vai receber o erro do tipo apierror, onRetry vai ser usado para o botão de tentar de novo
//essa função pode não existir, então por isso o ? nela
interface ErrorMessageProps {
  error: ApiError;
  onRetry?: () => void;
}

//errormessage recebe o erro ocorrido e se quer tentar de novo
export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    //role="alert" relembrando: esse já corta todo o funcionamento do leitor de telas e direciona ele para a
    //janela de erro que está sendo passada
    <div role="alert" className="error-box">
      <p>
        {
          //mensagem de erro que vai ser passada dinâmicamente
          error.message
        }
      </p>
      {
        //onRetry nesse código vai existir, o que pode causar confusão, repare que no onClick passa o onRetry
        //novamente, porém isso não quer dizer que no código a função que chamar ErrorMessage vai passar o onclick
        //duas vezes lá, essa função aqui não sabe o que ela recebe, apenas executa o código quando a informação
        //chega para ela, então quando no código que chamar ela tiver algo como:
        //     notify({
        //     message: "Erro ao carregar o perfil.",
        //     kind: "error",
        //     // Olha a função de retry sendo criada aqui em cima e entregue ao Toast!
        //     onRetry: () => {
        //       carregarDadosDoPerfil(); aqui seria a função chamando a si mesma para reiniciar o processo
        //     }
        //   });
        onRetry && (
          <button type="button" onClick={onRetry}>
            Tentar novamente
          </button>
        )
      }
    </div>
  );
}

interface EmptyStateProps {
  //representa o componente principal que será representado quando não houver campos para exibir
  //ex: Nenhuma tarefa encontrada
  title: string;
  //children é qualquer componente adicional que os filhos de quem usar emptyState queira usar, por exemplo
  //quando não tem uma tarefa se quiser adicionar um botão com algo como: Adicionar tarefa.
  //ReactNode aceita qualquer tipo que ele possa ler, então assim pode ser qualquer conteúdo válido
  children?: ReactNode; // ex.: um botão de ação
}

//recebe o title e o children
export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="empty">
      <p>{title}</p>
      {children}
    </div>
  );
}
