---
layout: post
title: 'Canonical approaches: what I learned at Nubank about solving a problem once'
lang: en
translation_key: canonical-approaches
category: research
excerpt: 'A personal account of the canonical approaches principle, which I experienced first-hand at Nubank, and of why reducing non-essential variation is one of the most effective ways to make security scale.'
author: Heitor Gouvêa
date: 2026-11-03 12:00:00 -0300
permalink: /blog/canonical-approaches/
---

## Introduction

During the time I worked at Nubank, I lived alongside a set of engineering principles. One of them changed quite a lot the way I think about security: *Canonical Approaches, Consistently Applied*.

In this text, I want to explain this principle and show why it seems to me one of the most effective ways to make security scale. Everything I describe about Nubank comes from public sources, most of it published by the company itself on the *Building Nubank* blog or in open talks, and the references are at the end of the text. I do not talk about internal systems, incidents or proprietary tools. What is mine here is the reading of these ideas and the way I started applying them in the work I do today at LESIS.

## The cost of variation

To understand the principle, it helps to start with the problem it tries to solve. As an organization grows, teams make technical decisions independently, and the same problem ends up solved in different ways in each part of the company. One team adopts an HTTP library, another adopts a different one, and a third writes its own way of authenticating calls between services. Each decision is usually reasonable at the moment it is made, and that is why their cost rarely shows up when we look at a single decision in isolation.

That cost shows up later, when something that applies to every service needs to be improved or fixed. These are the so-called *cross-cutting concerns*: timeouts, retries, TLS validation, tracing, logs, authentication and SSRF protection, among others. Each cross-cutting concern has to be implemented, tested and maintained in every variation of the stack, and every new variation multiplies that work.

In security, this cost weighs even more. In vulnerability research, I noticed that many of the most relevant findings show up at the points where a service behaves differently from the others, such as an endpoint written before the authentication framework existed or a legacy integration that uses its own HTTP client. Each variation is one more place where a control may have been forgotten or half implemented. I will come back to this observation later.

## The principle at Nubank

The canonical approaches principle proposes solving each problem once, in one way, and making that way the one used across the whole organization. From then on, the work becomes improving that solution, and every improvement reaches everyone who uses it.

In 2022, Nubank published its engineering principles in an interview with Edward Wible, co-founder, first software engineer and former CTO of the company. There are six:

1. Leverage through Platforms
2. Customer Trust is Hard to Earn and Easy to Lose
3. Data as a Strategic Asset
4. Ownership and Technical Resilience
5. Canonical Approaches, Consistently Applied
6. Multiple perspectives build better software

Wible describes the fifth principle as "basically a directional goal" that "doesn't mean one concrete thing. It means fewer, tighter, and more deliberate choices." His argument is about the ability to evolve: when each team solves similar problems in its own way, the system becomes harder to understand and, in his words, "we lose the ability to evolve the system as a whole". When I read this description, I understood the principle as a deliberate bias against variation, which teams take into account whenever they make a technical decision.

This bias coexists with other values of the company, such as decentralization, ownership and speed, and Wible presents it as "another counterbalancing principle" to those forces. Teams remain free to move fast, while the company avoids the fragmentation that would prevent changes to the system as a whole. He ties this balance to a concrete result: Nubank "has fewer projects that are killed mid-stream, and more projects that are finished, by far", because "we commit to finishing our migrations" and "view non-strategic (read: accidental) variance in our systems and approaches with skepticism".

The text that best details the principle, and which I recommend to anyone interested in the subject, is *The value of canonicity*, published in 2020 by Felipe Hummel, an engineer at Nubank. He describes a deliberately lean stack: Clojure for production services, Kafka for asynchronous communication, Datomic for high-value business data, Scala with Spark for data analysis, Python for machine learning and Flutter for mobile. Starting from this stack, Hummel states the goal more precisely: **avoiding non-essential variance**.

This idea of non-essential variation is central to the rest of the text. For Hummel, variation is essential when a new situation calls for "different technologies that provide better value for a given task", and non-essential when the new tool brings no clear gain over the existing one, or when it is adopted just for the sake of using something different. He also draws attention to internal variation, which exists within a single language, in coding styles, frameworks, libraries and patterns. The expected result is that, looking at two Clojure services chosen at random, "you would probably think that the same team wrote both pieces of code".

