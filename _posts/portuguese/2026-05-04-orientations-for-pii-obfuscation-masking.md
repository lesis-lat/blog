---
layout: post
title: 'Orientações para ofuscação e mascaramento de PII'
lang: pt
category: Guias
excerpt: 'Recomendações práticas para mascarar tipos comuns de informações pessoais sem expor fragmentos úteis entre sistemas.'
author: Heitor Gouvêa
author-info:
  name:  Heitor Gouvêa
  image:  heitor-gouvea.jpeg
  description: Pesquisador, com background em engenharia de software. O foco da pesquisa de Gouvêa é a descoberta de vulnerabilidade em aplicações modernas e desenvolvimento de ferramentas e exploits.
  linkedin: htrgouvea
date: 2026-05-04 10:00:00 -0300
permalink: /blog/orientacoes-para-ofuscacao-e-mascaramento-de-pii/
---

### Introdução

Muitas aplicações lidam com informações pessoais identificáveis, conhecidas pela sigla PII: nomes, endereços, e-mails, telefones, documentos, identificadores de dispositivo e outros dados capazes de identificar uma pessoa direta ou indiretamente.

Quando essas informações aparecem em telas de aplicação, logs, relatórios, ferramentas de suporte, notificações ou ambientes não produtivos, o sistema deve evitar expor mais do que o usuário ou operador realmente precisa. Uma forma comum de reduzir essa exposição é mascarar ou ofuscar parte do valor.

Essa prática é familiar. Um fluxo de recuperação de senha pode mostrar apenas parte de um e-mail. Um painel de suporte pode exibir somente os últimos dígitos de um telefone. Uma interface bancária pode mostrar um identificador fiscal parcialmente oculto. Ainda assim, os detalhes costumam ser inconsistentes. Sistemas diferentes escolhem caracteres visíveis diferentes, quantidades diferentes e formatos diferentes.

Essa inconsistência importa. Se a mesma PII é mascarada de formas diferentes em várias aplicações, cada aplicação pode revelar um fragmento diferente. Um atacante capaz de acionar ou observar esses fluxos pode combinar os fragmentos e reconstruir o valor original.

Este artigo propõe orientações práticas para mascarar campos comuns de PII. O objetivo não é definir um padrão legal universal, mas fornecer uma base técnica para pessoas de engenharia, segurança e produto que precisam de comportamento consistente ao exibir ou processar dados pessoais.

### Ofuscação, mascaramento e anonimização

Os termos costumam ser usados como sinônimos, mas não significam a mesma coisa.

**Mascaramento** é a substituição de parte de um valor por um marcador fixo, normalmente para ocultar caracteres sensíveis enquanto preserva contexto suficiente para reconhecimento. Por exemplo, `user.name@example.com` pode se tornar `u*******e@e*****e.com`.

**Ofuscação** é uma prática mais ampla de tornar dados mais difíceis de entender ou interpretar. Mascaramento é um tipo de ofuscação, mas nem toda ofuscação é mascaramento. Ofuscação também pode incluir tokenização, redação, truncamento ou transformações que preservam formato.

Um exemplo de ofuscação que não é apenas mascaramento é substituir um e-mail por um identificador opaco. Em vez de exibir `heitor.gouvea@lesis.lat` como `h***********a@l***s.lat`, o sistema poderia exibir `user_8f3a91`. Nesse caso, o valor original não aparece parcialmente. Ele foi substituído por um identificador opaco. Isso pode ser tokenização ou pseudonimização, dependendo de como o mapeamento com o valor original é mantido.

**Anonimização** significa transformar dados para que uma pessoa não possa mais ser identificada, direta ou indiretamente, usando meios razoavelmente disponíveis. Mascaramento parcial não deve ser tratado como anonimização por padrão. Um e-mail ou telefone mascarado ainda pode ser associado a uma pessoa, especialmente quando combinado com outros dados.

Na prática, o mascaramento é mais útil como controle de minimização de dados. Ele reduz exposição desnecessária. Ele não substitui criptografia, controle de acesso, trilhas de auditoria, limites de retenção ou descarte seguro.

### Por que consistência importa

Considere uma pessoa que usa o mesmo alias público em várias redes sociais. Um atacante quer descobrir o e-mail associado a esse alias. Ele não consegue ver o e-mail completo, mas consegue acionar fluxos de recuperação de senha em várias plataformas.

