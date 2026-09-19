"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao, CampoTexto } from "@/components/ui/campo";
import { Gaveta } from "@/components/ui/gaveta";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import {
  ROTULO_MODALIDADE,
  ROTULO_SITUACAO_CLIENTE,
  ROTULO_TIPO_NEGOCIO,
} from "@/lib/dados";
import type {
  ClienteOperacao as Cliente,
  Modalidade,
  PorteEstabelecimento,
  SituacaoCliente,
  TipoServico,
} from "@/lib/dados";
import {
  salvarCadastroDoCliente,
  salvarInicioDoAtendimento,
} from "@/lib/dados/demonstracao";

/**
 * O CADASTRO DO CLIENTE — os dados que a consultora corrige.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE FORMULÁRIO EXISTE                                        │
 * │                                                                      │
 * │ O cliente entrava no sistema por dois caminhos — o lead convertido e   │
 * │ o cadastro à mão — e depois nenhum. O WhatsApp digitado errado na      │
 * │ conversão, o responsável que trocou de pessoa, a cidade que ela        │
 * │ escreveu errada, o porte declarado por telefone e revisto depois:      │
 * │ nada disso tinha uma ação. O cadastro era um retrato do dia em que     │
 * │ ele nasceu, e o atendimento acontece durante meses.                    │
 * │                                                                      │
 * │ Um cliente de 96 dias tinha a mesma ficha do dia 1 — sem as fichas,    │
 * │ sem os acompanhamentos, sem as correções que a convivência produz.     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE FORMULÁRIO NÃO DEIXA EDITAR, E POR QUÊ                     │
 * │                                                                      │
 * │   · O IDENTIFICADOR. É o que liga a ficha, o processo, o contrato e    │
 * │     o acompanhamento a este cliente. Editá-lo quebraria todas as       │
 * │     ligações de uma vez, em silêncio — as listas ficariam vazias e     │
 * │     nada na tela explicaria por quê.                                   │
 * │                                                                      │
 * │   · A ORIGEM E O LEAD DE ORIGEM. Registram DE ONDE o cliente veio.     │
 * │     Mudá-los não corrige um dado: reescreve a aquisição. Se ele veio   │
 * │     do formulário do site, o diagnóstico dele continua sendo a         │
 * │     evidência de que veio — e trocar a origem faria a história          │
 * │     discordar do documento que a sustenta.                             │
 * │                                                                      │
 * │   · A ÚLTIMA ATIVIDADE. É consequência do que aconteceu no sistema,    │
 * │     não campo. Ela muda quando uma ficha é escrita ou uma tarefa é     │
 * │     concluída; digitá-la à mão faria o indicador discordar do fato     │
 * │     que ele existe para medir.                                         │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O INÍCIO DO ATENDIMENTO SAI NUM SEGUNDO CAMPO, SOZINHO        │
 * │                                                                      │
 * │ Ele é editável, e é o campo mais consequente desta gaveta: a           │
 * │ carteira mostra "desde quando" a partir dele, e ele é a data que       │
 * │ ancora todo o histórico de 96 dias do cliente.                         │
 * │                                                                      │
 * │ Mas ele não é da mesma família dos outros. Nome, telefone e cidade     │
 * │ são dados que ela CORRIGE — ela dá e ela tira. A data é quando o       │
 * │ trabalho começou: mexer nela REFAZ o começo da história.               │
 * │                                                                      │
 * │ Ele fica num campo do próprio formulário, com explicação própria, em   │
 * │ vez de escondido numa gaveta separada que ela nunca abriria. O que     │
 * │ não pode é ser silencioso — e não é: o campo diz o que muda.           │
 * └──────────────────────────────────────────────────────────────────────┘
 */

const SITUACOES: readonly SituacaoCliente[] = [
  "ATIVO",
  "EM_IMPLANTACAO",
  "PAUSADO",
  "ENCERRADO",
];

const MODALIDADES: readonly Modalidade[] = ["PRESENCIAL", "ONLINE", "MISTA"];

const TIPOS: readonly TipoServico[] = [
  "BUFFET",
  "A_LA_CARTE",
  "BUFFET_E_A_LA_CARTE",
  "DELIVERY",
  "OUTRO",
];

const PORTES: readonly PorteEstabelecimento[] = ["PEQUENO", "MEDIO", "GRANDE"];

const ROTULO_PORTE: Record<PorteEstabelecimento, string> = {
  PEQUENO: "Pequeno",
  MEDIO: "Médio",
  GRANDE: "Grande",
};

