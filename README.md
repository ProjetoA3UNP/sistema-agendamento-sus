# Sistema de Agendamento de Consultas em Unidade de Saúde (SUS / Natal-RN)

Projeto acadêmico de Engenharia de Software voltado para a digitalização, gestão de vagas e agendamento de consultas nas Unidades Básicas de Saúde (UBS) do município de Natal-RN.

---

## 📁 Estrutura da Documentação

A documentação do sistema está organizada em arquivos modulares na pasta `docs/`:

* 📄 **[Documento 01: Requisitos e Fluxo de Telas](docs/01-requisitos-e-telas.md)**
  * Requisitos Funcionais (RF01 a RF08).
  * Requisitos Não Funcionais (LGPD, Segurança, Acessibilidade, Desempenho < 500ms).
  * Mapeamento detalhado de cada tela para o protótipo do Cidadão no Figma.
  * Diretrizes de ligação para os diagramas UML e BPMN.

* 📄 **[Documento 02: Épicos e Histórias de Usuário](docs/02-epicos-e-historias-de-usuario.md)**
  * Divisão do escopo do projeto em 6 Épicos ágeis.
  * Histórias de Usuário (User Stories) detalhadas com formato padrão de negócio.
  * Matriz de rastreabilidade (Épico $\rightarrow$ User Story $\rightarrow$ Requisito).

* 📄 **[Documento 03: Atores e Matriz de Permissões](docs/03-atores-e-matriz-de-permissoes.md)**
  * Detalhamento individual de cada ator: Cidadão, Atendente de UBS, Profissional de Saúde e Gestor/Administrador.
  * Telas visíveis, ações permitidas e limitações essenciais (regras de segurança e LGPD).
  * Matriz consolidada de permissões e acessos (RBAC).

* 📄 **[Documento 04: Arquitetura e Tecnologias](docs/04-arquitetura-e-tecnologias.md)**
  * Padrão arquitetural em camadas com API REST desacoplada.
  * Stack definida: NestJS (TypeScript), React + Vite, MySQL 8 (InnoDB) e Docker.
  * Tratamento de concorrência com lock pessimista (RF05), conformidade LGPD e acessibilidade WCAG.

