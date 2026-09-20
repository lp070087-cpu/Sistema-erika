/**
 * A VALIDAÇÃO — os oito testes objetivos, e a classificação honesta.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO FAZ                                               │
 * │                                                                      │
 * │ Ele pega o que foi lido e normalizado, e responde a uma pergunta só:  │
 * │ *dá para trabalhar com isso, ou tem algo errado aqui?*                │
 * │                                                                      │
 * │ A resposta é sempre uma das três, e as três são MUITO diferentes:     │
 * │                                                                      │
 * │   OK              está completo e legível. Segue para as contas.      │
 * │                                                                      │
 * │   ATENÇÃO         falta um dado que o documento não trouxe. Não há     │
 * │                   erro nenhum — a informação simplesmente não estava   │
 * │                   lá. Ela digita e pronto.                            │
 * │                                                                      │
 * │   PRECISA REVISAR tem algo que NÃO FECHA: um número que não é número, │
 * │                   duas leituras possíveis, uma unidade que o sistema   │
 * │                   não conhece, um peso zero. Alguém precisa decidir.   │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ A DIFERENÇA ENTRE ATENÇÃO E REVISAR É A DIFERENÇA ENTRE           │ │
 * │ │ FALTAR E NÃO FECHAR.                                              │ │
 * │ │                                                                  │ │
 * │ │ É a distinção que faz esta tela ser útil em vez de barulhenta.     │ │
 * │ │ Uma ficha sem a gramagem do sal é uma ficha normal — se o sistema  │ │
 * │ │ gritasse "revisar" em cada linha assim, ela aprenderia a ignorar   │ │
 * │ │ o aviso, e o aviso que importa passaria junto.                     │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO NÃO FAZ, DE PROPÓSITO                            │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ "Não inventar julgamento gastronômico."                           │ │
 * │ │ "NÃO criar segunda calculadora."                                  │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ Ele NÃO calcula custo, NÃO estima rendimento, NÃO sugere preço, NÃO    │
 * │ opina se a receita está boa. Nenhuma linha daqui divide um valor por   │
 * │ um peso — a conta existe uma vez só no projeto, e ela está em          │
 * │ `@/lib/dados`, esperando a etapa de cálculo.                           │
 * │                                                                      │
 * │ O que ele faz é OLHAR e DIZER: este campo está vazio, este não é       │
 * │ número, estes dois não se somam. Observação, não julgamento.           │
 * │                                                                      │
 * │ Por isso "custo impossível de calcular" aqui significa CUSTO           │
 * │ IMPOSSÍVEL — "com o que veio neste documento não existe conta capaz de │
 * │ produzir um custo" — e nunca "o custo deu tal valor".                 │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ESTE ARQUIVO É PURO. Não lê arquivo, não conhece PDF, não conhece React.
 * Recebe linhas lidas, devolve linhas classificadas — e é testável com uma
 * lista escrita à mão.
 */

import {
  normalizarDinheiro,
  normalizarNumero,
  normalizarQuantidade,
  emQuilos,
  ehSomavel,
  PESO_MINIMO_KG,
  PESO_MAXIMO_KG,
  type Dinheiro,
  type Leitura,
  type Quantidade,
} from "./normalizar";
import type { CabecalhoExtraido, LinhaExtraida } from "./tipos";

/* ------------------------------------------------------------------------ */
/* O vocabulário do resultado                                                */
/* ------------------------------------------------------------------------ */

/**
 * OS TRÊS NÍVEIS.
 *
 * A ordem é do melhor para o pior, e ela é IMPOSTA pelo array abaixo — porque
 * o nível de um documento é o PIOR nível entre as suas linhas, e "pior" precisa
 * ser comparável. Um documento com uma linha para revisar está para revisar,
 * por mais perfeitas que estejam as outras onze.
 */
export const NIVEIS = ["OK", "ATENCAO", "REVISAR"] as const;
export type Nivel = (typeof NIVEIS)[number];

/** O nome que ela lê. Os níveis são do sistema; estes são da tela. */
export const ROTULO_DO_NIVEL: Record<Nivel, string> = {
  OK: "Confirmado",
  ATENCAO: "Atenção",
  REVISAR: "Precisa revisar",
};

/** O pior dos dois. É o que faz o nível subir e nunca descer. */
export function piorNivel(a: Nivel, b: Nivel): Nivel {
  return NIVEIS.indexOf(a) >= NIVEIS.indexOf(b) ? a : b;
}

