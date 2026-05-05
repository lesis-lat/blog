---
layout: post
title: 'Orientaciones para ofuscación y enmascaramiento de PII'
lang: es
category: Guias
excerpt: 'Recomendaciones prácticas para enmascarar tipos comunes de información personal sin exponer fragmentos útiles entre sistemas.'
author: Heitor Gouvêa
author-info:
  name:  Heitor Gouvêa
  image:  heitor-gouvea.jpeg
  description: Investigador con experiencia en ingeniería de software. La investigación de Gouvêa se centra en el descubrimiento de vulnerabilidades en aplicaciones modernas y en el desarrollo de herramientas y exploits.
  linkedin: htrgouvea
date: 2026-05-04 10:00:00 -0300
permalink: /blog/orientaciones-para-ofuscacion-y-enmascaramiento-de-pii/
---

### Introducción

Muchas aplicaciones manejan información personal identificable, conocida por la sigla PII: nombres, direcciones, correos electrónicos, teléfonos, documentos, identificadores de dispositivo y otros datos capaces de identificar a una persona directa o indirectamente.

Cuando esta información aparece en pantallas de aplicación, logs, reportes, herramientas de soporte, notificaciones o entornos no productivos, el sistema debe evitar exponer más de lo que el usuario u operador realmente necesita. Una forma común de reducir esta exposición es enmascarar u ofuscar parte del valor.

Esta práctica es familiar. Un flujo de recuperación de contraseña puede mostrar solo parte de un correo electrónico. Un panel de soporte puede mostrar solo los últimos dígitos de un teléfono. Una interfaz bancaria puede mostrar un identificador fiscal parcialmente oculto. Aun así, los detalles suelen ser inconsistentes. Sistemas distintos eligen caracteres visibles distintos, cantidades distintas y formatos distintos.

Esa inconsistencia importa. Si la misma PII se enmascara de formas diferentes en varias aplicaciones, cada aplicación puede revelar un fragmento diferente. Un atacante capaz de activar u observar esos flujos puede combinar los fragmentos y reconstruir el valor original.

Este artículo propone orientaciones prácticas para enmascarar campos comunes de PII. El objetivo no es definir un estándar legal universal, sino ofrecer una base técnica para personas de ingeniería, seguridad y producto que necesitan un comportamiento consistente al mostrar o procesar datos personales.

### Ofuscación, enmascaramiento y anonimización

Los términos suelen usarse como sinónimos, pero no significan lo mismo.

**Enmascaramiento** es la sustitución de parte de un valor por un marcador fijo, normalmente para ocultar caracteres sensibles mientras se conserva suficiente contexto para reconocimiento. Por ejemplo, `user.name@example.com` puede convertirse en `u*******e@e*****e.com`.

**Ofuscación** es una práctica más amplia de hacer que los datos sean más difíciles de entender o interpretar. El enmascaramiento es un tipo de ofuscación, pero no toda ofuscación es enmascaramiento. La ofuscación también puede incluir tokenización, supresión, truncamiento o transformaciones que preservan formato.

Un ejemplo de ofuscación que no es solo enmascaramiento es sustituir un correo electrónico por un identificador opaco. En lugar de mostrar `heitor.gouvea@lesis.lat` como `h***********a@l***s.lat`, el sistema podría mostrar `user_8f3a91`. En este caso, el valor original no aparece parcialmente. Fue sustituido por un identificador opaco. Esto puede ser tokenización o seudonimización, dependiendo de cómo se mantenga el mapeo con el valor original.

**Anonimización** significa transformar datos para que una persona ya no pueda ser identificada, directa o indirectamente, usando medios razonablemente disponibles. El enmascaramiento parcial no debe tratarse como anonimización por defecto. Un correo electrónico o teléfono enmascarado todavía puede vincularse a una persona, especialmente cuando se combina con otros datos.

En la práctica, el enmascaramiento es más útil como control de minimización de datos. Reduce la exposición innecesaria. No reemplaza criptografía, control de acceso, registros de auditoría, límites de retención o eliminación segura.

### Por qué importa la consistencia

Considere una persona que usa el mismo alias público en varias redes sociales. Un atacante quiere descubrir el correo electrónico asociado con ese alias. No puede ver el correo completo, pero puede activar flujos de recuperación de contraseña en varias plataformas.

