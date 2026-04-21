# Fractal RPG — Foundry VTT

> ⚠️ **Projeto NÃO-OFICIAL feito por fã para fã.**  
> Não é afiliado, endossado ou produzido pelos criadores do Fractal RPG.  
> Feito com amor para a comunidade, de graça e de código aberto.

Sistema para jogar **[Fractal RPG](https://fractal-system.itch.io/pt-br)** no [Foundry Virtual Tabletop](https://foundryvtt.com/) v13+.  
Baseado no SRD v1.0.1 de Igor Téuri & Walter Licínio (CC BY 4.0).

> 🎲 Conheça o canal **[Dados Críticos](https://www.youtube.com/@dadoscriticos)** no YouTube!

---

## ✅ O que está implementado

### Ficha de Personagem
- **Fatos** — criação, edição e remoção inline; marcar até 3 para rolar; romper/restaurar
- **Reservas** — configuráveis por mundo (GM), tracker de bubbles clicável, total editável por ficha
- **Rolagem de Risco** — selecione Fatos, role d6s, aplique Impulso e Rupturas por escolha do jogador
- **Interlúdio** — ações de Evoluir, Aprimorar, Descansar, Mudar e Preparar-se com custo em XP
- **Anotações** livres

### Ficha de Desafio
- **Reservas de mundo** configuradas pelo GM + **Reservas customizadas** por desafio (nome, total, gatilho)
- **Fatos** com toggle de ruptura — todos rompidos exibe badge SUPERADO
- **Notas do Arquiteto** (visível apenas para o GM/dono)

### Configurações de mundo (painel do GM)
- Reservas de Personagens e Desafios com pré-configurações (Fantasia, Sci-Fi, Horror, Genérico)
- Cor de destaque (accent), background das fichas com controle de opacidade
- CSS customizado injetado globalmente com exemplos e botão "Carregar padrão"

---

## 📦 Instalação

1. Abra o Foundry VTT
2. Vá em **Configurações → Gerenciar Sistemas → Instalar Sistema**
3. Cole no campo _Manifest URL_:
```
https://github.com/SergioSJS/fractal-rpg-fvtt/releases/latest/download/system.json
```
4. Clique em **Instalar**

---

## 💻 Desenvolvimento Local (Symlink)

```bash
git clone https://github.com/SergioSJS/fractal-rpg-fvtt.git

# Mac/Linux
ln -s "$(pwd)/fractal-rpg-fvtt" "$HOME/Library/Application Support/FoundryVTT/Data/systems/fractal-rpg"

# Windows (CMD como Administrador)
mklink /D "%APPDATA%\FoundryVTT\Data\systems\fractal-rpg" "C:\Caminho\Para\fractal-rpg-fvtt"
```

Reinicie o Foundry e o sistema aparecerá na lista.

---

## 🚀 Publicando uma Nova Versão

O projeto usa GitHub Actions para gerar releases automaticamente.  
Basta criar e enviar uma tag semântica:

```bash
git tag v0.2.0
git push origin v0.2.0
```

O CI irá:
1. Atualizar `system.json` com a nova versão e URL de download
2. Empacotar `fractal-rpg.zip` com todos os arquivos do sistema
3. Criar o GitHub Release com o zip e o `system.json` como artefatos
4. Atualizar o manifesto no `master` automaticamente

---

## Compatibilidade

| Foundry VTT | Status |
|-------------|--------|
| v13         | ✅ Suportado |
| v14         | ✅ Verificado |

---

## 📋 Licença e Créditos

- O código deste repositório está sob [MIT License](LICENSE).
- Sistema **[Fractal RPG](https://fractal-system.itch.io/pt-br)** criado por Igor Téuri & Walter Licínio — todo o conteúdo narrativo e de regras pertence a eles (CC BY 4.0).
- Canal **[Dados Críticos](https://www.youtube.com/@dadoscriticos)** — onde o sistema é usado e divulgado.
- Feito por **Sérgio Sousa** — [meioorc.com](https://meioorc.com)
