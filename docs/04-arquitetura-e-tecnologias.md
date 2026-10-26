# Sistema de Agendamento de Consultas em Unidade de Saúde (SUS / Natal-RN)
## Documento 04: Arquitetura do Sistema e Stack Tecnológica

---

### 1. Visão Geral da Arquitetura

O sistema adota uma arquitetura em **API REST Desacoplada com Clean Architecture / Camadas Modulares**, separando as responsabilidades de negócio, persistência e interface de usuário. Esta abordagem garante conformidade estrita com os requisitos de concorrência (**RF05**), proteção de dados (**RNF01 - LGPD**), acessibilidade (**RNF03**) e desempenho em tempo de resposta inferior a 500 ms (**RNF04**).

```
┌───────────────────────────────────────────────────────────────┐
│               CAMADA DE APRESENTAÇÃO (FRONTEND)               │
│      React + Vite + Tailwind CSS + Radix UI / Shadcn UI       │
│  - App Mobile-First Cidadão (PWA)                             │
│  - Painéis da UBS (Recepção / Consultório / Gestão SMS)       │
└──────────────────────────────┬────────────────────────────────┘
                               │ HTTPS / JSON (REST API)
                               ▼
┌───────────────────────────────────────────────────────────────┐
│                 CAMADA DE NEGÓCIO (BACKEND)                   │
│                     NestJS (TypeScript)                       │
│  - Controllers & DTOs (Validação via class-validator)        │
│  - Use Cases & Services (Regras de agendamento e cancelamento)│
│  - Guards & Interceptors (RBAC, JWT, Mascaramento LGPD)       │
│  - Prisma ORM / Camada de Acesso a Dados                      │
└──────────────────────────────┬────────────────────────────────┘
                               │ Transações ACID / Row-level Locks
                               ▼
┌───────────────────────────────────────────────────────────────┐
│               CAMADA DE PERSISTÊNCIA (DADOS)                  │
│                     MySQL 8.0+ (InnoDB)                       │
│  - Lock Pessimista (SELECT ... FOR UPDATE) para concorrência  │
│  - Constraints únicos e índices compostos (< 500ms)           │
│  - Tabela imutável de logs de auditoria                       │
└───────────────────────────────────────────────────────────────┘
```

---

### 2. Resumo da Stack Tecnológica

| Camada | Tecnologia Principal | Papel no Sistema |
| :--- | :--- | :--- |
| **Backend** | **NestJS** (Node.js + TypeScript) | API REST com arquitetura modular, injeção de dependências, controle de acesso RBAC e validação estrita. |
| **Frontend** | **React + Vite** (TypeScript) | Aplicação web responsiva (PWA / Mobile-first para o cidadão e painéis para atendente, médico e gestor). |
| **Banco de Dados** | **MySQL 8.0+** (Engine InnoDB) | Armazenamento relacional com transações ACID, integridade referencial e controle de concorrência por linha. |
| **Infraestrutura Local**| **Docker & Docker Compose** | Orquestração do banco de dados MySQL de forma padronizada e reprodutível no ambiente de desenvolvimento. |

---

### 3. Detalhamento Técnico das Camadas

#### 3.1. Backend: NestJS (TypeScript)
* **Arquitetura Modular em Camadas:**
  * **Controllers:** Exposição dos endpoints REST e documentação automática Swagger/OpenAPI (`@nestjs/swagger`).
  * **Services / Use Cases:** Regras de negócio (ex.: cálculo de elegibilidade, verificação de antecedência mínima de 24h para cancelamento, bloqueio de conflitos).
  * **DTOs e Validação:** `class-validator` e `class-transformer` para validação e sanitização estrita de CPF, Cartão SUS e datas.
* **ORM e Persistência:**
  * **Prisma ORM** (ou TypeORM) integrado ao MySQL, permitindo tipagem estrita de entidades e queries.
* **Segurança e RBAC (RNF02):**
  * Autenticação via **JWT (JSON Web Token)** (`@nestjs/jwt`, `passport-jwt`).
  * Controle de acesso baseado em perfis via Guards dedicados: `@Roles('CIDADAO', 'ATENDENTE', 'MEDICO', 'GESTOR')`.
* **Conformidade LGPD (RNF01):**
  * **Interceptors globais** para mascaramento de identificadores pessoais nas respostas da API (ex.: `CPF: ***.123.456-**`).
  * **Módulo de Auditoria (`AuditModule`):** Registro de data, hora, IP e responsável por toda criação, alteração ou cancelamento de agendamentos.