/**
 * OS CÓDIGOS DOS AVISOS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE UM CÓDIGO, E NÃO SÓ A FRASE                                   │
 * │                                                                      │
 * │ A frase é para ela ler. O código é para o SISTEMA usar.               │
 * │                                                                      │
 * │ Sem o código, "não dá para calcular o custo desta linha" seria só     │
 * │ texto — e a tela não teria como saber que aquele aviso some quando    │
 * │ ela digitar o peso, nem que ele impede a geração da planilha. Com o   │
 * │ código, cada aviso sabe a que campo pertence e o que o resolve.       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Os oito do briefing estão aqui, com os nomes em português para quem for ler
 * o código daqui a um ano: peso ausente, preço ausente, unidade desconhecida,
 * número inválido, peso zero, custo impossível de calcular, ingrediente sem
 * preço, informação contraditória.
 */
export type CodigoAviso =
  | "PESO_AUSENTE"
  | "PRECO_AUSENTE"
  | "INGREDIENTE_SEM_PRECO"
  | "UNIDADE_DESCONHECIDA"
  | "NUMERO_INVALIDO"
  | "AMBIGUIDADE"
  | "PESO_ZERO"
  | "PESO_IMPLAUSIVEL"
  | "CUSTO_IMPOSSIVEL"
  | "DESCRICAO_AUSENTE"
  | "CONTRADICAO";

/** A qual campo da linha o aviso pertence. É o que a tela usa para apontar. */
export type CampoDoAviso = "descricao" | "quantidade" | "valor" | "linha";

/** Um aviso: o que está errado, o quanto pesa, e o que fazer. */
export type Aviso = {
  codigo: CodigoAviso;
  nivel: Nivel;
  campo: CampoDoAviso;
  /** A frase para ela. Diz o que foi encontrado, não o nome do teste. */
  mensagem: string;
  /** A frase para ela. Diz o que fazer — e sempre há algo a fazer. */
  acao: string;
};

/* ------------------------------------------------------------------------ */
/* A linha conferida                                                         */
/* ------------------------------------------------------------------------ */

/**
 * UMA LINHA LIDA, DEPOIS DE OLHADA.
 *
 * Ela guarda as três coisas que a tela de conferência precisa mostrar lado a
 * lado, e a separação entre elas é o que torna a conferência possível:
 *
 *   · o TEXTO ORIGINAL (`descricao`/`quantidade`/`valor`) — o que o documento
 *     dizia, preservado sem tratamento. É a prova.
 *   · a LEITURA (`leituraQuantidade`/`leituraValor`) — o que o sistema
 *     entendeu, com o estado da leitura. É o que dá para usar.
 *   · os AVISOS — o que não fechou. É o que decidir.
 *
 * Se as três virassem uma só, ela não teria como discordar do sistema: veria
 * um número já convertido, sem saber de que texto ele veio nem por que.
 */
export type LinhaConferida = {
  /** A linha do documento. Serve para ela achar a linha no PDF ao lado. */
  ordem: number;
  /**
   * O TEXTO COMO ELE ESTAVA NO DOCUMENTO — os três campos, sem tratamento.
   *
   * ┌──────────────────────────────────────────────────────────────────┐
   * │ POR QUE O TEXTO CRU PRECISA CHEGAR ATÉ AQUI                      │
   * │                                                                  │
   * │ A doc acima promete três coisas lado a lado: "o TEXTO ORIGINAL", │
   * │ "a LEITURA" e "os AVISOS". A `descricao` sempre esteve aqui. A   │
   * │ quantidade e o valor, não — só a leitura deles.                  │
   * │                                                                  │
   * │ Isso não atrapalhava nada enquanto ninguém precisasse editar. A   │
   * │ tela de conferência precisa: para ela corrigir o campo, a caixa   │
   * │ tem de nascer com o TEXTO DO DOCUMENTO dentro, e não com o número │
   * │ já convertido. A caixa "1.500" é o que ela reconhece e conserta;   │
   * │ a caixa "1500" é o resultado de uma conversão que ela não pediu.   │
   * │                                                                  │
   * │ A alternativa seria a tela guardar o texto por fora, num mapa     │
   * │ paralelo chaveado por linha e campo. Seriam duas verdades sobre   │
   * │ o mesmo dado, e a que ficasse para trás produziria o defeito mais  │
   * │ caro desta tela: ela corrigir, e a correção desaparecer.          │
   * └──────────────────────────────────────────────────────────────────┘
   */
  descricao: string | null;
  quantidade: string | null;
  valor: string | null;
  leituraQuantidade: Leitura<Quantidade>;
  leituraValor: Leitura<Dinheiro>;
  avisos: readonly Aviso[];
  /** O pior aviso da linha. `OK` quando não há nenhum. */
  nivel: Nivel;
  /**
   * A linha foi criada por ela na conferência, e não veio do documento.
   *
   * Ela atravessa o mesmo julgamento das outras — o que muda é o direito de
   * existir vazia. Ver `LinhaExtraida.manual`.
   */
  manual?: boolean;
};

