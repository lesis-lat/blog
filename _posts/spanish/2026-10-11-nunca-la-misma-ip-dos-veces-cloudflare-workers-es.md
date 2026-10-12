---
layout: post
title: 'Poniendo la nube a trabajar: rotación de IP con computación serverless'
lang: es
translation_key: cf-proxy-ip-rotation
category: research
excerpt: 'Cómo cf-proxy convierte los Cloudflare Workers en un proxy rotativo barato, con una IP de origen distinta en casi cada petición y un ASN de confianza, y los pentests que llevaron a construirlo.'
author: Lucas Vieira Araujo
date: 2026-10-11 09:00:00 -0300
permalink: /blog/cf-proxy-rotacion-de-ip-con-cloudflare-workers/
---

## Introducción

Durante un pentest es habitual tener que cambiar la dirección IP momentáneamente por algún motivo. Quizá estés intentando hacer peticiones sucesivas a un endpoint con un rate limit basado en IP, quizá tu IP actual haya sido bloqueada por un firewall a raíz de una prueba anterior (o simplemente porque tu proveedor tiene mala reputación). Sea cual sea el motivo, seguramente alguna vez en la vida tuviste que conectarte a una VPN o a un proxy.

Pero cuando esto ocurre durante una evaluación de seguridad, el problema normalmente no termina ahí. Si te bloquearon una vez, es muy probable que te bloqueen de nuevo pronto y necesites una forma de volver a cambiar la dirección. Con el tiempo esto se vuelve muy molesto, sobre todo si el objetivo está baneando tu IP con demasiada frecuencia y estás haciendo una prueba sensible al tiempo. En esta situación, la mejor opción sería automatizar la rotación de direcciones IP para que dos peticiones consecutivas nunca provengan del mismo origen.

Hay algunos servicios que ofrecen esta funcionalidad, pero encontrar uno bueno es difícil. La mayoría están pensados para crawlers y empresas de data scraping y cobran caro por proporcionar direcciones IP con buena reputación para evitar que el tráfico se marque como automatizado. Los más baratos te dan direcciones de un pool de proveedores de nube (AWS, GCP, Oracle, etc.), que tienen muchas probabilidades de ser detectadas como sospechosas o automatizadas, mientras que los servicios que sí ofrecen proxies residenciales con direcciones de ISPs comunes pueden ser muy turbios (algunos incluso venden servicios ilegales sostenidos por botnets).

En este escenario, una herramienta como `cf-proxy` puede marcar la diferencia. Para empezar, un plan de Workers es bastante barato (US$ 5,00/mes te dan 10 millones de peticiones) y requiere poca configuración. Solo configuras las opciones de proxy en el cliente que estés usando y cada conexión tendrá una dirección distinta casi siempre, así que no tienes que preocuparte por tener varios proxies para alternar en round-robin. Y en cuanto a reputación, una dirección IP de Cloudflare no está nada mal, ya que suelen ser de confianza e incluso figurar en listas de permitidos. Dicen que 1 de cada 5 sitios de internet usa sus servicios, así que bloquear sus ASN puede ser muy peligroso para algunos proveedores de nube.

Dicho esto, usar un worker como proxy no está exento de limitaciones. La mayor es que Cloudflare no permite conexiones TCP salientes hacia sus propios rangos de IP, así que tendrás problemas para conectarte a sitios que están detrás de su reverse proxy (que son muchos). También se niega a conectar al puerto 25/TCP (normalmente dedicado a SMTP) de cualquier objetivo, pero eso no suele ser un gran inconveniente.

## Qué es cf-proxy y cómo funciona

`cf-proxy` es una utilidad que permite enrutar tu tráfico a través de la red global de servidores de Cloudflare, enmascarando la dirección IP de origen y logrando una rotación automática de IP en el proceso. Como Cloudflare se ha vuelto tan popular y está tan extendida, sus ASN tienden a ser de confianza e incluso a figurar en listas de permitidos en algunos firewalls, sobre todo cuando se usa como reverse proxy para aprovechar su solución de WAF mientras mantiene oculto el servidor de origen de una aplicación web. En estos escenarios, esta utilidad también puede servir para sortear esos filtros de red y hablar directamente con el servidor de origen.

![cf-proxy enrutando peticiones a través de los Cloudflare Workers, con la IP de origen cambiando entre peticiones](/assets/publications/cf-proxy/demo-cf.webp){: width="1680" height="913" loading="lazy" decoding="async"}

