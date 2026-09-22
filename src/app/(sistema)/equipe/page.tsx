import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { obterRepositorioOperacao } from "@/lib/dados";
import type { Pessoa, Treinamento } from "@/lib/dados";
import { Aviso, Secao } from "@/components/ui/superficie";
import { PainelDaEquipe } from "./painel";

export const metadata: Metadata = { title: "Equipe" };

/**
 * EQUIPE — quem executa na cozinha do cliente.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA TELA RESOLVE, E POR QUE O `ModuloPendente` FOI TIRADO      │
 * │                                                                      │
 * │ O aviso anterior dizia que "o responsável por um preparo é um campo    │
 * │ de texto no processo, e isso pode ser suficiente". A primeira metade   │
 * │ era um fato; a segunda é que estava errada.                            │
 * │                                                                      │
 * │ O campo de texto NÃO é suficiente, e o próprio cenário prova: os       │
 * │ processos do cliente gravam `"Juliana (auxiliar de cozinha)"`,         │
 * │ `"Cozinha"`, `"Equipe de salão + cozinha"` e `"A definir com o         │
 * │ Marcelo"` no MESMO campo. Isso responde "quem é o responsável deste    │
 * │ preparo" e não responde as duas perguntas que a consultoria cobra:     │
 * │                                                                      │
 * │   · quantos preparos cada pessoa executa;                              │
 * │   · quem executa o que não foi treinada a fazer.                       │
 * │                                                                      │
 * │ A segunda é a que justifica o módulo. Ela é a razão de a consultoria   │
 * │ existir, e hoje não há como formulá-la: de um lado há texto livre, do  │
 * │ outro não há nada.                                                     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O CADASTRO COMEÇA VAZIO, E O TEXTO DOS PROCESSOS É LIDO — NÃO TOCADO   │
 * │                                                                      │
 * │ `mock/operacao.ts` não tem lista de pessoas, e nenhuma equipe foi      │
 * │ inventada para preencher este cadastro: pessoas com nome, função e     │
 * │ turno seriam pessoas que ela não cadastrou.                            │
 * │                                                                      │
 * │ O que a tela faz com o que JÁ existe: lê os responsáveis escritos nos  │
 * │ processos do cliente e diz item a item se cada nome corresponde a      │
 * │ alguém do cadastro. É por isso que a tela abre útil mesmo com o        │
 * │ cadastro vazio — a lista de nomes sem cadastro já é resposta.          │
 * │                                                                      │
 * │ Nada é reescrito nos processos: "A definir com o Marcelo" continua     │
 * │ exatamente como ela escreveu. Ver `equipe.ts`, que documenta por que   │
 * │ converter na leitura seria apagar o estágio do trabalho.               │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * NÃO É RH. Não há salário, folha, férias, benefício nem ponto — e não é
 * omissão: é o que impede este módulo de virar leitura obrigatória para
 * tratar de gente.
 */
