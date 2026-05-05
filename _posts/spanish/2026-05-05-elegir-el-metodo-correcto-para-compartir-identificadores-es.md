---
layout: post
title: 'Elegir el método correcto para compartir identificadores'
lang: es
category: Estudio de Caso
excerpt: 'Cómo elegir entre criptografía, hash, HMAC, APIs y PSI al comparar bases con identificadores personales.'
author: Heitor Gouvêa
author-info:
  name:  Heitor Gouvêa
  image:  heitor-gouvea.jpeg
  description: Investigador con experiencia en ingeniería de software. La investigación de Gouvêa se centra en el descubrimiento de vulnerabilidades en aplicaciones modernas y en el desarrollo de herramientas y exploits.
  linkedin: htrgouvea
date: 2026-05-05 08:00:00 -0300
permalink: /blog/elegir-el-metodo-correcto-para-compartir-identificadores/
---

### Introducción

Algunos problemas de seguridad aparecen justamente cuando dos empresas legítimas quieren colaborar.

Imagine una institución financiera digital con una base muy grande de clientes y un marketplace preparando una promoción exclusiva para clientes de esa institución. Durante la campaña, el marketplace necesita saber qué personas también son clientes de la institución financiera para aplicar el beneficio correctamente.

El problema parece simple: una empresa tiene la lista de clientes elegibles, la otra tiene su propia base de usuarios, y la promoción debe valer solo para la intersección entre las dos bases.

Pero existe una pregunta importante: ¿cómo permitir esa comparación sin exponer más datos personales de lo necesario?

### El Escenario

La necesidad de negocio era directa: una campaña promocional debía ser ofrecida por un socio comercial solo a clientes de la institución financiera.

Como la institución financiera tenía una base de clientes mayor que la base del socio, simplemente enviar todos los CPFs de sus clientes al socio permitiría la comparación, pero expondría a muchas más personas de lo necesario.

La primera propuesta del equipo responsable de la integración era cifrar un archivo que contenía todos los CPFs de los clientes elegibles y transmitirlo por un canal seguro. El socio recibiría el archivo, lo descifraría, lo compararía con su propia base e identificaría qué usuarios eran elegibles.

Desde el punto de vista del transporte, eso parece razonable. El archivo estaría protegido durante el envío. El canal podría estar autenticado. El acceso podría estar restringido.

Pero el problema principal no era solo el transporte. El problema era la minimización.

Al final del proceso, el socio tendría acceso a una lista completa de CPFs de clientes de la institución financiera, incluso personas que tal vez ni siquiera tuvieran cuenta en el marketplace, nunca participaran en la campaña o nunca necesitaran ser conocidas por el socio. La criptografía protegería el archivo en el camino, pero no reduciría el dato revelado al destinatario.

### La Criptografía Resuelve Otro Problema

La criptografía es una herramienta de confidencialidad. Protege datos contra quien no debe acceder a ellos durante el almacenamiento o la transmisión. Si un archivo cifrado es interceptado por alguien sin la clave, el contenido permanece protegido.

Pero, en muchos flujos de integración, el destinatario legítimo necesita abrir el archivo. Después de descifrarlo, pasa a ver los valores originales.

En este caso, la criptografía respondía a la pregunta:

> ¿Cómo enviar la lista de CPFs sin que terceros lean el archivo en el camino?

Pero había una segunda pregunta que todavía debía ser respondida:

> ¿Cómo permitir que el socio descubra solo qué clientes ya existen en su propia base, sin recibir la lista completa de la institución financiera?

Estas preguntas parecen parecidas, pero son problemas diferentes. La primera trata de confidencialidad en tránsito y seguía siendo necesaria. La segunda trata de minimización de datos y exposición al destinatario. El punto no era reemplazar la criptografía, sino reconocer que debía combinarse con un diseño que revelara menos información.

### Dónde Ayudan los Hashes

Un hash criptográfico transforma una entrada en una salida de tamaño fijo. Para la misma entrada, el resultado siempre es el mismo. Para entradas diferentes, se espera que los resultados sean diferentes. Los buenos algoritmos de hash también hacen impracticable recuperar la entrada original a partir de la salida, siempre que la entrada tenga suficiente entropía.

Esta propiedad determinística permite comparación sin transmitir el valor original.

Por ejemplo, en lugar de compartir:

```text
123.456.789-10
```

