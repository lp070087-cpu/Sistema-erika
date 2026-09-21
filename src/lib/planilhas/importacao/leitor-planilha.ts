/**
 * O LEITOR DE PLANILHA — quem fala com a rota que abre o `.xlsx`.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE LEITOR NÃO LÊ, ELE ENVIA                                 │
 * │                                                                      │
 * │ Os outros leitores abrem o arquivo e devolvem o conteúdo. Este não     │
 * │ abre nada: ele manda o arquivo para `/api/importacao/planilha`, que o  │
 * │ abre com o ExcelJS no servidor.                                        │
 * │                                                                      │
 * │ Não é preguiça nem excesso de camada. É a regra que sustenta todas as  │
 * │ planilhas do sistema, escrita em `gerador.ts` e em `grade.ts`: o       │
 * │ `exceljs` não entra no pacote que o navegador baixa. Ele arrasta        │
 * │ dependências de Node, e qualquer tela que o importasse passaria a      │
 * │ carregar tudo isso antes de desenhar o primeiro pixel.                 │
 * │                                                                      │
 * │ Então a leitura mora atrás da rota. O que atravessa a rede é o         │
 * │ ARQUIVO, uma vez, porque não há outro jeito de o servidor vê-lo —      │
 * │ diferente do que acontece no resto do sistema, onde o que atravessa é  │
 * │ a GRADE, e o servidor não sabe de ficha nem de cliente.               │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ELE É UM `DocumentExtractor` COMO OS OUTROS, E ISSO NÃO É FORMA      │
 * │                                                                      │
 * │ A tela importa este arquivo e chama `leitorPlanilha.extract(arquivo)`, │
 * │ exatamente como chamaria o leitor de texto ou o de PDF. Ela não sabe   │
 * │ que existe uma rede no meio — e por isso não tem um caminho especial   │
 * │ para planilha, nem tratamento de erro próprio, nem uma segunda          │
 * │ conferência.                                                          │
 * │                                                                      │
 * │ É a decisão central desta rodada: quatro portas de entrada, UMA        │
 * │ esteira. Se este leitor fosse um `fetch` solto dentro do componente    │
 * │ da tela, a esteira teria um desvio — e o desvio é onde a segunda        │
 * │ conferência nasce.                                                    │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type {
  DocumentoExtraido,
  DocumentExtractor,
  ResultadoDaExtracao,
} from "./tipos";

/** O caminho da rota. Uma constante porque ele é citado em dois lugares. */
const ROTA = "/api/importacao/planilha";

export const NOME_DO_LEITOR_DE_PLANILHA = "Leitura do arquivo Excel";

/**
 * A RESPOSTA DA ROTA, conferida antes de ser acreditada.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO É UM `await resposta.json()` E PRONTO                    │
 * │                                                                      │
 * │ Porque o middleware protege `/api/...`: sem sessão, ele REDIRECIONA    │
 * │ para `/entrar`. E um redirecionamento seguido pelo `fetch` termina em  │
 * │ 200 — com a página de entrada em HTML no corpo.                       │
 * │                                                                      │
 * │ Um `resposta.json()` sobre esse HTML lançaria uma exceção de sintaxe   │
 * │ que não diz nada, e a tela mostraria "falha ao ler a planilha" para    │
 * │ um problema que é sessão expirada. A Érika tentaria de novo com o      │
 * │ mesmo arquivo, dez vezes.                                              │
 * │                                                                      │
 * │ A checagem do tipo é a mesma que os dois botões de download já fazem   │
 * │ neste sistema (`gerar.tsx`, `janela.tsx`), e pela mesma razão. Custa    │
 * │ uma comparação de texto e evita um diagnóstico errado.                 │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function ehResultado(valor: unknown): valor is ResultadoDaExtracao {
  if (typeof valor !== "object" || valor === null) return false;
  const estado = (valor as { estado?: unknown }).estado;
  return estado === "OK" || estado === "INDISPONIVEL" || estado === "VAZIO" || estado === "FALHOU";
}

/** Lê o corpo da resposta, aceitando o formato que a rota devolve. */
type RespostaDaRota = ResultadoDaExtracao & {
  /** O nome do arquivo, as abas que existem e qual delas foi lida. */
  readonly arquivo?: { readonly nome: string; readonly abas: readonly string[]; readonly abaEscolhida: number };
};

