/**
 * DA CONFERÊNCIA PARA O DOMÍNIO — e não para uma conta nova.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A REGRA DESTE ARQUIVO, EM UMA FRASE                                  │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ "NÃO criar segunda calculadora."                                  │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ Ele não soma, não divide, não converte unidade e não arredonda. Não    │
 * │ existe uma linha de aritmética neste arquivo. O que ele faz é          │
 * │ TRADUZIR: pega o que a conferência confirmou e monta os objetos que a  │
 * │ matemática já sabe consumir — `Ingrediente`, `Compra`, `ItemFicha` —   │
 * │ e depois CHAMA as funções que já existiam:                            │
 * │                                                                      │
 * │   · `resolverItem`      — resolve preço/unidade e calcula o custo      │
 * │   · `resumoDaFicha`     — soma e conta o que ficou de fora            │
 * │   · `pesarFicha`        — soma os pesos quando são somáveis           │
 * │   · `precoUnitarioDaCompra` — o preço por unidade da compra           │
 * │   · `derivarTransformacao` / `custoPorEtapa` — usados por dentro delas │
 * │                                                                      │
 * │ Se este arquivo calculasse custo por conta própria, existiriam dois    │
 * │ custos do mesmo prato: o da tela de Ficha Técnica e o da planilha      │
 * │ importada. No dia em que divergissem, ninguém saberia qual dos dois    │
 * │ está certo — e o número errado teria a aparência do certo.             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O PERCURSO DE UM NÚMERO, DO PDF ATÉ A CÉLULA                         │
 * │                                                                      │
 * │   PDF ──(leitor)──▶ texto cru                                        │
 * │        ──(normalizar)──▶ valor + unidade, com ambiguidade marcada     │
 * │        ──(validar)──▶ confirmado, com aviso, ou para revisar          │
 * │        ──(ESTE ARQUIVO)──▶ Compra + ItemFicha                        │
 * │        ──(resolverItem e companhia)──▶ custo                          │
 * │        ──(a mesma GradeDaPlanilha)──▶ prévia na tela e arquivo XLSX   │
 * │                                                                      │
 * │ As três últimas etapas já existiam antes deste arquivo. A importação   │
 * │ entra nas três primeiras e desemboca nas mesmas três de sempre. É o    │
 * │ que faz o custo da planilha importada e o custo da ficha digitada à    │
 * │ mão serem o MESMO número, e não dois números parecidos.                │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE A LINHA DO PDF AFIRMA — E O QUE ELA NÃO AFIRMA                 │
 * │                                                                      │
 * │ É a decisão mais delicada da importação, e ela decide o que o sistema  │
 * │ pode concluir. Uma linha lida diz duas coisas:                         │
 * │                                                                      │
 * │   "Farinha de trigo    5 kg    R$ 50,00"                              │
 * │                                                                      │
 * │ AFIRMA: comprou-se 5 kg de farinha, e pagou-se R$ 50,00 por eles.      │
 * │                                                                      │
 * │ NÃO AFIRMA: quanto dessa farinha o prato usa; quanto se perdeu na      │
 * │ limpeza; quanto encolheu no preparo. Essas três são PESAGENS, e a      │
 * │ balança não aparece numa linha de PDF.                                │
 * │                                                                      │
 * │ Por isso o objeto que se monta aqui é uma COMPRA — o tipo que o        │
 * │ sistema tem para "quanto veio, por quanto" — e a transformação nasce   │
 * │ VAZIA. O preço por quilo sai (é divisão do que foi declarado); o       │
 * │ fator de correção NÃO sai, e a coluna fica vazia, como fica vazia na   │
 * │ ficha digitada à mão.                                                  │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ QUANDO OS PESOS EXISTEM, O RESULTADO É O VALIDADO.                │ │
 * │ │                                                                  │ │
 * │ │ Se a linha trouxer os pesos de limpeza e de preparo — porque ela   │ │
 * │ │ os digitou na conferência — eles entram como `Transformacao`, e a  │ │
 * │ │ cadeia que já existe produz exatamente o que            │ │
 * │ │ `npm run conferir:rendimento` confere:                             │ │
 * │ │                                                                  │ │
 * │ │   5 kg por R$ 50,00 ....... preço de compra  R$ 10,00 /kg         │ │
 * │ │   4,5 kg depois de limpar . perda 0,500 kg   10,0%               │ │
 * │ │                             aproveitamento   90,0%               │ │
 * │ │                             fator de correção 1,1111…            │ │
 * │ │   4,0 kg depois de preparar rendimento total 80,0%               │ │
 * │ │                             custo efetivo    R$ 12,50 /kg        │ │
 * │ │                                                                  │ │
 * │ │ Nenhum desses números é calculado aqui. Todos saem de            │ │
 * │ │ `derivarTransformacao`, `custoPorEtapa` e `calcularRendimento` —  │ │
 * │ │ as mesmas funções que a calculadora da tela usa. É por isso que a  │ │
 * │ │ planilha importada não pode discordar da calculadora.              │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { Compra, EstadoCalculoItem, Ingrediente, ItemFicha, PesoInformado, Transformacao } from "@/lib/dados";
import {
  ACAO_DO_ESTADO_ITEM,
  ROTULO_ESTADO_ITEM,
  ROTULO_ETAPA_PESO,
  custoPorEtapa,
  dataCurta,
  derivarTransformacao,
  precoUnitarioDaCompra,
  resolverItem,
  resumoDaFicha,
  pesarFicha,
} from "@/lib/dados";
import type { ItemResolvido } from "@/lib/dados";

import { COLUNAS_ITENS } from "../modelos/ficha-tecnica";
import type { ColunaGrade, FolhaGrade, GradeDaPlanilha, LinhaGrade } from "../grade";
import { campo, endereco, nota, pendencia, secao } from "../grade";

import { podeCalcular, type CabecalhoConferido, type LinhaConferida } from "./validar";
import type { CampoExtraido, LinhaExtraida } from "./tipos";

/* ------------------------------------------------------------------------ */
/* O que a tela manda para cá                                                */
/* ------------------------------------------------------------------------ */