#### 3.2. Frontend: React + Vite (TypeScript)
* **Build e Performance:**
  * **Vite** para inicialização instantânea, Hot Module Replacement (HMR) e bundles altamente otimizados.
  * **TypeScript** para compartilhamento de tipagens e contratos de dados sincronizados com o backend.
* **Design System e Acessibilidade (RNF03 - WCAG / e-MAG):**
  * **Tailwind CSS:** Interface responsiva desenhada sob o conceito *Mobile-First*.
  * **Radix UI / Shadcn UI:** Componentes acessíveis com suporte a navegação por teclado, contraste adequado e compatibilidade com leitores de tela.
  * **Lucide React:** Conjunto moderno de ícones vetoriais leves.
* **Roteamento e Controle de Telas:**
  * **React Router DOM** com rotas protegidas por papel (*Role-based routing*), direcionando cada perfil para seu fluxo correspondente.
* **Gerenciamento de Estado e Sincronização:**
  * **TanStack Query (React Query) + Axios:** Cache em memória, revalidação automática e consultas rápidas com tempo inferior a 500 ms.
* **Recursos de Saúde e Triagem:**
  * **Geração de QR Code (`qrcode.react`):** Exibição do QR Code e código alfanumérico no Comprovante de Agendamento do Cidadão (**RF06**).
  * **Leitor de QR Code (`html5-qrcode`):** Uso da câmera de computadores ou tablets da UBS para check-in ágil na recepção/triagem (**US05.2**).
  * **Formulários e Máscaras:** `react-hook-form` com máscaras de entrada para CPF, Cartão Nacional de Saúde (CNS) e telefone celular.

#### 3.3. Banco de Dados: MySQL (v8.0+ / InnoDB)
* **Engine InnoDB Obrigatória:** Garante suporte a chaves estrangeiras, integridade referencial e transações ACID completas.
* **Resolução de Concorrência Crítica (RF05):**
  * Uso de transações com **Lock Pessimista (`SELECT ... FOR UPDATE`)** durante a confirmação de agendamento. Esse mecanismo bloqueia a linha da vaga específica durante o processamento da transação, impedindo que dois cidadãos reservem simultaneamente o mesmo horário.
  * **Constraint Único Composto:** Impede que o mesmo paciente possua dois agendamentos no mesmo turno/data na rede municipal.
* **Garantia de Desempenho < 500 ms (RNF04):**
  * Índices compostos de alta eficiência:
    * `idx_vagas_busca(ubs_id, data, especialidade_id, status)`
    * `idx_consultas_paciente(paciente_id, data)`
    * `idx_protocolo(codigo_protocolo)`
* **Tabela de Auditoria (`logs_auditoria`):** Tabela append-only com trilha histórica para conformidade com a LGPD e fiscalização da SMS.

---

### 4. Estrutura de Pastas Sugerida para o Repositório

```text
Gestao_SUS/
├── docs/                         # Documentação técnica e de requisitos
│   ├── 01-requisitos-e-telas.md
│   ├── 02-epicos-e-historias-de-usuario.md
│   ├── 03-atores-e-matriz-de-permissoes.md
│   └── 04-arquitetura-e-tecnologias.md
├── docker-compose.yml            # Orquestração do MySQL 8 e ferramentas de apoio
├── backend/                      # API REST NestJS
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/             # Login, JWT, papéis e termos LGPD
│   │   │   ├── usuarios/         # Gestão de usuários e pacientes
│   │   │   ├── ubs/              # Catálogo de UBSs, distritos e especialidades
│   │   │   ├── vagas/            # Abertura e controle de horários
│   │   │   ├── agendamentos/     # Reserva com lock, cancelamento e check-in
│   │   │   └── auditoria/        # Trilha de logs LGPD
│   │   ├── common/               # Guards, interceptors de mascaramento e filtros
│   │   └── prisma/ (ou orm)      # Schemas, migrations e seeds
└── frontend/                     # Aplicação Web React + Vite
    ├── src/
    │   ├── components/           # Componentes UI acessíveis (botões, modais, cards)
    │   ├── pages/
    │   │   ├── cidadao/          # Telas 1 a 8 do fluxo do paciente
    │   │   ├── atendente/        # Recepção da UBS, leitor QR Code, check-in
    │   │   ├── medico/           # Fila do consultório e atendimento
    │   │   └── gestor/           # Painéis da Secretaria de Saúde
    │   ├── hooks/                # Hooks customizados e queries do TanStack Query
    │   └── services/             # Clientes HTTP (Axios) para comunicação com a API
```
