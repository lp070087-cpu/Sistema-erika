/**
 * MODELO: PLANILHA EM BRANCO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE É O MODELO MAIS SIMPLES E O MAIS DIFÍCIL                │
 * │                                                                      │
 * │ Os outros três modelos leem o que já existe — tarefas, fichas,        │
 * │ insumos — e desenham. A dificuldade deles está em não inventar        │
 * │ número.                                                              │
 * │                                                                      │
 * │ Este faz o contrário: não lê nada e não calcula nada. A dificuldade    │
 * │ está em ele ser ÚTIL. Uma grade vazia é útil quando ela se comporta    │
 * │ como uma planilha de verdade — com letras de coluna, números de       │
 * │ linha, trinta linhas onde clicar, e o cursor andando com Enter e Tab.  │
 * │ Sem isso, "planilha em branco" é uma tela cinza.                       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE MODELO NÃO TEM, E POR QUE A AUSÊNCIA É O PEDIDO           │
 * │                                                                      │
 * │ Não tem fórmula. Não tem `=SOMA()`, não tem `=SE()`, não tem macro,   │
 * │ não tem gráfico, não tem tabela dinâmica. O briefing é explícito      │
 * │ nisso, e a razão prática é boa: uma planilha que aceita fórmula mas    │
 * │ não sabe recalculá-la é pior que uma que não aceita — no primeiro      │
 * │ caso o número parece calculado e está congelado.                       │
 * │                                                                      │
 * │ Se ela digitar "=5+5" numa célula, o que aparece é o texto           │
 * │ "=5+5". Isso é honesto, e a nota do rodapé diz.                        │
 * │                                                                      │
 * │ Não tem persistência. O Neon não está ligado, e fingir que salva       │
 * │ seria a mentira mais fácil e mais cara desta rodada: ela digitaria     │
 * │ uma ficha inteira, recarregaria a página, e teria perdido tudo sem     │
 * │ entender por quê. A nota diz onde o conteúdo vive e o que acontece     │
 * │ ao recarregar.                                                        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE GERADOR NÃO RECEBE CLIENTE PARA FUNCIONAR               │
 * │                                                                      │
 * │ É o único dos quatro que faz sentido SEM cliente escolhido — e é por   │
 * │ isso que ele é o modelo com que a Central abre quando nada foi         │
 * │ selecionado. Sem ele, a tela vazia voltaria a ser o "Escolha um        │
 * │ cliente" que o briefing pede para eliminar.                            │
 * │                                                                      │
 * │ O contexto continua sendo recebido, e é usado quando existe: com       │
 * │ cliente escolhido, o subtítulo diz de quem é a planilha. Sem cliente,  │
 * │ o subtítulo diz que ela é livre.                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { ContextoPlanilha } from "../tipos";
import type { ColunaGrade, FolhaGrade, GradeDaPlanilha, LinhaGrade } from "../grade";
import { linhasVazias, nota } from "../grade";

/**
 * AS DIMENSÕES DA GRADE LIVRE.
 *
 * Trinta linhas por doze colunas é o tamanho do briefing, e ele é um bom
 * tamanho por um motivo que não é arbitrário: cabe numa tela sem rolagem
 * vertical longa, é folgado para uma lista de ingredientes de uma ficha
 * média, e não é tão largo que a letra L saia do campo de visão — o que
 * obrigaria a rolar de lado para conferir uma linha.
 *
 * Se ela precisar de mais, o caminho desta rodada é óbvio e honesto: a grade
 * é maior que a tela, e a seta para baixo continua. Não há botão de
 * "adicionar linha" porque adicionar linha é persistir, e persistir ainda
 * não existe.
 */
export const LINHAS_EM_BRANCO = 30;
export const COLUNAS_EM_BRANCO = 12;

/**
 * As colunas A–L.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE SEM TÍTULO                                                   │
 * │                                                                      │
 * │ `titulo` vazio de propósito. A tentação era escrever "Valor", "Peso", │
 * │ "Quantidade" — e isso seria a segunda vez neste módulo em que se        │
 * │ inventa metodologia: uma grade livre com cabeçalho de peso e valor      │
 * │ sugere que aquelas colunas SÃO peso e valor, e ela vai usá-las para     │
 * │ outra coisa.                                                          │
 * │                                                                      │
 * │ A coluna sem título é a coluna do Excel, e é o que se espera de uma     │
 * │ grade em branco: cabeçalho é a primeira coisa que se digita.            │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const COLUNAS_LIVRES: readonly ColunaGrade[] = Array.from(
  { length: COLUNAS_EM_BRANCO },
  (_, i) => ({
    chave: `c${i + 1}`,
    titulo: "",
    formato: "texto" as const,
    /** A largura do Excel, em caracteres. A coluna A é mais larga: é onde a
     *  descrição vai, e descrição precisa de espaço. */
    largura: i === 0 ? 34 : 15,
    /** E a largura da TELA, em pixels — que é outra medida do mesmo campo. */
    larguraMinima: i === 0 ? 260 : 118,
  })
);

/**
 * A grade completa.
 *
 * Uma folha só, chamada "Planilha". Não há abas a inventar: abas são uma
 * decisão de organização, e organização é dela.
 */
export function montarGradeEmBranco(ctx?: ContextoPlanilha | null): GradeDaPlanilha {
  const cliente = ctx?.cliente ?? null;

  const linhas: LinhaGrade[] = [
    ...linhasVazias(LINHAS_EM_BRANCO),
    /*
      A NOTA FICA DEPOIS DAS TRINTA LINHAS, e não antes.

      Antes, ela seria a primeira coisa a aparecer numa grade que existe para
      ser digitada — e o aviso de que não salva ocuparia o lugar onde o olho
      espera a primeira célula. Depois, ela é o que se encontra ao chegar ao
      fim da grade, que é exatamente quando a dúvida "isto ficou salvo?"
      aparece.
    */
    nota(
      "Grade livre, sem fórmula. O que você digitar vale nesta sessão: recarregar a página limpa a planilha, porque o armazenamento definitivo ainda não foi ligado. Cálculo automático entra quando a fonte dos dados estiver definida."
    ),
  ];

  return {
    titulo: "PLANILHA",
    subtitulo: cliente
      ? `${cliente.nomeFantasia} · planilha livre`
      : "Planilha livre · sem cliente vinculado",
    folhas: [folhaLivre(linhas)],
  };
}

function folhaLivre(linhas: readonly LinhaGrade[]): FolhaGrade {
  return {
    nome: "Planilha",
    titulo: "PLANILHA",
    colunas: COLUNAS_LIVRES,
    linhas,
    /*
      ZERO LINHAS CONGELADAS.

      Nas outras folhas o topo carrega título e subtítulo, e congelar mantém
      a identificação da planilha à vista. Aqui, congelar as duas primeiras
      linhas gastaria duas linhas da grade com um cabeçalho que ela não lê —
      e a grade livre precisa das trinta linhas.
    */
    congelarLinhas: 0,
    congelarColunas: 1,
    mostrarCabecalho: false,
    editavel: true,
    assinatura:
      "Planilha livre do Sistema Érika Bruna · sem fórmula nesta versão · conteúdo válido apenas nesta sessão",
  };
}
