---
description: "Executa os testes relevantes do DMS e resume resultados, falhas e limitações sem alterar código."
name: "Validar testes"
argument-hint: "Pacote, fluxo ou arquivos a validar"
agent: "agent"
---

Valide os testes para este escopo: `${input:escopo:pacote, fluxo ou arquivos alterados}`.

Siga estas etapas:

1. Leia as instruções aplicáveis do repositório, os scripts `package.json` e os testes existentes relacionados ao escopo. Se o escopo não for informado, use os arquivos alterados e o contexto atual para identificá-lo.
2. Escolha a verificação executável mais específica disponível. Prefira testes existentes que cubram o comportamento alterado; não invente scripts ou comandos.
3. Neste repositório, use `npm --prefix backend test` para a suíte backend quando aplicável. Para mudanças frontend, verifique se existe um script de testes antes de afirmar que testes foram executados. `npm --prefix frontend run build` valida a compilação, não substitui testes.
4. Execute os comandos escolhidos e examine o resultado completo. Se houver falha, informe o teste, o motivo visível e se parece relacionado ao escopo; não corrija a implementação nem os testes nesta tarefa.
5. Não crie ou edite arquivos, não instale dependências e não execute comandos destrutivos.

Responda em português, de forma concisa, indicando:

- Escopo verificado.
- Comandos executados e resultado de cada um.
- Falhas relevantes ou limitações de cobertura. Diferencie explicitamente testes de build/lint e informe quando não houver suíte configurada para o escopo.