---
layout: post
title: 'Primitivas y vulnerabilidades'
lang: es
category: Investigacion
excerpt: 'Cómo pensar en primitivas ayuda a transformar discrepancias entre intención y comportamiento real en análisis de impacto.'
author: Heitor Gouvêa
author-info:
  name:  Heitor Gouvêa
  image:  heitor-gouvea.jpeg
  description: Investigador con formación en ingeniería de software. La investigación de Gouvêa se centra en el descubrimiento de vulnerabilidades en aplicaciones modernas y en el desarrollo de herramientas y exploits.
  linkedin: htrgouvea
date: 2026-04-26 16:20:00 -0300
---

### Introducción

La semana pasada probé el uso de LLMs para apoyar el proceso de investigación de vulnerabilidades. Eso me hizo pensar: ¿cómo podemos "enseñar" a un modelo a ayudar realmente a encontrar bugs válidos?

Reflexioné sobre mi propio proceso: cómo analizo código, modelo amenazas y llego al punto en que algo se convierte, de hecho, en una vulnerabilidad.

### Entendiendo, o creando, primitivas

En resumen, percibí que intento responder tres preguntas durante los análisis:

1. ¿Qué está intentando hacer este código, feature, componente o endpoint?
2. ¿Qué hace realmente?
3. ¿Qué es posible hacer con eso?

Elijo una primitiva: la menor parte del sistema que ejecuta una acción, como una función, endpoint o componente. Primero intento entender qué debería hacer, usando documentación, nombres y contexto.

Después observo qué hace realmente: ejecuto, pruebo entradas válidas e inválidas, inspecciono logs y comparo con el comportamiento esperado.

Cuando encuentro una discrepancia entre intención y realidad, me pregunto: ¿qué se puede hacer con esto? A partir de ahí mapeo qué podría controlar un actor malicioso, qué acciones conseguiría ejecutar y cuál sería el impacto.

Si esa diferencia permite causar un impacto real, entonces es una vulnerabilidad.

Pequeñas discrepancias aisladas a veces no generan impacto relevante, pero cuando se encadenan casi siempre revelan vectores interesantes. Después de mirar lo micro, es necesario tener un entendimiento de lo macro: cómo todas esas primitivas pueden combinarse.

Ahora estoy usando algunos prompts generados a partir de este entendimiento en el día a día, de manera automatizada e integrada a mi workflow. Me apoyan en un entendimiento más rápido de componentes, sugieren entradas de datos más contextuales, proponen entradas de prueba y traducen discrepancias en posibles escenarios.

### Un ejemplo simple

En un análisis pasado, probé una aplicación web e identifiqué una pantalla de login. Hice varias pruebas, incluyendo el uso de un correo válido con contraseñas incorrectas, intentando generar feedbacks diferentes de la aplicación para entender mejor el comportamiento del flujo.

Después de más de cinco intentos de login con la contraseña incorrecta, la aplicación devolvió una advertencia: la cuenta estaba bloqueada porque el límite de intentos había sido excedido.

Con la primera pregunta, la intención parecía clara: ese control existía para prevenir ataques de fuerza bruta.

Con la segunda pregunta, el comportamiento real tenía detalles importantes. El bloqueo no expiraba automáticamente, el usuario no tenía una forma simple de desbloquear su propia cuenta y no se enviaba ninguna notificación por correo avisando sobre el bloqueo. Para recuperar el acceso, era necesario contactar al soporte.

Con la tercera pregunta, el impacto posible quedaba más claro. Un actor malicioso no necesitaba descubrir la contraseña ni acceder a la cuenta. Bastaba con conocer o enumerar correos válidos y realizar intentos de login con contraseñas incorrectas para bloquear cuentas reales. Un control creado para proteger contra fuerza bruta podría ser usado como una primitiva de denegación de servicio contra usuarios legítimos.

### Conclusión

Pensar en primitivas ayuda a transformar el análisis en un proceso más explícito. En lugar de mirar el sistema solamente como un conjunto grande y complejo de funcionalidades, paso a observar pequeñas acciones, comparar intención y realidad, y después entender cómo esas diferencias pueden ser usadas.

Este razonamiento es útil para la investigación manual y también para el uso de LLMs. Cuanto mejor puedo describir una primitiva, su intención, su comportamiento real y su posible impacto, mejor puedo usar modelos y automatizaciones como apoyo al proceso de investigación. Al final, encontrar vulnerabilidades sigue dependiendo del juicio técnico, pero estructurar el camino hacia ellas vuelve ese juicio más claro, repetible y fácil de comunicar.