una empresa podría compartir:

```text
sha256("12345678910") = 01b6...f3a9
```

Si el socio normaliza sus propios CPFs de la misma forma y calcula el mismo hash, puede comparar los hashes. Cuando hay igualdad, existe un CPF en común.

La ganancia de privacidad es intuitiva: en lugar de revelar directamente los CPFs, las empresas comparan representaciones derivadas. El socio solo debería poder reconocer los CPFs que ya conoce, porque necesita tener el valor original en su propia base para generar el mismo hash.

Esta idea es útil, pero hay una trampa importante.

### CPF Es Enumerable

Los desarrolladores muchas veces aprenden hash en el contexto de contraseñas. En ese contexto, la entrada idealmente es secreta, elegida por el usuario y difícil de adivinar. Aun así, las contraseñas exigen algoritmos específicos como Argon2, bcrypt o scrypt, además de salt, costo computacional y buenas políticas de almacenamiento.

CPF es diferente.

CPF tiene formato conocido, cantidad limitada de combinaciones y dígitos verificadores. Esto significa que un atacante puede generar muchos CPFs candidatos, calcular sus hashes y compararlos con una lista filtrada. Ese es el principio de los ataques de diccionario o rainbow table.

Por eso, el siguiente enfoque es débil:

```text
sha256(cpf_normalizado)
```

No revela el CPF de forma directa, pero tampoco debe tratarse como anonimización. Para identificadores previsibles, un hash simple suele ser reversible por fuerza bruta o precomputación.

Este punto es esencial: hash no es magia. La seguridad depende tanto del algoritmo como de la naturaleza de la entrada.

### La Normalización Importa

Antes de cualquier comparación, ambos lados necesitan llegar exactamente a la misma representación del identificador.

En el caso de CPF, esto normalmente significa eliminar puntuación, validar longitud, preservar ceros a la izquierda y rechazar valores inválidos o malformados. De lo contrario, el mismo CPF puede producir hashes diferentes:

```text
123.456.789-10
12345678910
```

Estas dos cadenas tienen apariencia equivalente para una persona, pero son entradas diferentes para un algoritmo de hash.

Toda estrategia de comparación necesita documentar la normalización antes de documentar el algoritmo. Sin eso, el proceso produce falsos negativos, inconsistencia operativa y dificultades de auditoría.

### Salt No Siempre Resuelve

Una reacción común es agregar salt:

```text
sha256(salt || cpf_normalizado)
```

En almacenamiento de contraseñas, salt es fundamental porque impide que el mismo valor genere el mismo hash en bases diferentes y dificulta tablas precomputadas genéricas. Pero, en un proceso de comparación entre dos empresas, ambas partes necesitan generar el mismo resultado para el mismo CPF.

Si cada empresa usa un salt diferente, los hashes no coincidirán. Si el salt se comparte entre las empresas, ayuda contra algunas tablas precomputadas externas, pero no impide que una parte con acceso al salt enumere CPFs candidatos y calcule sus hashes.

Salt es útil, pero no resuelve por sí solo el problema de identificadores previsibles en una integración de matching.

### HMAC con API como Camino Pragmático

Una alternativa mejor que hash simple es usar HMAC:

```text
hmac_sha256(clave_secreta, cpf_normalizado)
```

HMAC usa una clave secreta en el cálculo. Sin la clave, un tercero que obtenga la lista de HMACs no consigue calcular fácilmente los valores correspondientes para CPFs candidatos. Esto reduce bastante el riesgo de ataques offline por terceros.

Pero hay una cuestión de diseño. Si la clave se comparte con el socio para que calcule HMACs sobre su propia base, también puede calcular HMACs para CPFs candidatos por cuenta propia. Esto puede ser aceptable en algunos escenarios, siempre que la clave sea específica para la campaña, tenga rotación, alcance limitado y controles de auditoría, pero cambia el modelo de confianza.

Un camino pragmático sería combinar HMAC con una API controlada por la institución financiera. En este diseño, el marketplace prepara su propia base, normaliza los CPFs, calcula los identificadores derivados según la especificación de la campaña y envía un lote a la API. La institución financiera compara esos valores contra una representación equivalente de su propia base y devuelve solo el resultado necesario para la campaña. Ese resultado no necesita ser una nueva lista de CPFs. Puede ser una marca de elegibilidad asociada a los usuarios del propio marketplace.

