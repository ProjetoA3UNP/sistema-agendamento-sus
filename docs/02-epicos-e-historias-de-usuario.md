# Sistema de Agendamento de Consultas em Unidade de Saúde (SUS / Natal-RN)
## Documento 02: Épicos e Histórias de Usuário (Backlog Ágil)

---

### 1. Visão Geral dos Épicos
Os épicos agrupam as entregas do sistema em módulos de alto valor funcional para cidadãos, operadores e gestores do SUS no município de Natal-RN.

```
┌──────────────────────────────────────────────────────────────────┐
│                           ÉPICOS PRINCIPAIS                      │
├───────────────────┬───────────────────┬──────────────────────────┤
│ Épico 01: Acesso, │ Épico 02: Catálogo│ Épico 03: Agendamento    │
│ Identidade & LGPD │ & Gestão de UBSs  │ Inteligente & Vagas      │
├───────────────────┼───────────────────┼──────────────────────────┤
│ Épico 04: Histó-  │ Épico 05: Compro- │ Épico 06: Transversal:   │
│ rico & Cancelados │ vação & Triagem   │ Segurança & Performance  │
└───────────────────┴───────────────────┴──────────────────────────┘
```

---

### 2. Detalhamento dos Épicos e Histórias de Usuário

#### **Épico 01: Gestão de Acesso, Identificação do Cidadão e LGPD**
* **Objetivo:** Permitir a criação de contas, autenticação e consentimento de dados para cidadãos e funcionários.
* **Histórias de Usuário:**
  * **US01.1:** *Como cidadão*, quero me cadastrar com meu CPF e Cartão SUS para ter acesso à rede municipal de saúde.
  * **US01.2:** *Como cidadão*, quero aceitar expressamente o Termo de Privacidade para assegurar o cumprimento da LGPD sobre meus dados de saúde.
  * **US01.3:** *Como cidadão*, quero recuperar minha senha por código SMS ou e-mail caso me esqueça dela.
  * **US01.4:** *Como operador (atendente/gestor)*, quero fazer login com credenciais institucionais protegidas.

---

#### **Épico 02: Gestão Territorial e Catálogo de UBSs**
* **Objetivo:** Manter a rede de atendimento organizada por distritos sanitários da capital (Norte, Sul, Leste e Oeste).
* **Histórias de Usuário:**
  * **US02.1:** *Como gestor municipal*, quero cadastrar novas UBSs com endereço, bairro e distrito sanitário correspondente.
  * **US02.2:** *Como gestor da UBS*, quero cadastrar e atualizar as especialidades médicas ofertadas na minha unidade.
  * **US02.3:** *Como cidadão*, quero visualizar automaticamente a UBS de referência mais próxima ao meu endereço residencial cadastrado.

---

#### **Épico 03: Agendamento Inteligente e Gestão de Vagas**
* **Objetivo:** Disponibilizar grade de horários e permitir reservas online sem ocorrência de conflitos.
* **Histórias de Usuário:**
  * **US03.1:** *Como gestor da UBS*, quero abrir e configurar blocos de horários mensais para consultas por profissional.
  * **US03.2:** *Como cidadão*, quero filtrar por especialidade, UBS e data para encontrar horários vagos.
  * **US03.3:** *Como sistema*, devo bloquear instantaneamente horários já preenchidos para evitar duplicidade de marcação da mesma vaga.
  * **US03.4:** *Como sistema*, devo impedir que o mesmo paciente possua dois agendamentos no mesmo horário/turno.
  * **US03.5:** *Como cidadão*, quero visualizar um resumo claro com todos os dados da consulta antes de confirmar.

---

#### **Épico 04: Acompanhamento, Histórico e Cancelamento de Consultas**
* **Objetivo:** Gerenciar o ciclo de vida das consultas marcadas e liberar vagas ociosas para a população.
* **Histórias de Usuário:**
  * **US04.1:** *Como cidadão*, quero acessar a lista de consultas futuras para acompanhar meus agendamentos.
  * **US04.2:** *Como cidadão*, quero cancelar uma consulta com antecedência mínima de 24 horas caso não possa comparecer.
  * **US04.3:** *Como sistema*, devo disponibilizar automaticamente na agenda aberta qualquer vaga cancelada por um paciente.
  * **US04.4:** *Como cidadão*, quero consultar meu histórico de atendimentos realizados e cancelados.

---

#### **Épico 05: Comprovação e Apoio à Triagem na UBS**
* **Objetivo:** Emitir o comprovante e validar a chegada presencial do paciente na unidade de atendimento.
* **Histórias de Usuário:**
  * **US05.1:** *Como cidadão*, quero gerar um comprovante de agendamento em formato digital com código de protocolo e QR Code.
  * **US05.2:** *Como atendente da UBS*, quero escanear o QR Code ou digitar o CPF do paciente para registrar seu check-in na triagem.
  * **US05.3:** *Como atendente da UBS*, quero registrar falta (não comparecimento) quando o paciente não se apresentar no horário marcado.

---

#### **Épico 06 (Transversal): Segurança, Governança e Performance**
* **Objetivo:** Garantir a qualidade técnica e os requisitos não funcionais essenciais do sistema.
* **Critérios:**
  * Mascaramento de identificadores pessoais nas telas de consulta.
  * Auditoria com registro de data, hora e responsável por toda criação, alteração ou cancelamento de vaga.
  * Tempo de processamento e resposta da busca de vagas inferior a 500ms.

---

### 3. Matriz de Rastreabilidade (Épicos $\rightarrow$ Histórias $\rightarrow$ Requisitos)

| Épico | Histórias de Usuário | Requisito Funcional Atendido |
| :--- | :--- | :--- |
| **Épico 01** | US01.1, US01.2, US01.3, US01.4 | **RF01** (Cadastro/Autenticação) |
| **Épico 02** | US02.1, US02.2, US02.3 | **RF02** (Gestão de UBSs) |
| **Épico 03** | US03.1, US03.2, US03.3, US03.4, US03.5 | **RF03, RF04, RF05** (Vagas, Agendamento e Bloqueio) |
| **Épico 04** | US04.1, US04.2, US04.3, US04.4 | **RF07, RF08** (Cancelamento e Histórico) |
| **Épico 05** | US05.1, US05.2, US05.3 | **RF06** (Comprovante e Triagem) |
| **Épico 06** | Critérios transversais de segurança/tempo | **RNF01, RNF02, RNF03, RNF04** |
