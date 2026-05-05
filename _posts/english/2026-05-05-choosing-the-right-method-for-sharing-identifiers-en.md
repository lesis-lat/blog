---
layout: post
title: 'Choosing the right method for sharing identifiers'
lang: en
category: Case Study
excerpt: 'How to choose between encryption, hashes, HMAC, APIs, and PSI when comparing datasets with personal identifiers.'
author: Heitor Gouvêa
author-info:
  name:  Heitor Gouvêa
  image:  heitor-gouvea.jpeg
  description: Researcher with a software engineering background. Gouvêa's research focuses on vulnerability discovery in modern applications and the development of tools and exploits.
  linkedin: htrgouvea
date: 2026-05-05 08:00:00 -0300
permalink: /blog/choosing-the-right-method-for-sharing-identifiers/
---

### Introduction

Some security problems appear precisely when two legitimate companies want to collaborate.

Imagine a digital financial institution with a very large customer base and a marketplace preparing a promotion exclusively for that institution's customers. During the campaign, the marketplace needs to know which people are also customers of the financial institution so it can apply the benefit correctly.

The problem seems simple: one company has the list of eligible customers, the other has its own user base, and the promotion should apply only to the intersection between the two datasets.

But there is an important question: how can this comparison be allowed without exposing more personal data than necessary?

### The Scenario

The business need was direct: a promotional campaign should be offered by a commercial partner only to customers of the financial institution.

Because the financial institution had a customer base larger than the partner's base, simply sending all customer CPFs to the partner would allow the comparison, but it would expose far more people than necessary.

The first proposal from the team responsible for the integration was to encrypt a file containing all eligible customer CPFs and transmit it through a secure channel. The partner would receive the file, decrypt it, compare it with its own base, and identify which users were eligible.

From a transport perspective, this seems reasonable. The file would be protected during transmission. The channel could be authenticated. Access could be restricted.

But the main problem was not only transport. The problem was minimization.

At the end of the process, the partner would have access to a complete list of CPFs from customers of the financial institution, including people who might not even have an account in the marketplace, might never participate in the campaign, and might never need to be known by the partner. Encryption would protect the file in transit, but it would not reduce the data revealed to the recipient.

### Encryption Solves Another Problem

Encryption is a confidentiality tool. It protects data from people who should not access it during storage or transmission. If an encrypted file is intercepted by someone without the key, its content remains protected.

But in many integration flows, the legitimate recipient needs to open the file. After decrypting it, the recipient can see the original values.

In this case, encryption answered the question:

> How can the list of CPFs be sent without third parties reading the file in transit?

But there was a second question that still had to be answered:

> How can the partner discover only which customers already exist in its own base, without receiving the complete list from the financial institution?

These questions may look similar, but they are different problems. The first is about confidentiality in transit and remained necessary. The second is about data minimization and exposure to the recipient. The point was not to replace encryption, but to recognize that it had to be combined with a design that revealed less information.

### Where Hashes Help

A cryptographic hash transforms an input into a fixed-size output. For the same input, the result is always the same. For different inputs, the results are expected to be different. Good hash algorithms also make it impractical to recover the original input from the output, as long as the input has enough entropy.

This deterministic property allows comparison without transmitting the original value.

For example, instead of sharing:

```text
123.456.789-10
```

a company could share:

```text
sha256("12345678910") = 01b6...f3a9
```

If the partner normalizes its own CPFs the same way and calculates the same hash, it can compare the hashes. When there is equality, there is a CPF in common.

The privacy gain is intuitive: instead of directly revealing CPFs, the companies compare derived representations. The partner should only be able to recognize CPFs it already knows, because it needs to have the original value in its own base to generate the same hash.

This idea is useful, but there is an important trap.

### CPF Is Enumerable

Developers often learn about hashes in the context of passwords. In that context, the input is ideally secret, chosen by the user, and hard to guess. Even then, passwords require specific algorithms such as Argon2, bcrypt, or scrypt, as well as salt, computational cost, and good storage policies.

CPF is different.

CPF has a known format, a limited number of combinations, and check digits. This means an attacker can generate many candidate CPFs, calculate their hashes, and compare them with a leaked list. This is the principle behind dictionary attacks or rainbow tables.

For that reason, the following approach is weak:

```text
sha256(cpf_normalizado)
```

It does not reveal the CPF directly, but it should not be treated as anonymization either. For predictable identifiers, a simple hash is often reversible through brute force or precomputation.

This point is essential: hash is not magic. Security depends both on the algorithm and on the nature of the input.

