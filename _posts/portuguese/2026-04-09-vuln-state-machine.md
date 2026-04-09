---
layout: post
title: 'Máquina de estados para gestão de vulnerabilidades'
og_image: /assets/publications/vuln-state-machine/state-machine.png
lang: pt
category: Pesquisa
author: Heitor Gouvêa
author-info:
  name:  Heitor Gouvêa
  image:  heitor-gouvea.jpeg
  description: Pesquisador, com background em engenharia de software. O foco da pesquisa de Gouvêa é a descoberta de vulnerabilidade em aplicações modernas e desenvolvimento de ferramentas e exploits. 
  linkedin: htrgouvea
date: 2026-04-09 00:00:00 -0300
---

Em muitas organizações, o processo de gestão de vulnerabilidades sofre com um problema recorrente — mas frequentemente negligenciado: a inconsistência na definição e no uso de status. É comum ver os mesmos status sendo usados com significados diferentes por equipes distintas, ou existir status redundantes, mal definidos ou desnecessários, que mais confundem do que ajudam. Isso compromete a rastreabilidade, dificulta a comunicação entre áreas, inviabiliza métricas confiáveis e enfraquece a capacidade da organização de responder a riscos reais.

Para enfrentar esse cenário, adotar uma máquina de estados formalizada é uma estratégia eficaz. De forma clara e objetiva, ela representa o ciclo de vida de uma vulnerabilidade: cada transição tem significado preciso, e todos os times compartilham o mesmo entendimento sobre o que cada status representa.

O fluxo começa com **Draft**, que indica um rascunho em construção pelo analista/pentester. A vulnerabilidade ainda está sendo documentada e não foi submetida à triagem — pode faltar contexto, evidências ou detalhes técnicos. Após essa etapa, passa para **Identified**, quando se avaliam impacto e prioridade. Se for encaminhada para correção, assume o status **Fixing**, refletindo o trabalho ativo de mitigação. Durante o processo, pode-se identificar que se trata de uma repetição de um caso anterior, passando então para **Duplicated**. Se a análise mostrar que não há risco real — por exemplo, devido a uma condição de exploração inviável — o status passa a **False Positive**. Em certos casos, a organização opta por aceitar o risco, seja por limitações técnicas, custo de correção ou impacto considerado baixo; nesses casos, o status é **Accepted Risk**. Após a correção, a falha entra em **Retest**, sendo reavaliada. Se validada, o processo se encerra com o status **Fixed**.

A definição rigorosa dessa máquina de estados não é burocracia: é uma fundação necessária. Ao eliminar ambiguidades e redundâncias, ela melhora a colaboração entre áreas, reduz retrabalho e viabiliza decisões mais bem embasadas. Também permite gerar métricas consistentes, úteis para identificar gargalos, medir eficiência e sustentar auditorias.

Essa proposta de máquina de estados é, ao mesmo tempo, enxuta e completa. É o modelo mais eficaz que já encontrei na prática: simples o bastante para adoção rápida e abrangente o suficiente para cobrir os principais cenários. Tem se mostrado um excelente ponto de partida para padronizar processos, fortalecer a governança e facilitar a integração entre segurança, produto e engenharia.

Abaixo, o diagrama que representa esse fluxo:

![](/assets/publications/vuln-state-machine/state-machine.png)
