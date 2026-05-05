---
layout: post
title: 'Orientations for PII obfuscation and masking'
lang: en
category: Guides
excerpt: 'Practical recommendations for masking common types of personally identifiable information without exposing useful fragments across systems.'
author: Heitor Gouvêa
author-info:
  name:  Heitor Gouvêa
  image:  heitor-gouvea.jpeg
  description: Researcher with a software engineering background. Gouvêa's research focuses on vulnerability discovery in modern applications and the development of tools and exploits.
  linkedin: htrgouvea
date: 2026-05-04 10:00:00 -0300
permalink: /blog/orientations-for-pii-obfuscation-and-masking/
---

### Introduction

Many applications handle personally identifiable information (PII): names, addresses, email addresses, phone numbers, identification numbers, device identifiers, and other data that can identify a person directly or indirectly.

When this information appears in application screens, logs, reports, support tools, notifications, or non-production environments, the system should avoid exposing more than the user or operator actually needs. One common way to reduce this exposure is to mask or obfuscate part of the value.

This practice is familiar. A password reset flow may show only part of an email address. A support dashboard may show only the last digits of a phone number. A banking interface may show a partially hidden tax identifier. Even so, the details are often inconsistent. Different systems choose different visible characters, different quantities, and different formats.

That inconsistency matters. If the same PII is masked differently across multiple applications, each application may reveal a different fragment. An attacker who can trigger or observe those flows may combine the fragments and reconstruct the original value.

This article proposes practical orientations for masking common PII fields. The goal is not to define a universal legal standard, but to provide a technical baseline for engineers, security teams, and product teams that need consistent behavior when displaying or processing personal data.

### Obfuscation, masking, and anonymization

The terms are often used interchangeably, but they do not mean the same thing.

**Masking** is the replacement of part of a value with a fixed placeholder, usually to hide sensitive characters while preserving enough context for recognition. For example, `user.name@example.com` may become `u*******e@e*****e.com`.

**Obfuscation** is a broader practice of making data harder to understand or interpret. Masking is a type of obfuscation, but not every form of obfuscation is masking. Obfuscation may also include tokenization, redaction, truncation, or format-preserving transformations.

An example of obfuscation that is not only masking is replacing an email address with an opaque identifier. Instead of displaying `heitor.gouvea@lesis.lat` as `h***********a@l***s.lat`, the system could display `user_8f3a91`. In this case, the original value does not appear partially. It was replaced by an opaque identifier. This may be tokenization or pseudonymization, depending on how the mapping to the original value is maintained.

**Anonymization** means transforming data so that an individual can no longer be identified, directly or indirectly, using reasonably available means. Partial masking should not be treated as anonymization by default. A masked email address or phone number may still be linkable to a person, especially when combined with other data.

In practice, masking is most useful as a data minimization control. It reduces unnecessary exposure. It does not replace encryption, access control, audit logging, retention limits, or secure deletion.

### Why consistency matters

Consider a user who uses the same public alias across multiple social networks. An attacker wants to discover the email address associated with that alias. The attacker cannot see the full email, but can trigger password reset flows on several platforms.

If each platform masks the email differently, the attacker may receive fragments like these:

| Platform | Masked email |
| :---- | :---- |
| Instagram | `h***********a@g***l.com` |
| Twitter | `*************@gmail.com` |
| LinkedIn | `*******ouvea@gm********` |
| Facebook | `hei**********@gma***om` |
| Telegram | `*****r.******ea@g*****.com` |

![Diagram of email reconstruction from masked fragments](/assets/publications/pii-obfuscation/email-reconstruction-en.svg)

<p class="content-caption"><strong>Figure 1:</strong> fragments of the same email revealed by different masking rules can be combined to reconstruct the original value.</p>

Individually, each fragment may look harmless. Together, they can reveal enough structure to reconstruct the address.

The same problem can happen inside one organization. If two applications read from the same database and mask a tax identifier differently, each application may expose a different part of the value. Over time, logs, tickets, emails, screenshots, and support conversations may accumulate enough fragments to weaken the protection.