/** O cabeçalho, depois de olhado. Os campos são lidos, não interpretados. */
export type CabecalhoConferido = {
  titulo: string | null;
  categoria: string | null;
  /** O rendimento já normalizado, quando foi possível ler. */
  rendimento: Leitura<number>;
  porcaoGramas: Leitura<number>;
  avisos: readonly Aviso[];
};

/**
 * O TEXTO DO DOCUMENTO, ANTES DE QUALQUER CORREÇÃO — a prova da leitura.
 *
 * Os três campos são os mesmos nomes de `LinhaConferida` de propósito: a tela
 * lê `original[campo]` e `linha[campo]` com o mesmo índice, sem um mapa de
 * tradução entre os dois que pudesse ficar desatualizado.
 */
export type LinhaOriginal = {
  descricao: string | null;
  quantidade: string | null;
  valor: string | null;
};

/** O documento inteiro, pronto para a tela de conferência. */
export type Conferencia = {
  cabecalho: CabecalhoConferido;
  linhas: readonly LinhaConferida[];
  /**
   * O TEXTO COMO O DOCUMENTO DIZIA, POR LINHA — e por que ele anda AO LADO das
   * linhas em vez de dentro delas.
   *
   * ┌──────────────────────────────────────────────────────────────────────┐
   * │ O PROBLEMA QUE ESTE MAPA RESOLVE                                      │
   * │                                                                      │
   * │ `correcoes` é aplicado ao documento ANTES de `conferirDocumento`, e    │
   * │ isso é certo: a validação precisa poder discordar do texto NOVO — um   │
   * │ "1,50" corrigido tem de receber os avisos que "1,50" merece, e não os  │
   * │ de um "1.500" que não existe mais. Ver `aplicarCorrecoes`.            │
   * │                                                                      │
   * │ O efeito colateral é que `linha.valor` deixa de ser o que o PDF dizia  │
   * │ e passa a ser o que ela decidiu que o PDF queria dizer. E a tela de    │
   * │ conferência tem duas colunas que precisam do texto ORIGINAL:          │
   * │                                                                      │
   * │   · DADO NO DOCUMENTO   é a prova, e prometer "o texto como estava no │
   * │                         documento" mostrando a correção dela seria    │
   * │                         exibir a resposta na coluna da pergunta.      │
   * │                                                                      │
   * │   · "APLICAR TAMBÉM NAS OUTRAS QUE DIZIAM ..."  procura, entre as      │
   * │                         linhas, as que ainda carregam o DEFEITO —      │
   * │                         isto é, o texto original. Pelo texto já        │
   * │                         corrigido, a busca acharia zero: ela mesma,    │
   * │                         que já foi corrigida.                          │
   * │                                                                      │
   * │ Guardar o original DENTRO de `LinhaConferida` era a alternativa, e ela │
   * │ seria pior: `descricao` valeria duas coisas no mesmo objeto — a que    │
   * │ vale para contar e a que vale para provar —, e todo `filter` de        │
   * │ validação que lesse `descricao` por engano pegaria uma delas sem       │
   * │ saber qual. Aqui o original não pode ser lido por engano: ele não tem │
   * │ o nome de nenhum campo que a conta use.                              │
   * │                                                                      │
   * │ A chave é a `ordem` da linha. O valor é `null` quando o campo não      │
   * │ existia no documento, e não uma string vazia — `null` é "não havia     │
   * │ campo", e é o que a coluna de prova mostra como "—".                  │
   * └──────────────────────────────────────────────────────────────────────┘
   */
  originais: ReadonlyMap<number, LinhaOriginal>;
  /**
   * A contagem, para a tela poder dizer "12 linhas, 1 para revisar" antes de
   * ela abrir qualquer uma. Um número no topo é o que decide se ela confere
   * linha por linha ou confia.
   */
  resumo: { total: number; ok: number; atencao: number; revisar: number };
  /** O pior nível do documento. É o que habilita ou trava o botão de gerar. */
  nivel: Nivel;
};

/* ------------------------------------------------------------------------ */
/* Os testes                                                                 */
/* ------------------------------------------------------------------------ */