Se cada plataforma mascara o e-mail de uma forma diferente, o atacante pode receber fragmentos como estes:

| Plataforma | E-mail mascarado |
| :---- | :---- |
| Instagram | `h***********a@g***l.com` |
| Twitter | `*************@gmail.com` |
| LinkedIn | `*******ouvea@gm********` |
| Facebook | `hei**********@gma***om` |
| Telegram | `*****r.******ea@g*****.com` |

![Diagrama de reconstrução de e-mail a partir de fragmentos mascarados](/assets/publications/pii-obfuscation/email-reconstruction-pt.svg)

<p class="content-caption"><strong>Figura 1:</strong> fragmentos de um mesmo e-mail revelados por diferentes regras de mascaramento podem ser combinados para reconstruir o valor original.</p>

Individualmente, cada fragmento pode parecer inofensivo. Juntos, eles podem revelar estrutura suficiente para reconstruir o endereço.

O mesmo problema pode acontecer dentro de uma organização. Se duas aplicações leem o mesmo banco de dados e mascaram um CPF de formas diferentes, cada aplicação pode expor uma parte diferente do valor. Com o tempo, logs, tickets, e-mails, capturas de tela e conversas de suporte podem acumular fragmentos suficientes para enfraquecer a proteção.

Por esse motivo, o mascaramento deve ser tratado como uma decisão compartilhada de política, não como um detalhe local de formatação de interface. O mesmo campo deve ser mascarado da mesma forma em produtos, ferramentas internas, APIs e fluxos operacionais.

### Quando mascarar PII

Mascaramento de PII é útil sempre que o valor completo não é necessário para o usuário, operador ou ação de sistema que está sendo executada.

Em sistemas de suporte, atendentes frequentemente precisam confirmar que estão olhando para o cliente correto, mas raramente precisam do documento completo, telefone completo ou e-mail completo. Mostrar um fragmento limitado pode ser suficiente para verificação enquanto reduz a exposição na interface de suporte.

Em testes de restauração de backup, times podem precisar de formato e volume de dados realistas, mas não deveriam precisar de acesso a identificadores reais de clientes. Mascarar ou substituir PII durante a restauração pode preservar o valor operacional do teste sem expor dados pessoais desnecessariamente em ambientes não produtivos.

Em analytics e treinamento de modelos, dados de produção podem conter sinais que dados sintéticos não reproduzem bem. Mesmo assim, o padrão deve ser remover, mascarar, agregar ou tokenizar PII, a menos que o valor completo seja estritamente necessário e legalmente justificado.

Em logs e sistemas de observabilidade, o mascaramento é especialmente importante porque logs costumam ser copiados, indexados, retidos, exportados e acessados por grupos operacionais mais amplos. Um campo seguro em um banco de produção restrito pode se tornar arriscado quando repetido em pipelines de logs.

### Princípios gerais de mascaramento

Decisões de mascaramento devem seguir algumas regras simples.

Revele o mínimo necessário para completar o fluxo. Se a pessoa usuária só precisa distinguir entre dois telefones, os dois ou quatro últimos dígitos podem ser suficientes. Se um operador só precisa saber que um e-mail foi enviado para o domínio esperado, a parte local completa não deve ficar visível.

Mantenha o formato reconhecível quando isso ajudar a usabilidade. Por exemplo, preservar pontuação em um CPF ou telefone pode ajudar a reconhecer o tipo de campo sem expor o valor completo.

Evite revelar informações estruturais de alto valor. Em alguns identificadores, certos dígitos têm significado. Em CPFs brasileiros, por exemplo, os dois últimos dígitos são verificadores e o nono dígito pode indicar a região de emissão. Uma regra de mascaramento deve considerar essa semântica em vez de ocultar caracteres aleatórios.

Use uma regra de mascaramento por tipo de campo e aplique-a em todos os lugares. Se a política para um e-mail é revelar o primeiro e o último caractere da parte local e do rótulo principal do domínio, toda aplicação deve usar a mesma regra.

