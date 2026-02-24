# Nitro Finance

**Versão:** 1.0.0  
**Status:** MVP em desenvolvimento  

## Visão Geral

O **Nitro Finance** é um **sistema corporativo de gestão de despesas e assinaturas**, criado para centralizar, padronizar e auditar custos recorrentes e pontuais dentro de empresas.

O sistema resolve problemas comuns como:
- Cobranças indevidas por falta de cancelamento  
- Falta de visibilidade consolidada de gastos  
- Ausência de auditoria e rastreabilidade de decisões  
- Dificuldade de controle por empresa, setor e responsável  

O Nitro Finance reforça **governança financeira**, garantindo que toda despesa tenha responsável, validação periódica e histórico auditável.

---

## Objetivos do Projeto

- Centralizar despesas corporativas em um único sistema  
- Gerenciar assinaturas recorrentes (SaaS, serviços, ferramentas)  
- Reduzir desperdícios financeiros  
- Criar rastreabilidade completa de decisões  
- Automatizar alertas de renovação e pendências  
- Facilitar análises financeiras e tomada de decisão  

---

## Funcionalidades do MVP (V1)

### Gestão de Despesas
- Cadastro de despesas recorrentes e únicas  
- Classificação por empresa, setor, categoria e moeda  
- Controle de status (ativo, em cancelamento, cancelado)  
- Paginação (10 registros por página) e filtros por empresa, setor, responsável, status e tipo  
- Edição por **Líder** nas despesas sob sua responsabilidade (empresas vinculadas)  

### Validação Mensal
- Fluxo obrigatório de validação mensal  
- Aba Validações com filtros por nome, empresa, responsável e setor  
- Data de renovação exibida e avançada automaticamente ao aprovar  
- Histórico de confirmações e pendências; exportação em CSV  

### Auditoria e Acesso
- Registro de ações e histórico de alterações  
- Permissões por perfil; isolamento de dados por empresa e setor  
- **Finance Admin** e **System Admin**: redefinição de senha de qualquer usuário  

### Alertas e Dashboards
- Alertas de renovação e pendências de validação (notificações in-app)  
- Dashboard com visão consolidada, totais por empresa/setor/categoria e filtros  

---

## Perfis de Usuário

| Perfil           | Permissões |
|------------------|------------|
| **Finance Admin** | Acesso total; criar/editar/cancelar despesas; gerenciar usuários; redefinir senha de qualquer usuário. |
| **System Admin**  | Igual ao Finance Admin (acesso técnico e auditoria). |
| **Leader**        | Validação mensal das despesas das empresas vinculadas; **editar** despesas sob sua responsabilidade; visualizar dados do seu escopo. |
| **User**          | Criação de despesas e acompanhamento das próprias. |

---

## Estrutura do Repositório

- **`backend/`** — API REST em FastAPI (Python)  
- **`frontend/`** — Interface em React (Vite + TypeScript)  

---

## Início Rápido (Desenvolvimento Local)

Guia completo: **[SETUP_LOCALHOST.md](SETUP_LOCALHOST.md)**  

### Resumo

1. **Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env      # Configurar credenciais do banco
   alembic upgrade head
   uvicorn app.main:app --reload --port 8000
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Acessos**
   - Frontend: http://localhost:5173  
   - API: http://localhost:8000  
   - Documentação da API: http://localhost:8000/docs  

---

## Tecnologias

### Backend
- Python 3  
- FastAPI  
- SQLAlchemy 2 + Alembic  
- PostgreSQL  
- JWT (python-jose) e bcrypt  

### Frontend
- React 18  
- Vite  
- TypeScript  
- TanStack Query (React Query)  
- React Router  
- Tailwind CSS  
- Radix UI  

### Banco de Dados
- PostgreSQL  
