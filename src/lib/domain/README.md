# Camada de domínio

Aqui vive a lógica de negócio gastronômica — e **nada mais**.

## Por que esta pasta está vazia na Fase 1

A Fase 0 levantou seis decisões que ainda não foram tomadas pela consultora.
Todas elas definem o formato dos dados ou o comportamento de um cálculo:

| Ponto | O que decide |
|---|---|
| **4** | Se existe índice de cocção, além do fator de correção |
| **5** | Se o fator de correção pertence ao ingrediente ou à linha da ficha |
| **6** | Qual é a fonte de verdade quando o F.C. diverge entre os dois lugares |
| **7** | Se o preço sai do CMV alvo ou do markup, e se o alvo é por cliente |
| **9** | Se o volume do cardápio é informado ou estimado |
| **19** | Se o sistema arredonda por linha ou só na exibição |

Implementar qualquer uma dessas regras agora seria **inventar regra
gastronômica** — exatamente o que foi proibido.

## A fronteira que o código deve respeitar

```
Componente visual   →  não importa daqui. Recebe valores já calculados por props.
Serviço (server)    →  orquestra: busca dados, chama o domínio, devolve pronto.
Domínio (aqui)      →  função pura, sem banco, sem React, sem I/O.
Dados (src/lib/db)  →  acesso ao banco, sem regra de negócio.
```

Uma função de domínio recebe números e devolve números. Se ela precisa
consultar o banco para decidir, a decisão está no lugar errado.

## O que já se sabe (verificado na Fase 0)

Estas relações foram **conferidas aritmeticamente** contra os prints da
planilha real e não são suposição. Podem ser implementadas na Fase 3,
depois que os pontos 4, 5, 6 e 19 forem respondidos, porque todos eles
alteram como estas linhas se combinam:

```
pesoBruto  = pesoLiquido × fatorCorrecao
custoItem  = pesoBruto × precoPorKg
custoTotal = Σ custoItem
```

Ficam **fora** desta lista, por dependerem de decisão pendente: qualquer
cálculo de CMV, markup, preço sugerido, margem, arredondamento e
resultado por volume.
