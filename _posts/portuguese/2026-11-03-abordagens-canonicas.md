---
layout: post
title: 'Abordagens canônicas: o que aprendi no Nubank sobre resolver um problema uma vez'
lang: pt
translation_key: canonical-approaches
category: research
excerpt: 'Um relato pessoal sobre o princípio de abordagens canônicas, que vivi de perto no Nubank, e sobre por que reduzir a variação não essencial é uma das formas mais eficazes de tornar a segurança escalável.'
author: Heitor Gouvêa
date: 2026-11-03 12:00:00 -0300
permalink: /blog/abordagens-canonicas/
---

## Introdução

Durante o período em que trabalhei no Nubank, convivi com um conjunto de princípios de engenharia. Um deles mudou bastante a forma como eu penso segurança: *Canonical Approaches, Consistently Applied*, que pode ser traduzido como abordagens canônicas, aplicadas de forma consistente.

Neste texto, quero explicar esse princípio e mostrar por que ele me parece uma das formas mais eficazes de tornar a segurança escalável. Tudo o que descrevo sobre o Nubank está em fontes públicas, a maior parte publicada pela própria empresa no blog *Building Nubank* ou em palestras abertas, e as referências estão no fim do texto. Não falo de sistemas internos, incidentes ou ferramentas proprietárias. O que é meu aqui é a leitura dessas ideias e a forma como passei a aplicá-las no trabalho que faço hoje na LESIS.

## O custo da variação

Para entender o princípio, vale começar pelo problema que ele tenta resolver. À medida que uma organização cresce, os times tomam decisões técnicas de forma independente, e o mesmo problema acaba resolvido de maneiras diferentes em cada parte da empresa. Um time adota uma biblioteca HTTP, outro adota outra, e um terceiro escreve a sua própria forma de autenticar chamadas entre serviços. Cada decisão costuma ser razoável no momento em que é tomada, e por isso o custo delas raramente aparece quando olhamos para uma decisão isolada.

Esse custo aparece mais tarde, quando é preciso melhorar ou corrigir algo que vale para todos os serviços. São os chamados *cross-cutting concerns*: timeouts, retries, validação de TLS, tracing, logs, autenticação e proteção contra SSRF, entre outros. Cada cross-cutting concern precisa ser implementado, testado e mantido em cada variação da stack, e cada variação nova multiplica esse trabalho.

Em segurança, esse custo pesa ainda mais. Na pesquisa de vulnerabilidades, percebi que muitos dos achados mais relevantes aparecem nos pontos em que um serviço se comporta de forma diferente dos demais, como um endpoint escrito antes de o framework de autenticação existir ou uma integração legada que usa o seu próprio cliente HTTP. Cada variação é um lugar a mais onde um controle pode ter sido esquecido ou implementado pela metade. Vou voltar a essa observação mais adiante.

## O princípio no Nubank

O princípio de abordagens canônicas propõe resolver cada problema uma vez, de um jeito, e fazer com que esse jeito seja usado em toda a organização. A partir daí, o trabalho passa a ser melhorar essa solução, e cada melhoria chega a todos que a usam.

Em 2022, o Nubank publicou os seus princípios de engenharia em uma entrevista com Edward Wible, cofundador, primeiro engenheiro e ex-CTO da empresa. São seis:

1. Leverage through Platforms
2. Customer Trust is Hard to Earn and Easy to Lose
3. Data as a Strategic Asset
4. Ownership and Technical Resilience
5. Canonical Approaches, Consistently Applied
6. Multiple perspectives build better software

Wible descreve o quinto princípio como "um objetivo direcional", que na prática significa fazer "escolhas em menor número, mais coesas e mais deliberadas". O argumento dele é sobre a capacidade de evoluir: quando cada time resolve problemas parecidos do seu próprio jeito, o sistema fica mais difícil de entender e, nas palavras dele, "perdemos a capacidade de evoluir o sistema como um todo" (tradução minha, como as demais citações deste texto). Quando li essa descrição, entendi o princípio como um viés deliberado contra a variação, que os times levam em conta sempre que tomam uma decisão técnica.

