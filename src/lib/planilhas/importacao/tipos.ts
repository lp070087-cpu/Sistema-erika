/**
 * OS TIPOS DA IMPORTAÇÃO DE PDF.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO PROTEGE                                           │
 * │                                                                      │
 * │ O briefing pede uma coisa específica: que a interface com o leitor de  │
 * │ documento seja DESACOPLADA — `DocumentExtractor.extract(file) →        │
 * │ ExtractedDocument` — para que trocar de provedor não seja reescrever   │
 * │ a tela.                                                              │
 * │                                                                      │
 * │ O que ele proíbe é o outro lado da mesma moeda: amarrar a UI a um      │
 * │ fornecedor específico. Se a tela importasse o SDK de um serviço de     │
 * │ leitura, a decisão de contratar esse serviço passaria a ser uma        │
 * │ decisão sobre o código da tela — e ela não é.                          │
 * │                                                                      │
 * │ Por isso aqui só existem TIPOS. Nenhuma função, nenhum `import` de     │
 * │ biblioteca, nenhum provedor. Quem implementa a interface é um arquivo  │
 * │ separado, e é lá que um provedor pode ser plugado um dia.             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE UM DOCUMENTO EXTRAÍDO É, E POR QUE NÃO É UMA FICHA             │
 * │                                                                      │
 * │ A tentação era o extrator devolver `Ficha[]` — e seria um erro de      │
 * │ camada que apareceria meses depois: `Ficha` é do domínio, tem peso     │
 * │ líquido, etapa, transformação, rendimento. Quem constrói uma ficha a   │
 * │ partir de um documento faz MUITO mais que ler: resolve ingrediente,    │
 * │ casa com a biblioteca, calcula custo.                                 │
 * │                                                                      │
 * │ O extrator devolve o que ELE sabe: linhas com texto. A conversão em    │
 * │ ficha é do domínio, e mora em `./para-ficha.ts`. A fronteira é essa, e │
 * │ é o que permite trocar o extrator sem tocar no domínio — e evoluir o   │
 * │ domínio sem tocar no extrator.                                        │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/**
 * A PROCEDÊNCIA DE UM CAMPO — de onde ele veio.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE TODO CAMPO CARREGA ISTO                                      │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ "NÃO inventar dados que não foram extraídos."                     │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ Cumprir essa regra exige poder RESPONDER de onde veio cada número —    │
 * │ e a resposta não pode ser dada só no fim, juntando tudo. Um valor      │
 * │ que o extrator leu do arquivo e um valor que o domínio calculou a      │
 * │ partir dele são coisas diferentes, e misturá-los num mesmo objeto      │
 * │ apaga exatamente a distinção que o briefing protege.                   │
 * │                                                                      │
 * │ Por isso a procedência viaja NO CAMPO, e não numa estrutura paralela.  │
 * │ Ausência de procedência seria indistinguível de procedência ignorada.  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type Procedencia =
  /** Estava escrito no documento. `pagina` quando o extrator sabe dizer. */
  | { tipo: "DOCUMENTO"; pagina?: number }
  /** Não estava no documento: o sistema derivou de outro valor extraído. */
  | { tipo: "DERIVADO"; baseadoEm: string }
  /** Ela corrigiu à mão na tela de conferência. */
  | { tipo: "CORRIGIDO" }
  /** Não existe. É ausência — e é o valor honesto quando não havia o dado. */
  | { tipo: "AUSENTE" };

/** Um campo lido, com o texto original preservado e a procedência. */
export type CampoExtraido = {
  /** O texto COMO ESTAVA no documento. Nunca reescrito — é a prova do que havia. */
  texto: string;
  /**
   * A página de onde ele saiu, quando o extrator sabe dizer.
   *
   * `null` é resposta legítima: alguns extratores devolvem o texto do
   * documento inteiro sem mapear página, e inventar "1" seria pior que dizer
   * que não se sabe.
   */
  pagina: number | null;
};

/**
 * UMA LINHA DE INSUMOS LIDA DO DOCUMENTO.
 *
 * Ela é o nível de confiança mais baixo de toda a importação, e é de propósito:
 * o extrator lê "5 kg" e "50,00" e para aí. Não sabe se 50 é o preço do quilo
 * ou o total pago, não sabe se 5 é peso de compra ou peso limpo, não sabe se a
 * linha é ingrediente ou etapa de preparo.
 *
 * Quem sabe é a tela de conferência — com ela olhando. O extrator não adivinha.
 */
export type LinhaExtraida = {
  /** O que foi lido como nome do insumo, cru. Pode ser vazio. */
  descricao: CampoExtraido | null;
  /** O que foi lido como quantidade, cru. A conversão é da normalização. */
  quantidade: CampoExtraido | null;
  /** O que foi lido como valor. Cru, e sem suposição sobre preço total ou unitário. */
  valor: CampoExtraido | null;
  /** A linha física do documento, para ela poder conferir com o PDF ao lado. */
  ordem: number;
  /**
   * ESTA LINHA NÃO VEIO DO DOCUMENTO — ela foi criada à mão na conferência.
   *
   * ┌────────────────────────────────────────────────────────────────────┐
   * │ POR QUE ESTE CAMPO PRECISOU EXISTIR                                │
   * │                                                                    │
   * │ A validação descarta as linhas sem conteúdo antes de julgá-las —    │
   * │ ver `temConteudo` em `./validar.ts`. É o que impede um PDF espaçado  │
   * │ de virar trinta avisos, e é uma regra certa.                          │
   * │                                                                    │
   * │ Ela tem um efeito colateral que só aparece quando a conferência       │
   * │ permite criar uma linha: a linha nasce VAZIA — é para isso que ela   │
   * │ foi criada — e seria descartada no mesmo instante, antes de a Érika   │
   * │ digitar a primeira letra. O campo piscaria e sumiria.                 │
   * │                                                                    │
   * │ Marcar a origem resolve isso pelo motivo certo: uma linha que ela    │
   * │ criou não é lixo de leitura, é trabalho dela. Continua sujeita a      │
   * │ todos os avisos — o que muda é só o direito de existir vazia.         │
   * └────────────────────────────────────────────────────────────────────┘
   */
  manual?: boolean;
};

