import type { Metadata } from "next";
import { obterRepositorioOperacao } from "@/lib/dados";
import { DetalheDoIngrediente } from "./detalhe";

export const metadata: Metadata = { title: "Ingrediente" };

/**
 * O INSUMO — a casca de servidor.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA PÁGINA QUASE NÃO FAZ NADA                               │
 * │                                                                      │
 * │ Ela lê o cenário e entrega. É o mínimo que um servidor pode fazer     │
 * │ aqui, e é de propósito: tudo o que a tela MOSTRA depende do estado    │
 * │ demonstrativo — "o preço foi atualizado agora nesta sessão?", "este   │
 * │ insumo foi cadastrado há dois minutos?" —, e esse estado só existe no │
 * │ navegador.                                                            │
 * │                                                                      │
 * │ Uma tela de servidor decidiria o preço vigente a partir do cenário e   │
 * │ ficaria mostrando o preço antigo depois de alguém salvar o novo.       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O `notFound()` NÃO ACONTECE AQUI — E ISSO IMPORTA                     │
 * │                                                                      │
 * │ Seria natural chamar `notFound()` quando o repositório não conhece o   │
 * │ id. Mas o insumo cadastrado nesta sessão não está no repositório: só   │
 * │ existe no navegador. Um 404 aqui derrubaria justamente o insumo que a  │
 * │ consultora acabou de cadastrar — e cadastrar levaria a uma página de   │
 * │ erro.                                                                 │
 * │                                                                      │
 * │ Então o servidor só diz o que sabe: o cenário tem ou não tem esse      │
 * │ insumo. Quem decide se o id é válido é a tela, que conhece as duas     │
 * │ fontes — e ela mostra "insumo não encontrado" apenas quando as duas    │
 * │ não o têm.                                                            │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Props = { params: Promise<{ id: string }> };

export default async function PaginaIngrediente({ params }: Props) {
  const { id } = await params;
  const operacao = obterRepositorioOperacao();
  const doCenario = await operacao.obterIngredienteEmUso(id);

  return <DetalheDoIngrediente id={id} doCenario={doCenario} />;
}