Esse viés convive com outros valores da empresa, como descentralização, ownership e velocidade, e Wible o apresenta como um contrapeso a essas forças. Os times continuam livres para andar rápido, enquanto a empresa evita a fragmentação que impediria mudanças no sistema inteiro. Ele associa esse equilíbrio a um resultado concreto: o Nubank tem menos projetos abandonados no meio do caminho do que qualquer empresa que ele já tinha visto, porque se compromete a levar as migrações até o fim e trata com ceticismo a variação "acidental".

O texto que melhor detalha o princípio, e que eu recomendo a qualquer pessoa interessada no tema, é *The value of canonicity*, publicado em 2020 por Felipe Hummel, engenheiro do Nubank. Ele descreve uma stack deliberadamente enxuta: Clojure para os serviços de produção, Kafka para comunicação assíncrona, Datomic para dados de negócio de alto valor, Scala com Spark para análise de dados, Python para machine learning e Flutter para mobile. A partir dessa stack, Hummel formula o objetivo de um jeito mais preciso, que é **evitar a variação não essencial**.

Essa ideia de variação não essencial é central para o resto do texto. Hummel considera uma variação essencial quando uma situação nova pede uma ferramenta que entrega um valor claramente melhor, e não essencial quando a ferramenta nova não traz ganho claro sobre a existente ou é adotada pela novidade. Ele também chama atenção para a variação interna, que existe dentro de uma mesma linguagem, nos estilos de código, frameworks, bibliotecas e padrões. O resultado esperado é que dois serviços Clojure escolhidos ao acaso tenham a mesma estrutura de arquivos e usem as mesmas bibliotecas, como se tivessem sido escritos pelo mesmo time.

Para quem trabalha com segurança, essa consistência tem um efeito prático muito claro. Quando os serviços seguem a mesma estrutura, aprender a ler um deles ajuda a ler todos, e a revisão passa a se concentrar nos pontos em que um serviço se afasta do padrão.

## Variação essencial e o caso do Datomic

A distinção entre variação essencial e não essencial é o que impede o princípio de se tornar uma regra rígida, e o próprio Nubank tem um exemplo público que mostra isso. Em uma palestra na QCon San Francisco, em 2017, Edward Wible contou que a empresa usava o Datomic como banco de dados padrão para tudo, e que isso dava uma "falsa sensação de segurança". Segundo ele, o Datomic é muito bom para dados de negócio de alto valor, mas funciona pior para escritas em grande volume contínuo e para textos longos, e em alguns casos a resposta certa era simplesmente o S3. A stack descrita por Hummel em 2020 já reflete esse aprendizado, com o Datomic reservado para dados de alto valor e exceções deliberadas, como Scala e Python, nos casos em que elas trazem um ganho real.

Esse caso mostra como o critério de Hummel funciona na prática. Adotar uma tecnologia nova passa a ser uma decisão que coloca na balança dois lados: o ganho que ela traz para um problema específico e o custo de a organização inteira passar a conviver com mais uma variação. Uma variação é essencial quando o primeiro lado pesa mais.

Dan McKinley chegou a um raciocínio parecido em 2015, no texto *Choose Boring Technology*. Ele argumenta que cada tecnologia nova traz uma bagagem de operação e de carga cognitiva que se acumula com o tempo, envolvendo monitoramento, testes e a necessidade de entender a ferramenta antes de mudá-la. Para tornar isso concreto, propõe imaginar que cada empresa tem cerca de três *innovation tokens* para gastar, e sugere um exercício antes de adotar qualquer coisa nova: pensar em como resolver o problema imediato sem acrescentar nada à stack. Na maioria das vezes, a resposta é que daria, embora com mais trabalho. Uso esse exercício com frequência.

## A conta da variação

Voltando aos cross-cutting concerns, o argumento que mais me convenceu é aritmético. Imagine uma organização hipotética com duas linguagens e duas bibliotecas HTTP em cada uma, o que resulta em quatro clientes HTTP diferentes. Com seis cross-cutting concerns, são 24 implementações para manter, revisar e corrigir. Com um cliente canônico, são seis, e cada concern novo custa uma implementação a mais em vez de quatro.

| | Clientes HTTP | Cross-cutting concerns | Implementações |
|---|---|---|---|
| Com variação | 4 | 6 | 24 |
| Canônico | 1 | 6 | 6 |
| Novo concern, com variação | 4 | 7 | 28 |
| Novo concern, canônico | 1 | 7 | 7 |

