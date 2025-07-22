---
layout: post
title:  "Fortalecimiento de la cadena de suministro de software en proyectos Perl mediante la herramienta Bunkai"
date:   2025-07-22
---

### Resumen

La creciente dependencia de bibliotecas de terceros en el desarrollo de software ha ampliado la superficie de ataque de las aplicaciones modernas. Las herramientas de Análisis de Composición de Software (SCA, por sus siglas en inglés) se han consolidado como mecanismos automatizados para mitigar riesgos relacionados con el uso de componentes vulnerables o desactualizados. No obstante, el ecosistema de Perl presenta deficiencias importantes en este ámbito. Este trabajo presenta Bunkai, una herramienta diseñada específicamente para el análisis de seguridad de dependencias en proyectos desarrollados en Perl. Se describe su arquitectura, funcionalidades y compatibilidad con estándares de interoperabilidad como SARIF. Los resultados sugieren que la incorporación de herramientas como Bunkai puede contribuir al fortalecimiento de la seguridad en proyectos Perl, tanto activos como heredados.

Esta publicación también está disponible en: [Inglés](https://blog.lesis.lat/blog/Strengthening-the-software-supply-chain-of-Perl-projects-using-Bunkai/) y [Portugués](https://blog.lesis.lat/blog/Fortalecendo-a-software-supply-chain-de-projetos-Perl-com-Bunkai/)

---

### 1. Introducción

El uso de bibliotecas externas es una práctica ampliamente adoptada en el desarrollo de software contemporáneo. Sin embargo, esta práctica conlleva riesgos en términos de seguridad, estabilidad y reproducibilidad de los sistemas. Ecosistemas como JavaScript, Python y Rust han implementado herramientas específicas para gestionar estos riesgos, tales como npm audit, pip-audit y cargo-audit. En contraste, el ecosistema Perl carece de soluciones automatizadas que permitan el análisis sistemático de sus cadenas de dependencias.

La falta de herramientas SCA en el contexto de Perl limita la capacidad para identificar bibliotecas obsoletas, vulnerabilidades conocidas y versiones no controladas. Además, ciertas características propias del lenguaje —como su flexibilidad en la gestión de módulos— pueden facilitar la introducción de riesgos de seguridad de forma inadvertida.

---

### 2. Fundamentos del Análisis de Composición de Software (SCA)

Las herramientas SCA realizan inspecciones automatizadas de los archivos de metadatos y de definición de dependencias de un proyecto. Entre las verificaciones comunes se encuentran:

- Detección de vulnerabilidades registradas (como CVE o advisories);
- Identificación de versiones obsoletas;
- Ausencia de versionado explícito;
- Revisión de licencias de los paquetes utilizados.

El objetivo es reducir el riesgo asociado al uso de componentes inseguros, promoviendo mayor previsibilidad y seguridad tanto en el desarrollo como en la operación de los sistemas.

---

### 3. Bunkai: arquitectura y funcionalidad

Bunkai es una herramienta SCA desarrollada específicamente para el ecosistema Perl. Su propósito es brindar a las personas desarrolladoras una solución automatizada para analizar la seguridad de las dependencias declaradas en el archivo cpanfile.

A continuación, se describen sus funcionalidades principales:

#### 3.1. Detección del archivo de dependencias

Bunkai verifica la existencia del archivo cpanfile, considerado el mecanismo estándar para declarar dependencias en Perl. Si el archivo no está presente, la herramienta emite una advertencia, dado que su ausencia impide la trazabilidad de los componentes utilizados.

<p align="center">
  <img src="/assets/img/bunkai-01.png" alt="Figura 1"><br>
  <em>Figura 1 - Detección del archivo de dependencias<br>
  Fuente: Elaborado por el autor.</em>
</p>

#### 3.2. Análisis de versionado explícito

Cada módulo listado en el cpanfile es inspeccionado para determinar si se ha especificado una versión concreta. La falta de versionado explícito puede dar lugar a instalaciones automáticas de versiones no controladas, lo que afecta negativamente la reproducibilidad y puede introducir vulnerabilidades.

<p align="center">
  <img src="/assets/img/bunkai-02.png" alt="Figura 2"><br>
  <em>Figura 2 - Análisis del versionado explícito<br>
  Fuente: Elaborado por el autor.</em>
</p>

#### 3.3. Verificación de actualizaciones disponibles

Cuando una versión específica ha sido declarada, Bunkai consulta los registros del CPAN (Comprehensive Perl Archive Network) para verificar si existen versiones más recientes. Si se detectan módulos desactualizados, la herramienta notifica a la persona usuaria.

<p align="center">
  <img src="/assets/img/bunkai-03.png" alt="Figura 3"><br>
  <em>Figura 3 - Verificación de actualizaciones<br>
  Fuente: Elaborado por el autor.</em>
</p>

#### 3.4. Detección de vulnerabilidades conocidas

Bunkai cruza las versiones declaradas con bases de datos públicas de vulnerabilidades. En caso de encontrar coincidencias, se genera un informe con los detalles disponibles sobre la vulnerabilidad identificada.

<p align="center">
  <img src="/assets/img/bunkai-04.png" alt="Figura 4"><br>
  <em>Figura 4 - Comprobación de vulnerabilidades conocidas<br>
  Fuente: Elaborado por el autor.</em>
</p>

---

### 4. Exportación en formato SARIF

La herramienta permite exportar los resultados en el formato SARIF (Static Analysis Results Interchange Format), lo que facilita su integración con plataformas de análisis de seguridad modernas, tales como GitHub Advanced Security, sistemas de integración y entrega continua (CI/CD) y paneles de monitoreo de vulnerabilidades. Esto permite automatizar la supervisión de riesgos y mantener la visibilidad continua del estado de seguridad del proyecto.

<p align="center">
  <img src="/assets/img/bunkai-05.png" alt="Figura 5"><br>
  <em>Figura 5 - Exportación en SARIF para el directorio actual<br>
  Fuente: Elaborado por el autor.</em>
</p>

<br>

<p align="center">
  <img src="/assets/img/bunkai-06.png" alt="Figura 6"><br>
  <em>Figura 6 - Evidencia de exportación en SARIF para el directorio actual<br>
  Fuente: Elaborado por el autor.</em>
</p>

<br>

<p align="center">
  <img src="/assets/img/bunkai-07.png" alt="Figura 7"><br>
  <em>Figura 7 - Exportación y evidencia de exportación en SARIF para un directorio y archivo especificados<br>
  Fuente: Elaborado por el autor.</em>
</p>

---

### 5. **Consideraciones finales**

La carencia de herramientas SCA en el ecosistema Perl constituye una brecha significativa en un contexto donde la seguridad de la cadena de suministro de software es una prioridad. Bunkai aborda esta necesidad mediante una solución especializada, integrable con flujos de trabajo modernos y orientada a la mitigación de riesgos en el uso de dependencias.

Su adopción sistemática puede representar una mejora sustancial en las prácticas de seguridad de proyectos escritos en Perl, especialmente aquellos clasificados como legados o críticos.

---

### Autor

**Giovanni Sagioro**: estudiante de Ciencias de la Computación, buscador de la sabiduría de Perl e investigador de seguridad enfocado en la investigación de vulnerabilidades y el desarrollo de exploits. Como dice Larry Wall: “Las cosas fáciles deben ser fáciles, y las cosas difíciles deben ser posibles”, así que estoy intentando hacer que lo difícil sea posible.

---
### Referencias

* [1] COMPREHENSIVE Perl Archive Network (CPAN). Disponible en: <https://www.cpan.org/>. Acesso: 17 jul. 2025.
* [2] PERL. The Perl Module Toolchain. Disponible en: <https://perldoc.perl.org/perlmodlib#The-Perl-Module-Toolchain>. Acesso: 17 jul. 2025.
* [3] NICCS. Using Software Composition Analysis (SCA) to Secure Open Source Components. Disponible en: <https://niccs.cisa.gov/training/catalog/cmdctrl/using-software-composition-analysis-sca-secure-open-source-components>. Acesso: 17 jul. 2025.
* [4] OWASP. Component Analysis. Disponible en: <https://owasp.org/www-community/Component_Analysis>. Acesso: 17 jul. 2025.
* [5] SNYK. 6 Software Composition Analysis (SCA) Best Practices. Disponible en: <https://snyk.io/blog/6-software-composition-analysis-sca-best-practices/>. Acesso: 17 jul. 2025.
