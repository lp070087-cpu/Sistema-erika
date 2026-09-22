import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { obterRepositorioOperacao } from "@/lib/dados";
import type { Material } from "@/lib/dados";
import { Aviso } from "@/components/ui/superficie";
import { PainelDaBiblioteca } from "./painel";
import { derivarPontosDeApoio } from "./pontos";

export const metadata: Metadata = { title: "Biblioteca" };

/**
 * BIBLIOTECA — o material de apoio, endereçado ao cliente certo.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA TELA RESOLVE, E O QUE ELA RECUSA FAZER                     │
 * │                                                                      │
 * │ O material já existe. Ela escreve guia de limpeza, checklist de        │
 * │ abertura e boas práticas — e publica. O que não existe é um lugar      │
 * │ onde cada material esteja ENDEREÇADO: este serve para o restaurante A, │
 * │ aquele é geral e serve a qualquer um.                                 │
 * │                                                                      │
 * │ Então a Biblioteca guarda o REGISTRO, não o material: título, tipo,    │
 * │ para que serve, a quem vale e ONDE ele está.                           │
 * │                                                                      │
 * │ ── O QUE ESTA TELA NÃO FAZ, E POR QUE NÃO É UMA FALTA ──────────────  │
 * │                                                                      │
 * │ Não há upload. Não há anexo. Não há campo de arquivo em lugar nenhum   │
 * │ do módulo, nem no tipo, nem no store, nem aqui.                       │
 * │                                                                      │
 * │ A tentação era clara e o estrago seria grande: um input de arquivo que │
 * │ guardasse o anexo em memória faria a tela mostrar o nome do arquivo    │
 * │ que ela subiu — e o arquivo sumiria ao recarregar. Ela acharia que     │
 * │ subiu uma coisa que não subiu, e a regra do projeto é explícita: não   │
 * │ fingir upload persistente.                                            │
 * │                                                                      │
 * │ O sistema já tinha a resposta certa: `Documento.arquivo` é `null` com  │
 * │ o comentário "Vazio nesta fase: não existe storage de arquivo". Não é  │
 * │ um campo faltando — é o campo dizendo a verdade. A Biblioteca segue    │
 * │ o mesmo desenho, e `onde` é o endereço por texto: o link do Drive,     │
 * │ onde no caderno, ou vazio quando o material existe e não foi           │
 * │ endereçado ainda.                                                      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A TELA ABRE ÚTIL COM O ACERVO VAZIO                           │
 * │                                                                      │
 * │ `mock/operacao.ts` não tem materiais, e nenhum foi inventado: um guia  │
 * │ com título e conteúdo fictícios seria material que ela não escreveu,   │
 * │ exibido como se fosse dela.                                           │
 * │                                                                      │
 * │ O que a tela faz com o que já existe: mostra os PONTOS DE APOIO — o    │
 * │ que no sistema de hoje já pede um material (ingrediente sem preço,     │
 * │ ficha sem custo fechado, praça sem tempo declarado). Cada um é uma     │
 * │ situação concreta que um material resolveria, tirada dos dados reais   │
 * │ do cliente, e não um exemplo genérico.                                 │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export default async function PaginaBiblioteca() {
  const operacao = obterRepositorioOperacao();

  const [clientes, fichas, ingredientes, processos] = await Promise.all([
    operacao.listarClientes(),
    operacao.listarFichas(),
    operacao.listarIngredientes(),
    operacao.listarProcessos(),
  ]);

  /*
    ── ONDE O ACERVO VAI NASCER ───────────────────────────────────────────
    Mesmo padrão da equipe e dos cardápios: a constante VISÍVEL em vez do
    campo omitido, para que ninguém adivinhe depois se o repositório não tem
    materiais ou se a página esqueceu de pedi-los.

    Quando houver `listarMateriais()`, esta linha vira chamada e a constante
    some.
  */
  const materiais: readonly Material[] = MATERIAIS_POR_ENQUANTO;

  /*
    ── OS PONTOS DE APOIO SÃO DERIVADOS, E NÃO UMA LISTA FIXA ────────────
    Eles saem dos dados que o cliente JÁ tem, e por isso mudam com ele: uma
    ficha sem itens preenchidos é um ponto de apoio real, e o material que o
    resolve é o que ela escreveria. A lista fixa de "sugestões genéricas"
    seria a tela inventando problemas.

    A derivação mora em `./pontos` e não aqui: é regra pura, sem React e sem
    repositório, e assim ela pode ser exercitada pela bancada. Uma função que
    só existe dentro de um arquivo de página não pode ser conferida.
  */
  const pontos = derivarPontosDeApoio({ clientes, fichas, ingredientes, processos });

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo="Sistema"
        titulo="Biblioteca"
        descricao="Material de apoio reaproveitável entre clientes — guias, checklists, procedimentos e boas práticas. O sistema guarda o registro e o endereço de cada um; o material continua onde você já o mantém."
      />

      {materiais.length === 0 ? (
        <Aviso tom="info" titulo="Nenhum material registrado ainda — e a tela já serve">
          O repositório não devolve materiais, e nenhum foi inventado: um guia com título e
          conteúdo fictícios seria material que você não escreveu, exibido como se fosse seu. O
          que já funciona é a lista de pontos de apoio ao lado — situações concretas dos seus
          clientes que pedem um material, e por onde vale começar a registrar.
        </Aviso>
      ) : null}

      <PainelDaBiblioteca
        doCenario={{ materiais, clientes, pontos }}
      />
    </div>
  );
}

/**
 * OS MATERIAIS DO CENÁRIO — hoje nenhum.
 *
 * O nome diz o que a lista é, para que ninguém a confunda com material real ao
 * ler o código. Vale mais aqui do que nos outros módulos: material de apoio é
 * CONTEÚDO dela, e um título inventado apareceria na tela como se ela o tivesse
 * escrito.
 */
const MATERIAIS_POR_ENQUANTO: readonly Material[] = [];