/**
 * A LINHA TEM ALGUM CONTEÚDO?
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É A PRIMEIRA COISA, E NÃO UM DETALHE                     │
 * │                                                                      │
 * │ Um PDF com espaço em branco gera linhas vazias na leitura — o         │
 * │ afastamento entre blocos, o rodapé, a linha em branco entre seções.    │
 * │                                                                      │
 * │ Se elas virassem "linhas para revisar", uma ficha de doze ingredientes │
 * │ apareceria com trinta e uma linhas e dezenove avisos. A contagem       │
 * │ estaria tecnicamente certa e seria inútil: ela passaria mais tempo      │
 * │ descartando lixo que conferindo a ficha.                              │
 * │                                                                      │
 * │ Linha sem nada é DESCARTADA, e não avisada. Ausência de conteúdo não é  │
 * │ um problema com o conteúdo.                                           │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function temConteudo(linha: LinhaExtraida): boolean {
  /*
    A LINHA CRIADA À MÃO PASSA MESMO VAZIA.

    Ver `LinhaExtraida.manual`: ela nasce em branco porque é onde a Érika vai
    digitar. Descartá-la aqui a faria desaparecer no instante em que foi
    criada — antes da primeira letra.
  */
  if (linha.manual === true) return true;

  const t = (campo: { texto: string } | null) => (campo?.texto.trim() ?? "") !== "";
  return t(linha.descricao) || t(linha.quantidade) || t(linha.valor);
}

/** Texto de um campo, já aparado. `null` quando não havia campo ou era vazio. */
function textoDe(campo: { texto: string } | null): string | null {
  const t = campo?.texto.trim() ?? "";
  return t === "" ? null : t;
}

