---
layout: post
title: 'Considerações sobre a elaboração de relatórios de segurança'
lang: pt
author: Heitor Gouvêa
author-info:
  name:  Heitor Gouvêa
  image:  heitor-gouvea.jpeg
  description: Researcher with a background in software engineering. Gouvêa’s research focuses on discovering vulnerabilities in modern applications and developing tools and exploits. 
  linkedin: htrgouvea
date: 2026-01-15 15:15:10 -0300
---

Após dias ou semanas de trabalho, você identificou falhas relevantes, compreendeu a superfície de ataque do ambiente avaliado e reuniu evidências suficientes para demonstrar riscos reais ao negócio. Tecnicamente, a avaliação terminou. O que ainda falta é transformar esse conhecimento em um relatório claro, acionável e compreensível.

Em qualquer atividade de segurança da informação — testes técnicos, auditorias, avaliações de maturidade ou análises de risco — o relatório é o principal artefato entregue ao cliente. Ele é o meio pelo qual descobertas técnicas se convertem em decisões estratégicas. Sem um bom relatório, até o melhor trabalho técnico perde impacto.

Relatórios de segurança documentam objetivos, contexto, escopo, metodologia, achados, riscos e recomendações. A quantidade de informação envolvida é grande, e por isso a forma como ela é organizada e apresentada é tão importante quanto o conteúdo em si. Este texto não propõe um modelo fixo, mas orientações práticas para melhorar a qualidade da comunicação escrita em segurança da informação.

### Tenha clareza sobre o objetivo

Todo relatório de segurança deve partir de uma pergunta simples: qual era o objetivo da avaliação? Sem essa resposta bem definida, o documento tende a se tornar uma coleção de achados desconectados. É comum focar excessivamente em detalhes técnicos. Embora eles façam parte do trabalho, o objetivo de uma avaliação de segurança não é demonstrar conhecimento, e sim reduzir risco. O relatório deve refletir essa intenção.

Manter o objetivo em mente durante a escrita ajuda a definir o que incluir, o nível de detalhe adequado e o tom do texto. Criar um esboço antes de escrever costuma facilitar esse processo, reduzindo repetições, evitando lacunas e tornando a escrita mais fluida.

### Entenda quem vai ler

Relatórios de segurança raramente têm um único leitor. Executivos, gestores e equipes técnicas costumam consumir o mesmo documento com expectativas diferentes. Por isso, o texto deve ser compreensível mesmo para quem não domina os detalhes técnicos. Isso não significa simplificar excessivamente, mas explicar conceitos e impactos de forma clara e contextualizada.

A inclusão de um resumo executivo é uma prática consolidada. Ele apresenta uma visão de alto nível dos principais riscos e da postura geral de segurança, normalmente sendo a única parte lida por decisores. O restante do relatório deve ser mais técnico, desde que forneça contexto suficiente e não pressuponha conhecimento prévio.

### Seja criterioso com o conteúdo

Um relatório de segurança não precisa ser extenso para ser completo. Ele precisa ser relevante. Tudo o que é incluído deve contribuir para o entendimento do risco ou para a tomada de decisão. Resultados brutos de ferramentas, capturas de tela repetitivas ou informações redundantes tendem a dificultar a leitura e diluir a mensagem principal. O foco deve estar em evidências que sustentem conclusões claras. Avaliar constantemente como cada informação se conecta ao objetivo da avaliação ajuda a manter o texto coeso e direcionado.

### Busque referências e padrões