### Normalization Matters

Before any comparison, both sides need to arrive at exactly the same representation of the identifier.

For CPF, this usually means removing punctuation, validating length, preserving leading zeroes, and rejecting invalid or malformed values. Otherwise, the same CPF may produce different hashes:

```text
123.456.789-10
12345678910
```

These two strings look equivalent to a person, but they are different inputs for a hash algorithm.

Every comparison strategy needs to document normalization before documenting the algorithm. Without that, the process produces false negatives, operational inconsistency, and audit difficulties.

### Salt Does Not Always Solve It

A common reaction is to add salt:

```text
sha256(salt || cpf_normalizado)
```

In password storage, salt is fundamental because it prevents the same value from producing the same hash across different databases and makes generic precomputed tables less useful. But in a matching process between two companies, both parties need to generate the same result for the same CPF.

If each company uses a different salt, the hashes will not match. If the salt is shared between the companies, it helps against some external precomputed tables, but it does not prevent a party with access to the salt from enumerating candidate CPFs and calculating their hashes.

Salt is useful, but it does not solve the problem of predictable identifiers in a matching integration by itself.

### HMAC with an API as a Pragmatic Path

A better alternative than a simple hash is to use HMAC:

```text
hmac_sha256(secret_key, normalized_cpf)
```

HMAC uses a secret key in the calculation. Without the key, a third party that obtains the list of HMACs cannot easily calculate the corresponding values for candidate CPFs. This significantly reduces the risk of offline attacks by third parties.

But there is a design question. If the key is shared with the partner so it can calculate HMACs over its own base, the partner can also calculate HMACs for candidate CPFs on its own. This may be acceptable in some scenarios, as long as the key is specific to the campaign, rotated, scoped, and covered by audit controls, but it changes the trust model.

A pragmatic path would be to combine HMAC with an API controlled by the financial institution. In this design, the marketplace prepares its own base, normalizes the CPFs, calculates the derived identifiers according to the campaign specification, and sends a batch to the API. The financial institution compares those values against an equivalent representation of its own base and returns only the result needed for the campaign. That result does not need to be a new list of CPFs. It can be an eligibility flag associated with the marketplace's own users.

A simple example would be:

```text
Marketplace sends:
user_id=10, hmac_cpf=aaa
user_id=20, hmac_cpf=bbb
user_id=30, hmac_cpf=ccc
```

After the comparison, the API could respond:

```text
user_id=10, eligible=true
user_id=20, eligible=false
user_id=30, eligible=true
```

With this, the marketplace can apply the campaign inside its own base, but it does not receive the complete list of CPFs from the financial institution. CPF is used as the technical comparison key, but the operational result is an eligibility flag.

This approach changes the problem into a controlled query model. If the API allows arbitrary CPFs to be tested, even with authentication and HMAC, it can become an eligibility oracle. For that reason, this type of solution needs additional controls: accepting only batches associated with the partner's declared base, limiting reprocessing, auditing queries, enforcing campaign windows, and clearly defining what may be tested. In other words, HMAC and an API can form a practical solution, but the guarantee then depends on governance and operational control. For scenarios that require a stronger technical guarantee about what each party learns, there is a more sophisticated approach.

### A More Sophisticated Alternative: Private Set Intersection

A more sophisticated alternative for this type of problem is known as private set intersection, or PSI.

In simple terms, PSI is a family of cryptographic protocols that allows two parties to compare sets and discover an intersection without sharing the sets in plaintext. The idea is not to "encrypt a list and hand it to the other side". The idea is to run a process in which each party keeps its own set and participates in a protocol-based comparison.

A small example helps visualize the objective. Suppose the financial institution has the CPFs `111`, `222`, `333`, and `444`. The partner has the CPFs `222`, `444`, and `555`. The result needed for the campaign is to know that `222` and `444` are in both sets. The partner does not need to learn that `111` and `333` exist in the financial institution's base. The financial institution also does not need to learn that `555` exists in the partner's base, unless the protocol or campaign design requires it.

In a common file-based comparison, one party receives a list and computes the intersection locally. This is simple, but it forces that party to see values that are not part of the final result. In an API-based query, on the other hand, the financial institution can avoid handing its entire base to the marketplace, but it starts observing the batch that the marketplace is querying. That may be acceptable. But if the requirement is also to reduce what the financial institution learns about the marketplace's base, a centralized API may not be enough.