/**
 * OS AVISOS DE UMA LINHA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A REGRA QUE MANTÉM A TELA LEGÍVEL: UMA CAUSA, UM AVISO                │
 * │                                                                      │
 * │ Cada teste abaixo pode disparar em cima do disparo do anterior, e      │
 * │ vários deles quase sempre disparam juntos. Peso ausente também é custo │
 * │ impossível; peso zero também é custo impossível; número inválido        │
 * │ também é custo impossível.                                            │
 * │                                                                      │
 * │ Avisar as quatro coisas ao mesmo tempo numa linha seria tecnicamente    │
 * │ correto e praticamente inútil: quatro frases para um problema só, e a   │
 * │ que ela precisa ler fica perdida entre as outras três que são a mesma   │
 * │ coisa dita de outro jeito.                                            │
 * │                                                                      │
 * │ Por isso os testes são encadeados com `return`: quem dispara primeiro   │
 * │ explica a causa, e os que dependem dela não repetem.                  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function avisosDaLinha(linha: LinhaExtraida): Aviso[] {
  const avisos: Aviso[] = [];
  const descricao = textoDe(linha.descricao);
  const quantidade = textoDe(linha.quantidade);
  const valor = textoDe(linha.valor);

  /*
    ── 1. NÚMERO INVÁLIDO E AMBIGUIDADE ────────────────────────────────────
    Vêm primeiro porque são o único caso em que o sistema não conseguiu
    LER. Enquanto não houver leitura, todo teste seguinte estaria julgando um
    dado que não existe.

    A ambiguidade é separada do inválido porque são problemas opostos: o
    inválido não tem leitura nenhuma, e a ambiguidade tem DUAS. A ação de
    cada uma é diferente — corrigir o texto, contra escolher uma das duas.
  */
  const leituraQuantidade = normalizarQuantidade(quantidade ?? "");
  const leituraValor = normalizarDinheiro(valor ?? "");

  for (const [campo, leitura, texto] of [
    ["quantidade", leituraQuantidade, quantidade],
    ["valor", leituraValor, valor],
  ] as const) {
    if (leitura.estado === "AMBIGUO") {
      avisos.push({
        codigo: "AMBIGUIDADE",
        nivel: "REVISAR",
        campo,
        mensagem: leitura.motivo,
        acao: `Escolha qual dos dois valores está certo para "${texto}".`,
      });
    } else if (leitura.estado === "INVALIDO") {
      /*
        ┌────────────────────────────────────────────────────────────────┐
        │ AQUI MORA A DIFERENÇA ENTRE "PREÇO AUSENTE" E "INGREDIENTE SEM  │
        │ PREÇO" — que o briefing lista como dois problemas separados.     │
        │                                                                │
        │ Preço ausente: o campo não tinha nada. Falta um dado.           │
        │ Ingrediente sem preço: o campo tinha alguma coisa e ela não é    │
        │ número — "a combinar", "ver nota", "sob consulta". O documento   │
        │ FALOU sobre o preço, e o que ele disse não é um preço.          │
        │                                                                │
        │ O primeiro é ATENÇÃO (ela digita). O segundo é REVISAR (alguém   │
        │ precisa descobrir quanto custou).                               │
        └────────────────────────────────────────────────────────────────┘
      */
      const ehPreco = campo === "valor";
      avisos.push({
        codigo: ehPreco ? "INGREDIENTE_SEM_PRECO" : "NUMERO_INVALIDO",
        nivel: "REVISAR",
        campo,
        mensagem: ehPreco
          ? `O preço está escrito como "${texto}", que não é um valor.`
          : leitura.motivo,
        acao: ehPreco
          ? "Descubra o valor real com o fornecedor e digite aqui."
          : "Corrija o número com o valor que está no documento.",
      });
    }
  }

  /*
    ── 2. DESCRIÇÃO AUSENTE ──────────────────────────────────────────────
    Há peso ou dinheiro nesta linha e ela não diz de quê. É o aviso que
    impede o pior resultado possível da importação: um custo certo ligado ao
    ingrediente errado.

    Só dispara quando há mais alguma coisa na linha — uma linha com peso e
    sem nome é um problema; uma linha completamente vazia já foi descartada.
  */
  if (descricao === null) {
    avisos.push({
      codigo: "DESCRICAO_AUSENTE",
      nivel: "REVISAR",
      campo: "descricao",
      mensagem: "Esta linha tem quantidade ou valor, mas não diz de qual ingrediente se trata.",
      acao: "Escreva o nome do ingrediente, ou apague a linha se ela não for um insumo.",
    });
  }

  /*
    ── 3. OS TESTES DE PESO E PREÇO ──────────────────────────────────────
    Só a partir daqui a leitura existe, então faz sentido julgar o valor
    dela.
  */

  // Peso ausente: o documento não trouxe peso nenhum.
  if (quantidade === null) {
    avisos.push({
      codigo: "PESO_AUSENTE",
      nivel: "ATENCAO",
      campo: "quantidade",
      mensagem: "Esta linha não traz a quantidade usada.",
      acao: "Digite a quantidade se ela estiver na ficha, ou deixe em branco para preencher depois.",
    });
  } else if (leituraQuantidade.estado === "OK") {
    const { valor: numero, unidade } = leituraQuantidade.valor;

    /*
      ── PESO ZERO ───────────────────────────────────────────────────────
      Não é o mesmo que peso ausente, e a diferença importa: zero é um valor
      que foi lido e é impossível. Uma linha de zero quilo não entra em soma
      nenhuma e, se tivesse preço, pediria uma divisão por zero.
    */
    if (numero === 0) {
      avisos.push({
        codigo: "PESO_ZERO",
        nivel: "REVISAR",
        campo: "quantidade",
        mensagem: "A quantidade desta linha é zero.",
        acao: "Digite a quantidade real. Zero quilo não entra no custo do prato.",
      });
    } else if (!ehSomavel(unidade)) {
      /*
        ── UNIDADE DESCONHECIDA ────────────────────────────────────────────
        Dois casos chegam aqui, e o texto do aviso é o mesmo porque para ela
        o problema é o mesmo: não dá para somar esta linha com as outras.

          · a unidade não existe no vocabulário ("5 sacos") — a normalização já
            recusou e voltou INVALIDO, então nem entra neste ramo;
          · a unidade existe mas não é de peso nem volume (un, pct, cx, dz) —
            "2 un de limão" é uma quantidade legítima que não vira quilo.

        O segundo é o caso comum e o mais traiçoeiro, porque o dado está
        PERFEITO: o número está certo, a unidade está certa, e ainda assim
        não existe custo por quilo para ele.
      */
      avisos.push({
        codigo: unidade === null ? "UNIDADE_DESCONHECIDA" : "CUSTO_IMPOSSIVEL",
        nivel: unidade === null ? "REVISAR" : "ATENCAO",
        campo: "quantidade",
        mensagem:
          unidade === null
            ? "Esta quantidade não diz em que unidade está."
            : `"${unidade}" não é uma unidade de peso, então não existe custo por quilo para esta linha.`,
        acao:
          unidade === null
            ? "Escreva a unidade (kg, g, L, ml, un) junto do número."
            : "Se der para pesar este item, escreva o peso em kg ou g. Se não, o custo dele entra pelo valor total.",
      });
    } else {
      /*
        ── PESO IMPLAUSÍVEL ────────────────────────────────────────────────
        O teste de sanidade, e ele é o que pega o erro mais provável da
        leitura automática: o separador mal lido, que multiplica por mil.

        Ver a nota em `./normalizar.ts`: a faixa é de plausibilidade, não de
        metodologia. Ela não diz nada sobre a receita — só que um prato não
        leva cinco toneladas de nada.
      */
      const kg = emQuilos(numero, unidade);
      if (kg !== null && (kg < PESO_MINIMO_KG || kg > PESO_MAXIMO_KG)) {
        avisos.push({
          codigo: "PESO_IMPLAUSIVEL",
          nivel: "REVISAR",
          campo: "quantidade",
          mensagem:
            kg > PESO_MAXIMO_KG
              ? `${numero} ${unidade} é ${kg.toLocaleString("pt-BR")} kg nesta linha — muito acima do que uma receita costuma levar.`
              : `${numero} ${unidade} é uma quantidade pequena demais para esta linha.`,
          acao:
            kg > PESO_MAXIMO_KG
              ? "Confira no PDF se o número não foi lido com o separador trocado."
              : "Confira se a unidade está certa — pode ser gramas onde está escrito quilo.",
        });
      }
    }
  }

  /*
    ── 4. PREÇO AUSENTE ──────────────────────────────────────────────────
    Sem preço não há custo. Mas é ATENÇÃO e não REVISAR: a ficha está
    incompleta, e uma ficha incompleta é o estado normal de um documento que
    ainda vai ser trabalhado. Ela digita o preço e a linha fecha.
  */
  if (valor === null) {
    avisos.push({
      codigo: "PRECO_AUSENTE",
      nivel: "ATENCAO",
      campo: "valor",
      mensagem: "Esta linha não traz o preço de compra.",
      acao: "Digite o preço pago para o custo do prato sair certo.",
    });
  }

  return avisos;
}

