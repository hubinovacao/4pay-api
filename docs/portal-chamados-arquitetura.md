# Portal de Chamados com Agente de IA — Arquitetura

> Esqueleto de arquitetura de software (rascunho para discussão · v1).
> Portal novo, independente, que orbita o ecossistema **4pay** (repos como `4pay-api`).

## Ideia em uma frase

Um portal onde o time registra o que o cliente pediu — uma reclamação, uma tela
nova, um relatório. Um agente de IA lê o pedido, acessa os repositórios,
implementa a mudança **numa branch nova** e gera um preview. **Nada vai pra
produção sem um humano aprovar.**

## Loop principal

```
Chamado aberto → Triagem & plano → Branch + código → Preview/HTML → Aprovação humana → PR · merge · deploy
   (humano)          (agente)          (agente)          (agente)         (humano)            (portal + CI)
```

---

## 01 · Visão geral em contêineres

Três blocos separados por responsabilidade e por confiança. O agente **nunca**
fala direto com o usuário nem com produção — sempre passa pelo Portal.

```
┌──────────────────────────┐        ┌───────────────────────────────┐
│ PESSOAS                  │        │ Sistemas externos             │
│  • Suporte (abre chamado)│        │  • GitHub (repos/branch/PR/CI)│
│  • Aprovador (produto)   │        │  • Staging (hospeda preview)  │
└────────────┬─────────────┘        │  • Notificações (e-mail/Slack)│
             │                      └───────────────▲───────────────┘
             ▼                                       │
┌──────────────────────────────────────┐            │
│ PORTAL DE CHAMADOS                    │            │
│  • Web App (Inbox/Kanban/Aprovação)   │            │
│  • Portal API / BFF (regras · RBAC)   │            │
│  • Banco (chamados·aprovações·audit)  │            │
│  • Fila de Jobs                       │            │
│  • Object Storage (previews·artefatos)│            │
└────────────┬──────────────────────────┘            │
             │ enfileira job                          │
             ▼                                        │
┌──────────────────────────────────────┐             │
│ ORQUESTRADOR DO AGENTE · sandbox      │─────────────┘
│  • Worker isolado (por job)           │  clona/PR
│  • Runtime IA (Claude) planeja/edita  │
│  • Gerador de Preview (tela/diff)     │
└───────────────────────────────────────┘
```

---

## 02 · Fluxo de um chamado (ponta a ponta)

1. **Suporte** abre o chamado no Portal descrevendo o que o cliente quer.
2. **Portal** enfileira um job com o contexto (pedido, repos, regras).
3. **Orquestrador** entrega o job ao **Agente IA** num ambiente isolado.
4. **Agente** clona o repo, **cria uma branch nova**, planeja e implementa.
5. **Agente** gera o **preview** (HTML da tela / diff de código / testes).
6. Chamado passa para **Aguardando aprovação**; o **Aprovador** é notificado.
7. **Portão humano:**
   - **Aprovado** → Portal libera → abre PR / merge / deploy → chamado concluído.
   - **Reprovado** → comentário volta pro agente, que **refaz na mesma branch**.

O laço de reprovação é primeira classe: reprovar não descarta o trabalho.

---

## 03 · Ciclo de vida do chamado (máquina de estados)

Um estado só muda por um gatilho claro, e cada estado tem um dono. Vira a
máquina de estados no back-end e as colunas do Kanban no front.

| Estado                    | O que acontece                                                        | Dono         |
|---------------------------|-----------------------------------------------------------------------|--------------|
| **Novo**                  | Chamado registrado com o pedido (texto, prints, repositório-alvo).    | suporte      |
| **Triagem**               | Agente lê, classifica (bug/tela/relatório), identifica repos e risco. | agente       |
| **Em análise**            | Agente monta o plano: arquivos a tocar, impacto, dúvidas.             | agente       |
| **Em desenvolvimento**    | Branch nova, código, testes rodados, preview gerado.                  | agente       |
| **Aguardando aprovação**  | Humano vê preview/diff e decide. **Portão obrigatório.**              | aprovador    |
| **Aprovado**              | Liberado: abre PR, merge e/ou deploy conforme política do repo.      | portal + CI  |
| **Concluído**             | Entregue, com trilha completa do que foi feito.                      | —            |

Transições:

```
[*] → Novo → Triagem → Em análise → Em desenvolvimento → Aguardando aprovação
                                            ▲                    │
                                            └─ reprovado ────────┤ (feedback)
                                                                 ▼
                                              Aprovado → Concluído → [*]
```

A única volta é **Aguardando aprovação → Em desenvolvimento**.

---

