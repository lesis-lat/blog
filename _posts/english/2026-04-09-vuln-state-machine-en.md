---
layout: post
title: 'State machine for vulnerability management'
og_image: /assets/publications/vuln-state-machine/state-machine.png
lang: en
category: Research
author: Heitor Gouvêa
author-info:
  name:  Heitor Gouvêa
  image:  heitor-gouvea.jpeg
  description: Researcher with a software engineering background. Gouvêa's research focuses on vulnerability discovery in modern applications and the development of tools and exploits.
  linkedin: htrgouvea
date: 2026-04-09 00:00:00 -0300
---

In many organizations, the vulnerability management process suffers from a recurring — yet frequently overlooked — problem: inconsistency in the definition and use of statuses. It is common to see the same statuses used with different meanings by distinct teams, or to find redundant, poorly defined, or unnecessary statuses that create more confusion than clarity. This compromises traceability, hinders communication across teams, makes reliable metrics impossible, and weakens the organization's ability to respond to real risks.

To address this scenario, adopting a formalized state machine is an effective strategy. In a clear and objective way, it represents the lifecycle of a vulnerability: each transition has a precise meaning, and all teams share the same understanding of what each status represents.

The flow begins with **Draft**, indicating a work-in-progress being built by the analyst or pentester. The vulnerability is still being documented and has not yet been submitted for triage — context, evidence, or technical details may be missing. After this stage, it moves to **Identified**, where impact and priority are assessed. If forwarded for remediation, it takes on the **Fixing** status, reflecting active mitigation work. During the process, it may be identified as a repeat of a previous case, transitioning to **Duplicated**. If the analysis shows there is no real risk — for example, due to an infeasible exploitation condition — the status becomes **False Positive**. In certain cases, the organization chooses to accept the risk, whether due to technical limitations, remediation cost, or low perceived impact; in these cases, the status is **Accepted Risk**. After remediation, the finding enters **Retest** for re-evaluation. If validated, the process concludes with the **Fixed** status.

The rigorous definition of this state machine is not bureaucracy: it is a necessary foundation. By eliminating ambiguities and redundancies, it improves collaboration across teams, reduces rework, and enables better-informed decisions. It also allows for the generation of consistent metrics, useful for identifying bottlenecks, measuring efficiency, and supporting audits.

This proposed state machine is both lean and complete. It is the most effective model I have found in practice: simple enough for rapid adoption and comprehensive enough to cover the main scenarios. It has proven to be an excellent starting point for standardizing processes, strengthening governance, and facilitating integration between security, product, and engineering.

Below is the diagram representing this flow:

![](/assets/publications/vuln-state-machine/state-machine.png)
