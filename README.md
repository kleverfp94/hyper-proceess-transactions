# Hyper Process Transactions

Sistema de processamento de transações financeiras com suporte a múltiplos tenants, processamento assíncrono via filas e emissão de eventos.

---

## Projetos

### Backend (`/backend`)

API REST construída com **NestJS** responsável por receber, enfileirar e processar transações financeiras.

**Stack:**
- NestJS + TypeScript
- MySQL + Sequelize ORM
- Redis + BullMQ (fila de processamento)
- Kafka (emissão de eventos)

**Principais recursos:**
- Criação de transações com idempotência em três camadas (jobId na fila, constraint único no banco, `findOrCreate`)
- Processamento assíncrono com 3 tentativas e backoff exponencial
- Listagem e consulta de transações por tenant, status e tipo
- Suporte multi-tenant via `tenantId`

**Endpoints:**

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/transactions` | Cria e enfileira uma transação |
| `GET` | `/transactions` | Lista transações (filtro por tenant, status, tipo) |
| `GET` | `/transactions/:id` | Retorna uma transação pelo ID |

---

### Frontend (`/frontend`)

Interface web construída com **React + Vite** para visualização e criação de transações.

**Stack:**
- React 18 + TypeScript
- React Router DOM v6
- Axios
- CSS Modules

**Páginas:**
- `/` — Listagem de transações com filtros por status e tipo
- `/nova` — Formulário de criação de transação
- `/transacoes/:id` — Detalhe de uma transação

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│                         porta: 5173                          │
│                                                              │
│   TransactionsList ──── CreateTransaction ── TransactionDetail│
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP (Axios → /api proxy)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (NestJS)                         │
│                         porta: 3000                          │
│                                                              │
│  POST /transactions                                          │
│        │                                                     │
│        ▼                                                     │
│  TransactionsController                                      │
│        │  enqueue (jobId: tenantId_externalId)               │
│        ▼                                                     │
│  ┌─────────────┐     ┌──────────────────────────────────┐   │
│  │  BullMQ     │────▶│  TransactionsProcessor (worker)  │   │
│  │  Queue      │     │                                  │   │
│  └─────────────┘     │  findOrCreate → MySQL            │   │
│        │             │                                  │   │
│        │             │  success → transaction.processed │   │
│        │             │  failure → transaction.failed    │   │
│        │             └──────────────┬───────────────────┘   │
│        │                            │                        │
└────────┼────────────────────────────┼────────────────────────┘
         │                            │
         ▼                            ▼
  ┌─────────────┐             ┌──────────────┐
  │    Redis    │             │    Kafka     │
  │  (fila BullMQ)           │  (eventos)   │
  └─────────────┘             └──────────────┘
                                      │
                              ┌───────┴────────┐
                              │                │
                    transaction.processed  transaction.failed
```

### Fluxo de processamento

```
Cliente HTTP
    │
    │ POST /transactions { externalId, tenantId, amount, type }
    ▼
TransactionsController
    │
    │ queue.add(jobId = tenantId_externalId)  ← idempotência na fila
    ▼
Redis (BullMQ Queue)
    │
    │ worker consome o job (3 tentativas, backoff exponencial)
    ▼
TransactionsProcessor
    │
    │ repository.findOrCreate()  ← idempotência no banco
    ▼
MySQL (tabela transactions)
    │
    ├── sucesso → emite evento "transaction.processed" no Kafka
    └── falha   → emite evento "transaction.failed" no Kafka
```

---

## Configuração

### Backend (`backend/.env`)

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=hyper_transactions
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=hyper-transactions
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:3000
```

---

## Como rodar

### Backend

```bash
cd backend
npm install
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Status das transações

| Status | Descrição |
|--------|-----------|
| `PENDING` | Aguardando processamento na fila |
| `PROCESSED` | Processada com sucesso |
| `FAILED` | Falhou após todas as tentativas |

---

## Decisões de arquitetura

### Por que essa organização?

No backend, a separação em camadas (controller → service → repository + processor separado) permite que o worker da fila e o servidor HTTP escalem de forma independente. A fila desacopla o ato de *receber* a transação do ato de *processá-la*: um pico de requisições não pressiona o banco diretamente.