/* ------------------------------------------------------------------------ */
/* A conferência                                                             */
/* ------------------------------------------------------------------------ */

/**
 * A CONTRADIÇÃO ENTRE LINHAS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE TESTE OLHA TODAS AS LINHAS JUNTAS                       │
 * │                                                                      │
 * │ Os de cima olham uma linha de cada vez. Este não pode: o que ele       │
 * │ procura só existe na relação entre duas delas.                        │
 * │                                                                      │
 * │ O caso é o mesmo ingrediente escrito duas vezes em unidades           │
 * │ diferentes — "Leite 1 L" numa linha e "Leite 0,5 kg" em outra.         │
 * │                                                                      │
 * │ Não dá para dizer qual das duas está errada: ou são o mesmo produto    │
 * │ medido de duas formas (uma leitura está errada), ou são produtos       │
 * │ diferentes com o mesmo nome. As duas explicações são possíveis, e por  │
 * │ isso o sistema não escolhe — ele avisa.                              │
 * │                                                                      │
 * │ E o motivo de avisar é prático: somar as duas linhas como se fossem    │
 * │ quilos daria um total que não corresponde a compra nenhuma.           │
 * │                                                                      │
 * │ A comparação é por NOME EXATO em minúscula. Aproximar nomes ("Leite" e │
 * │ "Leite Integral") seria adivinhação, e adivinhação é o que o briefing  │
 * │ proíbe.                                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function contradicoes(linhas: readonly LinhaConferida[]): Map<number, Aviso> {
  const porNome = new Map<string, LinhaConferida[]>();

  for (const linha of linhas) {
    if (linha.descricao === null) continue;
    const chave = linha.descricao.trim().toLowerCase();
    const jaVistas = porNome.get(chave);
    if (jaVistas) jaVistas.push(linha);
    else porNome.set(chave, [linha]);
  }

  const encontradas = new Map<number, Aviso>();

  for (const [, iguais] of porNome) {
    if (iguais.length < 2) continue;

    // As unidades de cada ocorrência, ignorando as que não foram lidas.
    const unidades = new Set<string>();
    for (const linha of iguais) {
      const lido = linha.leituraQuantidade;
      if (lido.estado === "OK" && lido.valor.unidade !== null) unidades.add(lido.valor.unidade);
    }

    if (unidades.size < 2) continue;

    const lista = [...unidades].join(" e ");
    for (const linha of iguais) {
      encontradas.set(linha.ordem, {
        codigo: "CONTRADICAO",
        nivel: "REVISAR",
        campo: "linha",
        mensagem: `"${linha.descricao}" aparece mais de uma vez, em unidades diferentes (${lista}).`,
        acao: "Confira no PDF: ou é o mesmo ingrediente escrito duas vezes, ou são dois itens com o mesmo nome.",
      });
    }
  }

  return encontradas;
}

/**
 * O CABEÇALHO.
 *
 * Ele não tem os oito testes — não faz sentido perguntar se o rendimento tem
 * preço de compra. Os dois testes que se aplicam são os de número, e são os
 * mesmos usados nas linhas: inválido e ambíguo.
 *
 * O rendimento e a porção ficam em GRAMAS e em PORÇÕES respectivamente, sem
 * conversão entre os dois. Converter "rende 4 porções" em peso exigiria saber
 * quanto pesa a porção, que é uma decisão de método — e o briefing é explícito
 * que método não se inventa.
 */
