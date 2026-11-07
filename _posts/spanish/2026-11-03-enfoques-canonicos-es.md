---
layout: post
title: 'Enfoques canónicos: lo que aprendí en Nubank sobre resolver un problema una sola vez'
lang: es
translation_key: canonical-approaches
category: research
excerpt: 'Un relato personal sobre el principio de enfoques canónicos, que viví de cerca en Nubank, y sobre por qué reducir la variación no esencial es una de las formas más eficaces de hacer que la seguridad escale.'
author: Heitor Gouvêa
date: 2026-11-03 12:00:00 -0300
permalink: /blog/enfoques-canonicos/
---

## Introducción

Durante el período en que trabajé en Nubank, conviví con un conjunto de principios de ingeniería. Uno de ellos cambió bastante la forma en que pienso la seguridad: *Canonical Approaches, Consistently Applied*, que puede traducirse como enfoques canónicos, aplicados de forma consistente.

En este texto, quiero explicar ese principio y mostrar por qué me parece una de las formas más eficaces de hacer que la seguridad escale. Todo lo que describo sobre Nubank está en fuentes públicas, la mayor parte publicada por la propia empresa en el blog *Building Nubank* o en charlas abiertas, y las referencias están al final del texto. No hablo de sistemas internos, incidentes ni herramientas propietarias. Lo que es mío aquí es la lectura de esas ideas y la forma en que empecé a aplicarlas en el trabajo que hago hoy en LESIS.

## El costo de la variación

Para entender el principio, conviene empezar por el problema que intenta resolver. A medida que una organización crece, los equipos toman decisiones técnicas de forma independiente, y el mismo problema termina resuelto de maneras distintas en cada parte de la empresa. Un equipo adopta una biblioteca HTTP, otro adopta otra, y un tercero escribe su propia forma de autenticar las llamadas entre servicios. Cada decisión suele ser razonable en el momento en que se toma, y por eso su costo rara vez aparece cuando miramos una decisión aislada.

Ese costo aparece más tarde, cuando hay que mejorar o corregir algo que vale para todos los servicios. Son los llamados *cross-cutting concerns*: timeouts, retries, validación de TLS, tracing, logs, autenticación y protección contra SSRF, entre otros. Cada cross-cutting concern tiene que implementarse, probarse y mantenerse en cada variación del stack, y cada variación nueva multiplica ese trabajo.

En seguridad, ese costo pesa todavía más. En la investigación de vulnerabilidades, me di cuenta de que muchos de los hallazgos más relevantes aparecen en los puntos en que un servicio se comporta de forma diferente a los demás, como un endpoint escrito antes de que existiera el framework de autenticación o una integración legada que usa su propio cliente HTTP. Cada variación es un lugar más donde un control puede haberse olvidado o haberse implementado a medias. Volveré a esta observación más adelante.

## El principio en Nubank

El principio de enfoques canónicos propone resolver cada problema una vez, de una manera, y hacer que esa manera se use en toda la organización. A partir de ahí, el trabajo pasa a ser mejorar esa solución, y cada mejora llega a todos los que la usan.

En 2022, Nubank publicó sus principios de ingeniería en una entrevista con Edward Wible, cofundador, primer ingeniero y ex-CTO de la empresa. Son seis:

1. Leverage through Platforms
2. Customer Trust is Hard to Earn and Easy to Lose
3. Data as a Strategic Asset
4. Ownership and Technical Resilience
5. Canonical Approaches, Consistently Applied
6. Multiple perspectives build better software

Wible describe el quinto principio como "un objetivo direccional", que en la práctica significa "elecciones menos numerosas, más ajustadas y más deliberadas". Su argumento trata sobre la capacidad de evolucionar: cuando cada equipo resuelve problemas parecidos a su manera, el sistema se vuelve más difícil de entender y, en sus palabras, "perdemos la capacidad de evolucionar el sistema como un todo" (traducción mía, como las demás citas de este texto). Cuando leí esa descripción, entendí el principio como un sesgo deliberado contra la variación, que los equipos tienen en cuenta cada vez que toman una decisión técnica.

