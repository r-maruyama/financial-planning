# 💰 Meu Plano Financeiro

Planner financeiro gratuito para brasileiros com renda até R$4.000 — feito para sair das dívidas, entender o score e começar a guardar dinheiro.

## 📁 Estrutura do projeto

```
meu-plano-financeiro/
├── index.html          ← Landing page (página de vendas)
├── css/
│   ├── style.css       ← Estilos da landing page
│   └── app.css         ← Estilos do app
├── js/
│   ├── main.js         ← JS da landing page
│   └── app.js          ← JS do app (lógica + localStorage)
└── pages/
    └── app.html        ← O planner em si (4 módulos)
```

## 🚀 Como publicar no GitHub Pages

### Passo 1 — Criar o repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique em **"New repository"** (botão verde no canto superior direito)
3. Nome do repositório: `meu-plano-financeiro`
4. Marque como **Public**
5. Clique em **"Create repository"**

### Passo 2 — Fazer upload dos arquivos

**Opção A — Pelo site do GitHub (mais fácil):**
1. Na página do repositório, clique em **"uploading an existing file"**
2. Arraste todos os arquivos desta pasta
3. Clique em **"Commit changes"**

**Opção B — Via terminal (recomendado):**
```bash
cd meu-plano-financeiro
git init
git add .
git commit -m "primeiro commit — planner financeiro"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/meu-plano-financeiro.git
git push -u origin main
```

### Passo 3 — Ativar o GitHub Pages

1. No seu repositório, vá em **Settings** (aba no topo)
2. No menu lateral, clique em **Pages**
3. Em **"Branch"**, selecione `main` e pasta `/ (root)`
4. Clique em **Save**
5. Aguarde 1-2 minutos

Seu site estará no ar em:
```
https://SEU_USUARIO.github.io/meu-plano-financeiro/
```

## 🎨 Como customizar

### Trocar as cores
Edite as variáveis em `css/style.css` e `css/app.css`:
```css
:root {
  --green: #1B4332;      /* cor principal */
  --accent: #FF6B35;     /* destaque */
  --cream: #F5F0E8;      /* fundo */
}
```

### Trocar o nome/texto
Edite `index.html` — os textos principais estão nas tags `<h1>`, `<h2>`, e `<p>`.

### Adicionar seu link de pagamento
No `index.html`, substitua o `href="#"` dos botões **"Usar o planner grátis"** pelo seu link do Gumroad ou Hotmart (se quiser versão paga).

### Alterar dados de exemplo do app
Em `js/app.js`, edite o objeto `DEFAULT_STATE` para mudar os valores iniciais exibidos no app.

## 💾 Como os dados funcionam

O app usa **localStorage** — os dados ficam salvos no navegador do usuário, sem precisar de banco de dados ou servidor. Cada pessoa que abre o app tem seus próprios dados salvos localmente.

Para limpar os dados, o usuário pode clicar em "Resetar dados" no menu lateral.

## 🔮 Próximos passos sugeridos

- [ ] Adicionar campo de mês para comparar meses diferentes
- [ ] Gráfico de evolução do score ao longo do tempo
- [ ] Exportar dados como PDF ou planilha
- [ ] Versão com autenticação (login) usando Firebase (gratuito)
- [ ] Adicionar módulo de negociação de dívidas com scripts

## 📄 Licença

Projeto pessoal — use e adapte à vontade.
