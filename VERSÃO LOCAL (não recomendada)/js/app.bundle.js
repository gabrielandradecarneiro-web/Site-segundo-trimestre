"use strict";
(() => {
  // public/js/state.js
  var DEFAULT_STATE = {
    user: null,
    // { id, username, email, role, minecraftName } or null
    token: null,
    // JWT token string or null
    currentLocale: "pt",
    currentView: "landing",
    soundEnabled: true,
    highContrast: false,
    largeText: false,
    audioDescription: false,
    biomeTheme: "forest",
    // 'forest' | 'nether' | 'end'
    selfcareTasks: {},
    // { taskKey: boolean }
    selfcareDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    chatMessages: [],
    friends: [],
    friendRequests: [],
    ventMessages: [],
    quizScore: null,
    quizTotal: null,
    notifications: []
  };
  var STORAGE_KEY = "minecraft-support-app";
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  var _state = clone(DEFAULT_STATE);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const persistedKeys = [
        "user",
        "token",
        "currentView",
        "currentLocale",
        "soundEnabled",
        "highContrast",
        "largeText",
        "audioDescription",
        "biomeTheme",
        "selfcareTasks",
        "selfcareDate"
      ];
      for (const key of persistedKeys) {
        if (key in saved) {
          _state[key] = saved[key];
        }
      }
    }
  } catch (_e) {
  }
  var _subscribers = {};
  var _subscribersAll = [];
  function persist() {
    try {
      const toSave = {
        user: _state.user,
        token: _state.token,
        currentView: _state.currentView,
        soundEnabled: _state.soundEnabled,
        highContrast: _state.highContrast,
        largeText: _state.largeText,
        audioDescription: _state.audioDescription,
        biomeTheme: _state.biomeTheme,
        selfcareTasks: _state.selfcareTasks,
        selfcareDate: _state.selfcareDate
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (_e) {
    }
  }
  function notify(changedKeys) {
    for (const key of changedKeys) {
      if (_subscribers[key]) {
        for (const cb of _subscribers[key]) {
          try {
            cb(_state[key], key);
          } catch (_e) {
          }
        }
      }
    }
    for (const cb of _subscribersAll) {
      try {
        cb(clone(_state), changedKeys);
      } catch (_e) {
      }
    }
  }
  function get(key) {
    return _state[key];
  }
  function set(key, value) {
    _state[key] = value;
    persist();
    notify([key]);
  }
  function setState(updates) {
    const changedKeys = Object.keys(updates);
    for (const key of changedKeys) {
      _state[key] = updates[key];
    }
    persist();
    notify(changedKeys);
  }
  function setAuth(user, token) {
    setState({ user, token });
  }
  function logout() {
    setState({ user: null, token: null, currentView: "landing" });
  }
  function setView(view) {
    set("currentView", view);
  }
  function toggleSound() {
    set("soundEnabled", !_state.soundEnabled);
  }
  function cycleBiomeTheme() {
    const order = ["forest", "nether", "end"];
    const idx = order.indexOf(_state.biomeTheme);
    set("biomeTheme", order[(idx + 1) % order.length]);
  }
  function toggleSelfcareTask(key) {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    if (_state.selfcareDate !== today) {
      setState({ selfcareTasks: { [key]: true }, selfcareDate: today });
      return;
    }
    const updated = { ..._state.selfcareTasks, [key]: !_state.selfcareTasks[key] };
    set("selfcareTasks", updated);
  }
  function addNotification(notification) {
    const item = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      createdAt: Date.now(),
      read: false
    };
    const updated = [item, ..._state.notifications].slice(0, 50);
    set("notifications", updated);
  }
  function clearAllNotifications() {
    set("notifications", []);
  }
  function markNotificationRead(id) {
    const updated = _state.notifications.map(
      (n) => n.id === id ? { ...n, read: true } : n
    );
    set("notifications", updated);
  }
  function addChatMessage(msg) {
    set("chatMessages", [..._state.chatMessages, msg]);
  }
  function setFriends(friends) {
    set("friends", friends);
  }
  function setFriendRequests(requests) {
    set("friendRequests", requests);
  }
  function setVentMessages(msgs) {
    set("ventMessages", msgs);
  }
  function setQuizResult(score, total) {
    setState({ quizScore: score, quizTotal: total });
  }
  function subscribe(key, callback) {
    if (!_subscribers[key]) {
      _subscribers[key] = [];
    }
    _subscribers[key].push(callback);
  }

  // public/js/i18n.js
  var translations = {
    pt: {
      // Nav
      "nav.landing": "In\xEDcio",
      "nav.chatbot": "Chat de Apoio",
      "nav.quiz": "Quiz",
      "nav.friends": "Amigos",
      "nav.vent": "Desabafe",
      "nav.minigame": "Mini Game",
      "nav.login": "Entrar",
      "nav.register": "Cadastrar",
      "nav.admin": "Administra\xE7\xE3o",
      "nav.emergency": "Emerg\xEAncia",
      "nav.accessibility": "Acessibilidade",
      // Landing
      "landing.hero": "Sa\xFAde Mental & Anti-Bullying no Mundo dos Blocos",
      "landing.subtitle": "Um espa\xE7o seguro feito por estudantes, para estudantes",
      "landing.description": "Aqui voc\xEA encontra apoio emocional, informa\xE7\xF5es sobre sa\xFAde mental e ferramentas para lidar com o bullying \u2014 tudo em um ambiente inspirado no Minecraft, onde cada bloco constru\xEDdo \xE9 um passo rumo ao bem-estar.",
      "landing.cta1": "Come\xE7ar Agora",
      "landing.cta2": "Ir para o Painel",
      "landing.cta3": "Explorar",
      "landing.cta4": "Pronto para construir um mundo melhor?",
      "landing.cta5": "Junte-se a milhares de estudantes que j\xE1 encontraram apoio aqui. Sua sa\xFAde mental importa!",
      "landing.features": "O que voc\xEA pode fazer aqui",
      "landing.characters": "Seus aliados nessa jornada",
      "landing.char1": "Como Steve, voc\xEA \xE9 o construtor da sua pr\xF3pria jornada. Cada decis\xE3o \xE9 um bloco novo.",
      "landing.char2": "Alex nos ensina que ser diferente \xE9 uma for\xE7a. Nunca tenha medo de ser quem voc\xEA \xE9.",
      "landing.char3": "Os alde\xF5es mostram que uma comunidade unida \xE9 mais forte que qualquer obst\xE1culo.",
      "landing.char4": "O Golem de Ferro \xE9 o protetor. Assim como ele, existem pessoas prontas para te defender.",
      "landing.stat1": "Suporte Dispon\xEDvel",
      "landing.stat2": "Conversas Seguras",
      "landing.stat3": "Idiomas",
      "landing.stat4": "Divers\xE3o Garantida",
      "landing.feature1Title": "Chatbot de Apoio",
      "landing.feature1Desc": "Converse com nosso assistente virtual MineBot 24h sobre sa\xFAde mental e bullying. Ele est\xE1 sempre pronto para te ouvir.",
      "landing.feature2Title": "Quiz Interativo",
      "landing.feature2Desc": "Teste seus conhecimentos sobre sa\xFAde mental e bullying de forma divertida. Aprenda enquanto joga!",
      "landing.feature3Title": "Encontre Amigos",
      "landing.feature3Desc": "Conecte-se com outros estudantes, fa\xE7a amizades em um ambiente seguro e respeitoso.",
      "landing.feature4Title": "Mini Game",
      "landing.feature4Desc": "Relaxe com nosso mini game inspirado no Minecraft. Um momento de pausa para recarregar!",
      "landing.feature5Title": "Chat de Desabafos",
      "landing.feature5Desc": "Desabafe anonimamente ou se identifique. Este \xE9 um espa\xE7o seguro sem julgamentos.",
      "landing.feature6Title": "Acessibilidade",
      "landing.feature6Desc": "Alto contraste, texto grande e audiodescri\xE7\xE3o. O site se adapta para voc\xEA.",
      // Auth
      "auth.login": "Entrar",
      "auth.register": "Criar Conta",
      "auth.username": "Nome de Usu\xE1rio",
      "auth.email": "E-mail",
      "auth.password": "Senha",
      "auth.confirmPassword": "Confirmar Senha",
      "auth.minecraftName": "Nome no Minecraft",
      "auth.submit": "Enviar",
      "auth.noAccount": "N\xE3o tem uma conta? Cadastre-se",
      "auth.hasAccount": "J\xE1 tem uma conta? Entre",
      "auth.logout": "Sair",
      "auth.adminLogin": "Acesso Admin",
      // Chatbot
      "chatbot.title": "MineBot - Chat de Apoio",
      "chatbot.placeholder": "Digite sua mensagem aqui... Estou aqui para te ouvir \u{1F49A}",
      "chatbot.send": "Enviar",
      "chatbot.suggestions": "Perguntas sugeridas",
      "chatbot.sug1": "Como lidar com a ansiedade?",
      "chatbot.sug2": "O que fazer se sofro bullying?",
      "chatbot.sug3": "Como ajudar um amigo triste?",
      "chatbot.sug4": "Quais sinais de depress\xE3o?",
      "chatbot.sug5": "Como pedir ajuda?",
      "chatbot.sug6": "Exerc\xEDcios de respira\xE7\xE3o",
      "chatbot.welcome": "Ol\xE1! Eu sou o MineBot \u26CF\uFE0F\u{1F916}! Estou aqui para te ajudar sobre sa\xFAde mental e bullying. Como posso te ajudar hoje?",
      "chatbot.typing": "Digitando...",
      "chatbot.processError": "Desculpe, n\xE3o consegui processar sua mensagem. Tente novamente!",
      "chatbot.connectionError": "Erro de conex\xE3o. Verifique sua internet e tente novamente! \u26A0\uFE0F",
      "chatbot.you": "Voc\xEA",
      // Quiz
      "quiz.title": "Quiz de Sa\xFAde Mental e Bullying",
      "quiz.start": "Iniciar Quiz",
      "quiz.next": "Pr\xF3xima",
      "quiz.previous": "Anterior",
      "quiz.finish": "Finalizar",
      "quiz.result": "Resultado do Quiz",
      "quiz.score": "de acerto",
      "quiz.restart": "Refazer Quiz",
      "quiz.submitError": "Erro ao enviar quiz",
      "quiz.q1": "O que \xE9 bullying?",
      "quiz.q1o1": "Uma brincadeira normal entre amigos",
      "quiz.q1o2": "Comportamento agressivo e repetitivo que causa dor a algu\xE9m",
      "quiz.q1o3": "Uma discuss\xE3o pontual entre colegas",
      "quiz.q1o4": "Uma forma de express\xE3o pessoal",
      "quiz.q2": "Qual desses N\xC3O \xE9 um tipo de bullying?",
      "quiz.q2o1": "Bullying verbal (insultos, apelidos)",
      "quiz.q2o2": "Bullying f\xEDsico (bater, empurrar)",
      "quiz.q2o3": "Discutir ideias em um trabalho escolar",
      "quiz.q2o4": "Bullying cibern\xE9tico (cyberbullying)",
      "quiz.q3": "O que fazer se presenciar bullying?",
      "quiz.q3o1": "Fingir que n\xE3o viu",
      "quiz.q3o2": "Gravar e postar nas redes sociais",
      "quiz.q3o3": "Procurar um adulto de confian\xE7a e relatar",
      "quiz.q3o4": "Rir junto para n\xE3o ser o pr\xF3ximo",
      "quiz.q4": "Como apoiar um amigo que sofre bullying?",
      "quiz.q4o1": "Ouvir com empatia e incentivar a buscar ajuda",
      "quiz.q4o2": "Dizer para ignorar e seguir em frente",
      "quiz.q4o3": "Confrontar o agressor agressivamente",
      "quiz.q4o4": "Afastar-se para n\xE3o se envolver",
      "quiz.q5": "O que \xE9 ansiedade?",
      "quiz.q5o1": "Sentir-se triste o tempo todo",
      "quiz.q5o2": "Resposta natural ao estresse que pode se tornar problema",
      "quiz.q5o3": "Falta de vontade de fazer atividades",
      "quiz.q5o4": "Uma doen\xE7a contagiosa",
      "quiz.q6": "Quais s\xE3o sinais de depress\xE3o?",
      "quiz.q6o1": "Ter muita energia sempre",
      "quiz.q6o2": "Tristeza persistente, perda de interesse e isolamento social",
      "quiz.q6o3": "Comer muito em festas",
      "quiz.q6o4": "Gostar de ficar sozinho sempre",
      "quiz.q7": "O n\xFAmero 180 \xE9 para qu\xEA?",
      "quiz.q7o1": "Emerg\xEAncia m\xE9dica (SAMU)",
      "quiz.q7o2": "Pol\xEDcia Militar",
      "quiz.q7o3": "Disque Direitos Humanos - den\xFAncias de viola\xE7\xE3o",
      "quiz.q7o4": "Bombeiros",
      "quiz.q8": "O que \xE9 cyberbullying?",
      "quiz.q8o1": "Bullying praticado atrav\xE9s da internet e redes sociais",
      "quiz.q8o2": "Bullying s\xF3 em jogos online",
      "quiz.q8o3": "Um tipo de v\xEDrus de computador",
      "quiz.q8o4": "Quando algu\xE9m te bate no jogo",
      "quiz.q9": "Qual atitude \xE9 mais saud\xE1vel para a sa\xFAde mental?",
      "quiz.q9o1": "Falar sobre seus sentimentos com algu\xE9m de confian\xE7a",
      "quiz.q9o2": "Guardar tudo para si mesmo",
      "quiz.q9o3": "Pretender que est\xE1 tudo bem",
      "quiz.q9o4": "Isolamento total das pessoas",
      "quiz.q10": "O CVV (Centro de Valoriza\xE7\xE3o da Vida) atende pelo n\xFAmero:",
      "quiz.q10o1": "180",
      "quiz.q10o2": "188",
      "quiz.q10o3": "192",
      "quiz.q10o4": "190",
      "quiz.q11": "Qual \xE9 a principal caracter\xEDstica do cyberbullying?",
      "quiz.q11o1": "Agress\xE3o f\xEDsica",
      "quiz.q11o2": "Uso de meios digitais para assediar",
      "quiz.q11o3": "Roubar pertences",
      "quiz.q11o4": "Espalhar boatos pessoalmente",
      "quiz.q12": "Qual \xE9 uma forma saud\xE1vel de lidar com a raiva?",
      "quiz.q12o1": "Bater na parede",
      "quiz.q12o2": "Ignorar o sentimento",
      "quiz.q12o3": "Exerc\xEDcios de respira\xE7\xE3o e atividade f\xEDsica",
      "quiz.q12o4": "Gritar com algu\xE9m",
      "quiz.q13": "O que \xE9 autoestima?",
      "quiz.q13o1": "Sentir fome o tempo todo",
      "quiz.q13o2": "Como percebemos e valorizamos a n\xF3s mesmos",
      "quiz.q13o3": "Um tipo de exerc\xEDcio f\xEDsico",
      "quiz.q13o4": "Um dist\xFArbio do sono",
      "quiz.q14": "Por que \xE9 importante falar sobre sentimentos?",
      "quiz.q14o1": "Piora os problemas",
      "quiz.q14o2": "As pessoas v\xE3o te julgar",
      "quiz.q14o3": "Ajuda a processar emo\xE7\xF5es e buscar apoio",
      "quiz.q14o4": "N\xE3o \xE9 importante",
      "quiz.q15": "O que \xE9 empatia?",
      "quiz.q15o1": "Sentir pena de algu\xE9m",
      "quiz.q15o2": "A capacidade de entender e compartilhar os sentimentos dos outros",
      "quiz.q15o3": "Concordar com todo mundo",
      "quiz.q15o4": "Ignorar os problemas dos outros",
      "quiz.q16": "Quantas horas de sono s\xE3o recomendadas para adolescentes?",
      "quiz.q16o1": "4-5 horas",
      "quiz.q16o2": "6-7 horas",
      "quiz.q16o3": "8-10 horas",
      "quiz.q16o4": "12+ horas",
      "quiz.q17": "O que \xE9 um espa\xE7o seguro?",
      "quiz.q17o1": "Um lugar sem regras",
      "quiz.q17o2": "Um ambiente onde voc\xEA pode se expressar sem medo de julgamento",
      "quiz.q17o3": "Um quarto trancado",
      "quiz.q17o4": "Apenas para adultos",
      "quiz.q18": "Qual comportamento indica bullying emocional?",
      "quiz.q18o1": "Ajudar um colega",
      "quiz.q18o2": "Excluir algu\xE9m do grupo",
      "quiz.q18o3": "Compartilhar anota\xE7\xF5es",
      "quiz.q18o4": "Brincar juntos",
      "quiz.q19": "O que fazer se um amigo te confiar que est\xE1 sofrendo bullying?",
      "quiz.q19o1": "Ignor\xE1-lo",
      "quiz.q19o2": "Contar para todo mundo na escola",
      "quiz.q19o3": "Ouvir, apoiar e encorajar a buscar ajuda de um adulto",
      "quiz.q19o4": "Culpar a pessoa",
      "quiz.q20": "O que \xE9 resili\xEAncia?",
      "quiz.q20o1": "Desistir quando fica dif\xEDcil",
      "quiz.q20o2": "Evitar todos os desafios",
      "quiz.q20o3": "A capacidade de se recuperar e se adaptar a situa\xE7\xF5es dif\xEDceis",
      "quiz.q20o4": "Nunca ficar triste",
      // Friends
      "friends.title": "Encontre Amigos",
      "friends.search": "Buscar por username...",
      "friends.sendRequest": "Enviar Pedido",
      "friends.pending": "Pedidos Pendentes",
      "friends.accept": "Aceitar",
      "friends.reject": "Recusar",
      "friends.online": "Online",
      "friends.offline": "Offline",
      "friends.message": "Mensagem...",
      "friends.noFriends": "Nenhum amigo ainda. Envie um pedido!",
      "friends.requestMsg": "Mensagem (opcional)",
      "friends.requestSent": "Pedido enviado!",
      "friends.requestAccepted": "Pedido aceito!",
      "friends.requestRejected": "Pedido recusado",
      "friends.openChat": "Abrir Chat",
      // Vent
      "vent.title": "Chat de Desabafos e Den\xFAncias",
      "vent.placeholder": "Desabafe aqui... Este \xE9 um espa\xE7o seguro \u{1F49A}",
      "vent.send": "Enviar",
      "vent.anonymous": "An\xF4nimo",
      "vent.report": "Denunciar",
      "vent.moderated": "\u{1F6AB} Moderado",
      "vent.reportTitle": "Denunciar mensagem",
      "vent.reportPlaceholder": "Motivo da den\xFAncia...",
      "vent.reportSent": "Den\xFAncia enviada",
      "vent.noMessages": "Sem mensagens ainda. Seja o primeiro a desabafar!",
      // Tips
      "tips.title": "Dicas de Sa\xFAde Mental",
      "tips.tip1Title": "Respire Fundo \u{1F32C}\uFE0F",
      "tips.tip1Desc": "Quando sentir ansiedade, pare e fa\xE7a 3 respira\xE7\xF5es profundas. Inspire por 4 segundos, segure por 7 e expire por 8.",
      "tips.tip2Title": "Fale com Algu\xE9m \u{1F5E3}\uFE0F",
      "tips.tip2Desc": "Compartilhar seus sentimentos com algu\xE9m de confian\xE7a alivia o peso emocional. Voc\xEA n\xE3o precisa carregar tudo sozinho.",
      "tips.tip3Title": "Pausa Digital \u{1F4F5}",
      "tips.tip3Desc": "Fa\xE7a pausas regulares das redes sociais. O mundo offline tamb\xE9m \xE9 cheio de coisas bonitas para explorar.",
      "tips.tip4Title": "Cuide do Corpo \u{1F4AA}",
      "tips.tip4Desc": "Dormir bem, comer de forma saud\xE1vel e se movimentar fazem diferen\xE7a enorme na sua sa\xFAde mental.",
      "tips.breathStart": "Iniciar Exerc\xEDcio",
      "tips.inhale": "Inspire",
      "tips.hold": "Segure",
      "tips.exhale": "Expire",
      // Mood Tracker
      "mood.title": "Como voc\xEA est\xE1 hoje?",
      "mood.select": "Selecione seu humor:",
      "mood.happy": "\u{1F60A} Feliz",
      "mood.sad": "\u{1F622} Triste",
      "mood.anxious": "\u{1F630} Ansioso(a)",
      "mood.angry": "\u{1F624} Irritado(a)",
      "mood.calm": "\u{1F60C} Calmo(a)",
      "mood.tired": "\u{1F634} Cansado(a)",
      "mood.save": "Salvar Humor",
      "mood.history": "Hist\xF3rico",
      "mood.today": "Hoje",
      "mood.noData": "Sem dados ainda. Comece registrando seu humor!",
      "mood.encouragement": "Continue assim! Cuidar da sa\xFAde mental \xE9 um ato de coragem.",
      // Minigame
      "minigame.title": "MentalCraft Runner",
      "minigame.start": "Jogar",
      "minigame.score": "pontos",
      "minigame.gameOver": "Fim de Jogo!",
      "minigame.playAgain": "Jogar Novamente",
      "minigame.instructions": "Use as setas ou WASD para mover e pular. Colete os itens para pontuar!",
      // Admin
      "admin.title": "Administra\xE7\xE3o",
      "admin.users": "Usu\xE1rios",
      "admin.reports": "Den\xFAncias",
      "admin.messages": "Mensagens",
      "admin.moderate": "Moderar",
      "admin.ban": "Banir",
      "admin.unban": "Desbanir",
      "admin.approve": "Aprovar",
      "admin.reject": "Rejeitar",
      "admin.resolve": "Resolver",
      "admin.panelTitle": "Painel do Administrador",
      "admin.reportsTitle": "Den\xFAncias",
      "admin.usersTitle": "Usu\xE1rios",
      "admin.messagesTitle": "Mensagens",
      "admin.back": "\u2190 Voltar",
      "admin.noReports": "Nenhuma den\xFAncia",
      "admin.by": "Por:",
      "admin.unknown": "Desconhecido",
      "admin.adminNotes": "Notas do admin...",
      "admin.review": "\u{1F440} Revisar",
      "admin.userBanned": "Usu\xE1rio banido",
      "admin.userUnbanned": "Usu\xE1rio desbanido",
      "admin.status": "Status",
      "admin.actions": "A\xE7\xF5es",
      "admin.actionDone": "A\xE7\xE3o realizada",
      "admin.ventMessages": "Mensagens do Chat de Desabafos",
      "admin.moderated": "Moderado",
      // Emergency
      "emergency.title": "N\xFAmeros de Emerg\xEAncia",
      "emergency.call180": "Direitos Humanos",
      "emergency.call192": "SAMU",
      "emergency.call190": "Pol\xEDcia",
      "emergency.description180": "Disque Direitos Humanos - Viol\xEAncia",
      "emergency.description192": "SAMU - Emerg\xEAncia M\xE9dica",
      "emergency.description190": "Pol\xEDcia Militar - Emerg\xEAncia",
      "emergency.description188": "CVV - Centro de Valoriza\xE7\xE3o da Vida",
      // Footer
      "footer.links": "Links R\xE1pidos",
      // Accessibility
      "accessibility.title": "Acessibilidade",
      "accessibility.desc": "Personalize a experi\xEAncia do site para suas necessidades.",
      "accessibility.highContrast": "Alto Contraste",
      "accessibility.highContrastDesc": "Aumenta o contraste para melhor legibilidade",
      "accessibility.largeText": "Texto Grande",
      "accessibility.largeTextDesc": "Aumenta o tamanho de todos os textos",
      "accessibility.audioDescription": "Audiodescri\xE7\xE3o",
      "accessibility.audioDescDesc": "Ativa narra\xE7\xE3o \xE1udio do conte\xFAdo",
      "accessibility.reset": "Redefinir Tudo",
      // Errors
      "errors.loginRequired": "Fa\xE7a login para acessar!",
      "errors.passwordMismatch": "As senhas n\xE3o coincidem!",
      "errors.connectionError": "Erro de conex\xE3o",
      "errors.requestError": "Erro ao processar solicita\xE7\xE3o",
      // Common
      "common.loading": "Carregando...",
      "common.error": "Erro",
      "common.success": "Sucesso!",
      "common.cancel": "Cancelar",
      "common.save": "Salvar",
      "common.delete": "Deletar",
      "common.close": "Fechar",
      "common.back": "Voltar",
      "common.welcome": "Bem-vindo(a)",
      "common.language": "Idioma",
      "nav.achievements": "Conquistas",
      "nav.resources": "Recursos",
      "achievements.title": "Conquistas",
      "achievements.subtitle": "Colete conquistas explorando o MentalCraft",
      "achievements.unlocked": "Desbloqueadas",
      "achievements.total": "Total",
      "achievements.locked": "Bloqueada",
      "achievements.newUnlocked": "Nova conquista desbloqueada!",
      "achievements.rarity.common": "Comum",
      "achievements.rarity.uncommon": "Incomum",
      "achievements.rarity.rare": "Raro",
      "achievements.rarity.epic": "\xC9pico",
      "achievements.rarity.legendary": "Lend\xE1rio",
      "achievements.progress": "Progresso",
      "resources.title": "Recursos de Sa\xFAde Mental",
      "resources.subtitle": "Materiais \xFAteis sobre sa\xFAde mental e bem-estar",
      "resources.category.anxiety": "Ansiedade",
      "resources.category.depression": "Depress\xE3o",
      "resources.category.bullying": "Bullying",
      "resources.category.selfesteem": "Autoestima",
      "resources.category.sleep": "Sono",
      "resources.category.stress": "Estresse",
      "resources.readMore": "Saiba Mais",
      "dashboard.dailyTip": "Dica do Dia",
      "dashboard.moodStreak": "Sequ\xEAncia de Humor",
      "dashboard.achievementShowcase": "Conquistas Recentes",
      "dashboard.viewAll": "Ver Todas",
      "dashboard.noAchievements": "Nenhuma conquista ainda. Comece a explorar!",
      "nav.profile": "Perfil",
      "profile.title": "Meu Perfil",
      "profile.stats": "Estat\xEDsticas",
      "profile.joined": "Membro desde",
      "profile.mcName": "Nome no Minecraft",
      "profile.role": "Cargo",
      "profile.quizBest": "Melhor Quiz",
      "profile.moodEntries": "Registros de Humor",
      "profile.friends": "Amigos",
      "profile.achievements": "Conquistas",
      "profile.recentActivity": "Atividade Recente",
      "profile.noActivity": "Nenhuma atividade recente",
      "profile.editProfile": "Editar Perfil",
      "profile.changeMcName": "Alterar Nome Minecraft",
      "profile.save": "Salvar",
      "profile.cancel": "Cancelar",
      "game.lives": "Vidas",
      "game.level": "N\xEDvel",
      "game.powerup": "Power-up",
      "game.shield": "Escudo",
      "game.speed": "Velocidade",
      "game.magnet": "\xCDm\xE3",
      "game.enemy": "Inimigo",
      "game.newHighScore": "Novo Recorde!",
      "game.points": "pontos",
      // Nav extras
      "nav.journal": "Di\xE1rio",
      "nav.soundEffects": "Efeitos Sonoros",
      // Landing extras
      "landing.feature7Title": "Di\xE1rio Pessoal",
      "landing.feature7Desc": "Escreva sobre seus sentimentos diariamente",
      "landing.feature8Title": "Efeitos Sonoros",
      "landing.feature8Desc": "Sons imersivos do Minecraft",
      // Common extras
      "common.goodbye": "At\xE9 logo!",
      // Profile extras
      "profile.admin": "Admin",
      "profile.player": "Jogador",
      // Mood extras
      "mood.dashboardDesc": "Acompanhe seu humor di\xE1rio e veja padr\xF5es",
      "mood.chartTitle": "Gr\xE1fico de Humor",
      "mood.last7Days": "\xDAltimos 7 dias",
      "mood.moodTrend": "Tend\xEAncia",
      // Accessibility extras
      "accessibility.soundEffects": "Efeitos Sonoros",
      "accessibility.soundEffectsDesc": "Ative sons do Minecraft para intera\xE7\xF5es",
      // Journal
      "journal.title": "Meu Di\xE1rio",
      "journal.subtitle": "Escreva sobre seus sentimentos",
      "journal.prompt": "Como voc\xEA se sente hoje? O que aconteceu de bom?",
      "journal.save": "Salvar Entrada",
      "journal.saved": "Entrada salva!",
      "journal.entries": "Entradas Anteriores",
      "journal.noEntries": "Nenhuma entrada ainda. Comece a escrever!",
      "journal.delete": "Excluir",
      "journal.confirmDelete": "Tem certeza?",
      // Sound
      "sound.click": "Clique",
      "sound.success": "Sucesso",
      "sound.error": "Erro",
      "sound.achievement": "Conquista",
      "sound.ambient": "Ambiente",
      // Notifications
      "notifications.title": "Notifica\xE7\xF5es",
      "notifications.noNotifications": "Nenhuma notifica\xE7\xE3o",
      "notifications.markRead": "Marcar como lida",
      "notifications.friendRequest": "solicitou amizade",
      "notifications.achievementUnlock": "Conquista desbloqueada:",
      "notifications.clearAll": "Limpar tudo",
      // Dashboard extras
      "dashboard.notificationBadge": "notifica\xE7\xF5es",
      "dashboard.journalDesc": "Escreva sobre seus sentimentos",
      "dashboard.soundDesc": "Configure efeitos sonoros",
      // Biome Theme
      "biome.title": "Bioma Tem\xE1tico",
      "biome.forest": "\u{1F33F} Floresta",
      "biome.nether": "\u{1F525} Nether",
      "biome.end": "\u2728 The End",
      "biome.desc": "Mude a apar\xEAncia do site",
      // Pomodoro Timer
      "pomodoro.title": "Pomodoro Timer",
      "pomodoro.focus": "Foco",
      "pomodoro.break": "Pausa",
      "pomodoro.start": "Iniciar",
      "pomodoro.pause": "Pausar",
      "pomodoro.reset": "Reiniciar",
      "pomodoro.sessions": "Sess\xF5es hoje",
      "pomodoro.focusTip": "Foque em uma tarefa por 25 minutos",
      "pomodoro.breakTip": "Descanse por 5 minutos",
      "pomodoro.completed": "Sess\xE3o completa! Parab\xE9ns! \u26CF\uFE0F",
      // Daily Challenges
      "challenges.title": "Desafio Di\xE1rio",
      "challenges.subtitle": "Complete o desafio de hoje para ganhar XP",
      "challenges.completed": "Desafio conclu\xEDdo! \u2705",
      "challenges.xpReward": "+50 XP Recompensa",
      "challenges.streak": "Sequ\xEAncia de desafios",
      "challenges.days": "dias",
      "challenges.markDone": "Marcar como conclu\xEDdo",
      "challenges.history": "Hist\xF3rico",
      "challenges.ch1": "Escreva 3 coisas pelas quais voc\xEA \xE9 grato",
      "challenges.ch2": "Fa\xE7a uma caminhada de 10 minutos",
      "challenges.ch3": "Converse com algu\xE9m que voc\xEA n\xE3o falou h\xE1 tempo",
      "challenges.ch4": "Pratique 5 minutos de medita\xE7\xE3o",
      "challenges.ch5": "Desligue o celular por 1 hora",
      "challenges.ch6": "Crie algo: desenhe, escreva ou cante",
      "challenges.ch7": "Fa\xE7a algu\xE9m sorrir hoje",
      // Self-Care Checklist
      "selfcare.title": "Checklist de Autocuidado",
      "selfcare.subtitle": "Marque as tarefas que voc\xEA completou hoje",
      "selfcare.progress": "Progresso de hoje",
      "selfcare.completed": "Tarefas conclu\xEDdas",
      "selfcare.allDone": "Todas as tarefas conclu\xEDdas! Voc\xEA \xE9 incr\xEDvel! \u{1F31F}",
      "selfcare.t1": "\u{1F4A1} Bebi \xE1gua suficiente",
      "selfcare.t2": "\u{1F634} Durmi bem (7+ horas)",
      "selfcare.t3": "\u{1F6B6} Fiz alguma atividade f\xEDsica",
      "selfcare.t4": "\u{1F4F1} Limitei tempo de tela",
      "selfcare.t5": "\u{1F9D8} Pratiquei respira\xE7\xE3o/medita\xE7\xE3o",
      "selfcare.t6": "\u{1F91D} Conversei com algu\xE9m",
      "selfcare.t7": "\u{1F4DD} Escrevi no di\xE1rio",
      "selfcare.t8": "\u{1F60A} Fiz algo que me trouxe alegria",
      // Nav extras
      "nav.pomodoro": "Pomodoro",
      "nav.challenges": "Desafios",
      "nav.selfcare": "Autocuidado",
      "nav.breathing": "Respira\xE7\xE3o",
      "nav.gratitude": "Gratid\xE3o",
      "nav.affirmations": "Afirma\xE7\xF5es",
      "breathing.title": "Exerc\xEDcio de Respira\xE7\xE3o",
      "breathing.pattern478": "4-7-8 Relaxante",
      "breathing.patternBox": "Quadrado (4-4-4-4)",
      "breathing.patternCalm": "Calma (4-0-6)",
      "breathing.inhale": "Inspire...",
      "breathing.hold": "Segure...",
      "breathing.exhale": "Expire...",
      "breathing.inhaleDesc": "Respire lentamente pelo nariz",
      "breathing.holdDesc": "Mantenha o ar nos pulm\xF5es",
      "breathing.exhaleDesc": "Solte o ar lentamente pela boca",
      "breathing.start": "Come\xE7ar Exerc\xEDcio",
      "breathing.stop": "Parar",
      "breathing.cycles": "ciclos completos",
      "breathing.tip1": "Sente-se confortavelmente com a coluna reta antes de come\xE7ar",
      "breathing.tip2": "Feche os olhos e foque apenas na sua respira\xE7\xE3o",
      "breathing.tip3": "Se perder a concentra\xE7\xE3o, volte gentilmente ao ritmo",
      "breathing.tip4": "Pratique diariamente para melhores resultados",
      "gratitude.title": "Mural de Gratid\xE3o",
      "gratitude.prompt": "O que voc\xEA \xE9 grato hoje? Compartilhe sua gratid\xE3o!",
      "gratitude.placeholder": "Escreva algo pelo qual voc\xEA \xE9 grato...",
      "gratitude.post": "Postar",
      "gratitude.empty": "Nenhuma gratid\xE3o ainda. Seja o primeiro a compartilhar!",
      "affirm.title": "Afirma\xE7\xF5es Di\xE1rias",
      "affirm.a1": "Eu sou forte e capaz de superar qualquer desafio, como um minerador enfrentando o Nether.",
      "affirm.a2": "Mere\xE7o respeito, bondade e um lugar seguro no mundo.",
      "affirm.a3": "Cada dia \xE9 uma nova oportunidade de construir algo incr\xEDvel.",
      "affirm.a4": "Meus sentimentos s\xE3o v\xE1lidos e importantes.",
      "affirm.a5": "Eu sou suficiente exatamente como sou.",
      "affirm.a6": "Posso pedir ajuda quando precisar \u2014 isso \xE9 coragem, n\xE3o fraqueza.",
      "affirm.a7": "O crescimento acontece um bloco de cada vez.",
      "affirm.a8": "Mere\xE7o viver em paz e seguran\xE7a.",
      "affirm.a9": "Eu tenho o poder de criar mudan\xE7as positivas na minha vida.",
      "affirm.a10": "Cada desafio me torna mais forte e mais s\xE1bio.",
      "affirm.a11": "Eu sou uma pessoa valiosa e mere\xE7o ser tratada com bondade.",
      "affirm.a12": "Meu valor n\xE3o \xE9 definido pelo que os outros pensam de mim.",
      "affirm.catSelf": "Autoestima",
      "affirm.catStrength": "For\xE7a Interior",
      "affirm.catGrowth": "Crescimento",
      "affirm.favorites": "Favoritos",
      "affirm.showAll": "Ver Todas",
      "affirm.hideAll": "Ocultar Lista",
      // Coping, Safety Plan, Leaderboard, Mood Insights, Dashboard additions
      "nav.coping": "Caixa de Ferramentas",
      "nav.safetyPlan": "Plano de Seguran\xE7a",
      "nav.leaderboard": "Placar",
      "nav.moodInsights": "Insights do Humor",
      "coping.title": "Estrat\xE9gias de Enfrentamento",
      "coping.subtitle": "Ferramentas para ajudar em momentos dif\xEDceis",
      "coping.all": "Todos",
      "coping.breathing": "Respira\xE7\xE3o",
      "coping.grounding": "Aterramento",
      "coping.positiveThinking": "Pensamento Positivo",
      "coping.physical": "F\xEDsico",
      "coping.social": "Social",
      "coping.creative": "Criativo",
      "coping.tryNow": "Experimentar",
      "coping.steps": "Passos",
      "coping.step": "Passo",
      "coping.favorite": "Salvar nos Favoritos",
      "coping.unfavorite": "Remover dos Favoritos",
      "coping.favorites": "Favoritos",
      "coping.noFavorites": "Sem estrat\xE9gias favoritas ainda",
      "coping.count": "estrat\xE9gias",
      "coping.s1Title": "Respira\xE7\xE3o 4-7-8",
      "coping.s1Desc": "T\xE9cnica de respira\xE7\xE3o para acalmar a mente rapidamente",
      "coping.s1Steps": "1. Inspire por 4 segundos|2. Segure por 7 segundos|3. Expire por 8 segundos|4. Repita 4 vezes",
      "coping.s2Title": "Respira\xE7\xE3o Diafragm\xE1tica",
      "coping.s2Desc": "Respire profundamente usando o diafragma para relaxar",
      "coping.s2Steps": "1. Coloque a m\xE3o no abdomen|2. Inspire lentamente pelo nariz|3. Sinta o abdomen expandir|4. Expire pela boca lentamente|5. Repita 10 vezes",
      "coping.s3Title": "Respira\xE7\xE3o Quadrada",
      "coping.s3Desc": "Respira\xE7\xE3o r\xEDtmica para equilibrar corpo e mente",
      "coping.s3Steps": "1. Inspire por 4 segundos|2. Segure por 4 segundos|3. Expire por 4 segundos|4. Segure vazio por 4 segundos|5. Repita 5 ciclos",
      "coping.s4Title": "T\xE9cnica 5-4-3-2-1",
      "coping.s4Desc": "Use seus sentidos para se concentrar no presente",
      "coping.s5Title": "Nomeie 5 Coisas",
      "coping.s5Desc": "Liste coisas que voc\xEA pode ver ao seu redor para se aterrar",
      "coping.s6Title": "Reestrutura\xE7\xE3o de Pensamentos",
      "coping.s6Desc": "Transforme pensamentos negativos em positivos",
      "coping.s7Title": "Refr\xE3es Positivos",
      "coping.s7Desc": "Repita frases positivas para fortalecer a autoestima",
      "coping.s8Title": "Caminhada Consciente",
      "coping.s8Desc": "Caminhe prestando aten\xE7\xE3o aos seus passos e \xE0 respira\xE7\xE3o",
      "coping.s9Title": "Alongamento R\xE1pido",
      "coping.s9Desc": "Alongue o corpo para liberar tens\xE3o f\xEDsica",
      "coping.s10Title": "Conversar com Algu\xE9m",
      "coping.s10Desc": "Fale com uma pessoa de confian\xE7a sobre como voc\xEA se sente",
      "coping.s11Title": "Pedir Ajuda a um Adulto",
      "coping.s11Desc": "Procure um adulto de confian\xE7a quando precisar de suporte",
      "coping.s12Title": "Desenhar ou Pintar",
      "coping.s12Desc": "Use a arte para expressar suas emo\xE7\xF5es",
      "safety.title": "Meu Plano de Seguran\xE7a",
      "safety.subtitle": "Crie um plano pessoal para se manter seguro",
      "safety.create": "Criar Plano",
      "safety.edit": "Editar Plano",
      "safety.save": "Salvar Plano",
      "safety.saved": "Plano salvo com sucesso!",
      "safety.step1Title": "Meus Sinais de Alerta",
      "safety.step1Desc": "Que pensamentos ou sentimentos me dizem que preciso de ajuda",
      "safety.step1Placeholder": "Ex: Eu me sinto sobrecarregado, quero ficar sozinho...",
      "safety.step2Title": "Minhas Estrat\xE9gias de Enfrentamento",
      "safety.step2Desc": "Coisas que posso fazer para me sentir melhor",
      "safety.step2Placeholder": "Ex: Respira\xE7\xE3o profunda, Conversar com um amigo, Ouvir m\xFAsica...",
      "safety.step3Title": "Pessoas em Quem Confio",
      "safety.step3Desc": "Pessoas que posso procurar para apoio",
      "safety.step3Placeholder": "Ex: Mam\xE3e: 55-11-99999-0000, Professora Maria...",
      "safety.step4Title": "Lugares Seguros",
      "safety.step4Desc": "Lugares onde me sinto calmo e seguro",
      "safety.step4Placeholder": "Ex: Biblioteca da escola, Meu quarto, O parque...",
      "safety.noPlan": "Voc\xEA ainda n\xE3o criou um plano de seguran\xE7a.",
      "safety.noPlanDesc": "Criar um plano de seguran\xE7a ajuda a saber o que fazer quando se sentir inseguro.",
      "safety.completed": "Seu plano de seguran\xE7a est\xE1 pronto! Guarde em um lugar acess\xEDvel.",
      "safety.addSign": "Adicionar sinal de alerta",
      "safety.addContact": "Adicionar contato",
      "safety.addPlace": "Adicionar lugar",
      "leaderboard.title": "Placar",
      "leaderboard.subtitle": "Melhores jogadores no mundo Minecraft",
      "leaderboard.rank": "Posi\xE7\xE3o",
      "leaderboard.player": "Jogador",
      "leaderboard.score": "Pontua\xE7\xE3o",
      "leaderboard.level": "N\xEDvel",
      "leaderboard.you": "Voc\xEA",
      "leaderboard.noEntries": "Sem registros ainda. Jogue para entrar no placar!",
      "leaderboard.topScore": "Sua Melhor Pontua\xE7\xE3o",
      "leaderboard.submitScore": "Enviar Pontua\xE7\xE3o",
      "insights.title": "Insights do Humor",
      "insights.subtitle": "Entenda seus padr\xF5es emocionais",
      "insights.totalEntries": "Total de Registros",
      "insights.avgPerDay": "M\xE9dia/Dia",
      "insights.currentStreak": "Sequ\xEAncia Atual",
      "insights.longestStreak": "Maior Sequ\xEAncia",
      "insights.trend": "Tend\xEAncia",
      "insights.improving": "Melhorando",
      "insights.stable": "Est\xE1vel",
      "insights.declining": "Precisa de Aten\xE7\xE3o",
      "insights.weeklyAverage": "M\xE9dia Semanal",
      "insights.noData": "Comece a rastrear seu humor para ver insights aqui!",
      "insights.days": "dias",
      "dashboard.copingDesc": "Estrat\xE9gias para momentos dif\xEDceis",
      "dashboard.safetyPlanDesc": "Seu plano de seguran\xE7a pessoal",
      "dashboard.leaderboardDesc": "Melhores pontua\xE7\xF5es do jogo",
      "dashboard.moodInsightsDesc": "Seus padr\xF5es emocionais",
      // StudyHelp
      "nav.studyHelp": "Estudos",
      "nav.more": "Mais",
      "studyHelp.title": "\u{1F4D6} Aux\xEDlio de Estudos",
      "studyHelp.subtitle": "Banco de quest\xF5es para diferentes anos do Ensino M\xE9dio",
      "studyHelp.selectYear": "Selecione o Ano",
      "studyHelp.selectSubject": "Selecione a Mat\xE9ria",
      "studyHelp.start": "Iniciar Quiz",
      "studyHelp.correct": "Correto! \u2705",
      "studyHelp.wrong": "Incorreto \u274C",
      "studyHelp.score": "Pontua\xE7\xE3o",
      "studyHelp.next": "Pr\xF3xima",
      "studyHelp.finish": "Finalizar",
      "studyHelp.year1": "1\xBA Ano",
      "studyHelp.year2": "2\xBA Ano",
      "studyHelp.year3": "3\xBA Ano",
      "studyHelp.math": "Matem\xE1tica",
      "studyHelp.portuguese": "Portugu\xEAs",
      "studyHelp.science": "Ci\xEAncias",
      "studyHelp.history": "Hist\xF3ria",
      "studyHelp.geography": "Geografia",
      "studyHelp.of": "de",
      "studyHelp.question": "Quest\xE3o",
      "studyHelp.noQuestions": "Nenhuma quest\xE3o dispon\xEDvel para esta combina\xE7\xE3o.",
      "studyHelp.results": "Resultado Final",
      "studyHelp.perfect": "Perfeito! Voc\xEA domina o conte\xFAdo! \u{1F3C6}",
      "studyHelp.great": "Muito bem! Continue assim! \u2B50",
      "studyHelp.good": "Bom trabalho! Revise os pontos errados. \u{1F4DA}",
      "studyHelp.needsWork": "Continue estudando! Voc\xEA consegue! \u{1F4AA}",
      "studyHelp.restart": "Tentar Novamente",
      "studyHelp.back": "Voltar"
    },
    en: {
      "nav.landing": "Home",
      "nav.chatbot": "Support Chat",
      "nav.quiz": "Quiz",
      "nav.friends": "Friends",
      "nav.vent": "Vent",
      "nav.minigame": "Mini Game",
      "nav.login": "Login",
      "nav.register": "Register",
      "nav.admin": "Admin",
      "nav.emergency": "Emergency",
      "nav.accessibility": "Accessibility",
      "landing.hero": "Mental Health & Anti-Bullying in the World of Blocks",
      "landing.subtitle": "A safe space made by students, for students",
      "landing.description": "Find emotional support, mental health information, and tools to deal with bullying \u2014 all in a Minecraft-inspired environment where every block built is a step toward well-being.",
      "landing.cta1": "Get Started",
      "landing.cta2": "Go to Dashboard",
      "landing.cta3": "Explore",
      "landing.cta4": "Ready to build a better world?",
      "landing.cta5": "Join thousands of students who have already found support here. Your mental health matters!",
      "landing.features": "What you can do here",
      "landing.characters": "Your allies on this journey",
      "landing.char1": "Like Steve, you are the builder of your own journey. Every decision is a new block.",
      "landing.char2": "Alex teaches us that being different is a strength. Never be afraid to be who you are.",
      "landing.char3": "Villagers show that a united community is stronger than any obstacle.",
      "landing.char4": "The Iron Golem is the protector. Just like it, there are people ready to defend you.",
      "landing.stat1": "Support Available",
      "landing.stat2": "Safe Conversations",
      "landing.stat3": "Languages",
      "landing.stat4": "Fun Guaranteed",
      "landing.feature1Title": "Support Chatbot",
      "landing.feature1Desc": "Chat with our MineBot virtual assistant 24/7 about mental health and bullying.",
      "landing.feature2Title": "Interactive Quiz",
      "landing.feature2Desc": "Test your knowledge about mental health and bullying in a fun way!",
      "landing.feature3Title": "Find Friends",
      "landing.feature3Desc": "Connect with other students in a safe and respectful environment.",
      "landing.feature4Title": "Mini Game",
      "landing.feature4Desc": "Relax with our Minecraft-inspired mini game. Take a break to recharge!",
      "landing.feature5Title": "Vent Chat",
      "landing.feature5Desc": "Vent anonymously or identify yourself. This is a safe space without judgment.",
      "landing.feature6Title": "Accessibility",
      "landing.feature6Desc": "High contrast, large text, and audio description. The site adapts for you.",
      "auth.login": "Login",
      "auth.register": "Create Account",
      "auth.username": "Username",
      "auth.email": "Email",
      "auth.password": "Password",
      "auth.confirmPassword": "Confirm Password",
      "auth.minecraftName": "Minecraft Name",
      "auth.submit": "Submit",
      "auth.noAccount": "Don't have an account? Register",
      "auth.hasAccount": "Already have an account? Login",
      "auth.logout": "Logout",
      "auth.adminLogin": "Admin Access",
      "chatbot.title": "MineBot - Support Chat",
      "chatbot.placeholder": "Type your message here... I'm here to listen \u{1F49A}",
      "chatbot.send": "Send",
      "chatbot.suggestions": "Suggested questions",
      "chatbot.sug1": "How to deal with anxiety?",
      "chatbot.sug2": "What to do if I'm being bullied?",
      "chatbot.sug3": "How to help a sad friend?",
      "chatbot.sug4": "What are signs of depression?",
      "chatbot.sug5": "How to ask for help?",
      "chatbot.sug6": "Breathing exercises",
      "chatbot.welcome": "Hello! I'm MineBot \u26CF\uFE0F\u{1F916}! I'm here to help you with mental health and bullying. How can I help you today?",
      "chatbot.typing": "Typing...",
      "chatbot.processError": "Sorry, I couldn't process your message. Please try again!",
      "chatbot.connectionError": "Connection error. Check your internet and try again! \u26A0\uFE0F",
      "chatbot.you": "You",
      "quiz.title": "Mental Health & Bullying Quiz",
      "quiz.start": "Start Quiz",
      "quiz.next": "Next",
      "quiz.previous": "Previous",
      "quiz.finish": "Finish",
      "quiz.result": "Quiz Result",
      "quiz.score": "correct",
      "quiz.restart": "Retake Quiz",
      "quiz.submitError": "Error submitting quiz",
      "quiz.q1": "What is bullying?",
      "quiz.q1o1": "Normal joking between friends",
      "quiz.q1o2": "Aggressive and repetitive behavior that causes pain to someone",
      "quiz.q1o3": "A one-time argument between classmates",
      "quiz.q1o4": "A form of self-expression",
      "quiz.q2": "Which of these is NOT a type of bullying?",
      "quiz.q2o1": "Verbal bullying (insults, nicknames)",
      "quiz.q2o2": "Physical bullying (hitting, pushing)",
      "quiz.q2o3": "Discussing ideas in a school project",
      "quiz.q2o4": "Cyberbullying (offensive online messages)",
      "quiz.q3": "What should you do if you witness bullying?",
      "quiz.q3o1": "Pretend you did not see it",
      "quiz.q3o2": "Record and post on social media",
      "quiz.q3o3": "Find a trusted adult and report it",
      "quiz.q3o4": "Laugh along to avoid being the next target",
      "quiz.q4": "How to support a friend experiencing bullying?",
      "quiz.q4o1": "Listen with empathy and encourage them to seek help",
      "quiz.q4o2": "Tell them to ignore it and move on",
      "quiz.q4o3": "Confront the aggressor aggressively",
      "quiz.q4o4": "Stay away to avoid getting involved",
      "quiz.q5": "What is anxiety?",
      "quiz.q5o1": "Feeling sad all the time",
      "quiz.q5o2": "Natural stress response that can become a problem",
      "quiz.q5o3": "Lack of desire to do activities",
      "quiz.q5o4": "A contagious disease",
      "quiz.q6": "What are signs of depression?",
      "quiz.q6o1": "Having lots of energy all the time",
      "quiz.q6o2": "Persistent sadness, loss of interest, and social isolation",
      "quiz.q6o3": "Eating a lot at parties",
      "quiz.q6o4": "Always liking to be alone",
      "quiz.q7": "What is the 180 number for?",
      "quiz.q7o1": "Medical emergency (SAMU)",
      "quiz.q7o2": "Military Police",
      "quiz.q7o3": "Human Rights Hotline - rights violation reports",
      "quiz.q7o4": "Firefighters",
      "quiz.q8": "What is cyberbullying?",
      "quiz.q8o1": "Bullying through the internet and social media",
      "quiz.q8o2": "Bullying only in online games",
      "quiz.q8o3": "A type of computer virus",
      "quiz.q8o4": "When someone hits you in a game",
      "quiz.q9": "Which attitude is healthiest for mental health?",
      "quiz.q9o1": "Talking about your feelings with someone you trust",
      "quiz.q9o2": "Keeping everything to yourself",
      "quiz.q9o3": "Pretending everything is fine",
      "quiz.q9o4": "Total isolation from people",
      "quiz.q10": "The CVV (Center for the Valorization of Life) can be reached at:",
      "quiz.q10o1": "180",
      "quiz.q10o2": "188",
      "quiz.q10o3": "192",
      "quiz.q10o4": "190",
      "quiz.q11": "What is the main characteristic of cyberbullying?",
      "quiz.q11o1": "Physical aggression",
      "quiz.q11o2": "Use of digital media to harass",
      "quiz.q11o3": "Stealing belongings",
      "quiz.q11o4": "Spreading rumors face-to-face",
      "quiz.q12": "Which of these is a healthy way to deal with anger?",
      "quiz.q12o1": "Punching a wall",
      "quiz.q12o2": "Ignoring the feeling",
      "quiz.q12o3": "Breathing exercises and physical activity",
      "quiz.q12o4": "Yelling at someone",
      "quiz.q13": "What is self-esteem?",
      "quiz.q13o1": "Feeling hungry all the time",
      "quiz.q13o2": "How we perceive and value ourselves",
      "quiz.q13o3": "A type of physical exercise",
      "quiz.q13o4": "A sleep disorder",
      "quiz.q14": "Why is it important to talk about feelings?",
      "quiz.q14o1": "It makes problems worse",
      "quiz.q14o2": "People will judge you",
      "quiz.q14o3": "It helps process emotions and seek support",
      "quiz.q14o4": "It's not important",
      "quiz.q15": "What is empathy?",
      "quiz.q15o1": "Feeling sorry for someone",
      "quiz.q15o2": "The ability to understand and share others' feelings",
      "quiz.q15o3": "Agreeing with everyone",
      "quiz.q15o4": "Ignoring others' problems",
      "quiz.q16": "How many hours of sleep are recommended for teenagers?",
      "quiz.q16o1": "4-5 hours",
      "quiz.q16o2": "6-7 hours",
      "quiz.q16o3": "8-10 hours",
      "quiz.q16o4": "12+ hours",
      "quiz.q17": "What is a safe space?",
      "quiz.q17o1": "A place with no rules",
      "quiz.q17o2": "An environment where you can express yourself without fear of judgment",
      "quiz.q17o3": "A locked room",
      "quiz.q17o4": "Only for adults",
      "quiz.q18": "Which behavior indicates emotional bullying?",
      "quiz.q18o1": "Helping a classmate",
      "quiz.q18o2": "Excluding someone from the group",
      "quiz.q18o3": "Sharing notes",
      "quiz.q18o4": "Playing together",
      "quiz.q19": "What should you do if a friend confides in you about being bullied?",
      "quiz.q19o1": "Ignore them",
      "quiz.q19o2": "Tell everyone at school",
      "quiz.q19o3": "Listen, support them, and encourage seeking help from an adult",
      "quiz.q19o4": "Blame them",
      "quiz.q20": "What is resilience?",
      "quiz.q20o1": "Giving up when things get hard",
      "quiz.q20o2": "Avoiding all challenges",
      "quiz.q20o3": "The ability to recover and adapt from difficult situations",
      "quiz.q20o4": "Never feeling sad",
      "friends.title": "Find Friends",
      "friends.search": "Search by username...",
      "friends.sendRequest": "Send Request",
      "friends.pending": "Pending Requests",
      "friends.accept": "Accept",
      "friends.reject": "Reject",
      "friends.online": "Online",
      "friends.offline": "Offline",
      "friends.message": "Message...",
      "friends.noFriends": "No friends yet. Send a request!",
      "friends.requestMsg": "Message (optional)",
      "friends.requestSent": "Request sent!",
      "friends.requestAccepted": "Request accepted!",
      "friends.requestRejected": "Request rejected",
      "friends.openChat": "Open Chat",
      "vent.title": "Vent & Report Chat",
      "vent.placeholder": "Vent here... This is a safe space \u{1F49A}",
      "vent.send": "Send",
      "vent.anonymous": "Anonymous",
      "vent.report": "Report",
      "vent.moderated": "\u{1F6AB} Moderated",
      "vent.reportTitle": "Report message",
      "vent.reportPlaceholder": "Reason for report...",
      "vent.reportSent": "Report sent",
      "vent.noMessages": "No messages yet. Be the first to vent!",
      "tips.title": "Mental Health Tips",
      "tips.tip1Title": "Breathe Deeply \u{1F32C}\uFE0F",
      "tips.tip1Desc": "When you feel anxious, stop and take 3 deep breaths. Inhale for 4 seconds, hold for 7, and exhale for 8.",
      "tips.tip2Title": "Talk to Someone \u{1F5E3}\uFE0F",
      "tips.tip2Desc": "Sharing your feelings with someone you trust relieves emotional weight. You don't have to carry everything alone.",
      "tips.tip3Title": "Digital Break \u{1F4F5}",
      "tips.tip3Desc": "Take regular breaks from social media. The offline world is also full of beautiful things to explore.",
      "tips.tip4Title": "Take Care of Your Body \u{1F4AA}",
      "tips.tip4Desc": "Sleeping well, eating healthy, and moving your body makes a huge difference in your mental health.",
      "tips.breathStart": "Start Exercise",
      "tips.inhale": "Inhale",
      "tips.hold": "Hold",
      "tips.exhale": "Exhale",
      "mood.title": "How are you feeling today?",
      "mood.select": "Select your mood:",
      "mood.happy": "\u{1F60A} Happy",
      "mood.sad": "\u{1F622} Sad",
      "mood.anxious": "\u{1F630} Anxious",
      "mood.angry": "\u{1F624} Angry",
      "mood.calm": "\u{1F60C} Calm",
      "mood.tired": "\u{1F634} Tired",
      "mood.save": "Save Mood",
      "mood.history": "History",
      "mood.today": "Today",
      "mood.noData": "No data yet. Start by recording your mood!",
      "mood.encouragement": "Keep it up! Taking care of your mental health is an act of courage.",
      "minigame.title": "MentalCraft Runner",
      "minigame.start": "Play",
      "minigame.score": "points",
      "minigame.gameOver": "Game Over!",
      "minigame.playAgain": "Play Again",
      "minigame.instructions": "Use arrow keys or WASD to move and jump. Collect items to score!",
      "admin.title": "Administration",
      "admin.users": "Users",
      "admin.reports": "Reports",
      "admin.messages": "Messages",
      "admin.moderate": "Moderate",
      "admin.ban": "Ban",
      "admin.unban": "Unban",
      "admin.approve": "Approve",
      "admin.reject": "Reject",
      "admin.resolve": "Resolve",
      "admin.panelTitle": "Admin Panel",
      "admin.reportsTitle": "Reports",
      "admin.usersTitle": "Users",
      "admin.messagesTitle": "Messages",
      "admin.back": "\u2190 Back",
      "admin.noReports": "No reports",
      "admin.by": "By:",
      "admin.unknown": "Unknown",
      "admin.adminNotes": "Admin notes...",
      "admin.review": "\u{1F440} Review",
      "admin.userBanned": "User banned",
      "admin.userUnbanned": "User unbanned",
      "admin.status": "Status",
      "admin.actions": "Actions",
      "admin.actionDone": "Action completed",
      "admin.ventMessages": "Vent Chat Messages",
      "admin.moderated": "Moderated",
      "emergency.title": "Emergency Numbers",
      "emergency.call180": "Human Rights",
      "emergency.call192": "SAMU",
      "emergency.call190": "Police",
      "emergency.description180": "Human Rights Hotline - Violence",
      "emergency.description192": "SAMU - Medical Emergency",
      "emergency.description190": "Military Police - Emergency",
      "emergency.description188": "CVV - Life Valorization Center",
      "footer.links": "Quick Links",
      "accessibility.title": "Accessibility",
      "accessibility.desc": "Customize the site experience for your needs.",
      "accessibility.highContrast": "High Contrast",
      "accessibility.highContrastDesc": "Increases contrast for better readability",
      "accessibility.largeText": "Large Text",
      "accessibility.largeTextDesc": "Increases the size of all texts",
      "accessibility.audioDescription": "Audio Description",
      "accessibility.audioDescDesc": "Enables audio narration of content",
      "accessibility.reset": "Reset All",
      "errors.loginRequired": "Please log in to access!",
      "errors.passwordMismatch": "Passwords do not match!",
      "errors.connectionError": "Connection error",
      "errors.requestError": "Error processing request",
      "common.loading": "Loading...",
      "common.error": "Error",
      "common.success": "Success!",
      "common.cancel": "Cancel",
      "common.save": "Save",
      "common.delete": "Delete",
      "common.close": "Close",
      "common.back": "Back",
      "common.welcome": "Welcome",
      "common.language": "Language",
      "nav.achievements": "Achievements",
      "nav.resources": "Resources",
      "achievements.title": "Achievements",
      "achievements.subtitle": "Collect achievements by exploring MentalCraft",
      "achievements.unlocked": "Unlocked",
      "achievements.total": "Total",
      "achievements.locked": "Locked",
      "achievements.newUnlocked": "New achievement unlocked!",
      "achievements.rarity.common": "Common",
      "achievements.rarity.uncommon": "Uncommon",
      "achievements.rarity.rare": "Rare",
      "achievements.rarity.epic": "Epic",
      "achievements.rarity.legendary": "Legendary",
      "achievements.progress": "Progress",
      "resources.title": "Mental Health Resources",
      "resources.subtitle": "Useful materials about mental health and wellness",
      "resources.category.anxiety": "Anxiety",
      "resources.category.depression": "Depression",
      "resources.category.bullying": "Bullying",
      "resources.category.selfesteem": "Self-Esteem",
      "resources.category.sleep": "Sleep",
      "resources.category.stress": "Stress",
      "resources.readMore": "Read More",
      "dashboard.dailyTip": "Daily Tip",
      "dashboard.moodStreak": "Mood Streak",
      "dashboard.achievementShowcase": "Recent Achievements",
      "dashboard.viewAll": "View All",
      "dashboard.noAchievements": "No achievements yet. Start exploring!",
      "nav.profile": "Profile",
      "profile.title": "My Profile",
      "profile.stats": "Statistics",
      "profile.joined": "Member since",
      "profile.mcName": "Minecraft Name",
      "profile.role": "Role",
      "profile.quizBest": "Best Quiz",
      "profile.moodEntries": "Mood Entries",
      "profile.friends": "Friends",
      "profile.achievements": "Achievements",
      "profile.recentActivity": "Recent Activity",
      "profile.noActivity": "No recent activity",
      "profile.editProfile": "Edit Profile",
      "profile.changeMcName": "Change Minecraft Name",
      "profile.save": "Save",
      "profile.cancel": "Cancel",
      "game.lives": "Lives",
      "game.level": "Level",
      "game.powerup": "Power-up",
      "game.shield": "Shield",
      "game.speed": "Speed",
      "game.magnet": "Magnet",
      "game.enemy": "Enemy",
      "game.newHighScore": "New High Score!",
      "game.points": "points",
      // Nav extras
      "nav.journal": "Journal",
      "nav.soundEffects": "Sound Effects",
      // Landing extras
      "landing.feature7Title": "Personal Journal",
      "landing.feature7Desc": "Write about your feelings daily",
      "landing.feature8Title": "Sound Effects",
      "landing.feature8Desc": "Immersive Minecraft sounds",
      // Common extras
      "common.goodbye": "See you later!",
      // Profile extras
      "profile.admin": "Admin",
      "profile.player": "Player",
      // Mood extras
      "mood.dashboardDesc": "Track your daily mood and see patterns",
      "mood.chartTitle": "Mood Chart",
      "mood.last7Days": "Last 7 days",
      "mood.moodTrend": "Trend",
      // Accessibility extras
      "accessibility.soundEffects": "Sound Effects",
      "accessibility.soundEffectsDesc": "Enable Minecraft sounds for interactions",
      // Journal
      "journal.title": "My Journal",
      "journal.subtitle": "Write about your feelings",
      "journal.prompt": "How do you feel today? What went well?",
      "journal.save": "Save Entry",
      "journal.saved": "Entry saved!",
      "journal.entries": "Previous Entries",
      "journal.noEntries": "No entries yet. Start writing!",
      "journal.delete": "Delete",
      "journal.confirmDelete": "Are you sure?",
      // Sound
      "sound.click": "Click",
      "sound.success": "Success",
      "sound.error": "Error",
      "sound.achievement": "Achievement",
      "sound.ambient": "Ambient",
      // Notifications
      "notifications.title": "Notifications",
      "notifications.noNotifications": "No notifications",
      "notifications.markRead": "Mark as read",
      "notifications.friendRequest": "sent you a friend request",
      "notifications.achievementUnlock": "Achievement unlocked:",
      "notifications.clearAll": "Clear all",
      // Dashboard extras
      "dashboard.notificationBadge": "notifications",
      "dashboard.journalDesc": "Write about your feelings",
      "dashboard.soundDesc": "Configure sound effects",
      // Biome Theme
      "biome.title": "Biome Theme",
      "biome.forest": "\u{1F33F} Forest",
      "biome.nether": "\u{1F525} Nether",
      "biome.end": "\u2728 The End",
      "biome.desc": "Change the site appearance",
      // Pomodoro Timer
      "pomodoro.title": "Pomodoro Timer",
      "pomodoro.focus": "Focus",
      "pomodoro.break": "Break",
      "pomodoro.start": "Start",
      "pomodoro.pause": "Pause",
      "pomodoro.reset": "Reset",
      "pomodoro.sessions": "Sessions today",
      "pomodoro.focusTip": "Focus on one task for 25 minutes",
      "pomodoro.breakTip": "Take a 5-minute break",
      "pomodoro.completed": "Session complete! Great job! \u26CF\uFE0F",
      // Daily Challenges
      "challenges.title": "Daily Challenge",
      "challenges.subtitle": "Complete today's challenge to earn XP",
      "challenges.completed": "Challenge completed! \u2705",
      "challenges.xpReward": "+50 XP Reward",
      "challenges.streak": "Challenge streak",
      "challenges.days": "days",
      "challenges.markDone": "Mark as done",
      "challenges.history": "History",
      "challenges.ch1": "Write 3 things you are grateful for",
      "challenges.ch2": "Take a 10-minute walk",
      "challenges.ch3": "Talk to someone you haven't spoken to in a while",
      "challenges.ch4": "Practice 5 minutes of meditation",
      "challenges.ch5": "Turn off your phone for 1 hour",
      "challenges.ch6": "Create something: draw, write, or sing",
      "challenges.ch7": "Make someone smile today",
      // Self-Care Checklist
      "selfcare.title": "Self-Care Checklist",
      "selfcare.subtitle": "Check off tasks you completed today",
      "selfcare.progress": "Today's progress",
      "selfcare.completed": "Tasks completed",
      "selfcare.allDone": "All tasks done! You're amazing! \u{1F31F}",
      "selfcare.t1": "\u{1F4A7} Drank enough water",
      "selfcare.t2": "\u{1F634} Slept well (7+ hours)",
      "selfcare.t3": "\u{1F6B6} Did some physical activity",
      "selfcare.t4": "\u{1F4F1} Limited screen time",
      "selfcare.t5": "\u{1F9D8} Practiced breathing/meditation",
      "selfcare.t6": "\u{1F91D} Talked to someone",
      "selfcare.t7": "\u{1F4DD} Wrote in journal",
      "selfcare.t8": "\u{1F60A} Did something that brought me joy",
      // Nav extras
      "nav.pomodoro": "Pomodoro",
      "nav.challenges": "Challenges",
      "nav.selfcare": "Self-Care",
      "nav.breathing": "Breathing",
      "nav.gratitude": "Gratitude",
      "nav.affirmations": "Affirmations",
      "breathing.title": "Breathing Exercise",
      "breathing.pattern478": "4-7-8 Relaxing",
      "breathing.patternBox": "Box (4-4-4-4)",
      "breathing.patternCalm": "Calm (4-0-6)",
      "breathing.inhale": "Breathe in...",
      "breathing.hold": "Hold...",
      "breathing.exhale": "Breathe out...",
      "breathing.inhaleDesc": "Breathe in slowly through your nose",
      "breathing.holdDesc": "Hold the air in your lungs",
      "breathing.exhaleDesc": "Release the air slowly through your mouth",
      "breathing.start": "Start Exercise",
      "breathing.stop": "Stop",
      "breathing.cycles": "cycles completed",
      "breathing.tip1": "Sit comfortably with your back straight before starting",
      "breathing.tip2": "Close your eyes and focus only on your breathing",
      "breathing.tip3": "If you lose focus, gently return to the rhythm",
      "breathing.tip4": "Practice daily for better results",
      "gratitude.title": "Gratitude Wall",
      "gratitude.prompt": "What are you grateful for today? Share your gratitude!",
      "gratitude.placeholder": "Write something you are grateful for...",
      "gratitude.post": "Post",
      "gratitude.empty": "No gratitudes yet. Be the first to share!",
      "affirm.title": "Daily Affirmations",
      "affirm.a1": "I am strong and capable of overcoming any challenge, like a miner facing the Nether.",
      "affirm.a2": "I deserve respect, kindness, and a safe place in the world.",
      "affirm.a3": "Every day is a new opportunity to build something amazing.",
      "affirm.a4": "My feelings are valid and important.",
      "affirm.a5": "I am enough exactly as I am.",
      "affirm.a6": "I can ask for help when I need it \u2014 that is courage, not weakness.",
      "affirm.a7": "Growth happens one block at a time.",
      "affirm.a8": "I deserve to live in peace and safety.",
      "affirm.a9": "I have the power to create positive changes in my life.",
      "affirm.a10": "Every challenge makes me stronger and wiser.",
      "affirm.a11": "I am a valuable person and deserve to be treated with kindness.",
      "affirm.a12": "My worth is not defined by what others think of me.",
      "affirm.catSelf": "Self-Esteem",
      "affirm.catStrength": "Inner Strength",
      "affirm.catGrowth": "Growth",
      "affirm.favorites": "Favorites",
      "affirm.showAll": "View All",
      "affirm.hideAll": "Hide List",
      // Coping, Safety Plan, Leaderboard, Mood Insights, Dashboard additions
      "nav.coping": "Coping Toolkit",
      "nav.safetyPlan": "Safety Plan",
      "nav.leaderboard": "Leaderboard",
      "nav.moodInsights": "Mood Insights",
      "coping.title": "Coping Strategies",
      "coping.subtitle": "Tools to help you face difficult moments",
      "coping.all": "All",
      "coping.breathing": "Breathing",
      "coping.grounding": "Grounding",
      "coping.positiveThinking": "Positive Thinking",
      "coping.physical": "Physical",
      "coping.social": "Social",
      "coping.creative": "Creative",
      "coping.tryNow": "Try Now",
      "coping.steps": "Steps",
      "coping.step": "Step",
      "coping.favorite": "Save to Favorites",
      "coping.unfavorite": "Remove from Favorites",
      "coping.favorites": "Favorites",
      "coping.noFavorites": "No favorite strategies yet",
      "coping.count": "strategies",
      "coping.s1Title": "4-7-8 Breathing",
      "coping.s1Desc": "Breathing technique to quickly calm your mind",
      "coping.s1Steps": "1. Inhale for 4 seconds|2. Hold for 7 seconds|3. Exhale for 8 seconds|4. Repeat 4 times",
      "coping.s2Title": "Diaphragmatic Breathing",
      "coping.s2Desc": "Breathe deeply using your diaphragm to relax",
      "coping.s2Steps": "1. Place hand on abdomen|2. Inhale slowly through nose|3. Feel abdomen expand|4. Exhale slowly through mouth|5. Repeat 10 times",
      "coping.s3Title": "Box Breathing",
      "coping.s3Desc": "Rhythmic breathing to balance body and mind",
      "coping.s3Steps": "1. Inhale for 4 seconds|2. Hold for 4 seconds|3. Exhale for 4 seconds|4. Hold empty for 4 seconds|5. Repeat 5 cycles",
      "coping.s4Title": "5-4-3-2-1 Technique",
      "coping.s4Desc": "Use your senses to focus on the present moment",
      "coping.s5Title": "Name 5 Things",
      "coping.s5Desc": "List things you can see around you to stay grounded",
      "coping.s6Title": "Thought Restructuring",
      "coping.s6Desc": "Transform negative thoughts into positive ones",
      "coping.s7Title": "Positive Affirmations",
      "coping.s7Desc": "Repeat positive phrases to boost your self-esteem",
      "coping.s8Title": "Mindful Walking",
      "coping.s8Desc": "Walk while paying attention to your steps and breathing",
      "coping.s9Title": "Quick Stretching",
      "coping.s9Desc": "Stretch your body to release physical tension",
      "coping.s10Title": "Talk to Someone",
      "coping.s10Desc": "Talk to a trusted person about how you feel",
      "coping.s11Title": "Ask an Adult for Help",
      "coping.s11Desc": "Reach out to a trusted adult when you need support",
      "coping.s12Title": "Draw or Paint",
      "coping.s12Desc": "Use art to express your emotions",
      "safety.title": "My Safety Plan",
      "safety.subtitle": "Create a personal plan to stay safe",
      "safety.create": "Create Plan",
      "safety.edit": "Edit Plan",
      "safety.save": "Save Plan",
      "safety.saved": "Plan saved successfully!",
      "safety.step1Title": "My Warning Signs",
      "safety.step1Desc": "What thoughts or feelings tell me I need help",
      "safety.step1Placeholder": "e.g., I feel overwhelmed, I want to be alone...",
      "safety.step2Title": "My Coping Strategies",
      "safety.step2Desc": "Things I can do to feel better",
      "safety.step2Placeholder": "e.g., Deep breathing, Talk to a friend, Listen to music...",
      "safety.step3Title": "People I Trust",
      "safety.step3Desc": "People I can reach out to for support",
      "safety.step3Placeholder": "e.g., Mom: 55-11-99999-0000, Teacher Maria...",
      "safety.step4Title": "Safe Places",
      "safety.step4Desc": "Places where I feel calm and safe",
      "safety.step4Placeholder": "e.g., School library, My room, The park...",
      "safety.noPlan": "You have not created a safety plan yet.",
      "safety.noPlanDesc": "Creating a safety plan helps you know what to do when you are feeling unsafe.",
      "safety.completed": "Your safety plan is ready! Keep it somewhere accessible.",
      "safety.addSign": "Add warning sign",
      "safety.addContact": "Add contact",
      "safety.addPlace": "Add place",
      "leaderboard.title": "Leaderboard",
      "leaderboard.subtitle": "Top players in the Minecraft world",
      "leaderboard.rank": "Rank",
      "leaderboard.player": "Player",
      "leaderboard.score": "Score",
      "leaderboard.level": "Level",
      "leaderboard.you": "You",
      "leaderboard.noEntries": "No entries yet. Play the game to get on the board!",
      "leaderboard.topScore": "Your Top Score",
      "leaderboard.submitScore": "Submit Score",
      "insights.title": "Mood Insights",
      "insights.subtitle": "Understand your emotional patterns",
      "insights.totalEntries": "Total Entries",
      "insights.avgPerDay": "Avg/Day",
      "insights.currentStreak": "Current Streak",
      "insights.longestStreak": "Longest Streak",
      "insights.trend": "Trend",
      "insights.improving": "Improving",
      "insights.stable": "Stable",
      "insights.declining": "Needs Attention",
      "insights.weeklyAverage": "Weekly Average",
      "insights.noData": "Start tracking your mood to see insights here!",
      "insights.days": "days",
      "dashboard.copingDesc": "Strategies for difficult moments",
      "dashboard.safetyPlanDesc": "Your personal safety plan",
      "dashboard.leaderboardDesc": "Top game scores",
      "dashboard.moodInsightsDesc": "Your emotional patterns",
      // StudyHelp
      "nav.studyHelp": "Studies",
      "nav.more": "More",
      "studyHelp.title": "\u{1F4D6} Study Help",
      "studyHelp.subtitle": "Question bank for different high school years",
      "studyHelp.selectYear": "Select Year",
      "studyHelp.selectSubject": "Select Subject",
      "studyHelp.start": "Start Quiz",
      "studyHelp.correct": "Correct! \u2705",
      "studyHelp.wrong": "Incorrect \u274C",
      "studyHelp.score": "Score",
      "studyHelp.next": "Next",
      "studyHelp.finish": "Finish",
      "studyHelp.year1": "1st Year",
      "studyHelp.year2": "2nd Year",
      "studyHelp.year3": "3rd Year",
      "studyHelp.math": "Math",
      "studyHelp.portuguese": "Portuguese",
      "studyHelp.science": "Science",
      "studyHelp.history": "History",
      "studyHelp.geography": "Geography",
      "studyHelp.of": "of",
      "studyHelp.question": "Question",
      "studyHelp.noQuestions": "No questions available for this combination.",
      "studyHelp.results": "Final Result",
      "studyHelp.perfect": "Perfect! You know the material! \u{1F3C6}",
      "studyHelp.great": "Great job! Keep it up! \u2B50",
      "studyHelp.good": "Good work! Review the mistakes. \u{1F4DA}",
      "studyHelp.needsWork": "Keep studying! You can do it! \u{1F4AA}",
      "studyHelp.restart": "Try Again",
      "studyHelp.back": "Back"
    },
    es: {
      "nav.landing": "Inicio",
      "nav.chatbot": "Chat de Apoyo",
      "nav.quiz": "Quiz",
      "nav.friends": "Amigos",
      "nav.vent": "Desahogo",
      "nav.minigame": "Mini Juego",
      "nav.login": "Ingresar",
      "nav.register": "Registrarse",
      "nav.admin": "Administraci\xF3n",
      "nav.emergency": "Emergencia",
      "nav.accessibility": "Accesibilidad",
      "landing.hero": "Salud Mental y Anti-Acoso en el Mundo de los Bloques",
      "landing.subtitle": "Un espacio seguro hecho por estudiantes, para estudiantes",
      "landing.description": "Aqu\xED encontrar\xE1s apoyo emocional, informaci\xF3n sobre salud mental y herramientas para lidiar con el bullying \u2014 todo en un ambiente inspirado en Minecraft.",
      "landing.cta1": "Comenzar Ahora",
      "landing.cta2": "Ir al Panel",
      "landing.cta3": "Explorar",
      "landing.cta4": "\xBFListo para construir un mundo mejor?",
      "landing.cta5": "\xDAnete a miles de estudiantes que ya encontraron apoyo aqu\xED. \xA1Tu salud mental importa!",
      "landing.features": "Lo que puedes hacer aqu\xED",
      "landing.characters": "Tus aliados en este viaje",
      "landing.char1": "Como Steve, t\xFA eres el constructor de tu propio viaje.",
      "landing.char2": "Alex nos ense\xF1a que ser diferente es una fortaleza.",
      "landing.char3": "Los aldeanos muestran que una comunidad unida es m\xE1s fuerte.",
      "landing.char4": "El G\xF3lem de Hierro es el protector. Hay personas listas para defenderte.",
      "landing.stat1": "Soporte Disponible",
      "landing.stat2": "Conversaciones Seguras",
      "landing.stat3": "Idiomas",
      "landing.stat4": "Diversi\xF3n Garantizada",
      "landing.feature1Title": "Chatbot de Apoyo",
      "landing.feature1Desc": "Chatea con nuestro asistente virtual MineBot 24/7 sobre salud mental.",
      "landing.feature2Title": "Quiz Interactivo",
      "landing.feature2Desc": "\xA1Pon a prueba tus conocimientos sobre salud mental y bullying!",
      "landing.feature3Title": "Encontrar Amigos",
      "landing.feature3Desc": "Con\xE9ctate con otros estudiantes en un ambiente seguro.",
      "landing.feature4Title": "Mini Juego",
      "landing.feature4Desc": "Rel\xE1jate con nuestro mini juego inspirado en Minecraft.",
      "landing.feature5Title": "Chat de Desahogo",
      "landing.feature5Desc": "Desah\xF3gate de forma an\xF3nima. Este es un espacio seguro.",
      "landing.feature6Title": "Accesibilidad",
      "landing.feature6Desc": "Alto contraste, texto grande y audiodescripci\xF3n.",
      "auth.login": "Ingresar",
      "auth.register": "Crear Cuenta",
      "auth.username": "Nombre de usuario",
      "auth.email": "Correo",
      "auth.password": "Contrase\xF1a",
      "auth.confirmPassword": "Confirmar Contrase\xF1a",
      "auth.minecraftName": "Nombre en Minecraft",
      "auth.submit": "Enviar",
      "auth.noAccount": "\xBFNo tienes cuenta? Reg\xEDstrate",
      "auth.hasAccount": "\xBFYa tienes cuenta? Ingresar",
      "auth.logout": "Salir",
      "auth.adminLogin": "Acceso Admin",
      "chatbot.title": "MineBot - Chat de Apoyo",
      "chatbot.placeholder": "Escribe tu mensaje aqu\xED... \u{1F49A}",
      "chatbot.send": "Enviar",
      "chatbot.suggestions": "Preguntas sugeridas",
      "chatbot.sug1": "\xBFC\xF3mo lidiar con la ansiedad?",
      "chatbot.sug2": "\xBFQu\xE9 hacer si sufro bullying?",
      "chatbot.sug3": "\xBFC\xF3mo ayudar a un amigo triste?",
      "chatbot.sug4": "\xBFCu\xE1les son se\xF1ales de depresi\xF3n?",
      "chatbot.sug5": "\xBFC\xF3mo pedir ayuda?",
      "chatbot.sug6": "Ejercicios de respiraci\xF3n",
      "chatbot.welcome": "\xA1Hola! Soy MineBot \u26CF\uFE0F\u{1F916}! Estoy aqu\xED para ayudarte con salud mental y bullying. \xBFC\xF3mo puedo ayudarte?",
      "chatbot.typing": "Escribiendo...",
      "chatbot.processError": "Lo siento, no pude procesar tu mensaje. \xA1Intenta de nuevo!",
      "chatbot.connectionError": "Error de conexi\xF3n. \xA1Verifica tu internet e intenta de nuevo! \u26A0\uFE0F",
      "chatbot.you": "T\xFA",
      "quiz.title": "Quiz de Salud Mental y Bullying",
      "quiz.start": "Iniciar Quiz",
      "quiz.next": "Siguiente",
      "quiz.previous": "Anterior",
      "quiz.finish": "Finalizar",
      "quiz.result": "Resultado del Quiz",
      "quiz.score": "correctas",
      "quiz.restart": "Rehacer Quiz",
      "quiz.submitError": "Error al enviar quiz",
      "quiz.q1": "\xBFQu\xE9 es el bullying?",
      "quiz.q1o1": "Una broma normal entre amigos",
      "quiz.q1o2": "Comportamiento agresivo y repetitivo que causa dolor",
      "quiz.q1o3": "Una discusi\xF3n puntual entre compa\xF1eros",
      "quiz.q1o4": "Una forma de expresi\xF3n personal",
      "quiz.q2": "\xBFCu\xE1l de estos NO es un tipo de bullying?",
      "quiz.q2o1": "Bullying verbal (insultos)",
      "quiz.q2o2": "Bullying f\xEDsico (golpes)",
      "quiz.q2o3": "Discutir ideas en un trabajo escolar",
      "quiz.q2o4": "Ciberacoso (mensajes ofensivas en internet)",
      "quiz.q3": "\xBFQu\xE9 hacer si presencias bullying?",
      "quiz.q3o1": "Fingir que no viste nada",
      "quiz.q3o2": "Grabar y publicar en redes sociales",
      "quiz.q3o3": "Buscar un adulto de confianza y reportar",
      "quiz.q3o4": "Re\xEDrse para no ser el pr\xF3ximo blanco",
      "quiz.q4": "\xBFC\xF3mo apoyar a un amigo que sufre bullying?",
      "quiz.q4o1": "Escuchar con empat\xEDa y animar a buscar ayuda",
      "quiz.q4o2": "Decirle que ignore y siga adelante",
      "quiz.q4o3": "Confrontar al agresor con agresividad",
      "quiz.q4o4": "Alejarse para no involucrarse",
      "quiz.q5": "\xBFQu\xE9 es la ansiedad?",
      "quiz.q5o1": "Sentirse triste todo el tiempo",
      "quiz.q5o2": "Respuesta natural al estr\xE9s que puede volverse problema",
      "quiz.q5o3": "Falta de ganas de hacer actividades",
      "quiz.q5o4": "Una enfermedad contagiosa",
      "quiz.q6": "\xBFCu\xE1les son se\xF1ales de depresi\xF3n?",
      "quiz.q6o1": "Tener mucha energ\xEDa siempre",
      "quiz.q6o2": "Tristeza persistente, p\xE9rdida de inter\xE9s y aislamiento",
      "quiz.q6o3": "Comer mucho en fiestas",
      "quiz.q6o4": "Gustar siempre estar solo",
      "quiz.q7": "\xBFPara qu\xE9 es el n\xFAmero 180?",
      "quiz.q7o1": "Emergencia m\xE9dica",
      "quiz.q7o2": "Polic\xEDa Militar",
      "quiz.q7o3": "Disque Derechos Humanos",
      "quiz.q7o4": "Bomberos",
      "quiz.q8": "\xBFQu\xE9 es el ciberacoso?",
      "quiz.q8o1": "Acoso a trav\xE9s de internet y redes sociales",
      "quiz.q8o2": "Acoso solo en juegos online",
      "quiz.q8o3": "Un tipo de virus de computadora",
      "quiz.q8o4": "Cuando alguien te golpea en el juego",
      "quiz.q9": "\xBFQu\xE9 actitud es m\xE1s saludable?",
      "quiz.q9o1": "Hablar de tus sentimientos con alguien de confianza",
      "quiz.q9o2": "Guardar todo para ti mismo",
      "quiz.q9o3": "Fingir que todo est\xE1 bien",
      "quiz.q9o4": "Aislamiento total de las personas",
      "quiz.q10": "El CVV se puede contactar al n\xFAmero:",
      "quiz.q10o1": "180",
      "quiz.q10o2": "188",
      "quiz.q10o3": "192",
      "quiz.q10o4": "190",
      "quiz.q11": "\xBFCu\xE1l es la principal caracter\xEDstica del ciberacoso?",
      "quiz.q11o1": "Agresi\xF3n f\xEDsica",
      "quiz.q11o2": "Uso de medios digitales para acosar",
      "quiz.q11o3": "Robar pertenencias",
      "quiz.q11o4": "Esparcir rumores en persona",
      "quiz.q12": "\xBFCu\xE1l es una forma saludable de manejar la ira?",
      "quiz.q12o1": "Golpear la pared",
      "quiz.q12o2": "Ignorar el sentimiento",
      "quiz.q12o3": "Ejercicios de respiraci\xF3n y actividad f\xEDsica",
      "quiz.q12o4": "Gritar a alguien",
      "quiz.q13": "\xBFQu\xE9 es la autoestima?",
      "quiz.q13o1": "Sentir hambre todo el tiempo",
      "quiz.q13o2": "C\xF3mo nos percibimos y valoramos a nosotros mismos",
      "quiz.q13o3": "Un tipo de ejercicio f\xEDsico",
      "quiz.q13o4": "Un trastorno del sue\xF1o",
      "quiz.q14": "\xBFPor qu\xE9 es importante hablar sobre los sentimientos?",
      "quiz.q14o1": "Empeora los problemas",
      "quiz.q14o2": "La gente te juzgar\xE1",
      "quiz.q14o3": "Ayuda a procesar emociones y buscar apoyo",
      "quiz.q14o4": "No es importante",
      "quiz.q15": "\xBFQu\xE9 es la empat\xEDa?",
      "quiz.q15o1": "Sentir l\xE1stima por alguien",
      "quiz.q15o2": "La capacidad de entender y compartir los sentimientos de otros",
      "quiz.q15o3": "Estar de acuerdo con todos",
      "quiz.q15o4": "Ignorar los problemas de otros",
      "quiz.q16": "\xBFCu\xE1ntas horas de sue\xF1o se recomiendan para adolescentes?",
      "quiz.q16o1": "4-5 horas",
      "quiz.q16o2": "6-7 horas",
      "quiz.q16o3": "8-10 horas",
      "quiz.q16o4": "12+ horas",
      "quiz.q17": "\xBFQu\xE9 es un espacio seguro?",
      "quiz.q17o1": "Un lugar sin reglas",
      "quiz.q17o2": "Un ambiente donde puedes expresarte sin miedo a ser juzgado",
      "quiz.q17o3": "Un cuarto cerrado con llave",
      "quiz.q17o4": "Solo para adultos",
      "quiz.q18": "\xBFQu\xE9 comportamiento indica acoso emocional?",
      "quiz.q18o1": "Ayudar a un compa\xF1ero",
      "quiz.q18o2": "Excluir a alguien del grupo",
      "quiz.q18o3": "Compartir apuntes",
      "quiz.q18o4": "Jugar juntos",
      "quiz.q19": "\xBFQu\xE9 hacer si un amigo te conf\xEDa que sufre acoso?",
      "quiz.q19o1": "Ignorarlo",
      "quiz.q19o2": "Contar a todos en la escuela",
      "quiz.q19o3": "Escuchar, apoyarlo y animarlo a buscar ayuda de un adulto",
      "quiz.q19o4": "Culparlo",
      "quiz.q20": "\xBFQu\xE9 es la resiliencia?",
      "quiz.q20o1": "Rendirse cuando las cosas se ponen dif\xEDciles",
      "quiz.q20o2": "Evitar todos los desaf\xEDos",
      "quiz.q20o3": "La capacidad de recuperarse y adaptarse a situaciones dif\xEDciles",
      "quiz.q20o4": "Nunca sentirse triste",
      "friends.title": "Encontrar Amigos",
      "friends.search": "Buscar por nombre...",
      "friends.sendRequest": "Enviar Solicitud",
      "friends.pending": "Solicitudes Pendientes",
      "friends.accept": "Aceptar",
      "friends.reject": "Rechazar",
      "friends.online": "En l\xEDnea",
      "friends.offline": "Desconectado",
      "friends.message": "Mensaje...",
      "friends.noFriends": "Ning\xFAn amigo a\xFAn. \xA1Env\xEDa una solicitud!",
      "friends.requestMsg": "Mensaje (opcional)",
      "friends.requestSent": "\xA1Solicitud enviada!",
      "friends.requestAccepted": "\xA1Solicitud aceptada!",
      "friends.requestRejected": "Solicitud rechazada",
      "friends.openChat": "Abrir Chat",
      "vent.title": "Chat de Desahogo y Denuncias",
      "vent.placeholder": "Desah\xF3gate aqu\xED... Este es un espacio seguro \u{1F49A}",
      "vent.send": "Enviar",
      "vent.anonymous": "An\xF3nimo",
      "vent.report": "Denunciar",
      "vent.moderated": "\u{1F6AB} Moderado",
      "vent.reportTitle": "Denunciar mensaje",
      "vent.reportPlaceholder": "Motivo de la denuncia...",
      "vent.reportSent": "Denuncia enviada",
      "vent.noMessages": "Sin mensajes a\xFAn. \xA1S\xE9 el primero en desahogarte!",
      "tips.title": "Consejos de Salud Mental",
      "tips.tip1Title": "Respira Profundo \u{1F32C}\uFE0F",
      "tips.tip1Desc": "Cuando sientas ansiedad, detente y haz 3 respiraciones profundas. Inhala 4 segundos, sost\xE9n 7 y exhala 8.",
      "tips.tip2Title": "Habla con Alguien \u{1F5E3}\uFE0F",
      "tips.tip2Desc": "Compartir tus sentimientos con alguien de confianza alivia el peso emocional. No necesitas cargar todo solo.",
      "tips.tip3Title": "Pausa Digital \u{1F4F5}",
      "tips.tip3Desc": "Toma pausas regulares de las redes sociales. El mundo offline tambi\xE9n tiene cosas hermosas por explorar.",
      "tips.tip4Title": "Cuida tu Cuerpo \u{1F4AA}",
      "tips.tip4Desc": "Dormir bien, comer sano y moverte hace una gran diferencia en tu salud mental.",
      "tips.breathStart": "Iniciar Ejercicio",
      "tips.inhale": "Inhala",
      "tips.hold": "Sost\xE9n",
      "tips.exhale": "Exhala",
      "mood.title": "\xBFC\xF3mo te sientes hoy?",
      "mood.select": "Selecciona tu estado de \xE1nimo:",
      "mood.happy": "\u{1F60A} Feliz",
      "mood.sad": "\u{1F622} Triste",
      "mood.anxious": "\u{1F60A} Ansioso/a",
      "mood.angry": "\u{1F624} Enojado/a",
      "mood.calm": "\u{1F60C} Calmado/a",
      "mood.tired": "\u{1F634} Cansado/a",
      "mood.save": "Guardar Estado",
      "mood.history": "Historial",
      "mood.today": "Hoy",
      "mood.noData": "Sin datos a\xFAn. \xA1Empieza registrando tu estado!",
      "mood.encouragement": "\xA1Sigue as\xED! Cuidar de tu salud mental es un acto de valent\xEDa.",
      "minigame.title": "MentalCraft Runner",
      "minigame.start": "Jugar",
      "minigame.score": "puntos",
      "minigame.gameOver": "\xA1Fin del Juego!",
      "minigame.playAgain": "Jugar de Nuevo",
      "minigame.instructions": "Usa las flechas o WASD para moverte y saltar. \xA1Recoge los \xEDtems!",
      "admin.title": "Administraci\xF3n",
      "admin.users": "Usuarios",
      "admin.reports": "Denuncias",
      "admin.messages": "Mensajes",
      "admin.moderate": "Moderar",
      "admin.ban": "Banear",
      "admin.unban": "Desbanear",
      "admin.approve": "Aprobar",
      "admin.reject": "Rechazar",
      "admin.resolve": "Resolver",
      "admin.panelTitle": "Panel del Administrador",
      "admin.reportsTitle": "Denuncias",
      "admin.usersTitle": "Usuarios",
      "admin.messagesTitle": "Mensajes",
      "admin.back": "\u2190 Volver",
      "admin.noReports": "Ninguna denuncia",
      "admin.by": "Por:",
      "admin.unknown": "Desconocido",
      "admin.adminNotes": "Notas del admin...",
      "admin.review": "\u{1F440} Revisar",
      "admin.userBanned": "Usuario baneado",
      "admin.userUnbanned": "Usuario desbaneado",
      "admin.status": "Estado",
      "admin.actions": "Acciones",
      "admin.actionDone": "Acci\xF3n realizada",
      "admin.ventMessages": "Mensajes del Chat de Desahogo",
      "admin.moderated": "Moderado",
      "emergency.title": "N\xFAmeros de Emergencia",
      "emergency.call180": "Derechos Humanos",
      "emergency.call192": "SAMU",
      "emergency.call190": "Polic\xEDa",
      "emergency.description180": "Disque Derechos Humanos - Violencia",
      "emergency.description192": "SAMU - Emergencia M\xE9dica",
      "emergency.description190": "Polic\xEDa Militar - Emergencia",
      "emergency.description188": "CVV - Centro de Valorizaci\xF3n de la Vida",
      "footer.links": "Enlaces R\xE1pidos",
      "accessibility.title": "Accesibilidad",
      "accessibility.desc": "Personaliza la experiencia del sitio para tus necesidades.",
      "accessibility.highContrast": "Alto Contraste",
      "accessibility.highContrastDesc": "Aumenta el contraste para mejor legibilidad",
      "accessibility.largeText": "Texto Grande",
      "accessibility.largeTextDesc": "Aumenta el tama\xF1o de todos los textos",
      "accessibility.audioDescription": "Audiodescripci\xF3n",
      "accessibility.audioDescDesc": "Activa la narraci\xF3n de audio del contenido",
      "accessibility.reset": "Restablecer Todo",
      "errors.loginRequired": "\xA1Inicia sesi\xF3n para acceder!",
      "errors.passwordMismatch": "\xA1Las contrase\xF1as no coinciden!",
      "errors.connectionError": "Error de conexi\xF3n",
      "errors.requestError": "Error al procesar la solicitud",
      "common.loading": "Cargando...",
      "common.error": "Error",
      "common.success": "\xA1\xC9xito!",
      "common.cancel": "Cancelar",
      "common.save": "Guardar",
      "common.delete": "Eliminar",
      "common.close": "Cerrar",
      "common.back": "Volver",
      "common.welcome": "Bienvenido/a",
      "common.language": "Idioma",
      "nav.achievements": "Logros",
      "nav.resources": "Recursos",
      "achievements.title": "Logros",
      "achievements.subtitle": "Colecciona logros explorando MentalCraft",
      "achievements.unlocked": "Desbloqueados",
      "achievements.total": "Total",
      "achievements.locked": "Bloqueado",
      "achievements.newUnlocked": "\xA1Nuevo logro desbloqueado!",
      "achievements.rarity.common": "Com\xFAn",
      "achievements.rarity.uncommon": "Poco com\xFAn",
      "achievements.rarity.rare": "Raro",
      "achievements.rarity.epic": "\xC9pico",
      "achievements.rarity.legendary": "Legendario",
      "achievements.progress": "Progreso",
      "resources.title": "Recursos de Salud Mental",
      "resources.subtitle": "Materiales \xFAtiles sobre salud mental y bienestar",
      "resources.category.anxiety": "Ansiedad",
      "resources.category.depression": "Depresi\xF3n",
      "resources.category.bullying": "Acoso Escolar",
      "resources.category.selfesteem": "Autoestima",
      "resources.category.sleep": "Sue\xF1o",
      "resources.category.stress": "Estr\xE9s",
      "resources.readMore": "Leer M\xE1s",
      "dashboard.dailyTip": "Consejo del D\xEDa",
      "dashboard.moodStreak": "Racha de Estado de \xC1nimo",
      "dashboard.achievementShowcase": "Logros Recientes",
      "dashboard.viewAll": "Ver Todo",
      "dashboard.noAchievements": "Sin logros a\xFAn. \xA1Empieza a explorar!",
      "nav.profile": "Perfil",
      "profile.title": "Mi Perfil",
      "profile.stats": "Estad\xEDsticas",
      "profile.joined": "Miembro desde",
      "profile.mcName": "Nombre en Minecraft",
      "profile.role": "Rol",
      "profile.quizBest": "Mejor Quiz",
      "profile.moodEntries": "Registros de Estado de \xC1nimo",
      "profile.friends": "Amigos",
      "profile.achievements": "Logros",
      "profile.recentActivity": "Actividad Reciente",
      "profile.noActivity": "Sin actividad reciente",
      "profile.editProfile": "Editar Perfil",
      "profile.changeMcName": "Cambiar Nombre Minecraft",
      "profile.save": "Guardar",
      "profile.cancel": "Cancelar",
      "game.lives": "Vidas",
      "game.level": "Nivel",
      "game.powerup": "Power-up",
      "game.shield": "Escudo",
      "game.speed": "Velocidad",
      "game.magnet": "Im\xE1n",
      "game.enemy": "Enemigo",
      "game.newHighScore": "\xA1Nuevo R\xE9cord!",
      "game.points": "puntos",
      // Nav extras
      "nav.journal": "Diario",
      "nav.soundEffects": "Efectos de Sonido",
      // Landing extras
      "landing.feature7Title": "Diario Personal",
      "landing.feature7Desc": "Escribe sobre tus sentimientos diariamente",
      "landing.feature8Title": "Efectos de Sonido",
      "landing.feature8Desc": "Sonidos inmersivos de Minecraft",
      // Common extras
      "common.goodbye": "\xA1Hasta luego!",
      // Profile extras
      "profile.admin": "Admin",
      "profile.player": "Jugador",
      // Mood extras
      "mood.dashboardDesc": "Sigue tu estado de \xE1nimo diario y ve patrones",
      "mood.chartTitle": "Gr\xE1fico de Estado de \xC1nimo",
      "mood.last7Days": "\xDAltimos 7 d\xEDas",
      "mood.moodTrend": "Tendencia",
      // Accessibility extras
      "accessibility.soundEffects": "Efectos de Sonido",
      "accessibility.soundEffectsDesc": "Activa sonidos de Minecraft para interacciones",
      // Journal
      "journal.title": "Mi Diario",
      "journal.subtitle": "Escribe sobre tus sentimientos",
      "journal.prompt": "\xBFC\xF3mo te sientes hoy? \xBFQu\xE9 sali\xF3 bien?",
      "journal.save": "Guardar Entrada",
      "journal.saved": "\xA1Entrada guardada!",
      "journal.entries": "Entradas Anteriores",
      "journal.noEntries": "Sin entradas a\xFAn. \xA1Empieza a escribir!",
      "journal.delete": "Eliminar",
      "journal.confirmDelete": "\xBFEst\xE1s seguro?",
      // Sound
      "sound.click": "Clic",
      "sound.success": "\xC9xito",
      "sound.error": "Error",
      "sound.achievement": "Logro",
      "sound.ambient": "Ambiente",
      // Notifications
      "notifications.title": "Notificaciones",
      "notifications.noNotifications": "Sin notificaciones",
      "notifications.markRead": "Marcar como le\xEDdo",
      "notifications.friendRequest": "te envi\xF3 una solicitud de amistad",
      "notifications.achievementUnlock": "\xA1Logro desbloqueado:",
      "notifications.clearAll": "Limpiar todo",
      // Dashboard extras
      "dashboard.notificationBadge": "notificaciones",
      "dashboard.journalDesc": "Escribe sobre tus sentimientos",
      "dashboard.soundDesc": "Configura efectos de sonido",
      // Biome Theme
      "biome.title": "Bioma Tem\xE1tico",
      "biome.forest": "\u{1F33F} Bosque",
      "biome.nether": "\u{1F525} Nether",
      "biome.end": "\u2728 The End",
      "biome.desc": "Cambia la apariencia del sitio",
      // Pomodoro Timer
      "pomodoro.title": "Temporizador Pomodoro",
      "pomodoro.focus": "Enfoque",
      "pomodoro.break": "Descanso",
      "pomodoro.start": "Iniciar",
      "pomodoro.pause": "Pausar",
      "pomodoro.reset": "Reiniciar",
      "pomodoro.sessions": "Sesiones hoy",
      "pomodoro.focusTip": "Enf\xF3cate en una tarea por 25 minutos",
      "pomodoro.breakTip": "Toma un descanso de 5 minutos",
      "pomodoro.completed": "\xA1Sesi\xF3n completa! \xA1Buen trabajo! \u26CF\uFE0F",
      // Daily Challenges
      "challenges.title": "Desaf\xEDo Diario",
      "challenges.subtitle": "Completa el desaf\xEDo de hoy para ganar XP",
      "challenges.completed": "\xA1Desaf\xEDo completado! \u2705",
      "challenges.xpReward": "+50 XP Recompensa",
      "challenges.streak": "Racha de desaf\xEDos",
      "challenges.days": "d\xEDas",
      "challenges.markDone": "Marcar como completado",
      "challenges.history": "Historial",
      "challenges.ch1": "Escribe 3 cosas por las que est\xE1s agradecido",
      "challenges.ch2": "Toma una caminata de 10 minutos",
      "challenges.ch3": "Habla con alguien con quien no has hablado en un tiempo",
      "challenges.ch4": "Practica 5 minutos de meditaci\xF3n",
      "challenges.ch5": "Apaga tu celular por 1 hora",
      "challenges.ch6": "Crea algo: dibuja, escribe o canta",
      "challenges.ch7": "Haz sonre\xEDr a alguien hoy",
      // Self-Care Checklist
      "selfcare.title": "Lista de Autocuidado",
      "selfcare.subtitle": "Marca las tareas que completaste hoy",
      "selfcare.progress": "Progreso de hoy",
      "selfcare.completed": "Tareas completadas",
      "selfcare.allDone": "\xA1Todas las tareas completadas! \xA1Eres incre\xEDble! \u{1F31F}",
      "selfcare.t1": "\u{1F4A7} Beb\xED suficiente agua",
      "selfcare.t2": "\u{1F634} Dorm\xED bien (7+ horas)",
      "selfcare.t3": "\u{1F6B6} Hice alguna actividad f\xEDsica",
      "selfcare.t4": "\u{1F4F1} Limit\xE9 el tiempo de pantalla",
      "selfcare.t5": "\u{1F9D8} Practiqu\xE9 respiraci\xF3n/meditaci\xF3n",
      "selfcare.t6": "\u{1F91D} Habl\xE9 con alguien",
      "selfcare.t7": "\u{1F4DD} Escrib\xED en el diario",
      "selfcare.t8": "\u{1F60A} Hice algo que me trajo alegr\xEDa",
      // Nav extras
      "nav.pomodoro": "Pomodoro",
      "nav.challenges": "Desaf\xEDos",
      "nav.selfcare": "Autocuidado",
      "nav.breathing": "Respiraci\xF3n",
      "nav.gratitude": "Gratitud",
      "nav.affirmations": "Afirmaciones",
      "breathing.title": "Ejercicio de Respiraci\xF3n",
      "breathing.pattern478": "4-7-8 Relajante",
      "breathing.patternBox": "Cuadrado (4-4-4-4)",
      "breathing.patternCalm": "Calma (4-0-6)",
      "breathing.inhale": "Inspira...",
      "breathing.hold": "Mant\xE9n...",
      "breathing.exhale": "Exhala...",
      "breathing.inhaleDesc": "Respira lentamente por la nariz",
      "breathing.holdDesc": "Mant\xE9n el aire en los pulmones",
      "breathing.exhaleDesc": "Suelta el aire lentamente por la boca",
      "breathing.start": "Comenzar Ejercicio",
      "breathing.stop": "Detener",
      "breathing.cycles": "ciclos completados",
      "breathing.tip1": "Si\xE9ntate c\xF3modo con la espalda recta antes de comenzar",
      "breathing.tip2": "Cierra los ojos y conc\xE9ntrate solo en tu respiraci\xF3n",
      "breathing.tip3": "Si pierdes la concentraci\xF3n, vuelve suavemente al ritmo",
      "breathing.tip4": "Practica diariamente para mejores resultados",
      "gratitude.title": "Muro de Gratitud",
      "gratitude.prompt": "\xBFPor qu\xE9 est\xE1s agradecido hoy? \xA1Comparte tu gratitud!",
      "gratitude.placeholder": "Escribe algo por lo que est\xE1s agradecido...",
      "gratitude.post": "Publicar",
      "gratitude.empty": "Sin gratitudes a\xFAn. \xA1S\xE9 el primero en compartir!",
      "affirm.title": "Afirmaciones Diarias",
      "affirm.a1": "Soy fuerte y capaz de superar cualquier desaf\xEDo, como un minero enfrentando el Nether.",
      "affirm.a2": "Merezco respeto, amabilidad y un lugar seguro en el mundo.",
      "affirm.a3": "Cada d\xEDa es una nueva oportunidad de construir algo incre\xEDble.",
      "affirm.a4": "Mis sentimientos son v\xE1lidos e importantes.",
      "affirm.a5": "Soy suficiente exactamente como soy.",
      "affirm.a6": "Puedo pedir ayuda cuando la necesito \u2014 eso es coraje, no debilidad.",
      "affirm.a7": "El crecimiento ocurre un bloque a la vez.",
      "affirm.a8": "Merezco vivir en paz y seguridad.",
      "affirm.a9": "Tengo el poder de crear cambios positivos en mi vida.",
      "affirm.a10": "Cada desaf\xEDo me hace m\xE1s fuerte y m\xE1s sabio.",
      "affirm.a11": "Soy una persona valiosa y merezco ser tratada con amabilidad.",
      "affirm.a12": "Mi valor no est\xE1 definido por lo que los dem\xE1s piensan de m\xED.",
      "affirm.catSelf": "Autoestima",
      "affirm.catStrength": "Fuerza Interior",
      "affirm.catGrowth": "Crecimiento",
      "affirm.favorites": "Favoritos",
      "affirm.showAll": "Ver Todas",
      "affirm.hideAll": "Ocultar Lista",
      // Coping, Safety Plan, Leaderboard, Mood Insights, Dashboard additions
      "nav.coping": "Caja de Herramientas",
      "nav.safetyPlan": "Plan de Seguridad",
      "nav.leaderboard": "Marcador",
      "nav.moodInsights": "Insights del Estado de \xC1nimo",
      "coping.title": "Estrategias de Afrontamiento",
      "coping.subtitle": "Herramientas para ayudar en momentos dif\xEDciles",
      "coping.all": "Todos",
      "coping.breathing": "Respiraci\xF3n",
      "coping.grounding": "Enraizamiento",
      "coping.positiveThinking": "Pensamiento Positivo",
      "coping.physical": "F\xEDsico",
      "coping.social": "Social",
      "coping.creative": "Creativo",
      "coping.tryNow": "Probar Ahora",
      "coping.steps": "Pasos",
      "coping.step": "Paso",
      "coping.favorite": "Guardar en Favoritos",
      "coping.unfavorite": "Quitar de Favoritos",
      "coping.favorites": "Favoritos",
      "coping.noFavorites": "Sin estrategias favoritas a\xFAn",
      "coping.count": "estrategias",
      "coping.s1Title": "Respiraci\xF3n 4-7-8",
      "coping.s1Desc": "T\xE9cnica de respiraci\xF3n para calmar la mente r\xE1pidamente",
      "coping.s1Steps": "1. Inhala por 4 segundos|2. Aguanta por 7 segundos|3. Exhala por 8 segundos|4. Repite 4 veces",
      "coping.s2Title": "Respiraci\xF3n Diafragm\xE1tica",
      "coping.s2Desc": "Respira profundamente usando el diafragma para relajarte",
      "coping.s2Steps": "1. Coloca la mano en el abdomen|2. Inhala lentamente por la nariz|3. Siente el abdomen expandirse|4. Exhala lentamente por la boca|5. Repite 10 veces",
      "coping.s3Title": "Respiraci\xF3n Cuadrada",
      "coping.s3Desc": "Respiraci\xF3n r\xEDtmica para equilibrar cuerpo y mente",
      "coping.s3Steps": "1. Inhala por 4 segundos|2. Aguanta por 4 segundos|3. Exhala por 4 segundos|4. Aguanta vac\xEDo por 4 segundos|5. Repite 5 ciclos",
      "coping.s4Title": "T\xE9cnica 5-4-3-2-1",
      "coping.s4Desc": "Usa tus sentidos para enfocarte en el momento presente",
      "coping.s5Title": "Nombra 5 Cosas",
      "coping.s5Desc": "Enumera cosas que puedes ver a tu alrededor para enraizarte",
      "coping.s6Title": "Reestructuraci\xF3n de Pensamientos",
      "coping.s6Desc": "Transforma pensamientos negativos en positivos",
      "coping.s7Title": "Afirmaciones Positivas",
      "coping.s7Desc": "Repite frases positivas para fortalecer tu autoestima",
      "coping.s8Title": "Caminata Consciente",
      "coping.s8Desc": "Camina prestando atenci\xF3n a tus pasos y respiraci\xF3n",
      "coping.s9Title": "Estiramiento R\xE1pido",
      "coping.s9Desc": "Estira tu cuerpo para liberar tensi\xF3n f\xEDsica",
      "coping.s10Title": "Hablar con Alguien",
      "coping.s10Desc": "Habla con una persona de confianza sobre c\xF3mo te sientes",
      "coping.s11Title": "Pedir Ayuda a un Adulto",
      "coping.s11Desc": "Busca un adulto de confianza cuando necesites apoyo",
      "coping.s12Title": "Dibujar o Pintar",
      "coping.s12Desc": "Usa el arte para expresar tus emociones",
      "safety.title": "Mi Plan de Seguridad",
      "safety.subtitle": "Crea un plan personal para mantenerte seguro",
      "safety.create": "Crear Plan",
      "safety.edit": "Editar Plan",
      "safety.save": "Guardar Plan",
      "safety.saved": "\xA1Plan guardado con \xE9xito!",
      "safety.step1Title": "Mis Se\xF1ales de Alerta",
      "safety.step1Desc": "Qu\xE9 pensamientos o sentimientos me dicen que necesito ayuda",
      "safety.step1Placeholder": "Ej: Me siento abrumado, quiero estar solo...",
      "safety.step2Title": "Mis Estrategias de Afrontamiento",
      "safety.step2Desc": "Cosas que puedo hacer para sentirme mejor",
      "safety.step2Placeholder": "Ej: Respiraci\xF3n profunda, Hablar con un amigo, Escuchar m\xFAsica...",
      "safety.step3Title": "Personas en Quien Conf\xEDo",
      "safety.step3Desc": "Personas a las que puedo recurrir para apoyo",
      "safety.step3Placeholder": "Ej: Mam\xE1: 55-11-99999-0000, Profesora Mar\xEDa...",
      "safety.step4Title": "Lugares Seguros",
      "safety.step4Desc": "Lugares donde me siento tranquilo y seguro",
      "safety.step4Placeholder": "Ej: Biblioteca de la escuela, Mi habitaci\xF3n, El parque...",
      "safety.noPlan": "A\xFAn no has creado un plan de seguridad.",
      "safety.noPlanDesc": "Crear un plan de seguridad te ayuda a saber qu\xE9 hacer cuando te sientes inseguro.",
      "safety.completed": "\xA1Tu plan de seguridad est\xE1 listo! Gu\xE1rdalo en un lugar accesible.",
      "safety.addSign": "Agregar se\xF1al de alerta",
      "safety.addContact": "Agregar contacto",
      "safety.addPlace": "Agregar lugar",
      "leaderboard.title": "Marcador",
      "leaderboard.subtitle": "Mejores jugadores en el mundo Minecraft",
      "leaderboard.rank": "Posici\xF3n",
      "leaderboard.player": "Jugador",
      "leaderboard.score": "Puntuaci\xF3n",
      "leaderboard.level": "Nivel",
      "leaderboard.you": "T\xFA",
      "leaderboard.noEntries": "Sin registros a\xFAn. \xA1Juega para entrar en el marcador!",
      "leaderboard.topScore": "Tu Mejor Puntuaci\xF3n",
      "leaderboard.submitScore": "Enviar Puntuaci\xF3n",
      "insights.title": "Insights del Estado de \xC1nimo",
      "insights.subtitle": "Entiende tus patrones emocionales",
      "insights.totalEntries": "Total de Registros",
      "insights.avgPerDay": "Promedio/D\xEDa",
      "insights.currentStreak": "Racha Actual",
      "insights.longestStreak": "Mayor Racha",
      "insights.trend": "Tendencia",
      "insights.improving": "Mejorando",
      "insights.stable": "Estable",
      "insights.declining": "Necesita Atenci\xF3n",
      "insights.weeklyAverage": "Promedio Semanal",
      "insights.noData": "\xA1Empieza a rastrear tu estado de \xE1nimo para ver insights aqu\xED!",
      "insights.days": "d\xEDas",
      "dashboard.copingDesc": "Estrategias para momentos dif\xEDciles",
      "dashboard.safetyPlanDesc": "Tu plan de seguridad personal",
      "dashboard.leaderboardDesc": "Mejores puntuaciones del juego",
      "dashboard.moodInsightsDesc": "Tus patrones emocionales",
      // StudyHelp
      "nav.studyHelp": "Estudios",
      "nav.more": "M\xE1s",
      "studyHelp.title": "\u{1F4D6} Ayuda de Estudios",
      "studyHelp.subtitle": "Banco de preguntas para diferentes a\xF1os de secundaria",
      "studyHelp.selectYear": "Seleccionar A\xF1o",
      "studyHelp.selectSubject": "Seleccionar Materia",
      "studyHelp.start": "Iniciar Quiz",
      "studyHelp.correct": "\xA1Correcto! \u2705",
      "studyHelp.wrong": "Incorrecto \u274C",
      "studyHelp.score": "Puntuaci\xF3n",
      "studyHelp.next": "Siguiente",
      "studyHelp.finish": "Finalizar",
      "studyHelp.year1": "1\xBA A\xF1o",
      "studyHelp.year2": "2\xBA A\xF1o",
      "studyHelp.year3": "3\xBA A\xF1o",
      "studyHelp.math": "Matem\xE1ticas",
      "studyHelp.portuguese": "Portugu\xE9s",
      "studyHelp.science": "Ciencias",
      "studyHelp.history": "Historia",
      "studyHelp.geography": "Geografia",
      "studyHelp.of": "de",
      "studyHelp.question": "Pregunta",
      "studyHelp.noQuestions": "No hay preguntas para esta combinaci\xF3n.",
      "studyHelp.results": "Resultado Final",
      "studyHelp.perfect": "\xA1Perfecto! Dominas el contenido! \u{1F3C6}",
      "studyHelp.great": "\xA1Muy bien! Sigue as\xED! \u2B50",
      "studyHelp.good": "\xA1Buen trabajo! Repasa los errores. \u{1F4DA}",
      "studyHelp.needsWork": "\xA1Sigue estudiando! \xA1T\xFA puedes! \u{1F4AA}",
      "studyHelp.restart": "Intentar de Nuevo",
      "studyHelp.back": "Volver"
    },
    kaingang: {
      "nav.landing": "P\xE1gina Principal",
      "nav.chatbot": "Chat de Apoyo",
      "nav.quiz": "Quiz",
      "nav.friends": "Kanjuk",
      "nav.vent": "Fala",
      "nav.minigame": "Jogo",
      "nav.login": "K\xF3g Jy",
      "nav.register": "K\xF3g M\xF3s",
      "nav.admin": "Administra\xE7\xE3o",
      "nav.emergency": "Jepy'apy",
      "nav.accessibility": "Acessibilidade",
      "landing.hero": "Teko S\xE3 - Sa\xFAde Mental no Mundo dos Blocos",
      "landing.subtitle": "K\xF3g kanhgr\xF5 t\xEFnh mimb\xE9 kanhgr\xF5",
      "landing.description": "Kanhgr\xF5 k\xF3g tek\xF3 s\xE3, informaci\xF3n sa\xFAde mental y ferramentas para lidar con bullying \u2014 todo en un ambiente inspirado en Minecraft.",
      "landing.cta1": "K\xF3g R\xF6g",
      "landing.cta2": "Painel",
      "landing.cta3": "Kanhgr\xF5",
      "landing.cta4": "Pronto para construir um mundo melhor?",
      "landing.cta5": "Junte-se a milhares de estudantes que j\xE1 encontraram apoio aqui!",
      "landing.features": "O que voc\xEA pode fazer",
      "landing.characters": "Seus aliados",
      "landing.char1": "Como Steve, voc\xEA constr\xF3i sua jornada.",
      "landing.char2": "Alex nos ensina que ser diferente \xE9 for\xE7a.",
      "landing.char3": "Alde\xF5es mostram que comunidade unida \xE9 forte.",
      "landing.char4": "Golem de Ferro \xE9 o protetor.",
      "landing.stat1": "Apoio Dispon\xEDvel",
      "landing.stat2": "Conversas Seguras",
      "landing.stat3": "Idiomas",
      "landing.stat4": "Divers\xE3o",
      "landing.feature1Title": "Chatbot de Apoio",
      "landing.feature1Desc": "Converse com MineBot sobre sa\xFAde mental.",
      "landing.feature2Title": "Quiz",
      "landing.feature2Desc": "Teste seus conhecimentos sobre sa\xFAde mental.",
      "landing.feature3Title": "Encontrar Kanjuk",
      "landing.feature3Desc": "Conecte-se com outros estudantes.",
      "landing.feature4Title": "Mini Jogo",
      "landing.feature4Desc": "Relaxe com o mini jogo Minecraft.",
      "landing.feature5Title": "Chat de Desabafos",
      "landing.feature5Desc": "Desabafe em um espa\xE7o seguro.",
      "landing.feature6Title": "Acessibilidade",
      "landing.feature6Desc": "Alto contraste, texto grande e audiodescri\xE7\xE3o.",
      "auth.login": "K\xF3g Jy",
      "auth.register": "K\xF3g M\xF3s",
      "auth.username": "Nome",
      "auth.email": "Email",
      "auth.password": "Senha",
      "auth.confirmPassword": "Confirmar Senha",
      "auth.minecraftName": "Nome Minecraft",
      "auth.submit": "K\xF3g",
      "auth.noAccount": "N\xE3o tem conta? Cadastre-se",
      "auth.hasAccount": "J\xE1 tem conta? Entre",
      "auth.logout": "Mboro",
      "auth.adminLogin": "Admin",
      "chatbot.title": "MineBot - Chat de Apoio",
      "chatbot.placeholder": "Kanhgr\xF5... \u{1F49A}",
      "chatbot.send": "K\xF3g",
      "chatbot.suggestions": "Perguntas sugeridas",
      "chatbot.sug1": "Como lidar com ansiedade?",
      "chatbot.sug2": "O que fazer se sofro bullying?",
      "chatbot.sug3": "Como ajudar um amigo?",
      "chatbot.sug4": "Sinais de depress\xE3o?",
      "chatbot.sug5": "Como pedir ajuda?",
      "chatbot.sug6": "Exerc\xEDcios de respira\xE7\xE3o",
      "chatbot.welcome": "Jykr\xE9! Nha MineBot \u26CF\uFE0F\u{1F916}! Kanhgr\xF5 k\xF3g jykre tek\xF3 s\xE3. Munh\xE3 nhin?",
      "chatbot.typing": "Kanhgr\xF5...",
      "chatbot.processError": "Mba'ap\xE9 jagwa. Tente nhov\xF5!",
      "chatbot.connectionError": "Jagwa k\xF3g. Tente nhov\xF5! \u26A0\uFE0F",
      "chatbot.you": "F\xE3g",
      "quiz.title": "Quiz de Sa\xFAde Mental",
      "quiz.start": "K\xF3g Quiz",
      "quiz.next": "Pr\xF3xima",
      "quiz.previous": "Anterior",
      "quiz.finish": "Finalizar",
      "quiz.result": "Resultado",
      "quiz.score": "corretas",
      "quiz.restart": "Refazer",
      "quiz.submitError": "Jagwa quiz",
      "quiz.q1": "O que \xE9 bullying?",
      "quiz.q1o1": "Brincadeira normal",
      "quiz.q1o2": "Comportamento agressivo e repetitivo",
      "quiz.q1o3": "Discuss\xE3o pontual",
      "quiz.q1o4": "Express\xE3o pessoal",
      "quiz.q2": "Qual N\xC3O \xE9 tipo de bullying?",
      "quiz.q2o1": "Bullying verbal",
      "quiz.q2o2": "Bullying f\xEDsico",
      "quiz.q2o3": "Discutir trabalho escolar",
      "quiz.q2o4": "Cyberbullying",
      "quiz.q3": "O que fazer se presenciar bullying?",
      "quiz.q3o1": "Fingir que n\xE3o viu",
      "quiz.q3o2": "Gravar e postar",
      "quiz.q3o3": "Procurar adulto de confian\xE7a",
      "quiz.q3o4": "Rir junto",
      "quiz.q4": "Como apoiar amigo v\xEDtima de bullying?",
      "quiz.q4o1": "Ouvir com empatia e incentivar ajuda",
      "quiz.q4o2": "Dizer para ignorar",
      "quiz.q4o3": "Confrontar agressivamente",
      "quiz.q4o4": "Afastar-se",
      "quiz.q5": "O que \xE9 ansiedade?",
      "quiz.q5o1": "Tristeza constante",
      "quiz.q5o2": "Resposta ao estresse que vira problema",
      "quiz.q5o3": "Falta de vontade",
      "quiz.q5o4": "Doen\xE7a contagiosa",
      "quiz.q6": "Sinais de depress\xE3o?",
      "quiz.q6o1": "Muita energia",
      "quiz.q6o2": "Tristeza persistente e isolamento",
      "quiz.q6o3": "Comer muito",
      "quiz.q6o4": "Gostar de solid\xE3o",
      "quiz.q7": "Para que \xE9 o n\xFAmero 180?",
      "quiz.q7o1": "Emerg\xEAncia m\xE9dica",
      "quiz.q7o2": "Pol\xEDcia Militar",
      "quiz.q7o3": "Disque Direitos Humanos",
      "quiz.q7o4": "Bombeiros",
      "quiz.q8": "O que \xE9 cyberbullying?",
      "quiz.q8o1": "Bullying pela internet",
      "quiz.q8o2": "Bullying s\xF3 em jogos",
      "quiz.q8o3": "V\xEDrus de computador",
      "quiz.q8o4": "Ser batido no jogo",
      "quiz.q9": "Atitude mais saud\xE1vel?",
      "quiz.q9o1": "Falar sobre sentimentos",
      "quiz.q9o2": "Guardar tudo para si",
      "quiz.q9o3": "Fingir que est\xE1 bem",
      "quiz.q9o4": "Isolamento total",
      "quiz.q10": "CVV atende pelo n\xFAmero:",
      "quiz.q10o1": "180",
      "quiz.q10o2": "188",
      "quiz.q10o3": "192",
      "quiz.q10o4": "190",
      "quiz.q11": "Cyberbullying - h\xEFn mba'e?",
      "quiz.q11o1": "Jegwa t\u1EBD",
      "quiz.q11o2": "Internet rejyk\xFCre kyr\xE3",
      "quiz.q11o3": "Roubar mba'e",
      "quiz.q11o4": "Boato jyk\xFCre kanhgr\xF5",
      "quiz.q12": "Jegwa rei - mba'e jykre?",
      "quiz.q12o1": "Jegwa t\u1EBD",
      "quiz.q12o2": "Mboray\xFA nhin",
      "quiz.q12o3": "Huk\xE3 por\xE3 jykre t\u1EBD",
      "quiz.q12o4": "Jykre jegwa",
      "quiz.q13": "Teko mboray\xFA re?",
      "quiz.q13o1": "Huk\xE3 rei kor\xE3",
      "quiz.q13o2": "F\xE3g jykre mboray\xFA re",
      "quiz.q13o3": "Jykre t\u1EBD",
      "quiz.q13o4": "K\u0169\xED jagwa",
      "quiz.q14": "Nhe'\u1EBD por\xE3 - mba'e rehe?",
      "quiz.q14o1": "Jagwa jykre",
      "quiz.q14o2": "F\xE3g jegwa",
      "quiz.q14o3": "Nhe'\u1EBD jykre mboray\xFA ir\u0169",
      "quiz.q14o4": "Nh\xEDn jagwa",
      "quiz.q15": "Mboray\xFA ir\u0169 re?",
      "quiz.q15o1": "Py'achirei f\xE3g",
      "quiz.q15o2": "Ir\u0169 mboray\xFA jykre",
      "quiz.q15o3": "O\xF1emone\u0129 f\xE3g",
      "quiz.q15o4": "Ir\u0169 mba'e nhin",
      "quiz.q16": "K\u0169\xED - katu por\xE3?",
      "quiz.q16o1": "4-5 horas",
      "quiz.q16o2": "6-7 horas",
      "quiz.q16o3": "8-10 horas",
      "quiz.q16o4": "12+ horas",
      "quiz.q17": "Opy mboray\xFA?",
      "quiz.q17o1": "Opy katu jagr\xE3",
      "quiz.q17o2": "Opy nhe'\u1EBD por\xE3, jegwa nhin",
      "quiz.q17o3": "Opy tata jyk\xFCre",
      "quiz.q17o4": "F\xE3g nhenh\xE9ra",
      "quiz.q18": "Jegwa mboray\xFA - h\xEFn mba'e?",
      "quiz.q18o1": "Ir\u0169 k\xF3g",
      "quiz.q18o2": "Ir\u0169 jyk\xFCre",
      "quiz.q18o3": "Mba'e k\xF3g",
      "quiz.q18o4": "Jogo kanhgr\xF5",
      "quiz.q19": "Ir\u0169 py'achirei - mba'e ojapova'er\xE3?",
      "quiz.q19o1": "Nh\xEDn",
      "quiz.q19o2": "Kanhgr\xF5 f\xE3g",
      "quiz.q19o3": "Jykre, ir\u0169, k\xF3g nhenh\xE9ra",
      "quiz.q19o4": "Jegwa ir\u0169",
      "quiz.q20": "Teko por\xE3 jykre?",
      "quiz.q20o1": "Mboro jagwa",
      "quiz.q20o2": "Nh\xEDn katu",
      "quiz.q20o3": "Jykre tek\xF3 s\xE3 jegwa rei",
      "quiz.q20o4": "Py'achirei nhin",
      "friends.title": "Encontrar Kanjuk",
      "friends.search": "Buscar nome...",
      "friends.sendRequest": "Enviar Pedido",
      "friends.pending": "Pedidos Pendentes",
      "friends.accept": "Aceitar",
      "friends.reject": "Recusar",
      "friends.online": "Online",
      "friends.offline": "Offline",
      "friends.message": "Mensagem...",
      "friends.noFriends": "Kanjuk kat\xFD. Mande nhenh\xE9ra!",
      "friends.requestMsg": "Mensagem (jagr\xE3)",
      "friends.requestSent": "Nheng\xE9ra mboasy!",
      "friends.requestAccepted": "Nheng\xE9ra monhemy!",
      "friends.requestRejected": "Nheng\xE9ra jagwa",
      "friends.openChat": "Abre Chat",
      "vent.title": "Chat de Desabafos",
      "vent.placeholder": "Desabafe aqui... K\xF3g seguran \u{1F49A}",
      "vent.send": "K\xF3g",
      "vent.anonymous": "An\xF4nimo",
      "vent.report": "Denunciar",
      "vent.moderated": "\u{1F6AB} Moderado",
      "vent.reportTitle": "Denunciar mensagem",
      "vent.reportPlaceholder": "Motivo da den\xFAncia...",
      "vent.reportSent": "Den\xFAncia enviada",
      "vent.noMessages": "Mba'e kat\xFD. Kanhgr\xF5 nh\u1EBDnh\xE1!",
      "tips.title": "Dicas Teko S\xE3",
      "tips.tip1Title": "Huk\xE3 Por\xE3 \u{1F32C}\uFE0F",
      "tips.tip1Desc": "Kanhgr\xF5 jykre, ro huk\xE3 3 jekupy. Nh\u1EBD por\xE3, t\u1EBD por\xE3, katu mongarai.",
      "tips.tip2Title": "Fala mimb\xE9 jah\xFA \u{1F5E3}\uFE0F",
      "tips.tip2Desc": "Kanhgr\xF5 nh\u1EBD k\xF3g f\xE3g mboray\xFA. Nh\xEDn jegwa katu.",
      "tips.tip3Title": "Pausa Digital \u{1F4F5}",
      "tips.tip3Desc": "Mboro katu internet. T\xEFnh r\xF3g por\xE3 katu.",
      "tips.tip4Title": "Jykre T\u1EBD \u{1F4AA}",
      "tips.tip4Desc": "Nh\xF3 katu, ka'aguy por\xE3, tek\xF3 s\xE3 mimb\xE9 jah\xFA.",
      "tips.breathStart": "K\xF3g Jekupy",
      "tips.inhale": "Huk\xE3",
      "tips.hold": "T\u1EBD",
      "tips.exhale": "Mongarai",
      "mood.title": "Munh\xE3 jykre re?",
      "mood.select": "Selecione tek\xF3:",
      "mood.happy": "\u{1F60A} Mboray\xFA",
      "mood.sad": "\u{1F622} Py'achirei",
      "mood.anxious": "\u{1F630} Nh\xEDjy",
      "mood.angry": "\u{1F624} Jegwa",
      "mood.calm": "\u{1F60C} Tengatu",
      "mood.tired": "\u{1F634} Teng",
      "mood.save": "Salv\xE1r Humor",
      "mood.history": "Temimbe",
      "mood.today": "Kor\xE3",
      "mood.noData": "Mba'e kat\xFD. K\xF3g nhenh\xE9ra!",
      "mood.encouragement": "Jykre nh\xEDn! Teko s\xE3 por\xE3 mimb\xE9 jah\xFA.",
      "minigame.title": "MentalCraft Runner",
      "minigame.start": "Jogar",
      "minigame.score": "pontos",
      "minigame.gameOver": "Fim de Jogo!",
      "minigame.playAgain": "Jogar Novamente",
      "minigame.instructions": "Use setas ou WASD para mover e pular!",
      "admin.title": "Administra\xE7\xE3o",
      "admin.users": "Usu\xE1rios",
      "admin.reports": "Den\xFAncias",
      "admin.messages": "Mensagens",
      "admin.moderate": "Moderar",
      "admin.ban": "Banir",
      "admin.unban": "Desbanir",
      "admin.approve": "Aprovar",
      "admin.reject": "Rejeitar",
      "admin.resolve": "Resolver",
      "admin.panelTitle": "Painel Admin",
      "admin.reportsTitle": "Den\xFAncias",
      "admin.usersTitle": "Usu\xE1rios",
      "admin.messagesTitle": "Mensagens",
      "admin.back": "\u2190 Volt\xE1r",
      "admin.noReports": "Den\xFAncia kat\xFD",
      "admin.by": "Por:",
      "admin.unknown": "Jagwa nhin",
      "admin.adminNotes": "Notas admin...",
      "admin.review": "\u{1F440} Revis\xE1r",
      "admin.userBanned": "Usu\xE1rio banido",
      "admin.userUnbanned": "Usu\xE1rio desbanido",
      "admin.status": "Status",
      "admin.actions": "A\xE7\xF5es",
      "admin.actionDone": "A\xE7\xE3o feita",
      "admin.ventMessages": "Mensagens do Chat de Desabafos",
      "admin.moderated": "Moderado",
      "emergency.title": "N\xFAmeros de Emerg\xEAncia",
      "emergency.call180": "Direitos Humanos",
      "emergency.call192": "SAMU",
      "emergency.call190": "Pol\xEDcia",
      "emergency.description180": "Direitos Humanos - Viol\xEAncia",
      "emergency.description192": "SAMU - Emerg\xEAncia M\xE9dica",
      "emergency.description190": "Pol\xEDcia - Emerg\xEAncia",
      "emergency.description188": "CVV - Centro de Valoriza\xE7\xE3o da Vida",
      "footer.links": "Links R\xE1pidos",
      "accessibility.title": "Acessibilidade",
      "accessibility.desc": "K\xF3g por\xE3 nhin nh\xEDn.",
      "accessibility.highContrast": "Alto Contraste",
      "accessibility.highContrastDesc": "Jykre kontraste por\xE3 nh\u1EBD",
      "accessibility.largeText": "Texto Grande",
      "accessibility.largeTextDesc": "K\xF3g nhin jah\xFA katu",
      "accessibility.audioDescription": "Audiodescri\xE7\xE3o",
      "accessibility.audioDescDesc": "Kanhgr\xF5 \xF1e'\u1EBD por\xE3",
      "accessibility.reset": "Redefinir",
      "errors.loginRequired": "K\xF3g Jy nhenh\xE9ra!",
      "errors.passwordMismatch": "Senha jagwa nhinh\xE1ra!",
      "errors.connectionError": "Jagwa k\xF3g",
      "errors.requestError": "Jagwa nhenh\xE9ra",
      "common.loading": "K\xF3g...",
      "common.error": "Erro",
      "common.success": "K\xF3g m\xF3s!",
      "common.cancel": "Cancelar",
      "common.save": "Salv\xE1r",
      "common.delete": "Delet\xE1r",
      "common.close": "Fech\xE1r",
      "common.back": "Volt\xE1r",
      "common.welcome": "Jykr\xE9",
      "common.language": "Idioma",
      "nav.achievements": "Kunh\xE3",
      "nav.resources": "Kanjuk",
      "achievements.title": "Kunh\xE3",
      "achievements.subtitle": "Kanjuk kunh\xE3 MentalCraft",
      "achievements.unlocked": "Kunh\xE3",
      "achievements.total": "Total",
      "achievements.locked": "Mboray\xFA",
      "achievements.newUnlocked": "Kunh\xE3 jykre!",
      "achievements.rarity.common": "T\u1EBD",
      "achievements.rarity.uncommon": "Kunh\xE3",
      "achievements.rarity.rare": "Jykre",
      "achievements.rarity.epic": "Tup\xE3",
      "achievements.rarity.legendary": "Jakaira",
      "achievements.progress": "Teko",
      "resources.title": "Teko S\xE3 Kanjuk",
      "resources.subtitle": "Teko s\xE3 kanjuk mboray\xFA",
      "resources.category.anxiety": "Huk\xE3",
      "resources.category.depression": "Jykre",
      "resources.category.bullying": "Mboray\xFA",
      "resources.category.selfesteem": "Teko",
      "resources.category.sleep": "K\u0169\xED",
      "resources.category.stress": "Huk\xE3",
      "resources.readMore": "Kanjuk",
      "dashboard.dailyTip": "Kanjuk Kyr\xE3",
      "dashboard.moodStreak": "Teko Huk\xE3",
      "dashboard.achievementShowcase": "Kunh\xE3 Kunh\xE3",
      "dashboard.viewAll": "Kunh\xE3",
      "dashboard.noAchievements": "Mboray\xFA kunh\xE3. Kanjuk!",
      "nav.profile": "Teko",
      "profile.title": "Teko",
      "profile.stats": "Kanjuk",
      "profile.joined": "Teko",
      "profile.mcName": "Minecraft Kunh\xE3",
      "profile.role": "Teko",
      "profile.quizBest": "Quiz Jykre",
      "profile.moodEntries": "Huk\xE3 Kanjuk",
      "profile.friends": "Ir\u0169",
      "profile.achievements": "Kunh\xE3",
      "profile.recentActivity": "Kanjuk",
      "profile.noActivity": "Mboray\xFA kanjuk",
      "profile.editProfile": "Teko",
      "profile.changeMcName": "Minecraft",
      "profile.save": "Mboray\xFA",
      "profile.cancel": "Mboyve",
      "game.lives": "Teko",
      "game.level": "Kunh\xE3",
      "game.powerup": "Teko",
      "game.shield": "Teko",
      "game.speed": "Teko",
      "game.magnet": "Teko",
      "game.enemy": "Kyry",
      "game.newHighScore": "Kunh\xE3!",
      "game.points": "nhenh\xE9ra",
      // Nav extras
      "nav.journal": "Jah\xFA R\xF3g",
      "nav.soundEffects": "Nhe'\u1EBD Por\xE3",
      // Landing extras
      "landing.feature7Title": "Jah\xFA R\xF3g",
      "landing.feature7Desc": "Nhe'\u1EBD por\xE3 kanhgr\xF5 kor\xE3",
      "landing.feature8Title": "Nhe'\u1EBD Por\xE3",
      "landing.feature8Desc": "Minecraft nhe'\u1EBD por\xE3",
      // Common extras
      "common.goodbye": "T\xF5nh\xE3",
      // Profile extras
      "profile.admin": "F\xE3g Tuja",
      "profile.player": "Jogador",
      // Mood extras
      "mood.dashboardDesc": "Teko s\xE3 jah\xE9i kor\xE3 r\xF3g por\xE3",
      "mood.chartTitle": "Tek\xF3 Gr\xE1fico",
      "mood.last7Days": "7 Kor\xE3",
      "mood.moodTrend": "Teko",
      // Accessibility extras
      "accessibility.soundEffects": "Nhe'\u1EBD Por\xE3",
      "accessibility.soundEffectsDesc": "Minecraft nhe'\u1EBD k\xF3g",
      // Journal
      "journal.title": "Jah\xFA R\xF3g",
      "journal.subtitle": "Nhe'\u1EBD por\xE3 kanhgr\xF5",
      "journal.prompt": "Munh\xE3 jykre re? Mba'e por\xE3 jah\xE9i?",
      "journal.save": "Salv\xE1r Jah\xFA",
      "journal.saved": "Jah\xFA salv\xE1r!",
      "journal.entries": "Jah\xFA Temimbe",
      "journal.noEntries": "Jah\xFA kat\xFD. Kanhgr\xF5 jah\xFA!",
      "journal.delete": "Mboro",
      "journal.confirmDelete": "Jykre nhin?",
      // Sound
      "sound.click": "Mongarai",
      "sound.success": "Por\xE3",
      "sound.error": "Jagwa",
      "sound.achievement": "Kunh\xE3",
      "sound.ambient": "Ka'aguy",
      // Notifications
      "notifications.title": "Nhenh\xE9ra",
      "notifications.noNotifications": "Nhenh\xE9ra kat\xFD",
      "notifications.markRead": "Jah\xE9i",
      "notifications.friendRequest": "kanjuk nheng\xE9ra",
      "notifications.achievementUnlock": "Kunh\xE3 jykre:",
      "notifications.clearAll": "Mba'e kat\xFD",
      // Dashboard extras
      "dashboard.notificationBadge": "nhenh\xE9ra",
      "dashboard.journalDesc": "Nhe'\u1EBD por\xE3 kanhgr\xF5",
      "dashboard.soundDesc": "Nhe'\u1EBD por\xE3 k\xF3g",
      // Biome Theme
      "biome.title": "Jykre",
      "biome.forest": "\u{1F33F} Ka'ag",
      "biome.nether": "\u{1F525} Kur\xE3",
      "biome.end": "\u2728 Py\xE3",
      "biome.desc": "Jykre",
      // Pomodoro Timer
      "pomodoro.title": "Ker\xE3",
      "pomodoro.focus": "Huk\xE3",
      "pomodoro.break": "K\u0169\xED",
      "pomodoro.start": "Kanjuk",
      "pomodoro.pause": "Pyt\xE3",
      "pomodoro.reset": "Kanjuk",
      "pomodoro.sessions": "Ker\xE3",
      "pomodoro.focusTip": "Huk\xE3 teko s\xE3",
      "pomodoro.breakTip": "K\u0169\xED teko s\xE3",
      "pomodoro.completed": "Kanjuk! \u26CF\uFE0F",
      // Daily Challenges
      "challenges.title": "Kanjuk",
      "challenges.subtitle": "Kanjuk teko s\xE3",
      "challenges.completed": "Kanjuk! \u2705",
      "challenges.xpReward": "+50 XP",
      "challenges.streak": "Kanjuk teko",
      "challenges.days": "ar\xE1",
      "challenges.markDone": "Kanjuk",
      "challenges.history": "Jykre",
      "challenges.ch1": "Kanjuk 3",
      "challenges.ch2": "Huk\xE3",
      "challenges.ch3": "Ir\u0169 \xF1e'\u1EBD",
      "challenges.ch4": "Teko s\xE3 5",
      "challenges.ch5": "Mba'e 1",
      "challenges.ch6": "Jykre",
      "challenges.ch7": "Kanjuk",
      // Self-Care Checklist
      "selfcare.title": "Teko S\xE3",
      "selfcare.subtitle": "Teko s\xE3 kanjuk",
      "selfcare.progress": "Teko s\xE3",
      "selfcare.completed": "Kanjuk",
      "selfcare.allDone": "Kanjuk! \u{1F31F}",
      "selfcare.t1": "\u{1F4A7} Y",
      "selfcare.t2": "\u{1F634} Ker",
      "selfcare.t3": "\u{1F6B6} Huk\xE3",
      "selfcare.t4": "\u{1F4F1} Huk\xE3",
      "selfcare.t5": "\u{1F9D8} Teko s\xE3",
      "selfcare.t6": "\u{1F91D} Ir\u0169",
      "selfcare.t7": "\u{1F4DD} Jykre",
      "selfcare.t8": "\u{1F60A} Kanjuk",
      // Nav extras
      "nav.pomodoro": "Ker\xE3",
      "nav.challenges": "Kanjuk",
      "nav.selfcare": "Teko S\xE3",
      "nav.breathing": "Kuw\xE3",
      "nav.gratitude": "Aguyje",
      "nav.affirmations": "Jerekoha",
      "breathing.title": "Kuw\xE3 Jeguaka",
      "breathing.pattern478": "4-7-8 Mongeta",
      "breathing.patternBox": "Kanguku (4-4-4-4)",
      "breathing.patternCalm": "Teko (4-0-6)",
      "breathing.inhale": "Kuw\xE3...",
      "breathing.hold": "Mo\xE3...",
      "breathing.exhale": "Jekupe...",
      "breathing.inhaleDesc": "Kuw\xE3 kaaguy",
      "breathing.holdDesc": "Mo\xE3 kuw\xE3",
      "breathing.exhaleDesc": "Jekupe kuw\xE3",
      "breathing.start": "He\xF1oi",
      "breathing.stop": "Joko",
      "breathing.cycles": "rehe",
      "breathing.tip1": "Teko s\xE3 o\xF1embo_e",
      "breathing.tip2": "Mba_e nemongeta kuw\xE3 rehe",
      "breathing.tip3": "Jey kuw\xE3",
      "breathing.tip4": "Ku\xE9ra rehe",
      "gratitude.title": "Aguyje Renda",
      "gratitude.prompt": "Mba_e aguyje?",
      "gratitude.placeholder": "Aguyje rehe...",
      "gratitude.post": "He\xF1oi",
      "gratitude.empty": "Ndaip\xF3ri aguyje",
      "affirm.title": "Jerekoha Ara",
      "affirm.a1": "Ane kuarahy, ane pya_u",
      "affirm.a2": "Ane teko s\xE3",
      "affirm.a3": "Ara pyahu jeguaka",
      "affirm.a4": "Ane monge",
      "affirm.a5": "Ane teko",
      "affirm.a6": "Ane kerayv\xF5",
      "affirm.a7": "Jegua ku\xE9ra",
      "affirm.a8": "Ane teko pya\xFAva",
      "affirm.a9": "Ane pya_u",
      "affirm.a10": "Ane kanguku",
      "affirm.a11": "Ane teko s\xE3",
      "affirm.a12": "Ane monge",
      "affirm.catSelf": "Teko S\xE3",
      "affirm.catStrength": "Pya_u",
      "affirm.catGrowth": "Jegua",
      "affirm.favorites": "Mboray\xFA",
      "affirm.showAll": "Hecha",
      "affirm.hideAll": "Moka\xF1y",
      // Coping, Safety Plan, Leaderboard, Mood Insights, Dashboard additions
      "nav.coping": "J\xE3 K\xE3g",
      "nav.safetyPlan": "K\xE3g Nh\xF5",
      "nav.leaderboard": "Top P\xF5r",
      "nav.moodInsights": "Teko Kar",
      "coping.title": "J\xE3 K\xE3g",
      "coping.subtitle": "J\xE3 k\xE3g nhem\xF5re t\u0169j",
      "coping.all": "K\u0169nhi",
      "coping.breathing": "Nh\xF5 K\xF3",
      "coping.grounding": "Nh\xF5 S\xE3",
      "coping.positiveThinking": "Nhem\xF5re T\u0169j",
      "coping.physical": "Pangi",
      "coping.social": "P\xF5r",
      "coping.creative": "Jekup\xE9",
      "coping.tryNow": "Jokre",
      "coping.steps": "Ty",
      "coping.step": "Ty",
      "coping.favorite": "Nhemongar",
      "coping.unfavorite": "Moka\xF1y",
      "coping.favorites": "Korang\xE3",
      "coping.noFavorites": "Korang\xE3 m\xF5k\xE3",
      "coping.count": "j\xE3",
      "coping.s1Title": "Nh\xF5 4-7-8",
      "coping.s1Desc": "Nh\xF5 k\xE3g nhem\xF5re t\u0169j",
      "coping.s1Steps": "1. Nh\xF5|2. Kar\xE3|3. Nh\xF5 mang\xE3|4. 4 jere",
      "coping.s2Title": "Nh\xF5 Pangi",
      "coping.s2Desc": "Nh\xF5 k\xE3g pangi",
      "coping.s2Steps": "1. M\xE3o pangi|2. Nh\xF5|3. Pangi nh\xF5|4. Mang\xE3|5. 10 jere",
      "coping.s3Title": "Nh\xF5 Kr\u0129",
      "coping.s3Desc": "Nh\xF5 k\xE3g kr\u0129",
      "coping.s3Steps": "1. Nh\xF5 4|2. Kar\xE3 4|3. Mang\xE3 4|4. Kar\xE3 4|5. 5 jere",
      "coping.s4Title": "5-4-3-2-1",
      "coping.s4Desc": "J\xEAr nh\xF5 kr\u0129",
      "coping.s5Title": "J\xEAr 5 J\xE3",
      "coping.s5Desc": "J\xEAr j\xE3 nh\xF5",
      "coping.s6Title": "Nhem\xF5re T\u0169j",
      "coping.s6Desc": "Nhem\xF5re gir\xE3 t\u0169j",
      "coping.s7Title": "Nh\u1EBD\u1EBD T\u0169j",
      "coping.s7Desc": "Nh\u1EBD\u1EBD t\u0169j nhemongar",
      "coping.s8Title": "Jere Nh\xF5",
      "coping.s8Desc": "Jere nhem\xF5re nh\xF5",
      "coping.s9Title": "Kori Pangi",
      "coping.s9Desc": "Kori pangi k\xE3g",
      "coping.s10Title": "Nh\u1EBD\u1EBD P\xF5r",
      "coping.s10Desc": "Nh\u1EBD\u1EBD p\xF5r nhem\xF5re",
      "coping.s11Title": "Jukre P\xF5r",
      "coping.s11Desc": "Jokre p\xF5r k\xE3g",
      "coping.s12Title": "Jekup\xE9",
      "coping.s12Desc": "Jekup\xE9 nhem\xF5re",
      "safety.title": "K\xE3g Nh\xF5",
      "safety.subtitle": "J\xE3 k\xE3g nh\xF5 t\u0169j",
      "safety.create": "J\xE3 K\xE3g",
      "safety.edit": "Kori K\xE3g",
      "safety.save": "Kang\xE3 K\xE3g",
      "safety.saved": "K\xE3g kang\xE3!",
      "safety.step1Title": "Teko Gir\xE3",
      "safety.step1Desc": "Teko nhem\xF5re k\xE3g",
      "safety.step1Placeholder": "Nhem\xF5re gir\xE3...",
      "safety.step2Title": "J\xE3 K\xE3g",
      "safety.step2Desc": "J\xE3 k\xE3g t\u0169j",
      "safety.step2Placeholder": "J\xE3 k\xE3g nh\u1EBD\u1EBD, nh\u1EBD\u1EBD ir\u0169...",
      "safety.step3Title": "P\xF5r K\xF3",
      "safety.step3Desc": "P\xF5r k\xE3g",
      "safety.step3Placeholder": "P\xF5r k\xF3 nh\u1EBD\u1EBD...",
      "safety.step4Title": "Nh\xF5 T\u0169j",
      "safety.step4Desc": "Nh\xF5 t\u0169j k\xF3",
      "safety.step4Placeholder": "Kanhg\xE1g, k\xF3...",
      "safety.noPlan": "K\xE3g nh\xF5 m\xF5k\xE3.",
      "safety.noPlanDesc": "K\xE3g nh\xF5 j\xE3 k\xE3g t\u0169j.",
      "safety.completed": "K\xE3g nh\xF5 t\u0169j!",
      "safety.addSign": "J\xE3 teko",
      "safety.addContact": "J\xE3 p\xF5r",
      "safety.addPlace": "J\xE3 nh\xF5",
      "leaderboard.title": "Top P\xF5r",
      "leaderboard.subtitle": "Top p\xF5r jogo",
      "leaderboard.rank": "Top",
      "leaderboard.player": "P\xF5r",
      "leaderboard.score": "Kori",
      "leaderboard.level": "Jegua",
      "leaderboard.you": "An\xEA",
      "leaderboard.noEntries": "M\xF5k\xE3 p\xF5r jogo.",
      "leaderboard.topScore": "Kori T\u0169j",
      "leaderboard.submitScore": "Kang\xE3 Kori",
      "insights.title": "Teko Kar",
      "insights.subtitle": "J\xEAr teko nhem\xF5re",
      "insights.totalEntries": "Korang\xE3",
      "insights.avgPerDay": "Kr\u0129/Jere",
      "insights.currentStreak": "Jere T\u0169j",
      "insights.longestStreak": "Jere Nh\xF5",
      "insights.trend": "Ty",
      "insights.improving": "Jegua",
      "insights.stable": "T\u0169j",
      "insights.declining": "K\xE3g",
      "insights.weeklyAverage": "Kunh\u0129 Kr\u0129",
      "insights.noData": "J\xEAr teko kar!",
      "insights.days": "kr\u0129",
      "dashboard.copingDesc": "J\xE3 k\xE3g nhem\xF5re gir\xE3",
      "dashboard.safetyPlanDesc": "K\xE3g nh\xF5 an\xEA",
      "dashboard.leaderboardDesc": "Top kori jogo",
      "dashboard.moodInsightsDesc": "Teko nhem\xF5re an\xEA",
      // StudyHelp
      "nav.studyHelp": "K\xF3g",
      "nav.more": "Mba'e",
      "studyHelp.title": "\u{1F4D6} K\xF3g R\xE3",
      "studyHelp.subtitle": "Jykre kyry ensino m\xE9dio",
      "studyHelp.selectYear": "K\xF3g jyr\xE3",
      "studyHelp.selectSubject": "Mba'e jyr\xE3",
      "studyHelp.start": "K\xF3g",
      "studyHelp.correct": "Por\xE3! \u2705",
      "studyHelp.wrong": "Nh\xEDn \u274C",
      "studyHelp.score": "Jykre",
      "studyHelp.next": "Kanhgr\xF5",
      "studyHelp.finish": "Jegw\xE3",
      "studyHelp.year1": "1\xBA Jyr\xE3",
      "studyHelp.year2": "2\xBA Jyr\xE3",
      "studyHelp.year3": "3\xBA Jyr\xE3",
      "studyHelp.math": "Jykre",
      "studyHelp.portuguese": "\xD1e'\u1EBD",
      "studyHelp.science": "Teko",
      "studyHelp.history": "Rekoha",
      "studyHelp.geography": "Tenda",
      "studyHelp.of": "ir\u0169",
      "studyHelp.question": "Jykre",
      "studyHelp.noQuestions": "Nh\xEDn jykre",
      "studyHelp.results": "Jegw\xE3",
      "studyHelp.perfect": "Por\xE3! \u{1F3C6}",
      "studyHelp.great": "Por\xE3! \u2B50",
      "studyHelp.good": "Por\xE3! \u{1F4DA}",
      "studyHelp.needsWork": "K\xF3g! \u{1F4AA}",
      "studyHelp.restart": "Kanhgr\xF5",
      "studyHelp.back": "Mboray\xFA"
    },
    tupi: {
      "nav.landing": "P\xE1gina Principal",
      "nav.chatbot": "Chat de Apoio",
      "nav.quiz": "Quiz",
      "nav.friends": "Ir\u0169",
      "nav.vent": "Fala",
      "nav.minigame": "Jogo",
      "nav.login": "Kyr\xE3",
      "nav.register": "Kyr\xE3 M\xF3s",
      "nav.admin": "Administra\xE7\xE3o",
      "nav.emergency": "Jepy'apy",
      "nav.accessibility": "Acessibilidade",
      "landing.hero": "Teko S\xE3 - Sa\xFAde Mental no Mundo dos Blocos",
      "landing.subtitle": "Opy m\xE3Por\xE3 rehegua",
      "landing.description": "Up\xE9i rejuhu tek\xF3 s\xE3, informaci\xF3n sa\xFAde mental y bullying \u2014 opytu'u Minecraft rehegua.",
      "landing.cta1": "Kyr\xE3 Ombotara",
      "landing.cta2": "Painel",
      "landing.cta3": "Hecha",
      "landing.cta4": "Pronto para construir um mundo melhor?",
      "landing.cta5": "Junte-se a milhares de estudantes que j\xE1 encontraram apoio aqui!",
      "landing.features": "O que voc\xEA pode fazer",
      "landing.characters": "Seus aliados",
      "landing.char1": "Como Steve, voc\xEA constr\xF3i sua jornada.",
      "landing.char2": "Alex nos ensina que ser diferente \xE9 for\xE7a.",
      "landing.char3": "Alde\xF5es mostram comunidade unida \xE9 forte.",
      "landing.char4": "Golem de Ferro \xE9 protetor.",
      "landing.stat1": "Apoio Dispon\xEDvel",
      "landing.stat2": "Conversas Seguras",
      "landing.stat3": "Idiomas",
      "landing.stat4": "Divers\xE3o",
      "landing.feature1Title": "Chatbot de Apoio",
      "landing.feature1Desc": "Converse com MineBot sobre sa\xFAde mental.",
      "landing.feature2Title": "Quiz",
      "landing.feature2Desc": "Teste seus conhecimentos sobre sa\xFAde mental.",
      "landing.feature3Title": "Encontrar Ir\u0169",
      "landing.feature3Desc": "Conecte-se com outros estudantes.",
      "landing.feature4Title": "Mini Jogo",
      "landing.feature4Desc": "Relaxe com mini jogo Minecraft.",
      "landing.feature5Title": "Chat de Desabafos",
      "landing.feature5Desc": "Desabafe em espa\xE7o seguro.",
      "landing.feature6Title": "Acessibilidade",
      "landing.feature6Desc": "Alto contraste, texto grande e audiodescri\xE7\xE3o.",
      "auth.login": "Kyr\xE3",
      "auth.register": "Kyr\xE3 M\xF3s",
      "auth.username": "T\xE9ra",
      "auth.email": "Email",
      "auth.password": "\xD1e'\u1EBD\xF1emi",
      "auth.confirmPassword": "Confirmar",
      "auth.minecraftName": "T\xE9ra Minecraft",
      "auth.submit": "Mandu'a",
      "auth.noAccount": "N\xE3o tem conta? Cadastre-se",
      "auth.hasAccount": "J\xE1 tem conta? Entre",
      "auth.logout": "S\u1EBD",
      "auth.adminLogin": "Admin",
      "chatbot.title": "MineBot - Chat de Apoio",
      "chatbot.placeholder": "I\xF1e'\u1EBD... \u{1F49A}",
      "chatbot.send": "Mandu'a",
      "chatbot.suggestions": "Porandu por\xE3",
      "chatbot.sug1": "Mba'e ojapova'er\xE3 ansiedade?",
      "chatbot.sug2": "Mba'e ojapova'er\xE3 bullying?",
      "chatbot.sug3": "Mba'e ojapova'er\xE3 ir\u0169 py'achirei?",
      "chatbot.sug4": "Mba'e depresi\xF3n rehegua?",
      "chatbot.sug5": "Mba'e ojapova'er\xE3 me'\u1EBD rehe?",
      "chatbot.sug6": "Jekupy rehegua",
      "chatbot.welcome": "Terepy! Ha'e MineBot \u26CF\uFE0F\u{1F916}! Teko s\xE3 rehegua i\xF1e'\u1EBD. Mba'e rehe?",
      "chatbot.typing": "I\xF1e'\u1EBD...",
      "chatbot.processError": "Mba'ap\xE9 jagwa. I\xF1e'\u1EBD nhov\xF5!",
      "chatbot.connectionError": "K\xF3g jagwa. Tente nhov\xF5! \u26A0\uFE0F",
      "chatbot.you": "Ie",
      "quiz.title": "Quiz de Sa\xFAde Mental",
      "quiz.start": "Kyr\xE3 Quiz",
      "quiz.next": "Pr\xF3xima",
      "quiz.previous": "Anterior",
      "quiz.finish": "Finalizar",
      "quiz.result": "Resultado",
      "quiz.score": "corretas",
      "quiz.restart": "Refazer",
      "quiz.submitError": "Jagwa quiz",
      "quiz.q1": "O que \xE9 bullying?",
      "quiz.q1o1": "Brincadeira normal",
      "quiz.q1o2": "Comportamento agressivo e repetitivo",
      "quiz.q1o3": "Discuss\xE3o pontual",
      "quiz.q1o4": "Express\xE3o pessoal",
      "quiz.q2": "Qual N\xC3O \xE9 tipo de bullying?",
      "quiz.q2o1": "Bullying verbal",
      "quiz.q2o2": "Bullying f\xEDsico",
      "quiz.q2o3": "Discutir trabalho escolar",
      "quiz.q2o4": "Cyberbullying",
      "quiz.q3": "O que fazer se presenciar bullying?",
      "quiz.q3o1": "Fingir que n\xE3o viu",
      "quiz.q3o2": "Gravar e postar",
      "quiz.q3o3": "Procurar adulto de confian\xE7a",
      "quiz.q3o4": "Rir junto",
      "quiz.q4": "Como apoiar amigo v\xEDtima de bullying?",
      "quiz.q4o1": "Ouvir com empatia e incentivar ajuda",
      "quiz.q4o2": "Dizer para ignorar",
      "quiz.q4o3": "Confrontar agressivamente",
      "quiz.q4o4": "Afastar-se",
      "quiz.q5": "O que \xE9 ansiedade?",
      "quiz.q5o1": "Tristeza constante",
      "quiz.q5o2": "Resposta ao estresse que vira problema",
      "quiz.q5o3": "Falta de vontade",
      "quiz.q5o4": "Doen\xE7a contagiosa",
      "quiz.q6": "Sinais de depress\xE3o?",
      "quiz.q6o1": "Muita energia",
      "quiz.q6o2": "Tristeza persistente e isolamento",
      "quiz.q6o3": "Comer muito",
      "quiz.q6o4": "Gostar de solid\xE3o",
      "quiz.q7": "Para que \xE9 o n\xFAmero 180?",
      "quiz.q7o1": "Emerg\xEAncia m\xE9dica",
      "quiz.q7o2": "Pol\xEDcia Militar",
      "quiz.q7o3": "Disque Direitos Humanos",
      "quiz.q7o4": "Bombeiros",
      "quiz.q8": "O que \xE9 cyberbullying?",
      "quiz.q8o1": "Bullying pela internet",
      "quiz.q8o2": "Bullying s\xF3 em jogos",
      "quiz.q8o3": "V\xEDrus de computador",
      "quiz.q8o4": "Ser batido no jogo",
      "quiz.q9": "Atitude mais saud\xE1vel?",
      "quiz.q9o1": "Falar sobre sentimentos",
      "quiz.q9o2": "Guardar tudo para si",
      "quiz.q9o3": "Fingir que est\xE1 bem",
      "quiz.q9o4": "Isolamento total",
      "quiz.q10": "CVV atende pelo n\xFAmero:",
      "quiz.q10o1": "180",
      "quiz.q10o2": "188",
      "quiz.q10o3": "192",
      "quiz.q10o4": "190",
      "quiz.q11": "Cyberbullying mba'e?",
      "quiz.q11o1": "Jegwa t\u1EBD",
      "quiz.q11o2": "Internet kyr\xE3 jyk\xFCre",
      "quiz.q11o3": "Roubar mba'e",
      "quiz.q11o4": "Boato \xF1e'\u1EBD",
      "quiz.q12": "Jegwa rei - mba'e tek\xF3 s\xE3?",
      "quiz.q12o1": "Jegwa t\u1EBD",
      "quiz.q12o2": "Nh\xEDn",
      "quiz.q12o3": "Huk\xE3 por\xE3 jykre",
      "quiz.q12o4": "Jegwa \xF1e'\u1EBD",
      "quiz.q13": "F\xE3g mboray\xFA re?",
      "quiz.q13o1": "Huk\xE3 rei",
      "quiz.q13o2": "F\xE3g jykre mboray\xFA",
      "quiz.q13o3": "Jykre t\u1EBD",
      "quiz.q13o4": "K\u0169\xED jagwa",
      "quiz.q14": "\xD1e'\u1EBD por\xE3 - mba'e rehe?",
      "quiz.q14o1": "Jagwa jykre",
      "quiz.q14o2": "F\xE3g jegwa",
      "quiz.q14o3": "\xD1e'\u1EBD jykre mboray\xFA ir\u0169",
      "quiz.q14o4": "Nh\xEDn jagwa",
      "quiz.q15": "Ir\u0169 mboray\xFA re?",
      "quiz.q15o1": "Py'achirei ir\u0169",
      "quiz.q15o2": "Ir\u0169 \xF1e'\u1EBD jykre",
      "quiz.q15o3": "O\xF1emone\u0129 ir\u0169",
      "quiz.q15o4": "Ir\u0169 mba'e nhin",
      "quiz.q16": "K\u0169\xED - katu por\xE3?",
      "quiz.q16o1": "4-5 horas",
      "quiz.q16o2": "6-7 horas",
      "quiz.q16o3": "8-10 horas",
      "quiz.q16o4": "12+ horas",
      "quiz.q17": "Opy mboray\xFA?",
      "quiz.q17o1": "Opy katu jagr\xE3",
      "quiz.q17o2": "Opy \xF1e'\u1EBD por\xE3, jegwa nhin",
      "quiz.q17o3": "Opy tata",
      "quiz.q17o4": "F\xE3g nhenh\xE9ra",
      "quiz.q18": "Jegwa mboray\xFA - h\xEFn mba'e?",
      "quiz.q18o1": "Ir\u0169 k\xF3g",
      "quiz.q18o2": "Ir\u0169 jyk\xFCre",
      "quiz.q18o3": "Mba'e k\xF3g",
      "quiz.q18o4": "Jogo kanhgr\xF5",
      "quiz.q19": "Ir\u0169 py'achirei - mba'e ojapova'er\xE3?",
      "quiz.q19o1": "Nh\xEDn",
      "quiz.q19o2": "Kanhgr\xF5 f\xE3g",
      "quiz.q19o3": "Jykre, ir\u0169, k\xF3g nhenh\xE9ra",
      "quiz.q19o4": "Jegwa ir\u0169",
      "quiz.q20": "Tek\xF3 s\xE3 jykre?",
      "quiz.q20o1": "Mboro jagwa",
      "quiz.q20o2": "Nh\xEDn katu",
      "quiz.q20o3": "Jykre tek\xF3 s\xE3 jegwa rei",
      "quiz.q20o4": "Py'achirei nhin",
      "friends.title": "Encontrar Ir\u0169",
      "friends.search": "Buscar t\xE9r\xE3...",
      "friends.sendRequest": "Mandu'a",
      "friends.pending": "Pedidos Pendentes",
      "friends.accept": "O\xF1emone\u0129",
      "friends.reject": "O\xF1eha'\xE3",
      "friends.online": "Online",
      "friends.offline": "Offline",
      "friends.message": "I\xF1e'\u1EBD...",
      "friends.noFriends": "Ir\u0169 kat\xFD. Mandu'a nhenh\xE9ra!",
      "friends.requestMsg": "I\xF1e'\u1EBD (jagr\xE3)",
      "friends.requestSent": "Nheng\xE9ra mboasy!",
      "friends.requestAccepted": "Nheng\xE9ra o\xF1emone\u0129!",
      "friends.requestRejected": "Nheng\xE9ra o\xF1eha'\xE3",
      "friends.openChat": "I\xF1e'\u1EBD",
      "vent.title": "Chat de Desabafos",
      "vent.placeholder": "I\xF1e'\u1EBD... Opy m\xE3Por\xE3 \u{1F49A}",
      "vent.send": "Mandu'a",
      "vent.anonymous": "An\xF4nimo",
      "vent.report": "Denunciar",
      "vent.moderated": "\u{1F6AB} Moderado",
      "vent.reportTitle": "Denunciar mensagem",
      "vent.reportPlaceholder": "Motivo da den\xFAncia...",
      "vent.reportSent": "Den\xFAncia enviada",
      "vent.noMessages": "Mba'e kat\xFD. I\xF1e'\u1EBD nh\u1EBDnh\xE1!",
      "tips.title": "Teko S\xE3 Rembiasa",
      "tips.tip1Title": "Huk\xE3 Por\xE3 \u{1F32C}\uFE0F",
      "tips.tip1Desc": "Jah\xE9i jy, huk\xE3 3 jekupy. Nh\u1EBD por\xE3, t\u1EBD por\xE3, mongarai katu.",
      "tips.tip2Title": "I\xF1e'\u1EBD Ir\u0169 rehe \u{1F5E3}\uFE0F",
      "tips.tip2Desc": "\xD1e'\u1EBD ir\u0169 mboray\xFA rehe. Nha'\xE3 ojeha\xED katu.",
      "tips.tip3Title": "Pausa Digital \u{1F4F5}",
      "tips.tip3Desc": "Mboro internet. T\xEFnh r\xF3g por\xE3 katu hecha.",
      "tips.tip4Title": "Jykre T\u1EBD \u{1F4AA}",
      "tips.tip4Desc": "Nh\xF3 katu, ka'aguy por\xE3, tek\xF3 s\xE3 mimb\xE9.",
      "tips.breathStart": "K\xF3g Jekupy",
      "tips.inhale": "Huk\xE3",
      "tips.hold": "T\u1EBD",
      "tips.exhale": "Mongarai",
      "mood.title": "Mba'e jykre re?",
      "mood.select": "Selecione tek\xF3:",
      "mood.happy": "\u{1F60A} Mboray\xFA",
      "mood.sad": "\u{1F622} Py'achirei",
      "mood.anxious": "\u{1F630} Nh\xEDjy",
      "mood.angry": "\u{1F624} Jegwa",
      "mood.calm": "\u{1F60C} Tengatu",
      "mood.tired": "\u{1F634} Teng",
      "mood.save": "Salv\xE1r Tek\xF3",
      "mood.history": "Temimbe",
      "mood.today": "Kor\xE3",
      "mood.noData": "Mba'e kat\xFD. K\xF3g nhenh\xE9ra!",
      "mood.encouragement": "Jykre nh\xEDn! Teko s\xE3 por\xE3 mimb\xE9.",
      "minigame.title": "MentalCraft Runner",
      "minigame.start": "Jogar",
      "minigame.score": "pontos",
      "minigame.gameOver": "Fim de Jogo!",
      "minigame.playAgain": "Jogar Novamente",
      "minigame.instructions": "Use setas ou WASD para mover e pular!",
      "admin.title": "Administra\xE7\xE3o",
      "admin.users": "Usu\xE1rios",
      "admin.reports": "Den\xFAncias",
      "admin.messages": "Mensagens",
      "admin.moderate": "Moderar",
      "admin.ban": "Banir",
      "admin.unban": "Desbanir",
      "admin.approve": "Aprovar",
      "admin.reject": "Rejeitar",
      "admin.resolve": "Resolver",
      "admin.panelTitle": "Painel Admin",
      "admin.reportsTitle": "Den\xFAncias",
      "admin.usersTitle": "Usu\xE1rios",
      "admin.messagesTitle": "Mensagens",
      "admin.back": "\u2190 Mboyve",
      "admin.noReports": "Den\xFAncia kat\xFD",
      "admin.by": "Por:",
      "admin.unknown": "Jagwa nhin",
      "admin.adminNotes": "Notas admin...",
      "admin.review": "\u{1F440} Revis\xE1r",
      "admin.userBanned": "Usu\xE1rio banido",
      "admin.userUnbanned": "Usu\xE1rio desbanido",
      "admin.status": "Status",
      "admin.actions": "A\xE7\xF5es",
      "admin.actionDone": "A\xE7\xE3o feita",
      "admin.ventMessages": "Mensagens do Chat de Desabafos",
      "admin.moderated": "Moderado",
      "emergency.title": "Jepy'apy",
      "emergency.call180": "Direitos Humanos",
      "emergency.call192": "SAMU",
      "emergency.call190": "Pol\xEDcia",
      "emergency.description180": "Direitos Humanos - Viol\xEAncia",
      "emergency.description192": "SAMU - Emerg\xEAncia M\xE9dica",
      "emergency.description190": "Pol\xEDcia - Emerg\xEAncia",
      "emergency.description188": "CVV - Centro de Valoriza\xE7\xE3o da Vida",
      "footer.links": "Links R\xE1pidos",
      "accessibility.title": "Acessibilidade",
      "accessibility.desc": "K\xF3g por\xE3 nhin nh\xEDn.",
      "accessibility.highContrast": "Alto Contraste",
      "accessibility.highContrastDesc": "Jykre kontraste por\xE3 nh\u1EBD",
      "accessibility.largeText": "Texto Grande",
      "accessibility.largeTextDesc": "K\xF3g nhin jah\xFA katu",
      "accessibility.audioDescription": "Audiodescri\xE7\xE3o",
      "accessibility.audioDescDesc": "\xD1e'\u1EBD por\xE3 katu",
      "accessibility.reset": "Redefinir",
      "errors.loginRequired": "Kyr\xE3 nhenh\xE9ra!",
      "errors.passwordMismatch": "\xD1e'\u1EBD\xF1emi jagwa nhinh\xE1ra!",
      "errors.connectionError": "Jagwa k\xF3g",
      "errors.requestError": "Jagwa nhenh\xE9ra",
      "common.loading": "Kyr\xE3...",
      "common.error": "Erro",
      "common.success": "Por\xE3!",
      "common.cancel": "Cancelar",
      "common.save": "Salv\xE1r",
      "common.delete": "Delet\xE1r",
      "common.close": "Mboty",
      "common.back": "Mboyve",
      "common.welcome": "Terepy",
      "common.language": "\xD1e'\u1EBD",
      "nav.achievements": "Mba'e",
      "nav.resources": "Ir\u0169",
      "achievements.title": "Mba'e",
      "achievements.subtitle": "Ir\u0169 mba'e MentalCraft",
      "achievements.unlocked": "Mba'e",
      "achievements.total": "Total",
      "achievements.locked": "\xD1e'\u1EBD",
      "achievements.newUnlocked": "Mba'e ir\u0169!",
      "achievements.rarity.common": "T\u1EBD",
      "achievements.rarity.uncommon": "Mba'e",
      "achievements.rarity.rare": "Ir\u0169",
      "achievements.rarity.epic": "Tup\xE3",
      "achievements.rarity.legendary": "Jakaira",
      "achievements.progress": "Teko",
      "resources.title": "Teko S\xE3 Ir\u0169",
      "resources.subtitle": "Teko s\xE3 ir\u0169 mboray\xFA",
      "resources.category.anxiety": "Huk\xE3",
      "resources.category.depression": "\xD1e'\u1EBD",
      "resources.category.bullying": "Kyry",
      "resources.category.selfesteem": "Teko",
      "resources.category.sleep": "Ker",
      "resources.category.stress": "Huk\xE3",
      "resources.readMore": "Ir\u0169",
      "dashboard.dailyTip": "Ir\u0169 Kyr\xE3",
      "dashboard.moodStreak": "Teko Huk\xE3",
      "dashboard.achievementShowcase": "Mba'e Kunh\xE3",
      "dashboard.viewAll": "Kunh\xE3",
      "dashboard.noAchievements": "\xD1e'\u1EBD mba'e. Ir\u0169!",
      "nav.profile": "Teko",
      "profile.title": "Teko",
      "profile.stats": "Kanjuk",
      "profile.joined": "Teko",
      "profile.mcName": "Minecraft Ir\u0169",
      "profile.role": "Teko",
      "profile.quizBest": "Quiz Jykre",
      "profile.moodEntries": "Huk\xE3 Kanjuk",
      "profile.friends": "Ir\u0169",
      "profile.achievements": "Mba'e",
      "profile.recentActivity": "Kanjuk",
      "profile.noActivity": "\xD1e'\u1EBD kanjuk",
      "profile.editProfile": "Teko",
      "profile.changeMcName": "Minecraft",
      "profile.save": "Mboray\xFA",
      "profile.cancel": "Mboyve",
      "game.lives": "Teko",
      "game.level": "Kunh\xE3",
      "game.powerup": "Teko",
      "game.shield": "Teko",
      "game.speed": "Teko",
      "game.magnet": "Teko",
      "game.enemy": "Kyry",
      "game.newHighScore": "Mba'e!",
      "game.points": "nhenh\xE9ra",
      // Nav extras
      "nav.journal": "Kyr\xE3 R\xF3g",
      "nav.soundEffects": "Nhe'\u1EBD Por\xE3",
      // Landing extras
      "landing.feature7Title": "Kyr\xE3 R\xF3g",
      "landing.feature7Desc": "\xD1e'\u1EBD por\xE3 i\xF1e'\u1EBD kor\xE3",
      "landing.feature8Title": "Nhe'\u1EBD Por\xE3",
      "landing.feature8Desc": "Minecraft nhe'\u1EBD por\xE3",
      // Common extras
      "common.goodbye": "Ara up\xE9i",
      // Profile extras
      "profile.admin": "Tendota",
      "profile.player": "Jogador",
      // Mood extras
      "mood.dashboardDesc": "Teko s\xE3 jah\xE9i kor\xE3 r\xF3g por\xE3",
      "mood.chartTitle": "Tek\xF3 Gr\xE1fico",
      "mood.last7Days": "7 Kor\xE3",
      "mood.moodTrend": "Teko",
      // Accessibility extras
      "accessibility.soundEffects": "Nhe'\u1EBD Por\xE3",
      "accessibility.soundEffectsDesc": "Minecraft nhe'\u1EBD k\xF3g",
      // Journal
      "journal.title": "Kyr\xE3 R\xF3g",
      "journal.subtitle": "\xD1e'\u1EBD por\xE3 i\xF1e'\u1EBD",
      "journal.prompt": "Mba'e jykre re? Mba'e por\xE3 ojapo?",
      "journal.save": "Mandu'a Jah\xFA",
      "journal.saved": "Jah\xFA mandu'a!",
      "journal.entries": "Jah\xFA Temimbe",
      "journal.noEntries": "Jah\xFA kat\xFD. I\xF1e'\u1EBD nh\u1EBDnh\xE1!",
      "journal.delete": "Mboro",
      "journal.confirmDelete": "Jykre nhin?",
      // Sound
      "sound.click": "Kyt\xE3",
      "sound.success": "Por\xE3",
      "sound.error": "Ja'o",
      "sound.achievement": "Ojejapo",
      "sound.ambient": "Ka'aguy",
      // Notifications
      "notifications.title": "Nhenh\xE9ra",
      "notifications.noNotifications": "Nhenh\xE9ra kat\xFD",
      "notifications.markRead": "Jah\xE9i",
      "notifications.friendRequest": "ir\u0169 nheng\xE9ra",
      "notifications.achievementUnlock": "Ojejapo:",
      "notifications.clearAll": "Mba'e kat\xFD",
      // Dashboard extras
      "dashboard.notificationBadge": "nhenh\xE9ra",
      "dashboard.journalDesc": "\xD1e'\u1EBD por\xE3 i\xF1e'\u1EBD",
      "dashboard.soundDesc": "Nhe'\u1EBD por\xE3 k\xF3g",
      // Biome Theme
      "biome.title": "Teko",
      "biome.forest": "\u{1F33F} Ka'ag",
      "biome.nether": "\u{1F525} Kur\xE3",
      "biome.end": "\u2728 Py\xE3",
      "biome.desc": "Teko jekupe",
      // Pomodoro Timer
      "pomodoro.title": "Ker\xE3",
      "pomodoro.focus": "Huk\xE3",
      "pomodoro.break": "K\u0169\xED",
      "pomodoro.start": "Kanjuk",
      "pomodoro.pause": "Pyt\xE3",
      "pomodoro.reset": "Kanjuk",
      "pomodoro.sessions": "Ker\xE3",
      "pomodoro.focusTip": "Huk\xE3 teko s\xE3",
      "pomodoro.breakTip": "K\u0169\xED teko s\xE3",
      "pomodoro.completed": "Kanjuk! \u26CF\uFE0F",
      // Daily Challenges
      "challenges.title": "Kanjuk",
      "challenges.subtitle": "Kanjuk teko s\xE3",
      "challenges.completed": "Kanjuk! \u2705",
      "challenges.xpReward": "+50 XP",
      "challenges.streak": "Kanjuk teko",
      "challenges.days": "ara",
      "challenges.markDone": "Kanjuk",
      "challenges.history": "Jykre",
      "challenges.ch1": "Kanjuk 3",
      "challenges.ch2": "Huk\xE3",
      "challenges.ch3": "Ir\u0169 \xF1e'\u1EBD",
      "challenges.ch4": "Teko s\xE3 5",
      "challenges.ch5": "Mba'e 1",
      "challenges.ch6": "Jykre",
      "challenges.ch7": "Kanjuk",
      // Self-Care Checklist
      "selfcare.title": "Teko S\xE3",
      "selfcare.subtitle": "Teko s\xE3 kanjuk",
      "selfcare.progress": "Teko s\xE3",
      "selfcare.completed": "Kanjuk",
      "selfcare.allDone": "Kanjuk! \u{1F31F}",
      "selfcare.t1": "\u{1F4A7} Y",
      "selfcare.t2": " Ker",
      "selfcare.t3": "\u{1F6B6} Huk\xE3",
      "selfcare.t4": "\u{1F4F1} Huk\xE3",
      "selfcare.t5": "\u{1F9D8} Teko s\xE3",
      "selfcare.t6": "\u{1F91D} Ir\u0169",
      "selfcare.t7": "\u{1F4DD} Jykre",
      "selfcare.t8": "\u{1F60A} Kanjuk",
      // Nav extras
      "nav.pomodoro": "Ker\xE3",
      "nav.challenges": "Kanjuk",
      "nav.selfcare": "Teko S\xE3",
      "nav.breathing": "Kuaray",
      "nav.gratitude": "Aguer\xFA",
      "nav.affirmations": "Morandu",
      "breathing.title": "Kuaray Jeguaka",
      "breathing.pattern478": "4-7-8 Kerayv\xF5",
      "breathing.patternBox": "Mok\xF5i (4-4-4-4)",
      "breathing.patternCalm": "Teko (4-0-6)",
      "breathing.inhale": "Kuaray...",
      "breathing.hold": "Mo\xE3...",
      "breathing.exhale": "Jekupe...",
      "breathing.inhaleDesc": "Kuaray ker",
      "breathing.holdDesc": "Mo\xE3 kuaray",
      "breathing.exhaleDesc": "Jekupe kuaray",
      "breathing.start": "He\xF1oi",
      "breathing.stop": "Joko",
      "breathing.cycles": "rehe",
      "breathing.tip1": "Teko s\xE3",
      "breathing.tip2": "Mba_e ker",
      "breathing.tip3": "Jey kuaray",
      "breathing.tip4": "Ara ku\xE9ra",
      "gratitude.title": "Aguer\xFA Renda",
      "gratitude.prompt": "Mba_e aguer\xFA?",
      "gratitude.placeholder": "Aguer\xFA rehe...",
      "gratitude.post": "He\xF1oi",
      "gratitude.empty": "Ndaip\xF3ri aguer\xFA",
      "affirm.title": "Morandu Ara",
      "affirm.a1": "Kuaray pya\xFAva",
      "affirm.a2": "Teko s\xE3",
      "affirm.a3": "Ara pyahu",
      "affirm.a4": "Monge",
      "affirm.a5": "Teko",
      "affirm.a6": "Kerayv\xF5",
      "affirm.a7": "Jegua",
      "affirm.a8": "Teko pya\xFAva",
      "affirm.a9": "Pya_u",
      "affirm.a10": "Kanguku",
      "affirm.a11": "Teko s\xE3",
      "affirm.a12": "Monge",
      "affirm.catSelf": "Teko S\xE3",
      "affirm.catStrength": "Pya_u",
      "affirm.catGrowth": "Jegua",
      "affirm.favorites": "Mboray\xFA",
      "affirm.showAll": "Hecha",
      "affirm.hideAll": "Moka\xF1y",
      // Coping, Safety Plan, Leaderboard, Mood Insights, Dashboard additions
      "nav.coping": "Mor\xE3i",
      "nav.safetyPlan": "Tekoha Por\xE3",
      "nav.leaderboard": "Tupy",
      "nav.moodInsights": "Teko Ku\xE9ra",
      "coping.title": "Mor\xE3i",
      "coping.subtitle": "Mor\xE3i juker por\xE3",
      "coping.all": "Pete\u0129te\u0129",
      "coping.breathing": "\xD1emo\xF1\u1EBD",
      "coping.grounding": "\xD1emboapy",
      "coping.positiveThinking": "Nhembo'e Por\xE3",
      "coping.physical": "Tenda",
      "coping.social": "Ir\u0169",
      "coping.creative": "Tembie'e",
      "coping.tryNow": "Japo Ko'\u1EBD",
      "coping.steps": "Jepi'u",
      "coping.step": "Jepi'u",
      "coping.favorite": "Mboray\xFA",
      "coping.unfavorite": "Mba'e Moka\xF1y",
      "coping.favorites": "Mboray\xFA",
      "coping.noFavorites": "Mboray\xFA ndaip\xF3ri",
      "coping.count": "jepi'u",
      "coping.s1Title": "\xD1emo\xF1\u1EBD 4-7-8",
      "coping.s1Desc": "\xD1emo\xF1\u1EBD mor\xE3i k\xE3 por\xE3",
      "coping.s1Steps": "1. \xD1emo\xF1\u1EBD 4|2. Kar\xE3 7|3. Mongu'e 8|4. 4 jere",
      "coping.s2Title": "\xD1emo\xF1\u1EBD Tenda",
      "coping.s2Desc": "\xD1emo\xF1\u1EBD tenda mor\xE3i",
      "coping.s2Steps": "1. M\xE3o tenda|2. \xD1emo\xF1\u1EBD|3. Tenda \xF1emo\xF1\u1EBD|4. Mongu'e|5. 10 jere",
      "coping.s3Title": "\xD1emo\xF1\u1EBD Kuarahy",
      "coping.s3Desc": "\xD1emo\xF1\u1EBD kuarahy mor\xE3i",
      "coping.s3Steps": "1. \xD1emo\xF1\u1EBD 4|2. Kar\xE3 4|3. Mongu'e 4|4. Kar\xE3 4|5. 5 jere",
      "coping.s4Title": "5-4-3-2-1",
      "coping.s4Desc": "Jera py ara por\xE3",
      "coping.s5Title": "Jera 5 Jepi'u",
      "coping.s5Desc": "Jera jepi'u py ara",
      "coping.s6Title": "Nhembo'e Por\xE3",
      "coping.s6Desc": "Nhembo'e py'\xE3 por\xE3",
      "coping.s7Title": "\xD1e'\u1EBD Por\xE3",
      "coping.s7Desc": "\xD1e'\u1EBD por\xE3 k\xE3 mor\xE3i",
      "coping.s8Title": "Jere Tape",
      "coping.s8Desc": "Jere tape \xF1emo\xF1\u1EBD",
      "coping.s9Title": "Kori Tenda",
      "coping.s9Desc": "Kori tenda mor\xE3i",
      "coping.s10Title": "\xD1e'\u1EBD Ir\u0169",
      "coping.s10Desc": "\xD1e'\u1EBD ir\u0169 teko",
      "coping.s11Title": "Pysyr\xF5 Ab\xE1",
      "coping.s11Desc": "Pysyr\xF5 ab\xE1 mor\xE3i",
      "coping.s12Title": "Tembie'e",
      "coping.s12Desc": "Tembie'e teko mboray\xFA",
      "safety.title": "Tekoha Por\xE3",
      "safety.subtitle": "Japo tekoha por\xE3 juker",
      "safety.create": "Japo",
      "safety.edit": "Kori",
      "safety.save": "Kang\xE3",
      "safety.saved": "Tekoha kang\xE3!",
      "safety.step1Title": "Teko Py'\xE3",
      "safety.step1Desc": "Teko k\xE3 pysyr\xF5",
      "safety.step1Placeholder": "Teko py'\xE3...",
      "safety.step2Title": "Mor\xE3i",
      "safety.step2Desc": "Mor\xE3i juker por\xE3",
      "safety.step2Placeholder": "Mor\xE3i \xF1e'\u1EBD, ir\u0169...",
      "safety.step3Title": "Ir\u0169",
      "safety.step3Desc": "Ir\u0169 pysyr\xF5",
      "safety.step3Placeholder": "Ir\u0169 \xF1e'\u1EBD...",
      "safety.step4Title": "Henda Por\xE3",
      "safety.step4Desc": "Henda por\xE3 juker",
      "safety.step4Placeholder": "Ka'ag\xFBe, k\xF3...",
      "safety.noPlan": "Tekoha por\xE3 ndaip\xF3ri.",
      "safety.noPlanDesc": "Tekoha por\xE3 pysyr\xF5 juker.",
      "safety.completed": "Tekoha por\xE3 ready!",
      "safety.addSign": "Japo teko",
      "safety.addContact": "Japo ir\u0169",
      "safety.addPlace": "Japo henda",
      "leaderboard.title": "Tupy",
      "leaderboard.subtitle": "Tupy ab\xE1 jogo",
      "leaderboard.rank": "Tupy",
      "leaderboard.player": "Ab\xE1",
      "leaderboard.score": "Kori",
      "leaderboard.level": "Jegua",
      "leaderboard.you": "Che",
      "leaderboard.noEntries": "Ndaip\xF3ri ab\xE1 jogo.",
      "leaderboard.topScore": "Kori T\u0169j",
      "leaderboard.submitScore": "Kang\xE3 Kori",
      "insights.title": "Teko Ku\xE9ra",
      "insights.subtitle": "Jera teko mboray\xFA",
      "insights.totalEntries": "Korang\xE3",
      "insights.avgPerDay": "Ara/Jere",
      "insights.currentStreak": "Jere Pya\u0169",
      "insights.longestStreak": "Jere Tuicha",
      "insights.trend": "Tape",
      "insights.improving": "Jegua",
      "insights.stable": "T\u0169j",
      "insights.declining": "Pysyr\xF5",
      "insights.weeklyAverage": "Kunh\u0129 Ara",
      "insights.noData": "Jera teko ku\xE9ra!",
      "insights.days": "ara",
      "dashboard.copingDesc": "Mor\xE3i teko py'\xE3",
      "dashboard.safetyPlanDesc": "Tekoha por\xE3 che",
      "dashboard.leaderboardDesc": "Tupy kori jogo",
      "dashboard.moodInsightsDesc": "Teko mboray\xFA che",
      // StudyHelp
      "nav.studyHelp": "K\xF3g",
      "nav.more": "Mba'e",
      "studyHelp.title": "\u{1F4D6} K\xF3g R\xE3",
      "studyHelp.subtitle": "Jykre kyry ensino m\xE9dio",
      "studyHelp.selectYear": "K\xF3g jyr\xE3",
      "studyHelp.selectSubject": "Mba'e jyr\xE3",
      "studyHelp.start": "K\xF3g",
      "studyHelp.correct": "Por\xE3! \u2705",
      "studyHelp.wrong": "Nh\xEDn \u274C",
      "studyHelp.score": "Jykre",
      "studyHelp.next": "Kanhgr\xF5",
      "studyHelp.finish": "Jegw\xE3",
      "studyHelp.year1": "1\xBA Jyr\xE3",
      "studyHelp.year2": "2\xBA Jyr\xE3",
      "studyHelp.year3": "3\xBA Jyr\xE3",
      "studyHelp.math": "Jykre",
      "studyHelp.portuguese": "\xD1e'\u1EBD",
      "studyHelp.science": "Teko",
      "studyHelp.history": "Rekoha",
      "studyHelp.geography": "Tenda",
      "studyHelp.of": "ir\u0169",
      "studyHelp.question": "Jykre",
      "studyHelp.noQuestions": "Nh\xEDn jykre",
      "studyHelp.results": "Jegw\xE3",
      "studyHelp.perfect": "Por\xE3! \u{1F3C6}",
      "studyHelp.great": "Por\xE3! \u2B50",
      "studyHelp.good": "Por\xE3! \u{1F4DA}",
      "studyHelp.needsWork": "K\xF3g! \u{1F4AA}",
      "studyHelp.restart": "Kanhgr\xF5",
      "studyHelp.back": "Mboray\xFA"
    }
  };
  function t(key, locale) {
    const loc = locale || get("currentLocale") || "pt";
    return translations[loc] && translations[loc][key] || key;
  }
  function getCurrentLocale() {
    return get("currentLocale") || "pt";
  }
  function setLocale(locale) {
    setState({ currentLocale: locale });
  }
  function tCurrent(key) {
    return t(key, getCurrentLocale());
  }

  // public/js/sound.js
  var _ctx = null;
  function getCtx() {
    if (!_ctx || _ctx.state === "closed") {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_ctx.state === "suspended") {
      _ctx.resume();
    }
    return _ctx;
  }
  function playClick() {
    if (!get("soundEnabled")) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(1e-3, ctx.currentTime + 0.05);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch (_e) {
    }
  }
  function playSuccess() {
    if (!get("soundEnabled")) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(1e-3, ctx.currentTime + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch (_e) {
    }
  }
  function playError() {
    if (!get("soundEnabled")) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(1e-3, ctx.currentTime + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (_e) {
    }
  }

  // public/js/markdown.js
  var ALLOWED_TAGS = /* @__PURE__ */ new Set([
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "ul",
    "ol",
    "li",
    "a",
    "code",
    "pre",
    "span",
    "h1",
    "h2",
    "h3",
    "h4",
    "blockquote",
    "hr"
  ]);
  var ALLOWED_ATTRS = /* @__PURE__ */ new Set(["href", "target", "rel", "class"]);
  function sanitizeHTML(html) {
    let result = "";
    let i = 0;
    const len = html.length;
    while (i < len) {
      if (html[i] === "<") {
        const closeAngle = html.indexOf(">", i);
        if (closeAngle === -1) {
          result += "&lt;";
          i++;
          continue;
        }
        const tagContent = html.slice(i + 1, closeAngle);
        const closingMatch = tagContent.match(/^\/\s*([a-zA-Z][a-zA-Z0-9]*)\s*$/);
        if (closingMatch) {
          const tagName = closingMatch[1].toLowerCase();
          if (ALLOWED_TAGS.has(tagName)) {
            result += `</${tagName}>`;
          }
          i = closeAngle + 1;
          continue;
        }
        const selfCloseMatch = tagContent.match(/^([a-zA-Z][a-zA-Z0-9]*)\s*\/?$/);
        if (selfCloseMatch) {
          const tagName = selfCloseMatch[1].toLowerCase();
          if (ALLOWED_TAGS.has(tagName)) {
            result += `<${tagContent}>`;
          }
          i = closeAngle + 1;
          continue;
        }
        const openMatch = tagContent.match(/^([a-zA-Z][a-zA-Z0-9]*)([\s\S]*)$/);
        if (openMatch) {
          const tagName = openMatch[1].toLowerCase();
          if (ALLOWED_TAGS.has(tagName)) {
            const attrString = openMatch[2];
            const safeAttrs = parseAndFilterAttrs(attrString);
            result += `<${tagName}${safeAttrs}>`;
          }
          i = closeAngle + 1;
          continue;
        }
        result += "&lt;";
        i++;
      } else {
        const nextOpen = html.indexOf("<", i);
        if (nextOpen === -1) {
          result += html.slice(i);
          break;
        }
        result += html.slice(i, nextOpen);
        i = nextOpen;
      }
    }
    return result;
  }
  function parseAndFilterAttrs(attrString) {
    let result = "";
    const attrRe = /\s+([a-zA-Z][a-zA-Z0-9\-_]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
    let m;
    while ((m = attrRe.exec(attrString)) !== null) {
      const name = m[1].toLowerCase();
      if (!ALLOWED_ATTRS.has(name)) continue;
      const value = m[2] !== void 0 ? m[2] : m[3] !== void 0 ? m[3] : m[4] !== void 0 ? m[4] : "";
      if (name === "href" && value && !/^\s*(https?:\/\/|mailto:|\/|#|\.\.?\/)/.test(value)) {
        continue;
      }
      result += ` ${name}="${escapeAttr(value)}"`;
    }
    return result;
  }
  function escapeAttr(str) {
    return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function parseInline(text) {
    let result = "";
    let i = 0;
    const len = text.length;
    while (i < len) {
      if (text[i] === "`") {
        const end = text.indexOf("`", i + 1);
        if (end !== -1) {
          const code = escapeHTML(text.slice(i + 1, end));
          result += `<code style="background:#222;border:1px solid #555;padding:1px 4px;font-family:monospace;font-size:0.75rem;color:var(--mc-emerald-green)">${code}</code>`;
          i = end + 1;
          continue;
        }
      }
      if (text[i] === "*" && text[i + 1] === "*" && text[i + 2] === "*" || text[i] === "_" && text[i + 1] === "_" && text[i + 2] === "_") {
        const marker = text.slice(i, i + 3);
        const end = text.indexOf(marker, i + 3);
        if (end !== -1) {
          const inner = escapeHTML(text.slice(i + 3, end));
          result += `<strong style="color:var(--mc-gold);text-shadow:1px 1px 0 #000"><em style="color:var(--mc-diamond-blue)">${inner}</em></strong>`;
          i = end + 3;
          continue;
        }
      }
      if (text[i] === "*" && text[i + 1] === "*" || text[i] === "_" && text[i + 1] === "_") {
        const marker = text.slice(i, i + 2);
        const end = text.indexOf(marker, i + 2);
        if (end !== -1) {
          const inner = text.slice(i + 2, end);
          result += `<strong style="color:var(--mc-gold);text-shadow:1px 1px 0 #000">${parseInline(inner)}</strong>`;
          i = end + 2;
          continue;
        }
      }
      if (text[i] === "*" && text[i + 1] !== "*") {
        const end = text.indexOf("*", i + 1);
        if (end !== -1 && (end + 1 >= len || /\s/.test(text[end + 1]) || text[end + 1] === "<" || text[end + 1] === void 0)) {
          const inner = text.slice(i + 1, end);
          if (inner.length > 0) {
            result += `<em style="color:var(--mc-diamond-blue)">${parseInline(inner)}</em>`;
            i = end + 1;
            continue;
          }
        }
      }
      if (text[i] === "_" && text[i + 1] !== "_") {
        const end = text.indexOf("_", i + 1);
        if (end !== -1) {
          const inner = text.slice(i + 1, end);
          if (inner.length > 0) {
            result += `<em style="color:var(--mc-diamond-blue)">${parseInline(inner)}</em>`;
            i = end + 1;
            continue;
          }
        }
      }
      if (text[i] === "[") {
        const closeBracket = text.indexOf("]", i + 1);
        if (closeBracket !== -1 && text[closeBracket + 1] === "(") {
          const closeParen = text.indexOf(")", closeBracket + 2);
          if (closeParen !== -1) {
            const linkText = escapeHTML(text.slice(i + 1, closeBracket));
            const url = text.slice(closeBracket + 2, closeParen).trim();
            if (url.length > 0) {
              result += `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer" style="color:var(--mc-diamond-blue);text-decoration:underline">${linkText}</a>`;
              i = closeParen + 1;
              continue;
            }
          }
        }
      }
      if (text[i] === "!" && text[i + 1] === "[") {
        const closeBracket = text.indexOf("]", i + 2);
        if (closeBracket !== -1 && text[closeBracket + 1] === "(") {
          const closeParen = text.indexOf(")", closeBracket + 2);
          if (closeParen !== -1) {
            const altText = escapeHTML(text.slice(i + 2, closeBracket));
            const url = text.slice(closeBracket + 2, closeParen).trim();
            if (url.length > 0) {
              result += `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer" style="color:var(--mc-diamond-blue);text-decoration:underline">[${altText}]</a>`;
              i = closeParen + 1;
              continue;
            }
          }
        }
      }
      if (text[i] === "&") {
        result += "&amp;";
      } else if (text[i] === "<") {
        result += "&lt;";
      } else if (text[i] === ">") {
        result += "&gt;";
      } else {
        result += text[i];
      }
      i++;
    }
    return result;
  }
  function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function parseMarkdown(content) {
    const raw = content.replace(/\r\n?/g, "\n");
    const lines = raw.split("\n");
    let html = "";
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.trimStart().startsWith("```")) {
        const lang = line.trimStart().slice(3).trim();
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++;
        const codeContent = escapeHTML(codeLines.join("\n"));
        html += `<pre style="background:#111;border:2px solid #555;padding:8px;margin:8px 0;overflow-x:auto;font-family:monospace;font-size:0.75rem;color:var(--mc-emerald-green)"><code>${codeContent}</code></pre>`;
        continue;
      }
      const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        html += buildHeading(level, text);
        i++;
        continue;
      }
      if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
        html += `<hr style="border:none;border-top:2px solid var(--mc-stone-gray);margin:12px 0">`;
        i++;
        continue;
      }
      if (line.trimStart().startsWith(">")) {
        const bqLines = [];
        while (i < lines.length && (lines[i].trimStart().startsWith(">") || lines[i].trim() === "" && i + 1 < lines.length && lines[i + 1].trimStart().startsWith(">"))) {
          let bqLine = lines[i].trimStart();
          if (bqLine.startsWith("> ")) {
            bqLine = bqLine.slice(2);
          } else if (bqLine.startsWith(">")) {
            bqLine = bqLine.slice(1);
          }
          bqLines.push(bqLine);
          i++;
        }
        const innerContent = parseMarkdown(bqLines.join("\n"));
        html += `<blockquote style="border-left:4px solid var(--mc-emerald-green);padding-left:12px;margin:8px 0;color:var(--mc-light-gray);font-style:italic">${innerContent}</blockquote>`;
        continue;
      }
      if (/^\s*[-*+]\s/.test(line)) {
        const items = [];
        let current = null;
        while (i < lines.length) {
          const listLine = lines[i];
          const nestedMatch = listLine.match(/^(\s{2,})[-*+]\s(.*)$/);
          if (nestedMatch && current) {
            current += "\n" + nestedMatch[2];
            i++;
            continue;
          }
          const itemMatch = listLine.match(/^\s*[-*+]\s(.*)$/);
          if (itemMatch) {
            if (current !== null) items.push(current);
            current = itemMatch[1];
            i++;
          } else if (listLine.trim() === "") {
            if (i + 1 < lines.length && /^\s*[-*+]/.test(lines[i + 1])) {
              i++;
              continue;
            }
            break;
          } else {
            break;
          }
        }
        if (current !== null) items.push(current);
        html += `<ul style="margin:8px 0;padding-left:20px;list-style-type:square">`;
        for (const item of items) {
          html += `<li style="margin:2px 0">${parseInline(item)}</li>`;
        }
        html += `</ul>`;
        continue;
      }
      if (/^\s*\d+\.\s/.test(line)) {
        const items = [];
        let current = null;
        while (i < lines.length) {
          const listLine = lines[i];
          const nestedMatch = listLine.match(/^(\s{2,})\d+\.\s(.*)$/);
          if (nestedMatch && current) {
            current += "\n" + nestedMatch[2];
            i++;
            continue;
          }
          const itemMatch = listLine.match(/^\s*\d+\.\s(.*)$/);
          if (itemMatch) {
            if (current !== null) items.push(current);
            current = itemMatch[1];
            i++;
          } else if (listLine.trim() === "") {
            if (i + 1 < lines.length && /^\s*\d+\./.test(lines[i + 1])) {
              i++;
              continue;
            }
            break;
          } else {
            break;
          }
        }
        if (current !== null) items.push(current);
        html += `<ol style="margin:8px 0;padding-left:20px;list-style-type:decimal">`;
        for (const item of items) {
          html += `<li style="margin:2px 0">${parseInline(item)}</li>`;
        }
        html += `</ol>`;
        continue;
      }
      if (line.trim() === "") {
        i++;
        continue;
      }
      const paraLines = [];
      while (i < lines.length) {
        const pLine = lines[i];
        if (pLine.trim() === "") break;
        if (pLine.trimStart().startsWith("```") || /^#{1,4}\s/.test(pLine) || /^(-{3,}|\*{3,}|_{3,})\s*$/.test(pLine.trim()) || pLine.trimStart().startsWith(">") || /^\s*[-*+]\s/.test(pLine) || /^\s*\d+\.\s/.test(pLine)) {
          break;
        }
        paraLines.push(pLine);
        i++;
      }
      if (paraLines.length > 0) {
        const paraContent = parseInline(paraLines.join("<br>"));
        html += `<p style="margin:0 0 8px 0">${paraContent}</p>`;
      }
    }
    return html;
  }
  function buildHeading(level, text) {
    const inlineContent = parseInline(text);
    const base = "font-family:var(--mc-font);margin:";
    switch (level) {
      case 1:
        return `<h1 style="${base}12px 0 8px;font-size:var(--mc-font-size-xl);color:var(--mc-gold);text-shadow:2px 2px 0 #000">${inlineContent}</h1>`;
      case 2:
        return `<h2 style="${base}10px 0 6px;font-size:var(--mc-font-size-lg);color:var(--mc-gold);text-shadow:2px 2px 0 #000">${inlineContent}</h2>`;
      case 3:
        return `<h3 style="${base}8px 0 4px;font-size:var(--mc-font-size-md);color:var(--mc-diamond-blue);text-shadow:1px 1px 0 #000">${inlineContent}</h3>`;
      case 4:
        return `<h4 style="${base}8px 0 4px;font-size:var(--mc-font-size-sm);color:var(--mc-diamond-blue);text-shadow:1px 1px 0 #000">${inlineContent}</h4>`;
      default:
        return `<p style="margin:0 0 8px 0">${inlineContent}</p>`;
    }
  }
  function renderMarkdown(content, sanitize = true) {
    if (typeof content !== "string") return "";
    let html = parseMarkdown(content);
    if (sanitize) {
      html = sanitizeHTML(html);
    }
    return html;
  }

  // public/js/ui.js
  var TOAST_COLORS = {
    success: { bg: "#1B5E20", border: "#4CAF50", icon: "\u2705" },
    error: { bg: "#7F1D1D", border: "#FF1A1A", icon: "\u274C" },
    info: { bg: "#1A237E", border: "#42A5F5", icon: "\u2139\uFE0F" }
  };
  function showToast(message, type = "info") {
    const colors = TOAST_COLORS[type] || TOAST_COLORS.info;
    const toast = document.createElement("div");
    toast.className = "mc-toast";
    toast.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; z-index: 9999;
    background: ${colors.bg}; border: 3px solid ${colors.border};
    color: #fff; padding: 12px 20px; min-width: 250px; max-width: 400px;
    font-family: var(--mc-font); font-size: var(--mc-font-size-sm);
    box-shadow: 0 4px 12px rgba(0,0,0,0.5); cursor: pointer;
    transform: translateX(120%); transition: transform 0.3s ease;
    display: flex; align-items: center; gap: 8px;
    text-shadow: 1px 1px 0 #000;
  `;
    toast.innerHTML = `<span>${colors.icon}</span><span style="flex:1">${message}</span>`;
    toast.addEventListener("click", () => removeToast(toast));
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.transform = "translateX(0)";
      });
    });
    setTimeout(() => removeToast(toast), 3e3);
  }
  function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.style.transform = "translateX(120%)";
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }
  function renderNotificationPanel(t2) {
    const notifications = get("notifications") || [];
    const unreadCount = notifications.filter((n) => !n.read).length;
    const notifItems = notifications.length === 0 ? `<p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-stone-gray);text-align:center;padding:16px 0">${t2("notifications.noNotifications")}</p>` : notifications.slice(0, 10).map((n) => {
      const icon = n.type === "friend_request" ? "\u{1F465}" : n.type === "achievement" ? "\u{1F3C6}" : "\u2139\uFE0F";
      const titleColor = n.read ? "var(--mc-stone-gray)" : "var(--mc-diamond-blue)";
      const dateStr = new Date(n.createdAt).toLocaleString(void 0, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
      return `
        <button data-notif-id="${n.id}" class="mc-notif-item" style="width:100%;text-align:left;padding:12px;border-bottom:1px solid #2A2A2A;background:${n.read ? "transparent" : "rgba(93,140,62,0.1)"};cursor:pointer;opacity:${n.read ? "0.6" : "1"};transition:all 0.15s">
          <div style="display:flex;align-items:flex-start;gap:8px">
            <span style="font-size:0.875rem;margin-top:2px">${icon}</span>
            <div style="flex:1;min-width:0">
              <p style="font-family:var(--mc-font);font-size:0.65rem;color:${titleColor}">${n.title}</p>
              <p style="font-family:var(--mc-font);font-size:0.55rem;color:var(--mc-light-gray);margin-top:2px">${n.message}</p>
              <p style="font-family:var(--mc-font);font-size:0.5rem;color:var(--mc-stone-gray);margin-top:4px">${dateStr}</p>
            </div>
            ${!n.read ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--mc-emerald-green);margin-top:4px;flex-shrink:0"></div>' : ""}
          </div>
        </button>
      `;
    }).join("");
    return `
    <div class="mc-notification-panel-wrapper" style="position:absolute;right:0;top:100%;margin-top:8px;z-index:50;width:280px">
      <div class="mc-panel" style="min-width:280px">
        <div class="mc-panel-header" style="display:flex;align-items:center;justify-content:space-between">
          <span>\u{1F514} ${t2("notifications.title")} (${unreadCount})</span>
          ${notifications.length > 0 ? `<button id="mc-clear-all-notifs" style="font-size:0.55rem;color:var(--mc-redstone-red);text-decoration:none;cursor:pointer;font-family:var(--mc-font);background:none;border:none">${t2("notifications.clearAll")}</button>` : ""}
        </div>
        <div style="max-height:256px;overflow-y:auto">
          ${notifItems}
        </div>
      </div>
    </div>
  `;
  }
  function initNotificationPanel(t2) {
    document.querySelectorAll("[data-notif-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        playClick();
        markNotificationRead(btn.dataset.notifId);
      });
    });
    const clearBtn = document.getElementById("mc-clear-all-notifs");
    if (clearBtn) {
      clearBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        playClick();
        clearAllNotifications();
      });
    }
  }
  var _headerClickOutsideHandler = null;
  function renderHeader(t2) {
    const user = get("user");
    const currentView2 = get("currentView");
    const soundEnabled = get("soundEnabled");
    const biomeTheme = get("biomeTheme") || "forest";
    const notifications = get("notifications") || [];
    const unreadCount = notifications.filter((n) => !n.read).length;
    const toolNavItems = user ? [
      { view: "chatbot", label: t2("nav.chatbot"), icon: "\u{1F916}" },
      { view: "vent", label: t2("nav.vent"), icon: "\u{1F4AC}" }
    ] : [];
    const moreNavItems = user ? [
      { view: "minigame", label: t2("nav.minigame"), icon: "\u{1F3AE}" },
      { view: "quiz", label: t2("nav.quiz"), icon: "\u{1F4DD}" },
      { view: "studyHelp", label: t2("nav.studyHelp") || "Estudos", icon: "\u{1F4D6}", isNew: true },
      { view: "friends", label: t2("nav.friends"), icon: "\u{1F465}" },
      { view: "journal", label: t2("nav.journal"), icon: "\u{1F4D3}" },
      { view: "mood", label: t2("mood.title"), icon: "\u{1F60A}" },
      { view: "moodInsights", label: t2("nav.moodInsights"), icon: "\u{1F4CA}", isNew: true },
      { view: "pomodoro", label: t2("nav.pomodoro"), icon: "\u{1F345}" },
      { view: "challenges", label: t2("nav.challenges"), icon: "\u2694\uFE0F" },
      { view: "selfcare", label: t2("nav.selfcare"), icon: "\u{1F49A}" },
      { view: "breathing", label: t2("nav.breathing"), icon: "\u{1FAC1}" },
      { view: "gratitude", label: t2("nav.gratitude"), icon: "\u{1F64F}" },
      { view: "affirmations", label: t2("nav.affirmations"), icon: "\u2728" },
      { view: "coping", label: t2("nav.coping"), icon: "\u{1F9F0}", isNew: true },
      { view: "safetyPlan", label: t2("nav.safetyPlan"), icon: "\u{1F6E1}\uFE0F", isNew: true },
      { view: "achievements", label: t2("nav.achievements"), icon: "\u{1F3C6}" },
      { view: "resources", label: t2("nav.resources"), icon: "\u{1F4DA}" },
      { view: "leaderboard", label: t2("nav.leaderboard"), icon: "\u{1F3C5}", isNew: true },
      { view: "profile", label: t2("nav.profile"), icon: "\u{1F464}" },
      ...user.role === "admin" ? [{ view: "admin", label: t2("nav.admin"), icon: "\u{1F527}" }] : [],
      { view: "accessibility", label: t2("nav.accessibility"), icon: "\u267F" }
    ] : [];
    const allNavItems = [...toolNavItems, ...moreNavItems];
    const toolNavHTML = toolNavItems.map((item) => {
      const isActive = currentView2 === item.view;
      return `
      <button data-view="${item.view}" class="mc-header-nav-btn" style="
        padding: 8px 8px; font-size: var(--mc-font-size-sm); transition: all 0.15s; cursor: pointer;
        border: 2px solid transparent; white-space: nowrap; background: ${isActive ? "#4CAF50" : "transparent"};
        color: ${isActive ? "#fff" : "var(--mc-sand)"}; font-family: var(--mc-font); text-shadow: 1px 1px 0 #000;
        ${!isActive ? "border-color: transparent;" : "border-color: #000;"}
      ">
        ${item.icon}<span class="hidden xl:inline" style="margin-left:4px">${item.label}</span>
      </button>
    `;
    }).join("");
    const moreDropdownHTML = moreNavItems.length > 0 ? `
    <div class="mc-more-dropdown-wrapper" style="position:relative">
      <button id="mc-more-btn" style="
        padding: 8px 8px; font-size: var(--mc-font-size-sm); transition: all 0.15s; cursor: pointer;
        border: 2px solid transparent; white-space: nowrap; background: transparent;
        color: var(--mc-sand); font-family: var(--mc-font); text-shadow: 1px 1px 0 #000;
      ">
        \u{1F4CB}<span class="hidden xl:inline" style="margin-left:4px">${t2("nav.more") || "Mais"} \u25BE</span>
      </button>
      <div id="mc-more-dropdown" style="display:none">
        <div id="mc-more-backdrop" style="position:fixed;inset:0;z-index:40"></div>
        <div id="mc-more-menu" style="position:absolute;right:0;top:100%;margin-top:4px;z-index:50;background:var(--mc-wood-bg,#6B4226);border:4px solid #000;box-shadow:0 25px 50px rgba(0,0,0,0.5);padding:8px 0;min-width:220px;max-height:80vh;overflow-y:auto">
          ${moreNavItems.map((item) => {
      const isActive = currentView2 === item.view;
      return `
              <button data-view="${item.view}" class="mc-more-item" style="
                display: block; width: 100%; text-align: left; padding: 10px 16px;
                font-size: var(--mc-font-size-sm); transition: all 0.15s; cursor: pointer;
                border-bottom: 1px solid rgba(0,0,0,0.2); background: ${isActive ? "#4CAF50" : "transparent"};
                color: ${isActive ? "#fff" : "var(--mc-sand)"}; font-family: var(--mc-font); text-shadow: 1px 1px 0 #000;
              ">
                ${item.icon} ${item.label}
                ${item.isNew ? '<span class="mc-badge-new" style="margin-left:8px">NEW</span>' : ""}
              </button>
            `;
    }).join("")}
        </div>
      </div>
    </div>
  ` : "";
    const mobileMenuItems = allNavItems.map((item) => {
      const isActive = currentView2 === item.view;
      return `
      <button data-view="${item.view}" style="
        display: block; width: 100%; text-align: left; padding: 12px 16px;
        font-size: var(--mc-font-size-sm); transition: all 0.15s; cursor: pointer;
        border-bottom: 1px solid rgba(0,0,0,0.2); background: ${isActive ? "#4CAF50" : "transparent"};
        color: ${isActive ? "#fff" : "var(--mc-sand)"}; font-family: var(--mc-font); text-shadow: 1px 1px 0 #000;
      ">
        ${item.icon} ${item.label}
        ${item.isNew ? '<span class="mc-badge-new" style="margin-left:8px">NEW</span>' : ""}
      </button>
    `;
    }).join("");
    const biomeIcon = biomeTheme === "forest" ? "\u{1F33F}" : biomeTheme === "nether" ? "\u{1F525}" : "\u2728";
    const notifBell = user ? `
    <div style="position:relative" class="hidden sm:block" id="mc-notif-bell-wrapper">
      <button id="mc-notif-bell" style="position:relative;cursor:pointer;font-size:1.25rem;padding:4px" aria-label="${t2("notifications.title")}">
        \u{1F514}
        ${unreadCount > 0 ? `<span class="mc-notification-badge">${unreadCount}</span>` : ""}
      </button>
      <div id="mc-notif-panel-container" style="display:none"></div>
    </div>
  ` : "";
    const soundToggle = user ? `
    <button id="mc-sound-toggle" class="hidden sm:block" style="font-size:1.25rem;cursor:pointer;padding:4px;background:none;border:none" aria-label="Toggle sound">
      ${soundEnabled ? "\u{1F50A}" : "\u{1F507}"}
    </button>
  ` : "";
    const userArea = user ? `
    <div style="display:flex;align-items:center;gap:6px">
      <span class="hidden 2xl:inline" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-emerald-green);white-space:nowrap">
        \u26CF\uFE0F${user.username}
      </span>
      <button id="mc-logout-btn" class="mc-btn mc-btn-danger" style="font-size:var(--mc-font-size-sm);padding:4px 10px;white-space:nowrap">
        ${t2("auth.logout")}
      </button>
    </div>
  ` : `
    <button data-view="login" class="mc-btn mc-btn-gold" style="font-size:var(--mc-font-size-sm);padding:4px 10px;white-space:nowrap">
      ${t2("nav.login")}
    </button>
  `;
    return `
    <header class="mc-bg-wood" style="position:sticky;top:0;z-index:50;border-bottom:4px solid #000;box-shadow:0 4px 12px rgba(0,0,0,0.3)">
      <div style="width:100%;padding:0 16px">
        <div style="display:flex;align-items:center;justify-content:space-between;height:64px">
          <!-- Logo -->
          <button id="mc-logo-btn" style="display:flex;align-items:center;gap:12px;cursor:pointer;background:none;border:none;padding:0">
            <div class="mc-bg-grass mc-border-2" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:1.25rem">
              \u26CF\uFE0F
            </div>
            <div class="hidden sm:block">
              <h1 style="font-family:var(--mc-font);font-size:var(--mc-font-size-xl);color:#fff;text-shadow:2px 2px 0 #000;margin:0">
                MentalCraft
              </h1>
              <p style="font-family:var(--mc-font);font-size:0.55rem;color:var(--mc-sand);text-shadow:1px 1px 0 #000;margin:0">
                ${t2("landing.subtitle")}
              </p>
            </div>
          </button>

          <!-- Desktop Nav -->
          <nav class="hidden lg:flex" style="align-items:center;gap:4px;flex:1;min-width:0">
            ${toolNavHTML}
            ${moreDropdownHTML}
            <div style="margin-left:auto"></div>
          </nav>

          <!-- Right side -->
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
            ${soundToggle}

            <!-- Biome toggle -->
            <button id="mc-biome-toggle" class="mc-btn-press hidden 2xl:block" style="padding:4px 8px;font-size:0.875rem;cursor:pointer;border:2px solid #000" aria-label="${t2("biome.title")}">
              ${biomeIcon}
            </button>

            ${notifBell}

            <!-- Language Selector -->
            <select id="mc-lang-select" class="mc-input" style="padding:4px 6px;font-size:var(--mc-font-size-sm);width:auto" aria-label="Language">
              <option value="pt" ${getCurrentLocale() === "pt" ? "selected" : ""}>\u{1F1E7}\u{1F1F7} Portugu\xEAs</option>
              <option value="en" ${getCurrentLocale() === "en" ? "selected" : ""}>\u{1F1FA}\u{1F1F8} English</option>
              <option value="es" ${getCurrentLocale() === "es" ? "selected" : ""}>\u{1F1EA}\u{1F1F8} Espa\xF1ol</option>
              <option value="kaingang" ${getCurrentLocale() === "kaingang" ? "selected" : ""}>\u{1F332} Kaingang</option>
              <option value="tupi" ${getCurrentLocale() === "tupi" ? "selected" : ""}>\u{1F33F} Tupi</option>
            </select>

            ${userArea}

            <!-- Mobile menu button -->
            <button id="mc-mobile-menu-btn" class="lg:hidden mc-btn-stone" style="padding:4px 8px;font-size:0.875rem;cursor:pointer" aria-label="Menu">
              \u2630
            </button>
          </div>
        </div>

        <!-- Mobile Nav Overlay -->
        <div id="mc-mobile-overlay" style="display:none">
          <div style="position:fixed;inset:0;z-index:40;top:64px">
            <div id="mc-mobile-backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0.6)"></div>
            <nav id="mc-mobile-nav" class="mc-bg-wood" style="position:relative;border-bottom:4px solid #000;border-right:4px solid #000;box-shadow:0 25px 50px rgba(0,0,0,0.5);overflow-y:auto;max-height:calc(100vh - 64px);max-width:320px;font-family:var(--mc-font)">
              <div style="display:flex;justify-content:flex-end;padding:8px">
                <button id="mc-mobile-close" class="mc-btn mc-btn-danger" style="padding:4px 12px;font-size:var(--mc-font-size-sm);cursor:pointer">
                  \u2715 ${t2("common.close")}
                </button>
              </div>
              ${mobileMenuItems}
            </nav>
          </div>
        </div>
      </div>
    </header>
  `;
  }
  function initHeader(t2) {
    const logoBtn = document.getElementById("mc-logo-btn");
    if (logoBtn) {
      logoBtn.addEventListener("click", () => {
        playClick();
        setView("landing");
      });
    }
    document.querySelectorAll("[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        playClick();
        setView(btn.dataset.view);
        closeMobileMenu();
        closeMoreDropdown();
        closeNotifPanel();
      });
    });
    const soundBtn = document.getElementById("mc-sound-toggle");
    if (soundBtn) {
      soundBtn.addEventListener("click", () => {
        toggleSound();
        playClick();
      });
    }
    const biomeBtn = document.getElementById("mc-biome-toggle");
    if (biomeBtn) {
      biomeBtn.addEventListener("click", () => {
        cycleBiomeTheme();
        playClick();
      });
    }
    const langSelect = document.getElementById("mc-lang-select");
    if (langSelect) {
      langSelect.addEventListener("change", (e) => {
        setLocale(e.target.value);
      });
    }
    const logoutBtn = document.getElementById("mc-logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        const token = get("token");
        if (token) {
          fetch("/api/auth/logout", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        logout();
        showToast(t2("common.goodbye"), "info");
      });
    }
    const moreBtn = document.getElementById("mc-more-btn");
    const moreDropdown = document.getElementById("mc-more-dropdown");
    const moreBackdrop = document.getElementById("mc-more-backdrop");
    if (moreBtn && moreDropdown) {
      moreBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        playClick();
        const isOpen = moreDropdown.style.display !== "none";
        moreDropdown.style.display = isOpen ? "none" : "block";
        moreBtn.style.background = isOpen ? "transparent" : "#FFB300";
        moreBtn.style.borderColor = isOpen ? "transparent" : "#000";
        moreBtn.style.color = isOpen ? "var(--mc-sand)" : "#000";
        moreBtn.style.textShadow = isOpen ? "1px 1px 0 #000" : "none";
      });
      if (moreBackdrop) {
        moreBackdrop.addEventListener("click", closeMoreDropdown);
      }
      moreDropdown.querySelectorAll("[data-view]").forEach((btn) => {
        btn.addEventListener("click", () => {
          playClick();
          setView(btn.dataset.view);
          closeMobileMenu();
          closeMoreDropdown();
        });
      });
    }
    const notifBell = document.getElementById("mc-notif-bell");
    const notifContainer = document.getElementById("mc-notif-panel-container");
    if (notifBell && notifContainer) {
      notifBell.addEventListener("click", (e) => {
        e.stopPropagation();
        playClick();
        const isOpen = notifContainer.style.display !== "none";
        if (isOpen) {
          closeNotifPanel();
        } else {
          notifContainer.style.display = "block";
          notifContainer.innerHTML = renderNotificationPanel(t2);
          initNotificationPanel(t2);
        }
      });
    }
    const mobileMenuBtn = document.getElementById("mc-mobile-menu-btn");
    const mobileOverlay = document.getElementById("mc-mobile-overlay");
    const mobileBackdrop = document.getElementById("mc-mobile-backdrop");
    const mobileClose = document.getElementById("mc-mobile-close");
    if (mobileMenuBtn && mobileOverlay) {
      mobileMenuBtn.addEventListener("click", () => {
        playClick();
        mobileOverlay.style.display = "block";
        document.body.style.overflow = "hidden";
      });
    }
    if (mobileBackdrop) {
      mobileBackdrop.addEventListener("click", closeMobileMenu);
    }
    if (mobileClose) {
      mobileClose.addEventListener("click", closeMobileMenu);
    }
    if (_headerClickOutsideHandler) {
      document.removeEventListener("mousedown", _headerClickOutsideHandler);
    }
    _headerClickOutsideHandler = (e) => {
      if (moreDropdown && moreDropdown.style.display !== "none") {
        if (!e.target.closest(".mc-more-dropdown-wrapper")) {
          closeMoreDropdown();
        }
      }
      if (notifContainer && notifContainer.style.display !== "none") {
        if (!e.target.closest("#mc-notif-bell-wrapper")) {
          closeNotifPanel();
        }
      }
    };
    document.addEventListener("mousedown", _headerClickOutsideHandler);
  }
  function closeMoreDropdown() {
    const moreDropdown = document.getElementById("mc-more-dropdown");
    const moreBtn = document.getElementById("mc-more-btn");
    if (moreDropdown) moreDropdown.style.display = "none";
    if (moreBtn) {
      moreBtn.style.background = "transparent";
      moreBtn.style.borderColor = "transparent";
      moreBtn.style.color = "var(--mc-sand)";
      moreBtn.style.textShadow = "1px 1px 0 #000";
    }
  }
  function closeNotifPanel() {
    const container = document.getElementById("mc-notif-panel-container");
    if (container) container.style.display = "none";
  }
  function closeMobileMenu() {
    const overlay = document.getElementById("mc-mobile-overlay");
    if (overlay) overlay.style.display = "none";
    document.body.style.overflow = "";
  }
  function renderFooter(t2) {
    const blockColors = ["#4CAF50", "#A0722A", "#9E9E9E", "#00E5FF", "#FFB300", "#FF1A1A", "#3AA93B", "#42A5F5"];
    const blocks = Array.from({ length: 20 }, (_, i) => {
      const bg = blockColors[i % blockColors.length];
      const opacity = (0.6 + Math.sin(i * 0.5) * 0.3).toFixed(2);
      return `<div style="width:24px;height:24px;border:1px solid #000;background:${bg};opacity:${opacity}"></div>`;
    }).join("");
    return `
    <footer class="mc-bg-wood" style="margin-top:auto;border-top:4px solid #000;position:relative;z-index:10">
      <div class="mc-footer-border"></div>
      <div style="max-width:72rem;margin:0 auto;padding:32px 16px">
        <div style="display:grid;grid-template-columns:1fr;gap:24px" class="sm:grid-cols-3">
          <!-- Brand -->
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
              <span style="font-size:1.5rem">\u26CF\uFE0F</span>
              <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-lg);color:#fff;text-shadow:2px 2px 0 #000">
                MentalCraft
              </span>
            </div>
            <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-sand);line-height:1.8">
              ${t2("landing.subtitle")}
            </p>
          </div>

          <!-- Emergency numbers -->
          <div>
            <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-redstone-red);text-shadow:1px 1px 0 #000;margin-bottom:8px">
              \u{1F198} ${t2("emergency.title")}
            </h4>
            <div style="display:flex;flex-direction:column;gap:4px">
              <a href="tel:180" class="mc-footer-link" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm)">\u{1F4DE} 180 - ${t2("emergency.description180")}</a>
              <a href="tel:192" class="mc-footer-link" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm)">\u{1F4DE} 192 - ${t2("emergency.description192")}</a>
              <a href="tel:190" class="mc-footer-link" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm)">\u{1F4DE} 190 - ${t2("emergency.description190")}</a>
              <a href="tel:188" class="mc-footer-link" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm)">\u{1F4DE} 188 - ${t2("emergency.description188")}</a>
            </div>
          </div>

          <!-- Quick links -->
          <div>
            <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-emerald-green);text-shadow:1px 1px 0 #000;margin-bottom:8px">
              \u26CF\uFE0F ${t2("footer.links")}
            </h4>
            <div style="display:flex;flex-direction:column;gap:4px">
              <button data-view="landing" class="mc-footer-link" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);text-align:left;cursor:pointer;background:none;border:none;color:inherit;padding:0">${t2("nav.landing")}</button>
              <button data-view="accessibility" class="mc-footer-link" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);text-align:left;cursor:pointer;background:none;border:none;color:inherit;padding:0">${t2("nav.accessibility")}</button>
              <button data-view="quiz" class="mc-footer-link" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);text-align:left;cursor:pointer;background:none;border:none;color:inherit;padding:0">${t2("nav.quiz")}</button>
            </div>
          </div>
        </div>

        <!-- Decorative bottom blocks -->
        <div style="margin-top:24px;display:flex;justify-content:center;gap:4px;flex-wrap:wrap">
          ${blocks}
        </div>

        <p style="margin-top:16px;text-align:center;font-family:var(--mc-font);font-size:0.6rem;color:var(--mc-stone-gray);text-shadow:1px 1px 0 #000">
          MentalCraft \xA9 2025 - ${t2("footer.copyright")}
        </p>
      </div>
    </footer>
  `;
  }
  var PARTICLES_DATA = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: (i * 37 + 13) % 100,
    delay: i * 1.3 % 5,
    duration: 3 + i * 0.7 % 4,
    size: 2 + i * 0.5 % 4,
    color: ["#4CAF50", "#00E5FF", "#FFB300", "#FF1A1A", "#9E9E9E"][i % 5]
  }));
  var _landingTimers = [];
  function renderLanding(t2) {
    const user = get("user");
    const features = [
      { view: "chatbot", icon: "\u{1F916}", title: t2("landing.feature1Title"), desc: t2("landing.feature1Desc"), color: "mc-btn-primary" },
      { view: "quiz", icon: "\u{1F4DD}", title: t2("landing.feature2Title"), desc: t2("landing.feature2Desc"), color: "mc-btn-diamond" },
      { view: "friends", icon: "\u{1F465}", title: t2("landing.feature3Title"), desc: t2("landing.feature3Desc"), color: "mc-btn-gold" },
      { view: "minigame", icon: "\u{1F3AE}", title: t2("landing.feature4Title"), desc: t2("landing.feature4Desc"), color: "mc-btn-secondary" },
      { view: "vent", icon: "\u{1F4AC}", title: t2("landing.feature5Title"), desc: t2("landing.feature5Desc"), color: "mc-btn-stone" },
      { view: "accessibility", icon: "\u267F", title: t2("landing.feature6Title"), desc: t2("landing.feature6Desc"), color: "mc-btn-danger" },
      { view: "journal", icon: "\u{1F4D3}", title: t2("landing.feature7Title"), desc: t2("landing.feature7Desc"), color: "mc-btn-primary" },
      { view: "accessibility", icon: "\u{1F50A}", title: t2("landing.feature8Title"), desc: t2("landing.feature8Desc"), color: "mc-btn-secondary" }
    ];
    const featuresHTML = features.map((f) => `
    <button data-view="${f.view}" data-require-auth="${f.view !== "accessibility" ? "true" : ""}" class="mc-panel mc-mob-card" style="text-align:left;cursor:pointer">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <div class="mc-border-2" style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;background:var(--mc-bg-light)">
          ${f.icon}
        </div>
        <h3 style="font-family:var(--mc-font);font-size:var(--mc-font-size-lg);color:var(--mc-diamond-blue);text-shadow:2px 2px 0 #000;margin:0">
          ${f.title}
        </h3>
      </div>
      <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);line-height:1.8;margin:0">
        ${f.desc}
      </p>
      <div class="mc-btn ${f.color}" style="margin-top:16px;font-size:var(--mc-font-size-sm);width:fit-content;opacity:0.8">
        ${t2("landing.cta3")} \u2192
      </div>
    </button>
  `).join("");
    const stats = [
      { icon: "\u2764\uFE0F", value: "24/7", label: t2("landing.stat1") },
      { icon: "\u{1F6E1}\uFE0F", value: "100%", label: t2("landing.stat2") },
      { icon: "\u{1F30D}", value: "5", label: t2("landing.stat3") },
      { icon: "\u{1F3AE}", value: "\u221E", label: t2("landing.stat4") }
    ];
    const statsHTML = stats.map((s) => `
    <div class="mc-stat-card mc-stat-green" style="display:flex;flex-direction:column;align-items:center;gap:8px">
      <span style="font-size:1.875rem">${s.icon}</span>
      <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-emerald-green);text-shadow:2px 2px 0 #000">${s.value}</span>
      <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">${s.label}</span>
    </div>
  `).join("");
    const characters = [
      { name: "Steve", desc: t2("landing.char1"), emoji: "\u{1F9D1}\u200D\u{1F33E}", color: "#00E5FF" },
      { name: "Alex", desc: t2("landing.char2"), emoji: "\u{1F469}\u200D\u{1F9B0}", color: "#FF6B9D" },
      { name: "Villager", desc: t2("landing.char3"), emoji: "\u{1F9DD}", color: "#8B6914" },
      { name: "Iron Golem", desc: t2("landing.char4"), emoji: "\u{1F916}", color: "#C0C0C0" }
    ];
    const charactersHTML = characters.map((c) => `
    <div class="mc-panel mc-mob-card" style="text-align:center">
      <div style="width:96px;height:96px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:3rem;border:3px solid ${c.color};background:${c.color}22">
        ${c.emoji}
      </div>
      <h3 style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:${c.color};text-shadow:2px 2px 0 #000;margin:0 0 8px 0">
        ${c.name}
      </h3>
      <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);margin-top:8px;line-height:1.6">
        ${c.desc}
      </p>
    </div>
  `).join("");
    const tips = [
      { icon: "\u{1F4AD}", title: t2("tips.tip1Title"), desc: t2("tips.tip1Desc"), delay: "0s" },
      { icon: "\u{1FAC1}", title: t2("tips.tip2Title"), desc: t2("tips.tip2Desc"), delay: "0.5s" },
      { icon: "\u{1F91D}", title: t2("tips.tip3Title"), desc: t2("tips.tip3Desc"), delay: "1s" },
      { icon: "\u{1F9D8}", title: t2("tips.tip4Title"), desc: t2("tips.tip4Desc"), delay: "1.5s" }
    ];
    const tipsHTML = tips.map((tip) => `
    <div class="mc-panel" style="padding:24px">
      <div style="font-size:2.5rem;margin-bottom:12px" class="mc-float-item" data-float-delay="${tip.delay}">${tip.icon}</div>
      <h3 style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-diamond-blue);text-shadow:2px 2px 0 #000;margin-bottom:8px">
        ${tip.title}
      </h3>
      <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);line-height:1.8;margin:0">
        ${tip.desc}
      </p>
    </div>
  `).join("");
    const heroBlocks = [
      { top: "10%", left: "5%", type: "block-diamond", delay: "0s" },
      { top: "20%", right: "8%", type: "block-gold", delay: "1s" },
      { top: "60%", left: "10%", type: "block-stone", delay: "2s" },
      { top: "70%", right: "12%", type: "block-grass", delay: "0.5s" },
      { top: "40%", left: "3%", type: "block-redstone", delay: "1.5s" },
      { top: "50%", right: "5%", type: "block-diamond", delay: "3s" },
      { top: "80%", left: "20%", type: "block-gold", delay: "2.5s" }
    ];
    const floatingBlocksHTML = heroBlocks.map((b) => {
      const posStyle = b.top ? `top:${b.top}` : `right:${b.right}`;
      const posStyle2 = b.left ? `left:${b.left}` : "";
      return `<div class="mc-hero-float-block ${b.type}" style="${posStyle};${posStyle2};animation-delay:${b.delay}"></div>`;
    }).join("");
    const hotbarItems = ["\u{1F9E0}", "\u{1F49A}", "\u{1F6E1}\uFE0F", "\u26CF\uFE0F", "\u{1F48E}", "\u{1F4DA}", "\u{1F3AE}", "\u{1F91D}", "\u2B50"];
    const hotbarHTML = hotbarItems.map((item) => `
    <div class="mc-hotbar-slot"><span style="font-size:1.25rem;sm:font-size:1.5rem">${item}</span></div>
  `).join("");
    const ctaBtnText = user ? t2("landing.cta2") : t2("landing.cta1");
    const ctaView = user ? "dashboard" : "register";
    return `
    <div style="min-height:100vh">
      <!-- Hero Section -->
      <section class="mc-bg-grass" style="position:relative;overflow:hidden;min-height:70vh;display:flex;align-items:center;justify-content:center">
        <div style="position:absolute;inset:0;opacity:0.1;background-image:url('data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='16' height='16' fill='%23000' fill-opacity='0.2'/%3E%3Crect x='1' y='1' width='14' height='14' fill='none' stroke='%23000' stroke-width='1' fill-opacity='0.1'/%3E%3C/svg%3E');background-size:16px 16px"></div>

        <div class="animate-pixel-slide-up" style="position:relative;z-index:10;text-align:center;padding:64px 16px">
          ${floatingBlocksHTML}

          <div style="margin-bottom:24px">
            <div class="mc-bg-wood mc-border" style="display:inline-block;padding:12px 24px;margin-bottom:16px">
              <span style="color:var(--mc-gold);font-family:var(--mc-font);font-size:var(--mc-font-size-sm);text-shadow:1px 1px 0 #000">
                \u26CF\uFE0F MINECRAFT \u26CF\uFE0F
              </span>
            </div>
          </div>

          <h1 class="animate-title-glow" style="
            font-family:var(--mc-font);
            font-size:clamp(1.5rem, 5vw, var(--mc-font-size-4xl));
            color:var(--mc-white);
            text-shadow:4px 4px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000;
            line-height:1.3; margin-bottom:24px;
          ">${t2("landing.hero")}</h1>

          <p style="
            font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-sand);text-shadow:2px 2px 0 #000;line-height:1.8;
            max-width:42rem;margin:0 auto 32px;
          ">${t2("landing.description")}</p>

          <div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center">
            <button id="mc-cta-main" class="mc-btn mc-btn-gold animate-pixel-bounce" style="font-size:var(--mc-font-size-lg);padding:16px 32px">
              \u26CF\uFE0F ${ctaBtnText}
            </button>
            <button data-view="chatbot" data-require-auth="true" class="mc-btn mc-btn-diamond" style="font-size:var(--mc-font-size-lg);padding:16px 32px">
              \u{1F916} ${t2("nav.chatbot")}
            </button>
          </div>
        </div>

        <div class="mc-bg-dirt" style="position:absolute;bottom:0;left:0;right:0;height:64px;clip-path:polygon(0 30%,5% 0%,10% 40%,15% 10%,20% 35%,25% 5%,30% 45%,35% 15%,40% 30%,45% 8%,50% 40%,55% 12%,60% 35%,65% 5%,70% 45%,75% 10%,80% 30%,85% 15%,90% 40%,95% 8%,100% 30%,100% 100%,0 100%)"></div>

        <div class="mc-inventory-hotbar">
          ${hotbarHTML}
        </div>
      </section>

      <div class="mc-pixel-divider"></div>

      <!-- Stats bar -->
      <section style="background:var(--mc-bg-dark);padding:24px 0">
        <div style="max-width:64rem;margin:0 auto;padding:0 16px;display:grid;grid-template-columns:repeat(2,1fr);gap:16px;text-align:center" class="md:grid-cols-4">
          ${statsHTML}
        </div>
      </section>

      <div class="mc-section-transition"></div>

      <!-- Emergency Banner -->
      <section class="mc-bg-lava mc-emergency-pulse" style="padding:16px 0;position:relative;overflow:hidden">
        <div style="max-width:56rem;margin:0 auto;padding:0 16px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:16px;position:relative;z-index:10">
          <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:#fff;text-shadow:2px 2px 0 #000">
            \u{1F198} ${t2("emergency.title")}:
          </span>
          <a href="tel:180" class="mc-btn mc-btn-gold" style="padding:4px 16px;font-size:var(--mc-font-size-sm)">\u{1F4DE} 180</a>
          <a href="tel:188" class="mc-btn mc-btn-gold" style="padding:4px 16px;font-size:var(--mc-font-size-sm)">\u{1F4DE} 188</a>
          <a href="tel:192" class="mc-btn mc-btn-gold" style="padding:4px 16px;font-size:var(--mc-font-size-sm)">\u{1F4DE} 192</a>
          <a href="tel:190" class="mc-btn mc-btn-gold" style="padding:4px 16px;font-size:var(--mc-font-size-sm)">\u{1F4DE} 190</a>
        </div>
      </section>

      <div class="mc-section-transition"></div>

      <!-- Features Section -->
      <section style="padding:64px 16px;background:var(--mc-bg)">
        <div style="max-width:72rem;margin:0 auto">
          <h2 style="text-align:center;margin-bottom:48px;font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-gold);text-shadow:3px 3px 0 #000">
            \u2B50 ${t2("landing.features")} \u2B50
          </h2>
          <div style="display:grid;grid-template-columns:1fr;gap:24px" class="sm:grid-cols-2 lg:grid-cols-3">
            ${featuresHTML}
          </div>
        </div>
      </section>

      <div class="mc-section-transition"></div>

      <!-- Characters Section -->
      <section class="mc-bg-obsidian" style="padding:64px 16px">
        <div style="max-width:72rem;margin:0 auto">
          <h2 style="text-align:center;margin-bottom:48px;font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-emerald-green);text-shadow:3px 3px 0 #000">
            \u{1F9D1}\u200D\u{1F33E} ${t2("landing.characters")} \u{1F9D1}\u200D\u{1F33E}
          </h2>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px" class="md:grid-cols-4">
            ${charactersHTML}
          </div>
        </div>
      </section>

      <div class="mc-section-transition"></div>

      <!-- Mobs Section -->
      <section style="padding:64px 16px;background:var(--mc-bg-dark)">
        <div style="max-width:72rem;margin:0 auto">
          <h2 style="text-align:center;margin-bottom:48px;font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-ender-purple);text-shadow:3px 3px 0 #000">
            \u{1F311} ${t2("landing.subtitle")} \u{1F311}
          </h2>
          <div class="mc-mob-gallery">
            <div class="mc-mob-card mc-mob-float" style="animation-delay:0s"><div class="mc-mob mc-mob-creeper"></div><span>Creeper</span></div>
            <div class="mc-mob-card mc-mob-float" style="animation-delay:0.5s"><div class="mc-mob mc-mob-enderman"></div><span>Enderman</span></div>
            <div class="mc-mob-card mc-mob-float" style="animation-delay:1s"><div class="mc-mob mc-mob-zombie"></div><span>Zumbi</span></div>
            <div class="mc-mob-card mc-mob-float" style="animation-delay:1.5s"><div class="mc-mob mc-mob-skeleton"></div><span>Esqueleto</span></div>
            <div class="mc-mob-card mc-mob-float" style="animation-delay:0.3s"><div class="mc-mob mc-mob-pig"></div><span>Porco</span></div>
            <div class="mc-mob-card mc-mob-float" style="animation-delay:0.8s"><div class="mc-mob mc-mob-wolf"></div><span>Lobo</span></div>
            <div class="mc-mob-card mc-mob-float" style="animation-delay:1.2s"><div class="mc-mob mc-mob-spider"></div><span>Aranha</span></div>
            <div class="mc-mob-card mc-mob-float" style="animation-delay:0.6s"><div class="mc-mob mc-mob-ender-dragon"></div><span>Ender Dragon</span></div>
          </div>
        </div>
      </section>

      <div class="mc-section-transition"></div>

      <!-- Tips Section -->
      <section class="mc-bg-obsidian" style="padding:64px 16px">
        <div style="max-width:72rem;margin:0 auto">
          <h2 class="mc-enchanted" style="text-align:center;margin-bottom:48px;font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-gold);text-shadow:3px 3px 0 #000">
            \u{1F49A} ${t2("tips.title")} \u{1F49A}
          </h2>
          <div style="display:grid;grid-template-columns:1fr;gap:24px;margin-bottom:48px" class="sm:grid-cols-2">
            ${tipsHTML}
          </div>

          <!-- Breathing Exercise -->
          <div style="text-align:center" id="mc-landing-breathing">
            <h3 style="font-family:var(--mc-font);font-size:var(--mc-font-size-lg);color:var(--mc-emerald-green);text-shadow:2px 2px 0 #000;margin-bottom:24px">
              \u{1F32C}\uFE0F 4-7-8
            </h3>
            <div style="display:flex;align-items:center;justify-content:center;margin-bottom:24px">
              <div id="mc-breath-circle" style="width:128px;height:128px;border-radius:50%;background:#3F3F3F;display:flex;align-items:center;justify-content:center;transition:transform 2s ease-in-out,background-color 1s ease">
                <span id="mc-breath-text" style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:#fff;text-shadow:2px 2px 0 #000">\u{1FAC1}</span>
              </div>
            </div>
            <button id="mc-breath-start" class="mc-btn mc-btn-primary" style="font-size:var(--mc-font-size-sm)">
              \u{1F31F} ${t2("tips.breathStart")}
            </button>
          </div>
        </div>
      </section>

      <div class="mc-section-transition"></div>

      <!-- CTA Section -->
      <section class="mc-bg-grass" style="padding:64px 16px;position:relative;overflow:hidden">
        <div style="position:absolute;inset:0;opacity:0.05;background-image:url('data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='32' height='32' fill='none' stroke='%23000' stroke-width='1'/%3E%3C/svg%3E');background-size:32px 32px"></div>
        <div class="animate-pixel-fade-in" style="max-width:48rem;margin:0 auto;text-align:center;position:relative;z-index:10">
          <h2 style="font-family:var(--mc-font);font-size:var(--mc-font-size-3xl);color:var(--mc-white);text-shadow:4px 4px 0 #000">
            ${t2("landing.cta4")}
          </h2>
          <p style="margin-top:16px;margin-bottom:32px;font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-sand);text-shadow:2px 2px 0 #000;line-height:1.8">
            ${t2("landing.cta5")}
          </p>
          <button id="mc-cta-bottom" class="mc-btn mc-btn-diamond mc-badge-epic animate-pixel-pulse" style="font-size:var(--mc-font-size-lg);padding:16px 40px">
            \u26CF\uFE0F ${t2("landing.cta1")}
          </button>
        </div>
      </section>
    </div>
  `;
  }
  function initLanding(t2) {
    const user = get("user");
    document.querySelectorAll('[data-require-auth="true"]').forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const target = btn.closest("[data-view]") || btn;
        const view = target.dataset.view;
        if (!view) return;
        if (!user) {
          showToast(t2("errors.loginRequired"), "error");
          setView("login");
          return;
        }
        playClick();
        setView(view);
      });
    });
    const ctaMain = document.getElementById("mc-cta-main");
    if (ctaMain) {
      ctaMain.addEventListener("click", () => {
        playClick();
        setView(user ? "dashboard" : "register");
      });
    }
    const ctaBottom = document.getElementById("mc-cta-bottom");
    if (ctaBottom) {
      ctaBottom.addEventListener("click", () => {
        playClick();
        setView(user ? "dashboard" : "register");
      });
    }
    const breathBtn = document.getElementById("mc-breath-start");
    const breathCircle = document.getElementById("mc-breath-circle");
    const breathText = document.getElementById("mc-breath-text");
    if (breathBtn && breathCircle && breathText) {
      breathBtn.addEventListener("click", () => {
        playClick();
        breathBtn.disabled = true;
        breathBtn.style.opacity = "0.6";
        breathBtn.textContent = "\u23F3 ...";
        breathCircle.style.backgroundColor = "#4CAF50";
        breathCircle.style.transform = "scale(1.4)";
        breathText.textContent = t2("tips.inhale");
        const t1 = setTimeout(() => {
          breathCircle.style.backgroundColor = "#FFB300";
          breathCircle.style.transform = "scale(1.4)";
          breathText.textContent = t2("tips.hold");
        }, 4e3);
        const t22 = setTimeout(() => {
          breathCircle.style.backgroundColor = "#00E5FF";
          breathCircle.style.transform = "scale(0.8)";
          breathText.textContent = t2("tips.exhale");
        }, 11e3);
        const t3 = setTimeout(() => {
          breathCircle.style.backgroundColor = "#3F3F3F";
          breathCircle.style.transform = "scale(1)";
          breathText.textContent = "\u{1FAC1}";
          breathBtn.disabled = false;
          breathBtn.style.opacity = "1";
          breathBtn.textContent = "\u{1F31F} " + t2("tips.breathStart");
        }, 19e3);
        _landingTimers.push(t1, t22, t3);
      });
    }
    const audioDescription = get("audioDescription");
    if (audioDescription) {
      const msg = new SpeechSynthesisUtterance(t2("landing.hero"));
      msg.lang = "pt-BR";
      speechSynthesis.cancel();
      speechSynthesis.speak(msg);
      _landingTimers.push({ cancel: () => speechSynthesis.cancel() });
    }
  }
  function cleanupLanding() {
    _landingTimers.forEach((timer) => {
      if (timer && typeof timer === "object" && timer.cancel) {
        timer.cancel();
      } else if (timer) {
        clearTimeout(timer);
      }
    });
    _landingTimers.length = 0;
    speechSynthesis.cancel();
  }
  function renderAuth(t2, mode) {
    const isRegister = mode === "register";
    const usernameField = isRegister ? `
    <div style="margin-bottom:16px">
      <label style="display:block;margin-bottom:4px;font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);font-family:var(--mc-font)">${t2("auth.username")}</label>
      <input type="text" id="mc-auth-username" class="mc-input" required minlength="3" maxlength="20" pattern="[a-zA-Z0-9_]+" />
    </div>
  ` : "";
    const confirmField = isRegister ? `
    <div style="margin-bottom:16px">
      <label style="display:block;margin-bottom:4px;font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);font-family:var(--mc-font)">${t2("auth.confirmPassword")}</label>
      <input type="password" id="mc-auth-confirm" class="mc-input" required minlength="6" />
    </div>
  ` : "";
    const mcNameField = isRegister ? `
    <div style="margin-bottom:16px">
      <label style="display:block;margin-bottom:4px;font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);font-family:var(--mc-font)">${t2("auth.minecraftName")} <span style="color:var(--mc-stone-gray)">(${t2("common.optional") || "opcional"})</span></label>
      <input type="text" id="mc-auth-mcname" class="mc-input" placeholder="Steve_Builder" />
    </div>
  ` : "";
    return `
    <div style="min-height:80vh;display:flex;align-items:center;justify-content:center;padding:48px 16px">
      <div class="mc-auth-decoration">
        <div class="mc-panel mc-auth-glow animate-pixel-slide-up" style="width:100%;max-width:28rem">
          <div class="mc-panel-header" style="text-align:center">
            ${isRegister ? "\u26CF\uFE0F " + t2("auth.register") : "\u{1F510} " + t2("auth.login")}
          </div>

          <form id="mc-auth-form" style="display:flex;flex-direction:column;gap:16px">
            ${usernameField}

            <div style="margin-bottom:16px">
              <label style="display:block;margin-bottom:4px;font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);font-family:var(--mc-font)">${t2("auth.email")}</label>
              <input type="email" id="mc-auth-email" class="mc-input" required />
            </div>

            <div style="margin-bottom:16px">
              <label style="display:block;margin-bottom:4px;font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);font-family:var(--mc-font)">${t2("auth.password")}</label>
              <input type="password" id="mc-auth-password" class="mc-input" required minlength="6" />
            </div>

            ${confirmField}
            ${mcNameField}

            <button type="submit" id="mc-auth-submit" class="mc-btn mc-btn-primary" style="width:100%;font-size:var(--mc-font-size-md);padding:12px">
              ${isRegister ? "\u26CF\uFE0F " + t2("auth.register") : "\u2694\uFE0F " + t2("auth.login")}
            </button>
          </form>

          <div class="mc-form-divider" style="margin:16px 0">
            <span style="font-family:var(--mc-font);font-size:0.65rem;color:var(--mc-stone-gray)">\u26CF\uFE0F</span>
          </div>

          <div style="margin-top:8px;text-align:center">
            <button id="mc-auth-switch" style="font-size:var(--mc-font-size-sm);color:var(--mc-diamond-blue);cursor:pointer;background:none;border:none;text-decoration:underline;font-family:var(--mc-font);padding:0">
              ${isRegister ? t2("auth.hasAccount") : t2("auth.noAccount")}
            </button>
            <br />
            <button id="mc-auth-back" style="font-size:var(--mc-font-size-sm);color:var(--mc-stone-gray);cursor:pointer;background:none;border:none;text-decoration:underline;font-family:var(--mc-font);padding:0;margin-top:4px">
              \u2190 ${t2("common.back")}
            </button>
          </div>

          <!-- Decorative Minecraft blocks -->
          <div style="display:flex;justify-content:center;gap:8px;margin-top:24px">
            ${["\u{1F7EB}", "\u{1F7E9}", "\u2B1C", "\u{1F7E8}", "\u{1F48E}"].map((b, i) => `<span class="animate-xp-orb" style="animation-delay:${i * 0.3}s;font-size:1.5rem">${b}</span>`).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
  }
  function initAuth(t2, mode) {
    const form = document.getElementById("mc-auth-form");
    const switchBtn = document.getElementById("mc-auth-switch");
    const backBtn = document.getElementById("mc-auth-back");
    const submitBtn = document.getElementById("mc-auth-submit");
    if (switchBtn) {
      switchBtn.addEventListener("click", () => {
        playClick();
        setView(mode === "login" ? "register" : "login");
      });
    }
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        playClick();
        setView("landing");
      });
    }
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.style.opacity = "0.6";
          submitBtn.textContent = "\u23F3 ...";
        }
        try {
          if (mode === "register") {
            const password = document.getElementById("mc-auth-password").value;
            const confirm = document.getElementById("mc-auth-confirm").value;
            if (password !== confirm) {
              showToast(t2("errors.passwordMismatch"), "error");
              playError();
              resetAuthBtn();
              return;
            }
          }
          const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
          const body = mode === "login" ? { email: document.getElementById("mc-auth-email").value, password: document.getElementById("mc-auth-password").value } : {
            username: document.getElementById("mc-auth-username").value,
            email: document.getElementById("mc-auth-email").value,
            password: document.getElementById("mc-auth-password").value,
            minecraftName: document.getElementById("mc-auth-mcname").value || void 0
          };
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });
          const data = await res.json();
          if (!res.ok) {
            showToast(data.error || t2("errors.requestError"), "error");
            playError();
            resetAuthBtn();
            return;
          }
          setAuth(data.user, data.token);
          showToast(t2("common.success"), "success");
          playSuccess();
          setView("dashboard");
        } catch (err) {
          showToast(t2("errors.connectionError"), "error");
          playError();
          resetAuthBtn();
        }
      });
    }
    function resetAuthBtn() {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
        submitBtn.textContent = mode === "login" ? "\u2694\uFE0F " + t2("auth.login") : "\u26CF\uFE0F " + t2("auth.register");
      }
    }
  }
  var _dashboardTimers = [];
  function renderDashboard(t2) {
    const user = get("user");
    const locale = getCurrentLocale();
    const dayOfYear = Math.floor((Date.now() - new Date((/* @__PURE__ */ new Date()).getFullYear(), 0, 0).getTime()) / 864e5);
    const dailyTips = [
      { pt: "Respire fundo 3 vezes antes de reagir a uma situa\xE7\xE3o dif\xEDcil.", en: "Take 3 deep breaths before reacting to a difficult situation.", es: "Respira profundo 3 veces antes de reaccionar a una situaci\xF3n dif\xEDcil.", kaingang: "Huk\xE3 teko s\xE3.", tupi: "Huk\xE3 teko s\xE3." },
      { pt: "Converse com algu\xE9m de confian\xE7a sobre como voc\xEA se sente.", en: "Talk to someone you trust about how you feel.", es: "Habla con alguien de confianza sobre c\xF3mo te sientes.", kaingang: "Ir\u0169 jykre.", tupi: "Ir\u0169 \xF1e'\u1EBD." },
      { pt: "Fa\xE7a uma pausa de 10 minutos para fazer algo que voc\xEA gosta.", en: "Take a 10-minute break to do something you enjoy.", es: "Toma un descanso de 10 minutos para hacer algo que disfrutes.", kaingang: "Teko s\xE3 kanjuk.", tupi: "Teko s\xE3 kanjuk." },
      { pt: "Escreva 3 coisas pelas quais voc\xEA \xE9 grato hoje.", en: "Write 3 things you are grateful for today.", es: "Escribe 3 cosas por las que est\xE1s agradecido hoy.", kaingang: "Kanjuk 3.", tupi: "Kanjuk 3." },
      { pt: "Limitar o tempo nas redes sociais pode melhorar seu bem-estar.", en: "Limiting social media time can improve your well-being.", es: "Limitar el tiempo en redes sociales puede mejorar tu bienestar.", kaingang: "Huk\xE3 kyry.", tupi: "Huk\xE3 kyry." },
      { pt: "Dormir bem \xE9 essencial para a sa\xFAde mental. Tente dormir 8 horas.", en: "Good sleep is essential for mental health. Try to sleep 8 hours.", es: "Dormir bien es esencial para la salud mental. Intenta dormir 8 horas.", kaingang: "K\u0169\xED teko s\xE3.", tupi: "Ker teko s\xE3." },
      { pt: "Exercitar-se por 30 minutos libera endorfinas que melhoram o humor.", en: "Exercising for 30 minutes releases endorphins that improve mood.", es: "Ejercitarse 30 minutos libera endorfinas que mejoran el humor.", kaingang: "Teko s\xE3 huk\xE3.", tupi: "Teko s\xE3 huk\xE3." }
    ];
    const dailyTip = dailyTips[dayOfYear % dailyTips.length];
    const dashboardItems = [
      { view: "chatbot", icon: "\u{1F916}", title: t2("nav.chatbot"), desc: t2("landing.feature1Desc"), bg: "mc-bg-obsidian", accent: "var(--mc-ender-purple)" },
      { view: "quiz", icon: "\u{1F4DD}", title: t2("nav.quiz"), desc: t2("landing.feature2Desc"), bg: "mc-bg-stone", accent: "var(--mc-diamond-blue)" },
      { view: "friends", icon: "\u{1F465}", title: t2("nav.friends"), desc: t2("landing.feature3Desc"), bg: "mc-bg-wood", accent: "var(--mc-gold)" },
      { view: "vent", icon: "\u{1F4AC}", title: t2("nav.vent"), desc: t2("landing.feature5Desc"), bg: "mc-bg-netherrack", accent: "var(--mc-redstone-red)" },
      { view: "journal", icon: "\u{1F4D3}", title: t2("nav.journal"), desc: t2("dashboard.journalDesc"), bg: "mc-bg-wood", accent: "#C0C0C0" },
      { view: "mood", icon: "\u{1F60A}", title: t2("mood.title"), desc: t2("mood.dashboardDesc"), bg: "mc-bg-water", accent: "var(--mc-emerald-green)" },
      { view: "pomodoro", icon: "\u{1F345}", title: t2("nav.pomodoro"), desc: t2("pomodoro.focusTip"), bg: "mc-bg-netherrack", accent: "#FF6B35" },
      { view: "challenges", icon: "\u2694\uFE0F", title: t2("nav.challenges"), desc: t2("challenges.subtitle"), bg: "mc-bg-stone", accent: "#C084FC" },
      { view: "selfcare", icon: "\u{1F49A}", title: t2("nav.selfcare"), desc: t2("selfcare.subtitle"), bg: "mc-bg-grass", accent: "#3AA93B" },
      { view: "breathing", icon: "\u{1FAC1}", title: t2("nav.breathing"), desc: t2("breathing.tip1"), bg: "mc-bg-water", accent: "#00E5FF", isNew: true },
      { view: "gratitude", icon: "\u{1F64F}", title: t2("nav.gratitude"), desc: t2("gratitude.prompt"), bg: "mc-bg-sand", accent: "var(--mc-gold)", isNew: true },
      { view: "affirmations", icon: "\u2728", title: t2("nav.affirmations"), desc: (t2("affirm.a1") || "").slice(0, 60) + "...", bg: "mc-bg-ender", accent: "#8B32A8", isNew: true },
      { view: "achievements", icon: "\u{1F3C6}", title: t2("nav.achievements"), desc: t2("achievements.subtitle"), bg: "mc-bg-sand", accent: "#FF8C00" },
      { view: "resources", icon: "\u{1F4DA}", title: t2("nav.resources"), desc: t2("resources.subtitle"), bg: "mc-bg-stone", accent: "#00E5FF" },
      { view: "minigame", icon: "\u{1F3AE}", title: t2("nav.minigame"), desc: t2("landing.feature4Desc"), bg: "mc-bg-water", accent: "var(--mc-water-blue)" },
      { view: "accessibility", icon: "\u267F", title: t2("nav.accessibility"), desc: t2("landing.feature6Desc"), bg: "mc-bg-sand", accent: "#A0722A" },
      { view: "coping", icon: "\u{1F9F0}", title: t2("nav.coping"), desc: t2("dashboard.copingDesc"), bg: "mc-bg-obsidian", accent: "#00E5FF", isNew: true },
      { view: "safetyPlan", icon: "\u{1F6E1}\uFE0F", title: t2("nav.safetyPlan"), desc: t2("dashboard.safetyPlanDesc"), bg: "mc-bg-stone", accent: "#FF8C00", isNew: true },
      { view: "leaderboard", icon: "\u{1F3C5}", title: t2("nav.leaderboard"), desc: t2("dashboard.leaderboardDesc"), bg: "mc-bg-netherrack", accent: "var(--mc-gold)", isNew: true },
      { view: "moodInsights", icon: "\u{1F4CA}", title: t2("nav.moodInsights"), desc: t2("dashboard.moodInsightsDesc"), bg: "mc-bg-ender", accent: "#C084FC", isNew: true }
    ];
    const dashboardGrid = dashboardItems.map((item) => `
    <button data-view="${item.view}" class="${item.bg} mc-border" style="text-align:left;cursor:pointer;padding:24px;transition:all 0.15s">
      <div style="font-size:2.5rem;margin-bottom:12px;position:relative">${item.icon}${item.isNew ? '<span class="mc-badge-new" style="position:absolute;top:-8px;right:-8px">NEW</span>' : ""}</div>
      <h3 style="font-family:var(--mc-font);font-size:var(--mc-font-size-lg);color:${item.accent};text-shadow:2px 2px 0 #000;margin:0">
        ${item.title}
      </h3>
      <p style="margin-top:8px;font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);line-height:1.6">
        ${item.desc}
      </p>
      <div style="margin-top:12px;font-size:var(--mc-font-size-sm);color:var(--mc-emerald-green);font-family:var(--mc-font)">
        ${t2("landing.cta3")} \u2192
      </div>
    </button>
  `).join("");
    const tipText = dailyTip[locale] || dailyTip.pt;
    return `
    <div style="max-width:72rem;margin:0 auto;padding:32px 16px">
      <!-- Welcome banner -->
      <div class="mc-panel mc-panel-welcome animate-pixel-slide-up" style="margin-bottom:24px">
        <div class="mc-panel-header" style="display:flex;align-items:center;gap:12px">
          <span style="font-size:1.5rem" class="animate-heart-beat">\u2764\uFE0F</span>
          <span>${t2("common.welcome")}, ${user ? user.username : ""}!</span>
          ${user && user.minecraftName ? `<span style="color:var(--mc-gold)">(${user.minecraftName})</span>` : ""}
        </div>
        <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);line-height:1.8">
          ${t2("landing.description")}
        </p>
        <div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:12px">
          <a href="tel:180" class="mc-btn mc-btn-danger" style="padding:4px 16px;font-size:var(--mc-font-size-sm)">\u{1F4DE} 180 - ${t2("emergency.call180")}</a>
          <a href="tel:192" class="mc-btn mc-btn-danger" style="padding:4px 16px;font-size:var(--mc-font-size-sm)">\u{1F4DE} 192 - ${t2("emergency.call192")}</a>
          <a href="tel:188" class="mc-btn mc-btn-danger" style="padding:4px 16px;font-size:var(--mc-font-size-sm)">\u{1F4DE} 188 - CVV</a>
          <a href="tel:190" class="mc-btn mc-btn-danger" style="padding:4px 16px;font-size:var(--mc-font-size-sm)">\u{1F4DE} 190 - ${t2("emergency.call190")}</a>
        </div>
      </div>

      <!-- Daily Tip + Mood Streak + Achievements Row -->
      <div style="display:grid;grid-template-columns:1fr;gap:16px;margin-bottom:24px" class="md:grid-cols-3">
        <!-- Daily Tip -->
        <div class="mc-daily-tip animate-pixel-fade-in">
          <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-emerald-green);text-shadow:1px 1px 0 #000;margin-bottom:8px">
            \u{1F4A1} ${t2("dashboard.dailyTip")}
          </h4>
          <p style="font-family:var(--mc-font);font-size:0.7rem;color:var(--mc-light-gray);line-height:1.7;padding-right:32px">
            ${tipText}
          </p>
        </div>

        <!-- Mood Streak -->
        <div class="mc-panel animate-pixel-fade-in" style="padding:16px;animation-delay:0.1s">
          <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-gold);text-shadow:1px 1px 0 #000;margin-bottom:8px">
            \u{1F4CA} ${t2("dashboard.moodStreak")}
          </h4>
          <div style="display:flex;align-items:center;gap:12px">
            <span id="mc-mood-streak-val" style="font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-light-gray);text-shadow:2px 2px 0 #000">0</span>
            <div>
              <div id="mc-mood-streak-label" style="font-family:var(--mc-font);font-size:0.7rem;color:var(--mc-light-gray)">
                ${t2("mood.noData")}
              </div>
              <div class="mc-xp-bar" style="margin-top:8px;width:120px">
                <div id="mc-mood-streak-bar" class="mc-xp-bar-fill" style="width:0%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Achievement Showcase -->
        <div class="mc-panel animate-pixel-fade-in" style="padding:16px;animation-delay:0.2s">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:#FF8C00;text-shadow:1px 1px 0 #000">
              \u{1F3C6} ${t2("dashboard.achievementShowcase")}
            </h4>
            <button id="mc-view-all-achievements" style="font-size:0.6rem;color:var(--mc-diamond-blue);text-decoration:underline;cursor:pointer;font-family:var(--mc-font);background:none;border:none;padding:0">
              ${t2("dashboard.viewAll")} \u2192
            </button>
          </div>
          <div id="mc-achievement-icons" style="display:flex;gap:8px">
            <p style="font-family:var(--mc-font);font-size:0.65rem;color:var(--mc-stone-gray);margin:0">
              ${t2("dashboard.noAchievements")}
            </p>
          </div>
        </div>
      </div>

      <!-- Section transition -->
      <div class="mc-section-transition" style="margin-bottom:24px"></div>

      <!-- Dashboard grid -->
      <div style="display:grid;grid-template-columns:1fr;gap:24px" class="sm:grid-cols-2 lg:grid-cols-3">
        ${dashboardGrid}
      </div>
    </div>
  `;
  }
  function initDashboard(t2) {
    const token = get("token");
    document.querySelectorAll("[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        playClick();
        setView(btn.dataset.view);
      });
    });
    const viewAllBtn = document.getElementById("mc-view-all-achievements");
    if (viewAllBtn) {
      viewAllBtn.addEventListener("click", () => {
        playClick();
        setView("achievements");
      });
    }
    if (!token) return;
    fetch("/api/achievements", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then((data) => {
      const achievements = (data.achievements || []).slice(0, 3);
      const container = document.getElementById("mc-achievement-icons");
      if (!container) return;
      if (achievements.length > 0) {
        container.innerHTML = achievements.map((a) => `
          <div class="mc-achievement-icon" style="width:36px;height:36px;font-size:1.1rem" title="${a.title}">
            ${a.icon}
          </div>
        `).join("");
      }
    }).catch(() => {
    });
    fetch("/api/mood?days=30", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then((data) => {
      const entries = data || [];
      const streakVal = document.getElementById("mc-mood-streak-val");
      const streakLabel = document.getElementById("mc-mood-streak-label");
      const streakBar = document.getElementById("mc-mood-streak-bar");
      if (!streakVal || !streakLabel || !streakBar) return;
      if (entries.length === 0) {
        streakVal.textContent = "0";
        streakLabel.textContent = t2("mood.noData");
        streakBar.style.width = "0%";
        return;
      }
      let streak = 1;
      const sorted = [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      for (let i = 0; i < sorted.length - 1; i++) {
        const curr = new Date(sorted[i].createdAt);
        const prev = new Date(sorted[i + 1].createdAt);
        const diffDays = Math.floor((curr.getTime() - prev.getTime()) / 864e5);
        if (diffDays <= 1) streak++;
        else break;
      }
      const streakColor = streak >= 7 ? "var(--mc-gold)" : streak >= 3 ? "var(--mc-emerald-green)" : "var(--mc-light-gray)";
      streakVal.style.color = streakColor;
      streakVal.textContent = streak;
      streakLabel.textContent = `${streak} ${t2("dashboard.days") || "dias"} \u{1F525}`;
      streakBar.style.width = `${Math.min(streak / 7 * 100, 100)}%`;
    }).catch(() => {
    });
  }
  function cleanupDashboard() {
    _dashboardTimers.forEach((timer) => {
      if (timer) clearTimeout(timer);
    });
    _dashboardTimers.length = 0;
  }

  // public/js/views-tools.js
  var _chatbot = {
    _timers: [],
    _loading: false,
    render(t2) {
      const msgs = get("chatMessages");
      const hasUserMsgs = msgs.filter((m) => m.role === "user").length > 0;
      let suggestionsHtml = "";
      if (!hasUserMsgs) {
        const sugs = [t2("chatbot.sug1"), t2("chatbot.sug2"), t2("chatbot.sug3"), t2("chatbot.sug4"), t2("chatbot.sug5"), t2("chatbot.sug6")];
        suggestionsHtml = `
        <div class="px-4 pt-3">
          <p style="margin-bottom:8px;font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-stone-gray)">${t2("chatbot.suggestions")}</p>
          <div class="flex gap-2 overflow-x-auto pb-2" style="scrollbar-width:thin">
            ${sugs.map((s, i) => `<button data-chatbot-sug="${i}" class="mc-btn mc-btn-stone whitespace-nowrap" style="font-size:var(--mc-font-size-sm)">${s}</button>`).join("")}
          </div>
        </div>`;
      }
      const messagesHtml = msgs.map((msg) => {
        const isUser = msg.role === "user";
        const bubbleClass = isUser ? "mc-chat-bubble-sent" : "mc-chat-bubble-received";
        const label = isUser ? `<span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-emerald-green)">\u{1F9D1}\u200D\u{1F33E} ${t2("chatbot.you")}</span>` : `<span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-diamond-blue)">\u{1F916} MineBot</span>`;
        const content = isUser ? `<p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);line-height:1.8">${msg.content}</p>` : renderMarkdown(msg.content);
        return `<div class="mc-chat-bubble ${bubbleClass}"><div class="flex items-center gap-2 mb-1">${label}</div><div>${content}</div></div>`;
      }).join("");
      const typingHtml = this._loading ? `<div class="mc-chat-bubble mc-chat-bubble-received"><div class="flex items-center gap-2"><span class="animate-pixel-bounce">\u26CF\uFE0F</span><span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">${t2("chatbot.typing")}</span></div></div>` : "";
      return `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up mc-glow-blue mc-nether-bg" style="height:calc(100vh - 200px);display:flex;flex-direction:column">
          <div class="mc-nether-particles">
            ${Array.from({ length: 12 }, (_, i) => `<div class="mc-nether-particle" style="left:${(i * 37 + 13) % 100}%;animation-delay:${i * 1.3 % 5}s;animation-duration:${3 + i * 0.7 % 4}s"></div>`).join("")}
          </div>
          <div class="mc-panel-header flex items-center justify-between">
            <span>\u{1F916} ${t2("chatbot.title")}</span>
            <button data-chatbot-speak class="mc-btn mc-btn-diamond py-0.5 px-2" style="font-size:var(--mc-font-size-sm)">\u{1F50A}</button>
          </div>
          ${suggestionsHtml}
          <div id="chatbot-messages" class="flex-1 overflow-y-auto p-4 space-y-3" style="background:#0A0A0A">
            ${messagesHtml}
            ${typingHtml}
          </div>
          <div class="p-3" style="border-top:3px solid #000;background:var(--mc-bg-dark)">
            <div class="flex gap-2">
              <input id="chatbot-input" type="text" class="mc-input flex-1" placeholder="${t2("chatbot.placeholder")}" ${this._loading ? "disabled" : ""} aria-label="${t2("chatbot.placeholder")}" />
              <button id="chatbot-send" class="mc-btn mc-btn-primary" ${this._loading ? "disabled" : ""}>${this._loading ? "\u26CF\uFE0F" : "\u27A1\uFE0F"}</button>
            </div>
          </div>
        </div>
      </div>`;
    },
    init(t2) {
      const msgs = get("chatMessages");
      if (msgs.length === 0) {
        addChatMessage({ id: "1", role: "assistant", content: "\u{1F916} " + t2("chatbot.welcome") });
      }
      const scrollContainer = () => {
        const el = document.getElementById("chatbot-messages");
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      };
      setTimeout(scrollContainer, 50);
      const sendMessage = async (overrideText) => {
        if (this._loading) return;
        const input = document.getElementById("chatbot-input");
        const textToSend = overrideText || (input ? input.value : "");
        if (!textToSend.trim()) return;
        const userMsg = { id: Date.now().toString(), role: "user", content: textToSend.trim() };
        addChatMessage(userMsg);
        if (input) input.value = "";
        this._loading = true;
        playClick();
        this._refreshMessages(t2);
        try {
          const history = get("chatMessages").filter((m) => m.id !== "1").map((m) => ({ role: m.role, content: m.content }));
          const res = await fetch("/api/chatbot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userMsg.content, history })
          });
          const data = await res.json();
          addChatMessage({
            id: Date.now().toString() + "r",
            role: "assistant",
            content: data.reply || t2("chatbot.processError")
          });
        } catch {
          addChatMessage({
            id: Date.now().toString() + "e",
            role: "assistant",
            content: t2("chatbot.connectionError")
          });
        } finally {
          this._loading = false;
          this._refreshMessages(t2);
          setTimeout(scrollContainer, 50);
        }
      };
      const sendBtn = document.getElementById("chatbot-send");
      if (sendBtn) sendBtn.addEventListener("click", () => sendMessage());
      const inputEl = document.getElementById("chatbot-input");
      if (inputEl) {
        inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter") sendMessage();
        });
        inputEl.focus();
      }
      document.querySelectorAll("[data-chatbot-sug]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const sugs = [t2("chatbot.sug1"), t2("chatbot.sug2"), t2("chatbot.sug3"), t2("chatbot.sug4"), t2("chatbot.sug5"), t2("chatbot.sug6")];
          const idx = parseInt(btn.getAttribute("data-chatbot-sug"), 10);
          if (!isNaN(idx) && sugs[idx]) sendMessage(sugs[idx]);
        });
      });
      const speakBtn = document.querySelector("[data-chatbot-speak]");
      if (speakBtn) {
        speakBtn.addEventListener("click", () => {
          const msgs2 = get("chatMessages");
          const last = msgs2[msgs2.length - 1];
          if (last && last.role === "assistant") {
            const u = new SpeechSynthesisUtterance(last.content);
            u.lang = "pt-BR";
            speechSynthesis.cancel();
            speechSynthesis.speak(u);
          }
        });
      }
    },
    _refreshMessages(t2) {
      const container = document.getElementById("chatbot-messages");
      const sendBtn = document.getElementById("chatbot-send");
      if (!container) return;
      const msgs = get("chatMessages");
      const messagesHtml = msgs.map((msg) => {
        const isUser = msg.role === "user";
        const bubbleClass = isUser ? "mc-chat-bubble-sent" : "mc-chat-bubble-received";
        const label = isUser ? `<span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-emerald-green)">\u{1F9D1}\u200D\u{1F33E} ${t2("chatbot.you")}</span>` : `<span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-diamond-blue)">\u{1F916} MineBot</span>`;
        const content = isUser ? `<p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);line-height:1.8">${msg.content}</p>` : renderMarkdown(msg.content);
        return `<div class="mc-chat-bubble ${bubbleClass}"><div class="flex items-center gap-2 mb-1">${label}</div><div>${content}</div></div>`;
      }).join("");
      const typingHtml = this._loading ? `<div class="mc-chat-bubble mc-chat-bubble-received"><div class="flex items-center gap-2"><span class="animate-pixel-bounce">\u26CF\uFE0F</span><span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">${t2("chatbot.typing")}</span></div></div>` : "";
      container.innerHTML = messagesHtml + typingHtml;
      if (sendBtn) sendBtn.innerHTML = this._loading ? "\u26CF\uFE0F" : "\u27A1\uFE0F";
      const inputEl = document.getElementById("chatbot-input");
      if (inputEl) inputEl.disabled = this._loading;
      setTimeout(() => container.scrollTo({ top: container.scrollHeight, behavior: "smooth" }), 50);
    },
    cleanup() {
      this._timers.forEach(clearTimeout);
      this._timers = [];
      this._loading = false;
    }
  };
  var chatbotView = _chatbot;
  var _quiz = {
    _timers: [],
    _currentQ: 0,
    _answers: null,
    _finished: false,
    _result: null,
    _loading: false,
    render(t2) {
      if (this._finished && this._result) {
        return this._renderResult(t2);
      }
      return this._renderQuiz(t2);
    },
    _renderQuiz(t2) {
      const questions = this._getQuestions(t2);
      const q = questions[this._currentQ];
      const progress = (this._currentQ + 1) / 20 * 100;
      const allAnswered = !this._answers.includes(null);
      const optionsHtml = q.opts.map((opt, i) => {
        const selected = this._answers[this._currentQ] === i;
        const bg = selected ? "background:#2E5E1E;border-color:var(--mc-emerald-green)" : "background:#1E1E1E;border-color:#3F3F3F";
        const letterBg = selected ? "background:var(--mc-emerald-green);color:#000" : "background:#3F3F3F;color:#fff";
        const letter = String.fromCharCode(65 + i);
        return `
        <button data-quiz-opt="${i}" class="w-full text-left p-3 mc-border-2 transition-all cursor-pointer" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);${bg};border-width:2px;border-style:solid">
          <span class="mr-2 inline-block text-center leading-6" style="width:24px;height:24px;border:2px solid #000;font-size:12px;${letterBg}">${letter}</span>
          ${opt}
        </button>`;
      }).join("");
      const nextBtn = this._currentQ === 19 ? `<button id="quiz-submit" class="mc-btn mc-btn-gold" style="font-size:var(--mc-font-size-sm)" ${this._loading || !allAnswered ? "disabled" : ""}>${this._loading ? "\u23F3 ..." : "\u{1F3C1} " + t2("quiz.finish")}</button>` : `<button id="quiz-next" class="mc-btn mc-btn-primary" style="font-size:var(--mc-font-size-sm)" ${this._answers[this._currentQ] === null ? "disabled" : ""}>${t2("quiz.next")} \u2192</button>`;
      return `
      <div class="max-w-2xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up mc-glow-gold">
          <div class="mc-panel-header flex items-center justify-between">
            <span>\u{1F4DD} ${t2("quiz.title")}</span>
            <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-gold)">${this._currentQ + 1}/20</span>
          </div>
          <div class="mc-xp-bar mb-6"><div class="mc-xp-bar-fill" style="width:${progress}%"></div></div>
          <h3 style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-diamond-blue);line-height:1.8;margin-bottom:16px">${q.q}</h3>
          <div class="space-y-3">${optionsHtml}</div>
          <div class="flex justify-between mt-6">
            <button id="quiz-prev" class="mc-btn mc-btn-stone" style="font-size:var(--mc-font-size-sm)" ${this._currentQ === 0 ? "disabled" : ""}>\u2190 ${t2("quiz.previous")}</button>
            ${nextBtn}
          </div>
        </div>
      </div>`;
    },
    _renderResult(t2) {
      const r = this._result;
      const emoji = r.percentage >= 80 ? "\u{1F3C6}" : r.percentage >= 60 ? "\u2B50" : r.percentage >= 40 ? "\u{1F4DA}" : "\u{1F4AA}";
      const color = r.percentage >= 80 ? "var(--mc-gold)" : r.percentage >= 60 ? "var(--mc-emerald-green)" : r.percentage >= 40 ? "var(--mc-diamond-blue)" : "var(--mc-redstone-red)";
      return `
      <div class="max-w-2xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-fade-in text-center">
          <div class="mc-panel-header">\u{1F4DD} ${t2("quiz.result")}</div>
          <div class="text-6xl my-6 animate-pixel-bounce">${emoji}</div>
          <div class="mc-xp-bar mb-4" style="max-width:300px;margin:0 auto 16px"><div class="mc-xp-bar-fill" style="width:${r.percentage}%"></div></div>
          <h2 style="font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:${color};text-shadow:2px 2px 0 #000">${r.score}/${r.total}</h2>
          <p class="mt-2" style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-light-gray)">${r.percentage}% ${t2("quiz.score")}</p>
          <button id="quiz-reset" class="mc-btn mc-btn-primary mt-6">\u{1F504} ${t2("quiz.restart")}</button>
        </div>
      </div>`;
    },
    _getQuestions(t2) {
      return Array.from({ length: 20 }, (_, i) => ({
        q: t2(`quiz.q${i + 1}`),
        opts: [t2(`quiz.q${i + 1}o1`), t2(`quiz.q${i + 1}o2`), t2(`quiz.q${i + 1}o3`), t2(`quiz.q${i + 1}o4`)]
      }));
    },
    init(t2) {
      if (!this._answers) {
        this._answers = Array(20).fill(null);
      }
      const rebind = () => {
        document.querySelectorAll("[data-quiz-opt]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.getAttribute("data-quiz-opt"), 10);
            this._answers[this._currentQ] = idx;
            playClick();
            this._rerender(t2);
          });
        });
        const prevBtn = document.getElementById("quiz-prev");
        if (prevBtn) prevBtn.addEventListener("click", () => {
          this._currentQ = Math.max(0, this._currentQ - 1);
          playClick();
          this._rerender(t2);
        });
        const nextBtn = document.getElementById("quiz-next");
        if (nextBtn) nextBtn.addEventListener("click", () => {
          this._currentQ++;
          playClick();
          this._rerender(t2);
        });
        const submitBtn = document.getElementById("quiz-submit");
        if (submitBtn) submitBtn.addEventListener("click", () => this._submitQuiz(t2));
        const resetBtn = document.getElementById("quiz-reset");
        if (resetBtn) resetBtn.addEventListener("click", () => {
          this._currentQ = 0;
          this._answers = Array(20).fill(null);
          this._finished = false;
          this._result = null;
          playClick();
          this._rerender(t2);
        });
      };
      rebind();
      this._rebind = rebind;
    },
    async _submitQuiz(t2) {
      this._loading = true;
      this._rerender(t2);
      try {
        const token = get("token");
        const answers = this._answers.filter((a) => a !== null);
        const res = await fetch("/api/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ answers })
        });
        const data = await res.json();
        this._result = data;
        this._finished = true;
        setQuizResult(data.score, data.total);
        playSuccess();
      } catch {
        showToast(t2("quiz.submitError"), "error");
        playError();
      } finally {
        this._loading = false;
        this._rerender(t2);
      }
    },
    _rerender(t2) {
      const main = document.querySelector("main");
      if (!main) return;
      const viewContainer = main.querySelector(":scope > div");
      if (viewContainer) {
        viewContainer.innerHTML = this.render(t2);
        if (this._rebind) this._rebind();
      }
    },
    cleanup() {
      this._timers.forEach(clearTimeout);
      this._timers = [];
      this._rebind = null;
    }
  };
  var quizView = _quiz;
  var _friends = {
    _timers: [],
    _friends: [],
    _requests: [],
    _activeChat: null,
    // { id, username }
    _chatMessages: [],
    _loading: false,
    _rebind: null,
    render(t2) {
      const user = get("user");
      if (!user) return "";
      const friendsHtml = this._friends.length === 0 ? `<p class="text-center py-4" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-stone-gray)">${t2("friends.noFriends")}</p>` : this._friends.map((f) => {
        const isActive = this._activeChat && this._activeChat.id === f.id;
        const bg = isActive ? "background:#2E5E1E;border-color:var(--mc-emerald-green)" : "background:var(--mc-bg)";
        const nameColor = f.isOnline ? "var(--mc-emerald-green)" : "var(--mc-light-gray)";
        const dotClass = f.isOnline ? "bg-[#4CAF50] animate-pixel-pulse" : "bg-[var(--mc-stone-gray)]";
        const mcName = f.minecraftName ? `<div style="font-family:var(--mc-font);font-size:0.6rem;color:var(--mc-gold)">\u26CF\uFE0F ${f.minecraftName}</div>` : "";
        return `
          <button data-friend-id="${f.id}" class="w-full flex items-center gap-3 p-3 mc-border-2 transition-all cursor-pointer text-left" style="${bg};border-width:2px;border-style:solid">
            <div class="w-3 h-3 rounded-full ${dotClass}" style="flex-shrink:0"></div>
            <div>
              <div style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:${nameColor}">${f.username}</div>
              ${mcName}
            </div>
          </button>`;
      }).join("");
      let requestsHtml = "";
      if (this._requests.length > 0) {
        const reqItems = this._requests.map(
          (req) => `
        <div class="flex items-center justify-between p-2 mc-border-2" style="background:var(--mc-bg);border-width:2px;border-style:solid">
          <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm)">${req.fromUser.username}</span>
          <div class="flex gap-2">
            <button data-req-accept="${req.id}" class="mc-btn mc-btn-primary py-0.5 px-2" style="font-size:var(--mc-font-size-sm)">\u2713</button>
            <button data-req-reject="${req.id}" class="mc-btn mc-btn-danger py-0.5 px-2" style="font-size:var(--mc-font-size-sm)">\u2715</button>
          </div>
        </div>`
        ).join("");
        requestsHtml = `
        <div class="mc-panel animate-pixel-fade-in">
          <div class="mc-panel-header">\u{1F4E8} ${t2("friends.pending")}</div>
          <div class="space-y-2 max-h-48 overflow-y-auto">${reqItems}</div>
        </div>`;
      }
      let chatHtml;
      if (this._activeChat) {
        const chatMsgsHtml = this._chatMessages.map((msg) => {
          const isMine = msg.senderId === user.id;
          const cls = isMine ? "mc-chat-bubble-sent" : "mc-chat-bubble-received";
          return `<div class="mc-chat-bubble ${cls}"><p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);line-height:1.6">${msg.content}</p></div>`;
        }).join("");
        chatHtml = `
        <div class="mc-panel-header flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-[#4CAF50]" style="flex-shrink:0"></span>
          <span>${this._activeChat.username}</span>
        </div>
        <div id="friends-chat-messages" class="flex-1 overflow-y-auto p-3 space-y-2" style="background:#0A0A0A">${chatMsgsHtml}</div>
        <div class="p-3 flex gap-2" style="border-top:3px solid #000;background:var(--mc-bg-dark)">
          <input id="friends-chat-input" class="mc-input flex-1" placeholder="${t2("friends.message")}" />
          <button id="friends-chat-send" class="mc-btn mc-btn-primary">\u27A1\uFE0F</button>
        </div>`;
      } else {
        chatHtml = `
        <div class="flex-1 flex items-center justify-center" style="background:#0A0A0A">
          <p class="text-center" style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-stone-gray)">
            \u{1F465} ${t2("friends.search")}<br />\u{1F4AC}
          </p>
        </div>`;
      }
      return `
      <div class="max-w-5xl mx-auto px-4 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-6">
            <div class="mc-panel animate-pixel-slide-up">
              <div class="mc-panel-header">\u{1F50D} ${t2("friends.title")}</div>
              <div class="space-y-3">
                <input id="friends-search" class="mc-input" placeholder="${t2("friends.search")}" />
                <input id="friends-msg" class="mc-input" placeholder="${t2("friends.requestMsg")}" />
                <button id="friends-send-req" class="mc-btn mc-btn-primary w-full" style="font-size:var(--mc-font-size-sm)" ${this._loading ? "disabled" : ""}>
                  ${this._loading ? "\u23F3 ..." : "\u{1F4E8} " + t2("friends.sendRequest")}
                </button>
              </div>
            </div>
            ${requestsHtml}
            <div class="mc-panel animate-pixel-fade-in">
              <div class="mc-panel-header">\u{1F465} ${t2("friends.title")}</div>
              <div class="space-y-2 max-h-96 overflow-y-auto">${friendsHtml}</div>
            </div>
          </div>
          <div class="mc-panel animate-pixel-slide-up" style="height:600px;display:flex;flex-direction:column">
            ${chatHtml}
          </div>
        </div>
      </div>`;
    },
    init(t2) {
      this._loadData(t2);
      const rebind = () => {
        const sendReqBtn = document.getElementById("friends-send-req");
        if (sendReqBtn) sendReqBtn.addEventListener("click", () => this._sendRequest(t2));
        document.querySelectorAll("[data-req-accept]").forEach((btn) => {
          btn.addEventListener("click", () => this._handleRequest(btn.getAttribute("data-req-accept"), "accept", t2));
        });
        document.querySelectorAll("[data-req-reject]").forEach((btn) => {
          btn.addEventListener("click", () => this._handleRequest(btn.getAttribute("data-req-reject"), "reject", t2));
        });
        document.querySelectorAll("[data-friend-id]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-friend-id");
            const friend = this._friends.find((f) => f.id === id);
            if (friend) this._openChat(friend, t2);
          });
        });
        const chatSendBtn = document.getElementById("friends-chat-send");
        if (chatSendBtn) chatSendBtn.addEventListener("click", () => this._sendChat(t2));
        const chatInput = document.getElementById("friends-chat-input");
        if (chatInput) chatInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") this._sendChat(t2);
        });
      };
      rebind();
      this._rebind = rebind;
    },
    async _loadData(t2) {
      try {
        const token = get("token");
        const res = await fetch("/api/friends", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        this._friends = data.friends || [];
        this._requests = data.requests || [];
        setFriends(this._friends);
        setFriendRequests(this._requests);
        const pending = this._requests.filter((r) => r.status === "pending");
        const existingNotifs = (get("notifications") || []).filter((n) => n.type === "friend_request" && !n.read);
        if (pending.length > 0 && existingNotifs.length === 0) {
          addNotification({
            type: "friend_request",
            title: t2("nav.friends"),
            message: `${pending[0].fromUser.username} ${t2("notifications.friendRequest")}`
          });
        }
        this._rerender(t2);
      } catch {
      }
    },
    async _sendRequest(t2) {
      const searchEl = document.getElementById("friends-search");
      const msgEl = document.getElementById("friends-msg");
      const username = searchEl ? searchEl.value.trim() : "";
      if (!username) return;
      this._loading = true;
      this._rerender(t2);
      try {
        const token = get("token");
        const res = await fetch("/api/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ toUsername: username, message: msgEl ? msgEl.value.trim() || void 0 : void 0 })
        });
        const data = await res.json();
        if (res.ok) {
          showToast(t2("friends.requestSent"), "success");
          playSuccess();
          if (searchEl) searchEl.value = "";
          if (msgEl) msgEl.value = "";
        } else {
          showToast(data.error, "error");
          playError();
        }
      } catch {
        showToast(t2("errors.connectionError"), "error");
      } finally {
        this._loading = false;
        this._rerender(t2);
      }
    },
    async _handleRequest(requestId, action, t2) {
      try {
        const token = get("token");
        const res = await fetch("/api/friends", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ requestId, action })
        });
        if (res.ok) {
          showToast(action === "accept" ? t2("friends.requestAccepted") : t2("friends.requestRejected"), "success");
          playSuccess();
          this._loadData(t2);
        }
      } catch {
      }
    },
    _openChat(friend, t2) {
      this._activeChat = { id: friend.id, username: friend.username };
      playClick();
      this._loadChat(friend.id, t2);
      this._rerender(t2);
    },
    async _loadChat(friendId, t2) {
      try {
        const token = get("token");
        const res = await fetch(`/api/chat?friendId=${friendId}`, { headers: { Authorization: `Bearer ${token}` } });
        this._chatMessages = await res.json();
        this._rerender(t2);
        setTimeout(() => {
          const el = document.getElementById("friends-chat-messages");
          if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        }, 50);
      } catch {
      }
    },
    async _sendChat(t2) {
      const input = document.getElementById("friends-chat-input");
      if (!input || !input.value.trim() || !this._activeChat) return;
      try {
        const token = get("token");
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ receiverId: this._activeChat.id, content: input.value.trim() })
        });
        if (res.ok) {
          input.value = "";
          playClick();
          this._loadChat(this._activeChat.id, t2);
        }
      } catch {
      }
    },
    _rerender(t2) {
      const main = document.querySelector("main");
      if (!main) return;
      const viewContainer = main.querySelector(":scope > div");
      if (viewContainer) {
        viewContainer.innerHTML = this.render(t2);
        if (this._rebind) this._rebind();
      }
    },
    cleanup() {
      this._timers.forEach(clearTimeout);
      this._timers.forEach(clearInterval);
      this._timers = [];
      this._rebind = null;
    }
  };
  var friendsView = _friends;
  var _vent = {
    _timers: [],
    _messages: [],
    _content: "",
    _anonymous: false,
    _loading: false,
    _reportModal: null,
    _reportReason: "",
    _rebind: null,
    render(t2) {
      const user = get("user");
      if (!user) return "";
      const messagesHtml = this._messages.map((msg) => {
        const isModerated = msg.isModerated;
        const moderatedOverlay = isModerated ? `<div class="absolute inset-0 flex items-center justify-center bg-black/50 z-10"><span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-redstone-red)">${t2("vent.moderated")}</span></div>` : "";
        const reportedClass = msg.isReported ? "opacity-100 text-[var(--mc-redstone-red)]" : "text-[var(--mc-light-gray)]";
        const reportBtn = `
        <button data-vent-report="${msg.id}" class="transition-opacity cursor-pointer ${reportedClass}" style="font-size:var(--mc-font-size-sm);opacity:${msg.isReported ? 1 : 0}" onmouseenter="this.style.opacity=1" onmouseleave="this.style.opacity=${msg.isReported ? 1 : 0}">
          ${msg.isReported ? "\u{1F6A9}" : "\u26A0\uFE0F"}
        </button>`;
        return `
        <div class="mc-chat-bubble mc-chat-bubble-received relative group ${isModerated ? "opacity-50" : ""}">
          ${moderatedOverlay}
          <div class="flex items-center justify-between mb-1">
            <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-gold)">
              ${msg.isAnonymous ? "\u{1F3AD} " + t2("vent.anonymous") : msg.username}
            </span>
            ${reportBtn}
          </div>
          <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);line-height:1.8">${msg.content}</p>
        </div>`;
      }).join("");
      const reportModalHtml = this._reportModal ? `
      <div id="vent-report-overlay" class="mc-modal-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:100;display:flex;align-items:center;justify-content:center">
        <div class="mc-modal" style="background:var(--mc-bg-dark);border:4px solid #000;max-width:400px;width:90%" onclick="event.stopPropagation()">
          <div class="mc-modal-header">\u{1F6A9} ${t2("vent.reportTitle")}</div>
          <div class="mc-modal-body p-4">
            <textarea id="vent-report-reason" class="mc-textarea mb-3" placeholder="${t2("vent.reportPlaceholder")}">${this._reportReason}</textarea>
            <div class="flex gap-2">
              <button id="vent-report-submit" class="mc-btn mc-btn-danger flex-1" style="font-size:var(--mc-font-size-sm)">${t2("vent.report")}</button>
              <button id="vent-report-cancel" class="mc-btn mc-btn-stone flex-1" style="font-size:var(--mc-font-size-sm)">${t2("common.cancel")}</button>
            </div>
          </div>
        </div>
      </div>` : "";
      return `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up" style="min-height:600px;display:flex;flex-direction:column">
          <div class="mc-nether-particles">
            ${Array.from({ length: 8 }, (_, i) => `<div class="mc-nether-particle" style="left:${(i * 37 + 13) % 100}%;animation-delay:${i * 1.3 % 5}s;animation-duration:${3 + i * 0.7 % 4}s"></div>`).join("")}
          </div>
          <div class="mc-panel-header flex items-center justify-between">
            <span>\u{1F4AC} ${t2("vent.title")}</span>
            <label class="flex items-center gap-2 cursor-pointer" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm)">
              <input type="checkbox" id="vent-anonymous" ${this._anonymous ? "checked" : ""} style="width:16px;height:16px" />
              \u{1F3AD} ${t2("vent.anonymous")}
            </label>
          </div>
          <div id="vent-messages" class="flex-1 overflow-y-auto p-4 space-y-3" style="background:#0A0A0A">
            ${messagesHtml}
          </div>
          <div class="p-3" style="border-top:3px solid #000;background:var(--mc-bg-dark)">
            <textarea id="vent-input" class="mc-textarea mb-2" style="min-height:60px" placeholder="${t2("vent.placeholder")}" maxlength="1000">${this._content}</textarea>
            <button id="vent-send" class="mc-btn mc-btn-primary w-full" style="font-size:var(--mc-font-size-sm)" ${this._loading ? "disabled" : ""}>
              ${this._loading ? "\u23F3 ..." : "\u{1F4AC} " + t2("vent.send")}
            </button>
          </div>
        </div>
        ${reportModalHtml}
      </div>`;
    },
    init(t2) {
      this._loadMessages(t2);
      const rebind = () => {
        const anonCheck = document.getElementById("vent-anonymous");
        if (anonCheck) anonCheck.addEventListener("change", (e) => {
          this._anonymous = e.target.checked;
        });
        const sendBtn = document.getElementById("vent-send");
        if (sendBtn) sendBtn.addEventListener("click", () => this._sendMessage(t2));
        document.querySelectorAll("[data-vent-report]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const msgId = btn.getAttribute("data-vent-report");
            const msg = this._messages.find((m) => m.id === msgId);
            if (msg && !msg.isReported) {
              this._reportModal = msgId;
              this._reportReason = "";
              this._rerender(t2);
            }
          });
        });
        const overlay = document.getElementById("vent-report-overlay");
        if (overlay) overlay.addEventListener("click", (e) => {
          if (e.target === overlay) this._closeReport(t2);
        });
        const reportSubmitBtn = document.getElementById("vent-report-submit");
        if (reportSubmitBtn) reportSubmitBtn.addEventListener("click", () => this._submitReport(t2));
        const reportCancelBtn = document.getElementById("vent-report-cancel");
        if (reportCancelBtn) reportCancelBtn.addEventListener("click", () => this._closeReport(t2));
      };
      rebind();
      this._rebind = rebind;
    },
    async _loadMessages(t2) {
      try {
        const token = get("token");
        const res = await fetch("/api/vent", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        this._messages = Array.isArray(data.messages) ? data.messages : [];
        setVentMessages(this._messages);
        this._rerender(t2);
      } catch {
      }
    },
    async _sendMessage(t2) {
      const input = document.getElementById("vent-input");
      const content = input ? input.value.trim() : "";
      if (!content) return;
      this._loading = true;
      this._rerender(t2);
      try {
        const token = get("token");
        const res = await fetch("/api/vent", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content, isAnonymous: this._anonymous })
        });
        if (res.ok) {
          this._content = "";
          showToast(t2("common.success"), "success");
          playSuccess();
          this._loadMessages(t2);
        }
      } catch {
        showToast(t2("common.error"), "error");
      } finally {
        this._loading = false;
        this._rerender(t2);
      }
    },
    _closeReport(t2) {
      this._reportModal = null;
      this._reportReason = "";
      this._rerender(t2);
    },
    async _submitReport(t2) {
      const reasonEl = document.getElementById("vent-report-reason");
      const reason = reasonEl ? reasonEl.value.trim() : "";
      if (!reason || !this._reportModal) return;
      try {
        const token = get("token");
        const res = await fetch("/api/vent/report", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messageId: this._reportModal, reason })
        });
        if (res.ok) {
          showToast(t2("vent.reportSent"), "success");
          this._closeReport(t2);
          this._loadMessages(t2);
        }
      } catch {
        showToast(t2("common.error"), "error");
      }
    },
    _rerender(t2) {
      const main = document.querySelector("main");
      if (!main) return;
      const viewContainer = main.querySelector(":scope > div");
      if (viewContainer) {
        viewContainer.innerHTML = this.render(t2);
        if (this._rebind) this._rebind();
        const el = document.getElementById("vent-messages");
        if (el) el.scrollTop = 0;
      }
    },
    cleanup() {
      this._timers.forEach(clearTimeout);
      this._timers.forEach(clearInterval);
      this._timers = [];
      this._rebind = null;
    }
  };
  var ventView = _vent;
  var _journal = {
    _timers: [],
    _content: "",
    _title: "",
    _selectedMood: null,
    _saving: false,
    _entries: [],
    _dailyPrompt: "",
    _rebind: null,
    render(t2) {
      const user = get("user");
      if (!user) return "";
      const moodOptions = [
        { key: "happy", emoji: "\u{1F60A}" },
        { key: "sad", emoji: "\u{1F622}" },
        { key: "anxious", emoji: "\u{1F630}" },
        { key: "angry", emoji: "\u{1F620}" },
        { key: "calm", emoji: "\u{1F60C}" },
        { key: "tired", emoji: "\u{1F634}" }
      ];
      const emojiMap = { happy: "\u{1F60A}", sad: "\u{1F622}", anxious: "\u{1F630}", angry: "\u{1F620}", calm: "\u{1F60C}", tired: "\u{1F634}" };
      const moodTagsHtml = moodOptions.map((m) => {
        const selected = this._selectedMood === m.key;
        return `<button data-journal-mood="${m.key}" class="mc-mood-emoji ${selected ? "mc-mood-selected" : ""}" title="${m.key}"><span class="text-lg">${m.emoji}</span></button>`;
      }).join("");
      const entriesHtml = this._entries.length === 0 ? `<div class="mc-empty-state"><div class="mc-empty-icon">\u{1F4D3}</div><p class="mc-empty-text" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm)">${t2("journal.noEntries")}</p></div>` : this._entries.map((entry) => {
        const date = new Date(entry.createdAt).toLocaleDateString(void 0, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        const moodEmoji = entry.mood ? emojiMap[entry.mood] || "\u2753" : "";
        const titleHtml = entry.title ? `<h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-diamond-blue);text-shadow:1px 1px 0 #000;margin-bottom:4px">${entry.title}</h4>` : "";
        const preview = entry.content.length > 100 ? entry.content.slice(0, 100) + "..." : entry.content;
        return `
          <div class="mc-journal-entry">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="mc-journal-date-badge">${date}</span>
                  ${moodEmoji ? `<span class="text-lg">${moodEmoji}</span>` : ""}
                </div>
                ${titleHtml}
                <p style="font-family:var(--mc-font);font-size:0.7rem;color:var(--mc-light-gray);line-height:1.7">${preview}</p>
              </div>
              <button data-journal-delete="${entry.id}" class="mc-btn mc-btn-danger py-0.5 px-2 flex-shrink-0" style="font-size:0.6rem">${t2("journal.delete")}</button>
            </div>
          </div>`;
      }).join("");
      return `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up">
          <div class="mc-panel-header">\u{1F4D3} ${t2("journal.title")}</div>
          <p class="mb-4" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">${t2("journal.subtitle")}</p>

          <div class="mc-journal-prompt-card mb-6">
            <div class="flex items-start gap-3">
              <span class="text-2xl mc-float-gentle">\u{1F4A1}</span>
              <div>
                <p style="font-family:var(--mc-font);font-size:0.7rem;color:var(--mc-gold);margin-bottom:4px;text-transform:uppercase">${t2("journal.prompt").split("?")[0]}?</p>
                <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);line-height:1.8">${this._dailyPrompt}</p>
              </div>
            </div>
          </div>

          <input id="journal-title" class="mc-input mb-3" placeholder="${t2("journal.title")}" value="${this._title.replace(/"/g, "&quot;")}" maxlength="100" />
          <textarea id="journal-content" class="mc-journal-textarea mb-4" placeholder="${t2("journal.subtitle")}" rows="6" maxlength="2000">${this._content}</textarea>

          <div class="flex flex-wrap gap-2 mb-4">${moodTagsHtml}</div>

          <button id="journal-save" class="mc-btn mc-btn-primary w-full" style="font-size:var(--mc-font-size-sm)" ${this._saving || !this._content.trim() ? 'disabled style="opacity:0.6"' : ""}>
            ${this._saving ? "\u23F3 ..." : "\u{1F4BE} " + t2("journal.save")}
          </button>

          <div class="mc-divider-icon my-8"><span>\u{1F4C5}</span></div>

          <h3 class="mb-4" style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-gold);text-shadow:2px 2px 0 #000">${t2("journal.entries")}</h3>
          <div class="space-y-3 max-h-96 overflow-y-auto">${entriesHtml}</div>
        </div>
      </div>`;
    },
    init(t2) {
      this._loadEntries(t2);
      const rebind = () => {
        document.querySelectorAll("[data-journal-mood]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const key = btn.getAttribute("data-journal-mood");
            this._selectedMood = this._selectedMood === key ? null : key;
            this._rerender(t2);
          });
        });
        const saveBtn = document.getElementById("journal-save");
        if (saveBtn) saveBtn.addEventListener("click", () => this._saveEntry(t2));
        document.querySelectorAll("[data-journal-delete]").forEach((btn) => {
          btn.addEventListener("click", () => this._deleteEntry(btn.getAttribute("data-journal-delete"), t2));
        });
      };
      rebind();
      this._rebind = rebind;
    },
    async _loadEntries(t2) {
      try {
        const token = get("token");
        const res = await fetch(`/api/journal?days=30&locale=pt`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          this._entries = data.entries || [];
          this._dailyPrompt = data.dailyPrompt || t2("journal.prompt");
          this._rerender(t2);
        }
      } catch {
      }
    },
    async _saveEntry(t2) {
      const titleEl = document.getElementById("journal-title");
      const contentEl = document.getElementById("journal-content");
      const content = contentEl ? contentEl.value.trim() : "";
      if (!content) return;
      this._saving = true;
      this._rerender(t2);
      try {
        const token = get("token");
        const title = titleEl ? titleEl.value.trim() : "";
        const res = await fetch("/api/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: title || void 0, content, mood: this._selectedMood || void 0 })
        });
        if (res.ok) {
          showToast(t2("journal.saved"), "success");
          playSuccess();
          this._content = "";
          this._title = "";
          this._selectedMood = null;
          this._loadEntries(t2);
        } else {
          showToast(t2("common.error"), "error");
          playError();
        }
      } catch {
        showToast(t2("common.error"), "error");
        playError();
      } finally {
        this._saving = false;
        this._rerender(t2);
      }
    },
    async _deleteEntry(entryId, t2) {
      try {
        const token = get("token");
        const res = await fetch(`/api/journal?id=${entryId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          showToast(t2("common.success"), "success");
          this._loadEntries(t2);
        }
      } catch {
        showToast(t2("common.error"), "error");
      }
    },
    _rerender(t2) {
      const main = document.querySelector("main");
      if (!main) return;
      const viewContainer = main.querySelector(":scope > div");
      if (viewContainer) {
        viewContainer.innerHTML = this.render(t2);
        if (this._rebind) this._rebind();
      }
    },
    cleanup() {
      this._timers.forEach(clearTimeout);
      this._timers = [];
      this._rebind = null;
    }
  };
  var journalView = _journal;
  var _minigame = {
    _timers: [],
    _gameState: "menu",
    // 'menu' | 'playing' | 'gameover'
    _score: 0,
    _lives: 3,
    _level: 1,
    _activePowerup: null,
    _gameLoopId: null,
    _isRunning: false,
    _player: null,
    _blocks: [],
    _enemies: [],
    _keys: /* @__PURE__ */ new Set(),
    _frame: 0,
    _powerupTimer: 0,
    _shield: false,
    _speed: 1,
    _touchDir: null,
    _touchJump: false,
    render(t2) {
      if (this._gameState === "menu") return this._renderMenu(t2);
      if (this._gameState === "playing") return this._renderPlaying(t2);
      return this._renderGameOver(t2);
    },
    _renderMenu(t2) {
      return `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div id="mc-minigame-container" class="mc-panel animate-pixel-slide-up">
          <div class="mc-panel-header flex items-center justify-between">
            <span>\u{1F3AE} ${t2("minigame.title")}</span>
            <button id="minigame-fullscreen" class="mc-btn mc-btn-diamond py-0.5 px-2" style="font-size:var(--mc-font-size-sm)" title="Tela cheia">\u26F6</button>
          </div>
          <div class="text-center py-8">
            <div class="flex justify-center gap-6 mb-6">
              <div class="mc-mob mc-mob-creeper mc-mob-float" style="animation-delay:0s"></div>
              <div class="mc-mob mc-mob-enderman mc-mob-float" style="animation-delay:0.5s"></div>
              <div class="mc-mob mc-mob-zombie mc-mob-float" style="animation-delay:1s"></div>
              <div class="mc-mob mc-mob-spider mc-mob-float" style="animation-delay:1.5s"></div>
            </div>
            <div class="text-6xl mb-4 animate-pixel-bounce">\u26CF\uFE0F</div>
            <h3 style="font-family:var(--mc-font);font-size:var(--mc-font-size-lg);color:var(--mc-diamond-blue);text-shadow:2px 2px 0 #000;margin-bottom:16px">${t2("minigame.title")}</h3>
            <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);line-height:1.8;margin-bottom:8px">${t2("minigame.instructions")}</p>
            <div class="mc-game-instructions-keys mc-panel inline-block text-left mb-6" style="background:#0A0A0A">
              <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-emerald-green);line-height:2">
                <kbd>\u2B05\uFE0F \u27A1\uFE0F</kbd> / <kbd>A</kbd> <kbd>D</kbd> - Mover<br />
                <kbd>\u2B06\uFE0F</kbd> / <kbd>W</kbd> / <kbd>Espa\xE7o</kbd> - Pular<br />
                \u{1F48E} +10pts | \u{1F7E1} +5pts | \u{1F7E9} +15pts | \u{1F47E} +20pts (pise!)<br />
                \u{1F6E1}\uFE0F Escudo | \u26A1 Velocidade
              </p>
            </div>
            <br />
            <button id="minigame-start" class="mc-btn mc-btn-gold px-8 py-3" style="font-size:var(--mc-font-size-lg)">\u{1F3AE} ${t2("minigame.start")}</button>
          </div>
        </div>
      </div>`;
    },
    _renderPlaying(t2) {
      const livesHtml = [1, 2, 3].map((i) => `<div class="mc-game-life ${this._lives < i ? "lost" : ""}">\u2764\uFE0F</div>`).join("");
      const powerupHtml = this._activePowerup ? `<div class="mc-game-powerup-indicator">${this._activePowerup === "shield" ? "\u{1F6E1}\uFE0F" : "\u26A1"} ${t2("game." + this._activePowerup)}</div>` : "";
      return `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div id="mc-minigame-container" class="mc-panel animate-pixel-slide-up">
          <div class="mc-panel-header flex items-center justify-between">
            <span>\u{1F3AE} ${t2("minigame.title")} ${this._level > 1 ? "- Nv." + this._level : ""}</span>
            <button id="minigame-fullscreen" class="mc-btn mc-btn-diamond py-0.5 px-2" style="font-size:var(--mc-font-size-sm)" title="Tela cheia">\u26F6</button>
          </div>
          <div class="flex flex-col items-center">
            <div class="mc-game-hud w-full" style="max-width:600px">
              <div class="flex items-center gap-4">
                <div class="mc-game-lives">${livesHtml}</div>
                <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-gold)">\u26CF\uFE0F ${t2("game.score")}: ${this._score}</span>
                <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-diamond-blue)">\u{1F3F0} Nv.${this._level}</span>
                ${powerupHtml}
              </div>
            </div>
            <div class="mc-game-canvas-container w-full" style="max-width:600px">
              <canvas id="minigame-canvas" width="600" height="450" class="mc-game-canvas w-full" style="max-width:600px"></canvas>
            </div>
            <div class="flex justify-between w-full mt-3 px-4 lg:hidden" style="max-width:600px">
              <div class="flex gap-2">
                <button id="mg-touch-left" class="mc-btn mc-btn-stone py-3 px-5 text-xl select-none">\u2B05\uFE0F</button>
                <button id="mg-touch-right" class="mc-btn mc-btn-stone py-3 px-5 text-xl select-none">\u27A1\uFE0F</button>
              </div>
              <button id="mg-touch-jump" class="mc-btn mc-btn-primary py-3 px-6 text-xl select-none">\u2B06\uFE0F</button>
            </div>
          </div>
        </div>
      </div>`;
    },
    _renderGameOver(t2) {
      return `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div id="mc-minigame-container" class="mc-panel animate-pixel-slide-up">
          <div class="mc-panel-header flex items-center justify-between">
            <span>\u{1F3AE} ${t2("minigame.title")}</span>
          </div>
          <div class="text-center py-8 animate-pixel-fade-in">
            <div class="text-6xl mb-4">\u{1F3C6}</div>
            <h3 style="font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-gold);text-shadow:2px 2px 0 #000">${t2("minigame.gameOver")}</h3>
            <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-xl);color:var(--mc-diamond-blue);text-shadow:2px 2px 0 #000;margin:16px 0">\u2B50 ${this._score} ${t2("minigame.score")} | \u{1F3F0} N\xEDvel ${this._level}</p>
            <button id="minigame-restart" class="mc-btn mc-btn-primary px-6 py-3" style="font-size:var(--mc-font-size-md)">\u{1F504} ${t2("minigame.playAgain")}</button>
          </div>
        </div>
      </div>`;
    },
    init(t2) {
      const startBtn = document.getElementById("minigame-start");
      if (startBtn) startBtn.addEventListener("click", () => this._initGame(t2));
      const restartBtn = document.getElementById("minigame-restart");
      if (restartBtn) restartBtn.addEventListener("click", () => this._initGame(t2));
      const fsBtn = document.getElementById("minigame-fullscreen");
      if (fsBtn) fsBtn.addEventListener("click", () => this._toggleFullscreen());
      const leftBtn = document.getElementById("mg-touch-left");
      const rightBtn = document.getElementById("mg-touch-right");
      const jumpBtn = document.getElementById("mg-touch-jump");
      if (leftBtn) leftBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this._touchDir = "left";
      });
      if (leftBtn) leftBtn.addEventListener("touchend", () => {
        this._touchDir = null;
        this._touchJump = false;
      });
      if (rightBtn) rightBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this._touchDir = "right";
      });
      if (rightBtn) rightBtn.addEventListener("touchend", () => {
        this._touchDir = null;
        this._touchJump = false;
      });
      if (jumpBtn) jumpBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this._touchJump = true;
      });
      if (jumpBtn) jumpBtn.addEventListener("touchend", () => {
        this._touchDir = null;
        this._touchJump = false;
      });
      this._keyHandler = (e) => {
        if (e.key === " " || e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
        if (e.type === "keydown") this._keys.add(e.key);
        else this._keys.delete(e.key);
      };
      window.addEventListener("keydown", this._keyHandler);
      window.addEventListener("keyup", this._keyHandler);
    },
    _initGame(t2) {
      if (this._gameLoopId) cancelAnimationFrame(this._gameLoopId);
      this._isRunning = false;
      this._player = { x: 50, y: 300, vy: 0, w: 24, h: 24, onGround: false, dir: 1 };
      this._score = 0;
      this._lives = 3;
      this._level = 1;
      this._activePowerup = null;
      this._shield = false;
      this._speed = 1;
      this._powerupTimer = 0;
      this._frame = 0;
      this._keys.clear();
      this._touchDir = null;
      this._touchJump = false;
      this._generateLevel(1);
      this._gameState = "playing";
      playClick();
      this._rerender(t2);
      requestAnimationFrame(() => {
        const canvas = document.getElementById("minigame-canvas");
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) this._startGameLoop(ctx);
        }
      });
    },
    _generateLevel(lvl) {
      const blocks = [];
      const enemies = [];
      const W = 600, H = 450;
      for (let x = 0; x < W; x += 32) {
        blocks.push({ x, y: H - 70, w: 32, h: 32, color: "#4CAF50", type: "grass" });
        blocks.push({ x, y: H - 38, w: 32, h: 32, color: "#A0722A", type: "dirt" });
      }
      const platCount = 4 + lvl * 2;
      for (let i = 0; i < platCount; i++) {
        const pw = 48 + Math.random() * 60;
        blocks.push({
          x: 20 + i / platCount * (W - 80) + Math.random() * 30,
          y: 140 + Math.random() * 180,
          w: pw,
          h: 12,
          color: "#9E9E9E",
          type: "stone"
        });
      }
      const collectCount = 8 + lvl * 3;
      for (let i = 0; i < collectCount; i++) {
        const bt = [{ color: "#00E5FF", type: "diamond" }, { color: "#FFB300", type: "gold" }, { color: "#66BB6A", type: "emerald" }][Math.floor(Math.random() * 3)];
        blocks.push({ x: 20 + Math.random() * (W - 60), y: 80 + Math.random() * 260, w: 14, h: 14, color: bt.color, type: bt.type });
      }
      if (lvl >= 1) blocks.push({ x: 80 + Math.random() * 200, y: 100 + Math.random() * 80, w: 14, h: 14, color: "#9B59B6", type: "shield" });
      if (lvl >= 2) blocks.push({ x: 300 + Math.random() * 200, y: 100 + Math.random() * 80, w: 14, h: 14, color: "#FFD700", type: "speed" });
      const enemyCount = Math.min(lvl + 1, 6);
      const enemyColors = ["#E53935", "#8E24AA", "#F4511E"];
      for (let i = 0; i < enemyCount; i++) {
        const ex = 100 + i / enemyCount * (W - 200);
        enemies.push({ x: ex, y: H - 70 - 20, w: 20, h: 20, vx: (1 + lvl * 0.3) * (i % 2 === 0 ? 1 : -1), color: enemyColors[i % 3], alive: true });
      }
      this._blocks = blocks;
      this._enemies = enemies;
    },
    _nextLevel() {
      this._level++;
      this._player.x = 50;
      this._player.y = 300;
      this._player.vy = 0;
      this._generateLevel(this._level);
    },
    _startGameLoop(ctx) {
      if (this._isRunning) return;
      this._isRunning = true;
      const loop = () => {
        if (this._gameState !== "playing") {
          this._isRunning = false;
          return;
        }
        this._update();
        this._draw(ctx);
        this._gameLoopId = requestAnimationFrame(loop);
      };
      this._gameLoopId = requestAnimationFrame(loop);
    },
    _update() {
      const p = this._player;
      const gravity = 0.5;
      const jumpForce = -10;
      const speed = 4 * this._speed;
      const W = 600, H = 450;
      if (this._keys.has("ArrowLeft") || this._keys.has("a") || this._touchDir === "left") {
        p.x -= speed;
        p.dir = -1;
      }
      if (this._keys.has("ArrowRight") || this._keys.has("d") || this._touchDir === "right") {
        p.x += speed;
        p.dir = 1;
      }
      if ((this._keys.has("ArrowUp") || this._keys.has("w") || this._keys.has(" ") || this._touchJump) && p.onGround) {
        p.vy = jumpForce;
        p.onGround = false;
        this._touchJump = false;
      }
      p.vy += gravity;
      p.y += p.vy;
      p.onGround = false;
      if (p.x < 0) p.x = 0;
      if (p.x > W - p.w) p.x = W - p.w;
      for (let i = this._blocks.length - 1; i >= 0; i--) {
        const b = this._blocks[i];
        if (p.x < b.x + b.w && p.x + p.w > b.x && p.y < b.y + b.h && p.y + p.h > b.y) {
          if (b.type === "grass" || b.type === "dirt" || b.type === "stone") {
            if (p.vy > 0 && p.y + p.h - p.vy <= b.y + 4) {
              p.y = b.y - p.h;
              p.vy = 0;
              p.onGround = true;
            } else if (p.vy < 0 && p.y - p.vy >= b.y + b.h - 4) {
              p.y = b.y + b.h;
              p.vy = 1;
            } else if (p.vy <= 0) {
              if (p.x + p.w / 2 < b.x + b.w / 2) p.x = b.x - p.w;
              else p.x = b.x + b.w;
            }
          } else if (b.type === "shield") {
            this._blocks.splice(i, 1);
            this._shield = true;
            this._powerupTimer = 300;
            this._activePowerup = "shield";
            this._score += 5;
          } else if (b.type === "speed") {
            this._blocks.splice(i, 1);
            this._speed = 1.8;
            this._powerupTimer = 300;
            this._activePowerup = "speed";
            this._score += 5;
          } else {
            this._blocks.splice(i, 1);
            const points = b.type === "diamond" ? 10 : b.type === "emerald" ? 15 : 5;
            this._score += points;
          }
        }
      }
      for (const e of this._enemies) {
        if (!e.alive) continue;
        e.x += e.vx;
        if (e.x <= 0 || e.x >= W - e.w) e.vx *= -1;
        if (p.x < e.x + e.w && p.x + p.w > e.x && p.y < e.y + e.h && p.y + p.h > e.y) {
          if (p.vy > 0 && p.y + p.h - p.vy <= e.y + 4) {
            e.alive = false;
            p.vy = -8;
            this._score += 20;
          } else if (!this._shield) {
            this._lives--;
            p.x = 50;
            p.y = 300;
            p.vy = 0;
            if (this._lives <= 0) this._handleGameOver();
          } else {
            e.alive = false;
            this._score += 10;
          }
        }
      }
      if (this._powerupTimer > 0) {
        this._powerupTimer--;
        if (this._powerupTimer <= 0) {
          this._shield = false;
          this._speed = 1;
          this._activePowerup = null;
        }
      }
      if (p.y > H + 50) {
        this._lives--;
        if (this._lives <= 0) this._handleGameOver();
        else {
          p.x = 50;
          p.y = 300;
          p.vy = 0;
          p.onGround = false;
        }
      }
      const remaining = this._blocks.filter((b) => b.type !== "grass" && b.type !== "dirt" && b.type !== "stone").length;
      const aliveEnemies = this._enemies.filter((e) => e.alive).length;
      if (remaining === 0 && aliveEnemies === 0) this._nextLevel();
      this._frame++;
    },
    _draw(ctx) {
      const p = this._player;
      const W = 600, H = 450;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, "#42A5F5");
      skyGrad.addColorStop(1, "#90CAF9");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#FFFFFF";
      for (let i = 0; i < 5; i++) {
        const cx = (this._frame * 0.3 + i * 130) % (W + 100) - 50;
        ctx.fillRect(cx, 40 + i * 25, 48, 12);
        ctx.fillRect(cx + 12, 28 + i * 25, 24, 12);
      }
      ctx.fillStyle = "#FFD54F";
      ctx.beginPath();
      ctx.arc(540, 50, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFECB3";
      ctx.beginPath();
      ctx.arc(540, 50, 18, 0, Math.PI * 2);
      ctx.fill();
      this._blocks.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(b.x + 2, b.y + 2, b.w / 2 - 2, b.h / 2 - 2);
        if (b.type === "shield" || b.type === "speed") {
          const glow = Math.sin(this._frame * 0.1) * 0.3 + 0.5;
          ctx.fillStyle = `rgba(255,255,255,${glow})`;
          ctx.fillRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
        }
      });
      this._enemies.forEach((e) => {
        if (!e.alive) return;
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x, e.y, e.w, e.h);
        ctx.fillStyle = "#000";
        ctx.fillRect(e.x + 4, e.y + 5, 4, 4);
        ctx.fillRect(e.x + 12, e.y + 5, 4, 4);
        ctx.fillStyle = "#FFF";
        ctx.fillRect(e.x + 5, e.y + 6, 2, 2);
        ctx.fillRect(e.x + 13, e.y + 6, 2, 2);
        ctx.fillStyle = "#000";
        ctx.fillRect(e.x + 6, e.y + 14, 8, 2);
      });
      ctx.fillStyle = "#00E5FF";
      ctx.fillRect(p.x + 4, p.y + 8, 16, 12);
      ctx.fillStyle = "#8B6914";
      ctx.fillRect(p.x + 4, p.y + 20, 7, 4);
      ctx.fillRect(p.x + 13, p.y + 20, 7, 4);
      ctx.fillStyle = "#DBA87A";
      ctx.fillRect(p.x + 6, p.y, 12, 8);
      ctx.fillStyle = "#4A2800";
      ctx.fillRect(p.x + 6, p.y, 12, 3);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(p.x + 8, p.y + 4, 3, 2);
      ctx.fillRect(p.x + 13, p.y + 4, 3, 2);
      ctx.fillStyle = "#000";
      ctx.fillRect(p.x + 9, p.y + 4, 2, 2);
      ctx.fillRect(p.x + 14, p.y + 4, 2, 2);
      if (this._shield) {
        ctx.strokeStyle = "rgba(155,89,182,0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 18, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(8, 8, 220, 28);
      ctx.fillStyle = "#FFB300";
      ctx.font = "13px Silkscreen, monospace";
      ctx.fillText(`\u2B50 ${this._score}  \u2764\uFE0F ${this._lives}  \u{1F3F0} Nv.${this._level}`, 18, 27);
      if (this._activePowerup && this._powerupTimer > 0) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(W - 140, 8, 132, 22);
        ctx.fillStyle = this._activePowerup === "shield" ? "#9B59B6" : "#FFD700";
        ctx.fillText(`${this._activePowerup === "shield" ? "\u{1F6E1}\uFE0F" : "\u26A1"} ${Math.ceil(this._powerupTimer / 60)}s`, W - 130, 23);
      }
    },
    _handleGameOver() {
      this._gameState = "gameover";
      if (this._gameLoopId) cancelAnimationFrame(this._gameLoopId);
      this._isRunning = false;
      playError();
      const token = get("token");
      if (token && this._score > 0) {
        fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ score: this._score, level: this._level, gameMode: "platformer" })
        }).catch(() => {
        });
      }
      this._rerender(tCurrent());
    },
    _toggleFullscreen() {
      const container = document.getElementById("mc-minigame-container");
      if (!container) return;
      if (document.fullscreenElement) document.exitFullscreen();
      else container.requestFullscreen?.();
    },
    _rerender(t2) {
      const main = document.querySelector("main");
      if (!main) return;
      const viewContainer = main.querySelector(":scope > div");
      if (viewContainer) {
        viewContainer.innerHTML = this.render(t2);
        const restartBtn = document.getElementById("minigame-restart");
        if (restartBtn) restartBtn.addEventListener("click", () => this._initGame(t2));
        const fsBtn = document.getElementById("minigame-fullscreen");
        if (fsBtn) fsBtn.addEventListener("click", () => this._toggleFullscreen());
      }
    },
    cleanup() {
      this._timers.forEach(clearTimeout);
      this._timers = [];
      if (this._gameLoopId) cancelAnimationFrame(this._gameLoopId);
      this._isRunning = false;
      if (this._keyHandler) {
        window.removeEventListener("keydown", this._keyHandler);
        window.removeEventListener("keyup", this._keyHandler);
        this._keyHandler = null;
      }
      this._keys.clear();
      this._touchDir = null;
      this._touchJump = false;
    }
  };
  var minigameView = _minigame;
  var STUDY_QUESTIONS = {
    year1: {
      math: [
        { q: "Qual \xE9 o resultado de (-3)\xB2 + 4?", opts: ["5", "13", "-5", "7"], answer: 1, explanation: "(-3)\xB2 = 9, ent\xE3o 9 + 4 = 13." },
        { q: "Um produto custa R$ 80 e teve 25% de desconto. Qual o pre\xE7o final?", opts: ["R$ 55", "R$ 60", "R$ 65", "R$ 70"], answer: 1, explanation: "25% de 80 = 20. 80 - 20 = 60." },
        { q: "Qual \xE9 o MMC de 12 e 18?", opts: ["24", "36", "54", "72"], answer: 1, explanation: "MMC(12,18) = 36." },
        { q: "Resolva: 2x + 5 = 17", opts: ["x = 5", "x = 6", "x = 7", "x = 8"], answer: 1, explanation: "2x = 12, x = 6." },
        { q: "Qual a \xE1rea de um tri\xE2ngulo com base 10 e altura 6?", opts: ["60", "30", "16", "20"], answer: 1, explanation: "A = (b \xD7 h) / 2 = (10 \xD7 6) / 2 = 30." }
      ],
      portuguese: [
        { q: 'Qual \xE9 a classe gramatical da palavra "belo" em "o belo jardim"?', opts: ["Substantivo", "Adjetivo", "Adv\xE9rbio", "Artigo"], answer: 1, explanation: '"Belo" caracteriza o substantivo "jardim", logo \xE9 adjetivo.' },
        { q: 'Qual figura de linguagem h\xE1 em "O tempo voa"?', opts: ["Meton\xEDmia", "Hip\xE9rbole", "Met\xE1fora", "Personifica\xE7\xE3o"], answer: 2, explanation: "Compara\xE7\xE3o impl\xEDcita entre tempo e um ser que voa." },
        { q: "Qual alternativa tem erro de concord\xE2ncia?", opts: ["Eles fizeram", "Faz anos", "Houveram problemas", "Existem coisas"], answer: 2, explanation: '"Haver" no sentido de existir \xE9 impessoal \u2192 "Houve problemas".' },
        { q: 'Qual \xE9 o sujeito da ora\xE7\xE3o "Chegaram os alunos"?', opts: ["Chegaram", "os alunos", "inexistente", "indeterminado"], answer: 1, explanation: 'Sujeito simples: "os alunos".' },
        { q: "Qual tipo textual narra eventos em sequ\xEAncia?", opts: ["Dissertativo", "Descritivo", "Narrativo", "Injuntivo"], answer: 2, explanation: "O texto narrativo conta uma hist\xF3ria com eventos em sequ\xEAncia." }
      ],
      science: [
        { q: "Qual \xE9 a principal fun\xE7\xE3o da mitoc\xF4ndria?", opts: ["Armazenar DNA", "Produzir energia (ATP)", "Sintetizar prote\xEDnas", "Controlar divis\xE3o celular"], answer: 1, explanation: 'A mitoc\xF4ndria \xE9 a "usina" da c\xE9lula, respons\xE1vel pela respira\xE7\xE3o celular e produ\xE7\xE3o de ATP.' },
        { q: "Qual \xE9 a f\xF3rmula da \xE1gua?", opts: ["CO\u2082", "H\u2082O", "O\u2082", "NaCl"], answer: 1, explanation: "\xC1gua = H\u2082O (2 hidrog\xEAnio + 1 oxig\xEAnio)." },
        { q: "Qual organela \xE9 respons\xE1vel pela fotoss\xEDntese?", opts: ["Mitoc\xF4ndria", "Ribossomo", "Cloroplasto", "Lisossomo"], answer: 2, explanation: "Cloroplastos cont\xEAm clorofila e realizam fotoss\xEDntese." },
        { q: "O que \xE9 uma rea\xE7\xE3o exot\xE9rmica?", opts: ["Absorve calor", "Libera calor", "N\xE3o troca calor", "Absorve luz"], answer: 1, explanation: "Exot\xE9rmica libera calor para o ambiente." },
        { q: "Qual camada da atmosfera cont\xE9m o oz\xF4nio?", opts: ["Troposfera", "Estratosfera", "Mesosfera", "Termosfera"], answer: 1, explanation: "A camada de oz\xF4nio fica na estratosfera." }
      ],
      history: [
        { q: "Em que ano o Brasil foi descoberto por Portugal?", opts: ["1492", "1500", "1510", "1498"], answer: 1, explanation: "Pedro \xC1lvares Cabral chegou ao Brasil em 22 de abril de 1500." },
        { q: "Qual foi a primeira capital do Brasil?", opts: ["Rio de Janeiro", "Salvador", "S\xE3o Paulo", "Bras\xEDlia"], answer: 1, explanation: "A primeira capital foi Salvador (1549-1763)." },
        { q: "O que foi a Revolu\xE7\xE3o Industrial?", opts: ["Guerra na Europa", "Transforma\xE7\xE3o tecnol\xF3gica e econ\xF4mica", "Movimento art\xEDstico", "Revolta colonial"], answer: 1, explanation: "Processo de mecaniza\xE7\xE3o e industrializa\xE7\xE3o que come\xE7ou na Inglaterra no s\xE9culo XVIII." },
        { q: "Quem foram os tupiniquins?", opts: ["Europeus", "Ind\xEDgenas do litoral brasileiro", "Africanos escravizados", "Imigrantes asi\xE1ticos"], answer: 1, explanation: "Os tupiniquins eram ind\xEDgenas que habitavam o litoral quando os portugueses chegaram." },
        { q: "O que foi a Lei \xC1urea?", opts: ["Lei do Ventre Livre", "Aboli\xE7\xE3o da escravid\xE3o", "Independ\xEAncia do Brasil", "Proclama\xE7\xE3o da Rep\xFAblica"], answer: 1, explanation: "A Lei \xC1urea (1888) aboliu a escravid\xE3o no Brasil." }
      ],
      geography: [
        { q: "Qual \xE9 o maior bioma do Brasil?", opts: ["Cerrado", "Caatinga", "Amaz\xF4nia", "Mata Atl\xE2ntica"], answer: 2, explanation: "A Amaz\xF4nia \xE9 o maior bioma, com cerca de 4,2 milh\xF5es de km\xB2." },
        { q: "Qual \xE9 o rio mais longo do Brasil?", opts: ["S\xE3o Francisco", "Paran\xE1", "Tocantins", "Amazonas"], answer: 3, explanation: "O Rio Amazonas \xE9 o mais longo, com cerca de 6.992 km." },
        { q: "Quantas regi\xF5es geoecon\xF4micas tem o Brasil?", opts: ["3", "4", "5", "6"], answer: 2, explanation: "5 regi\xF5es: Norte, Nordeste, Centro-Oeste, Sudeste e Sul." },
        { q: "O que \xE9 densidade demogr\xE1fica?", opts: ["N\xFAmero total de habitantes", "Habitantes por km\xB2", "Taxa de natalidade", "Taxa de mortalidade"], answer: 1, explanation: "Densidade demogr\xE1fica = habitantes / \xE1rea (hab/km\xB2)." },
        { q: "Qual estado tem a maior popula\xE7\xE3o?", opts: ["Minas Gerais", "Rio de Janeiro", "S\xE3o Paulo", "Bahia"], answer: 2, explanation: "S\xE3o Paulo \xE9 o estado mais populoso do Brasil." }
      ]
    },
    year2: {
      math: [
        { q: "Qual o valor de log\u2082(32)?", opts: ["4", "5", "6", "8"], answer: 1, explanation: "2\u2075 = 32, ent\xE3o log\u2082(32) = 5." },
        { q: "Qual \xE9 a derivada de f(x) = 3x\xB2 + 2x?", opts: ["6x + 2", "3x + 2", "6x\xB2 + 2", "6x"], answer: 0, explanation: "f'(x) = 6x + 2." },
        { q: "Resolva: |2x - 4| = 6", opts: ["x = 5 ou x = -1", "x = 1 ou x = 5", "x = -1 ou x = 1", "x = 5 apenas"], answer: 0, explanation: "2x - 4 = 6 \u2192 x = 5; ou 2x - 4 = -6 \u2192 x = -1." },
        { q: "Qual a probabilidade de sair cara em uma moeda?", opts: ["1/4", "1/2", "3/4", "1"], answer: 1, explanation: "2 resultados poss\xEDveis (cara/coroa), 1 favor\xE1vel = 1/2." },
        { q: "Qual \xE9 o determinante da matriz [[2,1],[3,4]]?", opts: ["5", "8", "11", "7"], answer: 0, explanation: "det = 2\xD74 - 1\xD73 = 8 - 3 = 5." }
      ],
      portuguese: [
        { q: 'Qual \xE9 o sujeito de "Conviu os amigos para a festa"?', opts: ['Sujeito oculto "eu"', "Os amigos", "Conviu", "Indeterminado"], answer: 0, explanation: 'Sujeito oculto (el\xEDptico) = "eu".' },
        { q: "O que \xE9 uma crase?", opts: ['Fus\xE3o de "a" + "a"', "Acento grave", "Sinal de pontua\xE7\xE3o", "Regra gramatical"], answer: 0, explanation: 'Crase \xE9 a fus\xE3o da preposi\xE7\xE3o "a" com o artigo "a" ou pronome demonstrativo "aquele(s)".' },
        { q: 'Qual \xE9 o plural de "cidad\xE3o"?', opts: ["Cidad\xE3os", "Cidad\xF5es", "Cidad\xE3es", "Cidad\xE3s"], answer: 0, explanation: "O plural de cidad\xE3o \xE9 cidad\xE3os." },
        { q: '"Se eu estudasse, passaria" \xE9 uma ora\xE7\xE3o no modo:', opts: ["Indicativo", "Subjuntivo", "Imperativo", "Infinitivo"], answer: 1, explanation: 'O verbo "estudasse" est\xE1 no pret\xE9rito imperfeito do subjuntivo.' },
        { q: "Qual recurso argumentativo usa dados estat\xEDsticos?", opts: ["Met\xE1fora", "Cita\xE7\xE3o de autoridade", "Argumento de autoridade/dados", "Ironia"], answer: 2, explanation: "Apresentar dados estat\xEDsticos fortalece o argumento por meio de provas concretas." }
      ],
      science: [
        { q: "Qual \xE9 a equa\xE7\xE3o da fotoss\xEDntese?", opts: ["CO\u2082 + H\u2082O \u2192 C\u2086H\u2081\u2082O\u2086 + O\u2082", "O\u2082 + C\u2086H\u2081\u2082O\u2086 \u2192 CO\u2082 + H\u2082O", "H\u2082O \u2192 H\u2082 + O\u2082", "CO\u2082 \u2192 C + O\u2082"], answer: 0, explanation: "6CO\u2082 + 6H\u2082O \u2192 C\u2086H\u2081\u2082O\u2086 + 6O\u2082 (com luz e clorofila)." },
        { q: "O que \xE9 a primeira lei de Newton?", opts: ["F = ma", "In\xE9rcia", "A\xE7\xE3o e rea\xE7\xE3o", "Conserva\xE7\xE3o de energia"], answer: 1, explanation: "A lei da in\xE9rcia: um corpo em repouso permanece em repouso." },
        { q: "Qual \xE9 o pH neutro?", opts: ["0", "5", "7", "14"], answer: 2, explanation: "pH 7 \xE9 neutro. Abaixo \xE9 \xE1cido, acima \xE9 b\xE1sico." },
        { q: "Qual tipo de onda \xE9 o som?", opts: ["Transversal", "Longitudinal", "Eletromagn\xE9tica", "Estacion\xE1ria"], answer: 1, explanation: "O som \xE9 uma onda mec\xE2nica longitudinal." },
        { q: "O que \xE9 o DNA?", opts: ["\xC1cido ribonucleico", "Mol\xE9cula que armazena info gen\xE9tica", "Tipo de prote\xEDna", "C\xE9lula-tronco"], answer: 1, explanation: "DNA (\xE1cido desoxirribonucleico) cont\xE9m a informa\xE7\xE3o gen\xE9tica." }
      ],
      history: [
        { q: "Qual foi a principal causa da Primeira Guerra Mundial?", opts: ["Religiosos", "Imperialismo e nacionalismo", "Econ\xF4micos apenas", "Tecnol\xF3gicos"], answer: 1, explanation: "O imperialismo europeu, nacionalismo e o sistema de alian\xE7as foram as causas principais." },
        { q: "O que foi a Semana de Arte Moderna (1922)?", opts: ["Evento esportivo", "Movimento cultural que modernizou a arte brasileira", "Revolu\xE7\xE3o pol\xEDtica", "Festival de m\xFAsica"], answer: 1, explanation: "A Semana de 22 foi um marco da moderniza\xE7\xE3o da arte e cultura no Brasil." },
        { q: "Quem foi Get\xFAlio Vargas?", opts: ["Imperador do Brasil", "Presidente durante a Era Vargas (1930-1945)", "L\xEDder independista", "Governador de SP"], answer: 1, explanation: "Get\xFAlio Vargas liderou a Revolu\xE7\xE3o de 1930 e governou o Brasil." },
        { q: "O que foi o Estado Novo?", opts: ["Monarquia", "Per\xEDodo ditatorial de Vargas (1937-1945)", "Rep\xFAblica democr\xE1tica", "Per\xEDodo colonial"], answer: 1, explanation: "O Estado Novo foi o per\xEDodo ditatorial de Vargas, com censura e centraliza\xE7\xE3o." },
        { q: "Qual foi a consequ\xEAncia da Revolu\xE7\xE3o Russa (1917)?", opts: ["Capitalismo forte", "Cria\xE7\xE3o da URSS (socialismo)", "Guerra Mundial", "Independ\xEAncia de col\xF4nias"], answer: 1, explanation: "A Revolu\xE7\xE3o Russa levou \xE0 cria\xE7\xE3o da Uni\xE3o Sovi\xE9tica." }
      ],
      geography: [
        { q: "O que \xE9 urbaniza\xE7\xE3o?", opts: ["Crescimento das \xE1reas rurais", "Aumento da popula\xE7\xE3o urbana", "Constru\xE7\xE3o de pr\xE9dios", "Migra\xE7\xE3o para o campo"], answer: 1, explanation: "Urbaniza\xE7\xE3o \xE9 o processo de crescimento das cidades e migra\xE7\xE3o rural-urbana." },
        { q: "Qual \xE9 o principal problema ambiental da Amaz\xF4nia?", opts: ["Polui\xE7\xE3o industrial", "Desmatamento", "Seca", "Enchentes"], answer: 1, explanation: "O desmatamento \xE9 a principal amea\xE7a \xE0 Amaz\xF4nia." },
        { q: "O que s\xE3o megacidades?", opts: ["Cidades pequenas", "Cidades com mais de 10 milh\xF5es de habitantes", "Capitais", "Cidades tur\xEDsticas"], answer: 1, explanation: "Megacidades s\xE3o \xE1reas metropolitanas com 10+ milh\xF5es de habitantes." },
        { q: "Qual \xE9 o principal setor econ\xF4mico do Brasil?", opts: ["Agr\xE1rio", "Industrial", "Servi\xE7os", "Extrativismo"], answer: 2, explanation: "O setor de servi\xE7os \xE9 o maior PIB do Brasil." },
        { q: "O que \xE9 fuso hor\xE1rio?", opts: ["Temperatura local", "Diferen\xE7a de hor\xE1rio entre regi\xF5es", "Esta\xE7\xE3o do ano", "Clima regional"], answer: 1, explanation: "Fuso hor\xE1rio \xE9 a diferen\xE7a de hor\xE1rio baseada na longitude." }
      ]
    },
    year3: {
      math: [
        { q: "Qual \xE9 o limite de (x\xB2 - 4)/(x - 2) quando x \u2192 2?", opts: ["0", "2", "4", "Indeterminado"], answer: 2, explanation: "Simplificando: (x-2)(x+2)/(x-2) = x+2 \u2192 2+2 = 4." },
        { q: "Qual a integral de 2x dx?", opts: ["x\xB2 + C", "2x\xB2 + C", "x + C", "2 + C"], answer: 0, explanation: "\u222B2x dx = x\xB2 + C." },
        { q: "Resolva: sen(30\xB0)?", opts: ["1/2", "\u221A2/2", "\u221A3/2", "1"], answer: 0, explanation: "sen(30\xB0) = 1/2." },
        { q: "Qual \xE9 a matriz inversa de [[2,0],[0,3]]?", opts: ["[[1/2,0],[0,1/3]]", "[[2,0],[0,3]]", "[[3,0],[0,2]]", "[[0,1/2],[1/3,0]]"], answer: 0, explanation: "A inversa de uma diagonal \xE9 o inverso de cada elemento diagonal." },
        { q: "Em uma PA, a\u2081=3 e r=5. Qual o 10\xBA termo?", opts: ["45", "48", "50", "53"], answer: 1, explanation: "a\u2081\u2080 = 3 + 9\xD75 = 48." }
      ],
      portuguese: [
        { q: "O que \xE9 intertextualidade?", opts: ["Texto sobre texto", "Di\xE1logo entre textos", "Tradu\xE7\xE3o", "Resumo de texto"], answer: 1, explanation: "Intertextualidade \xE9 a rela\xE7\xE3o/dialogo entre dois ou mais textos." },
        { q: "Qual \xE9 a diferen\xE7a entre denota\xE7\xE3o e conota\xE7\xE3o?", opts: ["S\xE3o iguais", "Denota\xE7\xE3o = sentido literal; Conota\xE7\xE3o = sentido figurado", "Denota\xE7\xE3o = figurado; Conota\xE7\xE3o = literal", "N\xE3o h\xE1 diferen\xE7a"], answer: 1, explanation: "Denota\xE7\xE3o \xE9 o sentido pr\xF3prio/dicion\xE1rio; conota\xE7\xE3o \xE9 o sentido figurado." },
        { q: "O que \xE9 coes\xE3o textual?", opts: ["Beleza do texto", "Liga\xE7\xE3o entre ideias do texto", "Tamanho do texto", "Autor do texto"], answer: 1, explanation: "Coes\xE3o s\xE3o os mecanismos lingu\xEDsticos que ligam as partes do texto." },
        { q: "Qual \xE9 a estrutura de uma disserta\xE7\xE3o-argumentativa?", opts: ["Introdu\xE7\xE3o, desenvolvimento, conclus\xE3o", "T\xEDtulo, par\xE1grafos, autor", "Personagens, enredo, desfecho", "Tese, ant\xEDtese, s\xEDntese"], answer: 0, explanation: "A estrutura padr\xE3o \xE9: introdu\xE7\xE3o (tese), desenvolvimento (argumentos), conclus\xE3o." },
        { q: "O que \xE9 uma varia\xE7\xE3o lingu\xEDstica?", opts: ["Erro de portugu\xEAs", "Diferen\xE7as na l\xEDngua por regi\xE3o, grupo social ou contexto", "G\xEDria incorreta", "Falta de vocabul\xE1rio"], answer: 1, explanation: "Varia\xE7\xE3o lingu\xEDstica s\xE3o as diferen\xE7as naturais de uma l\xEDngua." }
      ],
      science: [
        { q: "O que \xE9 a relatividade de Einstein?", opts: ["Teoria sobre gravidade cl\xE1ssica", "Tempo e espa\xE7o s\xE3o relativos ao observador", "Teoria at\xF4mica", "Lei da termodin\xE2mica"], answer: 1, explanation: "Einstein demonstrou que tempo e espa\xE7o dependem do referencial do observador." },
        { q: "Qual \xE9 a fun\xE7\xE3o dos anticorpos?", opts: ["Produzir energia", "Defender contra pat\xF3genos", "Transportar oxig\xEAnio", "Digirir alimentos"], answer: 1, explanation: "Anticorpos s\xE3o prote\xEDnas do sistema imunol\xF3gico que neutralizam pat\xF3genos." },
        { q: "O que \xE9 radiatividade?", opts: ["Luz vis\xEDvel", "Emiss\xE3o de part\xEDculas/radia\xE7\xE3o por n\xFAcleos inst\xE1veis", "Calor", "Eletricidade"], answer: 1, explanation: "Radiatividade \xE9 a emiss\xE3o espont\xE2nea de part\xEDculas por \xE1tomos inst\xE1veis." },
        { q: 'Qual lei diz que "a energia n\xE3o \xE9 criada nem destru\xEDda"?', opts: ["Lei de Newton", "1\xAA Lei da Termodin\xE2mica", "Lei de Coulomb", "Lei de Ohm"], answer: 1, explanation: "A 1\xAA Lei da Termodin\xE2mica: princ\xEDpio da conserva\xE7\xE3o de energia." },
        { q: "O que \xE9 a tabela peri\xF3dica?", opts: ["Lista de receitas", "Organiza\xE7\xE3o dos elementos qu\xEDmicos", "Mapa geogr\xE1fico", "Calend\xE1rio cient\xEDfico"], answer: 1, explanation: "A tabela peri\xF3dica organiza os elementos qu\xEDmicos por n\xFAmero at\xF4mico e propriedades." }
      ],
      history: [
        { q: "O que foi a Guerra Fria?", opts: ["Guerra f\xEDsica", "Conflito ideol\xF3gico EUA x URSS sem combate direto", "Guerra na Europa", "Conflito religioso"], answer: 1, explanation: "Guerra Fria foi a disputa ideol\xF3gica e geopol\xEDtica entre EUA e URSS (1947-1991)." },
        { q: "O que foi a ditadura militar no Brasil (1964-1985)?", opts: ["Democracia fortalecida", "Regime autorit\xE1rio sem elei\xE7\xF5es diretas", "Monarquia", "Governo constitucional"], answer: 1, explanation: "Per\xEDodo de regime militar com censura, persegui\xE7\xE3o e aus\xEAncia de elei\xE7\xF5es diretas." },
        { q: "O que foi a globaliza\xE7\xE3o?", opts: ["Isolamento de pa\xEDses", "Processo de integra\xE7\xE3o econ\xF4mica, cultural e tecnol\xF3gica mundial", "Guerra comercial", "Fim do com\xE9rcio"], answer: 1, explanation: "Globaliza\xE7\xE3o \xE9 a interconex\xE3o crescente entre pa\xEDses e culturas." },
        { q: "Qual foi o papel do Brasil na Segunda Guerra Mundial?", opts: ["N\xE3o participou", "Lutou ao lado dos Aliados (FEB)", "Lutou com o Eixo", "Foi neutro"], answer: 1, explanation: "O Brasil enviou a FEB (For\xE7a Expedicion\xE1ria Brasileira) para lutar com os Aliados." },
        { q: "O que foi a Constitui\xE7\xE3o de 1988?", opts: ["Constitui\xE7\xE3o imperial", "Constitui\xE7\xE3o Cidad\xE3 que restaurou a democracia", "Constitui\xE7\xE3o militar", "C\xF3digo Penal"], answer: 1, explanation: "A CF/88 restabeleceu direitos democr\xE1ticos ap\xF3s a ditadura militar." }
      ],
      geography: [
        { q: "O que \xE9 a cadeia produtiva?", opts: ["Cadeia de lojas", "Conjunto de etapas de produ\xE7\xE3o, distribui\xE7\xE3o e consumo", "Cadeia alimentar", "Corrente el\xE9trica"], answer: 1, explanation: "Cadeia produtiva engloba todas as etapas desde a mat\xE9ria-prima at\xE9 o consumo." },
        { q: "O que s\xE3o BRICS?", opts: ["Organiza\xE7\xE3o religiosa", "Bloco econ\xF4mico (Brasil, R\xFAssia, \xCDndia, China, \xC1frica do Sul)", "Time de futebol", "Tratado ambiental"], answer: 1, explanation: "BRICS \xE9 um bloco de coopera\xE7\xE3o econ\xF4mica entre pa\xEDses emergentes." },
        { q: "O que \xE9 sustentabilidade?", opts: ["Crescimento infinito", "Uso respons\xE1vel dos recursos sem comprometer o futuro", "Consumo excessivo", "Explora\xE7\xE3o total"], answer: 1, explanation: "Sustentabilidade = atender necessidades atuais sem comprometer as gera\xE7\xF5es futuras." },
        { q: "Qual \xE9 a maior economia da Am\xE9rica Latina?", opts: ["Argentina", "M\xE9xico", "Brasil", "Col\xF4mbia"], answer: 2, explanation: "O Brasil tem a maior economia da Am\xE9rica Latina." },
        { q: "O que \xE9 geopol\xEDtica?", opts: ["Geografia f\xEDsica", "Rela\xE7\xE3o entre pol\xEDtica e espa\xE7o geogr\xE1fico", "Pol\xEDtica cultural", "Economia internacional"], answer: 1, explanation: "Geopol\xEDtica estuda como a geografia influencia as rela\xE7\xF5es de poder." }
      ]
    }
  };
  var _studyHelp = {
    _timers: [],
    _selectedYear: null,
    _selectedSubject: null,
    _questions: [],
    _currentQ: 0,
    _selectedAnswer: null,
    _score: 0,
    _showResult: false,
    _isFinished: false,
    _rebind: null,
    render(t2) {
      if (this._isFinished) return this._renderResults(t2);
      if (this._questions.length > 0) return this._renderQuiz(t2);
      return this._renderSelection(t2);
    },
    _renderSelection(t2) {
      const years = [
        { key: "year1", label: t2("studyHelp.year1"), icon: "\u{1F4D7}" },
        { key: "year2", label: t2("studyHelp.year2"), icon: "\u{1F4D8}" },
        { key: "year3", label: t2("studyHelp.year3"), icon: "\u{1F4D9}" }
      ];
      const subjects = [
        { key: "math", label: t2("studyHelp.math"), icon: "\u{1F522}" },
        { key: "portuguese", label: t2("studyHelp.portuguese"), icon: "\u{1F4DD}" },
        { key: "science", label: t2("studyHelp.science"), icon: "\u{1F52C}" },
        { key: "history", label: t2("studyHelp.history"), icon: "\u{1F4DC}" },
        { key: "geography", label: t2("studyHelp.geography"), icon: "\u{1F30D}" }
      ];
      const yearsHtml = years.map((y) => {
        const selected = this._selectedYear === y.key;
        const bg = selected ? "background:#4CAF50;border-color:var(--mc-emerald-green);color:#fff" : "color:var(--mc-light-gray)";
        return `<button data-study-year="${y.key}" class="mc-border-2 p-3 text-center transition-all cursor-pointer" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);${bg};border-width:2px;border-style:solid"><div class="text-2xl mb-1">${y.icon}</div>${y.label}</button>`;
      }).join("");
      let subjectsHtml = "";
      if (this._selectedYear) {
        const items = subjects.map((s) => {
          const count = STUDY_QUESTIONS[this._selectedYear][s.key].length;
          const selected = this._selectedSubject === s.key;
          const bg = selected ? "background:#4CAF50;border-color:var(--mc-emerald-green);color:#fff" : "color:var(--mc-light-gray)";
          return `<button data-study-subject="${s.key}" class="mc-border-2 p-3 text-center transition-all cursor-pointer" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);${bg};border-width:2px;border-style:solid"><div class="text-2xl mb-1">${s.icon}</div>${s.label}<div class="text-[0.6rem] mt-1 opacity-70">${count} ${t2("studyHelp.question").toLowerCase()}s</div></button>`;
        }).join("");
        subjectsHtml = `
        <div class="animate-pixel-fade-in">
          <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-gold);margin-bottom:12px;text-shadow:1px 1px 0 #000">\u{1F4DA} ${t2("studyHelp.selectSubject")}</h4>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">${items}</div>
        </div>`;
      }
      let startBtnHtml = "";
      if (this._selectedYear && this._selectedSubject) {
        startBtnHtml = `<div class="text-center animate-pixel-fade-in"><button id="study-start" class="mc-btn mc-btn-gold px-8 py-3" style="font-size:var(--mc-font-size-md)">\u{1F680} ${t2("studyHelp.start")}</button></div>`;
      }
      return `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up">
          <div class="mc-panel-header">\u{1F4D6} ${t2("studyHelp.title")}</div>
          <p class="p-4 text-center" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);line-height:1.8">${t2("studyHelp.subtitle")}</p>
          <div class="p-4 space-y-6">
            <div>
              <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-gold);margin-bottom:12px;text-shadow:1px 1px 0 #000">\u{1F393} ${t2("studyHelp.selectYear")}</h4>
              <div class="grid grid-cols-3 gap-3">${yearsHtml}</div>
            </div>
            ${subjectsHtml}
            ${startBtnHtml}
          </div>
        </div>
      </div>`;
    },
    _renderQuiz(t2) {
      const q = this._questions[this._currentQ];
      const progress = (this._currentQ + 1) / this._questions.length * 100;
      const optionsHtml = q.opts.map((opt, i) => {
        let cls = "mc-border-2 p-3 text-left w-full transition-all cursor-pointer";
        let style = "font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);border-width:2px;border-style:solid;";
        if (this._showResult) {
          if (i === q.answer) {
            style += "background:#4CAF50;border-color:var(--mc-emerald-green);";
          } else if (i === this._selectedAnswer) {
            style += "background:#E53935;border-color:var(--mc-redstone-red);opacity:0.7;";
          } else {
            style += "opacity:0.5;";
          }
        } else {
          style += "background:transparent;";
        }
        return `<button data-study-answer="${i}" class="${cls}" style="${style}" ${this._showResult ? "disabled" : ""}><span class="mr-2 font-bold">${String.fromCharCode(65 + i)}.</span> ${opt}</button>`;
      }).join("");
      let resultHtml = "";
      if (this._showResult) {
        const isCorrect = this._selectedAnswer === q.answer;
        const color = isCorrect ? "var(--mc-emerald-green)" : "var(--mc-redstone-red)";
        const msg = isCorrect ? t2("studyHelp.correct") : t2("studyHelp.wrong");
        const btnLabel = this._currentQ + 1 >= this._questions.length ? t2("studyHelp.finish") : t2("studyHelp.next");
        resultHtml = `
        <div class="mt-4 p-3 mc-border-2 animate-pixel-fade-in" style="background:var(--mc-bg-dark);border-width:2px;border-style:solid">
          <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:${color}">${msg}</p>
          <p class="mt-1" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">\u{1F4A1} ${q.explanation}</p>
          <button id="study-next-q" class="mc-btn mc-btn-gold mt-3 w-full">${btnLabel} \u2192</button>
        </div>`;
      }
      return `
      <div class="max-w-2xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up mc-glow-gold">
          <div class="mc-panel-header flex items-center justify-between">
            <span>\u{1F4D6} ${t2("studyHelp.title")}</span>
            <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-gold)">${t2("studyHelp.question")} ${this._currentQ + 1} ${t2("studyHelp.of")} ${this._questions.length} | ${t2("studyHelp.score")}: ${this._score}</span>
          </div>
          <div class="mc-xp-bar mb-6"><div class="mc-xp-bar-fill" style="width:${progress}%"></div></div>
          <h3 style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-diamond-blue);line-height:1.8;margin-bottom:16px">${q.q}</h3>
          <div class="space-y-3">${optionsHtml}</div>
          ${resultHtml}
        </div>
      </div>`;
    },
    _renderResults(t2) {
      const pct = Math.round(this._score / this._questions.length * 100);
      const msg = pct === 100 ? t2("studyHelp.perfect") : pct >= 75 ? t2("studyHelp.great") : pct >= 50 ? t2("studyHelp.good") : t2("studyHelp.needsWork");
      const emoji = pct === 100 ? "\u{1F3C6}" : pct >= 75 ? "\u2B50" : pct >= 50 ? "\u{1F4DA}" : "\u{1F4AA}";
      return `
      <div class="max-w-2xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-fade-in text-center">
          <div class="mc-panel-header">\u{1F4D6} ${t2("studyHelp.results")}</div>
          <div class="text-6xl my-6 animate-pixel-bounce">${emoji}</div>
          <h2 style="font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-gold);text-shadow:2px 2px 0 #000">${this._score}/${this._questions.length}</h2>
          <p class="mt-2 mb-1" style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-light-gray)">${pct}%</p>
          <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-emerald-green)">${msg}</p>
          <div class="flex gap-3 justify-center mt-6">
            <button id="study-back" class="mc-btn mc-btn-primary">\u{1F4D6} ${t2("studyHelp.back")}</button>
            <button id="study-restart" class="mc-btn mc-btn-gold">\u{1F504} ${t2("studyHelp.restart")}</button>
          </div>
        </div>
      </div>`;
    },
    init(t2) {
      const rebind = () => {
        document.querySelectorAll("[data-study-year]").forEach((btn) => {
          btn.addEventListener("click", () => {
            this._selectedYear = btn.getAttribute("data-study-year");
            this._selectedSubject = null;
            playClick();
            this._rerender(t2);
          });
        });
        document.querySelectorAll("[data-study-subject]").forEach((btn) => {
          btn.addEventListener("click", () => {
            this._selectedSubject = btn.getAttribute("data-study-subject");
            playClick();
            this._rerender(t2);
          });
        });
        const startBtn = document.getElementById("study-start");
        if (startBtn) startBtn.addEventListener("click", () => this._startQuiz(t2));
        document.querySelectorAll("[data-study-answer]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.getAttribute("data-study-answer"), 10);
            this._handleAnswer(idx, t2);
          });
        });
        const nextBtn = document.getElementById("study-next-q");
        if (nextBtn) nextBtn.addEventListener("click", () => this._nextQuestion(t2));
        const backBtn = document.getElementById("study-back");
        if (backBtn) backBtn.addEventListener("click", () => this._resetQuiz(t2));
        const restartBtn = document.getElementById("study-restart");
        if (restartBtn) restartBtn.addEventListener("click", () => this._startQuiz(t2));
      };
      rebind();
      this._rebind = rebind;
    },
    _startQuiz(t2) {
      if (!this._selectedYear || !this._selectedSubject) return;
      const qs = [...STUDY_QUESTIONS[this._selectedYear][this._selectedSubject]].sort(() => Math.random() - 0.5);
      this._questions = qs;
      this._currentQ = 0;
      this._selectedAnswer = null;
      this._score = 0;
      this._showResult = false;
      this._isFinished = false;
      playClick();
      this._rerender(t2);
    },
    _handleAnswer(idx, t2) {
      if (this._showResult) return;
      this._selectedAnswer = idx;
      this._showResult = true;
      if (idx === this._questions[this._currentQ].answer) {
        this._score++;
        playSuccess();
      } else {
        playError();
      }
      this._rerender(t2);
    },
    _nextQuestion(t2) {
      if (this._currentQ + 1 >= this._questions.length) {
        this._isFinished = true;
      } else {
        this._currentQ++;
        this._selectedAnswer = null;
        this._showResult = false;
      }
      playClick();
      this._rerender(t2);
    },
    _resetQuiz(t2) {
      this._selectedYear = null;
      this._selectedSubject = null;
      this._questions = [];
      this._isFinished = false;
      playClick();
      this._rerender(t2);
    },
    _rerender(t2) {
      const main = document.querySelector("main");
      if (!main) return;
      const viewContainer = main.querySelector(":scope > div");
      if (viewContainer) {
        viewContainer.innerHTML = this.render(t2);
        if (this._rebind) this._rebind();
      }
    },
    cleanup() {
      this._timers.forEach(clearTimeout);
      this._timers = [];
      this._rebind = null;
    }
  };
  var studyHelpView = _studyHelp;

  // public/js/views-wellness.js
  var _mood = {
    _timers: [],
    _selectedMood: null,
    _note: "",
    _saving: false,
    _history: [],
    render(t2) {
      const user = get("user");
      if (!user) return "";
      const moodOptions = [
        { key: "happy", emoji: "\u{1F60A}", label: t2("mood.happy"), className: "mc-mood-happy" },
        { key: "sad", emoji: "\u{1F622}", label: t2("mood.sad"), className: "mc-mood-sad" },
        { key: "anxious", emoji: "\u{1F630}", label: t2("mood.anxious"), className: "mc-mood-anxious" },
        { key: "angry", emoji: "\u{1F620}", label: t2("mood.angry"), className: "mc-mood-angry" },
        { key: "calm", emoji: "\u{1F60C}", label: t2("mood.calm"), className: "mc-mood-calm" },
        { key: "tired", emoji: "\u{1F634}", label: t2("mood.tired"), className: "" }
      ];
      const emojiMap = { happy: "\u{1F60A}", sad: "\u{1F622}", anxious: "\u{1F630}", angry: "\u{1F620}", calm: "\u{1F60C}", tired: "\u{1F634}" };
      const moodGrid = moodOptions.map((m) => `
      <button data-mood-select="${m.key}" class="mc-mood-emoji ${m.className} ${this._selectedMood === m.key ? "mc-mood-selected" : ""}">
        <span class="text-3xl">${m.emoji}</span>
        <span class="block" style="font-size:0.6rem;margin-top:4px;font-family:var(--mc-font)">${m.label}</span>
      </button>
    `).join("");
      let noteHtml = "";
      if (this._selectedMood) {
        noteHtml = `
        <div class="space-y-3 animate-pixel-fade-in">
          <textarea id="mood-note" class="mc-textarea" placeholder="${t2("mood.encouragement")}" rows="3" aria-label="Note">${this._note}</textarea>
          <button id="mood-save" class="mc-btn mc-btn-primary w-full" style="font-size:var(--mc-font-size-sm)" ${this._saving ? "disabled" : ""}>
            ${this._saving ? "\u23F3 ..." : "\u{1F4BE} " + t2("mood.save")}
          </button>
        </div>`;
      }
      let historyHtml = "";
      if (this._history.length === 0) {
        historyHtml = `<p class="text-center py-4" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-stone-gray)">${t2("mood.noData")}</p>`;
      } else {
        const items = this._history.map((entry) => {
          const dateStr = new Date(entry.createdAt).toLocaleDateString(void 0, { month: "short", day: "numeric" });
          const noteLine = entry.note ? `<p style="margin-top:4px;font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">${entry.note}</p>` : "";
          return `
          <div class="mc-timeline-item">
            <div class="mc-timeline-time">${dateStr}</div>
            <div class="mc-timeline-card">
              <span class="text-2xl">${emojiMap[entry.mood] || "\u2753"}</span>
              ${noteLine}
            </div>
          </div>`;
        }).join("");
        historyHtml = `<div class="mc-timeline">${items}</div>`;
      }
      let chartHtml = "";
      if (this._history.length > 0) {
        const moodCounts = {};
        this._history.forEach((h) => {
          moodCounts[h.mood] = (moodCounts[h.mood] || 0) + 1;
        });
        const maxCount = Math.max(...Object.values(moodCounts), 1);
        const chartMoods = [
          { key: "happy", emoji: "\u{1F60A}", label: t2("mood.happy") },
          { key: "sad", emoji: "\u{1F622}", label: t2("mood.sad") },
          { key: "anxious", emoji: "\u{1F630}", label: t2("mood.anxious") },
          { key: "angry", emoji: "\u{1F620}", label: t2("mood.angry") },
          { key: "calm", emoji: "\u{1F60C}", label: t2("mood.calm") },
          { key: "tired", emoji: "\u{1F634}", label: t2("mood.tired") }
        ];
        const bars = chartMoods.map((m) => {
          const count = moodCounts[m.key] || 0;
          const height = maxCount > 0 ? Math.max(count / maxCount * 120, count > 0 ? 16 : 4) : 4;
          return `
          <div class="flex flex-col items-center gap-1 flex-1" style="max-width:60px">
            <span style="font-family:var(--mc-font);font-size:0.6rem;color:var(--mc-gold)">${count}</span>
            <div class="mc-mood-bar w-full" data-mood="${m.key}" style="height:${height}px;min-height:4px"></div>
            <span class="text-xl">${m.emoji}</span>
            <span style="font-family:var(--mc-font);font-size:0.5rem;color:var(--mc-stone-gray)">${m.label}</span>
          </div>`;
        }).join("");
        chartHtml = `
        <div class="mt-8">
          <div class="mc-divider-icon mb-6"><span>\u{1F4CA}</span></div>
          <h3 class="mb-4" style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-diamond-blue);text-shadow:2px 2px 0 #000">
            \u{1F4C8} ${t2("mood.chartTitle")}
          </h3>
          <div class="mc-mood-chart">
            <div class="flex items-end gap-3 justify-center" style="height:160px">
              ${bars}
            </div>
          </div>
          <p class="mt-3 text-center" style="font-family:var(--mc-font);font-size:0.6rem;color:var(--mc-stone-gray)">
            \u{1F4C5} ${t2("mood.last7Days")}
          </p>
        </div>`;
      }
      return `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up">
          <div class="mc-panel-header">\u{1F4CA} ${t2("mood.title")}</div>
          <p class="mb-4" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">
            ${t2("mood.select")}
          </p>
          <div class="flex flex-wrap justify-center gap-4 mb-6">
            ${moodGrid}
          </div>
          ${noteHtml}
          <div class="mt-8">
            <h3 class="mb-4" style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-gold);text-shadow:2px 2px 0 #000">
              \u{1F4C5} ${t2("mood.history")}
            </h3>
            ${historyHtml}
          </div>
          ${chartHtml}
        </div>
      </div>`;
    },
    init(t2) {
      const token = get("token");
      const loadHistory = async () => {
        try {
          const res = await fetch("/api/mood?days=7", { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            this._history = await res.json();
            this._rerender(t2);
          }
        } catch {
        }
      };
      loadHistory();
      document.querySelectorAll("[data-mood-select]").forEach((btn) => {
        btn.addEventListener("click", () => {
          playClick();
          this._selectedMood = btn.dataset.moodSelect;
          this._rerender(t2);
        });
      });
      const saveBtn = document.getElementById("mood-save");
      if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
          if (!this._selectedMood) return;
          this._saving = true;
          this._rerender(t2);
          try {
            const noteEl2 = document.getElementById("mood-note");
            const note = noteEl2 ? noteEl2.value : "";
            this._note = note;
            const res = await fetch("/api/mood", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ mood: this._selectedMood, note: note || void 0 })
            });
            if (res.ok) {
              showToast(t2("common.success"), "success");
              playSuccess();
              this._selectedMood = null;
              this._note = "";
              loadHistory();
            }
          } catch {
            showToast(t2("common.error"), "error");
            playError();
          }
          this._saving = false;
          this._rerender(t2);
        });
      }
      const noteEl = document.getElementById("mood-note");
      if (noteEl) {
        noteEl.addEventListener("input", (e) => {
          this._note = e.target.value;
        });
      }
    },
    _rerender(t2) {
      const main = document.querySelector("main");
      if (!main) return;
      const viewContainer = main.querySelector(":scope > div");
      if (viewContainer) {
        viewContainer.innerHTML = this.render(t2);
        if (this._rebind) this._rebind();
      }
    },
    cleanup() {
      this._timers.forEach(clearTimeout);
      this._timers = [];
      this._rebind = null;
    }
  };
  var moodView = _mood;
  var _moodInsights = {
    _timers: [],
    _insights: null,
    _loading: true,
    render(t2) {
      const user = get("user");
      if (!user) return "";
      if (this._loading) {
        return `
        <div class="max-w-4xl mx-auto px-4 py-8">
          <div class="mc-skeleton-block lg mx-auto" style="height:500px"></div>
        </div>`;
      }
      if (!this._insights) {
        return `
        <div class="max-w-4xl mx-auto px-4 py-8">
          <div class="mc-panel animate-pixel-slide-up">
            <div class="mc-panel-header">\u{1F4CA} ${t2("insights.title")}</div>
            <div class="mc-empty-state py-8">
              <span class="text-4xl">\u{1F4CB}</span>
              <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-stone-gray);margin-top:12px">
                ${t2("insights.noData")}
              </p>
              <button id="insights-go-mood" class="mc-btn mc-btn-primary mt-4" style="font-size:var(--mc-font-size-sm)">
                \u{1F60A} ${t2("mood.title")} \u2192
              </button>
            </div>
          </div>
        </div>`;
      }
      const ins = this._insights;
      const trendIcon = ins.recentTrend === "improving" ? "\u{1F4C8}" : ins.recentTrend === "declining" ? "\u{1F4C9}" : "\u27A1\uFE0F";
      const trendColor = ins.recentTrend === "improving" ? "mc-insight-green" : ins.recentTrend === "declining" ? "mc-insight-red" : "mc-insight-gold";
      const moodEmoji = { happy: "\u{1F60A}", sad: "\u{1F622}", anxious: "\u{1F630}", angry: "\u{1F620}", calm: "\u{1F60C}", tired: "\u{1F634}" };
      const moodColor = { happy: "var(--mc-emerald-green)", sad: "var(--mc-water-blue)", anxious: "var(--mc-gold)", angry: "var(--mc-redstone-red)", calm: "#00E5FF", tired: "#9E9E9E" };
      const maxMoodCount = Math.max(...Object.values(ins.moodCounts), 1);
      const sortedMoods = Object.entries(ins.moodCounts).sort((a, b) => b[1] - a[1]);
      const distBars = sortedMoods.map(
        ([mood, count]) => `
      <div class="mc-insight-trend-bar">
        <div class="flex items-center gap-2 mb-1">
          <span>${moodEmoji[mood] || "\u2753"}</span>
          <span style="font-family:var(--mc-font);font-size:0.65rem;color:var(--mc-light-gray)">${mood}</span>
          <span class="ml-auto" style="font-family:var(--mc-font);font-size:0.65rem;color:var(--mc-white);text-shadow:1px 1px 0 #000">${count}</span>
        </div>
        <div class="w-full h-4 overflow-hidden" style="background:var(--mc-obsidian)">
          <div class="h-full transition-all duration-500" style="width:${count / maxMoodCount * 100}%;background-color:${moodColor[mood] || "var(--mc-stone-gray)"}"></div>
        </div>
      </div>`
      ).join("");
      let weeklyChartHtml = "";
      if (ins.weeklyAverages && ins.weeklyAverages.length > 0) {
        const weekBars = ins.weeklyAverages.map((w) => {
          const pct = w.avgMood / 5 * 100;
          const color = w.avgMood >= 4 ? "var(--mc-emerald-green)" : w.avgMood >= 2.5 ? "var(--mc-gold)" : "var(--mc-redstone-red)";
          return `
          <div class="flex flex-col items-center gap-1 flex-1">
            <span style="font-family:var(--mc-font);font-size:0.6rem;color:var(--mc-white);text-shadow:1px 1px 0 #000">${w.avgMood.toFixed(1)}</span>
            <div class="w-full transition-all duration-500" style="height:${pct}%;background-color:${color};min-height:4px;max-width:40px"></div>
            <span style="font-family:var(--mc-font);font-size:0.55rem;color:var(--mc-stone-gray)">${w.week}</span>
          </div>`;
        }).join("");
        weeklyChartHtml = `
        <div>
          <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-diamond-blue);text-shadow:1px 1px 0 #000;margin-bottom:12px">
            \u{1F4C8} ${t2("insights.weeklyAverage")}
          </h4>
          <div class="mc-mood-chart p-4">
            <div class="flex items-end gap-4 justify-center" style="height:120px">
              ${weekBars}
            </div>
          </div>
        </div>`;
      }
      return `
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="mc-panel mc-glow-purple animate-pixel-slide-up">
          <div class="mc-panel-header">\u{1F4CA} ${t2("insights.title")}</div>
          <p class="mb-6" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">
            ${t2("insights.subtitle")}
          </p>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="mc-insight-card mc-insight-green">
              <div style="font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-emerald-green);text-shadow:2px 2px 0 #000">${ins.totalEntries}</div>
              <div style="font-family:var(--mc-font);font-size:0.65rem;color:var(--mc-stone-gray)">${t2("insights.totalEntries")}</div>
            </div>
            <div class="mc-insight-card mc-insight-gold">
              <div style="font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:var(--mc-gold);text-shadow:2px 2px 0 #000">${ins.averagePerDay.toFixed(1)}</div>
              <div style="font-family:var(--mc-font);font-size:0.65rem;color:var(--mc-stone-gray)">${t2("insights.avgPerDay")}</div>
            </div>
            <div class="mc-insight-card mc-insight-green">
              <div class="mc-streak-fire" style="font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);color:${ins.currentStreak >= 7 ? "var(--mc-gold)" : "var(--mc-emerald-green)"};text-shadow:2px 2px 0 #000">
                ${ins.currentStreak} \u{1F525}
              </div>
              <div style="font-family:var(--mc-font);font-size:0.65rem;color:var(--mc-stone-gray)">${t2("insights.currentStreak")}</div>
            </div>
            <div class="mc-insight-card ${trendColor}">
              <div style="font-family:var(--mc-font);font-size:var(--mc-font-size-2xl);text-shadow:2px 2px 0 #000">
                ${trendIcon} ${t2("insights." + ins.recentTrend)}
              </div>
              <div style="font-family:var(--mc-font);font-size:0.65rem;color:var(--mc-stone-gray)">${t2("insights.trend")}</div>
            </div>
          </div>

          <div class="mc-panel p-4 mb-6">
            <div class="flex items-center justify-between">
              <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-gold);text-shadow:1px 1px 0 #000">
                \u{1F3C6} ${t2("insights.longestStreak")}
              </span>
              <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-xl);color:var(--mc-gold);text-shadow:2px 2px 0 #000">
                ${ins.longestStreak} ${t2("insights.days")}
              </span>
            </div>
          </div>

          <div class="mb-6">
            <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-emerald-green);text-shadow:1px 1px 0 #000;margin-bottom:12px">
              \u{1F4CA} ${t2("mood.chartTitle")}
            </h4>
            <div class="space-y-2">
              ${distBars}
            </div>
          </div>

          ${weeklyChartHtml}
        </div>
      </div>`;
    },
    init(t2) {
      const token = get("token");
      const goMood = document.getElementById("insights-go-mood");
      if (goMood) {
        goMood.addEventListener("click", () => {
          playClick();
          setView("mood");
        });
      }
      fetch("/api/mood/insights?days=30", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then((d) => {
        this._insights = d;
        this._loading = false;
        this._rerender(t2);
      }).catch(() => {
        this._loading = false;
        this._rerender(t2);
      });
    },
    _rerender(t2) {
      const main = document.querySelector("main");
      if (!main) return;
      const viewContainer = main.querySelector(":scope > div");
      if (viewContainer) {
        viewContainer.innerHTML = this.render(t2);
        if (this._rebind) this._rebind();
      }
    },
    cleanup() {
      this._timers.forEach(clearTimeout);
      this._timers = [];
      this._rebind = null;
    }
  };
  var moodInsightsView = _moodInsights;
  var _breathing = {
    _timers: [],
    _phase: "idle",
    _cycleCount: 0,
    _selectedPattern: "478",
    render(t2) {
      const patterns = {
        "478": { name: t2("breathing.pattern478"), inhale: 4e3, hold: 7e3, exhale: 8e3, icon: "\u{1F31F}" },
        box: { name: t2("breathing.patternBox"), inhale: 4e3, hold: 4e3, exhale: 4e3, icon: "\u{1F4E6}" },
        calm: { name: t2("breathing.patternCalm"), inhale: 4e3, hold: 0, exhale: 6e3, icon: "\u{1F33F}" }
      };
      const patternBtns = Object.entries(patterns).map(([key, p]) => `
      <button data-breath-pattern="${key}" class="mc-btn px-4 py-2 ${this._selectedPattern === key ? "mc-btn-primary" : "mc-btn-stone"}">
        ${p.icon} ${p.name}
      </button>
    `).join("");
      const phase = this._phase;
      const phaseText = phase === "inhale" ? t2("breathing.inhale") : phase === "hold" ? t2("breathing.hold") : phase === "exhale" ? t2("breathing.exhale") : "";
      const phaseColor = phase === "inhale" ? "#4CAF50" : phase === "hold" ? "#FFB300" : phase === "exhale" ? "#00E5FF" : "#3F3F3F";
      const circleClass = phase === "inhale" ? "inhale" : phase === "hold" ? "hold" : phase === "exhale" ? "exhale" : "";
      let phaseDesc = "";
      if (phase !== "idle") {
        const desc = phase === "inhale" ? t2("breathing.inhaleDesc") : phase === "hold" ? t2("breathing.holdDesc") : t2("breathing.exhaleDesc");
        phaseDesc = `<p class="mt-4" style="color:var(--mc-stone-gray);font-family:var(--mc-font);font-size:var(--mc-font-size-sm)">${desc}</p>`;
      }
      let controlBtn = "";
      if (phase === "idle") {
        controlBtn = `<button id="breath-start" class="mc-btn mc-btn-primary px-8 py-3" style="font-size:var(--mc-font-size-md)">\u{1F31F} ${t2("breathing.start")}</button>`;
      } else {
        controlBtn = `<button id="breath-stop" class="mc-btn mc-btn-danger px-8 py-3" style="font-size:var(--mc-font-size-md)">\u23F9\uFE0F ${t2("breathing.stop")}</button>`;
      }
      let cycleHtml = "";
      if (this._cycleCount > 0) {
        cycleHtml = `
        <div class="text-center mb-6">
          <span class="mc-stat-number" style="color:var(--mc-diamond-blue)">${this._cycleCount}</span>
          <span class="mc-stat-label">${t2("breathing.cycles")}</span>
        </div>`;
      }
      const tips = [
        { icon: "\u{1F9D8}", text: t2("breathing.tip1") },
        { icon: "\u{1F33F}", text: t2("breathing.tip2") },
        { icon: "\u{1F48E}", text: t2("breathing.tip3") },
        { icon: "\u{1F6E1}\uFE0F", text: t2("breathing.tip4") }
      ];
      const tipsHtml = tips.map((tip) => `
      <div class="mc-gratitude-card p-4 flex items-start gap-3">
        <span class="text-2xl">${tip.icon}</span>
        <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);line-height:1.6">
          ${tip.text}
        </p>
      </div>
    `).join("");
      return `
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up mc-glow-green">
          <div class="mc-panel-header">\u{1FAC1} ${t2("breathing.title")}</div>
          <div class="p-6">
            <div class="flex flex-wrap gap-3 mb-8 justify-center">
              ${patternBtns}
            </div>

            <div class="flex flex-col items-center mb-8">
              <div class="relative flex items-center justify-center" style="width:220px;height:220px">
                <div class="mc-breathe-ring" style="border-color:${phaseColor}"></div>
                <div class="mc-breathe-circle ${circleClass}" style="border-color:${phaseColor};background-color:${phase !== "idle" ? phaseColor + "20" : "transparent"}">
                  <span class="mc-breathe-text" style="color:${phaseColor}">
                    ${phaseText || "\u{1FAC1}"}
                  </span>
                </div>
              </div>
              ${phaseDesc}
            </div>

            <div class="flex gap-3 justify-center mb-8">
              ${controlBtn}
            </div>

            ${cycleHtml}

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              ${tipsHtml}
            </div>
          </div>
        </div>
      </div>`;
    },
    init(t2) {
      document.querySelectorAll("[data-breath-pattern]").forEach((btn) => {
        btn.addEventListener("click", () => {
          playClick();
          this._selectedPattern = btn.dataset.breathPattern;
          this.stopExercise();
          this._rerender(t2);
        });
      });
      const startBtn = document.getElementById("breath-start");
      if (startBtn) {
        startBtn.addEventListener("click", () => {
          this.startExercise(t2);
        });
      }
      const stopBtn = document.getElementById("breath-stop");
      if (stopBtn) {
        stopBtn.addEventListener("click", () => {
          this.stopExercise();
          this._rerender(t2);
        });
      }
    },
    startExercise(t2) {
      this._timers.forEach(clearTimeout);
      this._timers = [];
      const patterns = {
        "478": { inhale: 4e3, hold: 7e3, exhale: 8e3 },
        box: { inhale: 4e3, hold: 4e3, exhale: 4e3 },
        calm: { inhale: 4e3, hold: 0, exhale: 6e3 }
      };
      const p = patterns[this._selectedPattern];
      this._phase = "inhale";
      this._rerender(t2);
      const t1 = setTimeout(() => {
        if (p.hold > 0) {
          this._phase = "hold";
          this._rerender(t2);
          const t22 = setTimeout(() => {
            this._phase = "exhale";
            this._rerender(t2);
            const t3 = setTimeout(() => {
              this._phase = "idle";
              this._cycleCount++;
              playSuccess();
              this._rerender(t2);
            }, p.exhale);
            this._timers.push(t3);
          }, p.hold);
          this._timers.push(t22);
        } else {
          this._phase = "exhale";
          this._rerender(t2);
          const t22 = setTimeout(() => {
            this._phase = "idle";
            this._cycleCount++;
            playSuccess();
            this._rerender(t2);
          }, p.exhale);
          this._timers.push(t22);
        }
      }, p.inhale);
      this._timers.push(t1);
    },
    stopExercise() {
      this._timers.forEach(clearTimeout);
      this._timers = [];
      this._phase = "idle";
    },
    _rerender(t2) {
      const main = document.querySelector("main");
      if (!main) return;
      const viewContainer = main.querySelector(":scope > div");
      if (viewContainer) {
        viewContainer.innerHTML = this.render(t2);
        if (this._rebind) this._rebind();
      }
    },
    cleanup() {
      this.stopExercise();
      this._rebind = null;
    }
  };
  var breathingView = _breathing;
  var _pomodoro = {
    _timers: [],
    _mode: "focus",
    _timeLeft: 25 * 60,
    _isRunning: false,
    _sessions: 0,
    _interval: null,
    render(t2) {
      const user = get("user");
      if (!user) return "";
      const minutes = Math.floor(this._timeLeft / 60);
      const seconds = this._timeLeft % 60;
      const progress = this._mode === "focus" ? (25 * 60 - this._timeLeft) / (25 * 60) * 100 : (5 * 60 - this._timeLeft) / (5 * 60) * 100;
      const timeStr = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
      const timerColor = this._mode === "focus" ? "var(--mc-emerald-green)" : "var(--mc-gold)";
      let sessionDots = "";
      if (this._sessions > 0) {
        const dots = Array.from(
          { length: Math.min(this._sessions, 12) },
          () => `<div class="w-4 h-4 mc-border" style="background:var(--mc-redstone-red)"></div>`
        ).join("");
        const extra = this._sessions > 12 ? `<span style="font-family:var(--mc-font);font-size:0.6rem;color:var(--mc-stone-gray)">+${this._sessions - 12}</span>` : "";
        sessionDots = `<div class="flex justify-center gap-2 mt-6">${dots}${extra}</div>`;
      }
      return `
      <div class="max-w-2xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up mc-panel-glow-green">
          <div class="mc-panel-header flex items-center justify-between">
            <span>\u{1F345} ${t2("pomodoro.title")}</span>
            <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-gold)">
              ${t2("pomodoro.sessions")}: ${this._sessions}
            </span>
          </div>

          <div class="flex gap-2 mb-8">
            <button id="pomodoro-focus" class="mc-btn mc-btn-press flex-1 ${this._mode === "focus" ? "mc-btn-primary" : "mc-btn-stone"}" style="font-size:var(--mc-font-size-sm)">
              \u26CF\uFE0F ${t2("pomodoro.focus")}
            </button>
            <button id="pomodoro-break" class="mc-btn mc-btn-press flex-1 ${this._mode === "break" ? "mc-btn-gold" : "mc-btn-stone"}" style="font-size:var(--mc-font-size-sm)">
              \u2615 ${t2("pomodoro.break")}
            </button>
          </div>

          <div class="flex justify-center mb-8">
            <div class="mc-countdown-ring" style="--progress:${progress};width:200px;height:200px">
              <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-3xl);color:${timerColor};text-shadow:2px 2px 0 #000">
                ${timeStr}
              </span>
            </div>
          </div>

          <p class="text-center mb-6" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">
            ${this._mode === "focus" ? "\u26CF\uFE0F " + t2("pomodoro.focusTip") : "\u2615 " + t2("pomodoro.breakTip")}
          </p>

          <div class="flex gap-3 justify-center">
            <button id="pomodoro-toggle" class="mc-btn mc-btn-press px-8 ${this._isRunning ? "mc-btn-danger" : "mc-btn-primary"}" style="font-size:var(--mc-font-size-md)">
              ${this._isRunning ? "\u23F8 " + t2("pomodoro.pause") : "\u25B6 " + t2("pomodoro.start")}
            </button>
            <button id="pomodoro-reset" class="mc-btn mc-btn-stone px-6" style="font-size:var(--mc-font-size-md)">
              \u{1F504} ${t2("pomodoro.reset")}
            </button>
          </div>

          ${sessionDots}
        </div>
      </div>`;
    },
    init(t2) {
      const focusBtn = document.getElementById("pomodoro-focus");
      const breakBtn = document.getElementById("pomodoro-break");
      const switchMode = (mode) => {
        playClick();
        this._mode = mode;
        this._isRunning = false;
        this._timeLeft = mode === "focus" ? 25 * 60 : 5 * 60;
        if (this._interval) {
          clearInterval(this._interval);
          this._interval = null;
        }
        this._rerender(t2);
        this._rebindInit(t2);
      };
      if (focusBtn) focusBtn.addEventListener("click", () => switchMode("focus"));
      if (breakBtn) breakBtn.addEventListener("click", () => switchMode("break"));
      const toggleBtn = document.getElementById("pomodoro-toggle");
      if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
          playClick();
          this._isRunning = !this._isRunning;
          if (this._isRunning) {
            this._startInterval(t2);
          } else {
            if (this._interval) {
              clearInterval(this._interval);
              this._interval = null;
            }
          }
          this._rerender(t2);
          this._rebindInit(t2);
        });
      }
      const resetBtn = document.getElementById("pomodoro-reset");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          playClick();
          this._isRunning = false;
          if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
          }
          this._timeLeft = this._mode === "focus" ? 25 * 60 : 5 * 60;
          this._rerender(t2);
          this._rebindInit(t2);
        });
      }
    },
    _startInterval(t2) {
      if (this._interval) clearInterval(this._interval);
      this._interval = setInterval(() => {
        this._timeLeft--;
        if (this._timeLeft <= 0) {
          clearInterval(this._interval);
          this._interval = null;
          this._isRunning = false;
          if (this._mode === "focus") {
            this._sessions++;
            playSuccess();
            showToast(t2("pomodoro.completed"), "success");
          } else {
            playClick();
          }
          this._rerender(t2);
          this._rebindInit(t2);
          return;
        }
        const timerSpan = document.querySelector(".mc-countdown-ring span");
        if (timerSpan) {
          const minutes = Math.floor(this._timeLeft / 60);
          const seconds = this._timeLeft % 60;
          timerSpan.textContent = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
        }
        const ring = document.querySelector(".mc-countdown-ring");
        if (ring) {
          const progress = this._mode === "focus" ? (25 * 60 - this._timeLeft) / (25 * 60) * 100 : (5 * 60 - this._timeLeft) / (5 * 60) * 100;
          ring.style.setProperty("--progress", progress);
        }
      }, 1e3);
    },
    _rebindInit(t2) {
      const toggleBtn = document.getElementById("pomodoro-toggle");
      const resetBtn = document.getElementById("pomodoro-reset");
      const focusBtn = document.getElementById("pomodoro-focus");
      const breakBtn = document.getElementById("pomodoro-break");
      if (focusBtn) focusBtn.addEventListener("click", () => {
        playClick();
        this._mode = "focus";
        this._isRunning = false;
        this._timeLeft = 25 * 60;
        if (this._interval) {
          clearInterval(this._interval);
          this._interval = null;
        }
        this._rerender(t2);
        this._rebindInit(t2);
      });
      if (breakBtn) breakBtn.addEventListener("click", () => {
        playClick();
        this._mode = "break";
        this._isRunning = false;
        this._timeLeft = 5 * 60;
        if (this._interval) {
          clearInterval(this._interval);
          this._interval = null;
        }
        this._rerender(t2);
        this._rebindInit(t2);
      });
      if (toggleBtn) toggleBtn.addEventListener("click", () => {
        playClick();
        this._isRunning = !this._isRunning;
        if (this._isRunning) {
          this._startInterval(t2);
        } else {
          if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
          }
        }
        this._rerender(t2);
        this._rebindInit(t2);
      });
      if (resetBtn) resetBtn.addEventListener("click", () => {
        playClick();
        this._isRunning = false;
        if (this._interval) {
          clearInterval(this._interval);
          this._interval = null;
        }
        this._timeLeft = this._mode === "focus" ? 25 * 60 : 5 * 60;
        this._rerender(t2);
        this._rebindInit(t2);
      });
    },
    _rerender(t2) {
      const main = document.querySelector("main");
      if (!main) return;
      const viewContainer = main.querySelector(":scope > div");
      if (viewContainer) {
        viewContainer.innerHTML = this.render(t2);
        if (this._rebind) this._rebind();
      }
    },
    cleanup() {
      if (this._interval) {
        clearInterval(this._interval);
        this._interval = null;
      }
      this._timers.forEach(clearTimeout);
      this._timers = [];
      this._rebind = null;
    }
  };
  var pomodoroView = _pomodoro;
  var _selfcare = {
    _timers: [],
    _notifiedDone: false,
    render(t2) {
      const user = get("user");
      if (!user) return "";
      const selfcareTasks = get("selfcareTasks");
      const selfcareDate = get("selfcareDate");
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const isToday = selfcareDate === today;
      const tasks = isToday ? selfcareTasks : {};
      const taskKeys = ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8"];
      const completedCount = taskKeys.filter((k) => tasks[k]).length;
      const progress = Math.round(completedCount / taskKeys.length * 100);
      const allDone = completedCount === taskKeys.length;
      const taskItems = taskKeys.map((key) => {
        const done = tasks[key];
        return `
        <button data-selfcare-task="${key}" class="w-full text-left p-4 mc-border-2 transition-all cursor-pointer group ${done ? "bg-[rgba(93,140,62,0.15)] border-[var(--mc-emerald-green)]" : "bg-[var(--mc-bg)] hover:border-[var(--mc-light-gray)]"}">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 mc-border-2 flex items-center justify-center text-sm transition-all" style="background:${done ? "var(--mc-emerald-green)" : "var(--mc-bg-dark)"}">
              ${done ? "\u2713" : ""}
            </div>
            <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:${done ? "var(--mc-emerald-green)" : "var(--mc-light-gray)"};text-decoration:${done ? "line-through" : "none"};line-height:1.8;transition:all 0.3s">
              ${t2("selfcare." + key)}
            </span>
            ${done ? '<span class="ml-auto text-sm">\u{1F49A}</span>' : ""}
          </div>
        </button>`;
      }).join("");
      let allDoneHtml = "";
      if (allDone) {
        allDoneHtml = `
        <div class="mt-6 text-center">
          <div class="text-4xl mb-2 animate-pixel-bounce">\u{1F31F}</div>
          <p class="mc-text-glow-gold" style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-gold)">
            ${t2("selfcare.allDone")}
          </p>
        </div>`;
      }
      return `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up mc-panel-glow-green">
          <div class="mc-panel-header">\u{1F49A} ${t2("selfcare.title")}</div>
          <p class="mb-6" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray);line-height:1.8">
            ${t2("selfcare.subtitle")}
          </p>

          <div class="flex items-center gap-6 mb-8">
            <div class="mc-countdown-ring" style="--progress:${progress};width:100px;height:100px">
              <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-lg);color:${allDone ? "var(--mc-gold)" : "var(--mc-emerald-green)"};text-shadow:2px 2px 0 #000">
                ${progress}%
              </span>
            </div>
            <div>
              <h4 style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-diamond-blue);text-shadow:2px 2px 0 #000">
                ${t2("selfcare.progress")}
              </h4>
              <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">
                ${completedCount}/${taskKeys.length} ${t2("selfcare.completed")}
              </p>
              ${allDone ? `<span class="mc-streak-fire" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm)">\u{1F31F} ${t2("selfcare.allDone").split("!")[0]}!</span>` : ""}
            </div>
          </div>

          <div class="mc-xp-bar mb-8">
            <div class="mc-xp-bar-fill" style="width:${progress}%"></div>
          </div>

          <div class="space-y-3">
            ${taskItems}
          </div>

          ${allDoneHtml}
        </div>
      </div>`;
    },
    init(t2) {
      const selfcareTasks = get("selfcareTasks");
      const selfcareDate = get("selfcareDate");
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const isToday = selfcareDate === today;
      const tasks = isToday ? selfcareTasks : {};
      const taskKeys = ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8"];
      const completedCount = taskKeys.filter((k) => tasks[k]).length;
      const allDone = completedCount === taskKeys.length;
      if (allDone && isToday && !this._notifiedDone) {
        const notified = sessionStorage.getItem("selfcare-all-done-today");
        if (!notified) {
          showToast(t2("selfcare.allDone"), "success");
          playSuccess();
          sessionStorage.setItem("selfcare-all-done-today", "1");
          this._notifiedDone = true;
        }
      }
      document.querySelectorAll("[data-selfcare-task]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const key = btn.dataset.selfcareTask;
          playClick();
          toggleSelfcareTask(key);
          this._rerender(t2);
        });
      });
    },
    _rerender(t2) {
      const main = document.querySelector("main");
      if (!main) return;
      const viewContainer = main.querySelector(":scope > div");
      if (viewContainer) {
        viewContainer.innerHTML = this.render(t2);
        if (this._rebind) this._rebind();
      }
    },
    cleanup() {
      this._timers.forEach(clearTimeout);
      this._timers = [];
      this._notifiedDone = false;
      this._rebind = null;
    }
  };
  var selfcareView = _selfcare;
  var _gratitude = {
    _timers: [],
    _entries: [],
    _newEntry: "",
    _selectedEmoji: "\u{1F49A}",
    _loading: false,
    render(t2) {
      const user = get("user");
      const emojis = ["\u{1F49A}", "\u{1F64F}", "\u{1F31F}", "\u2764\uFE0F", "\u{1F9E0}", "\u{1F308}", "\u{1F48E}", "\u{1F33B}", "\u{1FAC2}", "\u26A1"];
      const emojiPicker = emojis.map((e) => `
      <button data-gratitude-emoji="${e}" class="text-2xl p-1 cursor-pointer transition-transform ${this._selectedEmoji === e ? "scale-125" : "opacity-60 hover:opacity-100"}">
        ${e}
      </button>
    `).join("");
      let composeHtml = "";
      if (user) {
        composeHtml = `
        <div class="mb-8 p-4" style="background:var(--mc-bg-dark);border:3px solid #000;border-radius:4px">
          <p class="mb-3" style="color:var(--mc-gold);font-family:var(--mc-font);font-size:var(--mc-font-size-md);text-shadow:1px 1px 0 #000">
            ${t2("gratitude.prompt")}
          </p>
          <div class="flex flex-wrap gap-2 mb-3">
            ${emojiPicker}
          </div>
          <div class="flex gap-2">
            <input id="gratitude-input" type="text" class="mc-input flex-1" placeholder="${t2("gratitude.placeholder")}" value="${this._newEntry.replace(/"/g, "&quot;")}" maxlength="200" aria-label="Gratitude entry" />
            <button id="gratitude-submit" class="mc-btn mc-btn-gold px-4" ${this._loading || !this._newEntry.trim() ? "disabled" : ""}>
              ${this._loading ? "\u26CF\uFE0F" : t2("gratitude.post")}
            </button>
          </div>
        </div>`;
      }
      let wallHtml = "";
      if (this._entries.length === 0) {
        wallHtml = `
        <div class="col-span-2 text-center py-12">
          <span class="text-4xl block mb-4">\u{1F33B}</span>
          <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-stone-gray)">
            ${t2("gratitude.empty")}
          </p>
        </div>`;
      } else {
        wallHtml = this._entries.map((entry) => `
        <div class="mc-gratitude-card p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xl">${entry.emoji}</span>
              <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-emerald-green);text-shadow:1px 1px 0 #000">
                ${entry.username}
              </span>
            </div>
            <button data-gratitude-like="${entry.id}" class="flex items-center gap-1 cursor-pointer hover:scale-110 transition-transform">
              <span class="mc-gratitude-heart">\u2764\uFE0F</span>
              <span style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-redstone-red)">${entry.likes}</span>
            </button>
          </div>
          <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-text);line-height:1.8">
            ${entry.content}
          </p>
          <p class="mt-2 mc-chat-timestamp">
            ${new Date(entry.createdAt).toLocaleDateString()}
          </p>
        </div>
      `).join("");
      }
      return `
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up mc-glow-gold">
          <div class="mc-panel-header">\u{1F64F} ${t2("gratitude.title")}</div>
          <div class="p-6">
            ${composeHtml}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto" style="scrollbar-width:thin">
              ${wallHtml}
            </div>
          </div>
        </div>
      </div>`;
    },
    init(t2) {
      const token = get("token");
      const user = get("user");
      const loadEntries = async () => {
        try {
          const res = await fetch("/api/gratitude");
          if (res.ok) {
            const data = await res.json();
            this._entries = data.entries || [];
            this._rerender(t2);
          }
        } catch {
        }
      };
      loadEntries();
      document.querySelectorAll("[data-gratitude-emoji]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this._selectedEmoji = btn.dataset.gratitudeEmoji;
          this._rerender(t2);
        });
      });
      const input = document.getElementById("gratitude-input");
      if (input) {
        input.addEventListener("input", (e) => {
          this._newEntry = e.target.value;
        });
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") this._submitEntry(t2);
        });
      }
      const submitBtn = document.getElementById("gratitude-submit");
      if (submitBtn) {
        submitBtn.addEventListener("click", () => this._submitEntry(t2));
      }
      document.querySelectorAll("[data-gratitude-like]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (!token) {
            showToast(t2("errors.loginRequired"), "error");
            return;
          }
          const id = btn.dataset.gratitudeLike;
          this._entries = this._entries.map((e) => e.id === id ? { ...e, likes: e.likes + 1 } : e);
          this._rerender(t2);
          fetch(`/api/gratitude/${id}/like`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {
          });
        });
      });
    },
    async _submitEntry(t2) {
      if (!this._newEntry.trim()) return;
      const token = get("token");
      const user = get("user");
      this._loading = true;
      this._rerender(t2);
      try {
        const res = await fetch("/api/gratitude", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content: this._newEntry.trim(), emoji: this._selectedEmoji })
        });
        if (res.ok) {
          const data = await res.json();
          this._entries = [data.entry, ...this._entries].slice(0, 50);
          this._newEntry = "";
          showToast(t2("common.success"), "success");
        }
      } catch {
        this._entries = [{
          id: Date.now().toString(),
          username: user?.username || "Steve",
          content: this._newEntry.trim(),
          emoji: this._selectedEmoji,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          likes: 0
        }, ...this._entries].slice(0, 50);
        this._newEntry = "";
      }
      this._loading = false;
      this._rerender(t2);
    },
    _rerender(t2) {
      const main = document.querySelector("main");
      if (!main) return;
      const viewContainer = main.querySelector(":scope > div");
      if (viewContainer) {
        viewContainer.innerHTML = this.render(t2);
        if (this._rebind) this._rebind();
      }
    },
    cleanup() {
      this._timers.forEach(clearTimeout);
      this._timers = [];
      this._rebind = null;
    }
  };
  var gratitudeView = _gratitude;
  var _affirmations = {
    _timers: [],
    _currentIdx: -1,
    _showAll: false,
    _favorites: [],
    _getAffirmations(t2) {
      return [
        { text: t2("affirm.a1"), category: t2("affirm.catSelf") },
        { text: t2("affirm.a2"), category: t2("affirm.catSelf") },
        { text: t2("affirm.a3"), category: t2("affirm.catStrength") },
        { text: t2("affirm.a4"), category: t2("affirm.catGrowth") },
        { text: t2("affirm.a5"), category: t2("affirm.catSelf") },
        { text: t2("affirm.a6"), category: t2("affirm.catStrength") },
        { text: t2("affirm.a7"), category: t2("affirm.catGrowth") },
        { text: t2("affirm.a8"), category: t2("affirm.catSelf") },
        { text: t2("affirm.a9"), category: t2("affirm.catStrength") },
        { text: t2("affirm.a10"), category: t2("affirm.catGrowth") },
        { text: t2("affirm.a11"), category: t2("affirm.catSelf") },
        { text: t2("affirm.a12"), category: t2("affirm.catStrength") }
      ];
    },
    _getDayIndex() {
      const today = /* @__PURE__ */ new Date();
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 864e5);
      return dayOfYear % 12;
    },
    render(t2) {
      const affirmations = this._getAffirmations(t2);
      const dayIndex = this._getDayIndex();
      const safeIdx = this._currentIdx === -1 ? dayIndex : this._currentIdx;
      const current = affirmations[safeIdx];
      if (!current) return "";
      const catColors = {
        [t2("affirm.catSelf")]: "#4CAF50",
        [t2("affirm.catStrength")]: "#FFB300",
        [t2("affirm.catGrowth")]: "#00E5FF"
      };
      const currentColor = catColors[current.category] || "#4CAF50";
      const isFav = this._favorites.includes(safeIdx.toString());
      let favoritesHtml = "";
      if (this._favorites.length > 0) {
        const favCards = this._favorites.map((fIdx) => {
          const a = affirmations[parseInt(fIdx)];
          if (!a) return "";
          return `
          <div class="mc-gratitude-card p-3">
            <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">
              &ldquo;${a.text}&rdquo;
            </p>
          </div>`;
        }).join("");
        favoritesHtml = `
        <div class="mb-8">
          <h3 class="mb-4" style="font-family:var(--mc-font);font-size:var(--mc-font-size-md);color:var(--mc-redstone-red);text-shadow:1px 1px 0 #000">
            \u{1F496} ${t2("affirm.favorites")} (${this._favorites.length})
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${favCards}
          </div>
        </div>`;
      }
      let allHtml = "";
      if (this._showAll) {
        const categories = [...new Set(affirmations.map((a) => a.category))];
        const catSections = categories.map((cat) => {
          const catAffirmations = affirmations.filter((a) => a.category === cat);
          const catColor = catColors[cat] || "#4CAF50";
          const cards = catAffirmations.map((a) => {
            const idx = affirmations.indexOf(a);
            return `
            <div data-affirm-goto="${idx}" class="mc-gratitude-card p-3 cursor-pointer hover:border-[var(--mc-diamond-blue)] transition-colors">
              <p style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-light-gray)">
                &ldquo;${a.text}&rdquo;
              </p>
            </div>`;
          }).join("");
          return `
          <div class="mb-4">
            <h4 class="mb-2" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:${catColor};text-shadow:1px 1px 0 #000">
              ${cat}
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${cards}
            </div>
          </div>`;
        }).join("");
        allHtml = `<div>${catSections}</div>`;
      }
      return `
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="mc-panel animate-pixel-slide-up mc-glow-purple">
          <div class="mc-panel-header">\u2728 ${t2("affirm.title")}</div>
          <div class="p-6">
            <div class="mc-affirmation-card mb-8 p-8 text-center">
              <div class="mb-4">
                <span class="inline-block px-3 py-1" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);background:${currentColor}30;color:${currentColor};border:2px solid ${currentColor};text-shadow:1px 1px 0 #000">
                  ${current.category}
                </span>
              </div>
              <p class="mc-affirmation-text mb-6" style="font-family:var(--mc-font);font-size:var(--mc-font-size-xl);color:var(--mc-white);text-shadow:2px 2px 0 #000;line-height:1.8">
                &ldquo;${current.text}&rdquo;
              </p>
              <div class="flex items-center justify-center gap-4">
                <button id="affirm-prev" class="mc-btn mc-btn-stone px-4 py-2">\u25C0</button>
                <button id="affirm-fav" class="text-2xl cursor-pointer hover:scale-125 transition-transform">
                  ${isFav ? "\u{1F496}" : "\u{1F90D}"}
                </button>
                <button id="affirm-next" class="mc-btn mc-btn-stone px-4 py-2">\u25B6</button>
              </div>
              <p class="mt-4" style="font-family:var(--mc-font);font-size:var(--mc-font-size-sm);color:var(--mc-stone-gray)">
                ${safeIdx + 1} / ${affirmations.length}
              </p>
            </div>

            ${favoritesHtml}

            <button id="affirm-toggle-all" class="mc-btn mc-btn-diamond mb-4 px-4 py-2">
              ${this._showAll ? "\u{1F53C} " + t2("affirm.hideAll") : "\u{1F4CB} " + t2("affirm.showAll")}
            </button>

            ${allHtml}
          </div>
        </div>
      </div>`;
    },
    init(t2) {
      const affirmations = this._getAffirmations(t2);
      const dayIndex = this._getDayIndex();
      const prevBtn = document.getElementById("affirm-prev");
      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          playSuccess();
          const curr = this._currentIdx === -1 ? dayIndex : this._currentIdx;
          this._currentIdx = (curr - 1 + affirmations.length) % affirmations.length;
          this._rerender(t2);
        });
      }
      const nextBtn = document.getElementById("affirm-next");
      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          playSuccess();
          const curr = this._currentIdx === -1 ? dayIndex : this._currentIdx;
          this._currentIdx = (curr + 1) % affirmations.length;
          this._rerender(t2);
        });
      }
      const favBtn = document.getElementById("affirm-fav");
      if (favBtn) {
        favBtn.addEventListener("click", () => {
          const safeIdx = this._currentIdx === -1 ? dayIndex : this._currentIdx;
          const idxStr = safeIdx.toString();
          if (this._favorites.includes(idxStr)) {
            this._favorites = this._favorites.filter((f) => f !== idxStr);
          } else {
            this._favorites = [...this._favorites, idxStr];
          }
          this._rerender(t2);
        });
      }
      const toggleAllBtn = document.getElementById("affirm-toggle-all");
      if (toggleAllBtn) {
        toggleAllBtn.addEventListener("click", () => {
          playClick();
          this._showAll = !this._showAll;
          this._rerender(t2);
        });
      }
      document.querySelectorAll("[data-affirm-goto]").forEach((el) => {
        el.addEventListener("click", () => {
          playSuccess();
          this._currentIdx = parseInt(el.dataset.affirmGoto);
          window.scrollTo({ top: 0, behavior: "smooth" });
          this._rerender(t2);
        });
      });
    },
    _rerender(t2) {
      const main = document.querySelector("main");
      if (!main) return;
      const viewContainer = main.querySelector(":scope > div");
      if (viewContainer) {
        viewContainer.innerHTML = this.render(t2);
        if (this._rebind) this._rebind();
      }
    },
    cleanup() {
      this._timers.forEach(clearTimeout);
      this._timers = [];
      this._rebind = null;
    }
  };
  var affirmationsView = _affirmations;

  // public/js/views-features.js
  function authHeaders() {
    const token = get("token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }
  function jsonHeaders() {
    return { ...authHeaders(), "Content-Type": "application/json" };
  }
  function mcFont() {
    return "font-family: var(--mc-font);";
  }
  function sm() {
    return `font-size: var(--mc-font-size-sm);`;
  }
  function md() {
    return `font-size: var(--mc-font-size-md);`;
  }
  function mcStyle(extra = "") {
    return `${mcFont()} ${extra}`;
  }
  var _chCompleted = [];
  var _chStreak = 0;
  var challengesView = {
    render(t2) {
      return `
      <div class="max-w-3xl mx-auto px-4 py-8" id="view-challenges">
        <div class="mc-panel animate-pixel-slide-up mc-panel-glow-purple">
          <div class="mc-panel-header flex items-center justify-between">
            <span>\u2694\uFE0F ${t2("challenges.title")}</span>
            <span class="ch-streak-badge mc-streak-fire" style="${mcStyle(sm())} color: var(--mc-gold); display: none;"></span>
          </div>
          <p class="mb-6" style="${mcStyle(sm())} color: var(--mc-light-gray); line-height: 1.8;">
            ${t2("challenges.subtitle")}
          </p>
          <div id="ch-today-card"></div>
          <div class="mc-pixel-divider-sword my-6"></div>
          <div class="text-center">
            <h4 style="${mcStyle(md())} color: var(--mc-gold); text-shadow: 2px 2px 0 #000;">${t2("challenges.streak")}</h4>
            <div class="flex justify-center gap-1 my-4" id="ch-streak-dots"></div>
          </div>
          <div class="mc-pixel-divider-heart my-6"></div>
          <h4 class="mb-4" style="${mcStyle(sm())} color: var(--mc-stone-gray);">${t2("challenges.history")}</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="ch-history"></div>
        </div>
      </div>
    `;
    },
    init(t2) {
      const dayOfYear = Math.floor((Date.now() - new Date((/* @__PURE__ */ new Date()).getFullYear(), 0, 0).getTime()) / 864e5);
      try {
        const saved = JSON.parse(localStorage.getItem("mc-challenges") || "{}");
        _chCompleted = saved.completed || [];
        let s = 0;
        for (let d = 0; d < 365; d++) {
          const key = `challenge_${dayOfYear - d}`;
          if (_chCompleted.includes(key)) s++;
          else break;
        }
        _chStreak = s;
      } catch {
        _chCompleted = [];
        _chStreak = 0;
      }
      _renderChallenges(t2);
      document.getElementById("view-challenges")?.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-ch-complete]");
        if (!btn) return;
        const todayKey = `challenge_${dayOfYear}`;
        if (_chCompleted.includes(todayKey)) return;
        _chCompleted = [..._chCompleted, todayKey];
        _chStreak++;
        localStorage.setItem("mc-challenges", JSON.stringify({ completed: _chCompleted }));
        playSuccess();
        showToast(t2("challenges.completed"), "success");
        _renderChallenges(t2);
      });
    },
    cleanup() {
      _chCompleted = [];
      _chStreak = 0;
    }
  };
  function _renderChallenges(t2) {
    const dayOfYear = Math.floor((Date.now() - new Date((/* @__PURE__ */ new Date()).getFullYear(), 0, 0).getTime()) / 864e5);
    const allChallenges = [
      t2("challenges.ch1"),
      t2("challenges.ch2"),
      t2("challenges.ch3"),
      t2("challenges.ch4"),
      t2("challenges.ch5"),
      t2("challenges.ch6"),
      t2("challenges.ch7")
    ];
    const todayKey = `challenge_${dayOfYear}`;
    const isCompleted = _chCompleted.includes(todayKey);
    const todayChallenge = allChallenges[dayOfYear % allChallenges.length];
    const streakBadge = document.querySelector(".ch-streak-badge");
    if (streakBadge) {
      if (_chStreak > 0) {
        streakBadge.style.display = "";
        streakBadge.textContent = `${_chStreak} ${t2("challenges.days")} \u{1F525}`;
      } else {
        streakBadge.style.display = "none";
      }
    }
    const todayCard = document.getElementById("ch-today-card");
    if (todayCard) {
      todayCard.innerHTML = `
      <div class="mc-corner-brackets p-6 mb-6 transition-all ${isCompleted ? "opacity-60" : ""}" style="background: ${isCompleted ? "var(--mc-bg)" : "rgba(93,140,62,0.1)"}; border: 2px solid var(--mc-emerald-green);">
        <div class="flex items-start gap-3">
          <div class="text-4xl mc-float-gentle">\u2694\uFE0F</div>
          <div class="flex-1">
            <h3 class="mb-2" style="${mcStyle(md())} color: var(--mc-diamond-blue); text-shadow: 2px 2px 0 #000;">
              ${isCompleted ? "\u2705 " : "\u{1F3AF} "}${t2("challenges.title")}
            </h3>
            <p style="${mcStyle(sm())} color: var(--mc-light-gray); line-height: 1.8;">${todayChallenge}</p>
            ${isCompleted ? `<div class="mt-2 mc-badge-new" style="${mcStyle("font-size: 0.7rem;")}">${t2("challenges.xpReward")}</div>` : ""}
          </div>
        </div>
        ${!isCompleted ? `<button data-ch-complete class="mc-btn mc-btn-primary mc-btn-press ${sm()} mt-4 w-full">\u2705 ${t2("challenges.markDone")}</button>` : ""}
      </div>
    `;
    }
    const dotsContainer = document.getElementById("ch-streak-dots");
    if (dotsContainer) {
      dotsContainer.innerHTML = Array.from({ length: 7 }, (_, i) => {
        const active = i < _chStreak;
        return `<div class="w-10 h-10 mc-border flex items-center justify-center text-sm" style="background: ${active ? "var(--mc-emerald-green)" : "var(--mc-bg-dark)"}; opacity: ${active ? 1 : 0.3};">${active ? "\u2713" : "\u25CB"}</div>`;
      }).join("");
    }
    const historyContainer = document.getElementById("ch-history");
    if (historyContainer) {
      historyContainer.innerHTML = allChallenges.map((ch, i) => {
        const chKey = `challenge_${dayOfYear - (dayOfYear % allChallenges.length - i + allChallenges.length) % allChallenges.length}`;
        const done = _chCompleted.includes(chKey);
        return `
        <div class="p-3 mc-border-2 text-left ${done ? "bg-[rgba(93,140,62,0.1)]" : ""}" style="opacity: ${done ? 1 : 0.5};">
          <span class="text-sm mr-2">${done ? "\u2705" : "\u2B1C"}</span>
          <span style="${mcStyle("font-size: 0.7rem;")} color: var(--mc-light-gray); line-height: 1.6;">${ch}</span>
        </div>
      `;
      }).join("");
    }
  }
  var _copingCat = "all";
  var _copingExpanded = null;
  var _copingFavs = [];
  var copingView = {
    render(t2) {
      return `
      <div class="max-w-4xl mx-auto px-4 py-8" id="view-coping">
        <div class="mc-panel mc-glow-green animate-pixel-slide-up">
          <div class="mc-panel-header">\u{1F9F0} ${t2("coping.title")}</div>
          <p class="mb-4" style="${mcStyle(sm())} color: var(--mc-light-gray);">
            ${t2("coping.subtitle")}
          </p>
          <div class="flex flex-wrap gap-2 mb-6" id="coping-categories"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="coping-cards"></div>
        </div>
      </div>
    `;
    },
    init(t2) {
      try {
        _copingFavs = JSON.parse(localStorage.getItem("mc-coping-favorites") || "[]");
      } catch {
        _copingFavs = [];
      }
      _copingCat = "all";
      _copingExpanded = null;
      _renderCoping(t2);
      const root = document.getElementById("view-coping");
      root?.addEventListener("click", (e) => {
        const catBtn = e.target.closest("[data-coping-cat]");
        if (catBtn) {
          _copingCat = catBtn.dataset.copingCat;
          _copingExpanded = null;
          playClick();
          _renderCoping(t2);
          return;
        }
        const favBtn = e.target.closest("[data-coping-fav]");
        if (favBtn) {
          e.stopPropagation();
          const id = favBtn.dataset.copingFav;
          playClick();
          if (_copingFavs.includes(id)) {
            _copingFavs = _copingFavs.filter((f) => f !== id);
          } else {
            _copingFavs = [..._copingFavs, id];
          }
          try {
            localStorage.setItem("mc-coping-favorites", JSON.stringify(_copingFavs));
          } catch {
          }
          _renderCoping(t2);
          return;
        }
        const breathBtn = e.target.closest("[data-coping-breathe]");
        if (breathBtn) {
          e.stopPropagation();
          setView("breathing");
          return;
        }
        const card = e.target.closest("[data-coping-card]");
        if (card) {
          const id = card.dataset.copingCard;
          _copingExpanded = _copingExpanded === id ? null : id;
          playClick();
          _renderCoping(t2);
          return;
        }
      });
    },
    cleanup() {
      _copingCat = "all";
      _copingExpanded = null;
      _copingFavs = [];
    }
  };
  function _getCopingStrategies(t2) {
    return [
      { id: "s1", cat: "breathing", emoji: "\u{1F30A}", title: t2("coping.s1Title"), desc: t2("coping.s1Desc"), steps: t2("coping.s1Steps") },
      { id: "s2", cat: "breathing", emoji: "\u2B1C", title: t2("coping.s2Title"), desc: t2("coping.s2Desc"), steps: t2("coping.s2Steps") },
      { id: "s3", cat: "breathing", emoji: "\u{1F56F}\uFE0F", title: t2("coping.s3Title"), desc: t2("coping.s3Desc"), steps: "" },
      { id: "s4", cat: "grounding", emoji: "\u{1F590}\uFE0F", title: t2("coping.s4Title"), desc: t2("coping.s4Desc"), steps: "" },
      { id: "s5", cat: "grounding", emoji: "\u{1F440}", title: t2("coping.s5Title"), desc: t2("coping.s5Desc"), steps: "" },
      { id: "s6", cat: "positiveThinking", emoji: "\u{1F31F}", title: t2("coping.s6Title"), desc: t2("coping.s6Desc"), steps: "" },
      { id: "s7", cat: "positiveThinking", emoji: "\u{1F4DD}", title: t2("coping.s7Title"), desc: t2("coping.s7Desc"), steps: "" },
      { id: "s8", cat: "physical", emoji: "\u{1F6B6}", title: t2("coping.s8Title"), desc: t2("coping.s8Desc"), steps: "" },
      { id: "s9", cat: "physical", emoji: "\u{1F938}", title: t2("coping.s9Title"), desc: t2("coping.s9Desc"), steps: "" },
      { id: "s10", cat: "social", emoji: "\u{1F4AC}", title: t2("coping.s10Title"), desc: t2("coping.s10Desc"), steps: "" },
      { id: "s11", cat: "social", emoji: "\u{1F91D}", title: t2("coping.s11Title"), desc: t2("coping.s11Desc"), steps: "" },
      { id: "s12", cat: "creative", emoji: "\u{1F3A8}", title: t2("coping.s12Title"), desc: t2("coping.s12Desc"), steps: "" }
    ];
  }
  function _renderCoping(t2) {
    const categories = ["all", "breathing", "grounding", "positiveThinking", "physical", "social", "creative"];
    const catIcons = { all: "\u{1F310}", breathing: "\u{1FAC1}", grounding: "\u{1F331}", positiveThinking: "\u{1F4A1}", physical: "\u{1F3C3}", social: "\u{1F465}", creative: "\u{1F3A8}" };
    const strategies = _getCopingStrategies(t2);
    const showFavorites = _copingCat === "favorites";
    const displayed = showFavorites ? strategies.filter((s) => _copingFavs.includes(s.id)) : _copingCat === "all" ? strategies : strategies.filter((s) => s.cat === _copingCat);
    const catContainer = document.getElementById("coping-categories");
    if (catContainer) {
      const allCats = [...categories, "favorites"];
      catContainer.innerHTML = allCats.map((c) => {
        const label = c === "favorites" ? `\u2B50 ${t2("coping.favorites")} (${_copingFavs.length})` : `${catIcons[c]} ${t2(`coping.${c}`)}`;
        return `<button class="mc-coping-category-btn ${_copingCat === c ? "mc-coping-category-active" : ""}" data-coping-cat="${c}">${label}</button>`;
      }).join("");
    }
    const cardsContainer = document.getElementById("coping-cards");
    if (!cardsContainer) return;
    if (displayed.length === 0) {
      cardsContainer.innerHTML = `
      <div class="mc-empty-state py-8" style="grid-column: 1 / -1;">
        <span class="text-4xl">\u{1F4D6}</span>
        <p style="${mcStyle(sm())} color: var(--mc-stone-gray); margin-top: 12px;">${t2("coping.noFavorites")}</p>
      </div>
    `;
      return;
    }
    cardsContainer.innerHTML = displayed.map((s) => {
      const isFav = _copingFavs.includes(s.id);
      const isExpanded = _copingExpanded === s.id;
      let stepsHtml = "";
      if (isExpanded && s.steps) {
        const stepsArr = s.steps.split("|").map((st) => st.trim()).filter(Boolean);
        stepsHtml = `
        <div class="mc-coping-technique animate-pixel-fade-in mt-3">
          <div class="mc-tag-pill mc-tag-pill-green mb-2">${t2("coping.steps")}</div>
          ${stepsArr.map((step) => `<div class="mc-coping-step">${step}</div>`).join("")}
          ${s.cat === "breathing" ? `<button data-coping-breathe class="mc-btn mc-btn-primary mt-3 ${sm()}">\u{1FAC1} ${t2("coping.tryNow")}</button>` : ""}
        </div>
      `;
      }
      return `
      <div class="mc-coping-card mc-card-3d" data-coping-card="${s.id}">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl mc-float-item">${s.emoji}</span>
            <div>
              <h4 style="${mcStyle(sm())} color: var(--mc-emerald-green); text-shadow: 1px 1px 0 #000;">${s.title}</h4>
              <p style="${mcStyle("font-size: 0.65rem;")} color: var(--mc-light-gray); margin-top: 4px;">${s.desc}</p>
            </div>
          </div>
          <button data-coping-fav="${s.id}" class="text-lg hover:scale-125 transition-transform" title="${isFav ? t2("coping.unfavorite") : t2("coping.favorite")}">
            ${isFav ? "\u2B50" : "\u2606"}
          </button>
        </div>
        ${stepsHtml}
      </div>
    `;
    }).join("");
  }
  var _spStep = 0;
  var _spLoading = true;
  var _spSaving = false;
  var _spCompleted = false;
  var _spWarningSigns = [""];
  var _spCopingStrategies = [""];
  var _spSupportContacts = [""];
  var _spSafePlaces = [""];
  var safetyPlanView = {
    render(t2) {
      return `
      <div class="max-w-3xl mx-auto px-4 py-8" id="view-safety-plan">
        <div id="sp-content">
          <div class="mc-skeleton-block lg mx-auto" style="height: 400px;"></div>
        </div>
      </div>
    `;
    },
    init(t2) {
      _spStep = 0;
      _spLoading = true;
      _spSaving = false;
      _spCompleted = false;
      _spWarningSigns = [""];
      _spCopingStrategies = [""];
      _spSupportContacts = [""];
      _spSafePlaces = [""];
      fetch("/api/safety-plan", { headers: authHeaders() }).then((r) => r.json()).then((data) => {
        if (data) {
          try {
            const ws = JSON.parse(data.warningSigns || "[]");
            const cs = JSON.parse(data.copingStrategies || "[]");
            const sc = JSON.parse(data.supportContacts || "[]");
            const sp = JSON.parse(data.safePlaces || "[]");
            if (ws.length) _spWarningSigns = ws;
            if (cs.length) _spCopingStrategies = cs;
            if (sc.length) _spSupportContacts = sc;
            if (sp.length) _spSafePlaces = sp;
            _spCompleted = true;
          } catch {
          }
        }
      }).catch(() => {
      }).finally(() => {
        _spLoading = false;
        _renderSafetyPlan(t2);
      });
      const root = document.getElementById("view-safety-plan");
      root?.addEventListener("click", (e) => {
        const stepBtn = e.target.closest("[data-sp-step]");
        if (stepBtn) {
          const dir = stepBtn.dataset.spStep;
          if (dir === "prev") _spStep = Math.max(0, _spStep - 1);
          else if (dir === "next") _spStep = _spStep + 1;
          else if (dir === "edit") _spStep = 1;
          else if (dir.startsWith("goto:")) _spStep = parseInt(dir.split(":")[1]);
          playClick();
          _renderSafetyPlan(t2);
          return;
        }
        if (e.target.closest("[data-sp-save]")) {
          _saveSafetyPlan(t2);
          return;
        }
        const addBtn = e.target.closest("[data-sp-add]");
        if (addBtn) {
          const fieldIdx = parseInt(addBtn.dataset.spAdd);
          _spAddItem(fieldIdx);
          _renderSafetyPlan(t2);
          return;
        }
        const rmBtn = e.target.closest("[data-sp-remove]");
        if (rmBtn) {
          const [fieldIdx, itemIdx] = rmBtn.dataset.spRemove.split(":").map(Number);
          _spRemoveItem(fieldIdx, itemIdx);
          _renderSafetyPlan(t2);
          return;
        }
      });
      root?.addEventListener("input", (e) => {
        const input = e.target.closest("[data-sp-input]");
        if (!input) return;
        const [fieldIdx, itemIdx] = input.dataset.spInput.split(":").map(Number);
        _spUpdateItem(fieldIdx, itemIdx, input.value);
      });
    },
    cleanup() {
      _spStep = 0;
      _spLoading = true;
      _spSaving = false;
      _spCompleted = false;
      _spWarningSigns = [""];
      _spCopingStrategies = [""];
      _spSupportContacts = [""];
      _spSafePlaces = [""];
    }
  };
  function _spGetFields() {
    return [_spWarningSigns, _spCopingStrategies, _spSupportContacts, _spSafePlaces];
  }
  function _spAddItem(fieldIdx) {
    const fields = _spGetFields();
    fields[fieldIdx].push("");
  }
  function _spRemoveItem(fieldIdx, itemIdx) {
    const fields = _spGetFields();
    fields[fieldIdx].splice(itemIdx, 1);
    if (fields[fieldIdx].length === 0) fields[fieldIdx].push("");
  }
  function _spUpdateItem(fieldIdx, itemIdx, val) {
    const fields = _spGetFields();
    fields[fieldIdx][itemIdx] = val;
  }
  function _saveSafetyPlan(t2) {
    if (_spSaving) return;
    _spSaving = true;
    _renderSafetyPlan(t2);
    fetch("/api/safety-plan", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        warningSigns: _spWarningSigns.filter(Boolean),
        copingStrategies: _spCopingStrategies.filter(Boolean),
        supportContacts: _spSupportContacts.filter(Boolean),
        safePlaces: _spSafePlaces.filter(Boolean)
      })
    }).then((r) => {
      if (r.ok) {
        showToast(t2("safety.saved"), "success");
        playSuccess();
        _spCompleted = true;
        _spStep = 0;
      } else {
        showToast(t2("common.error"), "error");
        playError();
      }
    }).catch(() => {
      showToast(t2("common.error"), "error");
      playError();
    }).finally(() => {
      _spSaving = false;
      _renderSafetyPlan(t2);
    });
  }
  function _renderSafetyPlan(t2) {
    const container = document.getElementById("sp-content");
    if (!container) return;
    if (_spLoading) {
      container.innerHTML = '<div class="mc-skeleton-block lg mx-auto" style="height: 400px;"></div>';
      return;
    }
    const steps = [
      { title: t2("safety.step1Title"), desc: t2("safety.step1Desc"), placeholder: t2("safety.step1Placeholder"), icon: "\u26A0\uFE0F" },
      { title: t2("safety.step2Title"), desc: t2("safety.step2Desc"), placeholder: t2("safety.step2Placeholder"), icon: "\u{1F6E0}\uFE0F" },
      { title: t2("safety.step3Title"), desc: t2("safety.step3Desc"), placeholder: t2("safety.step3Placeholder"), icon: "\u{1F465}" },
      { title: t2("safety.step4Title"), desc: t2("safety.step4Desc"), placeholder: t2("safety.step4Placeholder"), icon: "\u{1F3E0}" }
    ];
    const fieldSets = _spGetFields();
    const addLabels = [t2("safety.addSign"), t2("safety.addContact"), t2("safety.addContact"), t2("safety.addPlace")];
    if (_spCompleted && _spStep === 0) {
      container.innerHTML = `
      <div class="max-w-3xl mx-auto">
        <div class="mc-safety-plan-complete mc-panel mc-glow-green animate-pixel-fade-in">
          <div class="text-center py-4">
            <div class="text-5xl mb-4">\u{1F6E1}\uFE0F</div>
            <h3 style="${mcStyle("font-size: var(--mc-font-size-xl);")} color: var(--mc-emerald-green); text-shadow: 2px 2px 0 #000;">
              ${t2("safety.completed")}
            </h3>
            <div class="mt-6 mc-section-transition"></div>
            ${steps.map((s, i) => `
              <div class="mc-safety-fieldset mb-4">
                <div class="flex items-center gap-2 mb-2">
                  <span>${s.icon}</span>
                  <h4 style="${mcStyle(sm())} color: var(--mc-gold); text-shadow: 1px 1px 0 #000;">${s.title}</h4>
                </div>
                <div class="space-y-1">
                  ${fieldSets[i].filter(Boolean).map((item) => `
                    <div class="mc-safety-warning-sign">
                      <span style="${mcStyle(sm())} color: var(--mc-light-gray);">${item}</span>
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("")}
            <button data-sp-step="edit" class="mc-btn mc-btn-primary mt-4 ${sm()}">\u270F\uFE0F ${t2("safety.edit")}</button>
          </div>
        </div>
      </div>
    `;
      return;
    }
    const currentStep = steps[_spStep];
    const currentFields = fieldSets[_spStep];
    container.innerHTML = `
    <div class="mc-safety-wizard mc-panel mc-glow-green animate-pixel-slide-up">
      <div class="mc-panel-header">\u{1F6E1}\uFE0F ${t2("safety.title")}</div>
      <p class="mb-4" style="${mcStyle(sm())} color: var(--mc-light-gray);">
        ${t2("safety.subtitle")}
      </p>

      <!-- Step indicators -->
      <div class="mc-safety-step-indicator mb-6">
        ${steps.map((s, i) => `
          <div class="flex items-center gap-2">
            <button data-sp-step="goto:${i}" class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i === _spStep ? "mc-border-glow" : ""}" style="background: ${i === _spStep ? "var(--mc-gold)" : i < _spStep ? "var(--mc-emerald-green)" : "var(--mc-stone-gray)"}; color: #fff; text-shadow: 1px 1px 0 #000; ${mcFont()}">
              ${i < _spStep ? "\u2713" : s.icon}
            </button>
            ${i < steps.length - 1 ? `<div class="h-0.5 w-8" style="background: ${i < _spStep ? "var(--mc-emerald-green)" : "var(--mc-stone-gray)"};"></div>` : ""}
          </div>
        `).join("")}
      </div>

      <!-- Current step content -->
      <div class="animate-pixel-fade-in" key="${_spStep}">
        <div class="mc-safety-fieldset">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xl">${currentStep.icon}</span>
            <div>
              <h4 style="${mcStyle(md())} color: var(--mc-gold); text-shadow: 1px 1px 0 #000;">${currentStep.title}</h4>
              <p style="${mcStyle("font-size: 0.65rem;")} color: var(--mc-light-gray);">${currentStep.desc}</p>
            </div>
          </div>
          <div class="space-y-2">
            ${currentFields.map((val, idx) => `
              <div class="flex gap-2">
                <input type="text" value="${val.replace(/"/g, "&quot;")}" data-sp-input="${_spStep}:${idx}" placeholder="${currentStep.placeholder} ${idx + 1}" class="mc-input flex-1" style="${mcStyle(sm())}" />
                ${currentFields.length > 1 ? `<button data-sp-remove="${_spStep}:${idx}" class="mc-btn mc-btn-danger py-1 px-2 ${sm()}">\u2715</button>` : ""}
              </div>
            `).join("")}
            <button data-sp-add="${_spStep}" class="mc-btn mc-btn-stone ${sm()}">+ ${addLabels[_spStep]}</button>
          </div>
        </div>
      </div>

      <!-- Navigation buttons -->
      <div class="flex justify-between mt-6">
        <button data-sp-step="prev" class="mc-btn mc-btn-stone ${sm()} ${_spStep === 0 ? "opacity-50" : ""}" ${_spStep === 0 ? "disabled" : ""}>
          \u2190 Back
        </button>
        ${_spStep < 3 ? `<button data-sp-step="next" class="mc-btn mc-btn-primary ${sm()}">${t2("common.next")} \u2192</button>` : `<button data-sp-save class="mc-btn mc-btn-primary ${sm()}" ${_spSaving ? "disabled" : ""}>${_spSaving ? "\u23F3 ..." : "\u2705 " + t2("safety.save")}</button>`}
      </div>
    </div>
  `;
  }
  var _resCat = "all";
  var resourcesView = {
    render(t2) {
      return `
      <div class="max-w-5xl mx-auto px-4 py-8" id="view-resources">
        <div class="mc-panel animate-pixel-slide-up">
          <div class="mc-panel-header">\u{1F4DA} ${t2("resources.title")}</div>
          <p style="${mcStyle(sm())} color: var(--mc-light-gray); margin-bottom: 16px;">
            ${t2("resources.subtitle")}
          </p>
          <div class="flex flex-wrap gap-2 mb-6" id="res-categories"></div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto" id="res-grid"></div>
        </div>
      </div>
    `;
    },
    init(t2) {
      _resCat = "all";
      _renderResources(t2);
      document.getElementById("view-resources")?.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-res-cat]");
        if (!btn) return;
        _resCat = btn.dataset.resCat;
        playClick();
        _renderResources(t2);
      });
    },
    cleanup() {
      _resCat = "all";
    }
  };
  function _getResources(t2, locale) {
    return [
      { category: "anxiety", icon: "\u{1F630}", title: { pt: "O que \xE9 Ansiedade?", en: "What is Anxiety?", es: "\xBFQu\xE9 es la Ansiedad?", kaingang: "Huk\xE3?", tupi: "Huk\xE3?" }, desc: { pt: "A ansiedade \xE9 uma rea\xE7\xE3o natural do corpo ao estresse, mas quando se torna excessiva pode interferir nas atividades di\xE1rias.", en: "Anxiety is a natural body response to stress, but when excessive it can interfere with daily activities.", es: "La ansiedad es una reacci\xF3n natural del cuerpo al estr\xE9s, pero cuando es excesiva puede interferir con las actividades diarias.", kaingang: "Huk\xE3 teko s\xE3.", tupi: "Huk\xE3 teko s\xE3." } },
      { category: "anxiety", icon: "\u{1F9D8}", title: { pt: "T\xE9cnicas de Relaxamento", en: "Relaxation Techniques", es: "T\xE9cnicas de Relajaci\xF3n", kaingang: "Teko S\xE3", tupi: "Teko S\xE3" }, desc: { pt: "Aprenda exerc\xEDcios de respira\xE7\xE3o, medita\xE7\xE3o e relaxamento muscular progressivo para controlar a ansiedade.", en: "Learn breathing exercises, meditation, and progressive muscle relaxation to control anxiety.", es: "Aprenda ejercicios de respiraci\xF3n, meditaci\xF3n y relajaci\xF3n muscular progresiva.", kaingang: "Teko s\xE3 huk\xE3.", tupi: "Teko s\xE3 huk\xE3." } },
      { category: "depression", icon: "\u{1F499}", title: { pt: "Entendendo a Depress\xE3o", en: "Understanding Depression", es: "Entendiendo la Depresi\xF3n", kaingang: "Jykre", tupi: "\xD1e'\u1EBD" }, desc: { pt: "A depress\xE3o \xE9 mais do que tristeza \u2014 \xE9 uma condi\xE7\xE3o m\xE9dica que afeta como voc\xEA se sente, pensa e age.", en: "Depression is more than sadness \u2014 it is a medical condition that affects how you feel, think, and act.", es: "La depresi\xF3n es m\xE1s que tristeza \u2014 es una condici\xF3n m\xE9dica que afecta c\xF3mo te sientes, piensas y act\xFAas.", kaingang: "Jykre teko.", tupi: "\xD1e'\u1EBD teko." } },
      { category: "depression", icon: "\u{1F91D}", title: { pt: "Quando Procurar Ajuda", en: "When to Seek Help", es: "Cu\xE1ndo Buscar Ayuda", kaingang: "Ir\u0169", tupi: "Ir\u0169" }, desc: { pt: "Sinais de que voc\xEA precisa de ajuda profissional e como dar o primeiro passo.", en: "Signs that you need professional help and how to take the first step.", es: "Se\xF1ales de que necesitas ayuda profesional y c\xF3mo dar el primer paso.", kaingang: "Ir\u0169 jykre.", tupi: "Ir\u0169 \xF1e'\u1EBD." } },
      { category: "bullying", icon: "\u{1F6E1}\uFE0F", title: { pt: "Tipos de Bullying", en: "Types of Bullying", es: "Tipos de Acoso", kaingang: "Kyry", tupi: "Kyry" }, desc: { pt: "Conhe\xE7a os diferentes tipos de bullying: verbal, f\xEDsico, social e cibern\xE9tico. Saiba identificar e reagir.", en: "Learn the different types of bullying: verbal, physical, social, and cyber. Know how to identify and react.", es: "Conozca los diferentes tipos de acoso: verbal, f\xEDsico, social y cibern\xE9tico.", kaingang: "Kyry huk\xE3.", tupi: "Kyry huk\xE3." } },
      { category: "bullying", icon: "\u{1F4CB}", title: { pt: "Como Denunciar", en: "How to Report", es: "C\xF3mo Denunciar", kaingang: "Kanjuk", tupi: "Kanjuk" }, desc: { pt: "Guia passo a passo de como denunciar situa\xE7\xF5es de bullying na escola e online.", en: "Step-by-step guide on how to report bullying situations at school and online.", es: "Gu\xEDa paso a paso de c\xF3mo denunciar situaciones de acoso escolar y en l\xEDnea.", kaingang: "Kanjuk kyry.", tupi: "Kanjuk kyry." } },
      { category: "selfesteem", icon: "\u{1F31F}", title: { pt: "Construindo Autoestima", en: "Building Self-Esteem", es: "Construyendo Autoestima", kaingang: "Teko", tupi: "Teko" }, desc: { pt: "A autoestima \xE9 como voc\xEA se v\xEA e se valoriza. Aqui est\xE3o dicas para fortalec\xEA-la.", en: "Self-esteem is how you see and value yourself. Here are tips to strengthen it.", es: "La autoestima es c\xF3mo te ves y te valoras. Aqu\xED hay consejos para fortalecerla.", kaingang: "Teko s\xE3.", tupi: "Teko s\xE3." } },
      { category: "sleep", icon: "\u{1F634}", title: { pt: "Higiene do Sono", en: "Sleep Hygiene", es: "Higiene del Sue\xF1o", kaingang: "K\u0169\xED", tupi: "Ker" }, desc: { pt: "Dicas para melhorar a qualidade do sono: rotina, ambiente, e h\xE1bitos que fazem diferen\xE7a.", en: "Tips to improve sleep quality: routine, environment, and habits that make a difference.", es: "Consejos para mejorar la calidad del sue\xF1o: rutina, ambiente y h\xE1bitos.", kaingang: "K\u0169\xED teko s\xE3.", tupi: "Ker teko s\xE3." } },
      { category: "stress", icon: "\u{1F525}", title: { pt: "Gerenciamento de Estresse", en: "Stress Management", es: "Manejo del Estr\xE9s", kaingang: "Huk\xE3", tupi: "Huk\xE3" }, desc: { pt: "O estresse faz parte da vida, mas o estresse cr\xF4nico pode prejudicar sua sa\xFAde. Aprenda a gerenciar.", en: "Stress is part of life, but chronic stress can harm your health. Learn to manage it.", es: "El estr\xE9s es parte de la vida, pero el estr\xE9s cr\xF3nico puede da\xF1ar tu salud.", kaingang: "Huk\xE3 teko.", tupi: "Huk\xE3 teko." } }
    ];
  }
  function _renderResources(t2) {
    const locale = getCurrentLocale();
    const categories = ["all", "anxiety", "depression", "bullying", "selfesteem", "sleep", "stress"];
    const resources = _getResources(t2, locale);
    const filtered = _resCat === "all" ? resources : resources.filter((r) => r.category === _resCat);
    const catContainer = document.getElementById("res-categories");
    if (catContainer) {
      catContainer.innerHTML = categories.map((cat) => {
        const label = cat === "all" ? `\u{1F4D6} ${t2("resources.title").split(" ").slice(-1)[0]}` : t2(`resources.category.${cat}`);
        return `<button class="mc-resource-category-btn ${sm()} ${_resCat === cat ? "active" : ""}" data-res-cat="${cat}">${label}</button>`;
      }).join("");
    }
    const grid = document.getElementById("res-grid");
    if (!grid) return;
    grid.innerHTML = filtered.map((res) => {
      const titleObj = res.title;
      const descObj = res.desc;
      const titleText = titleObj[locale] || titleObj.pt;
      const descText = descObj[locale] || descObj.pt;
      return `
      <div class="mc-resource-card stagger-children">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 flex items-center justify-center text-xl mc-border-2" style="background: var(--mc-bg-light);">
            ${res.icon}
          </div>
          <h3 style="${mcStyle(sm())} color: var(--mc-diamond-blue); text-shadow: 1px 1px 0 #000; line-height: 1.3;">
            ${titleText}
          </h3>
        </div>
        <p style="${mcStyle("font-size: 0.7rem;")} color: var(--mc-light-gray); line-height: 1.7;">${descText}</p>
        <div class="mt-3 flex items-center justify-between">
          <span class="mc-achievement-rarity-badge rarity-uncommon">${t2(`resources.category.${res.category}`)}</span>
          <span style="${mcStyle("font-size: 0.6rem;")} color: var(--mc-emerald-green);">${t2("resources.readMore")} \u2192</span>
        </div>
      </div>
    `;
    }).join("");
  }
  var _adminTab = "main";
  var _adminReports = [];
  var _adminUsers = [];
  var _adminMessages = [];
  var _adminLoading = true;
  var _adminNotes = {};
  var adminView = {
    render(t2) {
      return `
      <div class="max-w-5xl mx-auto px-4 py-8" id="view-admin">
        <div id="admin-content"></div>
      </div>
    `;
    },
    init(t2) {
      _adminTab = "main";
      _adminReports = [];
      _adminUsers = [];
      _adminMessages = [];
      _adminLoading = true;
      _adminNotes = {};
      _renderAdmin(t2);
      const root = document.getElementById("view-admin");
      root?.addEventListener("click", (e) => {
        const tabBtn = e.target.closest("[data-admin-tab]");
        if (tabBtn) {
          _adminTab = tabBtn.dataset.adminTab;
          playClick();
          _loadAdminData(t2);
          return;
        }
        if (e.target.closest("[data-admin-back]")) {
          _adminTab = "main";
          playClick();
          _renderAdmin(t2);
          return;
        }
        const userBtn = e.target.closest("[data-admin-user]");
        if (userBtn) {
          const [userId, action] = userBtn.dataset.adminUser.split(":");
          _handleAdminUser(userId, action, t2);
          return;
        }
        const reportBtn = e.target.closest("[data-admin-report]");
        if (reportBtn) {
          const [reportId, action] = reportBtn.dataset.adminReport.split(":");
          _handleAdminReport(reportId, action, t2);
          return;
        }
      });
      root?.addEventListener("input", (e) => {
        if (e.target.matches("[data-admin-note]")) {
          _adminNotes[e.target.dataset.adminNote] = e.target.value;
        }
      });
    },
    cleanup() {
      _adminTab = "main";
      _adminReports = [];
      _adminUsers = [];
      _adminMessages = [];
      _adminLoading = true;
      _adminNotes = {};
    }
  };
  function _loadAdminData(t2) {
    _adminLoading = true;
    _renderAdmin(t2);
    if (_adminTab === "reports") {
      fetch("/api/admin/reports", { headers: authHeaders() }).then((r) => r.json()).then((data) => {
        _adminReports = data || [];
      }).catch(() => {
      }).finally(() => {
        _adminLoading = false;
        _renderAdmin(t2);
      });
    } else if (_adminTab === "users") {
      fetch("/api/admin/users", { headers: authHeaders() }).then((r) => r.json()).then((data) => {
        _adminUsers = data || [];
      }).catch(() => {
      }).finally(() => {
        _adminLoading = false;
        _renderAdmin(t2);
      });
    } else if (_adminTab === "messages") {
      fetch("/api/vent", { headers: authHeaders() }).then((r) => r.json()).then((data) => {
        _adminMessages = Array.isArray(data.messages) ? data.messages : [];
      }).catch(() => {
      }).finally(() => {
        _adminLoading = false;
        _renderAdmin(t2);
      });
    } else {
      _adminLoading = false;
      _renderAdmin(t2);
    }
  }
  function _handleAdminUser(userId, action, t2) {
    fetch("/api/admin/users", {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify({ userId, action })
    }).then((r) => {
      if (r.ok) {
        showToast(action === "ban" ? t2("admin.userBanned") : t2("admin.userUnbanned"), "success");
        _adminUsers = _adminUsers.map((u) => u.id === userId ? { ...u, role: action === "ban" ? "banned" : "user" } : u);
        _renderAdmin(t2);
      }
    }).catch(() => {
    });
  }
  function _handleAdminReport(reportId, action, t2) {
    fetch("/api/admin/reports", {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify({ reportId, action, adminNotes: _adminNotes[reportId] || void 0 })
    }).then((r) => {
      if (r.ok) {
        showToast(t2("admin.actionDone"), "success");
        _adminReports = _adminReports.map((r2) => r2.id === reportId ? { ...r2, status: action === "resolve" ? "resolved" : "reviewed" } : r2);
        _renderAdmin(t2);
      }
    }).catch(() => {
    });
  }
  function _renderAdmin(t2) {
    const container = document.getElementById("admin-content");
    if (!container) return;
    if (_adminTab === "main") {
      container.innerHTML = `
      <div class="mc-panel animate-pixel-slide-up">
        <div class="mc-panel-header">\u{1F6E1}\uFE0F ${t2("admin.panelTitle")}</div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 stagger-children">
          <button data-admin-tab="reports" class="mc-panel mc-mob-card text-center cursor-pointer mc-bg-netherrack">
            <div class="text-4xl mb-2">\u{1F6A9}</div>
            <h3 style="${mcStyle(md())} color: var(--mc-redstone-red); text-shadow: 2px 2px 0 #000;">${t2("admin.reportsTitle")}</h3>
          </button>
          <button data-admin-tab="users" class="mc-panel mc-mob-card text-center cursor-pointer mc-bg-stone">
            <div class="text-4xl mb-2">\u{1F465}</div>
            <h3 style="${mcStyle(md())} color: var(--mc-diamond-blue); text-shadow: 2px 2px 0 #000;">${t2("admin.usersTitle")}</h3>
          </button>
          <button data-admin-tab="messages" class="mc-panel mc-mob-card text-center cursor-pointer mc-bg-water">
            <div class="text-4xl mb-2">\u{1F4AC}</div>
            <h3 style="${mcStyle(md())} color: var(--mc-sand); text-shadow: 2px 2px 0 #000;">${t2("admin.messagesTitle")}</h3>
          </button>
        </div>
      </div>
    `;
      return;
    }
    if (_adminLoading) {
      container.innerHTML = `<div class="mc-panel animate-pixel-slide-up"><div class="mc-skeleton h-20"></div></div>`;
      return;
    }
    if (_adminTab === "reports") {
      container.innerHTML = `
      <div class="mc-panel animate-pixel-slide-up">
        <div class="mc-panel-header flex items-center justify-between">
          <span>\u{1F6A9} ${t2("admin.reportsTitle")}</span>
          <button data-admin-back class="mc-btn mc-btn-stone py-0.5 px-2 ${sm()}">${t2("admin.back")}</button>
        </div>
        <div class="space-y-3 max-h-[600px] overflow-y-auto">
          ${_adminReports.length === 0 ? `<p style="${mcStyle(sm())} color: var(--mc-stone-gray);" class="text-center py-8">${t2("admin.noReports")}</p>` : _adminReports.map((r) => {
        const statusColor = r.status === "resolved" ? "var(--mc-emerald-green)" : r.status === "reviewed" ? "var(--mc-gold)" : "var(--mc-redstone-red)";
        return `
                <div class="mc-border-2 p-4 ${r.status === "resolved" ? "opacity-50" : ""}" style="background: var(--mc-bg);">
                  <div class="flex items-center justify-between mb-2">
                    <span style="${mcStyle(sm())} color: var(--mc-gold);">${t2("admin.by")} ${r.reporter?.username || t2("admin.unknown")}</span>
                    <span class="px-2 py-0.5 ${sm()}" style="background: ${statusColor}; color: #000;">${r.status}</span>
                  </div>
                  <p style="${mcStyle(sm())} color: var(--mc-light-gray);">${r.reason}</p>
                  ${r.adminNotes ? `<p class="mt-1 ${sm()}" style="color: var(--mc-ender-purple);">\u{1F4DD} ${r.adminNotes}</p>` : ""}
                  <div class="flex gap-2 mt-3">
                    <input class="mc-input flex-1" placeholder="${t2("admin.adminNotes")}" value="${_adminNotes[r.id] || ""}" data-admin-note="${r.id}" />
                    ${r.status === "pending" ? `
                      <button data-admin-report="${r.id}:resolve" class="mc-btn mc-btn-primary py-1 px-3 ${sm()}">${t2("admin.resolve")}</button>
                      <button data-admin-report="${r.id}:review" class="mc-btn mc-btn-gold py-1 px-3 ${sm()}">${t2("admin.review")}</button>
                    ` : ""}
                  </div>
                </div>
              `;
      }).join("")}
        </div>
      </div>
    `;
      return;
    }
    if (_adminTab === "users") {
      container.innerHTML = `
      <div class="mc-panel animate-pixel-slide-up">
        <div class="mc-panel-header flex items-center justify-between">
          <span>\u{1F465} ${t2("admin.usersTitle")} (${_adminUsers.length})</span>
          <button data-admin-back class="mc-btn mc-btn-stone py-0.5 px-2 ${sm()}">${t2("admin.back")}</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full" style="${mcFont()} ${sm()}">
            <thead>
              <tr class="border-b-2 border-black" style="color: var(--mc-gold);">
                <th class="p-2 text-left">${t2("admin.usersTitle")}</th>
                <th class="p-2 text-left hidden sm:table-cell">Email</th>
                <th class="p-2 text-left hidden md:table-cell">MC Name</th>
                <th class="p-2 text-center">${t2("admin.status")}</th>
                <th class="p-2 text-center">${t2("admin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              ${_adminUsers.map((u) => `
                <tr class="border-b border-[#3F3F3F] hover:bg-[rgba(255,255,255,0.05)]">
                  <td class="p-2" style="color: ${u.role === "banned" ? "var(--mc-redstone-red)" : "var(--mc-text)"};">${u.username}</td>
                  <td class="p-2 hidden sm:table-cell" style="color: var(--mc-light-gray);">${u.email}</td>
                  <td class="p-2 hidden md:table-cell" style="color: var(--mc-gold);">${u.minecraftName || "-"}</td>
                  <td class="p-2 text-center">
                    <span class="w-3 h-3 inline-block rounded-full" style="background: ${u.isOnline ? "var(--mc-emerald-green)" : "var(--mc-stone-gray)"};"></span>
                  </td>
                  <td class="p-2 text-center">
                    ${u.role === "banned" ? `<button data-admin-user="${u.id}:unban" class="mc-btn mc-btn-primary py-0.5 px-2 ${sm()}">${t2("admin.unban")}</button>` : `<button data-admin-user="${u.id}:ban" class="mc-btn mc-btn-danger py-0.5 px-2 ${sm()}">${t2("admin.ban")}</button>`}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
      return;
    }
    if (_adminTab === "messages") {
      container.innerHTML = `
      <div class="mc-panel animate-pixel-slide-up">
        <div class="mc-panel-header flex items-center justify-between">
          <span>\u{1F4AC} ${t2("admin.ventMessages")}</span>
          <button data-admin-back class="mc-btn mc-btn-stone py-0.5 px-2 ${sm()}">${t2("admin.back")}</button>
        </div>
        <div class="space-y-2 max-h-[600px] overflow-y-auto">
          ${_adminMessages.map((m) => `
            <div class="mc-border-2 p-3 ${m.isModerated ? "opacity-50" : ""} ${m.isReported ? "border-[var(--mc-redstone-red)]" : ""}" style="background: var(--mc-bg);">
              <div class="flex items-center justify-between mb-1">
                <span style="${mcStyle(sm())} color: var(--mc-gold);">${m.username}</span>
                <div class="flex items-center gap-2">
                  ${m.isReported ? '<span class="' + sm() + '">\u{1F6A9}</span>' : ""}
                  ${m.isModerated ? `<span class="${sm()}" style="color: var(--mc-redstone-red);">\u{1F6AB} ${t2("admin.moderated")}</span>` : ""}
                  ${m.isAnonymous ? `<span class="${sm()}">\u{1F3AD}</span>` : ""}
                </div>
              </div>
              <p style="${mcStyle(sm())} color: var(--mc-light-gray); line-height: 1.6;">${m.content}</p>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    }
  }
  var _profEditing = false;
  var _profMcName = "";
  var _profSaving = false;
  var _profStats = { quizCount: 0, quizBest: 0, moodCount: 0, friendCount: 0, achievementCount: 0 };
  var profileView = {
    render(t2) {
      const user = get("user");
      if (!user) return "<div></div>";
      const roleColor = user.role === "admin" ? "var(--mc-redstone-red)" : "var(--mc-emerald-green)";
      const roleBadge = user.role === "admin" ? "\u{1F6E1}\uFE0F" : "\u26CF\uFE0F";
      return `
      <div class="max-w-4xl mx-auto px-4 py-8" id="view-profile">
        <div class="mc-panel animate-pixel-slide-up mc-creeper-bg">
          <div class="mc-panel-header flex items-center justify-between">
            <span>\u{1F464} ${t2("profile.title")}</span>
            <button data-prof-toggle-edit class="mc-btn mc-btn-stone py-0.5 px-3 ${sm()}">
              \u270F\uFE0F ${t2("profile.editProfile")}
            </button>
          </div>

          <!-- Avatar + Info -->
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
            <div class="mc-profile-avatar ${user.role === "admin" ? "admin-avatar" : ""}">
              ${user.role === "admin" ? "\u{1F6E1}\uFE0F" : "\u{1F9D1}\u200D\u{1F33E}"}
            </div>
            <div class="flex-1 text-center sm:text-left">
              <h2 style="${mcStyle("font-size: var(--mc-font-size-2xl);")} color: #fff; text-shadow: 2px 2px 0 #000;">
                ${user.username}
              </h2>
              <p style="${mcStyle("font-size: 0.8rem;")} color: var(--mc-stone-gray);">${user.email}</p>
              <div class="flex items-center gap-3 mt-2 justify-center sm:justify-start">
                <span style="${mcStyle(sm())} color: ${roleColor}; text-shadow: 1px 1px 0 #000;">
                  ${roleBadge} ${user.role === "admin" ? t2("profile.admin") : t2("profile.player")}
                </span>
                ${user.minecraftName ? `<span style="${mcStyle(sm())} color: var(--mc-gold);">\u26CF\uFE0F ${user.minecraftName}</span>` : ""}
              </div>
            </div>
          </div>

          <!-- Edit MC Name (hidden by default) -->
          <div id="prof-edit-section" style="display: none;" class="mb-6 p-4 mc-border-2" >
            <label class="block mb-2" style="${mcStyle(sm())} color: var(--mc-light-gray);">
              ${t2("profile.changeMcName")}
            </label>
            <div class="flex gap-2">
              <input id="prof-mc-name" class="mc-input flex-1" value="${_profMcName.replace(/"/g, "&quot;")}" placeholder="Steve_Builder" />
              <button data-prof-save-mc class="mc-btn mc-btn-primary ${sm()}">
                <span class="prof-save-text">\u2705 ${t2("profile.save")}</span>
              </button>
            </div>
          </div>

          <div class="mc-section-transition mb-6"></div>

          <!-- Stats Grid -->
          <h3 style="${mcStyle(md())} color: var(--mc-gold); text-shadow: 2px 2px 0 #000; margin-bottom: 12px;">
            \u{1F4CA} ${t2("profile.stats")}
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div class="mc-profile-stat">
              <div class="prof-stat-quiz-count" style="${mcStyle("font-size: var(--mc-font-size-2xl);")} color: var(--mc-diamond-blue); text-shadow: 2px 2px 0 #000;">0</div>
              <div style="${mcStyle("font-size: 0.6rem;")} color: var(--mc-stone-gray);">\u{1F4DD} Quiz</div>
            </div>
            <div class="mc-profile-stat">
              <div class="prof-stat-quiz-best" style="${mcStyle("font-size: var(--mc-font-size-2xl);")} color: var(--mc-gold); text-shadow: 2px 2px 0 #000;">0%</div>
              <div style="${mcStyle("font-size: 0.6rem;")} color: var(--mc-stone-gray);">${t2("profile.quizBest")}</div>
            </div>
            <div class="mc-profile-stat">
              <div class="prof-stat-mood-count" style="${mcStyle("font-size: var(--mc-font-size-2xl);")} color: var(--mc-emerald-green); text-shadow: 2px 2px 0 #000;">0</div>
              <div style="${mcStyle("font-size: 0.6rem;")} color: var(--mc-stone-gray);">${t2("profile.moodEntries")}</div>
            </div>
            <div class="mc-profile-stat">
              <div class="prof-stat-friend-count" style="${mcStyle("font-size: var(--mc-font-size-2xl);")} color: #00E5FF; text-shadow: 2px 2px 0 #000;">0</div>
              <div style="${mcStyle("font-size: 0.6rem;")} color: var(--mc-stone-gray);">${t2("profile.friends")}</div>
            </div>
            <div class="mc-profile-stat">
              <div class="prof-stat-ach-count" style="${mcStyle("font-size: var(--mc-font-size-2xl);")} color: #FF8C00; text-shadow: 2px 2px 0 #000;">0</div>
              <div style="${mcStyle("font-size: 0.6rem;")} color: var(--mc-stone-gray);">${t2("profile.achievements")}</div>
            </div>
          </div>

          <!-- Mood emoji legend -->
          <div class="flex flex-wrap gap-2 justify-center mb-6">
            ${[
        { emoji: "\u{1F60A}", label: t2("mood.happy"), color: "#4CAF50" },
        { emoji: "\u{1F622}", label: t2("mood.sad"), color: "#00E5FF" },
        { emoji: "\u{1F630}", label: t2("mood.anxious"), color: "#FFB300" },
        { emoji: "\u{1F620}", label: t2("mood.angry"), color: "#FF1A1A" },
        { emoji: "\u{1F60C}", label: t2("mood.calm"), color: "#3AA93B" },
        { emoji: "\u{1F634}", label: t2("mood.tired"), color: "#9E9E9E" }
      ].map((item) => `
              <div class="mc-profile-stat mc-mood-emoji" style="min-width: 70px;">
                <div class="text-2xl mb-1">${item.emoji}</div>
                <div style="${mcStyle("font-size: 0.55rem;")} color: ${item.color}; text-shadow: 1px 1px 0 #000;">${item.label}</div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
    },
    init(t2) {
      const user = get("user");
      _profEditing = false;
      _profMcName = user?.minecraftName || "";
      _profSaving = false;
      _profStats = { quizCount: 0, quizBest: 0, moodCount: 0, friendCount: 0, achievementCount: 0 };
      const token = get("token");
      if (token) {
        Promise.all([
          fetch("/api/quiz", { headers: authHeaders() }).then((r) => r.json()).catch(() => []),
          fetch("/api/mood?days=365", { headers: authHeaders() }).then((r) => r.json()).catch(() => []),
          fetch("/api/friends", { headers: authHeaders() }).then((r) => r.json()).catch(() => ({ friends: [] })),
          fetch("/api/achievements", { headers: authHeaders() }).then((r) => r.json()).catch(() => ({ achievements: [] }))
        ]).then(([quizRes, moodRes, friendRes, achRes]) => {
          const quizzes = Array.isArray(quizRes) ? quizRes : [];
          const moods = Array.isArray(moodRes) ? moodRes : [];
          let best = 0;
          quizzes.forEach((q) => {
            const pct = Math.round(q.score / q.total * 100);
            if (pct > best) best = pct;
          });
          _profStats = {
            quizCount: quizzes.length,
            quizBest: best,
            moodCount: moods.length,
            friendCount: (friendRes.friends || []).length,
            achievementCount: (achRes.achievements || []).length
          };
          _updateProfileStats();
        }).catch(() => {
        });
      }
      const root = document.getElementById("view-profile");
      root?.addEventListener("click", (e) => {
        if (e.target.closest("[data-prof-toggle-edit]")) {
          _profEditing = !_profEditing;
          playClick();
          const section = document.getElementById("prof-edit-section");
          const btn = document.querySelector("[data-prof-toggle-edit]");
          if (section) section.style.display = _profEditing ? "" : "none";
          if (btn) btn.innerHTML = _profEditing ? t2("profile.cancel") : "\u270F\uFE0F " + t2("profile.editProfile");
          return;
        }
        if (e.target.closest("[data-prof-save-mc]")) {
          _saveMcName(t2);
          return;
        }
      });
      root?.addEventListener("input", (e) => {
        if (e.target.id === "prof-mc-name") {
          _profMcName = e.target.value;
        }
      });
    },
    cleanup() {
      _profEditing = false;
      _profMcName = "";
      _profSaving = false;
      _profStats = { quizCount: 0, quizBest: 0, moodCount: 0, friendCount: 0, achievementCount: 0 };
    }
  };
  function _updateProfileStats() {
    const els = {
      "prof-stat-quiz-count": _profStats.quizCount,
      "prof-stat-quiz-best": _profStats.quizBest + "%",
      "prof-stat-mood-count": _profStats.moodCount,
      "prof-stat-friend-count": _profStats.friendCount,
      "prof-stat-ach-count": _profStats.achievementCount
    };
    for (const [cls, val] of Object.entries(els)) {
      const el = document.querySelector(`.${cls}`);
      if (el) el.textContent = val;
    }
  }
  function _saveMcName(t2) {
    if (_profSaving) return;
    _profSaving = true;
    const saveText = document.querySelector(".prof-save-text");
    if (saveText) saveText.textContent = "\u23F3";
    fetch("/api/auth/me", {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ minecraftName: _profMcName || null })
    }).then((r) => r.json()).then((data) => {
      if (data.user) {
        const token = get("token");
        setAuth(data.user, token);
        showToast(t2("common.success"), "success");
        _profEditing = false;
        const section = document.getElementById("prof-edit-section");
        const btn = document.querySelector("[data-prof-toggle-edit]");
        if (section) section.style.display = "none";
        if (btn) btn.innerHTML = "\u270F\uFE0F " + t2("profile.editProfile");
      }
    }).catch(() => {
      showToast(t2("common.error"), "error");
    }).finally(() => {
      _profSaving = false;
      if (saveText) saveText.textContent = "\u2705 " + t2("profile.save");
    });
  }
  var accessibilityView = {
    render(t2) {
      const soundEnabled = get("soundEnabled");
      const highContrast = get("highContrast");
      const largeText = get("largeText");
      const audioDescription = get("audioDescription");
      const biomeTheme = get("biomeTheme");
      const options = [
        { key: "sound", label: t2("accessibility.soundEffects"), desc: t2("accessibility.soundEffectsDesc"), icon: soundEnabled ? "\u{1F50A}" : "\u{1F507}", active: soundEnabled, color: "var(--mc-emerald-green)" },
        { key: "highContrast", label: t2("accessibility.highContrast"), desc: t2("accessibility.highContrastDesc"), icon: "\u25D0", active: highContrast, color: "#FFFFFF" },
        { key: "largeText", label: t2("accessibility.largeText"), desc: t2("accessibility.largeTextDesc"), icon: "\u{1F524}", active: largeText, color: "var(--mc-diamond-blue)" },
        { key: "audioDescription", label: t2("accessibility.audioDescription"), desc: t2("accessibility.audioDescDesc"), icon: "\u{1F50A}", active: audioDescription, color: "var(--mc-gold)" }
      ];
      const biomeOptions = [
        { key: "forest", label: t2("biome.forest"), icon: "\u{1F33F}" },
        { key: "nether", label: t2("biome.nether"), icon: "\u{1F525}" },
        { key: "end", label: t2("biome.end"), icon: "\u2728" }
      ];
      return `
      <div class="max-w-3xl mx-auto px-4 py-8" id="view-accessibility">
        <div class="mc-panel animate-pixel-slide-up">
          <div class="mc-panel-header">\u267F ${t2("accessibility.title")}</div>
          <p class="mb-6" style="${mcStyle(sm())} color: var(--mc-light-gray); line-height: 1.8;">
            ${t2("accessibility.desc")}
          </p>
          <div class="space-y-4" id="acc-options">
            ${options.map((opt) => `
              <div class="mc-border-2 p-4 transition-all acc-option" data-acc-key="${opt.key}" style="${opt.active ? "background: rgba(93,140,62,0.2); border-color: var(--mc-emerald-green);" : "background: var(--mc-bg);"}">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="text-2xl">${opt.icon}</span>
                    <div>
                      <h3 style="${mcStyle(sm())} color: ${opt.active ? "var(--mc-emerald-green)" : "var(--mc-text)"};">
                        ${opt.label}
                      </h3>
                      <p style="${mcStyle(sm())} color: var(--mc-stone-gray);">
                        ${opt.desc}
                      </p>
                    </div>
                  </div>
                  <button class="acc-toggle w-16 h-8 relative cursor-pointer" data-acc-toggle="${opt.key}" style="border: 3px solid #000; background: ${opt.active ? "var(--mc-emerald-green)" : "var(--mc-stone-gray)"}; transition: all 0.2s;">
                    <div class="w-6 h-6 absolute top-0.5 transition-all" style="left: ${opt.active ? "calc(100% - 28px)" : "2px"}; background: ${opt.active ? "#fff" : "var(--mc-light-gray)"}; border: 2px solid #000;"></div>
                  </button>
                </div>
              </div>
            `).join("")}
          </div>

          <div class="mc-divider-icon my-6"><span>\u{1F30D}</span></div>

          <h3 class="mb-4" style="${mcStyle(md())} color: var(--mc-gold); text-shadow: 2px 2px 0 #000;">
            \u{1F30D} ${t2("biome.title")}
          </h3>
          <p class="mb-4" style="${mcStyle(sm())} color: var(--mc-light-gray);">
            ${t2("biome.desc")}
          </p>
          <div class="flex flex-wrap gap-3 mb-6" id="acc-biome-btns">
            ${biomeOptions.map((b) => `
              <button class="mc-btn mc-btn-press ${sm()} px-4 py-2 ${biomeTheme === b.key ? "mc-btn-primary" : "mc-btn-stone"}" data-acc-biome="${b.key}">
                ${b.icon} ${b.label}
              </button>
            `).join("")}
          </div>

          <div class="mt-6">
            <button data-acc-reset class="mc-btn mc-btn-danger ${sm()}">
              \u{1F504} ${t2("accessibility.reset")}
            </button>
          </div>
        </div>
      </div>
    `;
    },
    init(t2) {
      const root = document.getElementById("view-accessibility");
      if (!root) return;
      root.addEventListener("click", (e) => {
        const toggleBtn = e.target.closest("[data-acc-toggle]");
        if (toggleBtn) {
          const key = toggleBtn.dataset.accToggle;
          playClick();
          if (key === "sound") setState({ soundEnabled: !get("soundEnabled") });
          else if (key === "highContrast") setState({ highContrast: !get("highContrast") });
          else if (key === "largeText") setState({ largeText: !get("largeText") });
          else if (key === "audioDescription") setState({ audioDescription: !get("audioDescription") });
          const container = document.getElementById("view-accessibility");
          if (container) {
            container.innerHTML = accessibilityView.render(t2);
            _bindAccessibilityEvents(root, t2);
          }
          return;
        }
        const biomeBtn = e.target.closest("[data-acc-biome]");
        if (biomeBtn) {
          const theme = biomeBtn.dataset.accBiome;
          setState({ biomeTheme: theme });
          playClick();
          const container = document.getElementById("view-accessibility");
          if (container) {
            container.innerHTML = accessibilityView.render(t2);
            _bindAccessibilityEvents(root, t2);
          }
          return;
        }
        if (e.target.closest("[data-acc-reset]")) {
          setState({
            soundEnabled: true,
            highContrast: false,
            largeText: false,
            audioDescription: false,
            biomeTheme: "forest"
          });
          playClick();
          showToast(t2("accessibility.reset"), "info");
          const container = document.getElementById("view-accessibility");
          if (container) {
            container.innerHTML = accessibilityView.render(t2);
            _bindAccessibilityEvents(root, t2);
          }
          return;
        }
      });
    },
    cleanup() {
    }
  };
  function _bindAccessibilityEvents(root, t2) {
  }
  var _lbEntries = [];
  var _lbLoading = true;
  var leaderboardView = {
    render(t2) {
      return `
      <div class="max-w-2xl mx-auto px-4 py-8" id="view-leaderboard">
        <div class="mc-panel mc-glow-gold animate-pixel-slide-up">
          <div class="mc-panel-header">\u{1F3C5} ${t2("leaderboard.title")}</div>
          <p class="mb-6" style="${mcStyle(sm())} color: var(--mc-light-gray);">
            ${t2("leaderboard.subtitle")}
          </p>
          <div id="lb-content">
            <div class="mc-skeleton-block lg mx-auto" style="height: 500px;"></div>
          </div>
        </div>
      </div>
    `;
    },
    init(t2) {
      _lbLoading = true;
      _lbEntries = [];
      fetch("/api/leaderboard?mode=platformer").then((r) => r.json()).then((data) => {
        const user = get("user");
        _lbEntries = (data || []).map((e) => ({
          playerName: e.playerName,
          score: e.score,
          level: e.level,
          isMe: user ? e.userId === user.id : false
        }));
      }).catch(() => {
      }).finally(() => {
        _lbLoading = false;
        _renderLeaderboard(t2);
      });
    },
    cleanup() {
      _lbEntries = [];
      _lbLoading = true;
    }
  };
  function _renderLeaderboard(t2) {
    const container = document.getElementById("lb-content");
    if (!container) return;
    if (_lbEntries.length === 0) {
      container.innerHTML = `
      <div class="mc-empty-state py-8">
        <span class="text-4xl">\u{1F3AE}</span>
        <p style="${mcStyle(sm())} color: var(--mc-stone-gray); margin-top: 12px;">${t2("leaderboard.noEntries")}</p>
      </div>
    `;
      return;
    }
    container.innerHTML = `
    <div class="mc-leaderboard">
      <div class="flex items-center py-2 px-3 border-b-2 border-[var(--mc-obsidian)]" style="${mcStyle(sm())} color: var(--mc-gold); text-shadow: 1px 1px 0 #000;">
        <span class="w-16">${t2("leaderboard.rank")}</span>
        <span class="flex-1">${t2("leaderboard.player")}</span>
        <span class="w-20 text-right">${t2("leaderboard.level")}</span>
        <span class="w-24 text-right">${t2("leaderboard.score")}</span>
      </div>
      ${_lbEntries.map((entry, i) => {
      const rank = i + 1;
      const topClass = rank === 1 ? "mc-leaderboard-top1" : rank === 2 ? "mc-leaderboard-top2" : rank === 3 ? "mc-leaderboard-top3" : "";
      const medal = rank === 1 ? "\u{1F451}" : rank === 2 ? "\u{1F948}" : rank === 3 ? "\u{1F949}" : `#${rank}`;
      return `
          <div class="mc-leaderboard-row ${topClass} ${entry.isMe ? "mc-leaderboard-me" : ""}">
            <span class="w-16" style="${mcStyle(sm())} text-shadow: 1px 1px 0 #000;">${medal}</span>
            <span class="flex-1" style="${mcStyle(sm())} color: var(--mc-white); text-shadow: 1px 1px 0 #000;">
              ${entry.playerName}${entry.isMe ? ` (${t2("leaderboard.you")})` : ""}
            </span>
            <span class="w-20 text-right" style="${mcStyle(sm())} color: var(--mc-diamond-blue);">Lv.${entry.level}</span>
            <span class="w-24 text-right" style="${mcStyle(md())} color: ${rank <= 3 ? "var(--mc-gold)" : "var(--mc-light-gray)"}; text-shadow: 2px 2px 0 #000;">
              \u2B50 ${entry.score}
            </span>
          </div>
        `;
    }).join("")}
    </div>
  `;
  }

  // public/js/app.js
  var PUBLIC_VIEWS = ["landing", "login", "register", "accessibility"];
  var ADMIN_VIEWS = ["admin", "admin-reports", "admin-users", "admin-messages"];
  var viewRegistry = {
    landing: { render: renderLanding, init: initLanding, cleanup: cleanupLanding },
    login: { render: (t2) => renderAuth(t2, "login"), init: (t2) => initAuth(t2, "login"), cleanup: () => {
    } },
    register: { render: (t2) => renderAuth(t2, "register"), init: (t2) => initAuth(t2, "register"), cleanup: () => {
    } },
    dashboard: { render: renderDashboard, init: initDashboard, cleanup: cleanupDashboard },
    chatbot: chatbotView,
    quiz: quizView,
    friends: friendsView,
    vent: ventView,
    journal: journalView,
    minigame: minigameView,
    mood: moodView,
    moodInsights: moodInsightsView,
    breathing: breathingView,
    pomodoro: pomodoroView,
    selfcare: selfcareView,
    gratitude: gratitudeView,
    affirmations: affirmationsView,
    challenges: challengesView,
    coping: copingView,
    safetyPlan: safetyPlanView,
    resources: resourcesView,
    admin: adminView,
    profile: profileView,
    accessibility: accessibilityView,
    leaderboard: leaderboardView,
    studyHelp: studyHelpView,
    // Admin sub-views redirect to admin
    "admin-reports": adminView,
    "admin-users": adminView,
    "admin-messages": adminView
  };
  var currentCleanup = null;
  var currentView = null;
  var $main = () => document.getElementById("mc-main");
  var $header = () => document.getElementById("mc-header");
  var $footer = () => document.getElementById("mc-footer");
  var $body = () => document.getElementById("mc-body");
  function navigate(view) {
    const user = get("user");
    if (!PUBLIC_VIEWS.includes(view) && !user) {
      view = "login";
    }
    if (ADMIN_VIEWS.includes(view) && (!user || user.role !== "admin")) {
      view = "landing";
    }
    if (currentCleanup) {
      try {
        currentCleanup();
      } catch (e) {
        console.warn("Cleanup error:", e);
      }
      currentCleanup = null;
    }
    setState({ currentView: view });
    currentView = view;
    renderHeaderAndUpdate(view);
    const main = $main();
    if (!main) return;
    const viewDef = viewRegistry[view];
    if (viewDef) {
      main.innerHTML = `<div class="animate-pixel-fade-in">${viewDef.render(t)}</div>`;
      try {
        viewDef.init(t);
        if (viewDef.cleanup) currentCleanup = viewDef.cleanup;
      } catch (e) {
        console.error("View init error:", view, e);
        main.innerHTML = `<div class="mc-panel p-8 text-center"><p style="font-family:var(--mc-font);color:var(--mc-redstone-red)">Error loading view: ${e.message}</p></div>`;
      }
    } else {
      main.innerHTML = `<div class="mc-panel p-8 text-center"><p style="font-family:var(--mc-font);color:var(--mc-gold)">View not found: ${view}</p></div>`;
    }
    window.scrollTo(0, 0);
  }
  function renderHeaderAndUpdate(view) {
    const header = $header();
    const footer = $footer();
    if (header) {
      header.innerHTML = renderHeader(t);
      initHeader(t);
    }
    if (footer) {
      footer.innerHTML = renderFooter(t);
    }
  }
  function updateBodyClasses() {
    const body = $body();
    if (!body) return;
    const highContrast = get("highContrast");
    const largeText = get("largeText");
    const biome = get("biomeTheme") || "forest";
    body.className = "min-h-screen flex flex-col" + (highContrast ? " high-contrast" : "") + (largeText ? " large-text" : "") + ` mc-biome-${biome}`;
  }
  function init() {
    console.log("\u26CF\uFE0F MentalCraft initializing...");
    updateBodyClasses();
    const header = $header();
    const footer = $footer();
    if (header) {
      header.innerHTML = renderHeader(t);
      initHeader(t);
    }
    if (footer) {
      footer.innerHTML = renderFooter(t);
    }
    subscribe("highContrast", updateBodyClasses);
    subscribe("largeText", updateBodyClasses);
    subscribe("biomeTheme", updateBodyClasses);
    subscribe("currentLocale", () => {
      navigate(get("currentView") || "landing");
    });
    subscribe("currentView", (view) => {
      if (view !== currentView) navigate(view);
    });
    const initialView = get("currentView") || "landing";
    navigate(initialView);
    document.addEventListener("click", (e) => {
      const navEl = e.target.closest("[data-view]");
      if (navEl) {
        e.preventDefault();
        const view = navEl.getAttribute("data-view");
        if (view) navigate(view);
      }
      const backEl = e.target.closest("[data-back]");
      if (backEl) {
        e.preventDefault();
        navigate("landing");
      }
    });
    console.log("\u2705 MentalCraft ready!");
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