Si cada plataforma enmascara el correo de una forma diferente, el atacante puede recibir fragmentos como estos:

| Plataforma | Correo enmascarado |
| :---- | :---- |
| Instagram | `h***********a@g***l.com` |
| Twitter | `*************@gmail.com` |
| LinkedIn | `*******ouvea@gm********` |
| Facebook | `hei**********@gma***om` |
| Telegram | `*****r.******ea@g*****.com` |

![Diagrama de reconstrucción de correo a partir de fragmentos enmascarados](/assets/publications/pii-obfuscation/email-reconstruction-es.svg)

<p class="content-caption"><strong>Figura 1:</strong> fragmentos de un mismo correo revelados por diferentes reglas de enmascaramiento pueden combinarse para reconstruir el valor original.</p>

Individualmente, cada fragmento puede parecer inofensivo. Juntos, pueden revelar suficiente estructura para reconstruir la dirección.

El mismo problema puede ocurrir dentro de una organización. Si dos aplicaciones leen la misma base de datos y enmascaran un identificador fiscal de formas diferentes, cada aplicación puede exponer una parte diferente del valor. Con el tiempo, logs, tickets, correos, capturas de pantalla y conversaciones de soporte pueden acumular suficientes fragmentos para debilitar la protección.

Por este motivo, el enmascaramiento debe tratarse como una decisión compartida de política, no como un detalle local de formato de interfaz. El mismo campo debe enmascararse de la misma forma en productos, herramientas internas, APIs y flujos operativos.

### Cuándo enmascarar PII

El enmascaramiento de PII es útil siempre que el valor completo no sea necesario para el usuario, operador o acción del sistema que se está ejecutando.

En sistemas de soporte, los agentes suelen necesitar confirmar que están mirando al cliente correcto, pero rara vez necesitan el documento completo, teléfono completo o correo completo. Mostrar un fragmento limitado puede ser suficiente para la verificación mientras se reduce la exposición en la interfaz de soporte.

En pruebas de restauración de backups, los equipos pueden necesitar forma y volumen de datos realistas, pero no deberían necesitar acceso a identificadores reales de clientes. Enmascarar o sustituir PII durante la restauración puede preservar el valor operativo de la prueba sin exponer datos personales innecesariamente en entornos no productivos.

En analytics y entrenamiento de modelos, los datos de producción pueden contener señales que los datos sintéticos no reproducen bien. Aun así, el comportamiento por defecto debe ser eliminar, enmascarar, agregar o tokenizar PII, a menos que el valor completo sea estrictamente necesario y esté legalmente justificado.

En logs y sistemas de observabilidad, el enmascaramiento es especialmente importante porque los logs suelen copiarse, indexarse, retenerse, exportarse y ser accedidos por grupos operativos más amplios. Un campo seguro en una base de datos de producción restringida puede volverse riesgoso cuando se repite en pipelines de logs.

### Principios generales de enmascaramiento

Las decisiones de enmascaramiento deben seguir algunas reglas simples.

Revele el mínimo necesario para completar el flujo. Si la persona usuaria solo necesita distinguir entre dos teléfonos, los dos o cuatro últimos dígitos pueden ser suficientes. Si un operador solo necesita saber que un correo fue enviado al dominio esperado, la parte local completa no debe estar visible.

Mantenga el formato reconocible cuando eso ayude a la usabilidad. Por ejemplo, preservar puntuación en un CPF o teléfono puede ayudar a reconocer el tipo de campo sin exponer el valor completo.

Evite revelar información estructural de alto valor. En algunos identificadores, ciertos dígitos tienen significado. En CPFs brasileños, por ejemplo, los dos últimos dígitos son verificadores y el noveno dígito puede indicar la región de emisión. Una regla de enmascaramiento debe considerar esa semántica en lugar de ocultar caracteres aleatorios.

Use una regla de enmascaramiento por tipo de campo y aplíquela en todos los lugares. Si la política para un correo electrónico es revelar el primer y último carácter de la parte local y de la etiqueta principal del dominio, toda aplicación debe usar la misma regla.

No use enmascaramiento parcial como única protección para almacenamiento sensible. Si el valor original debe conservarse, protéjalo con control de acceso, criptografía cuando sea apropiado, auditoría rigurosa y límites de retención. El enmascaramiento debe controlar principalmente la exposición en la capa de presentación, exportación, logging o datos derivados.