Ese sesgo convive con otros valores de la empresa, como la descentralización, el ownership y la velocidad, y Wible lo presenta como un contrapeso a esas fuerzas. Los equipos siguen siendo libres de avanzar rápido, mientras la empresa evita la fragmentación que impediría cambios en el sistema entero. Él asocia ese equilibrio a un resultado concreto: Nubank tiene, por mucho, menos proyectos abandonados a mitad de camino y más proyectos terminados, porque se compromete a llevar las migraciones hasta el final y mira con escepticismo la variación "accidental".

El texto que mejor detalla el principio, y que recomiendo a cualquier persona interesada en el tema, es *The value of canonicity*, publicado en 2020 por Felipe Hummel, ingeniero de Nubank. Describe un stack deliberadamente reducido: Clojure para los servicios de producción, Kafka para la comunicación asíncrona, Datomic para los datos de negocio de alto valor, Scala con Spark para el análisis de datos, Python para machine learning y Flutter para mobile. A partir de ese stack, Hummel formula el objetivo de una manera más precisa, que es **evitar la variación no esencial**.

Esa idea de variación no esencial es central para el resto del texto. Hummel considera esencial una variación cuando una situación nueva pide una herramienta que aporta un valor claramente mejor, y no esencial cuando la herramienta nueva no aporta una ganancia clara sobre la existente o se adopta por novedad. También llama la atención sobre la variación interna, que existe dentro de un mismo lenguaje, en los estilos de código, frameworks, bibliotecas y patrones. El resultado esperado es que dos servicios Clojure elegidos al azar tengan la misma estructura de archivos y usen las mismas bibliotecas, como si los hubiera escrito el mismo equipo.

Para quienes trabajan en seguridad, esa consistencia tiene un efecto práctico muy claro. Cuando los servicios siguen la misma estructura, aprender a leer uno de ellos ayuda a leerlos todos, y la revisión pasa a concentrarse en los puntos en que un servicio se aparta del estándar.

## Variación esencial y el caso de Datomic

La distinción entre variación esencial y no esencial es lo que impide que el principio se convierta en una regla rígida, y la propia Nubank tiene un ejemplo público que lo muestra. En una charla en QCon San Francisco, en 2017, Edward Wible contó que la empresa usaba Datomic como base de datos por defecto para todo, y que eso daba una "falsa sensación de seguridad". Según él, Datomic es muy bueno para datos de negocio de alto valor, pero funciona peor para escrituras de gran volumen continuo y para textos largos, y en algunos casos la respuesta correcta era simplemente S3. El stack descrito por Hummel en 2020 ya refleja ese aprendizaje, con Datomic reservado para datos de alto valor y excepciones deliberadas, como Scala y Python, en los casos en que aportan una ganancia real.

Este caso muestra cómo funciona en la práctica el criterio de Hummel. Adoptar una tecnología nueva pasa a ser una decisión que pone en la balanza dos lados: la ganancia que aporta a un problema específico y el costo de que toda la organización pase a convivir con una variación más. Una variación es esencial cuando el primer lado pesa más.

Dan McKinley llegó a un razonamiento parecido en 2015, en el texto *Choose Boring Technology*. Argumenta que cada tecnología nueva trae una carga operativa y cognitiva que se acumula con el tiempo, que incluye monitoreo, pruebas y la necesidad de entender la herramienta antes de cambiarla. Para hacerlo concreto, propone imaginar que cada empresa tiene unos tres *innovation tokens* para gastar, y sugiere un ejercicio antes de adoptar cualquier cosa nueva: pensar en cómo resolver el problema inmediato sin agregar nada al stack. La mayoría de las veces, la respuesta es que se podría, aunque con más trabajo. Uso ese ejercicio con frecuencia.

## La cuenta de la variación

Volviendo a los cross-cutting concerns, el argumento que más me convenció es aritmético. Imagina una organización hipotética con dos lenguajes y dos bibliotecas HTTP en cada uno, lo que da cuatro clientes HTTP diferentes. Con seis cross-cutting concerns, son 24 implementaciones para mantener, revisar y corregir. Con un cliente canónico, son seis, y cada concern nuevo cuesta una implementación más en lugar de cuatro.

| | Clientes HTTP | Cross-cutting concerns | Implementaciones |
|---|---|---|---|
| Con variación | 4 | 6 | 24 |
| Canónico | 1 | 6 | 6 |
| Nuevo concern, con variación | 4 | 7 | 28 |
| Nuevo concern, canónico | 1 | 7 | 7 |

