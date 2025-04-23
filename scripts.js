// Utility functions for sanitizing and formatting markdown/code
function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  
  function formatMarkdown(str) {
    // First escape HTML
    let html = escapeHtml(str);
  
    // Convert fenced code blocks ```code```
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      return `<pre><code>${escapeHtml(code)}</code></pre>`;
    });
  
    // Convert inline code `code`
    html = html.replace(/`([^`\n]+?)`/g, (match, code) => {
      return `<code>${escapeHtml(code)}</code>`;
    });
  
    // Convert newlines to <br>
    html = html.replace(/\n/g, "<br>");
  
    return html;
  }

// State management
const state = {
    chats: [],
    currentChatId: null,
    settings: {
      provider: null,
      apiKey: "",
      tokenLimit: 2000,
      temperature: 0.7,
    },
    tokensUsed: 0,
    isDarkMode: localStorage.getItem("darkMode") === "true",
    isFrench: localStorage.getItem("language") === "fr",
    isTyping: false,
  };
  
  // DOM elements
  const elements = {
    chatList: document.getElementById("chat-list"),
    mobileChatList: document.getElementById("mobile-chat-list"),
    chatMessages: document.getElementById("chat-messages"),
    messageInput: document.getElementById("message-input"),
    chatForm: document.getElementById("chat-form"),
    currentChatTitle: document.getElementById("current-chat-title"),
    newChatBtn: document.getElementById("new-chat-btn"),
    themeToggle: document.getElementById("theme-toggle"),
    themeIcon: document.getElementById("theme-icon"),
    settingsBtn: document.getElementById("settings-btn"),
    settingsModal: document.getElementById("settings-modal"),
    closeSettings: document.getElementById("close-settings"),
    saveSettings: document.getElementById("save-settings"),
    mobileMenuBtn: document.getElementById("mobile-menu-btn"),
    mobileSidebar: document.getElementById("mobile-sidebar"),
    closeMobileSidebar: document.getElementById("close-mobile-sidebar"),
    tokenCounter: document.getElementById("token-counter"),
    modelInfo: document.getElementById("model-info"),
    languageToggle: document.getElementById("language-toggle"),
    welcomeTitle: document.getElementById("welcome-title"),
    welcomeMessage: document.getElementById("welcome-message"),
    suggestionBtns: document.querySelectorAll(".suggestion-btn"),
    toggleApiKey: document.getElementById("toggle-api-key"),
    apiKeyInput: document.getElementById("api-key"),
  };
  
  // Translations
  const translations = {
    en: {
      welcomeTitle: "Welcome to Pona Ekolo Chatbot",
      welcomeMessage:
        "Start a conversation by typing your message below. I can help with various topics!",
      newChat: "New Chat",
      settings: "Settings",
      tokensUsed: "Tokens used",
      modelNotSelected: "Model: Not selected",
      apiKeyPlaceholder: "Your API key is stored locally in your browser",
      tokenLimitPlaceholder: "Maximum tokens per API call (100-10000)",
      temperatureLabels: ["Precise", "Balanced", "Creative"],
      saveSettings: "Save Settings",
      chatPlaceholder: "Type your message here...",
      sendButton: "Send",
      deleteChat: "Delete chat",
      noChats: "No chats yet. Start a new conversation!",
      typing: "AI is typing",
    },
    fr: {
      welcomeTitle: "Bienvenue sur le Chatbot Pona Ekolo",
      welcomeMessage:
        "Commencez une conversation en tapant votre message ci-dessous. Je peux aider sur divers sujets !",
      newChat: "Nouvelle discussion",
      settings: "Paramètres",
      tokensUsed: "Jetons utilisés",
      modelNotSelected: "Modèle : Non sélectionné",
      apiKeyPlaceholder:
        "Votre clé API est stockée localement dans votre navigateur",
      tokenLimitPlaceholder: "Jetons maximum par appel API (100-10000)",
      temperatureLabels: ["Précis", "Équilibré", "Créatif"],
      saveSettings: "Enregistrer les paramètres",
      chatPlaceholder: "Tapez votre message ici...",
      sendButton: "Envoyer",
      deleteChat: "Supprimer la discussion",
      noChats:
        "Aucune discussion pour le moment. Commencez une nouvelle conversation !",
      typing: "L'IA est en train d'écrire",
    },
  };
  
  // Initialize the app
  function init() {
    loadState();
    setupEventListeners();
    applyTheme();
    applyLanguage();
    renderChatList();
  
    if (state.chats.length > 0) {
      loadChat(state.chats[0].id);
    } else {
      createNewChat();
    }
  }
  
  // Load state from localStorage
  function loadState() {
    const savedChats = localStorage.getItem("chats");
    const savedSettings = localStorage.getItem("settings");
    const currentChatId = localStorage.getItem("currentChatId");
  
    if (savedChats) state.chats = JSON.parse(savedChats);
    if (savedSettings) state.settings = JSON.parse(savedSettings);
    if (currentChatId) state.currentChatId = currentChatId;
  
    if (state.settings.provider) {
      elements.modelInfo.textContent = `Model: ${
        state.settings.provider.charAt(0).toUpperCase() +
        state.settings.provider.slice(1)
      }`;
    }
    elements.tokenCounter.textContent = `${
      state.isFrench ? translations.fr.tokensUsed : translations.en.tokensUsed
    }: ${state.tokensUsed}`;
  }
  
  // Save state to localStorage
  function saveState() {
    localStorage.setItem("chats", JSON.stringify(state.chats));
    localStorage.setItem("settings", JSON.stringify(state.settings));
    localStorage.setItem("currentChatId", state.currentChatId);
    localStorage.setItem("darkMode", state.isDarkMode);
    localStorage.setItem("language", state.isFrench ? "fr" : "en");
  }
  
  // Set up event listeners
  function setupEventListeners() {
    elements.chatForm.addEventListener("submit", handleSubmit);
    elements.newChatBtn.addEventListener("click", createNewChat);
    elements.themeToggle.addEventListener("click", toggleTheme);
    elements.settingsBtn.addEventListener("click", openSettings);
    elements.closeSettings.addEventListener("click", closeSettings);
    elements.saveSettings.addEventListener("click", saveSettings);
    elements.mobileMenuBtn.addEventListener("click", openMobileSidebar);
    elements.closeMobileSidebar.addEventListener("click", closeMobileSidebar);
    elements.languageToggle.addEventListener("click", toggleLanguage);
    elements.suggestionBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const text = e.currentTarget.querySelector("h3").textContent;
        elements.messageInput.value = text;
        elements.messageInput.focus();
      });
    });
    elements.toggleApiKey.addEventListener("click", (e) => {
      e.preventDefault();
      const type =
        elements.apiKeyInput.getAttribute("type") === "password"
          ? "text"
          : "password";
      elements.apiKeyInput.setAttribute("type", type);
      elements.toggleApiKey.innerHTML =
        type === "password"
          ? '<i class="fas fa-eye"></i>'
          : '<i class="fas fa-eye-slash"></i>';
    });
    elements.messageInput.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px";
    });
  }
  
  // Handle chat form submission
  async function handleSubmit(e) {
    e.preventDefault();
    const message = elements.messageInput.value.trim();
    if (!message) return;
  
    addMessageToChat(state.currentChatId, "user", message);
    elements.messageInput.value = "";
    elements.messageInput.style.height = "auto";
    showTypingIndicator();
  
    const chat = state.chats.find((c) => c.id === state.currentChatId);
  
    if (state.settings.provider && state.settings.apiKey) {
      // Determine model
      let provider = state.settings.provider.trim();
      let model = provider.includes("-") ? provider : "gpt-3.5-turbo";
      const lowerModel = model.toLowerCase();
      const isChatModel = lowerModel.includes("gpt");
      const apiUrl = isChatModel
        ? "https://api.openai.com/v1/chat/completions"
        : "https://api.openai.com/v1/completions";
  
      // Build payload
      let payload;
      if (isChatModel) {
        payload = {
          model: model,
          messages: chat.messages,
          max_tokens: state.settings.tokenLimit,
          temperature: state.settings.temperature,
        };
      } else {
        const prompt = chat.messages
          .map((m) =>
            (m.role === "user" ? "User: " : "Assistant: ") + m.content
          )
          .join("\n");
        payload = {
          model: model,
          prompt: prompt,
          max_tokens: state.settings.tokenLimit,
          temperature: state.settings.temperature,
        };
      }
  
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.settings.apiKey}`,
          },
          body: JSON.stringify(payload, null, 2),
        });
  
        if (!response.ok) {
          removeTypingIndicator();
          addMessageToChat(
            state.currentChatId,
            "assistant",
            `Error ${response.status}: ${response.statusText}`
          );
          return;
        }
  
        const data = await response.json();
        removeTypingIndicator();
  
        const aiResponse = isChatModel
          ? data.choices?.[0]?.message?.content?.trim() || "No response"
          : data.choices?.[0]?.text?.trim() || "No response";
  
        addMessageToChat(state.currentChatId, "assistant", aiResponse);
  
        const usedTokens = data.usage?.total_tokens
          ? data.usage.total_tokens
          : Math.floor(message.length / 4) +
            Math.floor(aiResponse.length / 4);
  
        state.tokensUsed += usedTokens;
        elements.tokenCounter.textContent = `${
          state.isFrench
            ? translations.fr.tokensUsed
            : translations.en.tokensUsed
        }: ${state.tokensUsed}`;
        saveState();
      } catch (err) {
        removeTypingIndicator();
        addMessageToChat(
          state.currentChatId,
          "assistant",
          `Error: ${err.message}`
        );
      }
    } else {
      // FALLBACK: random simulated response
      setTimeout(() => {
        removeTypingIndicator();
        const aiResponse = generateAIResponse(message);
        addMessageToChat(state.currentChatId, "assistant", aiResponse);
  
        state.tokensUsed +=
          Math.floor(message.length / 4) + Math.floor(aiResponse.length / 4);
        elements.tokenCounter.textContent = `${
          state.isFrench
            ? translations.fr.tokensUsed
            : translations.en.tokensUsed
        }: ${state.tokensUsed}`;
        saveState();
      }, 1500);
    }
  }
  
  // Generate a simulated AI response
  function generateAIResponse(message) {
    const responses = {
        en: [
          "I'm an AI assistant here to help you. Could you provide more details about your question?",
          "That's an interesting question. Here's what I can tell you about that topic...",
          "I'd be happy to help with that. First, let me explain the key concepts...",
          "Based on my knowledge, here's the information you're looking for...",
          "Great question! Here's a detailed response to help you understand...",
          "Let me break that down for you in simple terms...",
          "Thanks for your question! Here's what I found...",
          "Here's an overview of how that works...",
          "Let’s dive into the topic and explore it further...",
          "Here’s a quick explanation you might find useful...",
          "Allow me to provide some context on that...",
          "Here's a step-by-step guide to help clarify...",
          "Interesting topic! Let me walk you through it...",
          "Here's how that typically works...",
          "I understand your question. Here's what you need to know...",
          "Let’s look at the details together...",
          "Sure! Here's a helpful breakdown...",
          "This is a common question. Here's the answer...",
          "Let’s go through this part by part...",
          "Here’s a summary to get you started...",
          "That’s a great topic! Let me help you understand it better...",
          "I can definitely explain that for you...",
          "Here's what that means in practical terms...",
          "Let’s clarify that concept a bit more...",
          "Here’s how I would approach that...",
          "You’re asking a smart question. Here’s my response...",
          "Let’s examine the facts around that...",
          "Good point! Here's some information that might help...",
          "I'll try to explain that as clearly as possible...",
          "Here's some insight into that issue...",
          "This is how it generally works...",
          "Let’s tackle that question now...",
          "I’ll do my best to explain it thoroughly...",
          "Let’s break this down into parts...",
          "This topic is important. Let’s look at it together...",
          "You're right to ask about this. Here's the explanation...",
          "I’m here to help you understand. Let’s begin...",
          "Let me guide you through this answer...",
          "That’s a valid question. Here's the background...",
          "Let me provide a concise overview...",
          "Here’s the info you need on that...",
          "That question often comes up. Let’s take a closer look...",
          "Let’s dig into that topic right away...",
          "Let’s go over the main points...",
          "Thanks for asking! Here's what I can offer...",
          "You’ve brought up a good subject. Let’s explore it...",
          "Let’s analyze this further...",
          "Here’s one way to look at that...",
          "Let me expand on that a little...",
          "Let me know if this explanation makes sense...",
          "Here’s a direct answer to your question...",
          "That’s a thoughtful query. Here’s my explanation...",
          "Let me break that down into simpler parts...",
          "Let’s make sense of this step by step...",
          "Here's a quick rundown of what you need to know...",
          "Let’s simplify this concept together...",
          "I'll walk you through it as clearly as possible...",
          "It’s great that you’re curious! Here’s some helpful info...",
          "Let’s get into the details now...",
          "Here's a clear explanation to help you out...",
          "Let me summarize the important parts...",
          "Let’s get a better understanding of this...",
          "Here's some guidance on the topic...",
          "Let me show you how that works...",
          "Let’s look at the essential elements...",
          "Here's what’s typically understood about this...",
          "That’s a classic question! Here's my take...",
          "This should help clear things up...",
          "Let’s review what’s relevant here...",
          "Here’s the core idea behind it...",
          "Here’s an informative overview to help you...",
          "Let’s go step-by-step...",
          "This is how I’d explain it simply...",
          "Here’s how this usually plays out...",
          "This is a great topic to dive into. Let’s go!",
          "Let me explain that with an example...",
          "I’ll help break this concept down...",
          "Here's the explanation you’re looking for...",
          "Let’s walk through this together...",
          "Let me clarify that for you...",
          "This might help you see it more clearly...",
          "Here’s a helpful explanation...",
          "Let me shed some light on that...",
          "Here’s a straightforward explanation...",
          "Here’s a breakdown of how that works...",
          "Let’s get into how that functions...",
          "Let’s take a deep dive into that...",
          "Let’s examine the topic thoroughly...",
          "Let’s simplify it to make it clearer...",
          "Here’s what the research says about it...",
          "Let me outline the basics for you...",
          "Here’s a beginner-friendly explanation...",
          "Let me elaborate a little further...",
          "Here’s a detailed guide to help you...",
          "Let me offer a comprehensive view...",
          "Here’s a clear way to look at that...",
          "Here’s a full explanation for clarity...",
          "Let’s break this topic down clearly...",
          "Here’s a direct and simple answer...",
          "Let’s explore the meaning behind it...",
          "Let me rephrase that for better clarity...",
          "Here’s what you should know...",
          "Here’s a good starting point...",
          "Let’s untangle that together...",
          "I’ve got a detailed answer for that...",
          "Let’s unpack that idea...",
          "Let me walk you through the logic...",
          "This might clarify things...",
          "Let’s approach it from the basics...",
        ],
        fr: [
          "Je suis un assistant IA ici pour vous aider. Pourriez-vous fournir plus de détails sur votre question ?",
          "C'est une question intéressante. Voici ce que je peux vous dire sur ce sujet...",
          "Je serais heureux de vous aider avec cela. Tout d'abord, permettez-moi d'expliquer les concepts clés...",
          "Sur la base de mes connaissances, voici les informations que vous recherchez...",
          "Excellente question ! Voici une réponse détaillée pour vous aider à comprendre...",
          "Laissez-moi vous expliquer cela simplement...",
          "Merci pour votre question ! Voici ce que j'ai trouvé...",
          "Voici un aperçu du fonctionnement...",
          "Explorons ce sujet ensemble...",
          "Voici une explication rapide que vous pourriez trouver utile...",
          "Permettez-moi de fournir un peu de contexte...",
          "Voici un guide étape par étape pour clarifier...",
          "Sujet intéressant ! Voici une explication complète...",
          "Voici comment cela fonctionne généralement...",
          "Je comprends votre question. Voici ce que vous devez savoir...",
          "Voyons cela en détail ensemble...",
          "Bien sûr ! Voici une explication utile...",
          "C'est une question courante. Voici la réponse...",
          "Prenons cela étape par étape...",
          "Voici un résumé pour commencer...",
          "Très bon sujet ! Permettez-moi de vous aider à mieux comprendre...",
          "Je peux certainement vous expliquer cela...",
          "Voici ce que cela signifie en termes simples...",
          "Clarifions un peu ce concept...",
          "Voici comment je l'aborderais...",
          "C'est une bonne question. Voici ma réponse...",
          "Examinons les faits autour de cela...",
          "Bonne remarque ! Voici quelques informations utiles...",
          "Je vais essayer d'expliquer cela clairement...",
          "Voici quelques éléments de réponse...",
          "Voici comment cela fonctionne généralement...",
          "Répondons à cette question maintenant...",
          "Je vais faire de mon mieux pour l'expliquer complètement...",
          "Décomposons cela ensemble...",
          "C’est un sujet important. Explorons-le ensemble...",
          "Vous avez bien fait de poser la question. Voici l’explication...",
          "Je suis ici pour vous aider à comprendre. Commençons...",
          "Laissez-moi vous guider à travers cette réponse...",
          "C’est une question pertinente. Voici le contexte...",
          "Je vais vous donner un aperçu concis...",
          "Voici les informations que vous cherchez...",
          "Cette question revient souvent. Regardons cela de plus près...",
          "Examinons ce sujet maintenant...",
          "Revenons sur les points essentiels...",
          "Merci pour cette question ! Voici ce que je peux vous dire...",
          "Vous avez évoqué un bon sujet. Explorons-le ensemble...",
          "Analysons cela davantage...",
          "Voici une manière d'aborder la question...",
          "Permettez-moi de développer un peu...",
          "Dites-moi si cette explication vous convient...",
          "Voici une réponse directe à votre question...",
          "C’est une interrogation intéressante. Voici mon explication...",
          "Décomposons cela en parties plus simples...",
          "Essayons de comprendre cela étape par étape...",
          "Voici un résumé de ce que vous devez savoir...",
          "Simplifions ce concept ensemble...",
          "Je vais vous guider le plus clairement possible...",
          "C’est super que vous soyez curieux ! Voici des infos utiles...",
          "Plongeons dans les détails maintenant...",
          "Voici une explication claire pour vous aider...",
          "Je vais résumer les points importants...",
          "Essayons de mieux comprendre cela...",
          "Voici quelques repères sur le sujet...",
          "Voici comment cela fonctionne en pratique...",
          "Regardons les éléments essentiels...",
          "Voici ce qu’on comprend généralement de cela...",
          "C’est une question classique ! Voici mon avis...",
          "Cela devrait vous éclairer...",
          "Revenons sur ce qui est pertinent ici...",
          "Voici l'idée principale...",
          "Voici une vue d’ensemble informative...",
          "Voyons cela étape par étape...",
          "Voici comment je l’expliquerais simplement...",
          "Voici comment cela se passe en général...",
          "C’est un super sujet à approfondir. Allons-y !",
          "Permettez-moi d’illustrer cela avec un exemple...",
          "Je vais vous aider à comprendre ce concept...",
          "Voici l'explication que vous attendiez...",
          "Examinons cela ensemble...",
          "Permettez-moi de clarifier cela pour vous...",
          "Cela pourrait vous aider à mieux voir...",
          "Voici une explication utile...",
          "Je vais éclaircir ce point...",
          "Voici une réponse simple et directe...",
          "Voici comment cela fonctionne en résumé...",
          "Regardons de plus près ce fonctionnement...",
          "Approfondissons ce sujet...",
          "Examinons ce sujet en profondeur...",
          "Simplifions cela pour le rendre plus clair...",
          "Voici ce que disent les recherches à ce sujet...",
          "Laissez-moi vous exposer les bases...",
          "Voici une explication adaptée aux débutants...",
          "Je vais développer un peu plus...",
          "Voici un guide détaillé pour vous aider...",
          "Permettez-moi de vous donner une vision complète...",
          "Voici une manière claire de voir les choses...",
          "Voici une explication complète pour plus de clarté...",
          "Décomposons ce sujet de manière claire...",
          "Voici une réponse simple et précise...",
          "Explorons la signification de cela...",
          "Je vais reformuler cela pour plus de clarté...",
          "Voici ce qu’il faut savoir...",
          "Voici un bon point de départ...",
          "Essayons de démêler cela ensemble...",
          "J’ai une réponse détaillée pour vous...",
          "Explorons cette idée...",
          "Je vais vous expliquer la logique derrière cela...",
          "Cela devrait rendre les choses plus claires...",
          "Commençons par les bases...",
        ]
      };
      
      const lang = state.isFrench ? "fr" : "en";
      return responses[lang][
        Math.floor(Math.random() * responses[lang].length)
      ];
    }
  
  // Create a new chat
  function createNewChat() {
    const chatId = Date.now().toString();
    const newChat = {
      id: chatId,
      title: state.isFrench ? "Nouvelle discussion" : "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
    };
    state.chats.unshift(newChat);
    state.currentChatId = chatId;
    saveState();
    renderChatList();
    renderChatMessages(newChat.messages);
    elements.currentChatTitle.textContent = newChat.title;
    elements.chatMessages.innerHTML = createWelcomeMessage();
  }
  
  // Load a chat by ID
  function loadChat(chatId) {
    const chat = state.chats.find((c) => c.id === chatId);
    if (!chat) return;
    state.currentChatId = chatId;
    saveState();
    elements.currentChatTitle.textContent = chat.title;
    renderChatMessages(chat.messages);
    document.querySelectorAll(".chat-item").forEach((item) => {
      item.classList.toggle("bg-gray-100", item.dataset.chatId === chatId);
      item.classList.toggle("dark:bg-gray-700", item.dataset.chatId === chatId);
    });
    closeMobileSidebar();
  }
  
  // Delete a chat by ID
  function deleteChat(chatId, e) {
    e.stopPropagation();
    if (state.chats.length <= 1) createNewChat();
    state.chats = state.chats.filter((c) => c.id !== chatId);
    if (state.currentChatId === chatId) {
      state.currentChatId = state.chats[0]?.id || null;
      if (state.currentChatId) loadChat(state.currentChatId);
      else createNewChat();
    }
    saveState();
    renderChatList();
  }
  
  // Add a message to a chat
  function addMessageToChat(chatId, role, content) {
    const chat = state.chats.find((c) => c.id === chatId);
    if (!chat) return;
    const message = { role, content, timestamp: new Date().toISOString() };
    chat.messages.push(message);
    if (chat.messages.length === 1 && role === "user") {
      chat.title =
        content.length > 30 ? content.substring(0, 30) + "..." : content;
      elements.currentChatTitle.textContent = chat.title;
    }
    saveState();
    renderChatMessages(chat.messages);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }
  
  // Render chat list in sidebar
  function renderChatList() {
    if (state.chats.length === 0) {
      elements.chatList.innerHTML = `
        <div class="p-4 text-center text-gray-500 dark:text-gray-400">
          ${
            state.isFrench
              ? translations.fr.noChats
              : translations.en.noChats
          }
        </div>`;
      elements.mobileChatList.innerHTML = elements.chatList.innerHTML;
      return;
    }
    elements.chatList.innerHTML = state.chats
      .map(
        (chat) => `
        <div class="chat-item relative group flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
          state.currentChatId === chat.id
            ? "bg-gray-100 dark:bg-gray-700"
            : ""
        }" data-chat-id="${chat.id}" onclick="loadChat('${chat.id}')">
          <div class="flex-shrink-0 p-1 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400">
            <i class="fas fa-comment-alt text-sm"></i>
          </div>
          <div class="ml-3 flex-1 overflow-hidden">
            <div class="text-sm font-medium truncate">${chat.title}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
              ${
                chat.messages.length > 0
                  ? chat.messages[chat.messages.length - 1].content
                      .substring(0, 30) +
                    (chat.messages[chat.messages.length - 1].content.length > 30
                      ? "..."
                      : "")
                  : state.isFrench
                  ? "Discussion vide"
                  : "Empty chat"
              }
            </div>
          </div>
          <button class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" onclick="deleteChat('${chat.id}', event)">
            <i class="fas fa-trash-alt text-xs"></i>
          </button>
        </div>`
      )
      .join("");
    elements.mobileChatList.innerHTML = elements.chatList.innerHTML;
  }
  
  // Render chat messages
  function renderChatMessages(messages) {
    if (messages.length === 0) {
      elements.chatMessages.innerHTML = createWelcomeMessage();
      return;
    }
  
    elements.chatMessages.innerHTML = messages
      .map((message) => {
        const isUser = message.role === "user";
        const contentHtml = isUser
          ? escapeHtml(message.content).replace(/\n/g, "<br>")
          : formatMarkdown(message.content);
        return `
          <div class="message ${message.role} max-w-3xl mx-auto">
            <div class="flex ${isUser ? "justify-end" : "justify-start"}">
              <div class="${
                isUser
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700"
              } rounded-lg p-3 max-w-[80%]">
                ${contentHtml}
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }
  
  // Create welcome message
  function createWelcomeMessage() {
    return `
      <div class="max-w-3xl mx-auto text-center py-10 fade-in">
        <div class="inline-block p-4 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
          <i class="fas fa-robot text-4xl text-primary-600 dark:text-primary-400"></i>
        </div>
        <h2 class="text-2xl font-bold mb-2">${
          state.isFrench
            ? translations.fr.welcomeTitle
            : translations.en.welcomeTitle
        }</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">${
          state.isFrench
            ? translations.fr.welcomeMessage
            : translations.en.welcomeMessage
        }</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button class="suggestion-btn p-3 bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-left">
            <h3 class="font-medium mb-1">${
              state.isFrench
                ? "Expliquer l'informatique quantique"
                : "Explain quantum computing"
            }</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">${
              state.isFrench ? "En termes simples" : "In simple terms"
            }</p>
          </button>
          <button class="suggestion-btn p-3 bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-left">
            <h3 class="font-medium mb-1">${
              state.isFrench ? "Écrire un poème" : "Write a poem"
            }</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">${
              state.isFrench
                ? "Sur l'intelligence artificielle"
                : "About artificial intelligence"
            }</p>
          </button>
          <button class="suggestion-btn p-3 bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-left">
            <h3 class="font-medium mb-1">${
              state.isFrench ? "Recommandations de voyage" : "Travel recommendations"
            }</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">${
              state.isFrench
                ? "Pour un week-end à Paris"
                : "For a weekend in Paris"
            }</p>
          </button>
        </div>
      </div>`;
  }
  
  // Show typing indicator
  function showTypingIndicator() {
    state.isTyping = true;
    const typingElement = document.createElement("div");
    typingElement.className = "message assistant max-w-3xl mx-auto";
    typingElement.innerHTML = `
      <div class="flex justify-start">
        <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-[80%] typing-indicator">
          ${
            state.isFrench ? translations.fr.typing : translations.en.typing
          }
        </div>
      </div>`;
    elements.chatMessages.appendChild(typingElement);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }
  
  // Remove typing indicator
  function removeTypingIndicator() {
    state.isTyping = false;
    const typingElement =
      elements.chatMessages.querySelector(".typing-indicator");
    if (typingElement) typingElement.parentElement.parentElement.remove();
  }
  
  // Toggle theme
  function toggleTheme() {
    state.isDarkMode = !state.isDarkMode;
    saveState();
    applyTheme();
  }
  
  // Apply theme
  function applyTheme() {
    if (state.isDarkMode) {
      document.documentElement.classList.add("dark");
      elements.themeIcon.className = "fas fa-sun";
    } else {
      document.documentElement.classList.remove("dark");
      elements.themeIcon.className = "fas fa-moon";
    }
  }
  
  // Toggle language
  function toggleLanguage() {
    state.isFrench = !state.isFrench;
    saveState();
    applyLanguage();
  }
  
  // Apply language
  function applyLanguage() {
    const lang = state.isFrench ? "fr" : "en";
    const t = translations[lang];
    elements.languageToggle.textContent = state.isFrench ? "FR" : "EN";
    elements.welcomeTitle.textContent = t.welcomeTitle;
    elements.welcomeMessage.textContent = t.welcomeMessage;
    elements.messageInput.placeholder = t.chatPlaceholder;
    elements.tokenCounter.textContent = `${t.tokensUsed}: ${state.tokensUsed}`;
    elements.modelInfo.textContent = state.settings.provider
      ? `Model: ${
          state.settings.provider.charAt(0).toUpperCase() +
          state.settings.provider.slice(1)
        }`
      : t.modelNotSelected;
    document
      .getElementById("api-key")
      .setAttribute("placeholder", t.apiKeyPlaceholder);
    document
      .getElementById("token-limit")
      .setAttribute("placeholder", t.tokenLimitPlaceholder);
    document
      .querySelectorAll(".temperature-labels span")
      .forEach((span, i) => {
        span.textContent = t.temperatureLabels[i];
      });
    document.getElementById("save-settings").textContent = t.saveSettings;
    renderChatList();
    if (state.currentChatId) {
      const chat = state.chats.find((c) => c.id === state.currentChatId);
      if (chat) renderChatMessages(chat.messages);
    }
  }
  
  // Open settings modal
  function openSettings() {
    if (state.settings.provider) {
      document.getElementById(
        `${state.settings.provider}-provider`
      ).checked = true;
    }
    document.getElementById("api-key").value = state.settings.apiKey;
    document.getElementById("token-limit").value =
      state.settings.tokenLimit;
    document.getElementById("temperature").value =
      state.settings.temperature;
    elements.settingsModal.classList.remove("hidden");
  }
  
  // Close settings modal
  function closeSettings() {
    elements.settingsModal.classList.add("hidden");
  }
  
  // Save settings
  function saveSettings() {
    const provider = document.querySelector(
      'input[name="provider"]:checked'
    )?.value;
    const apiKey = document.getElementById("api-key").value.trim();
    const tokenLimit = parseInt(
      document.getElementById("token-limit").value
    );
    const temperature = parseFloat(
      document.getElementById("temperature").value
    );
    if (provider && !apiKey) {
      alert(
        state.isFrench
          ? "Veuillez entrer une clé API valide"
          : "Please enter a valid API key"
      );
      return;
    }
    state.settings = {
      provider,
      apiKey,
      tokenLimit: Math.min(Math.max(tokenLimit, 100), 10000),
      temperature: Math.min(Math.max(temperature, 0), 1),
    };
    if (provider) {
      elements.modelInfo.textContent = `Model: ${
        provider.charAt(0).toUpperCase() + provider.slice(1)
      }`;
    }
    saveState();
    closeSettings();
  }
  
  // Open mobile sidebar
  function openMobileSidebar() {
    elements.mobileSidebar.classList.remove("hidden");
  }
  
  // Close mobile sidebar
  function closeMobileSidebar() {
    elements.mobileSidebar.classList.add("hidden");
  }
  
  // Expose functions globally
  window.loadChat = loadChat;
  window.deleteChat = deleteChat;
  
  // Initialize on load
  document.addEventListener("DOMContentLoaded", init);
  