For this reason, masking should be treated as a shared policy decision, not as a local UI formatting detail. The same field should be masked in the same way across products, internal tools, APIs, and operational workflows.

### When to mask PII

PII masking is useful whenever the full value is not required for the user, operator, or system action being performed.

In support systems, agents often need to confirm that they are looking at the right customer, but they rarely need the complete tax identifier, full phone number, or full email address. Showing a limited fragment can be enough for verification while reducing exposure in the support interface.

In backup restoration tests, teams may need realistic data shape and volume, but they should not need access to real customer identifiers. Masking or replacing PII during restore can preserve operational testing value without unnecessarily exposing personal data in non-production environments.

In analytics and model training, production data may contain signals that synthetic data does not reproduce well. Even then, the default should be to remove, mask, aggregate, or tokenize PII unless the full value is strictly necessary and legally justified.

In logs and observability systems, masking is especially important because logs are often copied, indexed, retained, exported, and accessed by broader operational groups. A field that is safe in a restricted production database may become risky when repeated across log pipelines.

### General masking principles

Masking decisions should be guided by a few simple rules.

Reveal the minimum needed to complete the workflow. If the user only needs to distinguish between two phone numbers, the last two or four digits may be enough. If an operator only needs to know that an email was sent to the expected domain, the full local part should not be visible.

Keep the format recognizable when it helps usability. For example, preserving punctuation in a CPF or phone number can help users recognize the field type without exposing the full value.

Avoid revealing high-value structural information. In some identifiers, certain digits have meaning. In Brazilian CPF numbers, for example, the last two digits are check digits and the ninth digit can indicate the issuing region. A masking rule should consider those semantics instead of hiding random characters.

Use one masking rule per field type and apply it everywhere. If the policy for an email address is to reveal the first and last character of the local part and domain label, every application should use the same rule.

Do not use partial masking as the only protection for sensitive storage. If the original value must be retained, protect it with access control, encryption where appropriate, strict auditability, and retention limits. Masking should primarily control exposure at the presentation, export, logging, or derived-data layer.

Masking should happen as close as possible to the exposure surface: UI, logs, exports, messages, reports, and derived environments. It should not be confused with transforming the original value in the database without a clear need.

### Recommended patterns

The following patterns provide a practical starting point. They are baseline examples, not universal rules. Each organization should validate fields according to jurisdiction, threat model, and operational need, but the key point is consistency.

| Field | Raw value | Masked value | Orientation |
| :---- | :---- | :---- | :---- |
| CPF | `111.222.333-00` | `***.222.33*-**` | Hide the first three digits, the ninth digit, and the two check digits. Preserve punctuation only for readability. |
| Email | `user.name@example.com.br` | `u*******e@e*****e.com.br` | Reveal only the first and last character of the local part and primary domain label. Preserve public suffixes such as `.com.br` when needed for recognition. |
| Phone number | `(11) 91234-5678` | `(11) 9****-**78` | Preserve country or area code only when needed for routing or recognition. Reveal as few ending digits as the workflow requires. |
| IPv4 address | `203.0.113.42` | `203.0.113.***` | For display, hide the host octet. For analytics, prefer aggregation by subnet when possible. |
| IPv6 address | `2001:db8:abcd:0012:0000:0000:0000:0001` | `2001:db8:abcd:0012:****:****:****:****` | Preserve only the network prefix needed for operational use. Hide interface-specific segments. |
| Document number | `12.345.678-9` | `**.345.67*-*` | Treat national or regional document numbers like structured identifiers. Hide check digits and avoid exposing every semantic position. |
| Vehicle plate | `ABC1D23` | `A**1*23` | Reveal only the minimum required for user recognition. Avoid exposing enough characters to uniquely identify the vehicle in small datasets. |
| IMEI | `356938035643809` | `35693803*****09` | Reveal only the TAC or ending digits when operationally required. Avoid showing the complete device identifier in logs or support tools. |

These examples are intentionally conservative. The exact number of visible characters may change depending on the workflow, but each system should make that decision explicitly.

