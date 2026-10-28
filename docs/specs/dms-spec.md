# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem documentos por uma aplicação web, mantendo os arquivos no filesystem local e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de um documento por requisição.
- Listagem dos documentos do usuário atual.
- Download por identificador, somente para o proprietário.
- Interface de upload, listagem e download com estados de carregamento e erro.
- Arquivos locais em `backend/storage`, usando Multer com `diskStorage`.
- Metadados mantidos em memória durante a execução do backend.

### Fora do escopo

- Autenticação, cadastro de usuários e recuperação de senha.
- Armazenamento em nuvem ou em serviços externos.
- Banco de dados ou persistência dos metadados após reiniciar o backend.
- Versionamento, edição, compartilhamento, exclusão, busca avançada ou paginação.

### Premissas

- O usuário atual é identificado temporariamente pelo cabeçalho `X-User-Id`. Isso separa documentos funcionalmente, mas não representa autenticação segura.
- O frontend usa o prefixo `/api`; o proxy Vite remove esse prefixo antes de encaminhar as chamadas ao backend.
- As rotas do backend são `/upload`, `/documents` e `/documents/:id/download`.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | Aceitar um arquivo no campo `file` de uma requisição `multipart/form-data`. |
| RF-02 | Rejeitar usuário ausente/inválido, arquivo ausente e arquivo acima do limite configurado. |
| RF-03 | Gravar o arquivo localmente com nome interno UUID que não derive do nome fornecido pelo cliente. |
| RF-04 | Registrar em memória os metadados do documento e seu proprietário. |
| RF-05 | Listar somente documentos do usuário indicado, do mais recente para o mais antigo. |
| RF-06 | Permitir download somente quando o documento pertencer ao usuário indicado. |
| RF-07 | Retornar status HTTP apropriado e erro estruturado para falhas esperadas. |
| RF-08 | Permitir selecionar/enviar arquivo, atualizar a lista e apresentar sucesso ou erro. |
| RF-09 | Exibir nome, tamanho e data dos documentos e oferecer seu download. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Manter arquivos no armazenamento local via Multer com `diskStorage`; não usar provedores externos. |
| RNF-02 | Manter metadados em memória; reiniciar o backend pode apagá-los. |
| RNF-03 | Configurar porta, diretório local e limite de upload por ambiente. |
| RNF-04 | Usar Node.js, Express, CommonJS e `node:test` no backend. |
| RNF-05 | Usar React, Vite, componentes funcionais e `fetch`, sem TypeScript nesta fase. |
| RNF-06 | Tratar o nome enviado pelo usuário como dado não confiável; nunca compor caminhos com ele. |
| RNF-07 | Não expor nome interno ou caminho físico pela API. |
| RNF-08 | Tratar falhas HTTP e operações de arquivo nos limites do sistema. |

## 5. Modelo de dados

### Documento

| Campo | Tipo | Exposição | Descrição |
| --- | --- | --- | --- |
| `id` | string | Público | Identificador único gerado pelo backend. |
| `originalName` | string | Público | Nome original fornecido no upload. |
| `size` | number | Público | Tamanho em bytes. |
| `uploadedAt` | string | Público | Data e hora do upload em ISO 8601 UTC. |
| `owner` | string | Público | Identificador do usuário proprietário. |
| `storageName` | string | Interno | Nome UUID usado para localizar o arquivo local. |

Os registros são mantidos em uma coleção em memória indexada por `id`. A resposta pública não inclui `storageName` nem caminho físico.

## 6. Contratos de API

### Convenções

- Os caminhos abaixo são do backend; o frontend usa o prefixo `/api`.
- Upload, listagem e download exigem `X-User-Id` não vazio, com até 128 caracteres.
- Erros usam `{"error":{"code":"ERROR_CODE","message":"Descrição."}}`.
- `X-User-Id` não substitui autenticação e não deve ser considerado seguro em produção.

### `POST /upload`

- Entrada: `multipart/form-data`, um arquivo no campo `file`.
- Sucesso: `201 Created`, corpo com `id`, `originalName`, `size`, `uploadedAt` e `owner`.
- Erros: `400` para usuário ou arquivo ausente/inválido; `413` para limite excedido; `500` para falha interna.
- Limite padrão: 10 MiB, configurável com `MAX_FILE_SIZE_BYTES`.

### `GET /documents`

- Sucesso: `200 OK`, corpo `{"documents":[...]}` com metadados públicos do proprietário, em ordem decrescente de data.
- Lista vazia: `200 OK` com `{"documents":[]}`.
- Erros: `400` para usuário ausente/inválido; `500` para falha interna.

### `GET /documents/:id/download`

- Sucesso: `200 OK`, conteúdo binário, `Content-Disposition: attachment` e nome original como nome sugerido.
- Erros: `400` para usuário inválido; `404` para documento inexistente, metadados indisponíveis ou documento de outro usuário; `500` para falha interna.
- O backend não revela se um identificador existente pertence a outro usuário.

## 7. Decisões arquiteturais

- Fluxo de dependência do backend: `routes -> controllers -> services -> repositories`.
- `routes` registram endpoints e configuram Multer com `diskStorage`.
- `controllers` validam a entrada HTTP e definem status e respostas.
- `services` aplicam regras de upload e propriedade.
- `repositories` encapsulam metadados em memória e localização de arquivos locais.
- O nome físico é um UUID; o nome original é metadado e nome sugerido no download.
- O frontend organiza a interação em páginas, componentes e serviços; o serviço centraliza chamadas `fetch`.
- Configurações: `PORT` (padrão `3000`), `STORAGE_DIR` (padrão `backend/storage`) e `MAX_FILE_SIZE_BYTES` (padrão `10485760`).

## 8. Plano de execução

1. **Consolidar requisitos e contratos:** validar usuário temporário, respostas, erros e limite. Critério: contratos definidos sem decisões essenciais pendentes.
2. **Implementar backend em camadas:** rotas, controllers, services, repositories, Multer local e testes. Critério: upload, listagem por proprietário, download autorizado e erros cobertos.
3. **Implementar frontend:** upload, listagem, download e estados de carregamento/erro via `/api`. Critério: fluxo principal utilizável pela interface.
4. **Validar integração:** executar testes backend e validar o fluxo web. Critério: testes passam, arquivos ficam locais e limitações dos metadados estão claras.

## 9. Riscos e limitações

- Reiniciar o backend remove os metadados em memória; arquivos podem permanecer no disco, mas deixam de estar acessíveis pela API.
- `X-User-Id` não autentica o solicitante; o isolamento é funcional, não uma proteção de produção.
- O limite por arquivo não limita o espaço total consumido pelo diretório.
- Esta fase não restringe tipos de arquivo.