A idempotência é garantida em três camadas:
1. `jobId` único na fila BullMQ (`tenantId_externalId`) — rejeita duplicata antes de processar
2. `findOrCreate` no repositório — garante atomicidade na escrita
3. Constraint único no banco `(tenantId, externalId)` — última barreira

### Onde colocaria cache?

| Situação | Cache? | Motivo |
|----------|--------|--------|
| `GET /transactions/:id` com status `PROCESSED` ou `FAILED` | ✅ Sim (TTL longo) | Dado imutável após estado final |
| `GET /transactions` (listagem por tenant) | ✅ Sim (TTL ~5s) | Reduz leitura repetida no banco |
| `POST /transactions` | ❌ Não | Operação de escrita, precisa de idempotência real |
| Transações com status `PENDING` | ❌ Não | Estado muda a qualquer momento |
| Qualquer dado usado em auditoria financeira | ❌ Não | Requer consistência forte |

### Como garantiria observabilidade em produção?

O projeto já emite logs estruturados com campos como `jobId`, `status` e `error`. Em produção, a evolução seria:

- **Logs**: formato JSON com `traceId`/`correlationId` propagado do HTTP até o Kafka, permitindo rastrear uma transação de ponta a ponta
- **Métricas de fila**: tamanho da fila BullMQ, jobs ativos, falhos e tempo médio de processamento
- **Kafka consumer lag**: aumento do lag indica que o worker não está acompanhando o volume
- **Banco**: slow query log e monitoramento de locks no MySQL
- **Alertas críticos**: fila crescendo sem consumo (worker caiu), taxa de falha acima do threshold, latência da API acima do SLA

### Quando usar fila vs. chamada síncrona?

**Usar fila (BullMQ)** quando:
- O processamento pode falhar e precisa de retry controlado
- A operação é lenta demais para resposta HTTP síncrona
- O cliente não precisa do resultado imediato

**Usar mensageria (Kafka)** quando:
- Múltiplos sistemas precisam reagir ao mesmo evento (fan-out sem acoplamento)
- Ex: serviço de notificação, contabilidade, antifraude consumindo `transaction.processed`

---

## Produção

### Onde está o gargalo

O gargalo está no **MySQL sob contenção de locks**. O `findOrCreate` executa um SELECT seguido de um INSERT em duas etapas separadas. Em alta concorrência, múltiplos workers tentam inserir o mesmo registro simultaneamente, gerando deadlocks ou espera por lock no constraint único `(tenantId, externalId)`. Quanto mais workers paralelos, maior a contenção.

**Possíveis soluções: uso do DynamoDB ou Cassandra**

Para volumes muito altos — milhões de transações por dia com múltiplos tenants crescendo simultaneamente — o MySQL começa a mostrar limites: escala vertical tem teto, sharding manual é complexo e o modelo de locks por linha ainda gera contenção sob escrita massiva.

| Banco | Quando faz sentido | Trade-off |
|-------|-------------------|-----------|
| **Cassandra / ScyllaDB** | Volume massivo de escritas com alta disponibilidade e distribuição geográfica | Sem transações ACID, sem joins — modelagem orientada a padrões de acesso |
| **DynamoDB** | Serverless, escala automática, idempotência nativa via condition expressions | Vendor lock-in AWS, custo imprevisível em leitura intensa |

Ambos são projetados para escala horizontal nativa, com escritas distribuídas entre nós sem ponto único de contenção. O trade-off é real — sem ACID completo, sem joins — mas para um sistema de ingestão de transações em escala, esse trade-off é aceitável e esperado.

### Qual seria o primeiro problema real em produção

O primeiro problema real seria a **saturação do MySQL sob alto volume de escritas**. Por ser um banco relacional com escala vertical, o MySQL tem um teto físico: mais transações simultâneas significam mais contenção de locks, mais tempo de espera por conexão e degradação progressiva do throughput. Em um cenário com múltiplos tenants crescendo ao mesmo tempo, o banco se torna o gargalo central — sem possibilidade de distribuir a carga horizontalmente sem sharding manual, que traz complexidade operacional elevada.

### Qual solução priorizaria primeiro e por quê

**Réplica de leitura no MySQL**

Com o `GET /transactions` paginado mas ainda sob carga de leitura, apontar as queries de listagem para uma réplica libera o primário exclusivamente para escritas. Isso reduz a pressão no banco principal e melhora a latência das leituras de forma independente do volume de processamento da fila.
