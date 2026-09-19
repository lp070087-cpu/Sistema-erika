import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Aviso } from "@/components/ui/superficie";
import { obterRepositorioOperacao } from "@/lib/dados";
import { FUSO_HORARIO } from "@/lib/configuracao-publica";
import { FormularioContrato } from "./formulario";

export const metadata: Metadata = { title: "Novo contrato" };

/**
 * NOVO CONTRATO — a rota própria.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO VIROU PÁGINA, E NÃO CONTINUOU SENDO GAVETA              │
 * │                                                                      │
 * │ A versão anterior era uma gaveta lateral com sete campos. Cabia. O    │
 * │ que não cabia era o CRONOGRAMA: uma lista de parcelas que cresce e    │
 * │ encolhe, cada uma com descrição, valor e vencimento próprios, mais os │
 * │ três totais que precisam ficar visíveis enquanto se digita.           │
 * │                                                                      │
 * │ Numa gaveta de 480px, cada parcela vira uma pilha de três campos e o  │
 * │ total sai da vista — que é exatamente o número que se está tentando   │
 * │ fazer fechar. Numa página, o cronograma respira e os totais ficam ao  │
 * │ lado dele.                                                            │
 * │                                                                      │
 * │ A REGRA QUE NÃO MUDOU: nada aqui é gravado. A faixa de demonstração e │
 * │ os três avisos dentro do formulário continuam dizendo isso, pelo      │
 * │ mesmo motivo de antes — a gaveta antiga fazia isso em três lugares    │
 * │ porque cada um pega uma pessoa diferente.                             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA TELA NÃO FAZ                                              │
 * │                                                                      │
 * │ Não emite cobrança, não fala com banco, não gera PDF e não pede       │
 * │ assinatura. Ela MONTA o combinado: quem, o quê, quanto, em quantas    │
 * │ vezes e quando. Gravar é o passo do banco de dados, que ainda não     │
 * │ está conectado.                                                       │
 * │                                                                      │
 * │ Nenhum valor aparece pré-preenchido. Não existe tabela de preço da    │
 * │ Érika em lugar nenhum deste sistema — um número sugerido aqui seria   │
 * │ lido como o preço dela.                                               │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export default async function PaginaNovoContrato() {
  const clientes = await obterRepositorioOperacao().listarClientes();

  /**
   * A data de hoje vem do SERVIDOR, no fuso da marca.
   *
   * Se o formulário chamasse `new Date()` sozinho, o HTML do servidor (UTC)
   * e o do navegador (fuso dela) poderiam discordar sobre que dia é hoje —
   * e o React resolveria a discordância reclamando no console, no meio do
   * preenchimento. O servidor calcula uma vez, no fuso certo, e passa.
   */
  const hoje = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_HORARIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return (
    <div className="space-y-6">
      <Link
        href="/contratos"
        className="inline-flex items-center gap-2 text-[0.8125rem] text-[var(--tinta-suave)] transition-colors hover:text-tinta"
      >
        <span aria-hidden>←</span> Voltar para os contratos
      </Link>

      <CabecalhoPagina
        rotulo="Contratos"
        titulo="Novo contrato"
        descricao="Monte o combinado: quem contrata, o que foi contratado, quanto custa, em quantas vezes e quando cada parcela vence."
      />

      {clientes.length === 0 ? (
        <Aviso tom="atencao" titulo="Nenhum cliente na carteira ainda">
          <p>
            Um contrato precisa de um cliente do outro lado. Não há nenhum
            cadastrado, então não há a quem vincular este contrato.
          </p>
          <p className="mt-2.5">
            <Link href="/clientes" className="font-medium text-oliva hover:underline">
              Ver a carteira de clientes
            </Link>
          </p>
        </Aviso>
      ) : (
        <FormularioContrato
          clientes={clientes.map((c) => ({
            id: c.id,
            nome: c.nomeFantasia,
            contato: c.nomeContato,
          }))}
          hoje={hoje}
        />
      )}
    </div>
  );
}
