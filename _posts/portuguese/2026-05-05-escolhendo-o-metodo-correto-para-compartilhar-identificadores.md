---
layout: post
title: 'Escolhendo o método correto para compartilhar identificadores'
lang: pt
category: Estudo de Caso
excerpt: 'Como escolher entre criptografia, hash, HMAC e PSI ao comparar bases com identificadores pessoais.'
author: Heitor Gouvêa
author-info:
  name:  Heitor Gouvêa
  image:  heitor-gouvea.jpeg
  description: Pesquisador, com background em engenharia de software. O foco da pesquisa de Gouvêa é a descoberta de vulnerabilidade em aplicações modernas e desenvolvimento de ferramentas e exploits.
  linkedin: htrgouvea
date: 2026-05-05 08:00:00 -0300
permalink: /blog/escolhendo-o-metodo-correto-para-compartilhar-identificadores/
---

### Introdução

Alguns problemas de segurança aparecem justamente quando duas empresas legítimas querem colaborar.

Imagine uma instituição financeira digital com uma base muito grande de clientes e um marketplace preparando uma promoção exclusiva para clientes dessa instituição. O marketplace precisa saber, durante a campanha, quais pessoas também são clientes da instituição financeira para aplicar o benefício corretamente.

O problema parece simples: uma empresa tem a lista de clientes elegíveis, a outra tem sua própria base de usuários, e a promoção deve valer apenas para a interseção entre as duas bases.

Mas existe uma pergunta importante: como permitir essa comparação sem expor mais dados pessoais do que o necessário?

### O cenário

A necessidade de negócio era direta: uma campanha promocional deveria ser oferecida por um parceiro comercial apenas para clientes da instituição financeira.

Como a instituição financeira tinha uma base de clientes maior do que a base do parceiro, simplesmente enviar todos os CPFs de seus clientes para o parceiro permitiria a comparação, mas exporia muito mais pessoas do que o necessário.

A primeira proposta do time responsável pela integração era criptografar um arquivo contendo todos os CPFs dos clientes elegíveis e transmiti-lo por um canal seguro. O parceiro receberia o arquivo, descriptografaria, compararia com sua própria base e identificaria quais usuários eram elegíveis.

Do ponto de vista de transporte, isso parece razoável. O arquivo estaria protegido durante o envio. O canal poderia ser autenticado. O acesso poderia ser restrito.

Mas o problema principal não era apenas transporte. O problema era minimização.

Ao final do processo, o parceiro teria acesso a uma lista completa de CPFs de clientes da instituição financeira, inclusive pessoas que talvez nem tivessem conta no marketplace, nunca participassem da campanha ou nunca precisassem ser conhecidas pelo parceiro. A criptografia protegeria o arquivo no caminho, mas não reduziria o dado revelado ao destinatário.

### Criptografia resolve outro problema

Criptografia é uma ferramenta de confidencialidade. Ela protege dados contra quem não deve acessá-los durante armazenamento ou transmissão. Se um arquivo criptografado é interceptado por alguém sem a chave, o conteúdo permanece protegido.

Mas, em muitos fluxos de integração, o destinatário legítimo precisa abrir o arquivo. Depois que ele descriptografa o conteúdo, passa a enxergar os valores originais.

Nesse caso, criptografia respondia à pergunta:

> Como enviar a lista de CPFs sem que terceiros leiam o arquivo no caminho?

Mas havia uma segunda pergunta que ainda precisava ser respondida:

> Como permitir que o parceiro descubra apenas quais clientes já existem na própria base, sem receber a lista completa da instituição financeira?

Essas perguntas parecem parecidas, mas são problemas diferentes. A primeira é sobre confidencialidade em trânsito e continuava sendo necessária. A segunda é sobre minimização de dados e exposição ao destinatário. O ponto não era substituir criptografia, mas reconhecer que ela precisava ser combinada com um desenho que revelasse menos informação.

### Onde hashes ajudam

Um hash criptográfico transforma uma entrada em uma saída de tamanho fixo. Para a mesma entrada, o resultado é sempre o mesmo. Para entradas diferentes, espera-se que os resultados sejam diferentes. Bons algoritmos de hash também tornam impraticável recuperar a entrada original a partir da saída, desde que a entrada tenha entropia suficiente.

Essa propriedade determinística permite comparação sem transmitir o valor original.

Por exemplo, em vez de compartilhar:

```text
123.456.789-10
```

