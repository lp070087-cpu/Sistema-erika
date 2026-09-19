import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Aviso, Painel, Secao } from "@/components/ui/superficie";
import { BotaoLink } from "@/components/ui/botao";
import {
  AbrirLink,
  CompartilharPublico,
  CopiarLink,
  EnderecoPublico,
} from "@/components/ui/link-publico";
import {
  DIAGNOSTICO_ROTA_INTERNA,
  SITE_PUBLICO_ROTULO,
  SITE_PUBLICO_URL,
  SUGESTAO_BIO_INSTAGRAM,
  estadoDoDiagnostico,
} from "@/lib/configuracao-publica";
import { BioInstagram } from "./bio";

export const metadata: Metadata = { title: "Meu site" };

/**
 * MEU SITE — a tela de divulgação.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTA TELA É A PONTE ENTRE OS DOIS PRODUTOS                            │
 * │                                                                      │
 * │ O sistema tem duas metades que vivem separadas: o SITE, onde o        │
 * │ cliente chega, e o SISTEMA, onde a consultora trabalha. A ponte entre  │
 * │ os dois é um endereço — e é isso que a Érika precisa ter em mãos       │
 * │ quando alguém pergunta "onde eu vejo o seu trabalho?".                │
 * │                                                                      │
 * │ Por isso a tela faz uma coisa só, e faz óbvio: mostra o endereço,      │
 * │ deixa copiar, deixa abrir, e mostra onde usá-lo. Nada de painel de     │
 * │ métricas, nada de gráfico — quem abre esta tela quer uma coisa e       │
 * │ quer em cinco segundos.                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O DIAGNÓSTICO APARECE AQUI SEM LINK PÚBLICO                  │
 * │                                                                      │
 * │ A tela mostra DOIS endereços, e só um deles existe hoje. O site está  │
 * │ no ar; o diagnóstico público depende de o sistema ser publicado, e     │
 * │ isso ainda não aconteceu.                                             │
 * │                                                                      │
 * │ A tentação seria oferecer o endereço local de desenvolvimento para o  │
 * │ botão funcionar. Não: um endereço que só abre na máquina dela é pior   │
 * │ do que nenhum, porque ela o mandaria para um cliente. Então o botão   │
 * │ de copiar fica DESABILITADO com a razão escrita, e o de abrir usa a   │
 * │ rota interna — que é exatamente o que o cliente vai ver, só que sem   │
 * │ sair do sistema.                                                      │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export default function PaginaMeuSite() {
  const diagnostico = estadoDoDiagnostico();

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo="Divulgação"
        titulo="Meu site"
        descricao="O endereço do seu site e o caminho do diagnóstico gratuito. É daqui que você copia o link para a bio, o WhatsApp e as redes."
      />

      {/* ── O SITE ─────────────────────────────────────────────────────── */}
      <Secao
        rotulo="Site público"
        titulo="Seu site de consultoria"
        descricao="É a página que seus clientes veem. Já está publicada e no ar."
      >
        <div className="rounded-[var(--raio)] border border-[var(--linha-forte)] bg-[rgba(242,236,226,0.5)] px-4 py-4">
          <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
            Endereço
          </p>
          <EnderecoPublico url={SITE_PUBLICO_URL} className="mt-2" />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <CopiarLink texto={SITE_PUBLICO_URL} rotulo="Copiar link" />
            <AbrirLink url={SITE_PUBLICO_URL} variante="secundario">
              Abrir site
            </AbrirLink>
            <CompartilharPublico
              url={SITE_PUBLICO_URL}
              titulo={`${SITE_PUBLICO_ROTULO} — Consultoria Gastronômica`}
              rotulo="Compartilhar"
            />
          </div>
        </div>
      </Secao>

      {/* ── COMO DIVULGAR ──────────────────────────────────────────────── */}
      <Secao
        rotulo="Como divulgar"
        titulo="Divulgue seu site"
        descricao="Use este link na bio do Instagram, envie pelo WhatsApp ou compartilhe diretamente com seus clientes."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Onde
            titulo="Instagram"
            texto="Na bio do perfil e nos stories, quando quiser levar alguém para a página."
          />
          <Onde
            titulo="WhatsApp"
            texto="Ao responder alguém que perguntou sobre o seu trabalho, ou na conversa de um orçamento."
          />
          <Onde
            titulo="Redes e clientes"
            texto="No direct, em grupos, e no e-mail de proposta que você já manda."
          />
        </div>
      </Secao>

      {/* ── BIO DO INSTAGRAM ───────────────────────────────────────────── */}
      <Secao
        rotulo="Bio do Instagram"
        titulo="Sugestão para a sua bio"
        descricao="Um texto curto para acompanhar o link. Copie, ajuste como quiser e cole no perfil — o sistema não acessa nem altera o seu Instagram."
      >
        <BioInstagram texto={SUGESTAO_BIO_INSTAGRAM} />
      </Secao>

      {/* ── DIAGNÓSTICO ────────────────────────────────────────────────── */}
      <Secao
        rotulo="Diagnóstico gratuito"
        titulo="O caminho que o cliente percorre"
        descricao="Quando alguém clica em “Diagnóstico gratuito” no seu site, é este formulário que abre. As respostas chegam no sistema como um lead para você analisar."
      >
        {diagnostico.disponivel ? (
          <div className="rounded-[var(--raio)] border border-[var(--linha-forte)] bg-[rgba(242,236,226,0.5)] px-4 py-4">
            <EnderecoPublico url={diagnostico.url} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <CopiarLink texto={diagnostico.url} rotulo="Copiar link" />
              <AbrirLink url={diagnostico.url} variante="secundario">
                Abrir diagnóstico
              </AbrirLink>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] bg-[rgba(242,236,226,0.4)] px-4 py-4">
              <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
                Endereço público
              </p>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-[var(--tinta-suave)]">
                {diagnostico.motivo}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {/*
                  O botão existe e está desabilitado, com o motivo ao lado. Um
                  botão que some deixa dúvida sobre se ele existe; um botão
                  desabilitado com a razão escrita é informação.
                */}
                <CopiarLink
                  texto=""
                  rotulo="Copiar link do diagnóstico"
                  variante="secundario"
                  className="pointer-events-none opacity-40"
                />
                <BotaoLink href={DIAGNOSTICO_ROTA_INTERNA} variante="primario">
                  Abrir diagnóstico
                </BotaoLink>
              </div>
              <p className="mt-3 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
                “Abrir diagnóstico” mostra exatamente o que o cliente vê — a mesma
                tela que vai para o ar quando o sistema for publicado.
              </p>
            </div>
          </div>
        )}
      </Secao>

      <Painel>
        <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
          O que este link não faz
        </p>
        <p className="mt-2.5 max-w-[80ch] text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
          Ele não cria site novo, não publica nada e não altera a sua página. O
          endereço é o do site que já está no ar — esta tela serve para você ter
          ele à mão, junto com o caminho do diagnóstico. Nada aqui é enviado nem
          publicado em nenhum lugar.
        </p>
        <div className="mt-4">
          <Aviso tom="atencao" titulo="O endereço é real; os clientes são exemplo">
            O endereço abaixo já pode ser divulgado — ele é o do seu site no ar.
            Os clientes que aparecem dentro do sistema, não: são um cenário de
            exemplo.
          </Aviso>
        </div>
      </Painel>
    </div>
  );
}

function Onde({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-3.5">
      <p className="text-[0.875rem] font-semibold text-tinta">{titulo}</p>
      <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">{texto}</p>
    </div>
  );
}