export const leitorPlanilha: DocumentExtractor = {
  nome: NOME_DO_LEITOR_DE_PLANILHA,

  /**
   * `true` — e há uma diferença real entre isto e o leitor de PDF.
   *
   * `leitorLocal.disponivel()` devolve `false` porque não existe serviço de
   * leitura configurado: tentar de novo não adianta, e a tela diz isso. Aqui
   * a leitura existe, funciona, e roda a cada arquivo enviado. O que pode
   * falhar é o arquivo ou a conexão — e para esses dois, tentar de novo
   * adianta.
   */
  disponivel(): boolean {
    return true;
  },

  motivoDaIndisponibilidade(): string {
    return "";
  },

  async extract(arquivo: File): Promise<ResultadoDaExtracao> {
    const dados = new FormData();
    dados.append("arquivo", arquivo, arquivo.name);

    let resposta: Response;
    try {
      /*
        O `method: "POST"` vai explícito, e o `Content-Type` NÃO.

        O navegador monta o cabeçalho do `multipart/form-data` sozinho, porque
        ele é o único que sabe onde caiu cada fronteira do corpo. Escrevê-lo à
        mão — `"multipart/form-data"` sem o `boundary` — faz o servidor não
        conseguir separar os campos, e o arquivo chega truncado. É um erro que
        só aparece em produção, e que se evita deixando o navegador fazer o
        trabalho dele.
      */
      resposta = await fetch(ROTA, { method: "POST", body: dados, cache: "no-store" });
    } catch {
      /*
        AQUI O `fetch` EM SI FALHOU — a rede caiu, o servidor não respondeu, a
        aba perdeu a conexão. É `FALHOU` e não `INDISPONIVEL`: o sistema tem a
        peça, e o momento é que não ajudou. "Tente de novo" é conselho certo.
      */
      return {
        estado: "FALHOU",
        motivo:
          "Não foi possível enviar a planilha para leitura — a conexão falhou. Confira se você continua conectado e tente de novo; nada do que você já conferiu se perdeu.",
      };
    }

    const tipo = resposta.headers.get("Content-Type") ?? "";
    if (!tipo.includes("application/json")) {
      return {
        estado: "FALHOU",
        motivo:
          "A sua sessão expirou e o servidor devolveu a tela de entrada em vez da leitura. Entre de novo e repita — o arquivo não chegou a ser lido.",
      };
    }

    let corpo: unknown;
    try {
      corpo = await resposta.json();
    } catch {
      return {
        estado: "FALHOU",
        motivo:
          "O servidor respondeu, mas a resposta não pôde ser lida. Tente enviar a planilha de novo.",
      };
    }

    if (!ehResultado(corpo)) {
      return {
        estado: "FALHOU",
        motivo:
          "O servidor respondeu num formato que esta tela não reconhece. Tente enviar a planilha de novo.",
      };
    }

    if (corpo.estado === "OK") {
      /*
        O LEITOR É REESCRITO COM O NOME DA ABA, e não é cosmética.

        A rota já devolve o documento com o leitor preenchido, mas é AQUI que
        se sabe qual aba foi escolhida e quantas existem — a informação vem no
        campo `arquivo` da resposta, que é da tela e não do domínio.

        Sem ela, a conferência diria "Leitura do arquivo Excel" e a Érika não
        teria como saber que existe uma segunda aba naquele arquivo. Com ela,
        a linha diz exatamente qual aba foi lida — e ela pode abrir o Excel,
        achar a aba pelo nome e conferir linha por linha.
      */
      const extras = (corpo as RespostaDaRota).arquivo;
      const documento: DocumentoExtraido =
        extras === undefined
          ? corpo.documento
          : {
              ...corpo.documento,
              leitor: `${NOME_DO_LEITOR_DE_PLANILHA} — aba "${extras.abas[extras.abaEscolhida] ?? "?"}"`,
            };

      return { estado: "OK", documento };
    }

    return corpo;
  },
};
