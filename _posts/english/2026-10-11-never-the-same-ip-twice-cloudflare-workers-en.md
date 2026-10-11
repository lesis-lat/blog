---
layout: post
title: 'Never the same IP twice: building cf-proxy on Cloudflare Workers'
lang: en
translation_key: cf-proxy-ip-rotation
category: research
excerpt: 'How cf-proxy turns Cloudflare Workers into a cheap rotating proxy, with a different source IP on almost every request and a trusted ASN, and the pentests that led to building it.'
author: Lucas Vieira Araujo
date: 2026-10-11 09:00:00 -0300
permalink: /blog/cf-proxy-ip-rotation-with-cloudflare-workers/
---

During a pentest it is often the case that you have to change your IP address momentarily for some reason. Maybe you are trying to perform successive requests to an endpoint with an IP-based rate limit, maybe your current IP has been blocked by a firewall as a result of a previous test (or just because your provider has a bad reputation). Whatever the reason may be, you probably had to connect to a VPN or proxy at some point in your life.

But when this happens during a security assessment, the problem usually doesn't stop there. If you were blocked once it is very likely that you will be blocked again soon, and you will need a way to change your address yet again. Eventually this becomes very annoying, especially if your target is banning your IP address too often and you are performing a time-sensitive test. In this situation the best option would be to automate the rotation of IP addresses so that no two consecutive requests come from the same origin.

There are some services that provide this functionality, but finding a good one is hard. Most of them are intended for crawlers and data scraping companies and are high-priced for providing IP addresses with good reputation to avoid being flagged as automated traffic. The cheaper ones will hand you addresses from a pool of cloud providers (AWS, GCP, Oracle, etc.) which are very likely to be detected as suspicious or automated, while the services that do provide residential proxies with addresses from regular ISPs can be very shady (with some even selling illegal services fuelled by botnets).

In this scenario, a tool like `cf-proxy` can be a game changer. For one, a Workers plan is pretty cheap ($5.00/month will get you 10 million requests) and there is little setup needed. You just configure the proxy options for whatever client you are using and every connection you make will have a different address almost every time, so you don't need to worry about having multiple proxies to round-robin between. And reputation-wise, a Cloudflare IP address is not too bad, as they are often trusted and even whitelisted. They say that 1 in every 5 sites on the internet use their services, so blocking their ASNs can be very dangerous to some cloud providers.

That said, using a worker as a proxy is not without its limitations. The biggest one is that Cloudflare doesn't allow outbound TCP connections to its own IP address ranges, so you will have trouble connecting to sites that are behind their reverse proxy (which many sites are). They also refuse to connect to port 25/TCP (usually dedicated to SMTP) of any target, but that's usually not that big of an issue.

## What cf-proxy is, and how it works

`cf-proxy` is a utility that allows routing your traffic through Cloudflare's global network of servers, masking the origin IP address and achieving automatic IP rotation in the process. Because Cloudflare has become so popular and widely adopted, their ASNs tend to be trusted and even whitelisted in some firewalls, especially when it is being used as a reverse proxy to leverage their WAF solution while keeping the origin server of a web application hidden. In these scenarios, this utility can also be helpful to bypass these network filters and talk to the origin server directly.

![cf-proxy routing requests through Cloudflare Workers, with the source IP changing between requests](/assets/publications/cf-proxy/demo-cf.webp){: width="1680" height="913" loading="lazy" decoding="async"}