El enmascaramiento debe ocurrir lo más cerca posible de la superficie de exposición: interfaz, logs, exportaciones, mensajes, reportes y entornos derivados. No debe confundirse con transformar el dato original en la base de datos sin una necesidad clara.

### Patrones recomendados

Los patrones siguientes ofrecen un punto de partida práctico. Son ejemplos de baseline, no reglas universales. Cada organización debe validar los campos según jurisdicción, amenaza y necesidad operativa, pero el punto central es la consistencia.

| Campo | Valor original | Valor enmascarado | Orientación |
| :---- | :---- | :---- | :---- |
| CPF | `111.222.333-00` | `***.222.33*-**` | Oculte los tres primeros dígitos, el noveno dígito y los dos dígitos verificadores. Preserve la puntuación solo para legibilidad. |
| Correo electrónico | `user.name@example.com.br` | `u*******e@e*****e.com.br` | Revele solo el primer y último carácter de la parte local y de la etiqueta principal del dominio. Preserve sufijos públicos, como `.com.br`, cuando sea necesario para reconocimiento. |
| Teléfono | `(11) 91234-5678` | `(11) 9****-**78` | Preserve código de país o área solo cuando sea necesario para enrutamiento o reconocimiento. Revele la menor cantidad posible de dígitos finales exigida por el flujo. |
| Dirección IPv4 | `203.0.113.42` | `203.0.113.***` | Para visualización, oculte el octeto de host. Para analytics, prefiera agregación por subred cuando sea posible. |
| Dirección IPv6 | `2001:db8:abcd:0012:0000:0000:0000:0001` | `2001:db8:abcd:0012:****:****:****:****` | Preserve solo el prefijo de red necesario para uso operativo. Oculte segmentos específicos de interfaz. |
| Documento | `12.345.678-9` | `**.345.67*-*` | Trate documentos nacionales o regionales como identificadores estructurados. Oculte dígitos verificadores y evite exponer todas las posiciones semánticas. |
| Placa de vehículo | `ABC1D23` | `A**1*23` | Revele solo el mínimo necesario para reconocimiento por el usuario. Evite exponer suficientes caracteres para identificar unívocamente el vehículo en bases pequeñas. |
| IMEI | `356938035643809` | `35693803*****09` | Revele solo el TAC o dígitos finales cuando exista necesidad operativa. Evite mostrar el identificador completo del dispositivo en logs o herramientas de soporte. |

Estos ejemplos son intencionalmente conservadores. La cantidad exacta de caracteres visibles puede cambiar según el flujo, pero cada sistema debe tomar esa decisión explícitamente.

### Orientaciones de implementación

La lógica de enmascaramiento debe vivir en código compartido, no ser reimplementada independientemente en cada pantalla o servicio. Una pequeña biblioteca o servicio compartido reduce inconsistencias y facilita futuros cambios de política.

En organizaciones con múltiples sistemas, la forma más práctica de garantizar consistencia es adoptar una biblioteca estándar de enmascaramiento. En lugar de explicar la política completa a cada equipo y revisar manualmente cada implementación, la empresa puede recomendar una interfaz única para campos como CPF, correo electrónico, teléfono, IP y documentos.

Esto hace que la verificación sea más simple. En lugar de validar si cada proyecto implementó correctamente cada regla, la revisión pasa a verificar si el proyecto está usando la biblioteca aprobada. La política sigue siendo importante, pero su aplicación queda centralizada, comprobable y más fácil de evolucionar.

En algunas empresas, puede tener sentido desarrollar una biblioteca interna para esto, especialmente cuando existen reglas regulatorias, formatos locales, requisitos de auditoría o estándares específicos de producto. Esa biblioteca puede incluir pruebas, documentación, ejemplos de uso y versionado claro para cambios de comportamiento.

Los cambios en reglas de enmascaramiento deben versionarse y comunicarse, porque pueden afectar soporte, auditoría, pruebas e integraciones que dependen del formato mostrado. Si una regla cambia, debe tratarse como un cambio de comportamiento de la biblioteca, no como un detalle interno invisible.