/**
 * AS PESAGENS QUE SÓ A BALANÇA DELA PRODUZ.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ AQUI NÃO CABE CORREÇÃO DE TEXTO — E ISSO É UMA DECISÃO                │
 * │                                                                      │
 * │ A tela de conferência deixa ela corrigir tudo: o nome do insumo, o    │
 * │ peso lido, o preço lido. Seria natural este tipo carregar essas        │
 * │ correções — e seria o erro de arquitetura desta importação.           │
 * │                                                                      │
 * │ Uma correção de TEXTO não é um dado novo: é o texto do documento       │
 * │ digitado certo. Quando ela troca "1.500" por "1,5", o que mudou foi a   │
 * │ LEITURA — e o que precisa acontecer depois é a normalização de novo, e │
 * │ a validação de novo, com o texto certo. Se a correção entrasse aqui    │
 * │ como um número já pronto, ela pularia por cima da normalização e da    │
 * │ validação: um "1,5" corrigido não passaria pelos testes de ambiguidade │
 * │ e de plausibilidade, e a linha que tinha um aviso de "separador         │
 * │ trocado" entraria na soma sem que o aviso fosse reavaliado.            │
 * │                                                                      │
 * │ Por isso a correção de texto volta para `LinhaExtraida` (ver           │
 * │ `aplicarCorrecoes`, abaixo), e `conferirDocumento` roda outra vez.      │
 * │ O que sobra para ESTE tipo é o que não veio de documento nenhum: as    │
 * │ duas pesagens da balança, que ela mede na cozinha e digita aqui porque │
 * │ a ficha as pede.                                                      │
 * │                                                                      │
 * │ Opcionais, e `undefined` significa "não pesou" — que é diferente de    │
 * │ "pesou zero". `null` e `undefined` fazem o mesmo papel aqui, os dois   │
 * │ ausentes.                                                            │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type AjustesDaLinha = {
  /** O peso depois de limpar, quando ela pesou. Ausente = não pesou. */
  pesoLimpo?: PesoInformado | null;
  /** O peso depois de preparar, quando ela pesou. Ausente = não pesou. */
  pesoPreparado?: PesoInformado | null;
};

/**
 * O QUE ELA COMPLETOU NO CABEÇALHO — e são três coisas de naturezas diferentes.
 *
 *   titulo / categoria    CORREÇÃO. O documento podia não ter título; ela
 *                         escreve o nome do prato. Se tinha, este valor
 *                         sobrepõe.
 *   rendimentoPorcoes     COMPLEMENTO. É decisão de método ("esta receita
 *                         rende 12 porções"), e o sistema não a deriva.
 *   porcaoGramas          COMPLEMENTO. Peso da porção, declarado.
 *
 * O rendimento e a porção entram AQUI, e não em `LinhaExtraida`, porque a
 * linha de ingrediente não tem esses campos: são do prato, e recolocá-los na
 * linha obrigaria a repetir o mesmo número em todas elas.
 */
export type AjustesDoCabecalho = {
  titulo?: string | null;
  categoria?: string | null;
  rendimentoPorcoes?: number | null;
  porcaoGramas?: number | null;
};

/** O que a geração precisa receber. */
export type DadosParaGerar = {
  cabecalho: CabecalhoConferido;
  linhas: readonly LinhaConferida[];
  ajustesDoCabecalho?: AjustesDoCabecalho;
  /** Os ajustes por linha, pela `ordem` da linha. */
  ajustesDaLinha?: Readonly<Record<number, AjustesDaLinha>>;
  /** De onde veio este conteúdo — entra no rodapé assinado da folha. */
  origem?: string;
  /** O nome do cliente, quando a planilha foi vinculada a um. */
  cliente?: string | null;
  geradoEm?: Date;
};

/* ------------------------------------------------------------------------ */
/* A CORREÇÃO DE TEXTO — o caminho de volta pela normalização                */
/* ------------------------------------------------------------------------ */

/**
 * UMA CORREÇÃO DE TEXTO, FEITA NA TELA DE CONFERÊNCIA.
 *
 * Ela diz "na linha 7, o campo `valor` deveria ser R$ 1,50 e não R$ 1.500".
 */
export type CorrecaoDeTexto = {
  ordem: number;
  campo: "descricao" | "quantidade" | "valor";
  /**
   * O texto como ELA escreveu. Volta a atravessar a normalização inteira.
   *
   * `string` vazia é instrução, e não ausência de correção: significa "apague
   * este campo". Ver `aplicarCorrecoes`, que a converte em `null`.
   */
  texto: string;
};

/*
  ┌────────────────────────────────────────────────────────────────────────┐
  │ AQUI HAVIA `anterior?: string | null` — E A REMOÇÃO É O PONTO           │
  │                                                                        │
  │ O campo guardava "o texto que o campo tinha antes de ela mexer", para    │
  │ a conferência poder oferecer "corrija também as outras que dizem isto".  │
  │ A leitura automática erra em SÉRIE: um separador mal lido repete o mesmo  │
  │ defeito em todas as linhas que traziam o mesmo número, e corrigir cinco    │
  │ vezes o mesmo texto é o que faz a conferência parecer um formulário        │
  │ interminável.                                                            │
  │                                                                        │
  │ A intenção era certa; o lugar, não. O texto original JÁ EXISTE — é o       │
  │ `LinhaExtraida` que o documento entregou. Guardá-lo também dentro da       │
  │ correção criaria duas cópias da mesma verdade, e duas cópias divergem:     │
  │ bastava ela corrigir duas vezes o mesmo campo para a segunda cópia         │
  │ guardar a PRIMEIRA correção dela, e a oferta de repetir passaria a         │
  │ procurar as linhas que dizem "1,50" — isto é, nenhuma, ou pior, as que     │
  │ ela já tinha conferido.                                                   │
  │                                                                        │
  │ A tela de conferência recebe as linhas ORIGINAIS ao lado da conferência    │
  │ — ver `originais` em `./validar.ts` —, e lê de lá tanto a coluna de prova  │
  │ quanto o texto a procurar. Uma fonte, zero cópias. E a coluna de prova      │
  │ volta a ser o que o nome promete: o que o documento DIZIA, e não o que     │
  │ ela decidiu que ele queria dizer.                                         │
  └────────────────────────────────────────────────────────────────────────┘
*/