For those who work in security, this consistency has a very clear practical effect. When services follow the same structure, learning to read one of them helps you read all of them, and review starts to focus on the points where a service departs from the standard.

## Essential variation and the Datomic case

The distinction between essential and non-essential variation is what keeps the principle from becoming a rigid rule, and Nubank itself has a public example that shows this. In a talk at QCon San Francisco in 2017, Edward Wible said that the company used Datomic as the default database for everything, and that this gave a "false sense of security". According to him, Datomic is very good for high-value business data, but works less well for sustained high-volume writes and for long texts, and in some cases the right answer was simply S3. The stack described by Hummel in 2020 already reflects this lesson, with Datomic reserved for high-value data and deliberate exceptions, such as Scala and Python, in the cases where they bring a real gain.

This case shows how Hummel's criterion works in practice. Adopting a new technology becomes a decision that weighs two sides: the gain it brings to a specific problem and the cost of the whole organization having to live with one more variation. A variation is essential when the first side weighs more.

Dan McKinley reached similar reasoning in 2015, in the text *Choose Boring Technology*. He argues that every new technology brings an operational and cognitive burden that accumulates over time, involving monitoring, testing and the need to understand the tool before changing it. To make this concrete, he proposes imagining that each company has about three *innovation tokens* to spend, and suggests an exercise before adopting anything new: thinking about how to solve the immediate problem without adding anything to the stack. Most of the time, the answer is that it would be possible, although with more work. I use this exercise often.

## The math of variation

Going back to cross-cutting concerns, the argument that convinced me the most is arithmetic. Imagine a hypothetical organization with two languages and two HTTP libraries in each, which results in four different HTTP clients. With six cross-cutting concerns, that is 24 implementations to maintain, review and fix. With one canonical client, it is six, and each new concern costs one more implementation instead of four.

| | HTTP clients | Cross-cutting concerns | Implementations |
|---|---|---|---|
| With variation | 4 | 6 | 24 |
| Canonical | 1 | 6 | 6 |
| New concern, with variation | 4 | 7 | 28 |
| New concern, canonical | 1 | 7 | 7 |

Hummel describes the same effect in terms of reach. For him, every split of language, framework or database limits how far an improvement goes. A security feature built for the Clojure services is applied to all of them, while a service in Node.js would need a reimplementation. The common libraries, for Datomic, DynamoDB, Kafka, HTTP calls, PDF generation and others, need to exist and be maintained for each supported environment, and, as he writes, "every 'virtual split' means you're putting more work into their backlogs".

Other benefits follow from the same logic. When services look alike, any engineer can read any of them, and whoever changes teams needs to learn the business domain, since the stack is the same. Hummel writes that "all software at Nubank should be open for collaboration", a rule that is only viable with a common stack and that moves dependencies between teams out of the backlog and into code review. Finally, internal tools, documentation and knowledge start to accumulate in a few places.

### Improvements that reach everyone

Hummel sums up this benefit by saying that the idea is to "fix each thing, preferably, only once", and that "every new security-related improvement or fix can be easily rolled out for all of our services". When a problem is solved in a canonical piece, every improvement made to it is inherited by everyone who uses it. A more sensible timeout default, one more validation, a new field in the log or a security fix reach every service in the next update, and with that the baseline of the organization rises with each improvement. In an environment with variation, the improvement made to one HTTP client stays restricted to it, and the gap between the best and the worst service in the organization tends to grow over time.

This benefit depends on one condition, which is the propagation of updates. A canonical library with twelve different versions in use is, in practice, twelve libraries, and variation shows up again. That is why there are rules like the *One-Version Rule*, advocated in the book *Software Engineering at Google*, under which there is only one version of each component in use in the organization, and automations like [Dependabot](/blog/dependabot-automating-dependency-updates-on-github/).

## Canonical approaches and security

At the beginning of the text, I mentioned that many relevant findings show up at the points where a service behaves differently from the others. This observation explains why the principle has such a large effect on security. The attacker looks precisely for these points, and every non-essential variation increases their number. In an environment where almost every service goes through the authentication middleware, the interesting target is the service left outside.

What the experience at Nubank added for me was the perspective of working in an environment that tries, as a matter of principle, to reduce these exceptions. In this context, the security team's question stops being only where a control is missing and starts to include why a given service is different from the others.

### Eliminating entire classes of vulnerabilities