## 04 · Componentes

**Front / Core**
- **Web App** — Inbox e Kanban, detalhe com histórico, tela de aprovação
  (preview + diff), aprovar/reprovar com comentário.
- **Portal API / BFF** — CRUD + máquina de estados, auth e RBAC (quem abre ×
  quem aprova), dispara/acompanha jobs, recebe webhooks. É o cérebro de regras:
  o agente nunca decide sozinho o que vira produção.

**Agente (execução isolada)**
- **Fila de Jobs** — desacopla o pedido do trabalho pesado; retry, timeout,
  prioridade; segura picos.
- **Orquestrador / Worker** — sandbox por job, clona repo com token de menor
  privilégio, roda o loop planejar → editar → testar.
- **Runtime de IA (Claude)** — lê/edita arquivos, roda testes, cria branch
  (nunca escreve na main), explica o que fez.
- **Gerador de Preview** — renderiza a tela (HTML/staging), diff antes/depois,
  resultado de testes + resumo de impacto.

**Dados & Integrações**
- **Banco** — chamados, estados, comentários, decisões, audit log imutável.
- **Object Storage** — HTML de preview, screenshots, logs, diffs.
- **Integrações** — GitHub (repos/branch/PR/CI), Staging, Notificações.

---

## 05 · O portão humano (diferencial)

- **Preview de tela** — agente publica o HTML/rota nova em staging; o aprovador
  navega na tela de verdade e aprova o que **viu**, não uma descrição.
- **Preview de código** — para regra/relatório, mostra diff, arquivos tocados e
  verde/vermelho dos testes. Decisão informada sem abrir a IDE.
- **Níveis de aprovação** — configurável por risco: mudança simples = 1
  aprovador; algo sensível (pagamentos, credenciais) pode exigir 2 ou barrar
  deploy automático.
- **Reprovar é primeira classe** — o comentário volta pro agente, que refaz na
  mesma branch; o histórico de idas e voltas fica no chamado.

---

## 06 · Guardrails & segurança

Um agente com acesso a repositórios de uma empresa de pagamentos precisa de
trilhos rígidos. Fazem parte da arquitetura, não são opcionais.

- **Branch** — nunca escreve na main; só branch nova, integração via PR.
- **Humano** — sem merge automático; todo caminho pra produção cruza o portão.
- **Sandbox** — isolamento por job, sem acesso lateral a outros clientes/repos.
- **Token** — credencial GitHub de menor privilégio, por repo, com expiração.
- **Segredos** — chaves/credenciais nunca vão pro modelo; só referências.
- **Auditoria** — quem pediu, o que o agente mudou, quem aprovou: imutável.

---

## 07 · Encaixe no ecossistema 4pay

O portal reaproveita a stack já dominada no `4pay-api` (NestJS · TypeORM · JWT),
então não é tecnologia nova pra manter. Mapeamento sugerido (a decidir com o time):

| Camada                | Peça                | Sugestão                 |
|-----------------------|---------------------|--------------------------|
| Portal (front)        | Web App             | React / Next             |
| Portal (core)         | Portal API / BFF    | NestJS                   |
| Portal (core)         | Auth / RBAC         | JWT (padrão 4pay)        |
| Portal (dados)        | Banco               | MySQL / TypeORM          |
| Agente (execução)     | Fila                | Redis / BullMQ           |
| Agente (execução)     | Worker sandbox      | Container efêmero        |
| Agente (execução)     | Runtime IA          | Claude · Agent SDK       |
| Agente (execução)     | Preview             | Staging + Object Storage |
| Integrações           | Código / CI         | GitHub API / Actions     |
| Integrações           | Segredos            | Secrets manager          |
| Integrações           | Avisos              | E-mail / Slack           |

---

## 08 · Roadmap de construção

Do menor pedaço útil ao portal completo. Cada fase entrega valor sozinha e
reduz o risco da seguinte.

1. **Portal de chamados "manual"** — abrir/listar/acompanhar chamados com a
   máquina de estados e o audit log. Sem agente ainda; valida o processo e o
   RBAC com gente de verdade.
2. **Agente em modo leitura** — faz triagem e propõe um plano (sem escrever
   código). Humano valida a qualidade da análise. Constrói confiança antes de
   dar a "caneta".
3. **Agente escreve + portão de aprovação** — branch nova, código, preview e a
   tela de aprovação. Núcleo do produto: o loop completo ponta a ponta.
4. **Integração & escala** — PR/merge pós-aprovação, níveis de aprovação por
   risco, métricas (tempo por chamado, taxa de reprovação) e múltiplos
   repositórios/clientes.
