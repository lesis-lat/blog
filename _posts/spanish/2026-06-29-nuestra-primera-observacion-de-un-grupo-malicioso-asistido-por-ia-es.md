---
layout: post
title: 'Nuestra primera detección de un grupo malicioso que utiliza inteligencia artificial y que tiene como objetivo a las empresas fintech brasileñas de pequeño y mediano tamaño'
lang: es
category: Estudio de Caso
excerpt: 'Una investigación de LESIS ha identificado una campaña maliciosa dirigida contra empresas fintech brasileñas de pequeño y mediano tamaño, en la que se utiliza la inteligencia artificial para acelerar el desarrollo de herramientas ofensivas, adaptar las cargas útiles y facilitar la explotación de aplicaciones.'
author: LESIS Team
author-info:
  name:  LESIS
  image:  favicon.png
  description: LESIS está especializada en investigación aplicada centrada en tecnologías de seguridad ofensiva que respaldan operaciones críticas.
  linkedin: lesis-lat
date: 2026-06-29 15:00:00 -0300
permalink: /blog/nuestra-primera-observacion-de-un-grupo-malicioso-asistido-por-ia/
---

El trabajo de LESIS nos coloca con frecuencia en diferentes frentes de seguridad ofensiva, respuesta a incidentes e inteligencia de amenazas. En una oportunidad reciente, fuimos convocados para apoyar una investigación que involucraba a una institución financiera brasileña. Nuestro papel inicial era responder una pregunta objetiva: ¿cuál fue el vector de entrada utilizado por el actor malicioso?

Para ello, realizamos un análisis orientado por simulación adversaria. Partimos de la misma premisa operativa del atacante: comprometer una aplicación o recurso adyacente que permitiera, directa o indirectamente, llegar a sistemas con potencial de movimiento financiero. Este enfoque nos permitió reconstruir parte de la cadena de ataque, identificar el vector inicial y, posteriormente, localizar mecanismos de persistencia utilizados por el threat actor.

Durante la investigación, observamos que la persistencia implantada por el grupo se comunicaba con infraestructura externa controlada por los operadores. A partir de ese punto, profundizamos el análisis de la infraestructura de comando y control, con el objetivo de entender si existían elementos adicionales que pudieran contribuir a la respuesta al incidente y a la protección de otros posibles objetivos.

Por razones operativas, no publicaremos IoCs, payloads, direcciones, nombres de archivos, rutas internas ni detalles que puedan comprometer investigaciones. Aun así, los artefactos analizados revelaron un conjunto consistente de comportamientos, herramientas y patrones de operación.

## Qué se observó

La infraestructura analizada contenía payloads, artefactos de apoyo a la explotación, logs de solicitudes, scripts de recepción de datos y evidencias de intentos anteriores contra múltiples objetivos. En algunos casos, la misma infraestructura mantenía información relacionada con más de un objetivo u operación, incluyendo intentos fallidos, actividades en curso y datos obtenidos después del compromiso.

El análisis de estos materiales nos llevó a seis conclusiones principales.

1. Los objetivos observados eran fintechs brasileñas, en especial organizaciones pequeñas y medianas, con menor exposición mediática y menor madurez pública en seguridad en comparación con grandes instituciones financieras.
2. Las evidencias indican la actuación de un grupo, y no de un operador aislado. Esta evaluación se basa en múltiples señales: diferentes identificadores de acceso, actividad concurrente desde orígenes distintos, patrones operativos incompatibles con una única sesión humana continua y diferencias estilométricas en artefactos de código.
3. Al menos uno de los operadores parece tener familiaridad con el portugués brasileño. Esta conclusión proviene del uso del idioma en artefactos operativos y comentarios observados durante el análisis.
4. Identificamos evidencias del uso de LLMs para apoyar la construcción de tooling ofensivo. Los artefactos indican el uso de modelos de lenguaje para ayudar en la creación o adaptación de exploits, web shells, mecanismos de bypass, scripts de exfiltración y componentes auxiliares utilizados durante la operación.
5. Observamos intentos de eludir guardrails de LLMs mediante contextualización engañosa, especialmente llevando al modelo a operar bajo la premisa de un pentest autorizado. Este patrón es relevante porque muestra que el uso de IA por parte del grupo no se limitó a la productividad: también fue incorporado al proceso de desarrollo ofensivo.
6. Un punto relevante observado fue la duración de una de las operaciones asociadas a este conjunto de artefactos. En uno de los objetivos, identificamos actividad distribuida a lo largo de aproximadamente tres meses, lo que indica una intención directa y continua contra la organización comprometida. Este comportamiento reduce la hipótesis de un intento oportunista aislado y refuerza la evaluación de que el grupo mantenía interés operativo en el objetivo, adaptando su enfoque a medida que encontraba barreras, nuevas oportunidades de acceso y caminos potenciales para ampliar el impacto.

## Cadena de ataque

El vector común observado fue la explotación de vulnerabilidades a nivel de aplicación. El grupo no parecía depender exclusivamente de aplicaciones directamente vinculadas a flujos financieros. Por el contrario: buscaba aplicaciones en la misma infraestructura o en entornos adyacentes que pudieran servir como punto de entrada para movimiento lateral.

Después del acceso inicial, el grupo buscaba credenciales, archivos de configuración, variables de entorno, integraciones internas y recursos de administración que pudieran ampliar el acceso.

En los casos en que el compromiso avanzó, la persistencia fue simple. En los artefactos analizados, no observamos un esfuerzo sofisticado de ocultación. El objetivo parecía ser funcionalidad y velocidad operativa, no sigilo avanzado. Esto no redujo el impacto potencial de la operación: incluso implantes simples pueden ser suficientes cuando se combinan con credenciales válidas, segmentación débil, permisos excesivos y baja visibilidad del tráfico saliente.