Hummel describe el mismo efecto en términos de alcance. Para él, cada división de lenguaje, framework o base de datos limita hasta dónde llega una mejora. Una funcionalidad de seguridad construida para los servicios Clojure se aplica a todos ellos, mientras que un servicio en Node.js necesitaría una reimplementación. Las bibliotecas comunes, para Datomic, DynamoDB, Kafka, llamadas HTTP, generación de PDF y otras, tienen que existir y mantenerse para cada entorno soportado, y cada división, escribe él, es más trabajo en el backlog de alguien.

Otros beneficios se derivan de la misma lógica. Cuando los servicios se parecen, cualquier ingeniero puede leer cualquiera de ellos, y quien cambia de equipo necesita aprender el dominio de negocio, ya que el stack es el mismo. Hummel cuenta que Nubank adopta la regla de que todo el software debe estar abierto a contribuciones de cualquier ingeniero, algo que solo es viable con un stack común y que hace que la dependencia entre equipos salga del backlog y pase al code review. Por último, las herramientas internas, la documentación y el conocimiento pasan a acumularse en pocos lugares.

### Mejoras que llegan a todos

Hummel resume este beneficio al decir que la idea es corregir cada cosa, de preferencia, una sola vez, y que toda mejora o corrección relacionada con la seguridad puede aplicarse con facilidad a todos los servicios. Cuando un problema se resuelve en una pieza canónica, cada mejora hecha en ella la heredan todos los que la usan. Un default de timeout más sensato, una validación más, un campo nuevo en el log o una corrección de seguridad llegan a todos los servicios en la próxima actualización, y con eso el nivel de la organización sube con cada mejora. En un entorno con variación, la mejora hecha en un cliente HTTP queda restringida a él, y la distancia entre el mejor y el peor servicio de la organización tiende a crecer con el tiempo.

Este beneficio depende de una condición, que es la propagación de las actualizaciones. Una biblioteca canónica con doce versiones distintas en uso equivale, en la práctica, a doce bibliotecas, y la variación vuelve a aparecer. Para evitarlo existen reglas como la *One-Version Rule*, defendida en el libro *Software Engineering at Google*, según la cual solo existe una versión de cada componente en uso en la organización, y automatizaciones como [Dependabot](/blog/dependabot-automatizando-actualizacion-de-dependencias-en-github/).

## Enfoques canónicos y seguridad

Al principio del texto, comenté que muchos hallazgos relevantes aparecen en los puntos en que un servicio se comporta de forma diferente a los demás. Esa observación explica por qué el principio tiene un efecto tan grande en seguridad. El atacante busca justamente esos puntos, y cada variación no esencial aumenta su cantidad. En un entorno donde casi todos los servicios pasan por el middleware de autenticación, el objetivo interesante es el servicio que queda fuera.

Lo que la experiencia en Nubank me aportó fue la perspectiva de trabajar en un entorno que intenta, por principio, reducir esas excepciones. En ese contexto, la pregunta del equipo de seguridad deja de ser solo dónde falta un control y pasa a incluir por qué un determinado servicio es diferente de los demás.

### Eliminar clases enteras de vulnerabilidades

La aplicación más ambiciosa de este razonamiento en seguridad que conozco viene de Google. La empresa pasó más de una década construyendo frameworks y APIs que impiden que el desarrollador escriba código vulnerable a XSS y a SQL injection, con tipos que bloquean que un dato no tratado llegue a un sink. Christoph Kern, uno de los responsables de ese trabajo, describe el resultado como una reducción drástica de esas clases de defectos en cientos de aplicaciones. En un artículo de 2024, argumenta que la seguridad de un software es una propiedad del ecosistema en el que se desarrolla, lo que incluye lenguajes, bibliotecas, frameworks y herramientas de build y deploy. Veo ese trabajo como el principio canónico llevado al límite, en el que el problema se resuelve una vez, en la capa canónica, y deja de existir para quien la usa.

### La seguridad como propiedad de la arquitectura

Netflix, que popularizó el concepto de *paved road*, el camino por defecto, bien soportado y más fácil de seguir, aplicó esta idea en otro punto del stack. Al proteger las aplicaciones de los estudios, el equipo de seguridad y el equipo de gateway crearon Wall-E, una versión del gateway Zuul que aplica autenticación vía SSO en todas las solicitudes. Con el tiempo, Wall-E pasó a encargarse también del WAF, la protección contra DDoS, la validación de security headers y los logs, y la mayor parte del checklist de seguridad para exponer una aplicación a internet se resumió en una pregunta: "¿Vas a usar Wall-E?".

