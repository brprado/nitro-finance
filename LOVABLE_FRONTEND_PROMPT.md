# Prompt para Lovable – Protótipo Frontend Nitro Finance

Copie o conteúdo abaixo e use no Lovable para gerar o protótipo de frontend.

---

## Contexto do Projeto

Construa um **protótipo de frontend em React** para o **Nitro Finance**, um sistema corporativo de gestão de despesas e assinaturas. O backend já existe em **FastAPI** e expõe uma API REST em `http://localhost:8000` (ou a URL que o usuário configurar). O frontend deve consumir essa API e oferecer uma interface moderna, responsiva e intuitiva.

**Objetivo do sistema:** Centralizar despesas corporativas, gerenciar assinaturas (SaaS, serviços), garantir validação mensal por líderes e enviar alertas de renovação e pendências.

---

## Autenticação

- **Login:** `POST /api/v1/auth/login`  
  - Body: `{ "email": "string", "password": "string" }`  
  - Resposta: `{ "access_token": "string", "token_type": "bearer" }`

- Todas as outras requisições devem enviar o token no header:  
  `Authorization: Bearer <access_token>`

- **Usuário logado:** `GET /api/v1/users/me`  
  - Retorna: `{ id, name, email, role, phone, is_active, departments[] }`

---

## Perfis de Usuário (roles)

| Role | Valor no API | O que pode fazer no sistema |
|------|--------------|-----------------------------|
| **Finance Admin** | `finance_admin` | Acesso total: empresas, setores, categorias, usuários, despesas, validações, alertas. Criar/editar/excluir tudo. |
| **System Admin** | `system_admin` | Mesmo que Finance Admin. |
| **Leader** | `leader` | Ver e validar (aprovar/rejeitar) despesas dos setores aos quais está vinculado. Ver suas pendências de validação. |
| **User** | `user` | Ver apenas as despesas das quais é responsável (owner). Ver seus alertas. |

- Mostrar/ocultar menus e ações conforme o `role` do usuário logado.
- Se a API retornar 403, exibir mensagem amigável de “sem permissão”.

---

## Estrutura de Navegação Sugerida

1. **Login** (pública)
2. **Dashboard** (resumo após login – pode ser cards com totais ou links rápidos)
3. **Despesas** – listagem com filtros (empresa, setor, status), botão nova despesa (só admin), ver/editar/excluir (admin)
4. **Validações** – para **Leader** e **Admin**: lista de validações pendentes; ações Aprovar / Rejeitar
5. **Alertas** – lista de alertas do usuário (renovação, validação vencida etc.) com opção “marcar como lido”
6. **Cadastros** (apenas Admin):
   - Empresas (CRUD)
   - Setores (CRUD, filtro por empresa)
   - Categorias (CRUD)
   - Usuários (CRUD, com vínculo a setores e role)

---

## Endpoints da API (base: `/api/v1`)

### Auth
- `POST /auth/login` – login (email, password) → retorna `access_token`

### Usuários (exigem token; usuários só para admin)
- `GET /users/me` – usuário logado
- `GET /users` – lista (admin)
- `GET /users/{id}` – por ID (admin)
- `POST /users` – criar (admin). Body: name, email, password, role, phone?, department_ids[]
- `PUT /users/{id}` – atualizar (admin)
- `DELETE /users/{id}` – desativar (admin)

**Roles:** `finance_admin` | `system_admin` | `leader` | `user`

### Empresas (admin)
- `GET /companies` – listar
- `GET /companies/{id}` – por ID
- `POST /companies` – criar. Body: `{ name }`
- `PUT /companies/{id}` – atualizar. Body: `{ name?, is_active? }`
- `DELETE /companies/{id}` – desativar

### Setores (admin)
- `GET /departments?company_id=<uuid>` – listar (opcional: filtrar por empresa)
- `GET /departments/{id}` – por ID
- `POST /departments` – criar. Body: `{ name, company_id }`
- `PUT /departments/{id}` – atualizar
- `DELETE /departments/{id}` – desativar

### Categorias (admin)
- `GET /categories` – listar
- `GET /categories/{id}` – por ID
- `POST /categories` – criar. Body: `{ name }`
- `PUT /categories/{id}` – atualizar. Body: `{ name?, is_active? }`
- `DELETE /categories/{id}` – desativar

### Despesas (exigem token; criação/edição/exclusão só admin)
- `GET /expenses?company_id=&department_id=&status=` – listar (filtros opcionais). Admin vê todas; Leader vê dos seus setores; User vê só as suas.
- `GET /expenses/{id}` – por ID
- `POST /expenses` – criar (admin). Body inclui: service_name, description?, expense_type, category_id, company_id, department_id, owner_id, approver_id, value, currency, periodicity?, renewal_date?, payment_method, payment_identifier?, contracted_plan?, user_count?, evidence_link?, notes?
- `PUT /expenses/{id}` – atualizar (admin)
- `DELETE /expenses/{id}` – cancelar (admin)