Não use mascaramento parcial como única proteção para armazenamento sensível. Se o valor original precisa ser mantido, proteja-o com controle de acesso, criptografia quando apropriado, auditoria rigorosa e limites de retenção. O mascaramento deve controlar principalmente exposição na camada de apresentação, exportação, logging ou dados derivados.

O mascaramento deve acontecer o mais perto possível da superfície de exposição: interface, logs, exportações, mensagens, relatórios e ambientes derivados. Ele não deve ser confundido com transformar o dado original no banco sem uma necessidade clara.

### Padrões recomendados

Os padrões abaixo oferecem um ponto de partida prático. Eles são exemplos de baseline, não regras universais. Cada organização deve validar os campos conforme jurisdição, ameaça e necessidade operacional, mas o ponto central é a consistência.

| Campo | Valor original | Valor mascarado | Orientação |
| :---- | :---- | :---- | :---- |
| CPF | `111.222.333-00` | `***.222.33*-**` | Oculte os três primeiros dígitos, o nono dígito e os dois dígitos verificadores. Preserve a pontuação apenas para legibilidade. |
| E-mail | `user.name@example.com.br` | `u*******e@e*****e.com.br` | Revele apenas o primeiro e o último caractere da parte local e do rótulo principal do domínio. Preserve sufixos públicos, como `.com.br`, quando necessário para reconhecimento. |
| Telefone | `(11) 91234-5678` | `(11) 9****-**78` | Preserve código de país ou DDD apenas quando necessário para roteamento ou reconhecimento. Revele a menor quantidade possível de dígitos finais exigida pelo fluxo. |
| Endereço IPv4 | `203.0.113.42` | `203.0.113.***` | Para exibição, oculte o octeto de host. Para analytics, prefira agregação por sub-rede quando possível. |
| Endereço IPv6 | `2001:db8:abcd:0012:0000:0000:0000:0001` | `2001:db8:abcd:0012:****:****:****:****` | Preserve apenas o prefixo de rede necessário para uso operacional. Oculte segmentos específicos de interface. |
| Documento | `12.345.678-9` | `**.345.67*-*` | Trate documentos nacionais ou regionais como identificadores estruturados. Oculte dígitos verificadores e evite expor todas as posições semânticas. |
| Placa de veículo | `ABC1D23` | `A**1*23` | Revele apenas o mínimo necessário para reconhecimento pelo usuário. Evite expor caracteres suficientes para identificar unicamente o veículo em bases pequenas. |
| IMEI | `356938035643809` | `35693803*****09` | Revele apenas o TAC ou dígitos finais quando houver necessidade operacional. Evite mostrar o identificador completo do dispositivo em logs ou ferramentas de suporte. |

Esses exemplos são intencionalmente conservadores. A quantidade exata de caracteres visíveis pode mudar conforme o fluxo, mas cada sistema deve tomar essa decisão explicitamente.

### Orientações de implementação

A lógica de mascaramento deve viver em código compartilhado, não ser reimplementada independentemente em cada tela ou serviço. Uma pequena biblioteca ou serviço compartilhado reduz inconsistência e facilita futuras mudanças de política.

Em organizações com múltiplos sistemas, a forma mais prática de garantir consistência é adotar uma biblioteca padrão de mascaramento. Em vez de explicar a política completa para cada time e revisar manualmente cada implementação, a empresa pode recomendar uma interface única para campos como CPF, e-mail, telefone, IP e documentos.

Isso torna a verificação mais simples. Em vez de validar se cada projeto implementou corretamente cada regra, a revisão passa a verificar se o projeto está usando a biblioteca aprovada. A política continua importante, mas sua aplicação fica centralizada, testável e mais fácil de evoluir.

Em algumas empresas, pode fazer sentido desenvolver uma biblioteca interna para isso, especialmente quando existem regras regulatórias, formatos locais, requisitos de auditoria ou padrões de produto específicos. Essa biblioteca pode incluir testes, documentação, exemplos de uso e versionamento claro para mudanças de comportamento.

Mudanças em regras de mascaramento devem ser versionadas e comunicadas, porque podem afetar suporte, auditoria, testes e integrações que dependem do formato exibido. Se uma regra muda, a alteração deve ser tratada como mudança de comportamento da biblioteca, não como detalhe interno invisível.

