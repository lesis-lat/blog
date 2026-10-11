---
layout: post
title: 'Nunca o mesmo IP duas vezes: construindo o cf-proxy com Cloudflare Workers'
lang: pt
translation_key: cf-proxy-ip-rotation
category: research
excerpt: 'Como o cf-proxy transforma os Cloudflare Workers em um proxy rotativo barato, com um IP de origem diferente em quase toda requisição e um ASN confiável, e os pentests que levaram a construí-lo.'
author: Lucas Vieira Araujo
date: 2026-10-11 09:00:00 -0300
permalink: /blog/cf-proxy-rotacao-de-ip-com-cloudflare-workers/
---

## Introdução

Durante um pentest, é comum ter que trocar o endereço de IP por algum motivo em um dado momento. Talvez você esteja tentando fazer requisições sucessivas a um endpoint com rate limit baseado em IP, talvez o seu IP atual tenha sido bloqueado por um firewall por causa de um teste anterior (ou simplesmente porque o seu provedor tem uma má reputação). Seja qual for o motivo, você provavelmente já teve que se conectar a uma VPN ou proxy em algum momento da vida.

Mas, quando isso acontece durante uma avaliação de segurança, o problema normalmente não para por aí. Se você foi bloqueado uma vez, é muito provável que seja bloqueado de novo logo em seguida e precise de uma forma de trocar o endereço mais uma vez. Com o tempo, isso fica bem chato, especialmente se o alvo está banindo o seu IP com muita frequência e você está fazendo um teste sensível ao tempo. Nessa situação, a melhor opção seria automatizar a rotação dos endereços de IP para que duas requisições consecutivas nunca venham da mesma origem.

Existem alguns serviços que oferecem essa funcionalidade, mas achar um bom é difícil. A maioria deles é voltada para crawlers e empresas de data scraping e cobra caro por fornecer endereços de IP com boa reputação, para evitar que o tráfego seja sinalizado como automatizado. Os mais baratos entregam endereços de um pool de provedores de nuvem (AWS, GCP, Oracle, etc.), que têm grande chance de serem detectados como suspeitos ou automatizados, enquanto os serviços que fornecem proxies residenciais com endereços de ISPs comuns podem ser bem obscuros (alguns até vendem serviços ilegais sustentados por botnets).

Nesse cenário, uma ferramenta como o `cf-proxy` pode fazer toda a diferença. Para começar, um plano de Workers é bem barato (US$ 5,00/mês dão 10 milhões de requisições) e exige pouca configuração. Você só configura as opções de proxy no cliente que estiver usando e cada conexão terá um endereço diferente quase sempre, então não precisa se preocupar em ter vários proxies para alternar em round-robin. E, em termos de reputação, um endereço de IP da Cloudflare não é nada mau, já que costumam ser confiáveis e até colocados em listas de permissão. Dizem que 1 a cada 5 sites da internet usa os serviços deles, então bloquear os ASNs da Cloudflare pode ser muito perigoso para alguns provedores de nuvem.

Dito isso, usar um worker como proxy não é isento de limitações. A maior delas é que a Cloudflare não permite conexões TCP de saída para as suas próprias faixas de IP, então você terá problemas para se conectar a sites que estão atrás do reverse proxy dela (o que muitos sites estão). Ela também se recusa a conectar na porta 25/TCP (normalmente dedicada a SMTP) de qualquer alvo, mas isso em geral não é um grande problema.

## O que é o cf-proxy e como ele funciona

O `cf-proxy` é um utilitário que permite rotear o seu tráfego pela rede global de servidores da Cloudflare, mascarando o endereço de IP de origem e conseguindo rotação automática de IP no processo. Como a Cloudflare se tornou tão popular e amplamente adotada, os ASNs dela tendem a ser confiáveis e até colocados em listas de permissão em alguns firewalls, especialmente quando ela é usada como reverse proxy para aproveitar a solução de WAF enquanto mantém escondido o servidor de origem de uma aplicação web. Nesses cenários, este utilitário também pode ajudar a contornar esses filtros de rede e falar diretamente com o servidor de origem.

