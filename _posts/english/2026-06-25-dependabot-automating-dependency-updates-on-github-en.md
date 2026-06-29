---
layout: post
title: 'Dependabot: automatizando a atualização de dependências no GitHub'
lang: en
category: Guides
excerpt: 'Understand how Dependabot automates vulnerability monitoring and dependency updates directly on GitHub.'
author: Maria Eduarda
author-info:
  name: Maria Eduarda
  image: maria.png
  description: Studied software engineering. Contributes to the development and maintenance of engineering solutions that deliver value to end clients, including tools and systems designed to identify vulnerabilities and reduce risk.
  linkedin: Eduardadionisio
date: 2026-06-25 08:00:00 -0300
permalink: /blog/dependabot-automating-dependency-updates-on-github/
---

# Dependabot: automating dependency updates on GitHub

Keeping dependencies up to date is one of the most neglected tasks in the software development lifecycle. Not because of carelessness or lack of awareness, but because everyday work imposes more visible priorities: features, bug fixes, deadlines. Outdated dependencies rarely cause immediate symptoms. The problems they introduce usually appear late, and when they do, the cost is high.

Based on this diagnosis, we decided to configure Dependabot in our repositories. This text describes what the tool is, how it works, how we configured it, and what we learned during the process.

## The dependency problem

Every modern software project depends on external libraries. These libraries, in turn, have their own dependencies. As time passes, new versions are published with bug fixes, performance improvements, and, most importantly, security vulnerability fixes.

When a vulnerability is discovered in a widely used library, it may receive a CVE (Common Vulnerabilities and Exposures) identifier and be registered in public vulnerability databases and advisories. From that moment on, the flaw is no longer just a theoretical risk: it becomes publicly known information, including to people with malicious intent. Projects that still use the vulnerable version remain exposed until the update is applied.

The problem is that manually following this flow across multiple repositories, languages, and package managers is impractical. Without automation, this process tends to become inconsistent, delayed, or simply forgotten.

## What is Dependabot

Dependabot is a GitHub tool that monitors repository dependencies and automatically opens pull requests when it identifies newer versions or known vulnerabilities. It runs directly within GitHub’s infrastructure, without requiring external servers to be installed or configured.

The tool works in two complementary modes. The first is security monitoring. When a vulnerability is registered in the GitHub Advisory Database and affects a dependency present in the project, GitHub can generate an alert in the repository. When security updates are enabled, Dependabot can automatically open a pull request with the fixed version or with an update that removes the identified exposure.

The second mode is version updates. Regardless of vulnerabilities, Dependabot periodically checks whether newer dependency versions are available and proposes updates automatically.

In both cases, the result is a pull request that the team can review, test, and approve. The final decision remains with people. What changes is that the work of monitoring and preparing the update is no longer manual.

## How to configure it

Dependabot is configured through a file called `dependabot.yml`, which must be placed inside the repository’s `.github` directory.

A basic example for projects that use npm is:

```yaml
version: 2

updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

This file instructs Dependabot to check, once a week, the npm dependencies declared at the root of the project. From this configuration onward, the tool starts tracking available new versions and can automatically open pull requests when updates are available.

In repositories with many dependencies, a slightly more controlled configuration may be more appropriate:

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

In this case, besides defining the frequency, we also specify the day, time, and time zone for the check. The `open-pull-requests-limit` parameter helps control the number of pull requests opened at the same time, preventing the first execution of the tool from generating more work than the team can review.

The configuration also accepts relevant variations: it is possible to ignore specific packages, define labels, configure commit messages, group updates, and declare multiple ecosystems within the same repository if the project uses different languages or package managers in different directories.

In the case of the LESIS blog, for example, the configuration needed to cover more than one ecosystem. In addition to Ruby dependencies managed by Bundler, we also configured Dependabot to monitor updates to GitHub Actions workflows:

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

In this example, `bundler` monitors the project’s gems, while `github-actions` monitors the actions used in the repository’s workflows. The configuration also defines labels specific to each ecosystem, commit prefixes, and update groups.

Grouping helps organize the volume of pull requests. For production dependencies, for example, `minor` and `patch` updates can be grouped separately from `major` updates, which tend to require more attention during review. The same reasoning was applied to GitHub Actions updates.

When the task was assigned, the starting point was studying the tool. Dependabot was not familiar to us at that point, so before any configuration it was necessary to understand how it worked, what it monitored, and which options were available. This study time was necessary and worthwhile: after understanding the tool, the configuration itself was straightforward. GitHub’s documentation clearly covers the most common cases, and the first automatically generated pull requests appeared shortly after the file was added.

## Limitations we found

An important lesson from the process was that Dependabot does not support every package manager. In our case, some projects use CPAN, Perl’s dependency manager, which is not included in the list of ecosystems supported by the tool. In those repositories, automated monitoring is not possible with Dependabot, and tracking needs to be done by other means.

For Perl projects, [Bunkai](https://github.com/lesis-lat/bunkai), a software composition analysis tool developed by LESIS, covers part of this gap by identifying outdated dependencies and known vulnerabilities in projects that use CPAN.

It is also worth mentioning that Dependabot is not the only tool available for this type of automation. A well-known open source alternative is [Renovate](https://github.com/renovatebot/renovate), a tool for automated dependency updates. Like Dependabot, Renovate identifies outdated dependencies and can open pull requests with the necessary updates.

Renovate can be especially interesting for teams that do not use GitHub, since it was designed to work across different code hosting platforms, such as GitLab, Bitbucket, Azure DevOps, Forgejo, and Gitea. It is also often considered when a project requires greater configuration flexibility, more specific update policies, or more customized workflows.

In our case, Dependabot was a natural choice because it is already integrated with GitHub and requires little initial configuration. Still, for projects outside the GitHub ecosystem or with more complex automation needs, Renovate is an alternative worth evaluating.

Before configuring the tool, it is worth checking whether the package managers used in the project are among the supported ones. The official list of compatible ecosystems is available in GitHub’s documentation and covers the most common cases, such as npm, pip, Maven, Gradle, Composer, and RubyGems, among others, but it is not universal.

Another point that deserves attention is the initial volume of pull requests. In repositories with many dependencies that have not been updated for some time, the first Dependabot execution can generate a significant number of proposals at once. This can overload the review flow if no limit is configured. The `open-pull-requests-limit` parameter in the configuration file helps control this behavior.

## Why this matters

Dependency management is not just an internal organization issue. It is a security issue with external consequences. Outdated libraries are a documented and actively exploited attack vector. In many cases, the difference between a vulnerable project and a more secure one lies in the existence of a process that keeps dependencies monitored and updated.

Dependabot does not replace a comprehensive security posture, but it solves a specific part of the problem reliably and with a low configuration cost. It turns a task that would tend to be forgotten into a continuous, auditable process integrated into the team’s normal workflow.

## Conclusion

Our experience configuring Dependabot in our repositories was positive. The initial effort is small, the integration with GitHub is native, and the result, continuously monitored dependencies, more than justifies the time invested.

Limitations exist and should be understood before setting expectations. Not all ecosystems are supported, and the volume of pull requests may require configuration fine-tuning. But for compatible repositories, the tool delivers exactly what it promises.

More than a convenience, keeping dependencies up to date is a responsibility. Automation does not eliminate this responsibility; it helps ensure that it is fulfilled consistently.

## References

1. [Dependabot documentation - GitHub](https://docs.github.com/en/code-security/dependabot)
2. [Supported package ecosystems - GitHub](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#package-ecosystem)
3. [GitHub Advisory Database](https://github.com/advisories)
4. [Common Vulnerabilities and Exposures - CVE](https://www.cve.org/)
5. [Bunkai - SCA tool for Perl](https://github.com/lesis-lat/bunkai)
6. [Renovate - Automated dependency update tool](https://github.com/renovatebot/renovate)