type Rascunho = {
  nomeFantasia: string;
  nomeContato: string;
  whatsapp: string;
  email: string;
  cidade: string;
  tipoNegocio: TipoServico;
  porte: PorteEstabelecimento;
  modalidade: Modalidade;
  situacao: SituacaoCliente;
  funcionariosDeclarados: string;
  problemaDeclarado: string;
  iniciadoEm: string;
};

/**
 * Uma data vira texto de `<input type="date">`, que só aceita `aaaa-mm-dd`.
 *
 * Usa os componentes LOCAIS da data, e não `toISOString()`. O `toISOString`
 * converte para UTC antes de formatar, e no fuso do Brasil — três horas
 * atrás — uma data gravada à meia-noite local volta como o dia anterior.
 * Abrir a gaveta e salvar sem tocar em nada moveria o início do atendimento
 * um dia para trás, sem ninguém ter pedido.
 */
function dataNoCampo(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** O caminho de volta: `aaaa-mm-dd` no fuso local, sem passar por UTC. */
function campoParaData(texto: string): Date | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) return null;

  const ano = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const d = new Date(ano, mes - 1, dia);

  // `new Date(2026, 1, 31)` vira 3 de março e não avisa. A conferência de
  // volta é o que separa "data inválida" de "data que o construtor aceitou".
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) {
    return null;
  }
  return d;
}

function rascunhoDe(cliente: Cliente): Rascunho {
  return {
    nomeFantasia: cliente.nomeFantasia,
    nomeContato: cliente.nomeContato,
    whatsapp: cliente.whatsapp,
    email: cliente.email,
    cidade: cliente.cidade,
    tipoNegocio: cliente.tipoNegocio,
    porte: cliente.porte,
    modalidade: cliente.modalidade,
    situacao: cliente.situacao,
    funcionariosDeclarados: cliente.funcionariosDeclarados,
    problemaDeclarado: cliente.problemaDeclarado,
    iniciadoEm: dataNoCampo(cliente.iniciadoEm),
  };
}