### Implementation guidance

Masking logic should live in shared code, not be reimplemented independently in each screen or service. A small library or shared service reduces inconsistency and makes future policy changes easier.

In organizations with multiple systems, the most practical way to ensure consistency is to adopt a standard masking library. Instead of explaining the full policy to every team and manually reviewing each implementation, the organization can recommend a single interface for fields such as tax identifiers, email addresses, phone numbers, IP addresses, and documents.

This makes verification simpler. Instead of validating whether each project implemented every rule correctly, the review can check whether the project is using the approved library. The policy remains important, but its application becomes centralized, testable, and easier to evolve.

In some companies, it may make sense to develop an internal library for this, especially when there are regulatory rules, local formats, audit requirements, or product-specific standards. That library can include tests, documentation, usage examples, and clear versioning for behavior changes.

Changes to masking rules should be versioned and communicated because they may affect support, audit, tests, and integrations that depend on the displayed format. If a rule changes, it should be treated as a behavior change in the library, not as an invisible internal detail.

For companies using LLMs or GenAI in development, the same principle also applies. The masking recommendation can be part of a skill, guideline, or context package used by internal assistants, instructing the model to use the standard library instead of generating new masking implementations for each project.

Each masking function should receive a normalized value and return a masked representation. Normalization and masking are related but separate concerns. For example, a phone number may be normalized to E.164 format internally, while the display layer may format it for the user's locale before applying the visible pattern.

PII fields should be masked before they enter log, observability, or analytics pipelines. Once sensitive data has been indexed, replicated, and retained, remediation becomes much harder.

Input length matters. Short values should not accidentally leak too much. If an email local part has only two characters, revealing the first and last character reveals the whole local part. In those cases, mask the whole segment or reveal only one character.

The policy should also define what happens with invalid or unexpected values. A masking function should fail closed: if it cannot parse a value safely, it should return a fully masked or redacted representation rather than the original input.

Finally, test masking behavior as security-relevant logic. Unit tests should cover normal values, short values, malformed values, internationalized formats, separators, empty values, and already-masked values. Regression tests are useful because accidental changes to masking can silently increase exposure.

### Hashing and encryption are different controls

Masking, hashing, and encryption solve different problems.

Encryption protects confidentiality by transforming data with a cryptographic key. If the system needs to recover the original value, encryption may be appropriate for storage or transmission, depending on the threat model and key management.

Hashing transforms data into a fixed-length digest. It is useful for integrity checks and, with proper password hashing algorithms, password storage. Plain hashes of predictable PII are often weak because many identifiers have small or enumerable search spaces. If hashing PII for matching or deduplication, use a keyed construction or another design appropriate to the risk.

Masking changes what is displayed or exported. It does not protect the original value wherever that value still exists. A masked field in a UI does not mean the database is encrypted. A masked value in a log does not mean upstream systems stopped processing the original PII.

Strong privacy engineering usually combines these controls: minimize collection, restrict access, mask display, encrypt sensitive storage and transport, audit usage, and delete data when it is no longer needed.

### Conclusion

PII masking is a practical control for reducing unnecessary exposure of personal data, but it only works well when it is intentional and consistent.

The main risk is not only showing too many characters in one place. It is showing different characters in different places, allowing fragments to be combined. A shared masking policy helps prevent that failure mode and gives engineers a clear standard to apply across applications, logs, support tools, exports, and non-production data flows.

Masking should be treated as part of a broader privacy and security program. It supports data minimization, improves user privacy, and reduces operational exposure, but it does not replace cryptography, access control, legal review, or sound data governance.

### References

1. [Personal data - Wikipedia](https://en.wikipedia.org/wiki/Personal_data)
2. [Guide to Protecting the Confidentiality of Personally Identifiable Information (PII) - NIST SP 800-122](https://nvlpubs.nist.gov/nistpubs/legacy/sp/nistspecialpublication800-122.pdf)
3. [Lei Geral de Proteção de Dados Pessoais (LGPD)](https://www.gov.br/esporte/pt-br/acesso-a-informacao/lgpd)