/**
 * APLICA AS CORREÇÕES NO DOCUMENTO LIDO — antes de qualquer julgamento.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO ACONTECE NO DOCUMENTO, E NÃO NO RESULTADO                │
 * │                                                                      │
 * │ Porque a validação precisa poder DISCORDAR dela de novo.             │
 * │                                                                      │
 * │ Se a correção fosse aplicada depois — trocando o número já validado —  │
 * │ a linha continuaria carregando os avisos que o texto antigo produziu,  │
 * │ e ela veria "1,50" marcado para revisar por causa de um "1.500" que    │
 * │ não existe mais. Ou, pior, o aviso seria limpo à mão junto com a        │
 * │ correção, e um texto novo que também fosse ambíguo entraria sem aviso.  │
 * │                                                                      │
 * │ Aplicando aqui, o ciclo é o honesto: o texto muda, `conferirDocumento`  │
 * │ roda outra vez, e o nível da linha passa a ser o que o texto NOVO       │
 * │ merece — seja ele qual for.                                           │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function aplicarCorrecoes(
  linhas: readonly LinhaExtraida[],
  correcoes: readonly CorrecaoDeTexto[]
): LinhaExtraida[] {
  if (correcoes.length === 0) return [...linhas];

  const porLinha = new Map<number, Map<CorrecaoDeTexto["campo"], string>>();
  for (const c of correcoes) {
    const daLinha = porLinha.get(c.ordem) ?? new Map();
    daLinha.set(c.campo, c.texto);
    porLinha.set(c.ordem, daLinha);
  }

  return linhas.map((linha) => {
    const daLinha = porLinha.get(linha.ordem);
    if (daLinha === undefined) return linha;

    /*
      Um campo sem texto é um campo APAGADO, e ele vira `null` — não uma
      string vazia. Ver `CampoExtraido`: `null` é "não havia campo", e é o que
      `conferirDocumento` lê como ausência e reporta como falta. Uma string
      vazia seria "o campo existe e está em branco", e as duas produzem o
      mesmo aviso por caminhos diferentes — o que já é motivo para ter só uma.
    */
    const trocar = (campo: CorrecaoDeTexto["campo"], original: CampoExtraido | null): CampoExtraido | null => {
      const texto = daLinha.get(campo);
      if (texto === undefined) return original;
      const limpo = texto.trim();
      return limpo === "" ? null : { texto: limpo, pagina: original?.pagina ?? null };
    };

    return {
      ...linha,
      descricao: trocar("descricao", linha.descricao),
      quantidade: trocar("quantidade", linha.quantidade),
      valor: trocar("valor", linha.valor),
    };
  });
}

/* ------------------------------------------------------------------------ */
/* O insumo e o item — os dois objetos que a matemática consome              */
/* ------------------------------------------------------------------------ */

/**
 * O ID DO INSUMO IMPORTADO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE UM ID DERIVADO DO CONTEÚDO, E NÃO UM ALEATÓRIO                │
 * │                                                                      │
 * │ `ItemFicha.ingredienteId` é uma chave, e o motor a usa para procurar   │
 * │ preço na biblioteca — `indice.porId(...)`. Num item importado essa     │
 * │ procura PRECISA falhar: o insumo do PDF não está na biblioteca do      │
 * │ sistema, e um id que por acaso casasse com um insumo real faria a      │
 * │ planilha importada usar um preço que não é dela, sem avisar ninguém.   │
 * │                                                                      │
 * │ Um id aleatório (`Math.random()`) também evitaria a colisão, e seria    │
 * │ pior por outro motivo: a mesma linha do mesmo PDF geraria um id        │
 * │ diferente a cada geração, e nada seria comparável entre duas           │
 * │ importações do mesmo documento.                                       │
 * │                                                                      │
 * │ O prefixo `imp_` é o que garante que a colisão não acontece: nenhum    │
 * │ id da biblioteca do sistema começa assim, porque as linhas de ficha    │
 * │ escritas à mão usam ids como `in_mandioca`. O sufixo vem do NOME, e    │
 * │ portanto é estável entre gerações.                                    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
/**
 * OS ACENTOS, ESCRITOS DE FORMA VISÍVEL.
 *
 * `̀-ͯ` é a faixa dos acentos que a decomposição NFD separa da
 * letra: "ç" vira "c" + cedilha, "ã" vira "a" + til. Remover a faixa é o que
 * faz "Açaí" virar "acai" em vez de "a_a_" — e sem isso todo nome acentuado
 * do PDF chegaria mutilado no id.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESCAPADO, E NÃO COM OS CARACTERES LITERAIS                   │
 * │                                                                      │
 * │ A primeira versão deste arquivo trazia a faixa escrita com os         │
 * │ caracteres de verdade, colados entre os colchetes. Ela FUNCIONAVA —   │
 * │ os bytes estavam certos — e era impossível de revisar: no editor,     │
 * │ `/[̀-ͯ]/` parece um intervalo entre dois caracteres invisíveis, e não  │
 * │ há como saber se ele cobre os acentos todos ou só dois deles. Quem     │
 * │ for conferir daqui a um ano não tem como saber se está certo sem       │
 * │ contar byte.                                                          │
 * │                                                                      │
 * │ Escrito com escape, a faixa se lê: de U+0300 a U+036F. São os acentos  │
 * │ combinantes, um bloco fechado e documentado do Unicode.               │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const ACENTOS = /[\u0300-\u036f]/g;

export function idDoInsumoImportado(descricao: string, ordem: number): string {
  const limpo = descricao
    .normalize("NFD")
    .replace(ACENTOS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return `imp_${limpo || "item"}_${ordem}`;
}

/**
 * A LINHA VIRA UM INSUMO.
 *
 * O insumo que este sistema conhece tem, além do nome, uma COMPRA (quanto veio,
 * por quanto) e uma TRANSFORMAÇÃO (as pesagens). É exatamente o que a linha do
 * PDF pode afirmar — ver a nota no topo deste arquivo.
 *
 * Nada aqui é calculado: os três campos da compra vêm direto da leitura, e a
 * transformação recebe os pesos quando eles existem.
 */