Para empresas que usam LLMs ou GenAI no desenvolvimento, o mesmo princípio também se aplica. A recomendação de mascaramento pode fazer parte de uma skill, guideline ou pacote de contexto usado pelos assistentes internos, instruindo o modelo a usar a biblioteca padrão em vez de gerar novas implementações de mascaramento a cada projeto.

Cada função de mascaramento deve receber um valor normalizado e retornar uma representação mascarada. Normalização e mascaramento são preocupações relacionadas, mas separadas. Por exemplo, um telefone pode ser normalizado internamente para o formato E.164, enquanto a camada de exibição pode formatá-lo para a localidade do usuário antes de aplicar o padrão visível.

Campos de PII devem ser mascarados antes de entrar em pipelines de log, observabilidade ou analytics. Depois que o dado sensível foi indexado, replicado e retido, a correção fica muito mais difícil.

O tamanho da entrada importa. Valores curtos não devem vazar informação demais por acidente. Se a parte local de um e-mail tem apenas dois caracteres, revelar o primeiro e o último caractere revela a parte local inteira. Nesses casos, mascare o segmento inteiro ou revele apenas um caractere.

A política também deve definir o que acontece com valores inválidos ou inesperados. Uma função de mascaramento deve falhar de forma fechada: se ela não conseguir interpretar um valor com segurança, deve retornar uma representação totalmente mascarada ou redigida em vez da entrada original.

Por fim, teste comportamento de mascaramento como lógica relevante para segurança. Testes unitários devem cobrir valores normais, valores curtos, valores malformados, formatos internacionalizados, separadores, valores vazios e valores já mascarados. Testes de regressão são úteis porque mudanças acidentais no mascaramento podem aumentar exposição silenciosamente.

### Hashing e criptografia são controles diferentes

Mascaramento, hashing e criptografia resolvem problemas diferentes.

Criptografia protege confidencialidade transformando dados com uma chave criptográfica. Se o sistema precisa recuperar o valor original, criptografia pode ser apropriada para armazenamento ou transmissão, dependendo do modelo de ameaça e da gestão de chaves.

Hashing transforma dados em um resumo de tamanho fixo. Ele é útil para verificações de integridade e, com algoritmos adequados de hash de senha, para armazenamento de senhas. Hashes simples de PII previsível costumam ser fracos porque muitos identificadores têm espaços de busca pequenos ou enumeráveis. Se for necessário usar hash de PII para correspondência ou deduplicação, use uma construção com chave ou outro desenho adequado ao risco.

Mascaramento muda o que é exibido ou exportado. Ele não protege o valor original onde esse valor ainda existe. Um campo mascarado em uma interface não significa que o banco de dados está criptografado. Um valor mascarado em um log não significa que sistemas anteriores deixaram de processar a PII original.

Boa engenharia de privacidade normalmente combina esses controles: minimizar coleta, restringir acesso, mascarar exibição, criptografar armazenamento e transporte sensíveis, auditar uso e apagar dados quando eles não forem mais necessários.

### Conclusão

Mascaramento de PII é um controle prático para reduzir exposição desnecessária de dados pessoais, mas só funciona bem quando é intencional e consistente.

O risco principal não é apenas mostrar caracteres demais em um lugar. É mostrar caracteres diferentes em lugares diferentes, permitindo que fragmentos sejam combinados. Uma política compartilhada de mascaramento ajuda a prevenir esse modo de falha e dá às pessoas de engenharia um padrão claro para aplicar em aplicações, logs, ferramentas de suporte, exportações e fluxos de dados não produtivos.

Mascaramento deve ser tratado como parte de um programa mais amplo de privacidade e segurança. Ele apoia minimização de dados, melhora a privacidade do usuário e reduz exposição operacional, mas não substitui criptografia, controle de acesso, revisão legal ou boa governança de dados.

### Referências

1. [Dados pessoais - Wikipedia](https://pt.wikipedia.org/wiki/Dados_pessoais)
2. [Guide to Protecting the Confidentiality of Personally Identifiable Information (PII) - NIST SP 800-122](https://nvlpubs.nist.gov/nistpubs/legacy/sp/nistspecialpublication800-122.pdf)
3. [Lei Geral de Proteção de Dados Pessoais (LGPD)](https://www.gov.br/esporte/pt-br/acesso-a-informacao/lgpd)