Hummel descreve o mesmo efeito em termos de alcance. Para ele, cada divisão de linguagem, framework ou banco de dados limita até onde uma melhoria chega. Um recurso de segurança construído para os serviços Clojure é aplicado em todos eles, enquanto um serviço em Node.js precisaria de uma reimplementação. As bibliotecas comuns, para Datomic, DynamoDB, Kafka, chamadas HTTP, geração de PDF e outras, precisam existir e ser mantidas para cada ambiente suportado, e cada divisão, escreve ele, é mais trabalho no backlog de alguém.

Outros benefícios decorrem da mesma lógica. Quando os serviços se parecem, qualquer engenheiro consegue ler qualquer um deles, e quem muda de time precisa aprender o domínio de negócio, já que a stack é a mesma. Hummel conta que o Nubank adota a regra de que todo software deve estar aberto a contribuições de qualquer engenheiro, algo que só é viável com uma stack comum e que faz a dependência entre times sair do backlog e ir para o code review. Por fim, ferramentas internas, documentação e conhecimento passam a se acumular em poucos lugares.

### Melhorias que chegam a todos

Hummel resume esse benefício ao dizer que a ideia é corrigir cada coisa, de preferência, uma única vez, e que toda melhoria ou correção relacionada a segurança pode ser aplicada com facilidade a todos os serviços. Quando um problema é resolvido em uma peça canônica, cada melhoria feita nela é herdada por todos que a usam. Um default de timeout mais sensato, uma validação a mais, um campo novo no log ou uma correção de segurança chegam a todos os serviços na próxima atualização, e com isso o patamar da organização sobe a cada melhoria. Em um ambiente com variação, a melhoria feita em um cliente HTTP fica restrita a ele, e a distância entre o melhor e o pior serviço da organização tende a crescer com o tempo.

Esse benefício depende de uma condição, que é a propagação das atualizações. Uma biblioteca canônica com doze versões diferentes em uso equivale, na prática, a doze bibliotecas, e a variação volta a aparecer. É para evitar isso que existem regras como a *One-Version Rule*, defendida no livro *Software Engineering at Google*, segundo a qual só existe uma versão de cada componente em uso na organização, e automações como o [Dependabot](/blog/dependabot-automatizando-atualizacao-de-dependencias/).

## Abordagens canônicas e segurança

No início do texto, comentei que muitos achados relevantes aparecem nos pontos em que um serviço se comporta de forma diferente dos demais. Essa observação explica por que o princípio tem um efeito tão grande em segurança. O atacante procura justamente esses pontos, e cada variação não essencial aumenta a quantidade deles. Em um ambiente onde quase todos os serviços passam pelo middleware de autenticação, o alvo interessante é o serviço que fica de fora.

O que a experiência no Nubank me acrescentou foi a perspectiva de trabalhar em um ambiente que tenta, por princípio, reduzir essas exceções. Nesse contexto, a pergunta do time de segurança deixa de ser apenas onde um controle está faltando e passa a incluir por que um determinado serviço é diferente dos outros.

### Eliminar classes inteiras de vulnerabilidades

A aplicação mais ambiciosa desse raciocínio em segurança que conheço vem do Google. A empresa passou mais de uma década construindo frameworks e APIs que impedem o desenvolvedor de escrever código vulnerável a XSS e a SQL injection, com tipos que bloqueiam que um dado não tratado chegue a um sink. Christoph Kern, um dos responsáveis por esse trabalho, descreve o resultado como uma redução drástica dessas classes de defeitos em centenas de aplicações. Em um artigo de 2024, ele argumenta que a segurança de um software é uma propriedade do ecossistema em que ele é desenvolvido, o que inclui linguagens, bibliotecas, frameworks e ferramentas de build e deploy. Vejo esse trabalho como o princípio canônico levado ao limite, em que o problema é resolvido uma vez, na camada canônica, e deixa de existir para quem a usa.

### Segurança como propriedade da arquitetura

A Netflix, que popularizou o conceito de *paved road*, o caminho padrão, bem suportado e mais fácil de seguir, aplicou essa ideia em outro ponto da stack. Ao proteger as aplicações dos estúdios, o time de segurança e o time de gateway criaram o Wall-E, uma versão do gateway Zuul que aplica autenticação via SSO em todas as requisições. Com o tempo, o Wall-E passou a cuidar também de WAF, proteção contra DDoS, validação de security headers e logs, e a maior parte do checklist de segurança para expor uma aplicação à internet se resumiu a uma pergunta: "Você vai usar o Wall-E?".