export function ingredienteDaLinha(
  linha: LinhaConferida,
  ordemFisica: number,
  ajustes?: AjustesDaLinha
): Ingrediente | null {
  const nome = (linha.descricao ?? "").trim();
  if (nome === "") return null;

  const quantidade = linha.leituraQuantidade.estado === "OK" ? linha.leituraQuantidade.valor : null;
  const valor = linha.leituraValor.estado === "OK" ? linha.leituraValor.valor.valor : null;

  /*
    A COMPRA SÓ EXISTE COM OS TRÊS CAMPOS.

    O tipo `Compra` pede quantidade, unidade E valor total — e ele pede os três
    porque `precoUnitarioDaCompra` recusa o que estiver faltando, com um motivo
    próprio para cada falta (`FRASE_DA_RECUSA`). Montar uma compra com `null` no
    lugar da unidade faria a recusa chegar mais tarde e menos específica; não
    montar compra nenhuma é o que faz a ausência aparecer como ausência.
  */
  const unidade = quantidade?.unidade ?? null;
  const compra: Compra | null =
    quantidade !== null && unidade !== null && valor !== null
      ? { quantidade: quantidade.valor, unidade, valorTotal: valor }
      : null;

  /*
    O PESO DE COMPRA COMO PRIMEIRA ETAPA DA TRANSFORMAÇÃO.

    O sistema trata `Transformacao.bruto` como "o peso como veio, antes de
    limpar" — e a quantidade da compra é exatamente isso. Declará-la aqui é o
    que faz `custoPorEtapa` saber dividir o valor pago pelo peso certo, em vez
    de devolver só o preço de compra e parar.

    Sem quantidade lida, a transformação nasce vazia e a planilha mostra o
    traço — que é a resposta honesta para um documento que não trouxe peso.
  */
  const bruto: PesoInformado | null =
    quantidade !== null && unidade !== null && quantidade.valor > 0
      ? { peso: quantidade.valor, unidade }
      : null;

  /*
    ┌────────────────────────────────────────────────────────────────────┐
    │ OS DOIS PESOS QUE VÊM DELA, E NÃO DO DOCUMENTO                     │
    │                                                                    │
    │ `bruto` é o peso de compra, que o documento declarou. `limpo` e     │
    │ `preparado` são pesagens — e nenhuma linha de PDF as traz, porque   │
    │ elas saem da balança, não do papel.                                 │
    │                                                                    │
    │ Elas entram por `ajustes` quando ela as digitou na conferência.     │
    │ Sem elas, a transformação fica só com o peso de compra, e a coluna  │
    │ CORREÇÃO sai vazia — exatamente como sai na ficha digitada à mão    │
    │ de um insumo que ninguém pesou.                                     │
    └────────────────────────────────────────────────────────────────────┘
  */
  const transformacao: Transformacao = {
    bruto,
    limpo: ajustes?.pesoLimpo ?? null,
    preparado: ajustes?.pesoPreparado ?? null,
    observacao: "",
  };

  return {
    id: idDoInsumoImportado(nome, ordemFisica),
    nome,
    /*
      A categoria fica VAZIA, e a decisão é deliberada. O documento pode ter
      agrupado os insumos por seção, e inferir categoria do nome do insumo
      ("Farinha de trigo" → "Secos") seria um palpite com aparência de dado.
    */
    categoria: "",
    unidade: unidade ?? "",
    compra,
    transformacao,
    observacoes: "",
    /*
      O PREÇO DE REFERÊNCIA DA BIBLIOTECA É NULO, E PRECISA SER.

      `resolverItem` procura o preço em três lugares, nesta ordem de
      precedência: o preço do cliente, o preço guardado na ficha, e o preço de
      referência da biblioteca. O insumo importado é NOVO — ele não tem
      histórico, não pertence a cliente nenhum, e não está na biblioteca.

      Preencher este campo com o preço lido do PDF seria o erro mais fácil de
      cometer aqui, e ele não apareceria como erro: `resolverItem` encontraria
      um preço, a linha entraria na soma, e o custo sairia certo. O defeito
      seria outro — o insumo importado passaria a AFIRMAR ter um preço de
      referência que ninguém cadastrou, e essa afirmação viveria no objeto
      depois que a importação terminasse. O preço do documento pertence ao
      ITEM (ver abaixo), que é onde ele foi lido.
    */
    precoAtual: null,
    atualizadoEm: new Date(),
    fornecedor: "",
    historico: [],
  };
}

/**
 * A LINHA QUE NÃO FOI CONFIRMADA AINDA — CONFERIDA, E FORA DA CONTA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELA NÃO PASSA PELO MOTOR — E POR QUE ISSO É O QUE A PROTEGE   │
 * │                                                                      │
 * │ A tentação é calcular normalmente e limpar o custo na saída. Seria o   │
 * │ caminho mais curto e o mais perigoso: `somarFicha` percorre a lista e  │
 * │ soma todo item com estado "OK". Um item calculado aqui seria somado     │
 * │ como qualquer outro, e o total do prato passaria a incluir um número    │
 * │ que ninguém confirmou.                                                 │
 * │                                                                      │
 * │ Construindo o item resolvido direto, com `custo: null`, o item entra   │
 * │ na lista SEM NUNCA TER PASSADO pelo `resolverItem` — e por isso não    │
 * │ existe caminho nenhum, nem hoje nem numa refatoração futura, em que    │
 * │ ele seja somado. O custo é `null` porque não foi calculado; não é      │
 * │ `null` porque foi anulado depois.                                      │
 * │                                                                      │
 * │ E ele PRECISA aparecer: `somarFicha` conta `itensFora` e mantém o      │
 * │ `completo` falso enquanto houver algum. É assim que o custo total sai  │
 * │ como "—" em vez de sair parcial e ser lido como o custo da receita.    │
 * │                                                                      │
 * │ A coluna SITUAÇÃO diz o que fazer, com o texto do próprio domínio:     │
 * │ "aguardando conferência — Esta linha ainda não foi confirmada…".       │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function resolvidoAguardandoConferencia(linha: LinhaConferida, ingrediente: Ingrediente): ItemResolvido {
  const item = itemDaLinha(linha, ingrediente);
  const quantidade = linha.leituraQuantidade.estado === "OK" ? linha.leituraQuantidade.valor : null;
  const transformacao = derivarTransformacao(ingrediente.transformacao);

  return {
    item,
    ingrediente,
    fornecedor: ingrediente.fornecedor,
    /*
      SEM PREÇO EFETIVO, MESMO QUANDO O DOCUMENTO TROUXE UM.

      `precoEfetivo` é o número que o motor usaria para calcular. Deixar aqui
      o preço lido daria a impressão de que a linha foi calculada e o custo
      apenas escondido — e a coluna PREÇO KG mostraria um número que não
      entrou em conta nenhuma. `null` diz a verdade: nada foi resolvido.
    */
    precoEfetivo: null,
    origemDoPreco: "AUSENTE",
    quantidade: quantidade?.valor ?? null,
    /* A transformação fica: ela é medida, não calculada. Ver o tipo. */
    transformacao,
    custos: custoPorEtapa(null, transformacao),
    custo: null,
    estado: "AGUARDANDO_CONFERENCIA",
  };
}