At its heart, `cf-proxy` is not too complicated. The serverless architecture on which it runs does most of the work. In fact, the whole codebase consists of only two files, and the [code](https://github.com/LvMalware/cf-proxy/blob/master/worker/src/index.js) that is deployed to Cloudflare Workers is just 35 lines of JavaScript:

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

This is all it takes to forward your traffic. The worker receives a request, authenticates it using a token in the `Authorization` header (after all, we don't want anyone using our workers to do bad things, right?), checks if this is a valid WebSocket upgrade request, connects to the target received via the `X-Proxy-Target` header, upgrades the connection to the WebSocket protocol and then proceeds to stream any data it receives, transferring it between the proxy client and the target server. The whole IP rotation thing is just a side-effect of how the worker instances are spawned to handle requests.

The workers are deployed across Cloudflare's global network of servers and are provisioned on-demand when they are invoked. There is some smart provisioning algorithm[^provisioning] going on to minimize latency and provisioning time, but because this is a very fast process and the network is just huge, it is very unlikely that two subsequent invocations will be deployed within the same server, hence the address will almost certainly differ on the next invocation.

On the other side of this process, we have the [`proxy.js`](https://github.com/LvMalware/cf-proxy/blob/master/proxy.js) file which runs locally and provides the proxy server (either HTTP or SOCKS5) that our client will use when talking to the internet. Although a little bigger (around 230 lines), it is just as simple as the previous one. The most complicated part is probably the state machine used to provide the SOCKS5 server. All this script does is parse command-line options (in a not very optimal way) to identify the worker, auth token and the proxy protocol it should provide, then starts accepting connections on a TCP port. For each received connection it identifies the target based on the proxy protocol in use and initiates the WebSocket connection to the specified worker, passing the authentication token and target host via HTTP headers as previously mentioned. And if this works, the data is transferred between the client and the worker until the connection closes.

## The origin story

The foundation of what would later become `cf-proxy` was born from a real need during a pentest.

I needed to bypass an IP-based rate limit for a specific enumeration task. From what I could tell, the target application enforced a limit of 5 reqs/min with increasing backoff for repeated offenses. I could get around this by changing my IP address every 5 requests and only reusing the same IP after a minute. The cheap way to do that was to deploy some computing instances in a cloud provider with SSH access and then tunnel my requests through them in a round-robin fashion, but that would require 12 instances just to perform 1 request per second. That's doable, but very slow for this scenario. I had estimated 100k requests to exhaust the search space, which would take more than 24 hours to complete at a rate of 1 rps. It was clear that I needed a better approach, but I didn't feel like purchasing a commercial rotating proxy for that (for the reasons previously mentioned).

While looking for alternatives I found an article about using AWS Lambda functions as proxies. The problem was that, due to the way the lambdas are provisioned, the IP address would not change for 5-15 minutes and this would not work for my specific use case, but it gave me the idea of using serverless applications as proxies. A work colleague had recently introduced me to Cloudflare Workers and I found them very interesting, but as someone that doesn't do web development I hadn't found a good use for them yet, so it seemed like a good opportunity to try.

To validate the idea, I created a free Cloudflare account and deployed a worker using example code from the [official documentation](https://developers.cloudflare.com/workers/examples/fetch-html/) that would request a remote API to return the client's (the worker itself, in this case) IP address, then I tested by invoking the worker multiple times and checking that the IP address was different on every request. It worked like magic!

Building on this principle, I rewrote the worker to receive the required parameters and make the requests to the target application for me, returning whatever result it got back. This proved to be a viable solution, allowing me to finish the enumeration way faster without being blocked, and the free plan almost covered all the requests I needed. Although the core functionality of `cf-proxy` was already present in this initial version, it was very limited and I didn't touch it again for some time after.

During another security assessment a few days later, I had identified a possible injection vulnerability on a target through code review, but any attempts to exploit it were being blocked by Cloudflare. Unable to craft a payload to bypass the filter, I had to get around the WAF somehow.

Looking at various sources, I found that the domain hosting the target application used to resolve to a specific IP address up until some point in the past, after which it started to point to Cloudflare. Because the same IP seemed to have been hosting that application for a long time before, it seemed reasonable that they hadn't actually changed the host, but rather just placed the WAF in front of it. But even though the host seemed to still be alive, it didn't accept connections on any of the ports I tried. My assumption was that they had put a firewall rule in place to only accept traffic from Cloudflare's ASN, so people wouldn't be able to talk to the web server directly (like I was trying to do).

If only I could make it look like my traffic was coming from Cloudflare... wait... I can!

To test if this was the case I deployed a worker that would make requests to that IP address on ports 80 and 443, which confirmed there was something responding on port 80. Now I had a way to bypass the WAF by using a worker to make the requests directly to the origin server on my behalf, so I just modified the worker to receive some parameters to define things like request method, path, body, and so on.

At this point I could already proceed with the assessment, but it became clear to me that this small hack could have real applications in many other scenarios, so I decided to turn it into a tool.

Later I improved the worker to behave like a real proxy, making connections to remote hosts and forwarding the traffic. Using WebSockets was the natural choice, since they allow streaming data between both sides of the connection more easily. The first version only provided an HTTP proxy, then I added SOCKS5 support a few days later. And that's how `cf-proxy` came to be.

[^provisioning]: Workers are provisioned in locations that are physically close to the origin of the request to minimize latency, so they are often in the same global region (or at least the same country) as your own origin IP.
