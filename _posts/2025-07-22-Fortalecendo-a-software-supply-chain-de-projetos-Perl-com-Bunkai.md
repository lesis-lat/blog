---
layout: post
title:  "Fortalecendo a software supply chain de projetos Perl com Bunkai"
date:   2025-07-22
---

### Resumo

A crescente dependência de bibliotecas de terceiros em projetos de software tem ampliado a superfície de ataque das aplicações modernas. Ferramentas de Análise de Composição de Software (SCA, do inglês *Software Composition Analysis*) surgem como mecanismo automatizado de mitigação de riscos relacionados ao uso de componentes vulneráveis ou desatualizados. No entanto, o ecossistema Perl apresenta lacunas significativas nesse contexto. Este trabalho apresenta o [Bunkai](https://github.com/lesis-lat/bunkai), uma ferramenta voltada à análise de segurança de dependências em projetos Perl. O artigo descreve a arquitetura da ferramenta, suas funcionalidades e sua integração com padrões de interoperabilidade, como o SARIF. Os resultados indicam que a adoção de ferramentas como o Bunkai pode contribuir para a elevação do nível de segurança em projetos Perl legados e modernos.

Essa publicação está disponível também em: [Inglês](https://blog.lesis.lat/blog/Strengthening-the-software-supply-chain-of-Perl-projects-using-Bunkai/) e [Espanhol](https://blog.lesis.lat/blog/Fortalecimiento-de-la-cadena-de-suministro-de-software-en-proyectos-Perl-mediante-la-herramienta-Bunkai/)

---

### 1. Introdução

A utilização de bibliotecas de terceiros é uma prática consolidada no desenvolvimento de software contemporâneo. Entretanto, a introdução de dependências externas acarreta riscos associados à segurança, estabilidade e reprodutibilidade de sistemas. Ecossistemas como JavaScript, Python e Rust têm investido em ferramentas específicas para análise e controle dessas dependências, como npm audit, pip-audit e cargo-audit, respectivamente. Em contraste, o ecossistema Perl ainda carece de soluções automatizadas que viabilizem a inspeção sistemática da cadeia de dependências de software.

A ausência de ferramentas SCA amplamente utilizadas no contexto Perl compromete a capacidade de identificação de bibliotecas desatualizadas, vulnerabilidades conhecidas e inconsistências de versionamento. Além disso, características da linguagem — como a flexibilidade na definição e resolução de módulos — potencializam cenários de risco em que falhas de segurança podem ser introduzidas de forma não intencional.

---

### 2. Fundamentos de Análise de Composição de Software (SCA)

Ferramentas SCA operam por meio da inspeção dos arquivos de metadados e definição de dependências de um projeto. As análises realizadas incluem, entre outras:

* Verificação de vulnerabilidades documentadas (por exemplo, CVEs e advisories);  
* Detecção do uso de versões obsoletas;  
* Identificação da ausência de versionamento explícito;  
* Avaliação de licenciamento de pacotes.

Essas ferramentas buscam reduzir o risco associado à inclusão de componentes comprometidos, promovendo maior previsibilidade e segurança no ambiente de desenvolvimento e produção

---

### 3. Bunkai: arquitetura e funcionalidade

O [Bunkai](https://github.com/lesis-lat/bunkai) é uma ferramenta SCA desenvolvida com foco exclusivo no ecossistema Perl. Sua principal finalidade é oferecer aos desenvolvedores mecanismos automatizados de análise de segurança voltados à cadeia de dependências dos projetos, com base no arquivo *cpanfile*.

As funcionalidades implementadas são descritas a seguir:

#### 3.1. Detecção do arquivo de dependências

O Bunkai verifica a existência do arquivo *cpanfile*, considerado o ponto central para a definição de dependências no ecossistema Perl moderno. A ausência deste arquivo impossibilita a análise automatizada, o que acarreta em advertência ao usuário.

<p align="center">
  <img src="/assets/img/bunkai-01.png" alt="Figura 1"><br>
  <em>Figura 1 - Detecção do arquivo de dependências<br>
  Fonte: Elaborado pelo autor.</em>
</p>

#### 3.2. Análise de versionamento explícito

Cada módulo listado no cpanfile é inspecionado quanto à presença de uma versão explicitamente definida. A ausência de versionamento pode resultar na instalação de versões instáveis ou não testadas, prejudicando a reprodutibilidade e aumentando a superfície de ataque.

<p align="center">
  <img src="/assets/img/bunkai-02.png" alt="Figura 2"><br>
  <em>Figura 2 - Análise do versionamento explícito<br>
  Fonte: Elaborado pelo autor.</em>
</p>

#### 3.3. Verificação de atualizações

Quando uma versão está especificada, o Bunkai realiza a comparação com os registros disponíveis no CPAN (Comprehensive Perl Archive Network) para identificar se há atualizações disponíveis. Módulos defasados são sinalizados para avaliação.

<p align="center">
  <img src="/assets/img/bunkai-03.png" alt="Figura 3"><br>
  <em>Figura 3 - Verificação de atualizações<br>
  Fonte: Elaborado pelo autor.</em>
</p>

#### 3.4. Checagem de vulnerabilidades conhecidas

A ferramenta consulta bases de dados de vulnerabilidades para verificar se as versões utilizadas nos projetos possuem registros de falhas conhecidas. Em caso positivo, são fornecidos ao usuário os dados disponíveis sobre a vulnerabilidade.

<p align="center">
  <img src="/assets/img/bunkai-04.png" alt="Figura 4"><br>
  <em>Figura 4 - Checagem de vulnerabilidades conhecidas<br>
  Fonte: Elaborado pelo autor.</em>
</p>

---

### 4. Exportação em SARIF

O Bunkai implementa suporte ao formato SARIF (Static Analysis Results Interchange Format), permitindo a integração dos resultados com outras ferramentas de análise, como o GitHub Advanced Security, pipelines de CI/CD e painéis de visualização de vulnerabilidades. A adoção do padrão SARIF viabiliza a automação do monitoramento de riscos e a inserção da ferramenta nos fluxos de desenvolvimento contínuo.

<p align="center">
  <img src="/assets/img/bunkai-05.png" alt="Figura 5"><br>
  <em>Figura 5 - Exportação em SARIF para o presente diretório<br>
  Fonte: Elaborado pelo autor.</em>
</p>

<br>

<p align="center">
  <img src="/assets/img/bunkai-06.png" alt="Figura 6"><br>
  <em>Figura 6 - Evidência de exportação em SARIF para o presente diretório<br>
  Fonte: Elaborado pelo autor.</em>
</p>

<br>

<p align="center">
  <img src="/assets/img/bunkai-07.png" alt="Figura 7"><br>
  <em>Figura 7 - Exportação e evidência de exportação em SARIF para um diretório e arquivo especificados<br>
  Fonte: Elaborado pelo autor.</em>
</p>

---

### 5. Considerações finais

A ausência de ferramentas de análise de composição de software voltadas ao Perl representa uma lacuna significativa em um cenário em que a segurança da cadeia de suprimentos de software é uma prioridade crescente. O Bunkai contribui para preencher essa lacuna ao oferecer uma solução compatível com os fluxos modernos de desenvolvimento, integrável com sistemas existentes e voltada à mitigação de riscos associados ao uso de dependências em projetos Perl.

A adoção sistemática do [Bunkai](https://github.com/lesis-lat/bunkai) pode representar um avanço na governança de segurança de software em projetos que utilizam a linguagem Perl, particularmente naqueles considerados críticos ou de legado.

---

### Autor

**Giovanni Sagioro**: estudante de Ciência da Computação, buscador da sabedoria Perl e pesquisador de segurança com foco em pesquisa de vulnerabilidades e desenvolvimento de exploits. Como Larry Wall diz — ‘Coisas fáceis devem ser fáceis, e coisas difíceis devem ser possíveis’ — então estou tentando tornar as coisas difíceis possíveis.

---
### Referências

* [1] COMPREHENSIVE Perl Archive Network (CPAN). Disponível em: <https://www.cpan.org/>. Acesso em: 17 jul. 2025.
* [2] PERL. The Perl Module Toolchain. Disponível em: <https://perldoc.perl.org/perlmodlib#The-Perl-Module-Toolchain>. Acesso em: 17 jul. 2025.
* [3] NICCS. Using Software Composition Analysis (SCA) to Secure Open Source Components. Disponível em: <https://niccs.cisa.gov/training/catalog/cmdctrl/using-software-composition-analysis-sca-secure-open-source-components>. Acesso em: 17 jul. 2025.
* [4] OWASP. Component Analysis. Disponível em: <https://owasp.org/www-community/Component_Analysis>. Acesso em: 17 jul. 2025.
* [5] SNYK. 6 Software Composition Analysis (SCA) Best Practices. Disponível em: <https://snyk.io/blog/6-software-composition-analysis-sca-best-practices/>. Acesso em: 17 jul. 2025.
