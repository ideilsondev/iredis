# Diretrizes de UI/UX e System Design (Padrão iRedis)

Este documento descreve a arquitetura de interface e experiência de usuário desenvolvida para o **iRedis**. O objetivo é servir como um "Guia de Estilo" (Design System) rígido para garantir que projetos futuros mantenham a mesma fluidez, estética profissional e performance de um aplicativo desktop de alto nível.

---

## 1. Princípios de Design

A identidade visual foge do estilo "dashboard web tradicional" e foca em uma experiência **Desktop-First**, fortemente inspirada no **Microsoft Fluent Design** e na interface "Ribbon" do Microsoft Office.

*   **Densidade de Informação:** Alta. Ferramentas de produtividade e gerenciamento de banco de dados precisam exibir muitos dados sem exigir múltiplos cliques.
*   **Acesso Contextual:** As ações na barra superior (Ribbon) mudam dependendo de qual aba/workspace o usuário está focado no momento.
*   **Minimalismo Funcional:** Fundo limpo (`bg-background`), containers destacados com bordas sutis e sombras pontuais para modais e popups.

## 2. Arquitetura do Layout (AppShell)

Todo o aplicativo é contido num layout de tela cheia que não possui barra de rolagem global (`h-screen overflow-hidden`). As barras de rolagem são restritas a componentes específicos (como a lista de chaves ou o log de eventos).

A estrutura principal divide-se em 3 camadas horizontais:
1.  **Ribbon (Barra Superior):** Responsável pela navegação principal (Abas) e pelas Ações Globais.
2.  **Workspace (Área Central):** Onde o conteúdo interativo reside (Tabelas, Listas, Logs).
3.  **Toasts / Overlays (Camada Flutuante):** Modais de ação rápida e notificações não-intrusivas.

### O Componente Ribbon
A barra superior não é apenas um menu; ela é o **centro de controle**.
*   **Abas (Tabs):** Substituem o menu lateral padrão. O usuário alterna entre contextos (Ex: _Conexões_, _Chaves_, _Eventos_) através de botões minimalistas no topo.
*   **Botões de Ação Dinâmicos:** À direita da Ribbon, os botões disponíveis dependem da aba selecionada. (Ex: O botão _"Criar Canal"_ só aparece se a aba _"Eventos"_ estiver ativa).
*   **Badges de Notificação:** Componentes visuais para alertar o usuário sem interromper seu fluxo (Ex: Bolinha vermelha com contador em abas não visualizadas).

---

## 3. Comportamento e Interatividade (UX)

### Diálogos (Modais) Centralizados
Para formulários complexos (Ex: Adicionar Conexão, Assinar Canal), utilizamos Modais (`CustomDialog`) em vez de abrir novas páginas.
*   **Comportamento:** Fundo fosco (backdrop-blur) bloqueando a interação com o fundo, forçando foco total no formulário.
*   **Gerenciamento:** O estado do Modal é global. Qualquer componente pode engatilhar `openDialog('type')`.

### Notificações Híbridas (OS + In-App)
Avisos críticos ou mensagens de tempo real devem atingir o usuário de duas formas simultâneas, mantendo a regra do "Zero-Interrupt":
1.  **In-App Toast:** Um card animado (slide-in) no canto superior direito que exibe o resumo e some sozinho após X segundos.
2.  **OS Native Notification:** Para sistemas minimizados, disparamos a notificação nativa do Windows/Linux (via Rust) acompanhada de feedback sonoro (bip).

### Entradas de Dados (Stealth Inputs)
*   **Zero-Distraction Focus:** Campos de texto, senhas e textareas não devem exibir bordas vibrantes (`ring` ou cores de destaque vivas) ao receber foco. 
*   **Comportamento:** O campo de input deve ter `bg-input` e borda estática sutil. Ao receber o foco, ele deve transicionar levemente o fundo para `bg-secondary` e remover qualquer delineamento nativo (`outline-none`). Isso cria uma sensação de formulário nativo embebido do sistema operacional, parecendo mais corporativo e limpo.

---

## 4. Stack Tecnológica e Gerenciamento de Estado

Para replicar essa mesma performance e "pegada", o ecossistema tecnológico deve respeitar o seguinte contrato:

*   **Frontend:** React (Vite) + TypeScript.
*   **Estilização:** Tailwind CSS (focado em variáveis semânticas de cores como `bg-card`, `text-primary`, `border-border`).
*   **Gerenciamento de Estado:** Zustand.
    *   *Regra de Ouro:* O estado global (`appStore`) é a única fonte de verdade para a interface. O componente `Ribbon` nunca deve precisar conversar diretamente com o `Workspace`. Ambos reagem às mudanças no Zustand de forma independente.
*   **Ícones:** Lucide-React (Traços consistentes, curvos e modernos).
*   **Camada Nativa / Backend:** Tauri v2 (Rust). Utilizado apenas para acesso a disco, notificações de OS e processos pesados (como I/O de rede com o Redis).

---

## 5. Padrões de Componentes (Checklist para Novos Projetos)

Ao inicializar um projeto que siga o padrão "iRedis", garanta os seguintes componentes básicos:

- [ ] **`AppShell`**: Componente de layout base estático (sem scrolls globais).
- [ ] **`Ribbon`**: Componente de navegação fixa no topo. Recebe o contexto de `activeTab` do Zustand.
- [ ] **`DialogContext/Manager`**: Singleton de UI (modal único montado no topo da DOM que altera seu "child" dependendo do formulário solicitado).
- [ ] **`WorkspaceArea`**: Componente que reage ao `activeTab` usando `display: hidden` (mantendo componentes renderizados em background para não perder estado, como listeners WebSockets ou Pub/Sub).
- [ ] **`Input` / `Textarea` (Camada UI)**: Componentes envelopados para garantir estética "Stealth" (Focus sem anel colorido, apenas escurecendo levemente o fundo via `focus:bg-secondary`). Jamais utilizar tags nativas desenhadas soltas.
- [ ] **Tematização:** Paleta de cores neutra e profissional. Cinzas, azuis de destaque e vermelho apenas para elementos destrutivos/badges urgentes.

---
*Este documento é a fundação para qualquer aplicação corporativa ou de ferramenta de desenvolvedor que demande UX avançada, navegação rápida e estética de aplicação nativa de Desktop.*