**Enums despesa:**
- expense_type: `recurring` | `one_time`
- currency: `BRL` | `USD`
- periodicity: `monthly` | `quarterly` | `semiannual` | `annual`
- payment_method: `credit_card` | `debit_card` | `boleto` | `pix` | `transfer`
- status: `draft` | `in_review` | `active` | `cancellation_requested` | `cancelled` | `suspended` | `migrated`

### Validações mensais (exigem token)
- `GET /expense-validations/pending?month=` – listar pendências do líder (ou todas para admin). Query `month` opcional (data no formato YYYY-MM-DD, ex: primeiro dia do mês).
- `GET /expense-validations/{id}` – detalhe de uma validação
- `POST /expense-validations/{id}/approve` – aprovar (Leader do setor ou Admin)
- `POST /expense-validations/{id}/reject` – rejeitar (muda despesa para “solicitação de cancelamento”)
- `GET /expense-validations/overdue/list` – listar validações vencidas (admin)
- `POST /expense-validations/create-monthly?month=` – disparar criação de validações do mês (admin)
- `POST /expense-validations/create-overdue-alerts` – criar alertas de validações vencidas (admin)

Cada item de validação pode vir com `expense` (dados resumidos: id, service_name, value, value_brl, currency, status, department_id).

### Alertas (exigem token)
- `GET /alerts/me?status=&limit=` – alertas do usuário logado (status opcional: pending, sent, failed, read)
- `GET /alerts` – todos (admin), com filtro opcional por `recipient_id` e `status`
- `GET /alerts/{id}` – detalhe
- `POST /alerts/{id}/read` – marcar como lido
- `POST /alerts/process-pending?limit=` – processar fila de envio (admin)
- `POST /alerts/check-renewals?days_ahead=` – verificar renovações e criar alertas (admin)
- `GET /alerts/stats/summary` – totais (total, pending, sent, failed, read) (admin)

Tipos de alerta: `validation_pending`, `validation_overdue`, `renewal_upcoming`, `renewal_due`, `expense_cancellation`. Status: `pending`, `sent`, `failed`, `read`.

---

## Requisitos de UI/UX

1. **Layout:** Sidebar ou top navigation com itens conforme perfil (Dashboard, Despesas, Validações, Alertas e, para admin, Cadastros: Empresas, Setores, Categorias, Usuários).
2. **Login:** Tela simples (email + senha), botão “Entrar”. Em caso de erro 401, mostrar “Email ou senha incorretos”. Após sucesso, guardar token (ex.: localStorage) e redirecionar para Dashboard ou Despesas.
3. **Despesas:** Tabela ou cards com filtros (empresa, setor, status). Valores em BRL formatados (R$). Para admin: botões Novo, Editar, Excluir/Cancelar. Formulário de criação/edição com todos os campos da API (use selects para enums e para company, department, category, owner, approver).
4. **Validações:** Página “Validações pendentes” listando itens com dados da despesa (nome, valor, setor, mês). Botões “Aprovar” e “Rejeitar” por item. Confirmação antes de rejeitar.
5. **Alertas:** Lista de alertas do usuário com título, mensagem, data e status. Botão “Marcar como lido” onde fizer sentido.
6. **Cadastros (admin):** CRUD simples para Empresas, Setores (com seleção de empresa), Categorias e Usuários (com role e setores). Listagem + formulário de criação/edição.
7. **Responsividade:** Layout utilizável em desktop e tablet; componentes que se adaptem bem.
8. **Tratamento de erros:** Mensagens claras para 400, 403, 404 e 500 (ex.: “Não autorizado”, “Recurso não encontrado”, “Erro no servidor”).
9. **Logout:** Botão que remove o token e redireciona para a tela de login.

---

## Stack e Configuração

- **React** (com ou sem framework como Vite/Next conforme preferência do Lovable).
- Consumir API com `fetch` ou `axios`; base URL configurável (ex.: variável de ambiente `VITE_API_URL` ou `NEXT_PUBLIC_API_URL` apontando para `http://localhost:8000` em desenvolvimento).
- Gerenciamento de estado: pode usar Context para usuário logado e token, ou lib como React Query para cache das listagens.
- Roteamento: React Router com rotas protegidas (verificar token e, se necessário, role antes de renderizar páginas admin).

---

## Resumo para o Lovable

- Sistema de **gestão de despesas corporativas** com **login JWT**.
- **4 perfis:** Finance Admin, System Admin, Leader, User – cada um com permissões diferentes.
- Páginas: **Login**, **Dashboard**, **Despesas** (lista + formulário), **Validações** (pendências + aprovar/rejeitar), **Alertas** (lista + marcar lido), e para admin: **Empresas**, **Setores**, **Categorias**, **Usuários** (CRUD).
- Todas as requisições (exceto login) usam `Authorization: Bearer <token>`.
- API base: `http://localhost:8000` (ou env). Endpoints em `/api/v1/` como descrito acima.
- Interface limpa, responsiva e com feedback claro de erros e sucesso.

Construa o protótipo seguindo essa especificação, priorizando fluxos de Login, listagem e formulário de Despesas, Validações pendentes (aprovar/rejeitar) e lista de Alertas, e depois os CRUDs de cadastro para admin.
