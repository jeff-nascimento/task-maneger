import {
  //useCallback vai guardar uma função, toda vez que um componente é atualizado todas as funções dele são
  //recriadas na memória, sem essa função quando atualiza o filho acha que a função mudou e renderiza de novo
  //atoa, com o useCallback é como se disesse para o react, guarde essa função numa caixinha, só recrie essa
  //função se uma variável de dentro dela mudar
  useCallback,
  //useEffect vai executar a ação dentro dele sempre que uma coisa mudar, ele roda na primeira vez depois espera
  //mudar
  useEffect,
  //muito parecido com o useCallback, o useMemo vai guardar um resultado de uma operação pesada, se você tem uma
  //lista gigantesca e precisa filtrar ou ordenar isso essa operação gasta processamento, com o useMemo vai guardar
  //o resultado dessa operação, se a tela atualizar por causa de outra coisa e o resultado ainda for o mesmo ele vai
  //pular o calculo pesado e entregar o resultado evitando processamento
  useMemo,
  //useState vai ser para armazenar e atualizar informações dentro dele
  useState,
  //esse type nativo do react representa qualquer coisa que o react consiga renderizar na tela
  //quando criamos componentes de layout(como o authProvider ou um card) que recebe um children ele vai aceitar
  //qualquer tipo que ele consiga ler, como string, number, bool, <div>, <span> e até outros componentes react
  type ReactNode,
} from "react";
import {
  //tenta renovar o token
  refreshAccessToken,
  //vai receber o novo access token
  setAccessToken,
  //função genérica que vai receber o callback para avisar que a sessão expirou
  setSessionExpiredHandler,
} from "../../../shared/api/httpClient";

//

//então um esquema para entender o context seria
// AuthContext: define o contrato.

// AuthProvider: executa o trabalho.

// useAuth: facilita o acesso ao trabalho.

//

//parte responsável por fazer a requisição para a api de tudo sobre auth
import * as authApi from "../api/authApi";
//tipos para login e register
import type { LoginInput, RegisterInput } from "../types";
import {
  //context criado, nesse arquivo vai ser passado o valor para context que por sua vez vai passar para useAuth
  AuthContext,
  //interface completa de como deve ser qualquer requisição, contando com status e as demais formas de auth
  type AuthContextValue,
  //tipo para o status
  type AuthState,
} from "./AuthContext";

//essa function vai receber um children, recebe um desestructuring, ou seja, tudo que estiver dentro de
//AuthProvider vai ser usado como children, um exemplo prático é assim
//<AuthProvider>
//  <App/>
//<AuthProvider/>
//app está dentro de authprovider então app vai ser o valor de children nesse exemplo

//children recebe o tipo ReactNode que foi comentado acima

