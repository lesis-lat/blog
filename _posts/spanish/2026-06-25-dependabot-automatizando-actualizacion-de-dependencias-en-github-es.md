---
layout: post
title: 'Dependabot: automatizando la actualización de dependencias en GitHub'
lang: es
category: Guías
excerpt: 'Entiende cómo Dependabot automatiza el monitoreo de vulnerabilidades y la actualización de dependencias directamente en GitHub.'
author: Maria Eduarda
author-info:
  name: Maria Eduarda
  image: maria.png
  description: Estudió ingeniería de software. Contribuye al desarrollo y mantenimiento de soluciones de ingeniería que entregan valor a los clientes finales, incluyendo herramientas y sistemas diseñados para identificar vulnerabilidades y reducir riesgos.
  linkedin: eduardadionisio
date: 2026-06-25 08:00:00 -0300
permalink: /blog/dependabot-automatizando-actualizacion-de-dependencias-en-github/
---

Mantener las dependencias actualizadas es una de las tareas más descuidadas en el ciclo de vida de un proyecto de software. No por descuido o desconocimiento, sino porque el trabajo cotidiano impone prioridades más visibles: funcionalidades, correcciones de bugs, plazos. Las dependencias desactualizadas rara vez generan síntomas inmediatos. Los problemas que introducen suelen aparecer tarde, y cuando aparecen, el costo es alto.

A partir de este diagnóstico, decidimos configurar Dependabot en nuestros repositorios. Este texto describe qué es la herramienta, cómo funciona, cómo hicimos la configuración y qué aprendimos durante el proceso.

## El problema de las dependencias

Todo proyecto de software moderno depende de bibliotecas externas. Estas bibliotecas, a su vez, tienen sus propias dependencias. A medida que pasa el tiempo, se publican nuevas versiones con correcciones de bugs, mejoras de rendimiento y, principalmente, correcciones de vulnerabilidades de seguridad.

Cuando se descubre una vulnerabilidad en una biblioteca ampliamente utilizada, puede recibir un identificador CVE (Common Vulnerabilities and Exposures) y pasar a estar registrada en bases públicas de vulnerabilidades y advisories. A partir de ese momento, la falla deja de ser solo un riesgo teórico: se convierte en información conocida públicamente, incluso por personas con intención maliciosa. Los proyectos que todavía utilizan la versión vulnerable permanecen expuestos hasta que se aplica la actualización.

El problema es que seguir este flujo manualmente, en varios repositorios, con varios lenguajes y gestores de paquetes diferentes, es inviable en la práctica. Sin automatización, este proceso tiende a volverse inconsistente, atrasado o simplemente olvidado.

## Qué es Dependabot

Dependabot es una herramienta de GitHub que monitorea las dependencias de los repositorios y abre pull requests automáticamente cuando identifica versiones más recientes o vulnerabilidades conocidas. Opera directamente dentro de la infraestructura de GitHub, sin necesidad de instalar o configurar servidores externos.

La herramienta funciona en dos modos complementarios. El primero es el monitoreo de seguridad. Cuando una vulnerabilidad se registra en GitHub Advisory Database y afecta una dependencia presente en el proyecto, GitHub puede generar una alerta en el repositorio. Cuando los security updates están habilitados, Dependabot puede abrir automáticamente un pull request con la versión corregida o con una actualización que elimine la exposición identificada.

El segundo modo es la actualización de versiones. Independientemente de las vulnerabilidades, Dependabot verifica periódicamente si existen versiones más recientes de las dependencias y propone las actualizaciones de forma automatizada.

En ambos casos, el resultado es un pull request que el equipo puede revisar, probar y aprobar. La decisión final permanece en manos de las personas. Lo que cambia es que el trabajo de monitoreo y preparación de la actualización deja de ser manual.

## Cómo configurarlo

La configuración de Dependabot se realiza mediante un archivo llamado `dependabot.yml`, que debe estar dentro de la carpeta `.github` del repositorio.

Un ejemplo básico para proyectos que usan npm es:

```yaml
version: 2

updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

Este archivo le indica a Dependabot que verifique, una vez por semana, las dependencias npm declaradas en la raíz del proyecto. A partir de esta configuración, la herramienta empieza a acompañar nuevas versiones disponibles y puede abrir pull requests automáticamente cuando haya actualizaciones.

En repositorios con muchas dependencias, una configuración un poco más controlada puede ser más adecuada:

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

En este caso, además de definir la frecuencia, también especificamos el día, la hora y la zona horaria de la verificación. El parámetro `open-pull-requests-limit` ayuda a controlar el volumen de pull requests abiertos al mismo tiempo, evitando que la primera ejecución de la herramienta genere más trabajo del que el equipo puede revisar.

La configuración también acepta variaciones relevantes: es posible ignorar paquetes específicos, definir labels, configurar mensajes de commit, agrupar actualizaciones y declarar múltiples ecosistemas dentro de un mismo repositorio, en caso de que el proyecto utilice lenguajes o gestores de paquetes diferentes en carpetas distintas.

En el caso del blog de LESIS, por ejemplo, la configuración necesitó contemplar más de un ecosistema. Además de las dependencias Ruby gestionadas por Bundler, también configuramos Dependabot para acompañar actualizaciones de los workflows de GitHub Actions:

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

En este ejemplo, `bundler` monitorea las gems del proyecto, mientras que `github-actions` monitorea las actions utilizadas en los workflows del repositorio. La configuración también define labels específicas para cada ecosistema, prefijos de commit y agrupamientos de actualización.

Los agrupamientos ayudan a organizar el volumen de pull requests. En el caso de las dependencias de producción, por ejemplo, las actualizaciones `minor` y `patch` pueden agruparse por separado de las actualizaciones `major`, que tienden a exigir más atención durante la revisión. El mismo razonamiento se aplicó a las actualizaciones de GitHub Actions.

Cuando se asignó la tarea, el punto de partida fue estudiar la herramienta. Dependabot no era algo familiar hasta entonces, así que antes de cualquier configuración fue necesario entender cómo funcionaba, qué monitoreaba y cuáles eran las opciones disponibles. Ese tiempo de estudio fue necesario y valió la pena: la configuración en sí, después de comprender la herramienta, fue directa. La documentación de GitHub cubre los casos más comunes con claridad, y los primeros pull requests generados automáticamente aparecieron poco después de agregar el archivo.

## Limitaciones que encontramos

Un aprendizaje importante del proceso fue que Dependabot no ofrece soporte para todos los gestores de paquetes. En nuestro caso, algunos proyectos utilizan CPAN, el gestor de dependencias de Perl, que no está en la lista de ecosistemas soportados por la herramienta. En esos repositorios, el monitoreo automatizado no es posible con Dependabot, y el seguimiento debe hacerse por otros medios.

Para proyectos Perl, [Bunkai](https://github.com/lesis-lat/bunkai), una herramienta de análisis de composición de software desarrollada por LESIS, cubre parte de esa brecha al identificar dependencias desactualizadas y vulnerabilidades conocidas en proyectos que usan CPAN.

Además, vale mencionar que Dependabot no es la única herramienta disponible para este tipo de automatización. Una alternativa libre bastante conocida es [Renovate](https://github.com/renovatebot/renovate), una herramienta open source para actualización automatizada de dependencias. Al igual que Dependabot, Renovate identifica dependencias desactualizadas y puede abrir pull requests con las actualizaciones necesarias.

Renovate puede ser especialmente interesante para equipos que no utilizan GitHub, ya que fue diseñado para funcionar en diferentes plataformas de hospedaje de código, como GitLab, Bitbucket, Azure DevOps, Forgejo y Gitea. También suele considerarse cuando el proyecto exige mayor flexibilidad de configuración, políticas de actualización más específicas o flujos más personalizados.

En nuestro caso, Dependabot fue una elección natural por estar integrado a GitHub y exigir poca configuración inicial. Aun así, para proyectos fuera del ecosistema de GitHub o con necesidades más complejas de automatización, Renovate es una alternativa que vale la pena evaluar.

Antes de configurar la herramienta, conviene verificar si los gestores de paquetes utilizados en el proyecto están entre los soportados. La lista oficial de ecosistemas compatibles está disponible en la documentación de GitHub y cubre los casos más comunes, como npm, pip, Maven, Gradle, Composer y RubyGems, entre otros, pero no es universal.

Otro punto que merece atención es el volumen inicial de pull requests. En repositorios con muchas dependencias que no fueron actualizadas durante algún tiempo, la primera ejecución de Dependabot puede generar un número expresivo de propuestas al mismo tiempo. Esto puede sobrecargar el flujo de revisión si no hay un límite configurado. El parámetro `open-pull-requests-limit`, en el archivo de configuración, permite controlar este comportamiento.

## Por qué esto importa

La gestión de dependencias no es solo una cuestión de organización interna. Es una cuestión de seguridad con consecuencias externas. Las bibliotecas desactualizadas son un vector de ataque documentado y explotado activamente. La diferencia entre un proyecto vulnerable y un proyecto más seguro, en muchos casos, está en la existencia de un proceso que mantenga las dependencias monitoreadas y actualizadas.

Dependabot no sustituye una postura de seguridad integral, pero resuelve una parte específica del problema de forma confiable y con bajo costo de configuración. Transforma una tarea que tendería a ser olvidada en un proceso continuo, auditable e integrado al flujo normal de trabajo del equipo.

## Conclusión

La experiencia de configurar Dependabot en nuestros repositorios fue positiva. El esfuerzo inicial es pequeño, la integración con GitHub es nativa, y el resultado, dependencias monitoreadas de forma continua, justifica con creces el tiempo invertido.

Las limitaciones existen y deben conocerse antes de crear expectativas. No todos los ecosistemas son soportados, y el volumen de pull requests puede exigir ajustes finos en la configuración. Pero, para los repositorios compatibles, la herramienta entrega exactamente lo que promete.

Más que una conveniencia, mantener dependencias actualizadas es una responsabilidad. La automatización no elimina esa responsabilidad; ayuda a garantizar que se cumpla de forma consistente.

## Referencias

1. [Dependabot documentation - GitHub](https://docs.github.com/en/code-security/dependabot)
2. [Supported package ecosystems - GitHub](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#package-ecosystem)
3. [GitHub Advisory Database](https://github.com/advisories)
4. [Common Vulnerabilities and Exposures - CVE](https://www.cve.org/)
5. [Bunkai - SCA tool for Perl](https://github.com/lesis-lat/bunkai)
6. [Renovate - Automated dependency update tool](https://github.com/renovatebot/renovate)