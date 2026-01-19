# 💳 Nitro Finance

**Versão:** 1.0.0  
**Status:** MVP em desenvolvimento  

## 📌 Visão Geral
O **Nitro Finance** é um **sistema corporativo de gestão de despesas e assinaturas**, criado para centralizar, padronizar e auditar custos recorrentes e pontuais dentro de empresas.

O sistema resolve problemas comuns como:
- Cobranças indevidas por falta de cancelamento  
- Falta de visibilidade consolidada de gastos  
- Ausência de auditoria e rastreabilidade de decisões  
- Dificuldade de controle por empresa, setor e responsável  

O Nitro Finance força **governança financeira**, garantindo que toda despesa tenha responsável, validação periódica e histórico auditável.

---

## 🎯 Objetivos do Projeto
- Centralizar despesas corporativas em um único sistema  
- Gerenciar assinaturas recorrentes (SaaS, serviços, ferramentas)  
- Reduzir desperdícios financeiros  
- Criar rastreabilidade completa de decisões  
- Automatizar alertas de renovação e pendências  
- Facilitar análises financeiras e tomada de decisão  

---

## 🧩 Funcionalidades do MVP (V1)

### 🔹 Gestão de Despesas
- Cadastro de despesas recorrentes e não recorrentes  
- Classificação por empresa, setor, categoria e moeda  
- Controle de status (ativo, em cancelamento, cancelado)  

### 🔹 Validação Mensal
- Fluxo obrigatório de validação mensal por líderes  
- Registro automático de não validações  
- Histórico de confirmações e pendências  

### 🔹 Auditoria Automática
- Registro de todas as ações do sistema  
- Histórico completo de alterações  
- Rastreabilidade por usuário e data  

### 🔹 Alertas Inteligentes
- Alertas de renovação próxima  
- Alertas de pendências de validação  
- Envio de notificações via **WhatsApp (Z-API)**  

### 🔹 Dashboards
- Visão consolidada de gastos  
- Totais por empresa, setor e categoria  
- Ranking das maiores despesas  
- Filtros avançados  

### 🔹 Controle de Acesso
- Permissões baseadas em perfil  
- Isolamento de dados por empresa e setor  

---

## 🔐 Perfis de Usuário

| Perfil | Permissões |
|------|-----------|
| **FinanceAdmin** | Acesso total, ativação e cancelamento de despesas |
| **SystemAdmin** | Acesso técnico e auditoria (dados sensíveis mascarados) |
| **Leader** | Validação mensal das despesas do seu setor |
| **User** | Criação de solicitações e acompanhamento |

---

## 🛠️ Tecnologias Utilizadas

### Backend
- Python  
- FastAPI  
- JWT (JSON Web Tokens)  

### Frontend
- React  

### Banco de Dados
- PostgreSQL  

### Notificações
- WhatsApp (Z-API)  

### Infraestrutura
- Nuvem (infraestrutura existente)  
- Docker  

---