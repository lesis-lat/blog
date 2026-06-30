---
layout: post
title: 'Dependabot: automatizando a atualização de dependências no GitHub'
lang: pt
category: Guias
excerpt: 'Entenda como o Dependabot automatiza o monitoramento de vulnerabilidades e a atualização de dependências diretamente no GitHub.'
author: Maria Eduarda
author-info:
  name: Maria Eduarda
  image: maria.png
  description: Estudou engenharia de software. Contribui para o desenvolvimento e manutenção de soluções de engenharia que entregam valor aos clientes finais, incluindo ferramentas e sistemas projetados para identificar vulnerabilidades e reduzir riscos.
  linkedin: Eduardadionisio
date: 2026-06-25 08:00:00 -0300
permalink: /blog/dependabot-automatizando-atualizacao-de-dependencias/
---

Manter dependências atualizadas é uma das tarefas mais negligenciadas no ciclo de vida de um projeto de software. Não por descuido ou desconhecimento, mas porque o trabalho cotidiano impõe prioridades mais visíveis: funcionalidades, correções de bugs, prazos. Dependências desatualizadas raramente geram sintomas imediatos. Os problemas que elas introduzem costumam aparecer tarde, e quando aparecem, o custo é alto.

Foi partindo desse diagnóstico que decidimos configurar o Dependabot nos nossos repositórios. Este texto descreve o que é a ferramenta, como ela funciona, como fizemos a configuração e o que aprendemos no processo.

## O problema das dependências

Todo projeto de software moderno depende de bibliotecas externas. Essas bibliotecas, por sua vez, têm suas próprias dependências. À medida que o tempo passa, versões novas são publicadas, com correções de bugs, melhorias de desempenho e, principalmente, correções de vulnerabilidades de segurança.

Quando uma vulnerabilidade é descoberta em uma biblioteca amplamente usada, ela pode receber um identificador CVE (Common Vulnerabilities and Exposures) e passar a ser registrada em bases públicas de vulnerabilidades e advisories. A partir desse momento, a falha deixa de ser apenas um risco teórico: ela passa a ser uma informação conhecida publicamente, inclusive por pessoas com intenção maliciosa. Projetos que ainda utilizam a versão vulnerável permanecem expostos até que a atualização seja feita.

O problema é que acompanhar esse fluxo manualmente, em vários repositórios, com várias linguagens e gerenciadores de pacotes diferentes, é inviável na prática. Sem automação, esse processo tende a se tornar inconsistente, atrasado ou simplesmente esquecido.

## O que é o Dependabot

O Dependabot é uma ferramenta do GitHub que monitora as dependências dos repositórios e abre pull requests automaticamente quando identifica versões mais recentes ou vulnerabilidades conhecidas. Ele opera diretamente dentro da infraestrutura do GitHub, sem necessidade de instalação ou configuração de servidores externos.

A ferramenta funciona em dois modos complementares. O primeiro é o monitoramento de segurança. Quando uma vulnerabilidade é registrada no GitHub Advisory Database e afeta uma dependência presente no projeto, o GitHub pode gerar um alerta no repositório. Quando os security updates estão habilitados, o Dependabot pode abrir automaticamente um pull request com a versão corrigida ou com uma atualização que remova a exposição identificada.

O segundo modo é a atualização de versão. Independentemente de vulnerabilidades, o Dependabot verifica periodicamente se há versões mais recentes das dependências e propõe as atualizações de forma automatizada.

Em ambos os casos, o resultado é um pull request que o time pode revisar, testar e aprovar. A decisão final permanece com as pessoas. O que muda é que o trabalho de monitoramento e de preparação da atualização deixa de ser manual.

## Como configurar

A configuração do Dependabot é feita por meio de um arquivo chamado `dependabot.yml`, que deve estar dentro da pasta `.github` do repositório.

Um exemplo básico para projetos que usam npm é:

```yaml
version: 2

updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

Esse arquivo instrui o Dependabot a verificar, uma vez por semana, as dependências npm declaradas na raiz do projeto. A partir dessa configuração, a ferramenta passa a acompanhar novas versões disponíveis e pode abrir pull requests automaticamente quando houver atualizações.

Em repositórios com muitas dependências, uma configuração um pouco mais controlada pode ser mais adequada:

```yaml
version: 2

updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "America/Sao_Paulo"
    open-pull-requests-limit: 5
```

Nesse caso, além de definir a frequência, também especificamos o dia, o horário e o fuso horário da verificação. O parâmetro `open-pull-requests-limit` ajuda a controlar o volume de pull requests abertos ao mesmo tempo, evitando que a primeira execução da ferramenta gere mais trabalho do que o time consegue revisar.

A configuração também aceita variações relevantes: é possível ignorar pacotes específicos, definir labels, configurar mensagens de commit, agrupar atualizações e declarar múltiplos ecossistemas dentro de um mesmo repositório, caso o projeto utilize linguagens ou gerenciadores de pacotes diferentes em pastas distintas.

No caso do blog da LESIS, por exemplo, a configuração precisou contemplar mais de um ecossistema. Além das dependências Ruby gerenciadas pelo Bundler, também configuramos o Dependabot para acompanhar atualizações dos workflows do GitHub Actions:

```yaml
version: 2

updates:
  - package-ecosystem: "bundler"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:00"
      timezone: "America/Sao_Paulo"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
      - "ruby"
    commit-message:
      prefix: "chore(deps)"
      prefix-development: "chore(deps-dev)"
      include: "scope"
    groups:
      production:
        dependency-type: "production"
        update-types:
          - "minor"
          - "patch"
      production-major:
        dependency-type: "production"
        update-types:
          - "major"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "04:00"
      timezone: "America/Sao_Paulo"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
      - "github-actions"
    commit-message:
      prefix: "ci"
      include: "scope"
    groups:
      minor-patch:
        update-types:
          - "minor"
          - "patch"
      major:
        update-types:
          - "major"
