---
layout: post
title: 'Nossa primeira observação de um grupo malicioso assistido por IA mirando fintechs brasileiras de pequeno e médio porte'
lang: pt
category: Estudo de caso
excerpt: 'Investigação da LESIS identifica uma campanha maliciosa contra fintechs brasileiras de pequeno e médio porte, com uso de IA para acelerar tooling ofensivo, adaptação de payloads e apoio à exploração de aplicações.'
author: LESIS Team
author-info:
  name:  LESIS
  image:  favicon.png
  description: A LESIS é especializada em pesquisa aplicada com foco em tecnologias de segurança ofensiva que apoiam operações críticas.
  linkedin: lesis-lat
date: 2026-06-29 15:00:00 -0300
permalink: /blog/nossa-primeira-observação-de-um-grupo-malicioso-assistido-por-ia/
---

# Nossa primeira observação de um grupo malicioso assistido por IA mirando fintechs brasileiras de pequeno e médio porte

O trabalho da LESIS nos coloca, com frequência, em diferentes frentes de segurança ofensiva, resposta a incidentes e inteligência de ameaças. Em uma oportunidade recente, fomos acionados para apoiar uma investigação envolvendo uma instituição financeira brasileira. Nosso papel inicial era responder a uma pergunta objetiva: qual foi o vetor de entrada utilizado pelo agente malicioso?

Para isso, conduzimos uma análise orientada por simulação adversária. Partimos da mesma premissa operacional do atacante: comprometer uma aplicação ou recurso adjacente que permitisse, direta ou indiretamente, chegar a sistemas com potencial de movimentação financeira. Essa abordagem nos permitiu reconstruir parte da cadeia de ataque, identificar o vetor inicial e, posteriormente, localizar mecanismos de persistência usados pelo threat actor.

Durante a investigação, observamos que a persistência implantada pelo grupo se comunicava com infraestrutura externa controlada pelos operadores. A partir desse ponto, aprofundamos a análise da infraestrutura de comando e controle, com o objetivo de entender se havia elementos adicionais que pudessem contribuir para a resposta ao incidente e para a proteção de outros possíveis alvos.

Por razões operacionais, não iremos publicar IoCs, payloads, endereços, nomes de arquivos, caminhos internos ou detalhes que possam comprometer investigações. Ainda assim, os artefatos analisados revelaram um conjunto consistente de comportamentos, ferramentas e padrões de operação.

## O que foi observado

A infraestrutura analisada continha payloads, artefatos de apoio à exploração, logs de requisições, scripts de recebimento de dados e evidências de tentativas anteriores contra múltiplos alvos. Em alguns casos, a mesma infraestrutura mantinha informações relacionadas a mais de um alvo ou operação, incluindo tentativas mal sucedidas, atividades em andamento e dados obtidos após comprometimento.

A análise desses materiais nos levou a seis conclusões principais.

1. Os alvos observados eram fintechs brasileiras, em especial organizações de pequeno e médio porte, com menor exposição midiática e menor maturidade pública em segurança quando comparadas a grandes instituições financeiras.
2. As evidências indicam a atuação de um grupo, e não de um operador isolado. Essa avaliação é baseada em múltiplos sinais: diferentes identificadores de acesso, atividade concorrente partindo de origens distintas, padrões operacionais incompatíveis com uma única sessão humana contínua e diferenças estilométricas em artefatos de código.
3. Ao menos um dos operadores aparenta ter familiaridade com o português brasileiro. Essa conclusão vem do uso do idioma em artefatos operacionais e comentários observados durante a análise.
4. Identificamos evidências de uso de LLMs no apoio à construção de tooling ofensivo. Os artefatos indicam o uso de modelos de linguagem para auxiliar na criação ou adaptação de exploits, web shells, mecanismos de bypass, scripts de exfiltração e componentes auxiliares usados durante a operação.
5. Observamos tentativas de contornar guardrails de LLMs por meio de contextualização enganosa, em especial levando o modelo a operar sob a premissa de um pentest autorizado. Esse padrão é relevante porque mostra que o uso de IA pelo grupo não se limitou à produtividade: ele também foi incorporado ao processo de desenvolvimento ofensivo.
6. Um ponto relevante observado foi a duração de uma das operações associadas a esse conjunto de artefatos. Em um dos alvos, identificamos atividade distribuída ao longo de aproximadamente três meses, o que indica uma intenção direta e contínua contra a organização comprometida. Esse comportamento reduz a hipótese de uma tentativa oportunista isolada e reforça a avaliação de que o grupo mantinha interesse operacional no alvo, adaptando sua abordagem conforme encontrava barreiras, novas oportunidades de acesso e caminhos potenciais para ampliar o impacto.

## Cadeia de ataque

O vetor comum observado foi a exploração de vulnerabilidades em nível de aplicação. O grupo não parecia depender exclusivamente de aplicações diretamente ligadas a fluxos financeiros. Pelo contrário: buscava aplicações na mesma infraestrutura ou em ambientes adjacentes que pudessem servir como ponto de entrada para movimentação lateral.

Após o acesso inicial, o grupo procurava credenciais, arquivos de configuração, variáveis de ambiente, integrações internas e recursos de administração que pudessem ampliar o acesso.

Nos casos em que o comprometimento avançou, a persistência foi simples. Não observamos, nos artefatos analisados, um esforço sofisticado de ocultação. O objetivo parecia ser funcionalidade e velocidade operacional, não furtividade avançada. Isso não reduziu o impacto potencial da operação: mesmo implantes simples podem ser suficientes quando combinados com credenciais válidas, segmentação fraca, permissões excessivas e baixa visibilidade de tráfego egresso.

