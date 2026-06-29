---
layout: post
title: 'Our first observation of an AI-assisted malicious group targeting small and medium-sized Brazilian fintech companies'
lang: en
category: Case Study
excerpt: 'An investigation by LESIS has identified a malicious campaign targeting small and medium-sized Brazilian fintech companies, using AI to accelerate the development of offensive tools, adapt payloads and support the exploitation of applications.'
author: LESIS Team
author-info:
  name:  LESIS
  image:  favicon.png
  description: LESIS specialises in applied research focusing on offensive security technologies that support critical operations.
  linkedin: lesis-lat
date: 2026-06-29 15:00:00 -0300
permalink: /blog/our-first-observation-of-an-ai-assisted-malicious-group/
---

# Our first observation of an AI-assisted malicious group targeting small and medium-sized Brazilian fintechs

LESIS' work often places us across different fronts of offensive security, incident response, and threat intelligence. On a recent occasion, we were called in to support an investigation involving a Brazilian financial institution. Our initial role was to answer an objective question: what entry vector was used by the malicious actor?

To do that, we conducted an analysis guided by adversary simulation. We started from the same operational premise as the attacker: compromise an application or adjacent resource that could, directly or indirectly, lead to systems with potential financial movement. This approach allowed us to reconstruct part of the attack chain, identify the initial vector, and later locate persistence mechanisms used by the threat actor.

During the investigation, we observed that the persistence deployed by the group communicated with external infrastructure controlled by the operators. From that point, we deepened our analysis of the command-and-control infrastructure, aiming to understand whether there were additional elements that could support the incident response and help protect other potential targets.

For operational reasons, we will not publish IoCs, payloads, addresses, file names, internal paths, or details that could compromise investigations. Even so, the analyzed artifacts revealed a consistent set of behaviors, tools, and operational patterns.

## What was observed

The analyzed infrastructure contained payloads, exploitation support artifacts, request logs, data-receiving scripts, and evidence of previous attempts against multiple targets. In some cases, the same infrastructure held information related to more than one target or operation, including failed attempts, ongoing activities, and data obtained after compromise.

The analysis of these materials led us to six main conclusions.

1. The observed targets were Brazilian fintechs, especially small and medium-sized organizations, with lower media exposure and lower publicly visible security maturity when compared to large financial institutions.
2. The evidence indicates the activity of a group, not an isolated operator. This assessment is based on multiple signals: different access identifiers, concurrent activity from distinct origins, operational patterns incompatible with a single continuous human session, and stylometric differences in code artifacts.
3. At least one of the operators appears to be familiar with Brazilian Portuguese. This conclusion comes from the use of the language in operational artifacts and comments observed during the analysis.
4. We identified evidence of LLM use to support the construction of offensive tooling. The artifacts indicate the use of language models to assist in creating or adapting exploits, web shells, bypass mechanisms, exfiltration scripts, and auxiliary components used during the operation.
5. We observed attempts to bypass LLM guardrails through misleading contextualization, especially by leading the model to operate under the premise of an authorized pentest. This pattern is relevant because it shows that the group's use of AI was not limited to productivity: it was also incorporated into the offensive development process.
6. One relevant point observed was the duration of one of the operations associated with this set of artifacts. In one target, we identified activity distributed over approximately three months, indicating a direct and continuous intent against the compromised organization. This behavior reduces the likelihood of an isolated opportunistic attempt and reinforces the assessment that the group maintained operational interest in the target, adapting its approach as it encountered barriers, new access opportunities, and potential paths to increase impact.

## Attack chain

The common vector observed was the exploitation of application-level vulnerabilities. The group did not appear to rely exclusively on applications directly connected to financial flows. On the contrary: it searched for applications in the same infrastructure or in adjacent environments that could serve as an entry point for lateral movement.

After initial access, the group searched for credentials, configuration files, environment variables, internal integrations, and administration resources that could expand access.

In cases where the compromise progressed, persistence was simple. In the analyzed artifacts, we did not observe a sophisticated effort to hide. The goal appeared to be functionality and operational speed, not advanced stealth. This did not reduce the potential impact of the operation: even simple implants can be enough when combined with valid credentials, weak segmentation, excessive permissions, and low visibility into egress traffic.

