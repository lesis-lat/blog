---
layout: post
title: 'Máquina de estados para la gestión de vulnerabilidades'
og_image: /assets/publications/vuln-state-machine/state-machine.png
lang: es
category: Investigacion
author: Heitor Gouvêa
author-info:
  name:  Heitor Gouvêa
  image:  heitor-gouvea.jpeg
  description: Investigador con formación en ingeniería de software. La investigación de Gouvêa se centra en el descubrimiento de vulnerabilidades en aplicaciones modernas y en el desarrollo de herramientas y exploits.
  linkedin: htrgouvea
date: 2026-04-09 00:00:00 -0300
---

En muchas organizaciones, el proceso de gestión de vulnerabilidades sufre un problema recurrente — pero frecuentemente ignorado: la inconsistencia en la definición y el uso de los estados. Es común ver los mismos estados siendo utilizados con significados diferentes por equipos distintos, o encontrar estados redundantes, mal definidos o innecesarios, que generan más confusión que claridad. Esto compromete la trazabilidad, dificulta la comunicación entre áreas, imposibilita métricas confiables y debilita la capacidad de la organización para responder a riesgos reales.

Para hacer frente a este escenario, adoptar una máquina de estados formalizada es una estrategia eficaz. De forma clara y objetiva, representa el ciclo de vida de una vulnerabilidad: cada transición tiene un significado preciso, y todos los equipos comparten el mismo entendimiento sobre lo que representa cada estado.

El flujo comienza con **Draft**, que indica un borrador en construcción por parte del analista o pentester. La vulnerabilidad aún está siendo documentada y no ha sido sometida a triaje — puede faltar contexto, evidencias o detalles técnicos. Tras esta etapa, pasa a **Identified**, donde se evalúan el impacto y la prioridad. Si se deriva para corrección, asume el estado **Fixing**, reflejando el trabajo activo de mitigación. Durante el proceso, puede identificarse que se trata de una repetición de un caso anterior, pasando entonces a **Duplicated**. Si el análisis muestra que no existe riesgo real — por ejemplo, debido a una condición de explotación inviable — el estado pasa a **False Positive**. En ciertos casos, la organización opta por aceptar el riesgo, ya sea por limitaciones técnicas, costo de corrección o impacto considerado bajo; en esos casos, el estado es **Accepted Risk**. Tras la corrección, el hallazgo entra en **Retest** para ser reevaluado. Si se valida, el proceso concluye con el estado **Fixed**.

La definición rigurosa de esta máquina de estados no es burocracia: es una base necesaria. Al eliminar ambigüedades y redundancias, mejora la colaboración entre áreas, reduce el retrabajo y permite decisiones mejor fundamentadas. También posibilita generar métricas consistentes, útiles para identificar cuellos de botella, medir la eficiencia y respaldar auditorías.

Esta propuesta de máquina de estados es, al mismo tiempo, compacta y completa. Es el modelo más eficaz que he encontrado en la práctica: lo suficientemente simple para una adopción rápida y lo suficientemente abarcador para cubrir los principales escenarios. Se ha mostrado como un excelente punto de partida para estandarizar procesos, fortalecer la gobernanza y facilitar la integración entre seguridad, producto e ingeniería.

A continuación, el diagrama que representa este flujo:

![](/assets/publications/vuln-state-machine/state-machine.png)