function conferirCabecalho(cabecalho: CabecalhoExtraido): CabecalhoConferido {
  const avisos: Aviso[] = [];

  const ler = (campo: { texto: string } | null): Leitura<number> => {
    const texto = textoDe(campo);
    return texto === null ? { estado: "VAZIO" } : normalizarNumero(texto);
  };

  const rendimento = ler(cabecalho.rendimento);
  const porcaoGramas = ler(cabecalho.porcaoGramas);

  /*
    O terceiro elemento do par é o CAMPO ORIGINAL, e não o rótulo.

    Ele é usado duas vezes: para montar a mensagem, que precisa citar o texto
    como ele veio do documento, e para a leitura em si. Passar o rótulo no
    lugar do campo compilaria se os dois fossem texto — e citaria a palavra
    "rendimento" como se fosse o que o documento dizia.
  */
  for (const [rotulo, leitura, campo] of [
    ["rendimento", rendimento, cabecalho.rendimento],
    ["porção", porcaoGramas, cabecalho.porcaoGramas],
  ] as const) {
    if (leitura.estado === "AMBIGUO") {
      avisos.push({
        codigo: "AMBIGUIDADE",
        nivel: "REVISAR",
        campo: "linha",
        mensagem: `O ${rotulo} — ${leitura.motivo}`,
        acao: `Escolha o valor certo do ${rotulo} na ficha.`,
      });
    } else if (leitura.estado === "INVALIDO") {
      avisos.push({
        codigo: "NUMERO_INVALIDO",
        nivel: "REVISAR",
        campo: "linha",
        mensagem: `O ${rotulo} foi lido como ${textoDe(campo) === null ? '""' : `"${textoDe(campo)}"`} e não é um número.`,
        acao: `Corrija o ${rotulo} com o valor que está no documento.`,
      });
    }
  }

  return {
    titulo: textoDe(cabecalho.titulo),
    categoria: textoDe(cabecalho.categoria),
    rendimento,
    porcaoGramas,
    avisos,
  };
}

/**
 * A CONFERÊNCIA COMPLETA.
 *
 * É a função que a tela chama. Ela recebe o documento extraído e devolve tudo
 * o que a tela de conferência precisa para existir: as linhas com o texto
 * original, a leitura, os avisos e o nível de cada uma; o cabeçalho; e o
 * resumo com a contagem.
 */
