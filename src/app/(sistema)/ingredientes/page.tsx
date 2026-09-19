import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Secao } from "@/components/ui/superficie";
import { obterRepositorioOperacao } from "@/lib/dados";
import { ListaDeIngredientes } from "./lista";

export const metadata: Metadata = { title: "Ingredientes" };

/**
 * BIBLIOTECA DE INGREDIENTES — a porta de entrada do motor de custos.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O HISTÓRICO DE PREÇO É O MÓDULO MAIS ÚTIL DAQUI              │
 * │                                                                      │
 * │ Redigitar preço em cada ficha é o trabalho que mais consome tempo     │
 * │ numa consultoria de custos — e o que mais erra, porque um preço       │
 * │ digitado em janeiro continua na ficha em junho sem ninguém notar.     │
 * │                                                                      │
 * │ Com o preço datado num lugar só, a ficha aponta para ele em vez de    │
 * │ copiá-lo. É o que o botão de atualizar preço alimenta: o que estava   │
 * │ valendo desce para o histórico, com a data dele, e o novo assume o    │
 * │ topo. Nada é sobrescrito.                                             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA PÁGINA FAZ, E O QUE ELA DELEGA                            │
 * │                                                                      │
 * │ Ela lê o repositório — uma leitura, no servidor — e entrega o cenário │
 * │ pronto. Toda a interação (cadastrar insumo, atualizar preço, filtrar) │
 * │ vive em componentes de cliente, porque é lá que o estado              │
 * │ demonstrativo existe.                                                 │
 * │                                                                      │
 * │ A divisão não é preferência de estilo: `demonstracao.ts` é um módulo  │
 * │ de navegador, com estado em memória. Lê-lo do servidor daria a cada   │
 * │ requisição um estado vazio — e a tela diria que nada foi alterado     │
 * │ mesmo depois de a consultora ter alterado.                            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A VARIAÇÃO DE PREÇO NÃO É UM ALERTA                                  │
 * │                                                                      │
 * │ A lista mostra o preço atual, o anterior e a diferença. Não há        │
 * │ "subiu muito!", não há farol vermelho, não há classificação. Um       │
 * │ insumo que subiu 12% pode ser sazonal e não significar nada — quem    │
 * │ sabe julgar isso é a consultora, olhando o contexto do cliente.       │
 * │                                                                      │
 * │ O sistema faz a subtração. A leitura é dela.                          │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function PaginaIngredientes({ searchParams }: Props) {
  const { q } = await searchParams;
  const operacao = obterRepositorioOperacao();

  const ingredientes = await operacao.listarIngredientes();

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo="Técnico"
        titulo="Biblioteca de ingredientes"
        descricao="O preço de cada insumo com a data em que passou a valer, e o que ele rende entre a compra e o prato. É a base de todo custo de ficha: nenhum insumo é digitado duas vezes."
      />

      <ListaDeIngredientes doCenario={ingredientes} buscaInicial={q ?? ""} />

      <Secao
        rotulo="Por que a data importa"
        titulo="O preço sem data não serve para nada"
        descricao="É a diferença entre uma planilha de preços e um histórico de preços."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-red-800/50 bg-[rgba(153,27,27,0.04)] px-4 py-4">
            <p className="text-[0.6875rem] font-semibold tracking-[0.13em] text-[var(--tinta-fraca)] uppercase">
              Preço sem data
            </p>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              A mussarela está R$ 42,90. Não se sabe desde quando. Se esse número
              entrou na ficha em março e o insumo subiu em maio, o custo do prato
              está errado há dois meses — e ninguém tem como perceber olhando a
              ficha.
            </p>
          </div>

          <div className="rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-oliva bg-[rgba(107,122,70,0.06)] px-4 py-4">
            <p className="text-[0.6875rem] font-semibold tracking-[0.13em] text-[var(--tinta-fraca)] uppercase">
              Preço com data
            </p>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              A mussarela está R$ 42,90 desde 09 de setembro, antes R$ 39,50
              desde 08 de agosto. Aí dá para ver a alta, saber em que fichas
              aquele preço entrou, e decidir se é hora de revisar.
            </p>
          </div>
        </div>
      </Secao>
    </div>
  );
}