![cf-proxy roteando requisições pelos Cloudflare Workers, com o IP de origem mudando entre as requisições](/assets/publications/cf-proxy/demo-cf.webp){: width="1680" height="913" loading="lazy" decoding="async"}

No fundo, o `cf-proxy` não é muito complicado. A arquitetura serverless sobre a qual ele roda faz a maior parte do trabalho. Na verdade, todo o código consiste em apenas dois arquivos, e o [código](https://github.com/LvMalware/cf-proxy/blob/master/worker/src/index.js) que é publicado nos Cloudflare Workers tem só 35 linhas de JavaScript:

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

É só isso que é preciso para encaminhar o seu tráfego. O worker recebe uma requisição, autentica-a com um token no cabeçalho `Authorization` (afinal, não queremos que ninguém use os nossos workers para fazer coisas ruins, certo?), verifica se é uma requisição válida de upgrade para WebSocket, conecta ao alvo recebido pelo cabeçalho `X-Proxy-Target`, faz o upgrade da conexão para o protocolo WebSocket e então passa a transmitir qualquer dado que receber, transferindo-o entre o cliente do proxy e o servidor alvo. Toda essa história de rotação de IP é só um efeito colateral de como as instâncias do worker são criadas para atender às requisições.

Os workers são distribuídos pela rede global de servidores da Cloudflare e provisionados sob demanda quando são invocados. Há algum algoritmo inteligente de provisionamento[^provisioning] para minimizar a latência e o tempo de provisionamento, mas, como esse processo é muito rápido e a rede é simplesmente enorme, é muito improvável que duas invocações seguidas sejam colocadas no mesmo servidor, de modo que o endereço quase certamente será diferente na próxima invocação.

Do outro lado desse processo, temos o arquivo [`proxy.js`](https://github.com/LvMalware/cf-proxy/blob/master/proxy.js), que roda localmente e fornece o servidor de proxy (HTTP ou SOCKS5) que o nosso cliente vai usar para falar com a internet. Embora seja um pouco maior (cerca de 230 linhas), é tão simples quanto o anterior. A parte mais complicada provavelmente é a máquina de estados usada para fornecer o servidor SOCKS5. Tudo o que esse script faz é interpretar as opções de linha de comando (de um jeito não muito ótimo) para identificar o worker, o token de autenticação e o protocolo de proxy que ele deve fornecer, e então começa a aceitar conexões em uma porta TCP. Para cada conexão recebida, ele identifica o alvo com base no protocolo de proxy em uso e inicia a conexão WebSocket com o worker especificado, passando o token de autenticação e o host alvo pelos cabeçalhos HTTP, como mencionado antes. E, se isso funcionar, os dados são transferidos entre o cliente e o worker até a conexão ser encerrada.

## A origem

A base do que mais tarde viria a ser o `cf-proxy` nasceu de uma necessidade real durante um pentest.

Eu precisava contornar um rate limit baseado em IP para uma tarefa específica de enumeração. Pelo que consegui perceber, a aplicação alvo impunha um limite de 5 req/min, com backoff crescente para reincidências. Eu conseguiria driblar isso trocando o meu endereço de IP a cada 5 requisições e só reutilizando o mesmo IP depois de um minuto. O jeito barato de fazer isso era subir algumas instâncias de computação em um provedor de nuvem com acesso SSH e então tunelar as minhas requisições por elas em round-robin, mas isso exigiria 12 instâncias só para fazer 1 requisição por segundo. É possível, mas muito lento para esse cenário. Eu tinha estimado 100 mil requisições para esgotar o espaço de busca, o que levaria mais de 24 horas a uma taxa de 1 rps. Ficou claro que eu precisava de uma abordagem melhor, mas não tinha vontade de comprar um proxy rotativo comercial para isso (pelos motivos já mencionados).

Enquanto procurava alternativas, encontrei um artigo sobre usar funções do AWS Lambda como proxies. O problema era que, pela forma como os lambdas são provisionados, o endereço de IP não mudava por 5 a 15 minutos, e isso não funcionaria para o meu caso específico, mas me deu a ideia de usar aplicações serverless como proxies. Um colega de trabalho tinha me apresentado havia pouco aos Cloudflare Workers, e eu os achei muito interessantes, mas, como alguém que não faz desenvolvimento web, ainda não tinha encontrado um bom uso para eles, então pareceu uma boa oportunidade de experimentar.

Para validar a ideia, criei uma conta gratuita na Cloudflare e publiquei um worker usando o código de exemplo da [documentação oficial](https://developers.cloudflare.com/workers/examples/fetch-html/), que consultava uma API remota para retornar o endereço de IP do cliente (o próprio worker, nesse caso); então testei invocando o worker várias vezes e verificando que o IP era diferente a cada requisição. Funcionou como mágica!

Partindo desse princípio, reescrevi o worker para receber os parâmetros necessários e fazer as requisições à aplicação alvo por mim, devolvendo o resultado que ele recebesse. Isso se mostrou uma solução viável, que me permitiu terminar a enumeração muito mais rápido sem ser bloqueado, e o plano gratuito quase cobriu todas as requisições de que precisei. Embora a funcionalidade central do `cf-proxy` já estivesse presente nessa versão inicial, ela era bem limitada e eu não mexi mais nela por um bom tempo.

Durante outra avaliação de segurança alguns dias depois, eu tinha identificado uma possível vulnerabilidade de injeção em um alvo por meio de revisão de código, mas qualquer tentativa de explorá-la estava sendo bloqueada pela Cloudflare. Sem conseguir montar um payload que contornasse o filtro, eu precisava driblar o WAF de alguma forma.

Olhando várias fontes, descobri que o domínio que hospedava a aplicação alvo costumava resolver para um endereço de IP específico até certo ponto no passado, depois do qual passou a apontar para a Cloudflare. Como o mesmo IP parecia ter hospedado aquela aplicação por muito tempo antes, era razoável supor que eles não tinham de fato trocado o host, apenas colocado o WAF na frente. Mas, mesmo que o host parecesse continuar vivo, ele não aceitava conexões em nenhuma das portas que testei. A minha suposição era que tinham criado uma regra de firewall para aceitar tráfego apenas do ASN da Cloudflare, para que não fosse possível falar diretamente com o servidor web (como eu estava tentando).

Se ao menos eu conseguisse fazer o meu tráfego parecer que vinha da Cloudflare... peraí... eu consigo!

Para testar se era esse o caso, publiquei um worker que faria requisições para aquele endereço de IP nas portas 80 e 443, o que confirmou que havia algo respondendo na porta 80. Agora eu tinha uma forma de contornar o WAF usando um worker para fazer as requisições diretamente ao servidor de origem em meu nome, então apenas modifiquei o worker para receber alguns parâmetros que definissem coisas como método da requisição, caminho, corpo e assim por diante.

Nesse ponto eu já podia seguir com a avaliação, mas ficou claro para mim que esse pequeno truque poderia ter aplicações reais em muitos outros cenários, então decidi transformá-lo em uma ferramenta.

Depois, melhorei o worker para se comportar como um proxy de verdade, abrindo conexões com hosts remotos e encaminhando o tráfego. Usar WebSockets foi a escolha natural, já que eles permitem transmitir dados entre os dois lados da conexão com mais facilidade. A primeira versão fornecia apenas um proxy HTTP; alguns dias depois, adicionei suporte a SOCKS5. E foi assim que o `cf-proxy` surgiu.

## Conclusão

Rotacionar o IP durante uma avaliação não precisa significar pagar por um proxy residencial obscuro nem fazer malabarismo com uma dúzia de instâncias na nuvem. O `cf-proxy` transforma os Cloudflare Workers em um proxy rotativo barato, que te entrega um endereço novo e em geral confiável em quase toda requisição, e o mesmo truque que esconde a sua origem também pode te levar para além de um WAF, direto ao servidor atrás dele. Não é uma bala de prata, já que você não alcança hosts dentro das faixas da própria Cloudflare e a porta 25 fica de fora, mas, para os casos que ele cobre, é difícil de bater em preço e simplicidade. O código está no [GitHub](https://github.com/LvMalware/cf-proxy), caso você queira experimentar.

[^provisioning]: Os workers são provisionados em locais fisicamente próximos à origem da requisição para minimizar a latência, então costumam estar na mesma região global (ou pelo menos no mesmo país) que o seu próprio IP de origem.