export function conferirDocumento(cabecalho: CabecalhoExtraido, linhas: readonly LinhaExtraida[]): Conferencia {
  /*
    As linhas sem conteúdo saem aqui, antes de qualquer teste. Ver a nota em
    `temConteudo`: é o que impede um PDF espaçado de virar trinta avisos.
  */
  const uteis = linhas.filter(temConteudo);

  const base: LinhaConferida[] = uteis.map((linha) => {
    const avisos = avisosDaLinha(linha);
    const nivel = avisos.reduce<Nivel>((pior, aviso) => piorNivel(pior, aviso.nivel), "OK");

    /*
      ┌────────────────────────────────────────────────────────────────────┐
      │ O TEXTO SAI DAQUI CANONICALIZADO, E O DE CIMA NÃO CONFERIA         │
      │                                                                    │
      │ `avisosDaLinha` lê o campo CRU — " 5 kg " com os espaços que o PDF  │
      │ trouxe. `conferirDocumento` lê o campo APARADO por `textoDe`.       │
      │                                                                    │
      │ Enquanto as duas leituras concordarem, tanto faz. Quando a correção │
      │ entra no meio, não: ela grava o texto JÁ aparado, e um campo que     │
      │ era "  " (espaços) tem o aviso de ausência calculado sobre o cru e   │
      │ o texto guardado como vazio. São duas respostas para a mesma         │
      │ pergunta, e a que divergir faz a linha mostrar "—" com um aviso de   │
      │ que o campo está vazio — ou pior, mostrar um texto com um aviso de   │
      │ ausência ao lado, que ela leria como defeito do sistema.             │
      │                                                                    │
      │ Por isso o que se guarda é o que `textoDe` produz, e é o MESMO       │
      │ valor que o aviso julgou: uma leitura, um texto, uma resposta.       │
      └────────────────────────────────────────────────────────────────────┘
    */
    const cru = (campo: { texto: string } | null): string | null => {
      const t = campo?.texto.trim() ?? "";
      return t === "" ? null : t;
    };

    const descricao = cru(linha.descricao);
    const quantidade = cru(linha.quantidade);
    const valor = cru(linha.valor);

    return {
      ordem: linha.ordem,
      descricao,
      quantidade,
      valor,
      leituraQuantidade: normalizarQuantidade(quantidade ?? ""),
      leituraValor: normalizarDinheiro(valor ?? ""),
      avisos,
      nivel,
      ...(linha.manual === true ? { manual: true } : {}),
    };
  });

  /*
    O ORIGINAL SAI DAS LINHAS DE ENTRADA, e é por isso que ele é montado aqui e
    não a partir de `base`: `linhas` é o documento COMO ELE VEIO, já com as
    correções aplicadas (ver `aplicarCorrecoes`, chamado antes desta função).
    `base` é o que sobrou depois de aparar e descartar, e o que se quer provar
    é justamente o que entrou.

    Aparado pelo mesmo `cru` — o mapa é a prova do que a validação julgou, e
    perde a função inteira se provar um texto com espaços que ninguém viu.
  */
  const originais = new Map<number, LinhaOriginal>();
  for (const linha of uteis) {
    const cru = (campo: { texto: string } | null): string | null => {
      const t = campo?.texto.trim() ?? "";
      return t === "" ? null : t;
    };
    originais.set(linha.ordem, {
      descricao: cru(linha.descricao),
      quantidade: cru(linha.quantidade),
      valor: cru(linha.valor),
    });
  }

  // A contradição entra depois, porque ela precisa das linhas já montadas.
  const porOrdem = contradicoes(base);
  const linhas2: LinhaConferida[] = base.map((linha) => {
    const contradicao = porOrdem.get(linha.ordem);
    if (contradicao === undefined) return linha;
    const avisos = [...linha.avisos, contradicao];
    return {
      ...linha,
      avisos,
      nivel: piorNivel(linha.nivel, contradicao.nivel),
    };
  });

  const cabecalhoConferido = conferirCabecalho(cabecalho);

  /*
    O RESUMO CONTA LINHAS, NÃO AVISOS.

    "12 linhas, 1 para revisar" é o que ela precisa para decidir se confere
    tudo ou se olha só a que está marcada. "12 linhas, 7 avisos" não diz nada
    — sete avisos podem estar todos numa linha.
  */
  const resumo = {
    total: linhas2.length,
    ok: linhas2.filter((l) => l.nivel === "OK").length,
    atencao: linhas2.filter((l) => l.nivel === "ATENCAO").length,
    revisar: linhas2.filter((l) => l.nivel === "REVISAR").length,
  };

  const nivelDoCabecalho = cabecalhoConferido.avisos.reduce<Nivel>(
    (pior, aviso) => piorNivel(pior, aviso.nivel),
    "OK",
  );
  const nivelDasLinhas = linhas2.reduce<Nivel>((pior, l) => piorNivel(pior, l.nivel), "OK");

  return {
    cabecalho: cabecalhoConferido,
    linhas: linhas2,
    originais,
    resumo,
    nivel: piorNivel(nivelDoCabecalho, nivelDasLinhas),
  };
}

/**
 * A LINHA ESTÁ PRONTA PARA VIRAR CUSTO?
 *
 * Ela é a pergunta que a etapa de cálculo faz antes de tentar. Existe aqui, e
 * não lá, porque a resposta já está calculada — o nível da linha é exatamente
 * essa resposta. Duplicar a regra no cálculo criaria a possibilidade de as
 * duas discordarem, e a que discordasse seria a que gera a planilha errada.
 *
 * `ATENCAO` passa: falta um dado, mas ela pode ter digitado. Quem barra é
 * `REVISAR` — o que não fecha.
 */
export function podeCalcular(linha: LinhaConferida): boolean {
  return linha.nivel !== "REVISAR";
}
