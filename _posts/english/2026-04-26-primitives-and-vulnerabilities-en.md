---
layout: post
title: 'Primitives and vulnerabilities'
lang: en
category: Research
excerpt: 'How thinking in primitives helps turn discrepancies between intent and real behavior into impact analysis.'
author: Heitor Gouvêa
author-info:
  name:  Heitor Gouvêa
  image:  heitor-gouvea.jpeg
  description: Researcher with a software engineering background. Gouvêa's research focuses on vulnerability discovery in modern applications and the development of tools and exploits.
  linkedin: htrgouvea
date: 2026-04-26 16:20:00 -0300
---

### Introduction

Last week, I tested the use of LLMs to support the vulnerability research process. It made me think: how can we "teach" a model to actually help find valid bugs?

I reflected on my own process: how I analyze code, model threats, and reach the point where something becomes, in fact, a vulnerability.

### Understanding, or creating, primitives

In short, I realized that I try to answer three questions during analysis:

1. What is this code, feature, component, or endpoint trying to do?
2. What does it actually do?
3. What is possible to do with it?

I choose a primitive: the smallest part of the system that performs an action, such as a function, endpoint, or component. First, I try to understand what it should do, using documentation, names, and context.

Then I observe what it actually does: I run it, test valid and invalid inputs, inspect logs, and compare the result with the expected behavior.

When I find a discrepancy between intent and reality, I ask: what can be done with this? From there, I map what a malicious actor could control, which actions they could execute, and what the impact would be.

If that difference allows real impact, then it is a vulnerability.

Small isolated discrepancies sometimes do not create relevant impact, but when chained they almost always reveal interesting vectors. After looking at the micro level, it is necessary to understand the macro level: how all these primitives can be combined.

I am now using prompts generated from this understanding in my day-to-day work, in an automated way and integrated into my workflow. They help me understand components faster, suggest more contextual data inputs, propose test inputs, and translate discrepancies into possible scenarios.

### A simple example

In a past analysis, I tested a web application and identified a login screen. I ran several tests, including using a valid email with wrong passwords, trying to generate different feedback from the application to better understand the behavior of the flow.

After more than five login attempts with the wrong password, the application returned a warning: the account was blocked because the login attempt limit had been exceeded.

Through the first question, the intent seemed clear: this control existed to prevent brute-force attacks.

Through the second question, the real behavior had important details. The lockout did not expire automatically, the user had no simple way to unblock their own account, and no email notification was sent warning about the lockout. To recover access, the user had to contact support.

Through the third question, the possible impact became clearer. A malicious actor did not need to discover the password or access the account. It was enough to know or enumerate valid emails and perform login attempts with incorrect passwords to block real accounts. A control created to protect against brute force could be used as a denial-of-service primitive against legitimate users.

### Conclusion

Thinking in primitives helps turn analysis into a more explicit process. Instead of looking at the system only as a large and complex set of features, I start observing small actions, comparing intent and reality, and then understanding how those differences can be used.

This reasoning is useful for manual research and also for using LLMs. The better I can describe a primitive, its intent, its real behavior, and its possible impact, the better I can use models and automation to support the investigation process. In the end, finding vulnerabilities still depends on technical judgment, but structuring the path toward them makes that judgment clearer, more repeatable, and easier to communicate.