uma empresa poderia compartilhar:

```text
sha256("12345678910") = 01b6...f3a9
```

Se o parceiro normalizar seus próprios CPFs da mesma forma e calcular o mesmo hash, ele pode comparar os hashes. Quando houver igualdade, existe um CPF em comum.

O ganho de privacidade é intuitivo: em vez de revelar diretamente os CPFs, as empresas comparam representações derivadas. O parceiro só deveria conseguir reconhecer os CPFs que já conhece, porque precisa ter o valor original em sua própria base para gerar o mesmo hash.

Essa ideia é útil, mas há uma armadilha importante.

### CPF é enumerável

Desenvolvedores muitas vezes aprendem hash no contexto de senhas. Nesse contexto, a entrada idealmente é secreta, escolhida pelo usuário e difícil de adivinhar. Mesmo assim, senhas exigem algoritmos específicos como Argon2, bcrypt ou scrypt, além de salt, custo computacional e boas políticas de armazenamento.

CPF é diferente.

CPF tem formato conhecido, quantidade limitada de combinações e dígitos verificadores. Isso significa que um atacante pode gerar muitos CPFs candidatos, calcular seus hashes e comparar com uma lista vazada. Esse é o princípio de ataques por dicionário ou rainbow table.

Por isso, a seguinte abordagem é fraca:

```text
sha256(cpf_normalizado)
```

Ela não revela o CPF de forma direta, mas também não deve ser tratada como anonimização. Para identificadores previsíveis, hash simples costuma ser reversível por força bruta ou pré-computação.

Esse ponto é essencial: hash não é mágica. A segurança depende tanto do algoritmo quanto da natureza da entrada.

### Normalização importa

Antes de qualquer comparação, os dois lados precisam chegar exatamente à mesma representação do identificador.

No caso de CPF, isso normalmente significa remover pontuação, validar comprimento, preservar zeros à esquerda e rejeitar valores inválidos ou malformados. Caso contrário, o mesmo CPF pode produzir hashes diferentes:

```text
123.456.789-10
12345678910
```

Essas duas strings têm aparência equivalente para uma pessoa, mas são entradas diferentes para um algoritmo de hash.

Toda estratégia de comparação precisa documentar a normalização antes de documentar o algoritmo. Sem isso, o processo produz falsos negativos, inconsistência operacional e dificuldades de auditoria.

### Salt nem sempre resolve

Uma reação comum é adicionar salt:

```text
sha256(salt || cpf_normalizado)
```

Em armazenamento de senhas, salt é fundamental porque impede que o mesmo valor gere o mesmo hash em bases diferentes e dificulta tabelas pré-computadas genéricas. Mas, em um processo de comparação entre duas empresas, as duas partes precisam gerar o mesmo resultado para o mesmo CPF.

Se cada empresa usar um salt diferente, os hashes não baterão. Se o salt for compartilhado entre as empresas, ele ajuda contra algumas tabelas pré-computadas externas, mas não impede que uma parte com acesso ao salt enumere CPFs candidatos e calcule seus hashes.

Salt é útil, mas não resolve sozinho o problema de identificadores previsíveis em uma integração de matching.

### HMAC com API como caminho pragmático

Uma alternativa melhor do que hash simples é usar HMAC:

```text
hmac_sha256(chave_secreta, cpf_normalizado)
```

HMAC usa uma chave secreta no cálculo. Sem a chave, um terceiro que obtenha a lista de HMACs não consegue calcular facilmente os valores correspondentes para CPFs candidatos. Isso reduz bastante o risco de ataques offline por terceiros.

Mas há uma questão de desenho. Se a chave for compartilhada com o parceiro para que ele calcule HMACs sobre a própria base, ele também consegue calcular HMACs para CPFs candidatos por conta própria. Isso pode ser aceitável em alguns cenários, desde que a chave seja específica para a campanha, tenha rotação, escopo limitado e controles de auditoria, mas muda o modelo de confiança.

Um caminho pragmático seria combinar HMAC com uma API controlada pela instituição financeira. Nesse desenho, o marketplace prepara a própria base, normaliza os CPFs, calcula os identificadores derivados conforme a especificação da campanha e envia um lote para a API. A instituição financeira compara esses valores contra uma representação equivalente da própria base e devolve apenas o resultado necessário para a campanha. Esse resultado não precisa ser uma nova lista de CPFs. Pode ser uma marcação de elegibilidade associada aos usuários do próprio marketplace.