/**
 * A LINHA VIRA UM ITEM DE FICHA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ONDE O PREÇO LIDO DO PDF ENTRA — E POR QUE NESTE CAMPO                │
 * │                                                                      │
 * │ `ItemFicha.precoReferencia` é, nas palavras do próprio tipo, "o preço  │
 * │ de referência do ingrediente no momento do uso". Ele vem ANTES do      │
 * │ preço da biblioteca na precedência, e depois do preço do cliente.      │
 * │                                                                      │
 * │ É exatamente o lugar do número que o PDF trouxe: um preço datado, do   │
 * │ dia em que aquele documento foi escrito, que não deve ser sobreposto   │
 * │ pelo preço de hoje. O comentário do campo diz isso com todas as        │
 * │ letras, e é por isso que ele é a casa certa — e não um `Ingrediente`   │
 * │ inventado.                                                            │
 * │                                                                      │
 * │ O preço que entra aqui NÃO é o valor total pago: é o preço UNITÁRIO,   │
 * │ porque é ele que `resolverItem` multiplica pela quantidade. A divisão  │
 * │ é feita por `precoUnitarioDaCompra` — a função do motor de custos — e  │
 * │ não por uma linha de divisão escrita aqui.                            │
 * │                                                                      │
 * │ Quando a compra não está completa, `precoUnitarioDaCompra` devolve     │
 * │ `null` e o item entra sem preço. `resolverItem` então o marca como     │
 * │ SEM_PRECO e ele fica FORA da soma, com o motivo escrito na coluna      │
 * │ SITUAÇÃO — em vez de entrar como zero.                                │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function itemDaLinha(linha: LinhaConferida, ingrediente: Ingrediente): ItemFicha {
  const quantidade = linha.leituraQuantidade.estado === "OK" ? linha.leituraQuantidade.valor : null;

  return {
    ingredienteId: ingrediente.id,
    /*
      A QUANTIDADE VAI COMO TEXTO, e não como número.

      `ItemFicha.quantidade` é `string` porque a cozinha escreve "a gosto". Um
      valor que veio do PDF é número, e passá-lo adiante como texto preserva a
      única porta de entrada do tipo — `lerQuantidade`, que a ficha digitada à
      mão também atravessa. Converter aqui para depois o motor converter de
      volta criaria duas conversões onde existe uma.
    */
    quantidade: quantidade !== null ? String(quantidade.valor).replace(".", ",") : "",
    /*
      A ETAPA É "COMPRA", porque é o único peso que o documento declarou: o que
      foi comprado e por quanto. Ver a nota no topo deste arquivo — afirmar
      "peso preparado" sem pesagem seria inventar.
    */
    etapa: "COMPRA",
    unidade: quantidade?.unidade ?? "",
    precoReferencia: precoUnitarioDaCompra(ingrediente.compra),
    observacao: "",
  };
}

/* ------------------------------------------------------------------------ */
/* O resultado do cálculo                                                    */
/* ------------------------------------------------------------------------ */

/**
 * O QUE A IMPORTAÇÃO PRODUZ, ANTES DE VIRAR PLANILHA.
 *
 * Ele expõe o `resumo` e o `peso` CRUS, e não só a grade, por um motivo de
 * verificabilidade: quem quiser conferir que o custo desta importação é o mesmo
 * da tela de Ficha Técnica pode chamar a geração e ler estes dois objetos, sem
 * passar por nenhuma formatação de célula no meio.
 */
export type ImportacaoCalculada = {
  prato: string;
  categoria: string;
  /** As linhas resolvidas, na ordem do documento. */
  resolvidos: readonly ItemResolvido[];
  /** A soma — com a contagem do que entrou e do que ficou de fora. */
  resumo: ReturnType<typeof resumoDaFicha>;
  /** O peso somável, quando todas as linhas estão na mesma etapa. */
  peso: ReturnType<typeof pesarFicha>;
  /** Quantas linhas o documento tinha, depois de descartar as vazias. */
  linhasLidas: number;
};

/**
 * A CONFERÊNCIA VIRA CÁLCULO — chamando o motor, e nada mais.
 */