Para empresas que usan LLMs o GenAI en el desarrollo, el mismo principio también se aplica. La recomendación de enmascaramiento puede formar parte de una skill, guideline o paquete de contexto usado por asistentes internos, instruyendo al modelo a usar la biblioteca estándar en lugar de generar nuevas implementaciones de enmascaramiento para cada proyecto.

Cada función de enmascaramiento debe recibir un valor normalizado y devolver una representación enmascarada. Normalización y enmascaramiento son preocupaciones relacionadas, pero separadas. Por ejemplo, un teléfono puede normalizarse internamente al formato E.164, mientras la capa de visualización puede formatearlo según la localidad del usuario antes de aplicar el patrón visible.

Los campos de PII deben enmascararse antes de entrar en pipelines de log, observabilidad o analytics. Después de que el dato sensible fue indexado, replicado y retenido, la corrección se vuelve mucho más difícil.

El tamaño de la entrada importa. Los valores cortos no deben filtrar demasiada información por accidente. Si la parte local de un correo tiene solo dos caracteres, revelar el primer y último carácter revela la parte local completa. En esos casos, enmascare el segmento completo o revele solo un carácter.

La política también debe definir qué ocurre con valores inválidos o inesperados. Una función de enmascaramiento debe fallar de forma cerrada: si no puede interpretar un valor con seguridad, debe devolver una representación totalmente enmascarada o redactada en lugar de la entrada original.

Por último, pruebe el comportamiento de enmascaramiento como lógica relevante para seguridad. Las pruebas unitarias deben cubrir valores normales, valores cortos, valores malformados, formatos internacionalizados, separadores, valores vacíos y valores ya enmascarados. Las pruebas de regresión son útiles porque cambios accidentales en el enmascaramiento pueden aumentar la exposición silenciosamente.

### Hashing y criptografía son controles diferentes

Enmascaramiento, hashing y criptografía resuelven problemas diferentes.

La criptografía protege la confidencialidad transformando datos con una clave criptográfica. Si el sistema necesita recuperar el valor original, la criptografía puede ser apropiada para almacenamiento o transmisión, dependiendo del modelo de amenaza y de la gestión de claves.

Hashing transforma datos en un resumen de tamaño fijo. Es útil para verificaciones de integridad y, con algoritmos adecuados de hash de contraseña, para almacenamiento de contraseñas. Hashes simples de PII predecible suelen ser débiles porque muchos identificadores tienen espacios de búsqueda pequeños o enumerables. Si es necesario usar hash de PII para coincidencia o deduplicación, use una construcción con clave u otro diseño adecuado al riesgo.

El enmascaramiento cambia lo que se muestra o exporta. No protege el valor original donde ese valor todavía existe. Un campo enmascarado en una interfaz no significa que la base de datos esté cifrada. Un valor enmascarado en un log no significa que los sistemas anteriores dejaron de procesar la PII original.

Buena ingeniería de privacidad normalmente combina estos controles: minimizar recolección, restringir acceso, enmascarar visualización, cifrar almacenamiento y transporte sensibles, auditar uso y eliminar datos cuando ya no sean necesarios.

### Conclusión

El enmascaramiento de PII es un control práctico para reducir exposición innecesaria de datos personales, pero solo funciona bien cuando es intencional y consistente.

El riesgo principal no es solo mostrar demasiados caracteres en un lugar. Es mostrar caracteres diferentes en lugares diferentes, permitiendo que fragmentos sean combinados. Una política compartida de enmascaramiento ayuda a prevenir ese modo de falla y da a los equipos de ingeniería un estándar claro para aplicar en aplicaciones, logs, herramientas de soporte, exportaciones y flujos de datos no productivos.

El enmascaramiento debe tratarse como parte de un programa más amplio de privacidad y seguridad. Apoya la minimización de datos, mejora la privacidad del usuario y reduce la exposición operativa, pero no reemplaza criptografía, control de acceso, revisión legal o buena gobernanza de datos.

### Referencias

1. [Datos personales - Wikipedia](https://es.wikipedia.org/wiki/Datos_personales)
2. [Guide to Protecting the Confidentiality of Personally Identifiable Information (PII) - NIST SP 800-122](https://nvlpubs.nist.gov/nistpubs/legacy/sp/nistspecialpublication800-122.pdf)
3. [Lei Geral de Proteção de Dados Pessoais (LGPD)](https://www.gov.br/esporte/pt-br/acesso-a-informacao/lgpd)
