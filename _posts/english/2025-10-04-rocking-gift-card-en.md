---
layout: post
title: 'Money for nothing, discounts for free: rocking the gift card loop'
lang: en
author: Heitor Gouvêa
author-info:
  name:  Heitor Gouvêa
  image:  heitor-gouvea.jpeg
  description: Researcher with a background in software engineering. Gouvêa’s research focuses on discovering vulnerabilities in modern applications and developing tools and exploits. 
  linkedin: htrgouvea
date: 2025-10-04 13:29:00 -0300
---

From time to time, the opportunity arises to conduct vulnerability research on e-commerce platforms. Although the context is similar, each opportunity is unique, as there are always peculiarities in every application. In this post, I aim to demonstrate a case involving gift cards that I find particularly interesting.

Websites that sell any type of product have an enormous level of complexity in their logic implementations, and this complexity often makes it difficult to ensure that all flows contain the appropriate security measures. In this post, we will specifically address two items frequently present in e-commerce platforms: gift cards and discount coupons, in a case study where primitives were found that allowed the exploitation of a vulnerability.

**Gift cards:** whether virtual or physical, a gift card is a type of prepaid card that customers can purchase for themselves or to give to others. It has a monetary value associated with it, which can be used for purchases on the website, allowing the recipient to choose the products or services they want until the gift card balance is fully spent.

**Discount coupon:** this is a code, usually alphanumeric, provided to customers to reduce the purchase price of products or services. When applied during checkout, the customer receives a discount or specific benefit, such as a percentage off or free shipping, making the purchase more advantageous.

###  Rocking the gift card loop

![](/assets/publications/ecommerce-giftcard/product-list.png)

- *Figure 1: Listing of a Gift Card for sale*

During a testing activity cycle, I identified the following scenario: a site offers the option to purchase gift cards and, at the same time, allows the use of discount coupons in that very purchase. For example, when purchasing a gift card worth R$150.00, it is possible to apply a discount coupon called “15OFF,” which grants a R$15 discount. As a result, the amount paid is only R$135.00 for a gift card that still has a "purchasing power" of R$150.00.

![](/assets/publications/ecommerce-giftcard/checkout.png)

- *Figure 2: Buying a Gift Card with a discount coupon in an e-commerce*

The issue in this scenario is that the gift card can then be used to purchase another gift card, while once again applying the discount coupon. Thus, in the next transaction, it is possible to acquire a R$150.00 gift card using a gift card that cost only R$135.00, while again applying the R$15.00 discount coupon.

This creates a pattern: each time this flow is repeated, R$15.00 of additional balance is illegitimately generated. In practical terms, with every transaction the user increases their available credit without making any additional financial outlay.

To illustrate, if this process is repeated across 10 consecutive cycles, the initial R$150.00 credit evolves into R$300.00, representing a 100% increase in balance with no financial counterpart. Such a situation characterizes a systemic fraud scenario, as it enables the creation of fictitious credit within the platform.

Additionally, it is important to note that each transaction carried out is subject to operational fees charged by payment intermediaries. Thus, beyond the financial loss from the illegitimate generation of balance, the recurring processing of transactions increases operational costs, amplifying the negative financial impact on the platform.

### Conclusion

The vulnerability identified stems from business logic flaws, and its mitigation requires structural adjustments to the purchase flow. The first and most direct measure is to restrict the use of gift cards as a payment method for acquiring new gift cards. This simple rule eliminates the possibility of chaining transactions that result in the artificial generation of balance.

Complementarily, it is advisable to establish specific policies for discount coupons, preventing them from being applied to gift card purchases. This practice is common in the market and aims to preserve the financial integrity of the system, since gift cards function in practice as stored-value instruments and should not be subject to promotions that reduce their acquisition cost.

Furthermore, implementing fraud prevention and detection mechanisms is highly recommended. The use of an antifraud engine integrated into the checkout process allows the identification of suspicious patterns, such as multiple transactions of apparently low risk that in practice reveal attempts at systemic exploitation. Such controls, combined with continuous monitoring and usage limitation policies (e.g., maximum gift card purchase value per customer within a given period), strengthen the platform’s resilience against similar abuses.

Taken together, these measures represent a multilayered mitigation approach, reducing the company’s exposure to financial fraud risk and ensuring greater reliability.

#### References

 - [*Common Security Issues in Financially- Oriented Web Applications – NCC Group*](https://soroush.me/downloadable/common-security-issues-in-financially-orientated-web-applications.pdf)
 - [*Gift Card Fraud Prevention Methods & Solutions*](https://datadome.co/threats/gift-card-fraud-prevention/)