export function calcularImportacao(dados: DadosParaGerar): ImportacaoCalculada {
  const cab = dados.cabecalho;
  const ajustesCab = dados.ajustesDoCabecalho;

  const prato = (ajustesCab?.titulo ?? cab.titulo ?? "Ficha importada").trim();
  const categoria = (ajustesCab?.categoria ?? cab.categoria ?? "").trim();

  const resolvidos: ItemResolvido[] = [];

  dados.linhas.forEach((linha, i) => {
    const ajustes = dados.ajustesDaLinha?.[linha.ordem];
    const ingrediente = ingredienteDaLinha(linha, i + 1, ajustes);
    if (ingrediente === null) return;

    /*
      ┌────────────────────────────────────────────────────────────────────┐
      │ A LINHA QUE NÃO FECHA NÃO ENTRA NO MOTOR — ANTES DE QUALQUER CONTA  │
      │                                                                    │
      │ `podeCalcular` estava escrito desde o começo, com a doc a dizer que  │
      │ "a etapa de cálculo faz esta pergunta antes de tentar" — e NINGUÉM   │
      │ a chamava. A consequência era o defeito mais caro possível nesta      │
      │ tela: a linha marcada "precisa revisar" recebia preço unitário,       │
      │ custo e peso bruto, e entrava na soma do prato com a mesma confiança  │
      │ de uma linha conferida.                                             │
      │                                                                    │
      │ O caso concreto: a leitura automática troca o separador e lê "0,5 kg" │
      │ como "5000 kg". A validação percebe e marca PESO_IMPLAUSIVEL — que é   │
      │ REVISAR. O motor, sem esta linha, calculava 5000 kg × R$ 10 = R$      │
      │ 50.000 e somava. Ela veria o aviso na conferência e um custo absurdamente│
      │ grande na planilha, sem ligação visível entre os dois.                │
      └────────────────────────────────────────────────────────────────────┘
    */
    if (!podeCalcular(linha)) {
      resolvidos.push(resolvidoAguardandoConferencia(linha, ingrediente));
      return;
    }

    /*
      ┌────────────────────────────────────────────────────────────────────┐
      │ AS PESAGENS PRECISAM ENTRAR NO MOTOR — E É ESTE O ARGUMENTO          │
      │                                                                    │
      │ Aqui havia `resolverItem(item, null, null)`, com os dois últimos     │
      │ argumentos em `null`. Metade da decisão estava certa e metade errada, │
      │ e as duas usavam o mesmo `null`, o que é o que tornava o defeito      │
      │ difícil de ver.                                                      │
      │                                                                    │
      │ O SEGUNDO argumento é o insumo da BIBLIOTECA, e `null` é a resposta   │
      │ certa: o insumo importado não está cadastrado, e `resolverItem` usa   │
      │ então o preço do PRÓPRIO ITEM, que é o que o documento declarou.      │
      │ Assim a planilha importada não pega emprestado, sem ninguém saber, o   │
      │ preço que a Empório Verde paga pela mandioca.                        │
      │                                                                    │
      │ O TERCEIRO argumento é o preço DESTE cliente, e `null` também é       │
      │ certo — pelo mesmo motivo.                                           │
      │                                                                    │
      │ O ERRO era o segundo. `ingredienteDaLinha` existe justamente para     │
      │ carregar os três pesos: o de compra, que veio do documento, e o       │
      │ limpo e o preparado, que ela digitou na conferência depois de pesar    │
      │ na balança. `resolverItem` os lê de `ingrediente.transformacao` —      │
      │ ver `derivarTransformacao(ingrediente?.transformacao ?? null)`.       │
      │ Passando `null` ali, o motor via um insumo sem transformação nenhuma  │
      │ e devolvia `custos: { compra, limpo: null, preparado: null }`.         │
      │                                                                    │
      │ As duas consequências, e nenhuma aparecia como erro:                  │
      │                                                                    │
      │   · a coluna CORREÇÃO — que o briefing nomeia, e que é                │
      │     `relacaoCompraPorUtilizavel` — saía vazia em toda linha;          │
      │   · o item tem `etapa: "COMPRA"`, e `custoDaQuantidade` multiplica    │
      │     pelo custo da etapa pedida. Como a etapa era COMPRA, o custo      │
      │     saía certo por acidente, e o defeito ficava escondido atrás de    │
      │     um número plausível.                                             │
      │                                                                    │
      │ O ARGUMENTO DO MEIO é o que estava trocado — o insumo da biblioteca,  │
      │ que é `null` —, e o das pesagens é o mesmo objeto. Os dois são        │
      │ `null` na chamada errada, e é por isso que ela parecia deliberada.    │
      └────────────────────────────────────────────────────────────────────┘
    */
    resolvidos.push(resolverItem(itemDaLinha(linha, ingrediente), ingrediente, null));
  });

  /*
    `rendimentoPorcoes` e `porcaoGramas` vêm da conferência quando ela os
    informou. Quando não vieram, ficam `null` — e `resumoDaFicha` então devolve
    `custoPorPorcao: null`, em vez de dividir por um número inventado.
  */
  const rendimento = ajustesCab?.rendimentoPorcoes ?? (cab.rendimento.estado === "OK" ? cab.rendimento.valor : null);
  const porcao = ajustesCab?.porcaoGramas ?? (cab.porcaoGramas.estado === "OK" ? cab.porcaoGramas.valor : null);

  return {
    prato,
    categoria,
    resolvidos,
    resumo: resumoDaFicha(resolvidos, {
      rendimentoPorcoes: rendimento,
      porcaoGramas: porcao,
    }),
    peso: pesarFicha(resolvidos),
    linhasLidas: dados.linhas.length,
  };
}

/* ------------------------------------------------------------------------ */
/* A planilha                                                                */
/* ------------------------------------------------------------------------ */

/**
 * AS COLUNAS QUE SÃO RESULTADO, PELA CHAVE — E NÃO POR UM NÚMERO FIXO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A BUSCA PELA CHAVE, E NÃO `COLUNAS_ITENS[6]`                  │
 * │                                                                      │
 * │ A coluna do custo é a sétima hoje. Escrever o sete aqui funcionaria e  │
 * │ quebraria em silêncio no dia em que uma coluna nova entrasse no meio   │
 * │ da lista: a marcação de "esta célula é calculada" passaria a apontar    │
 * │ para outra coluna, e ela poderia digitar por cima do custo sem que      │
 * │ nada reclamasse. É o defeito que só aparece depois, e no pior lugar.    │
 * │                                                                      │
 * │ Buscando pela CHAVE, a única coisa que pode mudar é a posição — que é   │
 * │ exatamente o que não importa. Se a coluna sumir, o erro é imediato e    │
 * │ com o nome da coluna na mensagem.                                      │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const COLUNAS_RESULTADO = ["correcao", "pesoBruto", "custo"] as const;

function numerosDasColunasResultado(): readonly number[] {
  return COLUNAS_RESULTADO.map((chave) => {
    const indice = COLUNAS_ITENS.findIndex((c) => c.chave === chave);
    if (indice < 0) {
      throw new Error(
        `A coluna "${chave}" não existe mais em COLUNAS_ITENS (../modelos/ficha-tecnica). ` +
          "A importação marca as colunas de resultado pelo nome, e precisa que ele continue existindo."
      );
    }
    return indice + 1;
  });
}

/**
 * O CUSTO DE UMA LINHA FORA DA SOMA NÃO VIROU ZERO — VIROU AUSÊNCIA.
 *
 * `ItemResolvido.custo` é `null` quando a linha ficou de fora, e o valor nulo
 * atravessa até a célula, onde vira traço. É a regra que governa o sistema
 * inteiro, e numa planilha de importação ela vale mais que em qualquer outro
 * lugar: um documento lido pela metade produziria um custo total baixo, e o
 * número pareceria um custo.
 */
function custoDaLinha(r: ItemResolvido): number | null {
  return r.custo;
}

/** O preço por unidade, na etapa em que a quantidade foi pesada. */
function precoDaLinha(r: ItemResolvido): number | null {
  switch (r.item.etapa) {
    case "COMPRA":
      return r.custos.compra;
    case "LIMPO":
      return r.custos.limpo;
    case "PREPARADO":
      return r.custos.preparado;
  }
}

