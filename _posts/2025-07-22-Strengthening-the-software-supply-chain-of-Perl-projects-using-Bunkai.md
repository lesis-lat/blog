---
layout: post
title:  "Strengthening the software supply chain of Perl projects using Bunkai"
date:   2025-07-22
---

### Abstract

The increasing reliance on third-party libraries in software development has expanded the attack surface of modern applications. Software Composition Analysis (SCA) tools have emerged as automated mechanisms to mitigate risks associated with the use of outdated or vulnerable components. However, the Perl ecosystem lacks such tooling. This paper introduces Bunkai, a tool specifically designed to analyse the security of dependencies in Perl projects. The architecture, core features, and integration capabilities of the tool—particularly with formats such as SARIF—are presented. Results suggest that the adoption of tools like Bunkai may enhance the security posture of both legacy and actively maintained Perl systems.

This publication is also available in: [Portuguese](https://blog.lesis.lat/blog/Fortalecendo-a-software-supply-chain-de-projetos-Perl-com-Bunkai/) and [Spanish](https://blog.lesis.lat/blog/Fortalecimiento-de-la-cadena-de-suministro-de-software-en-proyectos-Perl-mediante-la-herramienta-Bunkai/)

---

### 1. Introduction

The use of external libraries is a well-established practice in contemporary software engineering. However, such dependency introduces risks related to security, stability, and reproducibility. While ecosystems such as JavaScript, Python, and Rust have developed dedicated tools for managing these risks—such as npm audit, pip-audit, and cargo-audit, respectively—the Perl ecosystem remains underserved in this regard.

The lack of automated SCA tooling for Perl limits the ability to detect outdated packages, known vulnerabilities, and imprecise versioning. Moreover, Perl’s inherent flexibility in module management can unintentionally facilitate insecure conFiguretions.

---

### 2. Fundamentos de Análise de Composição de Software (SCA)

SCA tools perform automated inspection of a project’s metadata and dependency definitions. Typical checks include:

- Detection of known vulnerabilities (e.g., CVEs and security advisories);
- Identification of outdated package versions;
- Absence of explicit version constraints;
- Review of licensing information for third-party packages.

The primary objective of SCA is to reduce the risk of introducing insecure components into the software stack, thereby improving the predictability and overall security of both development and production environments.

---

### 3. Bunkai: architecture and capabilities

Bunkai is an SCA tool developed specifically for the Perl ecosystem. It is designed to assist developers in evaluating the security of declared project dependencies, as specified in the cpanfile.

The tool provides the following functionality:

#### 3.1. Dependency file detection

Bunkai inspects the project directory for the presence of a cpanfile, which serves as the standard mechanism for declaring dependencies in modern Perl projects. If this file is absent, a warning is issued, as its omission precludes automated traceability of third-party components.

<p align="center">
  <img src="/assets/img/bunkai-01.png" alt="Figure 1"><br>
  <em>Figure 1 - Detection of the dependency file<br>
  Source: Prepared by the author.</em>
</p>

#### 3.2. Explicit versioning checks

Each module declared in the cpanfile is analysed to determine whether an explicit version constraint has been specified. The lack of such constraints can lead to the installation of unpredictable or untested versions, adversely affecting reproducibility and potentially introducing security flaws.

<p align="center">
  <img src="/assets/img/bunkai-02.png" alt="Figure 2"><br>
  <em>Figure 2 - Analysis of explicit versioning<br>
  Source: Prepared by the author.</em>
</p>

#### 3.3. Update availability verification

When version constraints are present, Bunkai checks against the Comprehensive Perl Archive Network (CPAN) to determine whether newer versions of the declared modules are available. If an outdated version is detected, the user is notified.

<p align="center">
  <img src="/assets/img/bunkai-03.png" alt="Figure 3"><br>
  <em>Figure 3 - Update verification<br>
  Source: Prepared by the author.</em>
</p>

#### 3.4. Known vulnerability detection

The tool queries public vulnerability databases to determine whether any of the specified versions are affected by known security issues. Where applicable, details of such vulnerabilities are included in the report.

<p align="center">
  <img src="/assets/img/bunkai-04.png" alt="Figure 4"><br>
  <em>Figure 4 - Checking for known vulnerabilities<br>
  Source: Prepared by the author.</em>
</p>

---

### 4. SARIF output support

Bunkai supports export in SARIF (Static Analysis Results Interchange Format), a widely adopted standard for the exchange of security findings between tools. This allows seamless integration with existing security analysis platforms, such as GitHub Advanced Security, continuous integration/continuous deployment (CI/CD) pipelines, and vulnerability dashboards. The use of SARIF facilitates automated risk monitoring and continuous visibility into the security posture of the project.

<p align="center">
  <img src="/assets/img/bunkai-05.png" alt="Figure 5"><br>
  <em>Figure 5 - Export to SARIF in the current directory<br>
  Source: Prepared by the author.</em>
</p>

<br>

<p align="center">
  <img src="/assets/img/bunkai-06.png" alt="Figure 6"><br>
  <em>Figure 6 - Evidence of SARIF export to the current directory<br>
  Source: Prepared by the author.</em>
</p>

<br>

<p align="center">
  <img src="/assets/img/bunkai-07.png" alt="Figure 7"><br>
  <em>Figure 7 - Export and evidence of SARIF export to a specified directory and file<br>
  Source: Prepared by the author.</em>
</p>

---

### 5. Final considerations

The absence of SCA tooling within the Perl ecosystem represents a significant gap in the current landscape of software supply chain security. Bunkai addresses this gap by providing a specialised solution that aligns with modern development practices and security requirements.

Systematic adoption of Bunkai may enhance software governance processes, particularly in Perl projects considered critical or legacy.

---

### Author

**Giovanni Sagioro**: Computer Science student, seeker of Perl wisdom, and security researcher focused on vulnerability research and exploit development. As Larry Wall says — “Easy things should be easy, and hard things should be possible” — so I’m working to make the hard things possible.

---
### References

* [1] COMPREHENSIVE Perl Archive Network (CPAN). Available at: <https://www.cpan.org/>. Accessed: 17 jul. 2025.
* [2] PERL. The Perl Module Toolchain. Available at: <https://perldoc.perl.org/perlmodlib#The-Perl-Module-Toolchain>. Accessed: 17 jul. 2025.
* [3] NICCS. Using Software Composition Analysis (SCA) to Secure Open Source Components. Available at: <https://niccs.cisa.gov/training/catalog/cmdctrl/using-software-composition-analysis-sca-secure-open-source-components>. Accessed: 17 jul. 2025.
* [4] OWASP. Component Analysis. Available at: <https://owasp.org/www-community/Component_Analysis>. Accessed: 17 jul. 2025.
* [5] SNYK. 6 Software Composition Analysis (SCA) Best Practices. Available at: <https://snyk.io/blog/6-software-composition-analysis-sca-best-practices/>. Accessed: 17 jul. 2025.