Um exemplo simples seria:

```text
Marketplace envia:
user_id=10, hmac_cpf=aaa
user_id=20, hmac_cpf=bbb
user_id=30, hmac_cpf=ccc
```

Após a comparação, a API poderia responder:

```text
user_id=10, eligible=true
user_id=20, eligible=false
user_id=30, eligible=true
```

Com isso, o marketplace consegue aplicar a campanha dentro da própria base, mas não recebe a lista completa de CPFs da instituição financeira. O CPF é usado como chave técnica de comparação, mas o resultado operacional é uma marcação de elegibilidade.

Essa abordagem muda o problema para um modelo de consulta controlada. Se a API permite testar CPFs arbitrários, mesmo que com autenticação e HMAC, ela pode virar um oráculo de elegibilidade. Por isso, esse tipo de solução precisa de controles adicionais: aceitar apenas lotes associados à base declarada do parceiro, limitar reprocessamentos, auditar consultas, impor janelas de campanha e definir claramente o que é permitido testar. Em outras palavras, HMAC e API podem formar uma solução prática, mas a garantia passa a depender de governança e controle operacional. Para cenários que exigem uma garantia técnica mais forte sobre o que cada parte aprende, existe uma abordagem mais sofisticada.

### Uma alternativa mais sofisticada: interseção privada de conjuntos

Uma alternativa mais sofisticada para esse tipo de problema é conhecida como interseção privada de conjuntos, ou Private Set Intersection (PSI).

Em termos simples, PSI é uma família de protocolos criptográficos que permite que duas partes comparem conjuntos e descubram uma interseção sem compartilhar os conjuntos em claro. A ideia não é "criptografar uma lista e entregar para o outro lado". A ideia é executar um processo em que cada parte mantém seu conjunto e participa de uma comparação protocolada.

Um exemplo pequeno ajuda a visualizar o objetivo. Suponha que a instituição financeira tenha os CPFs `111`, `222`, `333` e `444`. O parceiro tem os CPFs `222`, `444` e `555`. O resultado necessário para a campanha é saber que `222` e `444` estão nos dois conjuntos. O parceiro não precisa aprender que `111` e `333` existem na base da instituição financeira. A instituição financeira também não precisa aprender que `555` existe na base do parceiro, a menos que o desenho do protocolo ou da campanha exija isso.

Em uma comparação comum usando arquivo, uma das partes recebe uma lista e faz a interseção localmente. Isso é simples, mas obriga essa parte a enxergar valores que não fazem parte do resultado final. Em uma API de consulta, por outro lado, a instituição financeira pode evitar entregar sua base inteira ao marketplace, mas passa a observar o lote que o marketplace está consultando. Isso pode ser aceitável. Mas, se o requisito também for reduzir o que a instituição financeira aprende sobre a base do marketplace, uma API centralizada pode não ser suficiente.

Existem diferentes formas de implementar PSI. Algumas usam criptografia de chave pública, outras usam oblivious transfer, circuitos garbled ou construções baseadas em hashing e chaves efêmeras. O detalhe matemático muda conforme o protocolo, mas o objetivo de segurança permanece: permitir matching entre conjuntos sem transformar uma integração em compartilhamento amplo de base.

Também é importante observar que PSI não define apenas "como comparar". Ele ajuda a definir "quem aprende o quê". Em alguns desenhos, as duas partes aprendem a interseção. Em outros, apenas uma parte aprende quais usuários são elegíveis. Para o caso da promoção, esse segundo modelo faz mais sentido: o marketplace precisa aplicar o benefício dentro da própria base, enquanto a instituição financeira não precisa necessariamente aprender quais clientes também estão no marketplace.

Aplicado ao caso da promoção, o resultado desejado talvez não fosse uma nova lista de CPFs compartilhada entre empresas. Poderia ser apenas uma forma de o parceiro marcar, dentro da própria base, quais usuários são elegíveis. Essa distinção reduz exposição porque mantém o foco no resultado operacional da campanha, não na circulação de identificadores.

PSI, porém, não elimina todos os riscos. Se uma parte puder escolher livremente o conjunto de entrada, ela ainda pode tentar testar identificadores que não pertencem à sua base legítima. Por isso, PSI não substitui contrato, auditoria, controles de escopo e validação do processo. O que ele melhora é outro ponto: reduz a necessidade de uma parte entregar sua base inteira em claro, e pode reduzir também o quanto a outra parte observa durante a comparação.