The most ambitious application of this reasoning to security that I know of comes from Google. The company spent more than a decade building frameworks and APIs that prevent developers from writing code vulnerable to XSS and SQL injection, with types that block untrusted data from reaching a sink. Christoph Kern, one of the people responsible for this work, describes the result as a drastic reduction of these classes of defects across hundreds of applications. In a 2024 article, he argues that the security of software is a property of the ecosystem in which it is developed, which includes languages, libraries, frameworks and build and deploy tooling. I see this work as the canonical principle taken to its limit, in which the problem is solved once, in the canonical layer, and ceases to exist for whoever uses it.

### Security as a property of the architecture

Netflix, which popularized the concept of the *paved road*, the default path that is well supported and easiest to follow, applied this idea at another point in the stack. While protecting the studio applications, the security team and the gateway team created Wall-E, a version of the Zuul gateway that enforces SSO authentication on every request. Over time, Wall-E also took over WAF, DDoS protection, security header validation and logging, and most of the security checklist for exposing an application to the internet came down to one question: "Are you using Wall-E?".

By 2021, Wall-E already protected more than 350 applications. According to the team itself, adoption came from ease of use, since an application could go from `git init` to production, authenticated and reachable from the internet, in less than ten minutes, and went through a much shorter security review. For me, this is the most important lesson of the case: people adopted the canonical path because it was the easiest one to follow.

### Incident response

In December 2021, the Log4Shell vulnerability (CVE-2021-44228) forced thousands of organizations to find out where they used Log4j. In heterogeneous environments, answering that question took days or weeks, and a good part of the effort was spent locating the library before any fix.

In a canonical environment with a dependency inventory, the same question is answered with a query, and the fix comes down to a version bump in the common library, propagated by automation. The ability to apply a security fix to every user of a dependency at once is, in fact, one of the most cited benefits of the *One-Version Rule*.

### Detection

In detection, the logic repeats itself. When every service logs events with the same library, the same fields and the same correlation ID, a single detection rule covers all of them. In the public 2017 talk, Nubank described a correlation ID to which each service appends a segment, forming a tree that makes it possible to trace a request across the whole architecture. With heterogeneous logs, each rule has to be rewritten for each format, and the gaps remain in the formats nobody covered.

## Conclusion

The canonical approaches principle starts from a simple idea: solving each problem once, in one place, and making that solution the one used across the whole organization. At Nubank, it appears as a direction that guides technical decisions, and Hummel's distinction between essential and non-essential variation is what allows it to be applied without turning it into a rigid rule, as the Datomic case shows.

In security, this principle carries special weight. When a control lives in a canonical piece, every improvement made to it reaches every service, as long as updates propagate. The Google and Netflix cases show how far this can go, with entire classes of vulnerabilities eliminated in the development ecosystem and a security checklist reduced to a question about using Wall-E. Incident response and detection also become simpler when every service uses the same libraries and logs events in the same way.

For those who work on defense, the conclusion goes back to the observation at the beginning of the text. The attacker looks for the service that behaves differently from the others, and every non-essential variation that ceases to exist is one less place where they can find a flaw.

## References

1. [Nubank's Engineering Principles, by Edward Wible - Building Nubank](https://building.nu.com/nubanks-engineering-principles-interview-with-ed-wible/)
2. [The value of canonicity - Felipe Hummel, Building Nubank](https://building.nu.com/the-value-of-canonicity/)
3. [Architecting a Modern Financial Institution - Edward Wible and Rafael Ferreira, QCon San Francisco 2017](https://www.infoq.com/presentations/nubank-architecture/)
4. [Choose Boring Technology - Dan McKinley](https://mcfunley.com/choose-boring-technology)
5. [Software Engineering at Google, chapter 16: Version Control and Branch Management](https://abseil.io/resources/swe-book/html/ch16.html)
6. [The Show Must Go On: Securing Netflix Studios At Scale - Netflix Technology Blog](https://netflixtechblog.com/the-show-must-go-on-securing-netflix-studios-at-scale-19b801c86479)
7. [Developer Ecosystems for Software Safety - Christoph Kern, ACM Queue](https://research.google/pubs/developer-ecosystems-for-software-safety/)
8. [Secure by Design at Google - Google Research](https://research.google/pubs/secure-by-design-at-google/)
9. [Apache Log4j Vulnerability Guidance - CISA](https://www.cisa.gov/news-events/news/apache-log4j-vulnerability-guidance)