Em pelo menos um caso, os controles existentes impediram a comunicação direta entre o implante e a infraestrutura externa. A resposta do grupo foi adaptar a operação. Observamos tentativas de entrega de payloads blinds, probing de diferentes portas e ajustes sucessivos para entender o controle aplicado e decidir como contorná-lo. Esse comportamento indica capacidade operacional e persistência, ainda que o tooling em si não seja particularmente sofisticado.

Também observamos foco na exfiltração de credenciais. O grupo buscava acesso a outras aplicações e serviços usados por colaboradores da organização comprometida, sugerindo interesse em escalar o ataque para além do primeiro sistema explorado.

## Por que isso importa

Há três pontos que tornam essa campanha relevante:

1. O primeiro é a escolha dos alvos: as fintechs brasileiras de pequeno e médio porte podem operar ativos financeiros relevantes, integrações críticas e fluxos transacionais sensíveis, mas nem sempre possuem a mesma capacidade de detecção, resposta e hardening encontrada em grandes instituições financeiras. Isso cria uma superfície atrativa para grupos financeiramente motivados.
2. O segundo é o papel das aplicações como ponto de entrada: a operação reforça um padrão recorrente em muitas organizações, o caminho até o impacto financeiro não começa necessariamente no sistema financeiro principal. Ele pode começar em uma aplicação legada, um serviço administrativo, uma integração pouco monitorada ou um componente interno que compartilha infraestrutura com sistemas mais críticos.
3. O terceiro é o uso de IA como acelerador: o uso de LLMs não transforma automaticamente um operador comum em um ator avançado, mas reduz custo, acelera iteração e facilita a adaptação de tooling. Na prática, isso permite que grupos com capacidade intermediária produzam mais variações de payloads, testem hipóteses mais rapidamente e contornem obstáculos com menor dependência de conhecimento especializado profundo.

## TTPs observadas — MITRE ATT&CK

Descrição comportamental (TTPs) do grupo, não inclui IoCs (IPs, hashes, nomes de arquivos, caminhos internos ou nomes de vítimas).

| Tática | Técnica (ATT&CK) | Comportamento observado |
|---|---|---|
| Desenvolvimento de Recursos (TA0042) | Obtain Capabilities: Tool (T1588.002) | Uso de exploits públicos prontos em conjunto com scripts próprios (assistida por IA / agêntica) |
| Desenvolvimento de Recursos (TA0042) | Develop Capabilities (T1587) | Geração de tooling, playbooks e relatórios assistida por IA / agêntica |
| Acesso Inicial (TA0001) | Exploit Public-Facing Application (T1190) | Exploração em nível de aplicação contra serviços expostos (aplicações legadas e modernas) |
| Descoberta (TA0007) | Network Service Discovery (T1046) | Reconhecimento da rede interna, a partir do acesso obtido, contra serviços adjacentes |
| Execução / Movimentação Lateral (TA0002 / TA0008) | Server-Side abuse → console de administração (T1190 → T1505.003) | Pivô para console de administração/deploy a fim de implantar código |
| Persistência (TA0003) | Web Shell (T1505.003) + Masquerading (T1036) | Web shells disfarçados de endpoints legítimos da própria aplicação (health check) |
| Escalonamento de Privilégios (TA0004) | Escape to Host (T1611) | Acesso container-para-host por isolamento deficiente do contêiner |
| Acesso a Credenciais (TA0006) | Credentials in Files / Private Keys (T1552.001 / .004) | Coleta de credenciais em arquivos de configuração e chaves, e de segredos expostos em artefatos |
| Acesso a Credenciais (TA0006) | Steal Application Access Token (T1528) | Furto de tokens de acesso para reuso (replay) |
| Acesso a Credenciais (TA0006) | Brute Force: Password Cracking (T1110.002) | Quebra offline de hashes exfiltrados com wordlists contextuais |
| Coleta (TA0009) | Email Collection (T1114) | Download em massa de caixas de e-mail e busca direcionada por credenciais de acesso remoto e de sistemas financeiros |
| Evasão de Defesas (TA0005) | Account Manipulation (T1098) | Alteração do hash de senha de um administrador para um valor conhecido |
| Comando e Controle (TA0011) | Non-Standard Port / Fallback Channels (T1571 / T1008) | Quando o tráfego egresso foi bloqueado: payloads blind, varredura de múltiplas portas e ajuste iterativo de canal |
| Impacto (TA0040) | Financially-motivated targeting (intenção) | Foco em dados e credenciais de pagamento, crédito e banking |

## Conclusão

Essa investigação mostra um grupo com motivação financeira, foco setorial claro e capacidade de adaptar tooling conforme os controles encontrados no ambiente da vítima. O uso de IA aparece como um elemento de aceleração operacional, especialmente na criação e modificação de ferramentas ofensivas, mas não substitui os fundamentos tradicionais da intrusão: exploração de aplicação, coleta de credenciais, movimentação lateral, persistência e busca por impacto financeiro.

Não publicaremos IoCs ou detalhes técnicos sensíveis neste momento. A decisão é intencional: preservar vantagem de inteligência, proteger vítimas potenciais e evitar que a infraestrutura ou os métodos observados sejam rapidamente alterados pelos operadores.

Caso sua organização queira acesso ao relatório técnico detalhado, entre em contato conosco. Estamos sempre disponíveis para colaboração com times de segurança, resposta a incidentes e inteligência de ameaças.