/** O cabeçalho do documento, quando ele traz um. */
export type CabecalhoExtraido = {
  titulo: CampoExtraido | null;
  categoria: CampoExtraido | null;
  rendimento: CampoExtraido | null;
  porcaoGramas: CampoExtraido | null;
};

/**
 * O QUE O EXTRATOR DEVOLVE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA ESTRUTURA TEM UM CAMPO DE "NÃO DEU"                     │
 * │                                                                      │
 * │ `estado` existe porque a resposta honesta do extrator, muitas vezes,   │
 * │ não é um documento — é "não consegui". E há três modos distintos de    │
 * │ não conseguir, que pedem três atitudes diferentes dela:               │
 * │                                                                      │
 * │   INDISPONIVEL  nenhum leitor foi configurado. Não é falha: é o       │
 * │                 estado do sistema hoje, e a tela diz isso com todas    │
 * │                 as letras.                                            │
 * │                                                                      │
 * │   VAZIO         o arquivo foi lido e não havia texto. PDF digitalizado │
 * │                 (imagem) sem camada de texto cai aqui. Ela precisa     │
 * │                 saber que o caminho é digitar, não tentar de novo.     │
 * │                                                                      │
 * │   FALHOU        a leitura quebrou. Aqui "tente de novo" é conselho     │
 * │                 razoável, e é a diferença em relação ao caso acima.    │
 * │                                                                      │
 * │ Sem esse campo, os três virariam a mesma resposta vazia — e ela não    │
 * │ teria como saber se o problema é o arquivo, o sistema ou o momento.    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type ResultadoDaExtracao =
  | {
      estado: "OK";
      documento: DocumentoExtraido;
    }
  | { estado: "INDISPONIVEL"; motivo: string }
  | { estado: "VAZIO"; motivo: string }
  | { estado: "FALHOU"; motivo: string };

/**
 * O DOCUMENTO EXTRAÍDO.
 *
 * `textoBruto` é o que sobrou da leitura sem nenhum tratamento: o texto do PDF
 * em ordem de leitura. Ele existe por duas razões, e as duas importam.
 *
 * A primeira é HONESTIDADE COMERCIAL: se a extração estruturada falhar em achar
 * um dado que ESTÁ no documento, ela pode abrir o texto bruto e achá-lo. O dado
 * estava lá, e o sistema não pode fingir que não estava.
 *
 * A segunda é diagnóstico: quando a extração sai errada, é o texto bruto que
 * diz se o erro foi de leitura ou de interpretação.
 *
 * Ele NUNCA vai para a interface como está. Ver a nota de segurança em
 * `./seguranca.ts`: texto de PDF é dado, e dado não se renderiza como markup.
 */
export type DocumentoExtraido = {
  cabecalho: CabecalhoExtraido;
  linhas: readonly LinhaExtraida[];
  /** O texto do documento, sem tratamento. Guardado para conferência. */
  textoBruto: string;
  /** Quantas páginas o arquivo tinha, quando o extrator sabe contar. */
  paginas: number | null;
  /** Quem leu. Nome estável, para a tela dizer de onde veio o dado. */
  leitor: string;
};

/**
 * A INTERFACE DO EXTRATOR.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ELA É UM TIPO, E HOJE SÓ EXISTE UMA IMPLEMENTAÇÃO — QUE NÃO LÊ PDF   │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ "Nunca fingir análise de IA."                                     │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ Não há serviço de leitura contratado, e não há modelo configurado. A   │
 * │ implementação de hoje (`./leitor-local.ts`) devolve `INDISPONIVEL` com │
 * │ a razão escrita. Isso não é uma tela quebrada: é a resposta certa para │
 * │ um sistema sem leitor, e é melhor que uma heurística de regex          │
 * │ fingindo ser interpretação — que acertaria em três fichas e erraria    │
 * │ na quarta sem avisar.                                                  │
 * │                                                                      │
 * │ A interface existe AGORA porque é ela que faz a decisão de contratar   │
 * │ um serviço ser uma decisão de CONFIGURAÇÃO, e não de arquitetura.       │
 * │                                                                      │
 * │ `file` é `File` de propósito: é o que o navegador entrega no           │
 * │ `input`, com nome, tipo e tamanho — os três campos que a validação de   │
 * │ segurança precisa antes de qualquer leitura.                           │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type DocumentExtractor = {
  /** Nome estável do leitor, para a tela poder dizer qual foi usado. */
  readonly nome: string;
  /** O leitor está disponível neste ambiente? A tela pergunta ANTES de oferecer. */
  disponivel(): boolean;
  /** Por que ele não está disponível. Vazio quando está. */
  motivoDaIndisponibilidade(): string;
  extract(arquivo: File): Promise<ResultadoDaExtracao>;
};