export function IdentidadeDoCliente({
  cliente,
  aoSalvar,
}: {
  cliente: Cliente;
  /** Recebe a frase que a aba de histórico vai registrar como acontecimento. */
  aoSalvar: (oQue: string) => void;
}) {
  /*
    Assina o store: salvar repinta o cabeçalho da tela e a carteira, que são
    quem mostra o nome, a situação e o "desde quando" que esta gaveta acabou
    de alterar.
  */
  useDemonstracao();

  const [aberta, setAberta] = useState(false);
  const [rascunho, setRascunho] = useState<Rascunho>(() => rascunhoDe(cliente));

  const inicioLido = campoParaData(rascunho.iniciadoEm);
  const inicioInvalido = rascunho.iniciadoEm !== "" && inicioLido === null;

  function abrir() {
    // Abre com o que está lá: o mesmo motivo de toda gaveta do sistema.
    setRascunho(rascunhoDe(cliente));
    setAberta(true);
  }

  function salvar() {
    const nomeFantasia = rascunho.nomeFantasia.trim();
    if (nomeFantasia === "" || inicioLido === null) return;

    /*
      A GRAVAÇÃO É UMA SÓ, COM TUDO DENTRO.

      A tentação era gravar o cadastro e a data em duas chamadas. Só que a
      tela de histórico registra um fato por gravação, e duas chamadas
      custariam duas linhas — a segunda apagando a primeira, porque cada
      uma monta o histórico a partir do que estava lá no momento do render.

      Uma gravação, um fato, e a frase abaixo diz o que mudou. Quando nada
      mudou, ela diz isso também: um "salvo" sem alteração registrada seria
      uma alteração inventada.
    */
    const mudancas: string[] = [];
    if (nomeFantasia !== cliente.nomeFantasia) {
      mudancas.push(`nome para "${nomeFantasia}"`);
    }
    if (rascunho.nomeContato.trim() !== cliente.nomeContato) {
      mudancas.push("responsável");
    }
    if (rascunho.whatsapp.trim() !== cliente.whatsapp) mudancas.push("WhatsApp");
    if (rascunho.email.trim() !== cliente.email) mudancas.push("e-mail");
    if (rascunho.cidade.trim() !== cliente.cidade) mudancas.push("cidade");
    if (rascunho.tipoNegocio !== cliente.tipoNegocio) mudancas.push("tipo de negócio");
    if (rascunho.porte !== cliente.porte) mudancas.push("porte declarado");
    if (rascunho.modalidade !== cliente.modalidade) mudancas.push("modalidade");
    if (rascunho.situacao !== cliente.situacao) {
      mudancas.push(`situação para "${ROTULO_SITUACAO_CLIENTE[rascunho.situacao]}"`);
    }
    if (rascunho.funcionariosDeclarados.trim() !== cliente.funcionariosDeclarados) {
      mudancas.push("equipe declarada");
    }
    if (rascunho.problemaDeclarado.trim() !== cliente.problemaDeclarado) {
      mudancas.push("problema declarado");
    }
    const trocouInicio = inicioLido.getTime() !== cliente.iniciadoEm.getTime();
    if (trocouInicio) {
      mudancas.push(`início do atendimento para ${dataNoCampo(inicioLido).split("-").reverse().join("/")}`);
    }

    salvarCadastroDoCliente(cliente.id, {
      nomeFantasia,
      nomeContato: rascunho.nomeContato.trim(),
      whatsapp: rascunho.whatsapp.trim(),
      email: rascunho.email.trim(),
      cidade: rascunho.cidade.trim(),
      tipoNegocio: rascunho.tipoNegocio,
      porte: rascunho.porte,
      modalidade: rascunho.modalidade,
      situacao: rascunho.situacao,
      funcionariosDeclarados: rascunho.funcionariosDeclarados.trim(),
      problemaDeclarado: rascunho.problemaDeclarado.trim(),
    });

    if (trocouInicio) {
      /*
        A data tem gravação própria no store, e a chamada é separada de
        propósito: quem auditar o que a sessão mexeu precisa distinguir
        "corrigi o telefone" de "mudei quando o trabalho começou".

        O histórico da tela recebe as duas numa frase só, porque para ela
        foi um clique só.
      */
      salvarInicioDoAtendimento(cliente.id, inicioLido);
    }

    aoSalvar(
      mudancas.length === 0
        ? "Cadastro reaberto e salvo sem alteração."
        : `Cadastro alterado: ${mudancas.join(", ")}.`
    );

    setAberta(false);
  }

  return (
    <>
      <Botao variante="secundario" tamanho="sm" onClick={abrir}>
        Editar cadastro
      </Botao>

      <Gaveta
        aberta={aberta}
        aoFechar={() => setAberta(false)}
        titulo="Editar cadastro"
        descricao={`${cliente.nomeFantasia}. Os dados do cliente e o que ele declarou.`}
        acoes={
          <>
            <Botao variante="linha" tamanho="sm" onClick={() => setAberta(false)}>
              Cancelar
            </Botao>
            <Botao
              variante="primario"
              tamanho="sm"
              disabled={rascunho.nomeFantasia.trim() === "" || inicioInvalido}
              onClick={salvar}
            >
              Salvar cadastro
            </Botao>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              label="Nome do estabelecimento"
              name="nomeFantasia"
              value={rascunho.nomeFantasia}
              onChange={(e) => setRascunho((r) => ({ ...r, nomeFantasia: e.target.value }))}
              placeholder="Ex.: Quintal da Maria"
              obrigatorio
              ajuda="É o nome que aparece na carteira, nas fichas e na planilha."
            />
            <Campo
              label="Responsável"
              name="nomeContato"
              value={rascunho.nomeContato}
              onChange={(e) => setRascunho((r) => ({ ...r, nomeContato: e.target.value }))}
              placeholder="Quem atende pela casa"
              ajuda="A pessoa com quem se fala. Pode mudar sem o cliente mudar."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              label="WhatsApp"
              name="whatsapp"
              value={rascunho.whatsapp}
              onChange={(e) => setRascunho((r) => ({ ...r, whatsapp: e.target.value }))}
              placeholder="(51) 90000-0000"
            />
            <Campo
              label="E-mail"
              name="email"
              type="email"
              value={rascunho.email}
              onChange={(e) => setRascunho((r) => ({ ...r, email: e.target.value }))}
              placeholder="contato@exemplo.com.br"
            />
          </div>

          <Campo
            label="Cidade"
            name="cidade"
            value={rascunho.cidade}
            onChange={(e) => setRascunho((r) => ({ ...r, cidade: e.target.value }))}
            placeholder="Ex.: Novo Hamburgo"
            ajuda="Aparece na lista de clientes, ao lado do nome."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <CampoSelecao
              label="Tipo de negócio"
              name="tipoNegocio"
              value={rascunho.tipoNegocio}
              onChange={(e) =>
                setRascunho((r) => ({ ...r, tipoNegocio: e.target.value as TipoServico }))
              }
              opcoes={TIPOS.map((t) => ({ valor: t, texto: ROTULO_TIPO_NEGOCIO[t] }))}
            />
            <CampoSelecao
              label="Modalidade"
              name="modalidade"
              value={rascunho.modalidade}
              onChange={(e) =>
                setRascunho((r) => ({ ...r, modalidade: e.target.value as Modalidade }))
              }
              opcoes={MODALIDADES.map((m) => ({ valor: m, texto: ROTULO_MODALIDADE[m] }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CampoSelecao
              label="Porte"
              name="porte"
              value={rascunho.porte}
              onChange={(e) =>
                setRascunho((r) => ({ ...r, porte: e.target.value as PorteEstabelecimento }))
              }
              opcoes={PORTES.map((p) => ({ valor: p, texto: ROTULO_PORTE[p] }))}
              ajuda="Declarado por ele, não medido pelo sistema."
            />
            <Campo
              label="Equipe declarada"
              name="funcionariosDeclarados"
              value={rascunho.funcionariosDeclarados}
              onChange={(e) =>
                setRascunho((r) => ({ ...r, funcionariosDeclarados: e.target.value }))
              }
              placeholder='Ex.: "De 5 a 10"'
              ajuda="Como ele respondeu, em faixa. Não é uma contagem exata."
            />
          </div>

          <CampoSelecao
            label="Situação"
            name="situacao"
            value={rascunho.situacao}
            onChange={(e) =>
              setRascunho((r) => ({ ...r, situacao: e.target.value as SituacaoCliente }))
            }
            opcoes={SITUACOES.map((s) => ({ valor: s, texto: ROTULO_SITUACAO_CLIENTE[s] }))}
            ajuda="É você quem atribui. O sistema não muda a situação sozinho por data nem por falta de contato."
          />

          <CampoTexto
            label="Problema declarado"
            name="problemaDeclarado"
            rows={4}
            value={rascunho.problemaDeclarado}
            onChange={(e) =>
              setRascunho((r) => ({ ...r, problemaDeclarado: e.target.value }))
            }
            placeholder="O que ele disse que trava a operação, no dia em que virou cliente."
            ajuda="Aparece abaixo do nome do cliente e na aba de diagnóstico. É o resumo, não o formulário."
          />

          {/*
            A DATA, COM AVISO PRÓPRIO.

            Ela fica depois do resto e antes do aviso de sessão porque a
            consequência dela é de outra ordem — a explicação não é sobre
            não gravar, é sobre o que muda se ela mexer.
          */}
          <div className="border-t border-[var(--linha)] pt-5">
            <Campo
              label="Início do atendimento"
              name="iniciadoEm"
              type="date"
              value={rascunho.iniciadoEm}
              onChange={(e) => setRascunho((r) => ({ ...r, iniciadoEm: e.target.value }))}
              obrigatorio
              erro={
                inicioInvalido
                  ? "Esta data não existe no calendário."
                  : undefined
              }
              ajuda="O dia em que o trabalho começou — não o dia em que o cadastro foi feito."
            />
            <p className="mt-3 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              Esta data ancora o relacionamento inteiro: é dela que sai o{" "}
              <strong className="font-semibold text-tinta">
                “cliente desde”
              </strong>{" "}
              na carteira e na aba de diagnóstico. Corrigir aqui vale a pena
              quando o combinado foi feito antes do cadastro — mas o que ela
              não faz é mover histórico nenhum: as fichas, os processos e os
              acompanhamentos continuam com as datas em que aconteceram.
            </p>
          </div>

          <div className="rounded-[var(--raio)] border border-dashed border-dourado/60 bg-[rgba(201,165,78,0.07)] px-4 py-3.5">
            <p className="text-[0.8125rem] font-semibold text-tinta">
              O cadastro muda nesta sessão; o banco ainda não guarda
            </p>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              Ao salvar, o nome novo sobe para a carteira, o cabeçalho e as
              fichas deste cliente, e uma linha entra no histórico dele dizendo
              o que mudou. Recarregar a página devolve o estado inicial.
            </p>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              O identificador, a origem e a última atividade{" "}
              <strong className="font-semibold text-tinta">não</strong> se
              editam: os dois primeiros registram de onde ele veio, e o
              terceiro é consequência do que aconteceu no sistema.
            </p>
          </div>
        </div>
      </Gaveta>
    </>
  );
}
