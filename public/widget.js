/**
 * Chat Widget Loader Script
 *
 * This script loads the chat widget on any website.
 * It creates a floating button and chat panel directly on the page.
 */

(function () {
  // Configuration
  const API_BASE_URL = "https://vikiaibackend.vikiflow.com/api";
  const CSS_URL = "https://vikiai.vikiflow.com/widget.css";

  // Store the chatbot ID and state
  let chatbotId = null;
  let isOpen = false;
  let currentView = "history"; // 'history' or 'chat'
  let activeSessionId = null;
  let conversations = [];
  let messages = [];
  let visitorId = null;

  // Initialize the widget
  window.initChatWidget = function (id, targetElementId) {
    chatbotId = id;

    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = CSS_URL;
    document.head.appendChild(link);

    // Create widget container
    const container = document.createElement("div");
    container.id = "chat-widget-root";

    if (targetElementId) {
      const targetElement = document.getElementById(targetElementId);
      if (targetElement) {
        targetElement.appendChild(container);
      } else {
        document.body.appendChild(container);
      }
    } else {
      document.body.appendChild(container);
    }

    // Get or create visitor ID
    visitorId = getOrCreateVisitorId();

    // Create the floating button
    createFloatingButton(container);
  };

  // Get or create visitor ID
  function getOrCreateVisitorId() {
    const VISITOR_ID_KEY = "chat_visitor_id";
    let id = localStorage.getItem(VISITOR_ID_KEY);

    if (!id) {
      id = generateUUID();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }

    return id;
  }

  // Generate a UUID
  function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  // Create the floating button
  function createFloatingButton(container) {
    const button = document.createElement("button");
    button.className = "chat-widget-button";
    button.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

    // Add click event
    button.addEventListener("click", function () {
      toggleChatPanel(container);
    });

    container.appendChild(button);
  }

  // Toggle chat panel
  function toggleChatPanel(container) {
    isOpen = !isOpen;

    // Remove existing panel if any
    const existingPanel = document.getElementById("chat-widget-panel");
    if (existingPanel) {
      existingPanel.remove();
    }

    // Update button icon
    const button = container.querySelector(".chat-widget-button");
    if (button) {
      if (isOpen) {
        button.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

        // Create and show panel
        createChatPanel(container);

        // Load conversations
        loadConversations();
      } else {
        button.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
      }
    }
  }

  // Create chat panel
  function createChatPanel(container) {
    const panel = document.createElement("div");
    panel.id = "chat-widget-panel";
    panel.className = "chat-widget-panel";

    // Add animation
    panel.style.opacity = "0";
    panel.style.transform = "translateY(20px) scale(0.95)";

    container.appendChild(panel);

    // Trigger animation
    setTimeout(() => {
      panel.style.opacity = "1";
      panel.style.transform = "translateY(0) scale(1)";
    }, 10);

    // Render initial content based on view
    renderPanelContent(panel);
  }

  // Render panel content based on current view
  function renderPanelContent(panel) {
    if (currentView === "history") {
      renderHistoryView(panel);
    } else {
      renderChatView(panel);
    }
  }

  // Render history view
  function renderHistoryView(panel) {
    panel.innerHTML = `
      <div class="chat-widget-header">My conversations</div>
      <div id="conversations-list" class="chat-widget-body">
        <div class="loading-indicator">Loading conversations...</div>
      </div>
      <div class="chat-widget-footer">
        <button id="new-conversation-btn" class="chat-widget-send">New conversation</button>
      </div>
    `;

    // Add event listener for new conversation button
    const newConversationBtn = document.getElementById("new-conversation-btn");
    if (newConversationBtn) {
      newConversationBtn.addEventListener("click", startNewConversation);
    }
  }

  // Render chat view
  function renderChatView(panel) {
    panel.innerHTML = `
      <div class="chat-widget-header">
        <button id="back-to-history-btn" class="back-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <span>Chat</span>
      </div>
      <div id="messages-list" class="chat-widget-body">
        <div class="loading-indicator">Loading messages...</div>
      </div>
      <div class="chat-widget-footer">
        <input id="message-input" type="text" class="chat-widget-input" placeholder="Type your message...">
        <button id="send-message-btn" class="chat-widget-send">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    `;

    // Add event listeners
    const backBtn = document.getElementById("back-to-history-btn");
    if (backBtn) {
      backBtn.addEventListener("click", backToHistory);
    }

    const sendBtn = document.getElementById("send-message-btn");
    if (sendBtn) {
      sendBtn.addEventListener("click", sendMessage);
    }

    const input = document.getElementById("message-input");
    if (input) {
      input.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
          sendMessage();
        }
      });

      // Focus the input
      setTimeout(() => {
        input.focus();
      }, 100);
    }

    // Render messages if we have an active session
    if (activeSessionId) {
      renderMessages();
    }
  }

  // Load conversations
  function loadConversations() {
    fetch(
      `${API_BASE_URL}/chat/visitor-conversations?visitorId=${visitorId}&chatbotId=${chatbotId}`
    )
      .then((response) => response.json())
      .then((data) => {
        conversations = data;

        // Render conversations
        renderConversations();

        // If no conversations, start a new one automatically
        if (data.length === 0) {
          startNewConversation();
        }
      })
      .catch((error) => {
        console.error("Error loading conversations:", error);
        const conversationsList = document.getElementById("conversations-list");
        if (conversationsList) {
          conversationsList.innerHTML = `
            <div class="error-message">Failed to load conversations</div>
            <button id="retry-load-btn" class="retry-button">Retry</button>
          `;

          const retryBtn = document.getElementById("retry-load-btn");
          if (retryBtn) {
            retryBtn.addEventListener("click", loadConversations);
          }
        }
      });
  }

  // Render conversations
  function renderConversations() {
    const conversationsList = document.getElementById("conversations-list");
    if (!conversationsList) return;

    if (conversations.length === 0) {
      conversationsList.innerHTML = `
        <div class="empty-state">No conversation history found.</div>
      `;
      return;
    }

    let html = "";
    conversations.forEach((conversation) => {
      const date = new Date(conversation.lastMessageAt);
      const formattedDate = formatDate(date);

      html += `
        <div class="conversation-item" data-session-id="${conversation.sessionId}">
          <div class="conversation-title">${conversation.title}</div>
          <div class="conversation-preview">${conversation.lastMessage}</div>
          <div class="conversation-time">${formattedDate}</div>
        </div>
      `;
    });

    conversationsList.innerHTML = html;

    // Add event listeners to conversation items
    const items = conversationsList.querySelectorAll(".conversation-item");
    items.forEach((item) => {
      item.addEventListener("click", function () {
        const sessionId = this.getAttribute("data-session-id");
        openConversation(sessionId);
      });
    });
  }

  // Format date
  function formatDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return "just now";
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
    } else if (diffDay < 7) {
      return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Start new conversation
  function startNewConversation() {
    fetch(`${API_BASE_URL}/chat/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatbotId,
        visitorId,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        activeSessionId = data.sessionId;
        messages = data.messages || [];

        // Switch to chat view
        currentView = "chat";
        const panel = document.getElementById("chat-widget-panel");
        if (panel) {
          renderChatView(panel);
        }
      })
      .catch((error) => {
        console.error("Error creating new conversation:", error);
        alert("Failed to start a new conversation. Please try again.");
      });
  }

  // Open existing conversation
  function openConversation(sessionId) {
    fetch(`${API_BASE_URL}/chat/session/${sessionId}`)
      .then((response) => response.json())
      .then((data) => {
        activeSessionId = sessionId;
        messages = data.messages || [];

        // Switch to chat view
        currentView = "chat";
        const panel = document.getElementById("chat-widget-panel");
        if (panel) {
          renderChatView(panel);
        }
      })
      .catch((error) => {
        console.error("Error opening conversation:", error);
        alert("Failed to load conversation. Please try again.");
      });
  }

  // Render messages
  function renderMessages() {
    const messagesList = document.getElementById("messages-list");
    if (!messagesList) return;

    if (messages.length === 0) {
      messagesList.innerHTML = `
        <div class="empty-state">No messages yet. Start the conversation!</div>
      `;
      return;
    }

    let html = "";
    messages.forEach((message) => {
      const date = new Date(message.timestamp);
      const formattedTime = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const messageClass =
        message.role === "user" ? "chat-message-user" : "chat-message-bot";

      html += `
        <div class="chat-message ${messageClass}">
          <div class="chat-message-content">${message.content}</div>
          <div class="chat-message-time">${formattedTime}</div>
        </div>
      `;
    });

    messagesList.innerHTML = html;

    // Scroll to bottom
    messagesList.scrollTop = messagesList.scrollHeight;
  }

  // Send message
  function sendMessage() {
    if (!activeSessionId) return;

    const input = document.getElementById("message-input");
    if (!input) return;

    const content = input.value.trim();
    if (!content) return;

    // Clear input
    input.value = "";

    // Add message to UI immediately
    const userMessage = {
      id: `temp-${Date.now()}`,
      sessionId: activeSessionId,
      content,
      role: "user",
      timestamp: new Date(),
    };

    messages.push(userMessage);
    renderMessages();

    // Send to API
    fetch(`${API_BASE_URL}/chat/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: activeSessionId,
        content,
        role: "user",
        visitorId,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Add bot response to messages
        messages.push(data.message);
        renderMessages();

        // Refresh conversations in the background
        loadConversations();
      })
      .catch((error) => {
        console.error("Error sending message:", error);

        // Add error message
        messages.push({
          id: `error-${Date.now()}`,
          sessionId: activeSessionId,
          content: "Sorry, I couldn't process your message. Please try again.",
          role: "assistant",
          timestamp: new Date(),
        });

        renderMessages();
      });
  }

  // Back to history
  function backToHistory() {
    currentView = "history";
    const panel = document.getElementById("chat-widget-panel");
    if (panel) {
      renderHistoryView(panel);
      loadConversations(); // Refresh the list
    }
  }
})();