En esencia, `cf-proxy` no es muy complicado. La arquitectura serverless sobre la que corre hace la mayor parte del trabajo. De hecho, todo el código consta de solo dos archivos, y el [código](https://github.com/LvMalware/cf-proxy/blob/master/worker/src/index.js) que se despliega en los Cloudflare Workers son apenas 35 líneas de JavaScript:

```javascript
import { connect } from 'cloudflare:sockets';

export default {
    async fetch(request) {
        const TOKEN = '<YOUR-AUTH-TOKEN>'

        if (request.headers.get('Authorization') !== TOKEN)
            return new Response('Unauthorized', { status: 401 });

        const upgradeHeader = request.headers.get('Upgrade');

        if (!upgradeHeader || upgradeHeader !== 'websocket')
            return new Response('Expected Upgrade: websocket', { status: 426 });

        try {
            const target = connect(request.headers.get('X-Proxy-Target'));
            const writer = target.writable.getWriter();
            const websocket = new WebSocketPair();
            const [client, server] = Object.values(websocket);

            server.accept();
            server.addEventListener('message', e => e.data.arrayBuffer().then( buf => writer.write(buf) ));

            target.readable.pipeTo(new WritableStream({
                write(chunk) {
                    server.send(chunk);
                },
            }));

            return new Response(null, { status: 101, webSocket: client, });
        } catch (e) {
            return new Response(e, { status: 500 });
        }
    }
}
```

Esto es todo lo que hace falta para reenviar tu tráfico. El worker recibe una petición, la autentica con un token en la cabecera `Authorization` (al fin y al cabo, no queremos que nadie use nuestros workers para hacer cosas malas, ¿verdad?), comprueba si es una petición válida de upgrade a WebSocket, se conecta al objetivo recibido por la cabecera `X-Proxy-Target`, hace el upgrade de la conexión al protocolo WebSocket y luego transmite cualquier dato que reciba, transfiriéndolo entre el cliente del proxy y el servidor objetivo. Todo eso de la rotación de IP es solo un efecto secundario de cómo se crean las instancias del worker para atender las peticiones.

Los workers se despliegan por la red global de servidores de Cloudflare y se aprovisionan bajo demanda cuando se invocan. Hay algún algoritmo inteligente de aprovisionamiento[^provisioning] para minimizar la latencia y el tiempo de aprovisionamiento, pero como es un proceso muy rápido y la red es simplemente enorme, es muy poco probable que dos invocaciones seguidas se desplieguen en el mismo servidor, por lo que la dirección casi con seguridad será distinta en la siguiente invocación.

Del otro lado de este proceso tenemos el archivo [`proxy.js`](https://github.com/LvMalware/cf-proxy/blob/master/proxy.js), que corre localmente y proporciona el servidor de proxy (HTTP o SOCKS5) que nuestro cliente usará para hablar con internet. Aunque es un poco más grande (unas 230 líneas), es igual de simple que el anterior. La parte más complicada es probablemente la máquina de estados que se usa para proporcionar el servidor SOCKS5. Todo lo que hace este script es interpretar las opciones de línea de comandos (de una forma no muy óptima) para identificar el worker, el token de autenticación y el protocolo de proxy que debe proporcionar, y luego empieza a aceptar conexiones en un puerto TCP. Para cada conexión recibida identifica el objetivo según el protocolo de proxy en uso e inicia la conexión WebSocket con el worker indicado, pasando el token de autenticación y el host objetivo por las cabeceras HTTP, como se mencionó antes. Y si esto funciona, los datos se transfieren entre el cliente y el worker hasta que la conexión se cierra.

## El origen

La base de lo que más tarde se convertiría en `cf-proxy` nació de una necesidad real durante un pentest.

Necesitaba sortear un rate limit basado en IP para una tarea concreta de enumeración. Por lo que pude ver, la aplicación objetivo imponía un límite de 5 req/min con backoff creciente ante reincidencias. Podía esquivarlo cambiando mi dirección IP cada 5 peticiones y reutilizando la misma IP solo después de un minuto. La forma barata de hacerlo era levantar algunas instancias de cómputo en un proveedor de nube con acceso SSH y luego tunelizar mis peticiones por ellas en round-robin, pero eso requeriría 12 instancias solo para hacer 1 petición por segundo. Es factible, pero muy lento para este escenario. Había estimado 100 mil peticiones para agotar el espacio de búsqueda, lo que llevaría más de 24 horas a un ritmo de 1 rps. Estaba claro que necesitaba un enfoque mejor, pero no tenía ganas de comprar un proxy rotativo comercial para eso (por los motivos ya mencionados).

Mientras buscaba alternativas encontré un artículo sobre usar funciones de AWS Lambda como proxies. El problema era que, por la forma en que se aprovisionan los lambdas, la dirección IP no cambiaba durante 5 a 15 minutos y eso no funcionaría para mi caso concreto, pero me dio la idea de usar aplicaciones serverless como proxies. Un compañero de trabajo me había presentado hacía poco los Cloudflare Workers y me parecieron muy interesantes, pero como alguien que no hace desarrollo web aún no les había encontrado un buen uso, así que pareció una buena oportunidad para probar.

Para validar la idea, creé una cuenta gratuita en Cloudflare y desplegué un worker usando el código de ejemplo de la [documentación oficial](https://developers.cloudflare.com/workers/examples/fetch-html/), que consultaba una API remota para devolver la dirección IP del cliente (el propio worker, en este caso); luego probé invocando el worker varias veces y comprobando que la IP era distinta en cada petición. ¡Funcionó como por arte de magia!

Partiendo de este principio, reescribí el worker para que recibiera los parámetros necesarios e hiciera las peticiones a la aplicación objetivo por mí, devolviendo el resultado que obtuviera. Esto resultó ser una solución viable, que me permitió terminar la enumeración mucho más rápido sin que me bloquearan, y el plan gratuito casi cubrió todas las peticiones que necesité. Aunque la funcionalidad central de `cf-proxy` ya estaba presente en esta versión inicial, era muy limitada y no volví a tocarla durante un buen tiempo.

Durante otra evaluación de seguridad unos días después, había identificado una posible vulnerabilidad de inyección en un objetivo mediante revisión de código, pero cualquier intento de explotarla estaba siendo bloqueado por Cloudflare. Como no lograba crear un payload que sorteara el filtro, tenía que esquivar el WAF de alguna manera.

Revisando varias fuentes, descubrí que el dominio que alojaba la aplicación objetivo solía resolver a una dirección IP concreta hasta cierto momento en el pasado, tras el cual empezó a apuntar a Cloudflare. Como la misma IP parecía haber alojado esa aplicación durante mucho tiempo antes, era razonable suponer que no habían cambiado el host, sino que solo habían puesto el WAF por delante. Pero aunque el host parecía seguir vivo, no aceptaba conexiones en ninguno de los puertos que probé. Mi suposición era que habían puesto una regla de firewall para aceptar tráfico solo del ASN de Cloudflare, de modo que no se pudiera hablar directamente con el servidor web (como yo estaba intentando).

Si tan solo pudiera hacer que mi tráfico pareciera venir de Cloudflare... un momento... ¡puedo hacerlo!

![Meme de la película Capitán Phillips con el texto "Look at me, I'm your ISP now" (mírame, ahora tu proveedor soy yo), firmado Cloudflare](/assets/publications/cf-proxy/meme-cf.webp){: width="500" height="500" loading="lazy" decoding="async"}

Para comprobar si era así, desplegué un worker que haría peticiones a esa dirección IP en los puertos 80 y 443, lo que confirmó que había algo respondiendo en el puerto 80. Ahora tenía una forma de sortear el WAF usando un worker para hacer las peticiones directamente al servidor de origen en mi nombre, así que solo modifiqué el worker para que recibiera algunos parámetros que definieran cosas como el método de la petición, la ruta, el cuerpo, etc.

Llegado a este punto ya podía continuar con la evaluación, pero me quedó claro que este pequeño truco podía tener aplicaciones reales en muchos otros escenarios, así que decidí convertirlo en una herramienta.

Más tarde mejoré el worker para que se comportara como un proxy de verdad, abriendo conexiones con hosts remotos y reenviando el tráfico. Usar WebSockets fue la elección natural, ya que permiten transmitir datos entre ambos lados de la conexión con más facilidad. La primera versión solo ofrecía un proxy HTTP; unos días después añadí soporte para SOCKS5. Y así fue como surgió `cf-proxy`.

## Conclusión

Rotar la IP durante una evaluación no tiene por qué significar pagar por un proxy residencial turbio ni hacer malabares con una docena de instancias en la nube. `cf-proxy` convierte los Cloudflare Workers en un proxy rotativo barato que te entrega una dirección nueva y por lo general de confianza en casi cada petición, y el mismo truco que oculta tu origen también puede llevarte más allá de un WAF, directo al servidor que hay detrás. No es una bala de plata, ya que no puedes alcanzar hosts dentro de los propios rangos de Cloudflare y el puerto 25 queda descartado, pero para los casos que cubre es difícil de superar en precio y simplicidad. El código está en [GitHub](https://github.com/LvMalware/cf-proxy) por si quieres probarlo.

[^provisioning]: Los workers se aprovisionan en ubicaciones físicamente cercanas al origen de la petición para minimizar la latencia, por lo que suelen estar en la misma región global (o al menos en el mismo país) que tu propia IP de origen.