export default async function PaginaEquipe() {
  const operacao = obterRepositorioOperacao();

  const [clientes, processos, fichas] = await Promise.all([
    operacao.listarClientes(),
    operacao.listarProcessos(),
    operacao.listarFichas(),
  ]);

  /*
    ── ONDE A EQUIPE VAI NASCER ───────────────────────────────────────────
    Hoje as duas listas são vazias e escritas aqui, com o tipo declarado. É o
    mesmo padrão da página de cardápios: a constante VISÍVEL em vez do campo
    omitido, para que ninguém precise adivinhar depois se o repositório não
    tem pessoas ou se a página esqueceu de pedi-las.

    Quando houver `listarPessoas()` e `listarTreinamentos()`, estas duas
    linhas viram chamadas e as constantes somem.
  */
  const pessoas: readonly Pessoa[] = PESSOAS_POR_ENQUANTO;
  const treinamentos: readonly Treinamento[] = TREINAMENTOS_POR_ENQUANTO;

  /*
    OS PRATOS QUE JÁ EXISTEM, para a tela poder oferecê-los ao declarar o que
    uma pessoa executa — em vez de deixá-la digitar um nome de prato que não
    corresponde a nenhuma ficha. É a mesma ligação que o cardápio faz: o nome
    oferecido sai do acervo, e o acervo é o das fichas deste cliente.
  */
  const pratosPorCliente = Object.fromEntries(
    clientes.map((c) => [
      c.id,
      fichas.filter((f) => f.clienteId === c.id).map((f) => f.nome),
    ])
  );

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo="Operação"
        titulo="Equipe"
        descricao="Quem executa na cozinha do cliente: nome, função, turno, o que executa e o que já foi treinada a fazer. Nomes de execução — sem salário, folha, férias ou ponto, que são outro sistema."
      />

      {pessoas.length === 0 ? (
        <Aviso tom="info" titulo="Nenhuma pessoa cadastrada ainda — e a tela já serve">
          O repositório não devolve equipe, e nenhuma foi inventada: pessoa com nome, função e
          turno seria alguém que você não cadastrou. O que já funciona é a leitura dos
          responsáveis escritos nos processos — ela mostra quais nomes da operação ainda não
          correspondem a ninguém do cadastro, e é por onde vale começar.
        </Aviso>
      ) : null}

      <PainelDaEquipe
        doCenario={{ pessoas, treinamentos, clientes, processos, pratosPorCliente }}
      />

      {/*
        ── POR QUE AQUI NÃO HÁ `DecisoesQueFaltam` ────────────────────────
        A primeira versão desta página passava
        `apenas={["treinamento-da-equipe"]}` — um id que NÃO existe em
        `DECISOES_PENDENTES`. O filtro casava com nada, a lista saía vazia, e
        `DecisoesQueFaltam` devolve `null` quando a lista é vazia.

        O efeito era o pior possível: o bloco desaparecia em SILÊNCIO, e uma
        tela que não mostra bloqueio nenhum é indistinguível de uma tela sem
        bloqueio nenhum. Ninguém descobriria que o texto estava escrito ali.

        A correção não é inventar um item naquela lista. `DecisoesQueFaltam`
        existe para decisões de METODOLOGIA — como ela calcula, como ela mede,
        como ela arredonda —, e cada item tem um `trava`: o que fica parado
        enquanto ele não for respondido. Nesta tela não há nada parado. O
        cadastro funciona, a leitura dos processos funciona, e a lista de quem
        executa sem registro de treinamento aparece. Criar um bloqueio para
        justificar o componente seria o sistema declarando uma trava que
        ninguém declarou.

        O que continua aberto é o ENCAMINHAMENTO — o que fazer com a pendência
        depois que ela aparece —, e isso não é regra de cálculo. Então sai em
        prosa, que é onde a distinção fica visível.
      */}
      <Secao
        rotulo="O que esta tela responde, e o que ela não decide"
        titulo="A pendência aparece; o encaminhamento é seu"
        descricao="Nada do que está acima depende de uma decisão de metodologia em aberto — por isso esta página não lista bloqueios."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Já respondido
            </p>
            <ul className="mt-3 space-y-2.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              <li>
                Quais nomes escritos nos processos não correspondem a ninguém do cadastro — o que
                responde &ldquo;quem é esta pessoa?&rdquo; em vez de deixar o texto solto.
              </li>
              <li>
                Quantos preparos cada pessoa declarada executa, que é a conta que o texto livre do
                processo não permite fazer.
              </li>
              <li>
                Quem executa um preparo sem registro de treinamento, com o rótulo dizendo
                exatamente isso: falta o registro, e não a capacidade.
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Fora do sistema
            </p>
            <ul className="mt-3 space-y-2.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              <li>
                Se a falta de registro vira uma ação do plano de ação — o sistema mostra a
                pendência e não a transforma em tarefa.
              </li>
              <li>
                Se ela entra na planilha ou no relatório do cliente. Nenhum dos dois ganhou uma
                linha de treinamento por causa desta tela.
              </li>
              <li>
                Quem cobra o treinamento e em que prazo. Isso é combinado com o cliente, e não há
                campo aqui que o represente.
              </li>
            </ul>
            <p className="mt-4 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
              Nada desta tela é RH. Não há salário, folha, férias, benefício nem ponto — e não é
              omissão: é o que impede este módulo de virar leitura obrigatória para tratar de
              gente. Nome de execução errado é um prato que sai diferente; o outro tipo de dado
              errado não é recuperável no dia seguinte.
            </p>
          </div>
        </div>
      </Secao>
    </div>
  );
}

/**
 * A EQUIPE DO CENÁRIO — hoje nenhuma.
 *
 * O nome diz o que a lista é, para que ninguém a confunda com dado real ao ler
 * o código. É a mesma escolha de `CARDAPIOS_POR_ENQUANTO`, e vale mais aqui do
 * que lá: um nome de pessoa inventado não é um número errado no relatório, é
 * uma pessoa que não existe sendo tratada como se existisse.
 */
const PESSOAS_POR_ENQUANTO: readonly Pessoa[] = [];
const TREINAMENTOS_POR_ENQUANTO: readonly Treinamento[] = [];