/**
 * A SITUAÇÃO ESCRITA PARA ELA.
 *
 * "calculado" e "falta o peso" são os rótulos do sistema (`ROTULO_ESTADO_ITEM`).
 * Eles vêm de lá, e não de uma lista escrita aqui, porque a mesma linha aparece
 * na tela de Ficha Técnica — e duas listas divergiriam no dia em que uma
 * ganhasse um caso novo.
 */
function situacaoDaLinha(r: ItemResolvido): string {
  if (r.estado === "OK") return ROTULO_ESTADO_ITEM.OK;
  return `${ROTULO_ESTADO_ITEM[r.estado]} — ${ACAO_DO_ESTADO_ITEM[r.estado]}`;
}

/**
 * MONTA A PLANILHA DA IMPORTAÇÃO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA FUNÇÃO DEVOLVE `GradeDaPlanilha`, E NÃO UMA TABELA      │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ "A planilha exibida e a planilha baixada precisam continuar vindo  │ │
 * │ │  da mesma estrutura lógica."                                       │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ Devolvendo a grade, a prévia na tela e o arquivo XLSX saem do MESMO    │
 * │ objeto — o componente `PreviaDaPlanilha` desenha uma, o escritor       │
 * │ ExcelJS escreve a outra. Não existe um modelo de exportação paralelo.   │
 * │                                                                      │
 * │ É também o que faz a planilha importada ter exatamente as mesmas        │
 * │ colunas da ficha digitada à mão (`COLUNAS_ITENS`, importada daqui):     │
 * │ INGREDIENTE, PESO LÍQ, UN, PREÇO KG, CORREÇÃO, PESO BR., CUSTO, ETAPA,  │
 * │ SITUAÇÃO. A importação não inventa um formato próprio.                 │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function gradeDaImportacao(dados: DadosParaGerar): GradeDaPlanilha {
  const calc = calcularImportacao(dados);
  const colunasResultado = numerosDasColunasResultado();

  const subtituloPartes: string[] = [];
  if (dados.cliente) subtituloPartes.push(dados.cliente);
  subtituloPartes.push("importado de PDF");
  subtituloPartes.push(`gerado em ${dataCurta(dados.geradoEm ?? new Date())}`);

  const folha = folhaImportada(calc, dados, colunasResultado);

  return {
    titulo: "FICHA TÉCNICA",
    subtitulo: subtituloPartes.join(" · "),
    folhas: [folha],
  };
}

/**
 * A FOLHA — uma só, e ela é a ficha.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A IMPORTAÇÃO NÃO TEM ABAS BASE E INFORMAÇÕES                 │
 * │                                                                      │
 * │ Na ficha digitada à mão, a aba BASE lista os insumos do cliente e a    │
 * │ INFORMAÇÕES registra o que falta decidir. As duas existem porque       │
 * │ existe um CLIENTE com biblioteca e com pendências cadastradas.         │
 * │                                                                      │
 * │ Na importação não existe nada disso: os insumos vêm do documento e     │
 * │ não estão cadastrados, e não há consultoria por trás. Criar as duas    │
 * │ abas vazias daria a ela um arquivo com duas folhas em branco para      │
 * │ percorrer procurando o que não existe. A ausência das abas é a         │
 * │ afirmação correta.                                                    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function folhaImportada(
  calc: ImportacaoCalculada,
  dados: DadosParaGerar,
  colunasResultado: readonly number[]
): FolhaGrade {
  const linhas: LinhaGrade[] = [];

  /*
    O número da linha FÍSICA, que é o endereço da célula.

    Ele começa onde o conteúdo começa no arquivo — `linhaInicial`, que o
    escritor fixa em 3, depois da faixa de título e da de subtítulo. É o mesmo
    número que o componente da tela usa para desenhar a coluna da esquerda, e é
    por isso que "a linha 12" quer dizer a mesma linha na tela e no Excel.
  */
  let numeroDaLinha = LINHA_INICIAL_DA_IMPORTACAO;

  const push = (linha: LinhaGrade): void => {
    linhas.push(linha);
    numeroDaLinha += 1;
  };

  /** Os endereços, na linha ATUAL, das colunas que são resultado. */
  const enderecosCalculados = (): string[] =>
    colunasResultado.map((coluna) => endereco(numeroDaLinha, coluna));

  const calculadas: string[] = [];

  /* ── A identificação do prato ──────────────────────────────────────── */
  push(secao(`▸ ${calc.prato}`));
  push(campo("PRATO", calc.prato));
  push(campo("CATEGORIA", calc.categoria === "" ? null : calc.categoria));
  push(campo("RENDIMENTO (PORÇÕES)", rendimentoDe(dados), "numero"));
  push(campo("KG POR PORÇÃO", porcaoEmQuilos(dados), "peso"));

  /*
    O CUSTO TOTAL — só quando a soma está fechada.

    É a mesma regra da ficha digitada à mão, e na importação ela é ainda mais
    necessária: uma leitura incompleta deixa linhas de fora, e um número
    parcial aqui seria lido como o custo da receita.
  */
  push(campo("CUSTO TOTAL", calc.resumo.completo ? calc.resumo.custoTotal : null, "moeda"));
  push(campo("CUSTO POR PORÇÃO", calc.resumo.custoPorPorcao, "moeda"));

  /* ── A grade de ingredientes ───────────────────────────────────────── */
  push(secao("INGREDIENTES"));
  push({ tipo: "cabecalho" });

  if (calc.resolvidos.length === 0) {
    push(nota("Nenhuma linha do documento pôde virar insumo — nenhuma tinha nome e quantidade legíveis."));
  } else {
    for (const r of calc.resolvidos) {
      calculadas.push(...enderecosCalculados());
      push({
        tipo: "dados",
        celulas: {
          ingrediente: r.ingrediente?.nome ?? "",
          pesoLiq: r.quantidade,
          unidade: r.item.unidade,
          precoKg: precoDaLinha(r),
          /*
            A CORREÇÃO — o número que só a balança produz.
            Ela fica vazia quando não houve pesagem de limpeza, exatamente como
            fica na ficha digitada à mão. Ver o bloco no topo deste arquivo.
          */
          correcao: r.transformacao.indicadores.relacaoCompraPorUtilizavel,
          pesoBruto: pesoBrutoDaLinha(r),
          custo: custoDaLinha(r),
          etapa: ROTULO_ETAPA_PESO[r.item.etapa],
          situacao: situacaoDaLinha(r),
        },
      });
    }

    push({
      tipo: "subtotal",
      rotulo: "Subtotal dos insumos",
      celulas: {
        ingrediente: "Subtotal dos insumos",
        custo: calc.resumo.itensSomados > 0 ? calc.resumo.custoTotal : null,
      },
    });
  }

  /* ── O peso da receita, quando ele é somável ───────────────────────── */
  if (calc.peso.total !== null) {
    push(campo("PESO DA RECEITA", calc.peso.total, "peso"));
    push(
      nota(
        `Peso somado na etapa "${calc.peso.etapa ? ROTULO_ETAPA_PESO[calc.peso.etapa] : "—"}", a partir de ${calc.peso.linhasSomadas} linha(s).`
      )
    );
  } else if (calc.peso.etapasEncontradas.length > 1) {
    push(
      campo(
        "PESO DA RECEITA",
        `não somável — etapas distintas: ${calc.peso.etapasEncontradas.map((e) => ROTULO_ETAPA_PESO[e]).join(", ")}`
      )
    );
  }

  /* ── O que ficou fora da soma ──────────────────────────────────────── */
  if (calc.resumo.itensFora > 0) {
    push(
      pendencia(
        `${calc.resumo.itensFora} de ${calc.resolvidos.length} linha(s) ficaram fora da soma do custo: ` +
          calc.resumo.motivos.map((m) => `${m.quantidade}× ${ROTULO_ESTADO_ITEM[m.estado]}`).join("; ") +
          ". O custo total acima é um PISO, e não o custo da receita, enquanto estas linhas não tiverem preço ou pesagem."
      )
    );
  } else if (calc.resolvidos.length > 0) {
    push(nota("Todas as linhas entraram na soma."));
  }

  /*
    A NOTA DE ORIGEM — a que diz de onde este conteúdo veio.

    Ela é uma PENDÊNCIA e não uma nota porque o arquivo sai do sistema sem
    passar pelo cadastro: os insumos desta folha não estão na biblioteca, e quem
    abrir o arquivo daqui a um mês precisa saber disso sem ter de deduzir.
  */
  push(
    pendencia(
      "Esta planilha foi montada a partir de um documento importado. Os insumos dela ainda não estão cadastrados " +
        "na biblioteca do sistema, então o preço de cada linha é o que o documento informou — sem histórico e sem fornecedor."
    )
  );

  if (dados.origem) {
    push(nota(`Origem: ${dados.origem}.`));
  }

  return {
    nome: "Ficha",
    titulo: "FICHA TÉCNICA",
    colunas: COLUNAS_ITENS as readonly ColunaGrade[],
    linhas,
    /*
      A FAIXA DE TÍTULO E A DE SUBTÍTULO DO ARQUIVO — as mesmas duas linhas que
      o escritor gasta em toda folha. Ver `FolhaGrade.linhaInicial`.
    */
    linhaInicial: LINHA_INICIAL_DA_IMPORTACAO,
    congelarLinhas: 3,
    mostrarCabecalho: false,
    /*
      A FOLHA ACEITA DIGITAÇÃO — e é a diferença em relação à aba de ficha que
      o sistema monta.

      Aquela desenha um dado que mora em outro lugar: o custo dela sai de
      `resolverItem`, e editá-lo na grade criaria um segundo caminho de escrita.
      Esta não tem origem nenhuma: os dados vieram de um PDF, e ainda não estão
      em lugar nenhum do sistema. Corrigir um peso aqui é corrigir a ÚNICA cópia
      que existe — e numera o que ela vai baixar.

      As colunas de resultado ficam em `calculadas`: o custo, a correção e o
      peso bruto são resposta da conta, e uma resposta que se pode reescrever à
      mão deixa de ser resposta. O peso, a unidade, o preço e a etapa continuam
      editáveis, porque são ENTRADA — e é neles que o PDF erra.
    */
    editavel: true,
    calculadas,
    assinatura:
      "Custo calculado pelo sistema a partir do preço informado no documento e dos pesos medidos. Linha sem preço ou sem pesagem não entra na soma, e aparece com o motivo em vez de entrar como zero.",
  };
}

