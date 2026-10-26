# Sistema de Agendamento de Consultas em Unidade de Saúde (SUS / Natal-RN)
## Documento 01: Requisitos do Sistema e Mapeamento de Telas

---

### 1. Visão Geral e Escopo
O sistema visa digitalizar e otimizar o processo de agendamento de consultas na rede básica de saúde do município de Natal-RN, diminuindo filas físicas nas Unidades Básicas de Saúde (UBS), evitando conflitos de horários e assegurando total conformidade com a LGPD no tratamento de dados de saúde.

---

### 2. Requisitos Funcionais (RF)

| Identificador | Nome do Requisito | Descrição e Critérios de Aceite |
| :--- | :--- | :--- |
| **RF01** | **Cadastro e Autenticação do Cidadão** | O sistema deve permitir o cadastro de pacientes com validação de **CPF**, número do **Cartão Nacional de Saúde (CNS/SUS)**, data de nascimento e endereço vinculado a um bairro de Natal-RN. |
| **RF02** | **Gestão de Unidades Básicas de Saúde (UBS)** | O sistema deve manter o catálogo atualizado de UBSs categorizadas por distritos sanitários (Norte, Sul, Leste, Oeste), especialidades disponíveis e horários de funcionamento. |
| **RF03** | **Disponibilização de Vagas e Agendas** | O sistema deve permitir a abertura de vagas de consultas médicas por turno, especialidade e UBS. |
| **RF04** | **Agendamento de Consultas** | O cidadão deve poder selecionar especialidade, UBS, data e horário disponível para reservar sua consulta. |
| **RF05** | **Bloqueio de Conflitos de Horário** | O sistema deve impedir que dois pacientes reservem a mesma vaga e impedir que o mesmo cidadão tenha mais de um agendamento no mesmo turno/horário. |
| **RF06** | **Emissão de Comprovante de Agendamento** | O sistema deve gerar um comprovante com código verificador de protocolo, QR Code, endereço da unidade e orientações de comparecimento. |
| **RF07** | **Cancelamento de Consultas** | O sistema deve permitir o cancelamento pelo paciente com antecedência mínima de 24 horas, liberando a vaga de imediato para a fila geral. |
| **RF08** | **Histórico de Consultas** | O sistema deve listar as consultas futuras (ativas) e passadas (realizadas, canceladas e faltas) com status visualmente destacado. |

---

### 3. Requisitos Não Funcionais (RNF)

* **RNF01 - Conformidade Estrita com LGPD:** Dados de saúde são de natureza sensível. Exige-se consentimento formal no primeiro acesso, armazenamento seguro e mascaramento de dados pessoais em telas e relatórios (ex.: `CPF: ***.123.456-**`).
* **RNF02 - Segurança de Acesso:** Autenticação protegida, política de expiração de sessão e controle de acesso baseado em papéis (RBAC). Cidadãos não visualizam dados de outros usuários.
* **RNF03 - Usabilidade e Acessibilidade:** Conformidade com padrões de acessibilidade governamentais (e-MAG / WCAG), alto contraste, botões com áreas de clique acessíveis e linguagem sem jargões.
* **RNF04 - Tempo de Resposta:** Todas as pesquisas de disponibilidade de vagas e confirmações de reserva devem responder em **tempo inferior a 500 ms**.

---

### 4. Mapeamento de Telas (Protótipo do Cidadão no Figma)

```
[Tela 1: Login / Boas-vindas]
         │
         ├──> [Tela 2: Cadastro do Cidadão]
         │
[Tela 3: Painel Principal / Início]
         │
         ├──> [Fluxo de Agendamento: Telas 4, 5 e 6] ──> [Tela 7: Comprovante]
         │
         └──> [Tela 8: Minhas Consultas & Histórico] ──> [Modal: Cancelamento]
```

#### **Tela 1: Boas-vindas e Login**
* **Objetivo:** Ponto de entrada do cidadão.
* **Elementos:** Identidade visual do SUS / Prefeitura do Natal; campos para CPF e Senha; botão "Entrar"; links para "Criar Conta" e "Esqueci minha senha".

#### **Tela 2: Cadastro do Cidadão**
* **Objetivo:** Registro inicial com validação de dados civis e de saúde.
* **Elementos:** Formulário com CPF, Cartão SUS, Data de Nascimento, Telefone com WhatsApp, Bairro de Residência e Aceite dos Termos de Privacidade (LGPD).

#### **Tela 3: Painel Principal (Dashboard do Cidadão)**
* **Objetivo:** Visão consolidada da saúde do paciente.
* **Elementos:** 
  * Card com próxima consulta agendada e atalho para ver comprovante.
  * Botão de destaque (CTA): **"Agendar Nova Consulta"**.
  * Acessos rápidos para "Minhas Consultas", "Minha UBS de Referência" e "Meus Dados".

#### **Tela 4: Escolha de Especialidade e UBS (Etapa 1)**
* **Objetivo:** Filtrar o atendimento desejado.
* **Elementos:** Barra de progresso (1 de 3); lista com opções (Clínico Geral, Odontologia, Pré-natal, Enfermagem); sugestão da UBS do bairro do cidadão com opção de buscar outras unidades com vagas abertas.

#### **Tela 5: Escolha de Data e Horário (Etapa 2)**
* **Objetivo:** Seleção de horário sem conflitos.
* **Elementos:** Calendário mensal destacando dias disponíveis; seleção de turno (Manhã / Tarde); chips de horários vagos; horários indisponíveis aparecem desabilitados e cinzas.

#### **Tela 6: Resumo e Confirmação (Etapa 3)**
* **Objetivo:** Validação final dos dados antes da reserva.
* **Elementos:** Card de resumo (Nome do Paciente, UBS, Endereço, Data, Horário e Especialidade); aviso de chegada com 15 minutos de antecedência; botão **"Confirmar Agendamento"**.

#### **Tela 7: Comprovante de Agendamento**
* **Objetivo:** Documento oficial para apresentação na UBS.
* **Elementos:** Ícone de sucesso; código alfanumérico de protocolo; QR Code para leitura rápida na triagem da UBS; botões "Baixar PDF" e "Voltar ao Início".

#### **Tela 8: Histórico e Cancelamento**
* **Objetivo:** Acompanhamento de consultas ativas e passadas.
* **Elementos:** Abas "Próximas" e "Concluídas"; cards com status (*Confirmada*, *Realizada*, *Cancelada*); botão "Cancelar Consulta" que abre um modal com justificativa e confirmação.

---

### 5. Diretrizes para Entregáveis Acadêmicos

1. **UML - Diagrama de Casos de Uso:** O ator *Cidadão* se conecta a `Cadastrar`, `Agendar Consulta`, `Cancelar Consulta` e `Visualizar Comprovante`. A relação de `<<include>>` se aplica entre `Agendar Consulta` e `Validar Conflito de Horário`.
2. **BPMN - Processo de Negócio:** Dividir em 3 raias (*Cidadão*, *Sistema de Agendamento*, *Recepção/Triagem da UBS*), conectando o agendamento virtual ao atendimento presencial.