There are different ways to implement PSI. Some use public-key cryptography, others use oblivious transfer, garbled circuits, or constructions based on hashing and ephemeral keys. The mathematical detail changes depending on the protocol, but the security objective remains: allow matching between sets without turning an integration into broad database sharing.

It is also important to observe that PSI does not define only "how to compare". It helps define "who learns what". In some designs, both parties learn the intersection. In others, only one party learns which users are eligible. For the promotion case, this second model makes more sense: the marketplace needs to apply the benefit inside its own base, while the financial institution does not necessarily need to learn which customers are also in the marketplace.

Applied to the promotion case, the desired result may not have been a new list of CPFs shared between companies. It could simply be a way for the partner to mark, inside its own base, which users are eligible. This distinction reduces exposure because it keeps the focus on the operational result of the campaign, not on the circulation of identifiers.

PSI, however, does not eliminate every risk. If one party can freely choose the input set, it can still try to test identifiers that do not belong to its legitimate base. For that reason, PSI does not replace contracts, audits, scope controls, or process validation. What it improves is another point: it reduces the need for one party to hand over its entire base in plaintext, and it can also reduce how much the other party observes during the comparison.

In practice, PSI is more complex than an API with HMAC. It requires an appropriate library, understanding of the protocol, care with normalization, error handling, auditing, performance testing, and evaluation of what each party learns during the process. Not every case requires this level of sophistication. But it should be considered when the requirement is not only to prevent the marketplace from receiving the financial institution's entire base, but also to reduce how much the financial institution learns about the marketplace's set during the matching process.

### A Practical Hierarchy of Solutions

Not every integration needs the same level of protection. A pragmatic way to think about it is to organize the options by exposure reduction.

An encrypted file with CPFs in transit protects against interception, but reveals the complete list to the recipient. It is simple, but weak in minimization.

Simple hashes of CPFs avoid casual direct exposure, but they are vulnerable to enumeration because CPF is predictable. They should not be treated as anonymization.

HMAC with a controlled key improves protection against third parties and leaks of the derived list, but requires strong key governance. Instead of sharing the key with the partner, an authenticated API using HMAC can be a practical alternative when the goal is to answer eligibility without handing over the financial institution's entire base, as long as it does not allow arbitrary queries without control.

PSI or an equivalent protocol is a more sophisticated option when there is also interest in reducing what the financial institution learns about the set queried by the marketplace, in addition to avoiding delivery of the entire base to the partner.

This hierarchy helps explain why the initial answer of "let's encrypt the file" was insufficient. The question was not only how to transport data securely. The question was how much data needed to be revealed to achieve the objective.

### Conclusion

A security review for this type of sharing should begin with simple questions. Before choosing an algorithm, it is necessary to understand the exact objective of the comparison, who needs to learn the result, and which format that result needs to have. Does the result need to be a list of CPFs, a list of eligible users, a boolean per user, or only an aggregated count?

It is also necessary to evaluate which data from people outside the intersection would be exposed by the proposed solution. This is a central question, because a solution may look secure because it uses encryption and still reveal a much larger set than necessary to the legitimate recipient.

Another important point is the nature of the identifier being used. If the identifier is predictable or has low entropy, a simple hash should not be treated as strong protection. The existence of documented normalization also needs to be verified, because small formatting differences can break the comparison or create exceptions that are hard to audit.

Finally, the review should cover who controls keys, salts, or secrets, whether the process is auditable and reproducible, and whether intermediate files and results have limited retention. These questions prevent the discussion from being limited to "is the file encrypted?". Transport security matters, but minimization, purpose, retention, and the trust model matter just as much.

Encryption, hashes, HMAC, APIs, and PSI are different tools for different problems. The right decision depends less on familiarity with a specific technique and more on what each party needs to learn during the process.

The main lesson from this case is that "transmitting securely" is not the same as "revealing the minimum necessary". In integrations between companies, especially when personal identifiers are involved, the architecture should start from minimization: who needs to know what, for how long, and with which technical guarantee?

Sometimes, the best solution is not to encrypt the file better. It is to avoid having that file exist in that form.

### References

1. [Cryptographic hash function - Wikipedia](https://en.wikipedia.org/wiki/Cryptographic_hash_function)
2. [Hash-based message authentication code - Wikipedia](https://en.wikipedia.org/wiki/HMAC)
3. [Private set intersection - Wikipedia](https://en.wikipedia.org/wiki/Private_set_intersection)
4. [NIST SP 800-107 Rev. 1 - Recommendation for Applications Using Approved Hash Algorithms](https://csrc.nist.gov/pubs/sp/800/107/r1/final)
