---
layout: post
title: 'Dinheiro de graça, descontos sem esforço: hackeando o loop dos gift cards'
lang: pt
author: Heitor Gouvêa
author-info:
  name:  Heitor Gouvêa
  image:  heitor-gouvea.jpeg
  description: Pesquisador, com background em engenharia de software. O foco da pesquisa de Gouvêa é a descoberta de vulnerabilidade em aplicações modernas e desenvolvimento de ferramentas e exploits. 
  linkedin: htrgouvea
date: 2025-10-04 13:29:00 -0300
---

Com certa frequência, surge a oportunidade de realizar pesquisas de vulnerabilidades em e-commerces. Apesar do contexto ser o mesmo, cada uma das oportunidades é única,  pois sempre há peculiaridades em cada aplicação. Nesta publicação busco demonstrar um caso envolvendo gift cards que considero interessante.

Sites que comercializam qualquer tipo de produto possuem uma enorme complexidade em suas implementações de lógicas, e essa complexidade frequentemente dificulta a garantia de que todos os fluxos contenham as medidas de seguranças adequadas. Nesta publicação, abordaremos especificamente dois itens frequentemente presentes em e-commerces: gift cards e cupons de descontos, em um estudo de caso onde foi localizada primitivas que permitiram a exploração de uma vulnerabilidade.

**Gift cards**: virtual ou físico, é uma espécie de cartão pré-pago que os clientes podem adquirir para si ou para presentear outras pessoas. Ele possui um valor monetário associado, que pode ser usado para compras no site, permitindo ao destinatário escolher os produtos ou serviços que deseja adquirir até que o saldo do gift card seja totalmente utilizado.

**Cupom de desconto**: trata-se de um código, geralmente alfanumérico, fornecido aos clientes para reduzir o valor de compra de produtos ou serviços. Ao aplicar o cupom durante o processo de pagamento, o cliente recebe um desconto ou benefício específico, como uma porcentagem de desconto ou frete grátis, tornando a compra mais vantajosa.

###  Rocking the gift card loop

![](/assets/publications/ecommerce-giftcard/product-list.png)

-  *Figura 1: Listagem de um Gift Card para venda;*

Durante um ciclo de atividades de testes, identifiquei o seguinte cenário: um site oferece a opção de compra de gift cards e, simultaneamente, permite o uso de cupons de desconto ainda nessa mesma compra. Por exemplo, ao comprar de um gift card no valor de R$150,00, é permitido o uso de  um cupom de desconto chamado “15OFF”, que concede desconto de R$ 15. Dessa forma,  o valor a ser pago é de apenas R$135,00 por um gift card que ainda tem a capacidade de compra do valor de R$150,00.

![](/assets/publications/ecommerce-giftcard/checkout.png)

- *Figura 2: Comprando um Gift Card com cupom de desconto em e-commerce*  

O problema neste cenário é: esse gift card pode ser utilizado durante a compra de outro gift card, com a possibilidade de aplicar o cupom de desconto novamente. Assim, na próxima transação, é possível adquirir um gift card de R$150,00, utilizando um gift card que custou apenas R$ 135,00. Aplicando outra vez o cupom de desconto de R$ 15,00.

Surge então um padrão: a cada utilização desse fluxo, ocorre a geração indevida de R$15,00 em saldo adicional. Em termos práticos, a cada transação o usuário amplia o valor de crédito disponível sem efetuar novo desembolso financeiro.

Para ilustrar, caso o processo seja repetido em 10 ciclos consecutivos, o crédito inicial de R$150,00 evolui para R$300,00, representando um aumento de 100% no saldo sem qualquer contrapartida financeira. Tal situação caracteriza um cenário de fraude sistêmica, uma vez que possibilita a criação de saldo fictício dentro da plataforma.

Adicionalmente, é importante considerar que cada transação realizada está sujeita à cobrança de taxas operacionais por parte dos intermediadores de pagamento. Assim, além do prejuízo decorrente da geração indevida de saldo, o recorrente processamento de transações aumenta os custos da operação, ampliando o impacto financeiro negativo para a plataforma.

### Conclusão

A vulnerabilidade identificada tem origem em falhas de lógica de negócios, e a sua mitigação demanda ajustes estruturais no fluxo de compra. A primeira e mais direta medida consiste em restringir o uso de gift cards como forma de pagamento para a aquisição de novos gift cards. Essa regra simples elimina a possibilidade de encadeamento de transações que resultam na geração artificial de saldo.

De forma complementar, recomenda-se estabelecer políticas específicas para cupons de desconto, impedindo que sejam aplicados em operações de compra de gift cards. Essa prática é comum no mercado e visa preservar a integridade financeira do sistema, já que os gift cards funcionam, na prática, como instrumentos de valor armazenado e não devem ser objeto de promoções que reduzem seu custo de aquisição.

Adicionalmente, é altamente recomendável a implementação de mecanismos de prevenção e detecção de fraudes. A utilização de uma engine antifraude, integrada ao processo de checkout, permite identificar padrões suspeitos, como múltiplas transações de baixo risco aparente, mas que na prática revelam tentativas de exploração sistêmica. Esse tipo de controle, associado a monitoramento contínuo e políticas de limitação de uso (ex.: valor máximo de gift cards adquiridos por cliente em determinado período), fortalece a resiliência da plataforma contra abusos semelhantes.

Em conjunto, essas medidas representam uma abordagem de mitigação em múltiplas camadas, reduzindo a exposição da empresa ao risco de fraude financeira e garantindo maior confiabilidade.

#### Referências

 - [*Common Security Issues in Financially- Oriented Web Applications – NCC Group*](https://soroush.me/downloadable/common-security-issues-in-financially-orientated-web-applications.pdf)
 - [*Gift Card Fraud Prevention Methods & Solutions*](https://datadome.co/threats/gift-card-fraud-prevention/)