Un ejemplo simple sería:

```text
Marketplace envía:
user_id=10, hmac_cpf=aaa
user_id=20, hmac_cpf=bbb
user_id=30, hmac_cpf=ccc
```

Después de la comparación, la API podría responder:

```text
user_id=10, eligible=true
user_id=20, eligible=false
user_id=30, eligible=true
```

Con esto, el marketplace consigue aplicar la campaña dentro de su propia base, pero no recibe la lista completa de CPFs de la institución financiera. El CPF se usa como clave técnica de comparación, pero el resultado operativo es una marca de elegibilidad.

Este enfoque cambia el problema a un modelo de consulta controlada. Si la API permite probar CPFs arbitrarios, incluso con autenticación y HMAC, puede convertirse en un oráculo de elegibilidad. Por eso, este tipo de solución necesita controles adicionales: aceptar solo lotes asociados a la base declarada del socio, limitar reprocesamientos, auditar consultas, imponer ventanas de campaña y definir claramente qué está permitido probar. En otras palabras, HMAC y API pueden formar una solución práctica, pero la garantía pasa a depender de gobernanza y control operativo. Para escenarios que exigen una garantía técnica más fuerte sobre lo que cada parte aprende, existe un enfoque más sofisticado.

### Una Alternativa Más Sofisticada: Intersección Privada de Conjuntos

Una alternativa más sofisticada para este tipo de problema se conoce como intersección privada de conjuntos, o Private Set Intersection (PSI).

En términos simples, PSI es una familia de protocolos criptográficos que permite que dos partes comparen conjuntos y descubran una intersección sin compartir los conjuntos en claro. La idea no es "cifrar una lista y entregarla al otro lado". La idea es ejecutar un proceso en el que cada parte mantiene su conjunto y participa en una comparación protocolizada.

Un ejemplo pequeño ayuda a visualizar el objetivo. Suponga que la institución financiera tiene los CPFs `111`, `222`, `333` y `444`. El socio tiene los CPFs `222`, `444` y `555`. El resultado necesario para la campaña es saber que `222` y `444` están en los dos conjuntos. El socio no necesita aprender que `111` y `333` existen en la base de la institución financiera. La institución financiera tampoco necesita aprender que `555` existe en la base del socio, a menos que el diseño del protocolo o de la campaña lo exija.

En una comparación común usando archivo, una de las partes recibe una lista y hace la intersección localmente. Eso es simple, pero obliga a esa parte a ver valores que no forman parte del resultado final. En una API de consulta, por otro lado, la institución financiera puede evitar entregar toda su base al marketplace, pero pasa a observar el lote que el marketplace está consultando. Eso puede ser aceptable. Pero, si el requisito también es reducir lo que la institución financiera aprende sobre la base del marketplace, una API centralizada puede no ser suficiente.

Existen diferentes formas de implementar PSI. Algunas usan criptografía de clave pública, otras usan oblivious transfer, circuitos garbled o construcciones basadas en hashing y claves efímeras. El detalle matemático cambia según el protocolo, pero el objetivo de seguridad permanece: permitir matching entre conjuntos sin transformar una integración en compartición amplia de base.

También es importante observar que PSI no define solo "cómo comparar". Ayuda a definir "quién aprende qué". En algunos diseños, ambas partes aprenden la intersección. En otros, solo una parte aprende qué usuarios son elegibles. Para el caso de la promoción, este segundo modelo tiene más sentido: el marketplace necesita aplicar el beneficio dentro de su propia base, mientras que la institución financiera no necesariamente necesita aprender qué clientes también están en el marketplace.

Aplicado al caso de la promoción, el resultado deseado tal vez no fuera una nueva lista de CPFs compartida entre empresas. Podría ser solo una forma de que el socio marque, dentro de su propia base, qué usuarios son elegibles. Esta distinción reduce exposición porque mantiene el foco en el resultado operativo de la campaña, no en la circulación de identificadores.

PSI, sin embargo, no elimina todos los riesgos. Si una parte puede elegir libremente el conjunto de entrada, todavía puede intentar probar identificadores que no pertenecen a su base legítima. Por eso, PSI no reemplaza contrato, auditoría, controles de alcance y validación del proceso. Lo que mejora es otro punto: reduce la necesidad de que una parte entregue toda su base en claro, y también puede reducir cuánto observa la otra parte durante la comparación.