In at least one case, existing controls prevented direct communication between the implant and the external infrastructure. The group's response was to adapt the operation. We observed attempts to deliver blind payloads, probing of different ports, and successive adjustments to understand the applied control and decide how to bypass it. This behavior indicates operational capability and persistence, even though the tooling itself was not particularly sophisticated.

We also observed a focus on credential exfiltration. The group sought access to other applications and services used by employees of the compromised organization, suggesting an interest in scaling the attack beyond the first exploited system.

## Why this matters

There are three points that make this campaign relevant:

1. The first is the choice of targets: small and medium-sized Brazilian fintechs may operate relevant financial assets, critical integrations, and sensitive transactional flows, but they do not always have the same detection, response, and hardening capacity found in large financial institutions. This creates an attractive surface for financially motivated groups.
2. The second is the role of applications as an entry point: the operation reinforces a recurring pattern in many organizations: the path to financial impact does not necessarily begin in the main financial system. It may begin in a legacy application, an administrative service, a poorly monitored integration, or an internal component that shares infrastructure with more critical systems.
3. The third is the use of AI as an accelerator: the use of LLMs does not automatically turn an ordinary operator into an advanced actor, but it reduces cost, accelerates iteration, and facilitates tooling adaptation. In practice, this allows groups with intermediate capability to produce more payload variations, test hypotheses faster, and overcome obstacles with less dependence on deep specialized knowledge.

## Observed TTPs — MITRE ATT&CK

Behavioral description of the group's TTPs. It does not include IoCs, such as IPs, hashes, file names, internal paths, or victim names.

| Tactic | Technique (ATT&CK) | Observed behavior |
|---|---|---|
| Resource Development (TA0042) | Obtain Capabilities: Tool (T1588.002) | Use of ready-made public exploits together with custom scripts (AI-assisted / agentic) |
| Resource Development (TA0042) | Develop Capabilities (T1587) | Generation of tooling, playbooks, and reports assisted by AI / agentic systems |
| Initial Access (TA0001) | Exploit Public-Facing Application (T1190) | Application-level exploitation against exposed services, including legacy and modern applications |
| Discovery (TA0007) | Network Service Discovery (T1046) | Internal network reconnaissance, from the obtained access, against adjacent services |
| Execution / Lateral Movement (TA0002 / TA0008) | Server-side abuse → administration console (T1190 → T1505.003) | Pivot to administration/deployment console in order to implant code |
| Persistence (TA0003) | Web Shell (T1505.003) + Masquerading (T1036) | Web shells disguised as legitimate endpoints of the application itself, such as health checks |
| Privilege Escalation (TA0004) | Escape to Host (T1611) | Container-to-host access due to deficient container isolation |
| Credential Access (TA0006) | Credentials in Files / Private Keys (T1552.001 / .004) | Collection of credentials in configuration files and keys, as well as secrets exposed in artifacts |
| Credential Access (TA0006) | Steal Application Access Token (T1528) | Theft of access tokens for reuse (replay) |
| Credential Access (TA0006) | Brute Force: Password Cracking (T1110.002) | Offline cracking of exfiltrated hashes using contextual wordlists |
| Collection (TA0009) | Email Collection (T1114) | Bulk download of mailboxes and targeted searches for remote access and financial system credentials |
| Defense Evasion (TA0005) | Account Manipulation (T1098) | Modification of an administrator's password hash to a known value |
| Command and Control (TA0011) | Non-Standard Port / Fallback Channels (T1571 / T1008) | When egress traffic was blocked: blind payloads, scanning of multiple ports, and iterative channel adjustment |
| Impact (TA0040) | Financially motivated targeting (intent) | Focus on payment, credit, and banking data and credentials |

## Conclusion

This investigation shows a financially motivated group with clear sector focus and the ability to adapt tooling according to the controls found in the victim's environment. The use of AI appears as an element of operational acceleration, especially in the creation and modification of offensive tools, but it does not replace the traditional foundations of intrusion: application exploitation, credential collection, lateral movement, persistence, and the pursuit of financial impact.

We will not publish IoCs or sensitive technical details at this time. The decision is intentional: to preserve intelligence advantage, protect potential victims, and prevent the observed infrastructure or methods from being quickly changed by the operators.

If your organization would like access to the detailed technical report, please contact us. We are always available to collaborate with security, incident response, and threat intelligence teams.