Escrever bons relatórios é uma habilidade desenvolvida com prática e observação. Analisar relatórios bem estruturados ajuda a identificar padrões de mercado, estilos de escrita eficazes e boas práticas de comunicação. Relatórios públicos, programas de bug bounty e [repositórios com exemplos reais](https://github.com/juliocesarfort/public-pentesting-reports) são boas fontes de referência. Buscar inspiração não significa copiar modelos, mas compreender como outros profissionais comunicam riscos de forma clara e objetiva.

### Cuide da apresentação

A apresentação influencia diretamente a credibilidade do relatório. Um conteúdo tecnicamente sólido, mas mal escrito ou visualmente inconsistente, transmite descuido. Padronização de títulos, espaçamento adequado e linguagem clara fazem diferença. Erros gramaticais e frases ambíguas comprometem a percepção profissional do documento. Independentemente do idioma, revisão cuidadosa é essencial.
No fim, o relatório representa tanto os achados quanto quem o produziu.

### Documente desde o início

Um bom relatório começa durante a avaliação, não após seu término. Anotações feitas desde o início economizam tempo, evitam retrabalho e facilitam revisões futuras.  Registrar comandos, resultados, evidências e observações permite reconstruir o raciocínio por trás de cada achado. Com o tempo, é natural desenvolver modelos próprios de documentação ajustados ao fluxo de trabalho de cada profissional. A qualidade do relatório final depende diretamente da qualidade dessas informações.

### Organização, ferramentas e segurança das informações

Mais importante do que a ferramenta utilizada é o processo adotado. As informações precisam estar organizadas, acessíveis e protegidas, especialmente porque avaliações de segurança frequentemente envolvem dados sensíveis. Automatizar a captura de saídas, complementar com observações pessoais e usar capturas de tela com critério ajuda a não perder informações relevantes. O objetivo final é que os dados sejam claros, confiáveis e fáceis de consultar.

### A importância dos backups

Backups raramente recebem atenção até se tornarem necessários. Documentação perdida representa tempo desperdiçado e, em alguns casos, impacto direto na entrega ao cliente. Manter cópias seguras da documentação, arquivos relevantes e snapshots de ambientes deve fazer parte da rotina. Em segurança da informação, prevenção quase sempre custa menos do que correção.

### A importância da revisão por pares e de olhares externos

Nenhum relatório deveria ser considerado final sem revisão. A revisão por pares melhora a qualidade técnica, ajuda a identificar inconsistências e fortalece a narrativa dos achados.

Além disso, a leitura por alguém de fora do contexto da avaliação é fundamental para validar clareza e compreensão. Se esse leitor não entende o risco ou o raciocínio apresentado, é provável que o cliente também não entenda.

Quando a revisão humana não é possível, modelos de linguagem podem ser usados como apoio para identificar erros gramaticais, problemas de coesão e oportunidades de melhoria. Eles não substituem revisores humanos, mas funcionam como um segundo par de olhos quando usados com critério.

### Ferramentas conceituais

Ferramentas conceituais ajudam a organizar o pensamento antes e durante a escrita. Modelos como [5W](https://en.wikipedia.org/wiki/Five_Ws) e 5W2H forçam o autor a refletir sobre propósito, contexto, escopo e método, evitando relatórios sem direção clara.

Estruturas como Problema, Causa, Impacto e Recomendação ajudam a conectar achados técnicos a riscos reais e ações práticas. Abordagens baseadas em cenários de ameaça facilitam a comunicação de consequências, especialmente para públicos não técnicos.

Conceitos como [pirâmide invertida](https://en.wikipedia.org/wiki/Inverted_pyramid_(journalism)) e a separação entre fato, evidência e interpretação aumentam a clareza e a credibilidade do texto. Perguntar constantemente o que o leitor precisa entender ou decidir após cada seção ajuda a manter o relatório objetivo e focado.

### Conclusão

Relatórios de segurança são instrumentos de comunicação. Eles conectam análises técnicas a decisões que afetam pessoas, processos e negócios. Produzir bons relatórios exige clareza de propósito, entendimento do público, organização da informação e cuidado com a forma. Revisões, boas práticas de documentação e ferramentas conceituais não são burocracia, mas mecanismos de qualidade.

Um relatório bem escrito não é apenas um registro do que foi encontrado. Ele é a ponte entre descoberta e ação. Investir tempo nessa etapa é uma das formas mais eficazes de gerar impacto real em segurança da informação.


### Referências

1. [https://github.com/juliocesarfort/public-pentesting-reports](https://github.com/juliocesarfort/public-pentesting-reports)
2. [https://en.wikipedia.org/wiki/Inverted_pyramid_(journalism)](https://en.wikipedia.org/wiki/Inverted_pyramid_(journalism))
3. [https://en.wikipedia.org/wiki/Five_Ws](https://en.wikipedia.org/wiki/Five_Ws)
4. [https://en.wikipedia.org/wiki/Eight_disciplines_problem_solving](https://en.wikipedia.org/wiki/Eight_disciplines_problem_solving)
5. [https://en.wikipedia.org/wiki/Scientific_method](https://en.wikipedia.org/wiki/Scientific_method)