En la práctica, PSI es más complejo que una API con HMAC. Exige una biblioteca adecuada, entendimiento del protocolo, cuidado con la normalización, tratamiento de errores, auditoría, pruebas de performance y evaluación de lo que cada parte aprende durante el proceso. No todo caso exige ese nivel de sofisticación. Pero debe considerarse cuando el requisito no es solo evitar que el marketplace reciba toda la base de la institución financiera, sino también reducir cuánto aprende la institución financiera sobre el conjunto del marketplace durante el matching.

### Una Jerarquía Práctica de Soluciones

No toda integración necesita el mismo nivel de protección. Una forma pragmática de pensar es organizar las opciones por reducción de exposición.

Un archivo con CPFs cifrado en tránsito protege contra interceptación, pero revela la lista completa al destinatario. Es simple, pero débil en minimización.

Hash simple de los CPFs evita exposición directa casual, pero es vulnerable a enumeración porque CPF es previsible. No debe tratarse como anonimización.

HMAC con clave controlada mejora la protección contra terceros y filtraciones de la lista derivada, pero exige gobernanza fuerte sobre la clave. En lugar de compartir la clave con el socio, una API autenticada usando HMAC puede ser una alternativa práctica cuando el objetivo es responder elegibilidad sin entregar toda la base de la institución financiera, siempre que no permita consultas arbitrarias sin control.

PSI o un protocolo equivalente es una opción más sofisticada cuando también hay interés en reducir lo que la institución financiera aprende sobre el conjunto consultado por el marketplace, además de evitar la entrega de toda la base al socio.

Esta jerarquía ayuda a explicar por qué la respuesta inicial de "vamos a cifrar el archivo" era insuficiente. La pregunta no era solo cómo transportar datos con seguridad. La pregunta era cuánto dato necesitaba revelarse para alcanzar el objetivo.

### Conclusión

Una revisión de seguridad para este tipo de compartición debe comenzar por preguntas simples. Antes de elegir algoritmo, es necesario entender cuál es el objetivo exacto de la comparación, quién necesita aprender el resultado y qué formato debe tener ese resultado. ¿El resultado necesita ser una lista de CPFs, una lista de usuarios elegibles, un booleano por usuario o solo una cuenta agregada?

También es necesario evaluar qué datos de personas fuera de la intersección serían expuestos por la solución propuesta. Esta es una pregunta central, porque una solución puede parecer segura por usar criptografía y aun así revelar un conjunto mucho mayor de lo necesario al destinatario legítimo.

Otro punto importante es la naturaleza del identificador usado. Si el identificador es previsible o tiene baja entropía, hash simple no debe tratarse como protección fuerte. La existencia de normalización documentada también debe verificarse, porque pequeñas diferencias de formato pueden romper la comparación o crear excepciones difíciles de auditar.

Por último, la revisión debe cubrir quién controla claves, salts o secretos, si el proceso es auditable y reproducible, y si existe retención limitada de los archivos intermedios y resultados. Estas preguntas evitan que la discusión quede limitada a "¿el archivo está cifrado?". La seguridad del transporte importa, pero minimización, finalidad, retención y modelo de confianza importan tanto como ella.

Criptografía, hash, HMAC, APIs y PSI son herramientas diferentes para problemas diferentes. La decisión correcta depende menos de la familiaridad con una técnica específica y más de lo que cada parte necesita aprender durante el proceso.

El aprendizaje principal de este caso es que "transmitir con seguridad" no es lo mismo que "revelar el mínimo necesario". En integraciones entre empresas, especialmente cuando involucran identificadores personales, la arquitectura debe comenzar por la minimización: ¿quién necesita saber qué, por cuánto tiempo y con qué garantía técnica?

A veces, la mejor solución no es cifrar mejor el archivo. Es evitar que el archivo exista de esa forma.

### Referencias

1. [Cryptographic hash function - Wikipedia](https://en.wikipedia.org/wiki/Cryptographic_hash_function)
2. [Hash-based message authentication code - Wikipedia](https://en.wikipedia.org/wiki/HMAC)
3. [Private set intersection - Wikipedia](https://en.wikipedia.org/wiki/Private_set_intersection)
4. [NIST SP 800-107 Rev. 1 - Recommendation for Applications Using Approved Hash Algorithms](https://csrc.nist.gov/pubs/sp/800/107/r1/final)
