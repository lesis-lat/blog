---
layout: post
title: 'Saldo fantasma, rebajas eternas: la trampa de los gift cards'
lang: es
author: Heitor Gouvêa
author-info:
  name:  Heitor Gouvêa
  image:  heitor-gouvea.jpeg
  description: Security Researcher con formación en ingeniería de software. El enfoque de Gouvêa es el descubrimiento de vulnerabilidades en aplicaciones modernas y en el desarrollo de herramientas y exploits.
  linkedin: htrgouvea
date: 2025-10-04 13:29:00 -0300
---

Con cierta frecuencia surge la oportunidad de realizar investigaciones de vulnerabilidades en comercios electrónicos. Aunque el contexto sea el mismo, cada una de esas oportunidades es única, ya que siempre existen particularidades en cada aplicación. En esta publicación busco mostrar un caso relacionado con gift cards que considero interesante.

Los sitios que comercializan cualquier tipo de producto presentan una enorme complejidad en la implementación de sus lógicas, y esa complejidad suele dificultar la garantía de que todos los flujos contengan las medidas de seguridad adecuadas. En esta publicación abordaremos específicamente dos elementos frecuentemente presentes en los e-commerces: gift cards y cupones de descuento, en un estudio de caso donde se localizaron primitivas que permitieron la explotación de una vulnerabilidad.

**Gift cards:** virtuales o físicos, son una especie de tarjeta prepaga que los clientes pueden adquirir para sí mismos o para regalar a otras personas. Poseen un valor monetario asociado que puede utilizarse para compras en el sitio, permitiendo al destinatario elegir los productos o servicios que desee hasta que el saldo del gift card sea completamente utilizado.

**Cupón de descuento:** se trata de un código, generalmente alfanumérico, entregado a los clientes para reducir el valor de compra de productos o servicios. Al aplicar el cupón durante el proceso de pago, el cliente recibe un descuento o beneficio específico, como un porcentaje de rebaja o envío gratuito, haciendo la compra más ventajosa.

###  Rocking the gift card loop

![](/assets/publications/ecommerce-giftcard/product-list.png)

- *Figura 1: Listado de un Gift Card para la venta*

Durante un ciclo de actividades de prueba, identifiqué el siguiente escenario: un sitio ofrece la opción de compra de gift cards y, simultáneamente, permite el uso de cupones de descuento en esa misma compra. Por ejemplo, al adquirir un gift card con valor de R$150,00, se permite aplicar un cupón de descuento llamado “15OFF”, que otorga un descuento de R$15. De esta manera, el monto a pagar es de solo R$135,00 por un gift card que todavía conserva la capacidad de compra de R$150,00.

![](/assets/publications/ecommerce-giftcard/checkout.png)

- *Figura 2: Comprando un Gift Card con cupón de descuento en un e-commerce*

El problema en este escenario es que ese gift card puede ser utilizado para la compra de otro gift card, con la posibilidad de aplicar nuevamente el cupón de descuento. Así, en la siguiente transacción es posible adquirir un gift card de R$150,00 utilizando un gift card que costó apenas R$135,00, aplicando otra vez el cupón de descuento de R$15,00.

Surge entonces un patrón: en cada utilización de este flujo ocurre la generación indebida de R$15,00 en saldo adicional. En términos prácticos, en cada transacción el usuario incrementa el valor de crédito disponible sin realizar un nuevo desembolso financiero.
Para ilustrar, si el proceso se repite en 10 ciclos consecutivos, el crédito inicial de R$150,00 evoluciona hasta R$300,00, representando un aumento del 100% en el saldo sin ninguna contrapartida financiera. Esta situación caracteriza un escenario de fraude sistémico, ya que permite la creación de saldo ficticio dentro de la plataforma.

Adicionalmente, es importante considerar que cada transacción realizada está sujeta al cobro de tasas operativas por parte de los intermediarios de pago. Así, además del perjuicio derivado de la generación indebida de saldo, el procesamiento recurrente de transacciones incrementa los costos de la operación, ampliando el impacto financiero negativo para la plataforma.

### Conclusión

La vulnerabilidad identificada tiene su origen en fallas de lógica de negocio, y su mitigación requiere ajustes estructurales en el flujo de compra. La primera y más directa medida consiste en restringir el uso de gift cards como forma de pago para la adquisición de nuevos gift cards. Esta regla simple elimina la posibilidad de encadenar transacciones que resulten en la generación artificial de saldo.
De manera complementaria, se recomienda establecer políticas específicas para los cupones de descuento, impidiendo que se apliquen en operaciones de compra de gift cards. Esta práctica es común en el mercado y busca preservar la integridad financiera del sistema, ya que los gift cards funcionan, en la práctica, como instrumentos de valor almacenado y no deberían ser objeto de promociones que reduzcan su costo de adquisición.

Asimismo, es altamente recomendable implementar mecanismos de prevención y detección de fraudes. El uso de un motor antifraude, integrado al proceso de checkout, permite identificar patrones sospechosos, como múltiples transacciones de aparente bajo riesgo que en la práctica revelan intentos de explotación sistémica. Este tipo de control, asociado al monitoreo continuo y a políticas de limitación de uso (por ejemplo: valor máximo de gift cards adquiridos por cliente en un período determinado), fortalece la resiliencia de la plataforma frente a abusos similares.

En conjunto, estas medidas representan un enfoque de mitigación en múltiples capas, reduciendo la exposición de la empresa al riesgo de fraude financiero y garantizando una mayor confiabilidad.

#### Referencias

 - [*Common Security Issues in Financially- Oriented Web Applications – NCC Group*](https://soroush.me/downloadable/common-security-issues-in-financially-orientated-web-applications.pdf)
 - [*Gift Card Fraud Prevention Methods & Solutions*](https://datadome.co/threats/gift-card-fraud-prevention/)