En 2021, Wall-E ya protegía más de 350 aplicaciones. Según el propio equipo, la adopción vino de la facilidad, ya que una aplicación podía pasar de un `git init` a producción, autenticada y accesible desde internet, en menos de diez minutos, y pasaba por una revisión de seguridad mucho más corta. Para mí, esta es la lección más importante del caso: las personas adoptaron el camino canónico porque era el más fácil de seguir.

### Respuesta a incidentes

En diciembre de 2021, la vulnerabilidad Log4Shell (CVE-2021-44228) obligó a miles de organizaciones a descubrir dónde usaban Log4j. En entornos heterogéneos, responder esa pregunta llevó días o semanas, y buena parte del esfuerzo se gastó en localizar la biblioteca antes de cualquier corrección.

En un entorno canónico y con inventario de dependencias, la misma pregunta se responde con una consulta, y la corrección se reduce a una actualización de versión en la biblioteca común, propagada por automatización. La posibilidad de aplicar una corrección de seguridad a todos los usuarios de una dependencia de una sola vez es, de hecho, uno de los beneficios más citados de la *One-Version Rule*.

### Detección

En la detección, la lógica se repite. Cuando todos los servicios registran eventos con la misma biblioteca, los mismos campos y el mismo correlation ID, una única regla de detección los cubre a todos. En la charla pública de 2017, Nubank describió un correlation ID al que cada servicio agrega un segmento, formando un árbol que permite rastrear una solicitud por toda la arquitectura. Con logs heterogéneos, cada regla tiene que reescribirse para cada formato, y los huecos quedan en los formatos que nadie cubrió.

## Conclusión

El principio de enfoques canónicos parte de una idea simple: resolver cada problema una vez, en un lugar, y hacer que esa solución se use en toda la organización. En Nubank, aparece como una dirección que orienta las decisiones técnicas, y la distinción de Hummel entre variación esencial y no esencial es lo que permite aplicarlo sin convertirlo en una regla rígida, como muestra el caso de Datomic.

En seguridad, este principio tiene un peso especial. Cuando un control vive en una pieza canónica, cada mejora hecha en él llega a todos los servicios, siempre que las actualizaciones se propaguen. Los casos de Google y Netflix muestran hasta dónde puede llegar esto, con clases enteras de vulnerabilidades eliminadas en el ecosistema de desarrollo y un checklist de seguridad reducido a una pregunta sobre el uso de Wall-E. La respuesta a incidentes y la detección también se vuelven más simples cuando todos los servicios usan las mismas bibliotecas y registran eventos de la misma manera.

Para quienes trabajan en defensa, la conclusión vuelve a la observación del inicio del texto. El atacante busca el servicio que se comporta de forma diferente a los demás, y cada variación no esencial que deja de existir es un lugar menos donde puede encontrar una falla.

## Referencias

1. [Nubank's Engineering Principles, by Edward Wible - Building Nubank](https://building.nu.com/nubanks-engineering-principles-interview-with-ed-wible/)
2. [The value of canonicity - Felipe Hummel, Building Nubank](https://building.nu.com/the-value-of-canonicity/)
3. [Architecting a Modern Financial Institution - Edward Wible y Rafael Ferreira, QCon San Francisco 2017](https://www.infoq.com/presentations/nubank-architecture/)
4. [Choose Boring Technology - Dan McKinley](https://mcfunley.com/choose-boring-technology)
5. [Software Engineering at Google, capítulo 16: Version Control and Branch Management](https://abseil.io/resources/swe-book/html/ch16.html)
6. [The Show Must Go On: Securing Netflix Studios At Scale - Netflix Technology Blog](https://netflixtechblog.com/the-show-must-go-on-securing-netflix-studios-at-scale-19b801c86479)
7. [Developer Ecosystems for Software Safety - Christoph Kern, ACM Queue](https://research.google/pubs/developer-ecosystems-for-software-safety/)
8. [Secure by Design at Google - Google Research](https://research.google/pubs/secure-by-design-at-google/)
9. [Apache Log4j Vulnerability Guidance - CISA](https://www.cisa.gov/news-events/news/apache-log4j-vulnerability-guidance)