En al menos un caso, los controles existentes impidieron la comunicación directa entre el implante y la infraestructura externa. La respuesta del grupo fue adaptar la operación. Observamos intentos de entrega de payloads blind, probing de diferentes puertos y ajustes sucesivos para entender el control aplicado y decidir cómo evadirlo. Este comportamiento indica capacidad operativa y persistencia, aunque el tooling en sí no sea particularmente sofisticado.

También observamos foco en la exfiltración de credenciales. El grupo buscaba acceso a otras aplicaciones y servicios utilizados por colaboradores de la organización comprometida, lo que sugiere interés en escalar el ataque más allá del primer sistema explotado.

## Por qué esto importa

Hay tres puntos que hacen que esta campaña sea relevante:

1. El primero es la elección de los objetivos: las fintechs brasileñas pequeñas y medianas pueden operar activos financieros relevantes, integraciones críticas y flujos transaccionales sensibles, pero no siempre cuentan con la misma capacidad de detección, respuesta y hardening encontrada en grandes instituciones financieras. Esto crea una superficie atractiva para grupos motivados financieramente.
2. El segundo es el papel de las aplicaciones como punto de entrada: la operación refuerza un patrón recurrente en muchas organizaciones: el camino hacia el impacto financiero no necesariamente comienza en el sistema financiero principal. Puede comenzar en una aplicación legada, un servicio administrativo, una integración poco monitoreada o un componente interno que comparte infraestructura con sistemas más críticos.
3. El tercero es el uso de IA como acelerador: el uso de LLMs no transforma automáticamente a un operador común en un actor avanzado, pero reduce costos, acelera la iteración y facilita la adaptación de tooling. En la práctica, esto permite que grupos con capacidad intermedia produzcan más variaciones de payloads, prueben hipótesis más rápidamente y superen obstáculos con menor dependencia de conocimiento especializado profundo.

## TTPs observadas — MITRE ATT&CK

Descripción comportamental de las TTPs del grupo. No incluye IoCs, como IPs, hashes, nombres de archivos, rutas internas o nombres de víctimas.

| Táctica | Técnica (ATT&CK) | Comportamiento observado |
|---|---|---|
| Desarrollo de Recursos (TA0042) | Obtain Capabilities: Tool (T1588.002) | Uso de exploits públicos listos junto con scripts propios (asistido por IA / agéntico) |
| Desarrollo de Recursos (TA0042) | Develop Capabilities (T1587) | Generación de tooling, playbooks e informes asistida por IA / agéntica |
| Acceso Inicial (TA0001) | Exploit Public-Facing Application (T1190) | Explotación a nivel de aplicación contra servicios expuestos, incluyendo aplicaciones legadas y modernas |
| Descubrimiento (TA0007) | Network Service Discovery (T1046) | Reconocimiento de la red interna, a partir del acceso obtenido, contra servicios adyacentes |
| Ejecución / Movimiento Lateral (TA0002 / TA0008) | Server-side abuse → consola de administración (T1190 → T1505.003) | Pivote hacia consola de administración/deploy para implantar código |
| Persistencia (TA0003) | Web Shell (T1505.003) + Masquerading (T1036) | Web shells disfrazados de endpoints legítimos de la propia aplicación, como health checks |
| Escalamiento de Privilegios (TA0004) | Escape to Host (T1611) | Acceso de contenedor a host por aislamiento deficiente del contenedor |
| Acceso a Credenciales (TA0006) | Credentials in Files / Private Keys (T1552.001 / .004) | Recolección de credenciales en archivos de configuración y claves, así como secretos expuestos en artefactos |
| Acceso a Credenciales (TA0006) | Steal Application Access Token (T1528) | Robo de tokens de acceso para reutilización (replay) |
| Acceso a Credenciales (TA0006) | Brute Force: Password Cracking (T1110.002) | Cracking offline de hashes exfiltrados con wordlists contextuales |
| Recolección (TA0009) | Email Collection (T1114) | Descarga masiva de buzones de correo y búsqueda dirigida de credenciales de acceso remoto y de sistemas financieros |
| Evasión de Defensas (TA0005) | Account Manipulation (T1098) | Alteración del hash de contraseña de un administrador por un valor conocido |
| Comando y Control (TA0011) | Non-Standard Port / Fallback Channels (T1571 / T1008) | Cuando el tráfico saliente fue bloqueado: payloads blind, escaneo de múltiples puertos y ajuste iterativo del canal |
| Impacto (TA0040) | Financially motivated targeting (intención) | Foco en datos y credenciales de pagos, crédito y banking |

## Conclusión

Esta investigación muestra un grupo con motivación financiera, foco sectorial claro y capacidad de adaptar tooling según los controles encontrados en el entorno de la víctima. El uso de IA aparece como un elemento de aceleración operativa, especialmente en la creación y modificación de herramientas ofensivas, pero no sustituye los fundamentos tradicionales de la intrusión: explotación de aplicaciones, recolección de credenciales, movimiento lateral, persistencia y búsqueda de impacto financiero.

No publicaremos IoCs ni detalles técnicos sensibles en este momento. La decisión es intencional: preservar ventaja de inteligencia, proteger a víctimas potenciales y evitar que la infraestructura o los métodos observados sean rápidamente modificados por los operadores.

Si su organización desea acceder al informe técnico detallado, póngase en contacto con nosotros. Estamos siempre disponibles para colaborar con equipos de seguridad, respuesta a incidentes e inteligencia de amenazas.