Em 2021, o Wall-E já protegia mais de 350 aplicações. Segundo o próprio time, a adoção veio da facilidade, já que uma aplicação podia sair de um `git init` para produção, autenticada e acessível pela internet, em menos de dez minutos, e passava por uma revisão de segurança muito mais curta. Para mim, essa é a lição mais importante do caso: as pessoas adotaram o caminho canônico porque ele era o mais fácil de seguir.

### Resposta a incidentes

Em dezembro de 2021, a vulnerabilidade Log4Shell (CVE-2021-44228) obrigou milhares de organizações a descobrir onde usavam o Log4j. Em ambientes heterogêneos, responder a essa pergunta levou dias ou semanas, e boa parte do esforço foi gasta localizando a biblioteca antes de qualquer correção.

Em um ambiente canônico e com inventário de dependências, a mesma pergunta se responde com uma consulta, e a correção se resume a uma atualização de versão na biblioteca comum, propagada por automação. A possibilidade de aplicar uma correção de segurança a todos os usuários de uma dependência de uma só vez é, inclusive, um dos benefícios mais citados da *One-Version Rule*.

### Detecção

Na detecção, a lógica se repete. Quando todos os serviços registram eventos com a mesma biblioteca, os mesmos campos e o mesmo correlation ID, uma única regra de detecção cobre todos eles. Na palestra pública de 2017, o Nubank descreveu um correlation ID ao qual cada serviço acrescenta um segmento, formando uma árvore que permite rastrear uma requisição por toda a arquitetura. Com logs heterogêneos, cada regra precisa ser reescrita para cada formato, e as lacunas ficam nos formatos que ninguém cobriu.

## Conclusão

O princípio de abordagens canônicas parte de uma ideia simples: resolver cada problema uma vez, em um lugar, e fazer com que essa solução seja usada em toda a organização. No Nubank, ele aparece como uma direção que orienta as decisões técnicas, e a distinção de Hummel entre variação essencial e não essencial é o que permite aplicá-lo sem transformá-lo em uma regra rígida, como mostra o caso do Datomic.

Em segurança, esse princípio tem um peso especial. Quando um controle vive em uma peça canônica, cada melhoria feita nele chega a todos os serviços, desde que as atualizações se propaguem. Os casos do Google e da Netflix mostram até onde isso pode ir, com classes inteiras de vulnerabilidades eliminadas no ecossistema de desenvolvimento e um checklist de segurança resumido a uma pergunta sobre o uso do Wall-E. A resposta a incidentes e a detecção também ficam mais simples quando todos os serviços usam as mesmas bibliotecas e registram eventos do mesmo jeito.

Para quem trabalha com defesa, a conclusão volta à observação do início do texto. O atacante procura o serviço que se comporta de forma diferente dos demais, e cada variação não essencial que deixa de existir é um lugar a menos onde ele pode encontrar uma falha.

## Referências

1. [Nubank's Engineering Principles, by Edward Wible - Building Nubank](https://building.nu.com/nubanks-engineering-principles-interview-with-ed-wible/)
2. [The value of canonicity - Felipe Hummel, Building Nubank](https://building.nu.com/the-value-of-canonicity/)
3. [Architecting a Modern Financial Institution - Edward Wible e Rafael Ferreira, QCon San Francisco 2017](https://www.infoq.com/presentations/nubank-architecture/)
4. [Choose Boring Technology - Dan McKinley](https://mcfunley.com/choose-boring-technology)
5. [Software Engineering at Google, capítulo 16: Version Control and Branch Management](https://abseil.io/resources/swe-book/html/ch16.html)
6. [The Show Must Go On: Securing Netflix Studios At Scale - Netflix Technology Blog](https://netflixtechblog.com/the-show-must-go-on-securing-netflix-studios-at-scale-19b801c86479)
7. [Developer Ecosystems for Software Safety - Christoph Kern, ACM Queue](https://research.google/pubs/developer-ecosystems-for-software-safety/)
8. [Secure by Design at Google - Google Research](https://research.google/pubs/secure-by-design-at-google/)
9. [Apache Log4j Vulnerability Guidance - CISA](https://www.cisa.gov/news-events/news/apache-log4j-vulnerability-guidance)
