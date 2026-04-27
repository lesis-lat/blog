---
layout: post
title: 'Primitivas e vulnerabilidades'
lang: pt
category: Pesquisa
excerpt: 'Como pensar em primitivas ajuda a transformar discrepâncias entre intenção e comportamento real em análise de impacto.'
author: Heitor Gouvêa
author-info:
  name:  Heitor Gouvêa
  image:  heitor-gouvea.jpeg
  description: Pesquisador, com background em engenharia de software. O foco da pesquisa de Gouvêa é a descoberta de vulnerabilidade em aplicações modernas e desenvolvimento de ferramentas e exploits. 
  linkedin: htrgouvea
date: 2026-04-26 16:20:00 -0300
---

### Introdução

Na última semana, testei o uso de LLMs para apoiar no processo de pesquisa de vulnerabilidades. Isso me fez pensar: como "ensinar" o modelo a realmente ajudar a encontrar bugs válidos?

Refleti sobre o meu próprio processo: como analiso código, modelo ameaças e chego ao ponto em que algo se torna, de fato, uma vulnerabilidade.

### Entendendo, ou criando, primitivas

Em resumo, percebi que tento responder a três perguntas durante as análises:

1. O que esse código, feature, componente ou endpoint está tentando fazer?
2. O que ele realmente faz?
3. O que é possível fazer com ele?

Escolho uma primitiva: a menor parte do sistema que executa uma ação, como uma função, endpoint ou componente. Primeiro tento entender o que ela deveria fazer, usando documentação, nomes e contexto.

Depois observo o que ela realmente faz: executo, testo entradas válidas e inválidas, inspeciono logs e comparo com o comportamento esperado.

Quando encontro uma discrepância entre intenção e realidade, me pergunto: o que dá para fazer com isso? A partir daí mapeio o que um ator malicioso poderia controlar, quais ações ele conseguiria executar e qual seria o impacto.

Se essa diferença permite causar um impacto real, então é uma vulnerabilidade.

Pequenas discrepâncias isoladas às vezes não geram impacto relevante, mas quando encadeadas quase sempre revelam vetores interessantes. Após o olhar no micro, é preciso ter um entendimento do macro: como todas essas primitivas podem ser combinadas.

Agora estou usando alguns prompts que gerei a partir desse entendimento no dia a dia, de maneira automatizada e integrada ao meu workflow. Eles me apoiam no entendimento mais rápido de componentes, na sugestão de entradas de dados mais contextuais, na criação de entradas de teste e na tradução de discrepâncias em possíveis cenários.

### Um exemplo simples

Em uma análise passada, testei uma aplicação web e identifiquei uma tela de login. Fiz vários testes, incluindo o uso de um e-mail válido com senhas incorretas, tentando gerar feedbacks diferentes da aplicação para entender melhor o comportamento do fluxo.

Depois de mais de cinco tentativas de login com a senha errada, a aplicação retornou um aviso: a conta estava bloqueada porque o limite de tentativas havia sido excedido.

Pela primeira pergunta, a intenção parecia clara: esse controle existia para prevenir ataques de força bruta.

Pela segunda pergunta, o comportamento real tinha detalhes importantes. O bloqueio não expirava automaticamente, o usuário não tinha uma forma simples de desbloquear a própria conta e nenhuma notificação era enviada por e-mail avisando sobre o bloqueio. Para recuperar o acesso, era necessário entrar em contato com o suporte.

Pela terceira pergunta, o impacto possível ficava mais claro. Um ator malicioso não precisava descobrir a senha nem acessar a conta. Bastava conhecer ou enumerar e-mails válidos e realizar tentativas de login com senhas incorretas para bloquear contas reais. Um controle criado para proteger contra força bruta poderia ser usado como uma primitiva de negação de serviço contra usuários legítimos.

### Conclusão

Pensar em primitivas ajuda a transformar a análise em um processo mais explícito. Em vez de olhar para o sistema apenas como um conjunto grande e complexo de funcionalidades, passo a observar pequenas ações, comparar intenção e realidade, e depois entender como essas diferenças podem ser usadas.

Esse raciocínio é útil para pesquisa manual e também para o uso de LLMs. Quanto melhor eu consigo descrever a primitiva, sua intenção, seu comportamento real e seu possível impacto, melhor consigo usar modelos e automações como apoio ao processo de investigação. No fim, encontrar vulnerabilidades continua dependendo de julgamento técnico, mas estruturar o caminho até elas torna esse julgamento mais claro, repetível e comunicável.