```

Nesse exemplo, o `bundler` monitora as gems do projeto, enquanto `github-actions` monitora as actions utilizadas nos workflows do repositório. A configuração também define labels específicas para cada ecossistema, prefixos de commit e agrupamentos de atualização.

Os agrupamentos ajudam a organizar o volume de pull requests. No caso das dependências de produção, por exemplo, atualizações `minor` e `patch` podem ser agrupadas separadamente das atualizações `major`, que tendem a exigir mais atenção durante a revisão. O mesmo raciocínio foi aplicado às atualizações do GitHub Actions.

Quando a tarefa foi atribuída, o ponto de partida foi o estudo da ferramenta. O Dependabot não era algo familiar até então, então antes de qualquer configuração foi necessário entender como funcionava, o que ele monitorava e quais eram as opções disponíveis. Esse tempo de estudo foi necessário e valeu a pena: a configuração em si, depois de compreender a ferramenta, foi direta. A documentação do GitHub cobre os casos mais comuns com clareza, e os primeiros pull requests gerados automaticamente apareceram logo após a adição do arquivo.

## Limitações que encontramos

Um aprendizado importante do processo foi que o Dependabot não oferece suporte a todos os gerenciadores de pacotes. Em nosso caso, alguns projetos utilizam CPAN, o gerenciador de dependências do Perl, que não está na lista de ecossistemas suportados pela ferramenta. Nesses repositórios, o monitoramento automatizado não é possível com o Dependabot, e o acompanhamento precisa ser feito por outros meios.

Para projetos Perl, o [Bunkai](https://github.com/lesis-lat/bunkai), uma ferramenta de análise de composição de software desenvolvida pela LESIS, cobre parte dessa lacuna ao identificar dependências desatualizadas e vulnerabilidades conhecidas em projetos que usam CPAN.

Além disso, vale mencionar que o Dependabot não é a única ferramenta disponível para esse tipo de automação. Uma alternativa livre bastante conhecida é o [Renovate](https://github.com/renovatebot/renovate), uma ferramenta open source para atualização automatizada de dependências. Assim como o Dependabot, o Renovate identifica dependências desatualizadas e pode abrir pull requests com as atualizações necessárias.

O Renovate pode ser especialmente interessante para equipes que não utilizam GitHub, já que foi projetado para funcionar em diferentes plataformas de hospedagem de código, como GitLab, Bitbucket, Azure DevOps, Forgejo e Gitea. Ele também costuma ser uma opção considerada quando o projeto exige maior flexibilidade de configuração, políticas de atualização mais específicas ou fluxos mais customizados.

No nosso caso, o Dependabot foi uma escolha natural por já estar integrado ao GitHub e exigir pouca configuração inicial. Ainda assim, para projetos fora do ecossistema do GitHub ou com necessidades mais complexas de automação, o Renovate é uma alternativa que vale ser avaliada.

Antes de configurar a ferramenta, vale verificar se os gerenciadores de pacotes utilizados no projeto estão entre os suportados. A lista oficial de ecossistemas compatíveis está disponível na documentação do GitHub e cobre os casos mais comuns, como npm, pip, Maven, Gradle, Composer e RubyGems, entre outros, mas não é universal.

Outro ponto que merece atenção é o volume inicial de pull requests. Em repositórios com muitas dependências que não foram atualizadas há algum tempo, a primeira execução do Dependabot pode gerar um número expressivo de propostas ao mesmo tempo. Isso pode sobrecarregar o fluxo de revisão se não houver um limite configurado. O parâmetro `open-pull-requests-limit`, no arquivo de configuração, permite controlar esse comportamento.

## Por que isso importa

A gestão de dependências não é apenas uma questão de organização interna. É uma questão de segurança com consequências externas. Bibliotecas desatualizadas são um vetor de ataque documentado e explorado ativamente. A diferença entre um projeto vulnerável e um projeto mais seguro, em muitos casos, está na existência de um processo que mantenha as dependências monitoradas e atualizadas.

O Dependabot não substitui uma postura de segurança abrangente, mas resolve uma parte específica do problema de forma confiável e com baixo custo de configuração. Ele transforma uma tarefa que tenderia a ser esquecida em um processo contínuo, auditável e integrado ao fluxo normal de trabalho do time.

## Conclusão

A experiência de configurar o Dependabot nos nossos repositórios foi positiva. O esforço inicial é pequeno, a integração com o GitHub é nativa, e o resultado, dependências monitoradas de forma contínua, justifica com folga o tempo investido.

As limitações existem e devem ser conhecidas antes de criar expectativas. Nem todos os ecossistemas são suportados, e o volume de pull requests pode exigir ajuste fino na configuração. Mas, para os repositórios compatíveis, a ferramenta entrega exatamente o que promete.

Mais do que uma conveniência, manter dependências atualizadas é uma responsabilidade. A automação não elimina essa responsabilidade; ela ajuda a garantir que ela seja cumprida de forma consistente.

## Referências

1. [Dependabot documentation - GitHub](https://docs.github.com/en/code-security/dependabot)
2. [Supported package ecosystems - GitHub](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#package-ecosystem)
3. [GitHub Advisory Database](https://github.com/advisories)
4. [Common Vulnerabilities and Exposures - CVE](https://www.cve.org/)
5. [Bunkai - SCA tool for Perl](https://github.com/lesis-lat/bunkai)
6. [Renovate - Automated dependency update tool](https://github.com/renovatebot/renovate)