Na prática, PSI é mais complexo do que uma API com HMAC. Ele exige biblioteca adequada, entendimento do protocolo, cuidado com normalização, tratamento de erros, auditoria, testes de performance e avaliação do que cada parte aprende durante o processo. Nem todo caso exige esse nível de sofisticação. Mas ele deve ser considerado quando o requisito não é apenas evitar que o marketplace receba a base inteira da instituição financeira, mas também reduzir o quanto a instituição financeira aprende sobre o conjunto do marketplace durante o matching.

### Uma hierarquia prática de soluções

Nem toda integração precisa do mesmo nível de proteção. Uma forma pragmática de pensar é organizar as opções por redução de exposição.

Um arquivo com CPFs criptografado em trânsito protege contra interceptação, mas revela a lista completa ao destinatário. É simples, mas fraco em minimização.

Hash simples dos CPFs evita exposição direta casual, mas é vulnerável a enumeração porque CPF é previsível. Não deve ser tratado como anonimização.

HMAC com chave controlada melhora a proteção contra terceiros e vazamentos da lista derivada, mas exige governança forte sobre a chave. Em vez de compartilhar a chave com o parceiro, uma API autenticada usando HMAC pode ser uma alternativa prática quando o objetivo é responder elegibilidade sem entregar a base inteira da instituição financeira, desde que não permita consultas arbitrárias sem controle.

PSI ou um protocolo equivalente é uma opção mais sofisticada quando também há interesse em reduzir o que a instituição financeira aprende sobre o conjunto consultado pelo marketplace, além de evitar a entrega da base inteira ao parceiro.

Essa hierarquia ajuda a explicar por que a resposta inicial de "vamos criptografar o arquivo" era insuficiente. A pergunta não era apenas como transportar dados com segurança. A pergunta era quanto dado precisava ser revelado para atingir o objetivo.

### Conclusão

Uma revisão de segurança para esse tipo de compartilhamento deve começar por perguntas simples. Antes de escolher algoritmo, é necessário entender qual é o objetivo exato da comparação, quem precisa aprender o resultado e qual formato esse resultado precisa ter. O resultado precisa ser uma lista de CPFs, uma lista de usuários elegíveis, um booleano por usuário ou apenas uma contagem agregada?

Também é preciso avaliar quais dados de pessoas fora da interseção seriam expostos pela solução proposta. Essa é uma pergunta central, porque uma solução pode parecer segura por usar criptografia e ainda assim revelar um conjunto muito maior do que o necessário ao destinatário legítimo.

Outro ponto importante é a natureza do identificador usado. Se o identificador é previsível ou tem baixa entropia, hash simples não deve ser tratado como proteção forte. A existência de normalização documentada também precisa ser verificada, porque pequenas diferenças de formato podem quebrar a comparação ou criar exceções difíceis de auditar.

Por fim, a revisão deve cobrir quem controla chaves, salts ou segredos, se o processo é auditável e reexecutável, e se existe retenção limitada dos arquivos intermediários e resultados. Essas perguntas evitam que a discussão fique limitada a "o arquivo está criptografado?". Segurança do transporte importa, mas minimização, finalidade, retenção e modelo de confiança importam tanto quanto.

Criptografia, hash, HMAC, APIs e PSI são ferramentas diferentes para problemas diferentes. A decisão correta depende menos da familiaridade com uma técnica específica e mais do que cada parte precisa aprender durante o processo.

O aprendizado principal desse caso é que "transmitir com segurança" não é o mesmo que "revelar o mínimo necessário". Em integrações entre empresas, especialmente envolvendo identificadores pessoais, a arquitetura deve começar pela minimização: quem precisa saber o quê, por quanto tempo, e com qual garantia técnica?

Às vezes, a melhor solução não é criptografar melhor o arquivo. É evitar que o arquivo exista daquele jeito.

### Referências

1. [Cryptographic hash function - Wikipedia](https://en.wikipedia.org/wiki/Cryptographic_hash_function)
2. [Hash-based message authentication code - Wikipedia](https://en.wikipedia.org/wiki/HMAC)
3. [Private set intersection - Wikipedia](https://en.wikipedia.org/wiki/Private_set_intersection)
4. [NIST SP 800-107 Rev. 1 - Recommendation for Applications Using Approved Hash Algorithms](https://csrc.nist.gov/pubs/sp/800/107/r1/final)
