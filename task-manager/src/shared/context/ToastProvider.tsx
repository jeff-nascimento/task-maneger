//usa os mesmos hooks e tipo do authprovider
//usecallback guarda uma função até que ela mude
//useMemo guarda valores até que um deles mude
//useRef não tem no authprovider então vou explicar abaixo:
//useRef é como um cofre, ele é muito parecido com o useState, ele vai guardar uma variável, porém o useState
//avisa para todo mundo que essa variável atualizou, já o useref não, ele guarda um valor, se esse valor mudar
//vai mudar apenas nele em sigilo, ele não vai disparar nenhum re-renderização
//useState para guardar um estado que vai mudando
//reactNode é um typo que o react consegue mostrar na tela, como string, <div> ou outro componente
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
//vai importar o context e todos os tipos do arquivo
import {
  ToastContext,
  type ToastContextValue,
  type ToastKind,
} from "./ToastContext";

//vai criar uma interface local que vai juntar o tipo de message e o king vai ser do tipo toastkind, mas porque
//elas possuem responsabilidades diferentes?

// ToastKind define quais categorias de notificação são permitidas.

// ToastData define os dados da notificação que será exibida.

// ToastContextValue define o que será disponibilizado pelo contexto, neste caso, a função notify.
interface ToastData {
  message: string;
  kind: ToastKind;
}

//toastprovider vai receber um children que vai ser qualquer tag que for colocada dentro dele, essa tag vai
//saber de todos os dados do provider, é do tipo reactNode para que possa aceitar qualquer tipo do react
export function ToastProvider({ children }: { children: ReactNode }) {
  //cria um toast(torrada) hora da curiosidade, porque foi usado a palavra torrada para essa notificação?
  //nos anos 2000 os devs do android perceberam uma analogia com esse tipo de notificação, a torrada é feita
  //colocando o pão e depois de instantes ele salta da torradeira, da mesma forma são essas notificações, saltam
  //da tela, igual torradas, então o nome para esse tipo de notificação ficou conhecido assim

  //cria um estado para a mensagem, esse estado tem os tipos específicos na interface ou null, começa com null
  //ou seja, notificação não está ativa
  const [toast, setToast] = useState<ToastData | null>(null);

  //vai salvar o timer poreque abaixo vai user um setTimeout que retorna um número com id, e como nosso useRef
  //começa com undefined teria uma mudança, então a aplicação olharia para ele como: olha a variável mudou, vamos
  //renderizar a tela agora, isso geraria uma renderização completamente inútil porque é uma mudança já esperada
  //e que não vai ter sentido nenhum mostrar para o usuário, por isso foi usado useRef, porque ele vai mudar mas
  //em silêncio, não vai renderizar nada na tela com essa mudança de undefined para um valor

  //timer pode receber um número ou undefined (já começa com undefined para sinalizar que o relógio do timeout
  //está desligado)
  const timer = useRef<number | undefined>(undefined);

  // useCallback: `notify` mantém a MESMA referência entre renders (importa na Fase 11).
  //lembrando que precisamos de uma função notify na nossa interface de context, por isso foi criada uma função
  //com esse nome aqui, ela usa o hookCallback para guardar a função, ela deve receber uma message e o kind
  //kind já começa como success nessa nossa função
  const notify = useCallback((message: string, kind: ToastKind = "success") => {
    //o que esse window.cleartimeout faz? ele cancela um temporalizador anterior, imagine que o user receba
    //uma mensagem, e após 2 segundos receba outra, porém a anterior ainda está ativa, isso geraria um bug
    //por isso devemos encerrar a anterior antes de mandar a nova
    //mas o que é window? é a janela do navegador ineira, isso especifica onde quer tirar o tempo, daria para
    //deixar só o clearTimeout porém o ts pode se confundir achando que esse timeout é de uma api e entregar
    //um código complexo, então especificando assim ele entende que estamos falando da janela de navegação para
    //o fronend
    window.clearTimeout(timer.current);
    setToast({ message, kind });
    timer.current = window.setTimeout(() => setToast(null), 4000);
  }, []);

  //useMemo vai guardar o valor da mensagem para evitar renderização a mais,toastContextValue tipa o valor de
  //notify para evitar que todos que usem o provider renderizassem novamente
  const value = useMemo<ToastContextValue>(() => ({ notify }), [notify]);

  return (
    //value de provider vai ser o valor de notify que vai ser injetado dinâmicamente em algum lugar do código
    //children é qualquer filho adicionado entre o toastprovider
    <ToastContext.Provider value={value}>
      {children}
      {
        //primeira parte, toast && se toast existir executa o código da direita, se não existir não executa nada
        toast && (
          //o que é role="status"?
          //quando um usuário não enxerga ele usa um programa para ler todas as informações da tela, fazendo
          //assim que ele saiba o que está na tela, porém como a nossa mensagem aparece do nada, pode ser
          //que esse leitor esteja em outro lugar da tela então não vai saber que apareceu uma mensagem como
          //'usuário logado com sucesso', então role é uma definição que o navegador da para esses leitores
          //para avisar que algo aconteceu, podem term muitas possibilidades

          //role="status" usada para avisos informativos, o leito da tela lê a mensagem assim que possível, mas
          //entende que não vai atrapalhar a navegação da página

          //role="alert" usada para mensagens de erros mais importantes (como: cartão recusado!), o leitor vai
          //parar tudo que está lendo e ir direto a essa mensagem

          //role="dialog" o leito entende que é uma janela modal(aquela janela que fica na tela e bloqueia todo o
          //fundo) então ele só vai conseguir ler o resto da página depois que essa janela fechar

          //role="progressbar" usada para tela de carregamento, vai ser lido pelo leitor a % do carregamento

          //dois classnames, um com nome toast que deve ser usado para design geral e outro dinâmico, um para
          //toast.king que pode ser success ou error, então ficaria toast-success (é uma classname existente)
          //ou toast-error(também é uma classname existente)
          <div role="status" className={`toast toast-${toast.kind}`}>
            {
              //dentro tem a mensagem que vai ser enviada
              toast.message
            }
          </div>
        )
      }
    </ToastContext.Provider>
  );
}
