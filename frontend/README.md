#  Agenda de Agendamento

Este é um sistema completo de gestão de agendamentos desenvolvido para otimizar o fluxo de trabalho em estabelecimentos como salões de beleza, clínicas de estética, barbearias e similares. O projeto oferece uma interface intuitiva para o gerenciamento de clientes, profissionais, procedimentos e horários.

##  O que é o projeto?

A **Agenda de Agendamento** é uma aplicação Full-Stack que permite aos usuários:
- Visualizar agendamentos diários em uma interface limpa.
- Gerenciar o cadastro de clientes e seus históricos.
- Cadastrar profissionais e vincular quais procedimentos cada um realiza.
- Controlar a lista de serviços oferecidos (procedimentos) com preços e durações.
- Acompanhar métricas básicas através de um Dashboard dinâmico.

##  Tecnologias Utilizadas

O projeto foi construído utilizando as tecnologias mais modernas do mercado:

### **Frontend**
- **Linguagem:** JavaScript (React)
- **Ferramenta de Build:** [Vite](https://vitejs.dev/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Notificações:** [React Hot Toast](https://react-hot-toast.com/)
- **Roteamento:** [React Router Dom v7](https://reactrouter.com/)
- **Requisições HTTP:** [Axios](https://axios-http.com/)
- **Fontes:** Playfair Display (Serif) e DM Sans (Sans-serif) via Google Fonts.

### **Backend**
- **Linguagem:** Java 17
- **Framework:** [Spring Boot 3.2.0](https://spring.io/projects/spring-boot)
- **Persistência de Dados:** Spring Data JPA
- **Banco de Dados:** MySQL
- **Gerenciador de Dependências:** Maven

##  Como Funciona?

A aplicação segue uma arquitetura cliente-servidor:
1.  **Backend:** Uma API REST desenvolvida em Java/Spring que gerencia as regras de negócio e a persistência no banco MySQL.
2.  **Frontend:** Uma Single Page Application (SPA) em React que consome a API do backend de forma assíncrona usando Axios.

### **Principais Funcionalidades**
- **Dashboard:** Visão geral com cards informativos sobre os agendamentos e status.
- **Gestão de Agendamentos:** Criação de novos agendamentos vinculando cliente, profissional e procedimento, com controle de status (Pendente, Confirmado, Concluído, Cancelado).
- **Filtro de Calendário:** Visualização dos agendamentos por data específica.
- **Gestão de Profissionais:** Cadastro detalhado de colaboradores e seus respectivos serviços.
- **Dark Mode:** Suporte completo a tema escuro (Dark Mode) integrado com Tailwind CSS.

---

##  Como Executar o Projeto

### **Pré-requisitos**
- Node.js (v18+)
- Java JDK 17
- MySQL Server

### **Passo 1: Backend**
1. Acesse a pasta `backend`.
2. Certifique-se de que o banco de dados MySQL está rodando e as configurações no `application.properties` estão corretas.
3. Execute o comando para rodar a aplicação Spring Boot:
   ```bash
   mvn spring-boot:run
   ```

### **Passo 2: Frontend**
1. Acesse a pasta `frontend`.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

---

*Desenvolvido por João Victor.*