/**
 * EM QUE LINHA DO ARQUIVO O CONTEÚDO COMEÇA.
 *
 * É o mesmo três que `escrever-grade.ts` usa (`let linha = 3`, depois de
 * `aplicarCabecalho` gastar as linhas 1 e 2). Declarado como constante, e não
 * copiado, para haver um único lugar onde este número mora — junto com o
 * comentário que explica por quê.
 */
const LINHA_INICIAL_DA_IMPORTACAO = 3;

/** O rendimento declarado, quando ela o informou na conferência. */
function rendimentoDe(dados: DadosParaGerar): number | null {
  const doAjuste = dados.ajustesDoCabecalho?.rendimentoPorcoes;
  if (doAjuste != null) return doAjuste;
  return dados.cabecalho.rendimento.estado === "OK" ? dados.cabecalho.rendimento.valor : null;
}

/** A porção em quilos, a partir dos gramas declarados. Sem informação, `null`. */
function porcaoEmQuilos(dados: DadosParaGerar): number | null {
  const gramas = dados.ajustesDoCabecalho?.porcaoGramas ?? (dados.cabecalho.porcaoGramas.estado === "OK" ? dados.cabecalho.porcaoGramas.valor : null);
  if (gramas === null) return null;
  /*
    A divisão por mil é uma conversão de ESCALA entre duas unidades da mesma
    grandeza — gramas e quilos. Ela é a mesma que `emQuilos`, em
    `./normalizar`, já faz, e a mesma que a ficha digitada à mão faz ao escrever
    a linha "KG POR PORÇÃO". Não é decisão de metodologia: quilo é mil gramas
    em qualquer cozinha.
  */
  return gramas / 1000;
}

/**
 * O PESO DE COMPRA CORRESPONDENTE À QUANTIDADE USADA.
 *
 * É `quantidade × relação` — a mesma conta que a coluna ao lado descreve, e a
 * mesma que `pesoBrutoDaQuantidade` faz em `../modelos/ficha-tecnica`. Sem
 * medição, fica vazio, e o vazio quer dizer "só a balança produz este número".
 */
function pesoBrutoDaLinha(r: ItemResolvido): number | null {
  const relacao = r.transformacao.indicadores.relacaoCompraPorUtilizavel;
  if (relacao === null || r.quantidade === null) return null;
  return r.quantidade * relacao;
}

/** Reexportado para a tela poder nomear o estado sem importar de dois lugares. */
export type { EstadoCalculoItem };