export function AuthProvider({ children }: { children: ReactNode }) {
  //lembra que em authState tem 3 possibilidades de estado? loading, authenticated e anonymous? então esse estado
  //vai armazenar qual estado está ativo no momento
  //relembrando como funciona o useState
  //o primeiro argumento vai ser o valor atual do estado, então se esse useState começa com loading state=loading
  //setState vai ser o valor que vai ser adicionado ao useState, então se setState=authenticated o state=authenticated
  //useState<AuthState>({ status: "loading" })
  //useState para acionar o hook
  //<authstate> para tipar esse hook (tipa com um dos 3 valores citados acima)
  //({status: "loading"}) o useState começa com o valor de loading
  const [state, setState] = useState<AuthState>({ status: "loading" });

  // Ao abrir (ou recarregar) o app: tenta restaurar a sessão pelo cookie do refresh token.
  useEffect(() => {
    //cancelled vai servir para avisar se o evento foi cancelado antes de uma requisição async terminar
    let cancelled = false;

    // Se a API não conseguir renovar a sessão no meio do uso, volta para "anonymous".
    // essa função vai ser guardada com o status anonymous, mas para que isso vai servir, imagine que o usuário
    // vai navegar por 2 horas porém o refreshToken expira antes dessas duas horas, ai vai dar erro 401 porque ele
    // não está mais autorizado a permanecer na página, ai vai entrar no arquivo httpclient ele vai fazer uma
    // verificação para saber se deu erro 401, se tiver dado ele vai chamar setSessionExpired, ai como agora
    // ela tem valor anonymous ele vai expulsar o usuário para a tela de login novamente
    setSessionExpiredHandler(() => setState({ status: "anonymous" }));

    //função restore vai ser para tentar restaurar a função do usuário
    async function restore() {
      // No StrictMode (dev) este efeito roda 2x; o refresh é single-flight,
      // então só UMA requisição sai (senão a API detectaria "reuso" e derrubaria a sessão).
      //quando um usuário entra no site o frontend tenta chamar o refreshtoken para dar um novo access token
      //para esse usuário, chamando refreshaccesstoken, que vai ser salvo na variável
      const token = await refreshAccessToken();
      //se não tiver token (porque o usuário nunca logou ou o token perdeu o tempo)
      if (!token) {
        //e se a operação não tiver sido cancelada antes da requisição terminar
        //muda o estado do usuário para anonymous, ou seja, ele não está logado
        if (!cancelled) setState({ status: "anonymous" });
        //retorna para encerrar a seção
        return;
      }
      try {
        //getMe pega todas as informações do usuário, tirando password, vai salvar tudo isso numa variável
        const user = await authApi.getMe();
        //se o usuário não tiver cancelado a requisição no meio do caminho, na tipagem para authenticated tem
        //que vir os dados do usuário junto, pois essse usuário já está autenticado
        if (!cancelled) setState({ status: "authenticated", user });
      } catch {
        //se caso der erro, algo como esse usuário não ter access token ou estar faltando alguma informação passa
        //para anonymous novamente
        if (!cancelled) setState({ status: "anonymous" });
      }
    }
    //o que isso aqui faz? como o useEffect não aceita funções async no seu escopo para contornar isso precisamos
    //criar essa função dentro da função principal dele, só que nesse caso queremos que a função rode assim que
    //iniciar a tela porque devemos verificar os dados antes, então por isso ela foi acionada bem no final do
    //useEffect, mas por que o void? porque por padrão o ts iria rejeitar, dizendo algo como, "a função foi dada
    //como async, então ela deveria retornar uma promise que foi esquecida ali sem tratamento", mas com o void
    //dizemos a ele antes "eu sei que a função é async mas quero que rode mesmo assim"
    void restore();

    //o return do useEffect vai ser sempre executado quando o usuário quebra a excecução, então explicando:
    //se o usuário cancelar a operação no meio o useEffect vai para o return
    //se o usuário deixar a operação terminar o useEffect executa ela toda e pula o retorno enquanto o usuário
    //não desmontar a página, o que é desmontar? se ele reiniciar a página isso desmonta, se ele for para outra...
    return () => {
      //return faz canceled ser true
      cancelled = true;
      //e setSession receber null, por quê? porque ai não tem sentido ficar monitorando um estado do usuário
      //se ele não vai mais receber o dado
      setSessionExpiredHandler(null);
    };
    //os colchetes no final sem nenhum valor dentro diz para o useEffect que ele deve executar essa operação apenas
    //uma vez que é quando a página carregar
  }, []);

  //como explicado acima o useCallback vai guardar o endereço da função sem que ele mude, mas para que isso serve?
  //imagine que é como um cracha, a api roda e entrega um cracha para cada, quando ela atualiza esse cracha muda
  //para todos, só que para quem tem o useCallback esse cracha ainda vai ser o mesmo, mas para que isso vai servir
  //se caso login fosse chamada em algum filho como em um useEffect, useMemo, etc, como o endereço de login mudou
  //então o useEffect vai rodar novamente, e não é isso que queremos
  //ela vai receber um input do tipo loginInput
  const login = useCallback(async (input: LoginInput) => {
    //vai pegar os dados desestruturados do user e o access token pego de login
    const { user, accessToken } = await authApi.login(input);

    //setAccessToken vai trocar o token antigo ou inexistente pelo novo token que recebe depois de logar o user
    setAccessToken(accessToken);
    //setState vai mudar para authenticated agora e salvar os dados de user
    setState({ status: "authenticated", user });
  }, []);

  //vai salvar o register no useCallback novamente para ser usado no useMemo, já foi explicado novamente
  const register = useCallback(
    //vai receber o input dos dados de register
    async (input: RegisterInput) => {
      //chama register da authApi
      await authApi.register(input);
      //assim que o usuário faz login o sistema já faz o login para ele instantaneamente, sem precisar que ele
      //faça o login novamente, os dados para o login vão ser os dados capturados pelo register passados aqui
      await login({ email: input.email, password: input.password });
    },

    //coloca o login dentro do colchetes porque ele é uma dependência, ou seja, ele vai ser tirado de outro lugar
    //então se caso ele mudar esse useCallback também vai mudar
    [login],
  );

  //logout segue a mesma lógica com o useCallback
  const logout = useCallback(async () => {
    try {
      //chama o código de authApi que faz o logout
      await authApi.logout();
      //finally roda obrigatoriamente independente da operação ter dado certo ou errado
    } finally {
      // Mesmo que a chamada falhe, o cliente esquece a sessão localmente.
      //se caso o try falhar no finally vai fazer o token de accessor ser nulo e o status ser anonimo, fazendo
      //com que a aplicação jogue para fora
      setAccessToken(null);
      setState({ status: "anonymous" });
    }
  }, []);

  // useMemo: sem ele, o objeto `value` seria NOVO a cada render do Provider e todos
  // os consumidores re-renderizariam à toa (voltaremos a isso na Fase 11).
  //esse useMemo vai guardar os resultados de todas as funções listadas nele, mas a final de contas
  //porque guardar tudo isso, porque guardar a função e porque guardar seus resultados?
  //porque isso poderia gerar uma re-renderização em cascata de todos os seus filhos, imagine que
  //o usuário faça alguma alteração no input, isso daria um alerta a todos os filhos deles, algo como:
  //olha, a página mudou algo, renderizem tudo novamente para não perder nenhum informação
  //isso deixaria a página lenta, então toda essa precoupação de guardar os dados que não vão mudar
  //é para evitar um efeito em cascata no código
  const value = useMemo<AuthContextValue>(
    //vai guardar um objeto com o valor de todos os dados acima
    () => ({ state, login, register, logout }),
    //todos são uma dependência, então tem que ficar escutando todos
    [state, login, register, logout],
  );

  //ai no return authcontext.provider que vai ser o provedor dos dados
  //o value é o valor de todos as funções acima resguardados pelo useMemo
  //o que vai ser o children? qualquer tag que for adicionada dentro do authcontext
  //imagine que tenha algo assim:
  //   <AuthProvider>
  //       <BrowserRouter>
  //         <Navbar />
  //         <AppRoutes />
  //       </BrowserRouter>
  //   </AuthProvider>
  //navbar vai ser o children que vai conhecer todos os valores que estão em login, register, status e logout
  //mas por quê? se um usuário não estiver logado na navbar pode aparecer um ícone para logar ou cadastrar
  //agora se o usuário já estiver cadastrado esses ícones não irão aparecer, ai já aparecerá o logout
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
