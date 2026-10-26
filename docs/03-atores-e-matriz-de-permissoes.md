# Sistema de Agendamento de Consultas em Unidade de Saúde (SUS / Natal-RN)
## Documento 03: Perfis de Acesso, Atores e Matriz de Permissões (RBAC)

---

### 1. Visão Geral
Este documento define o modelo de controle de acesso baseado em papéis (*Role-Based Access Control* - RBAC) do sistema. O objetivo é assegurar o princípio do privilégio mínimo e a proteção de dados de saúde preconizada pela LGPD.

---

### 2. Detalhamento Individual dos Atores

#### 👤 2.1. Cidadão / Paciente
* **Definição:** Morador de Natal com Cartão SUS que utiliza a plataforma para autoatendimento.
* **Telas que acessa:**
  * Login / Criação de Conta
  * Painel do Cidadão (Dashboard)
  * Fluxo de Agendamento (Especialidade $\rightarrow$ UBS $\rightarrow$ Data/Horário $\rightarrow$ Confirmação)
  * Tela de Comprovante Digital (com QR Code)
  * Minhas Consultas e Histórico
  * Perfil / Meus Dados Pessoais
* **O que PODE fazer:**
  * Criar e atualizar seus próprios dados de contato (telefone, endereço).
  * Consultar vagas disponíveis em UBSs de Natal.
  * Agendar consultas para si mesmo.
  * Emitir, salvar ou imprimir seus próprios comprovantes.
  * Cancelar suas próprias consultas ativas.
  * Visualizar seu histórico completo de atendimentos anteriores.
* **O que NÃO PODE fazer:**
  * ❌ Visualizar dados, agendamentos ou informações de outros pacientes (LGPD).
  * ❌ Agendar consultas em horários indisponíveis.
  * ❌ Criar duas consultas no mesmo turno para a mesma pessoa.
  * ❌ Alterar status de consulta (ex.: marcar como "Atendido").

---

#### 🏥 2.2. Atendente / Recepcionista da UBS
* **Definição:** Funcionário público da recepção e acolhimento da unidade básica de saúde.
* **Telas que acessa:**
  * Painel da Recepção da UBS (Agenda do dia da unidade)
  * Validador de Comprovantes (Leitor de QR Code ou busca por CPF)
  * Fila de Espera / Triagem da UBS
  * Agendamento Assistido (Balcão presencial)
* **O que PODE fazer:**
  * Localizar o agendamento de um paciente por CPF ou QR Code.
  * Efetuar o **Check-in** (confirmar presença física na unidade).
  * Registrar **Falta / Não Comparecimento** após encerramento do horário.
  * Realizar agendamento no sistema para pacientes sem acesso a smartphone/internet.
* **O que NÃO PODE fazer:**
  * ❌ Acessar prontuários ou diagnósticos médicos do paciente.
  * ❌ Modificar parâmetros gerais do sistema ou escalas de outros distritos.
  * ❌ Excluir histórico ou logs de registros.

---

#### 🩺 2.3. Profissional de Saúde (Médico, Dentista, Enfermeiro)
* **Definição:** Responsável técnico pelo atendimento clínico na UBS.
* **Telas que acessa:**
  * Painel da Agenda do Consultório (Fila de pacientes do dia/turno)
  * Detalhes Básicos da Consulta (Identificação e horário agendado)
* **O que PODE fazer:**
  * Consultar a lista ordenada de pacientes do seu turno de trabalho.
  * Atualizar o status do paciente para: **"Em Atendimento"** e **"Finalizado"**.
  * Registrar justificativa de indisponibilidade para remanejamento de agenda com a gestão.
* **O que NÃO PODE fazer:**
  * ❌ Gerenciar infraestrutura ou configurações da UBS.
  * ❌ Cancelar vagas públicas sem aviso e autorização prévia da coordenação.
  * ❌ Consultar histórico de pacientes que não estão na sua agenda do dia.

---

#### 🏛️ 2.4. Gestor da Unidade / Administrador (Secretaria Municipal de Saúde)
* **Definição:** Responsável pelo gerenciamento operacional, infraestrutura e governança do sistema.
* **Telas que acessa:**
  * Painel Geral e Dashboards de Indicadores (absenteísmo, demanda por distrito)
  * Gestão de UBSs e Especialidades
  * Gestão de Escalas e Abertura de Vagas
  * Auditoria do Sistema (Trilha de Logs)
* **O que PODE fazer:**
  * Cadastrar e editar Unidades Básicas de Saúde (endereço, distrito, especialidades).
  * Criar e abrir blocos de vagas e horários na agenda pública.
  * Bloquear datas no calendário (feriados, reformas, manutenções).
  * Gerenciar contas de usuários internos (recepcionistas e profissionais).
  * Emitir relatórios estatísticos da rede de saúde municipal.
* **O que NÃO PODE fazer:**
  * ❌ Consultar dados sensíveis de pacientes para finalidades alheias à administração.
  * ❌ Apagar logs ou registros de auditoria do sistema.

---

### 3. Matriz Consolidada de Permissões (RBAC)

| Funcionalidade / Operação | Cidadão | Atendente UBS | Profissional de Saúde | Gestor / Admin |
| :--- | :---: | :---: | :---: | :---: |
| **Auto-cadastro no sistema** | ✅ (próprio) | ❌ | ❌ | ❌ |
| **Pesquisar horários disponíveis** | ✅ | ✅ | ❌ | ✅ |
| **Agendar consulta** | ✅ (próprio) | ✅ (assistido) | ❌ | ❌ |
| **Emitir comprovante / QR Code** | ✅ | ✅ | ❌ | ❌ |
| **Cancelar consulta** | ✅ (próprio) | ✅ (a pedido) | ❌ | ✅ (excepcional) |
| **Realizar Check-in (Chegada)** | ❌ | ✅ | ❌ | ❌ |
| **Marcar Falta / Ausência** | ❌ | ✅ | ❌ | ❌ |
| **Finalizar Consulta Clínica** | ❌ | ❌ | ✅ | ❌ |
| **Abrir vagas na agenda** | ❌ | ❌ | ❌ | ✅ |
| **Cadastrar UBSs e Especialidades** | ❌ | ❌ | ❌ | ✅ |
| **Visualizar relatórios municipais** | ❌ | ❌ | ❌ | ✅ |
| **Auditar logs de segurança (LGPD)** | ❌ | ❌ | ❌ | ✅ |
