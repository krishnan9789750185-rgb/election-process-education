/**
 * @fileoverview AI Assistant module powered by Google Gemini API.
 * Provides conversational election education through a chat interface.
 * @module assistant
 */

import { APP_CONFIG, GEMINI_SYSTEM_PROMPT, SUGGESTED_QUESTIONS } from './constants.js';
import { escapeHTML, validateInput, rateLimiter, isValidAPIKey } from './security.js';
import { qs, createElement, delay, showToast, storage, generateId } from './utils.js';
import { announce } from './accessibility.js';

/** @type {Array<Object>} Chat message history */
let chatHistory = [];

/** @type {string|null} The Gemini API key */
let apiKey = null;

/** @type {boolean} Whether a request is currently in progress */
let isLoading = false;

/**
 * Initializes the AI assistant module.
 * Sets up event listeners and loads chat history from storage.
 */
export function initAssistant() {
  apiKey = storage.get('gemini_api_key', null);
  chatHistory = storage.get('chat_history', []);

  setupChatUI();
  setupEventListeners();

  if (chatHistory.length > 0) {
    renderChatHistory();
  } else {
    showWelcomeMessage();
  }

  if (!apiKey) {
    showAPIKeyPrompt();
  }
}

/**
 * Sets up the chat user interface elements.
 */
function setupChatUI() {
  const suggestionsContainer = qs('#chat-suggestions');
  if (!suggestionsContainer) {
    return;
  }

  suggestionsContainer.innerHTML = '';
  SUGGESTED_QUESTIONS.forEach((question) => {
    const btn = createElement(
      'button',
      {
        className: 'suggestion-chip',
        'aria-label': `Ask: ${question}`,
        dataset: { question },
      },
      question
    );
    btn.addEventListener('click', () => handleSendMessage(question));
    suggestionsContainer.appendChild(btn);
  });
}

/**
 * Sets up event listeners for the chat interface.
 */
function setupEventListeners() {
  const sendBtn = qs('#chat-send-btn');
  const chatInput = qs('#chat-input');
  const apiKeyBtn = qs('#api-key-save-btn');
  const clearBtn = qs('#chat-clear-btn');

  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const input = qs('#chat-input');
      if (input && input.value.trim()) {
        handleSendMessage(input.value.trim());
        input.value = '';
      }
    });
  }

  if (chatInput) {
    chatInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        const value = chatInput.value.trim();
        if (value) {
          handleSendMessage(value);
          chatInput.value = '';
        }
      }
    });
  }

  if (apiKeyBtn) {
    apiKeyBtn.addEventListener('click', handleSaveAPIKey);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', clearChat);
  }
}

/**
 * Displays the welcome message in the chat.
 */
function showWelcomeMessage() {
  const welcome = {
    id: generateId('msg'),
    role: 'assistant',
    content: `👋 Welcome to **ElectIQ**! I'm your AI election education assistant powered by Google Gemini.\n\nI can help you understand:\n• How elections work step by step\n• Voter registration and eligibility\n• The voting process and your rights\n• Election terminology and concepts\n\nAsk me anything about elections, or try one of the suggested questions below!`,
    timestamp: Date.now(),
  };
  appendMessage(welcome);
}

/**
 * Handles saving the API key.
 */
function handleSaveAPIKey() {
  const input = qs('#api-key-input');
  if (!input) {
    return;
  }

  const key = input.value.trim();

  if (!isValidAPIKey(key)) {
    showToast('Please enter a valid Gemini API key', 'error');
    return;
  }

  apiKey = key;
  storage.set('gemini_api_key', key);

  const keySection = qs('#api-key-section');
  if (keySection) {
    keySection.classList.add('hidden');
  }

  showToast('API key saved successfully!', 'success');
  announce('API key saved. You can now chat with the AI assistant.');
}

/**
 * Shows the API key input prompt.
 */
function showAPIKeyPrompt() {
  const keySection = qs('#api-key-section');
  if (keySection) {
    keySection.classList.remove('hidden');
  }
}

/**
 * Handles sending a user message and getting an AI response.
 * @param {string} message - The user's message text.
 */
async function handleSendMessage(message) {
  if (isLoading) {
    return;
  }

  const validation = validateInput(message);
  if (!validation.isValid) {
    showToast(validation.error, 'warning');
    return;
  }

  /* Check rate limit */
  const rateCheck = rateLimiter.check('chat');
  if (!rateCheck.allowed) {
    const waitSec = Math.ceil(rateCheck.retryAfterMs / 1000);
    showToast(`Please wait ${waitSec}s before sending another message`, 'warning');
    return;
  }

  /* Add user message */
  const userMsg = {
    id: generateId('msg'),
    role: 'user',
    content: validation.sanitized,
    timestamp: Date.now(),
  };
  chatHistory.push(userMsg);
  appendMessage(userMsg);

  /* Hide suggestions after first message */
  const suggestions = qs('#chat-suggestions');
  if (suggestions) {
    suggestions.classList.add('hidden');
  }

  /* Show typing indicator */
  isLoading = true;
  showTypingIndicator();
  updateSendButtonState();

  try {
    const response = await callGeminiAPI(validation.sanitized);
    removeTypingIndicator();

    const assistantMsg = {
      id: generateId('msg'),
      role: 'assistant',
      content: response,
      timestamp: Date.now(),
    };
    chatHistory.push(assistantMsg);
    appendMessage(assistantMsg);
    announce('New response from ElectIQ assistant');
  } catch (error) {
    removeTypingIndicator();
    const errorMsg = getErrorMessage(error);
    appendMessage({
      id: generateId('msg'),
      role: 'error',
      content: errorMsg,
      timestamp: Date.now(),
    });
    showToast('Failed to get response. Please try again.', 'error');
  } finally {
    isLoading = false;
    updateSendButtonState();
    saveChatHistory();
  }
}

/**
 * Calls the Google Gemini API to generate a response.
 * @param {string} userMessage - The user's message.
 * @returns {Promise<string>} The AI response text.
 * @throws {Error} If the API call fails.
 */
async function callGeminiAPI(userMessage) {
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }

  const url = `${APP_CONFIG.GEMINI_API_URL}/${APP_CONFIG.GEMINI_MODEL}:generateContent?key=${apiKey}`;

  /* Build conversation context from recent messages */
  const recentHistory = chatHistory.slice(-10).map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const requestBody = {
    contents: [
      { role: 'user', parts: [{ text: GEMINI_SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Understood. I am ElectIQ, ready to help with election education.' }] },
      ...recentHistory,
      { role: 'user', parts: [{ text: userMessage }] },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response content received from the API.');
  }

  return text;
}

/**
 * Converts markdown-like text to HTML for display.
 * @param {string} text - The text to format.
 * @returns {string} HTML formatted text.
 */
function formatMessageContent(text) {
  let html = escapeHTML(text);

  /* Bold: **text** */
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  /* Italic: *text* */
  html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  /* Bullet points: • or - at line start */
  html = html.replace(/^[•\-]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  /* Line breaks */
  html = html.replace(/\n/g, '<br>');

  return html;
}

/**
 * Appends a message to the chat container.
 * @param {Object} message - The message object to display.
 * @param {string} message.role - 'user', 'assistant', or 'error'.
 * @param {string} message.content - The message content.
 */
function appendMessage(message) {
  const container = qs('#chat-messages');
  if (!container) {
    return;
  }

  const messageEl = createElement('div', {
    className: `chat-message chat-message--${message.role}`,
    id: message.id,
    'aria-label': `${message.role === 'user' ? 'You' : 'ElectIQ'}: ${message.content.slice(0, 80)}`,
  });

  const avatarIcon = message.role === 'user' ? '👤' : message.role === 'error' ? '⚠️' : '🗳️';
  const avatar = createElement('div', { className: 'chat-message__avatar' }, avatarIcon);

  const bubble = createElement('div', { className: 'chat-message__bubble' });
  bubble.innerHTML = formatMessageContent(message.content);

  messageEl.appendChild(avatar);
  messageEl.appendChild(bubble);
  container.appendChild(messageEl);

  /* Animate entrance */
  requestAnimationFrame(() => messageEl.classList.add('chat-message--visible'));

  /* Scroll to bottom */
  container.scrollTop = container.scrollHeight;
}

/**
 * Shows a typing indicator in the chat.
 */
function showTypingIndicator() {
  const container = qs('#chat-messages');
  if (!container) {
    return;
  }

  const indicator = createElement(
    'div',
    { className: 'chat-typing', id: 'typing-indicator', 'aria-label': 'ElectIQ is typing' },
    createElement('div', { className: 'chat-message__avatar' }, '🗳️'),
    createElement(
      'div',
      { className: 'chat-typing__dots' },
      createElement('span', { className: 'chat-typing__dot' }),
      createElement('span', { className: 'chat-typing__dot' }),
      createElement('span', { className: 'chat-typing__dot' })
    )
  );

  container.appendChild(indicator);
  container.scrollTop = container.scrollHeight;
}

/**
 * Removes the typing indicator from the chat.
 */
function removeTypingIndicator() {
  const indicator = qs('#typing-indicator');
  if (indicator) {
    indicator.remove();
  }
}

/**
 * Updates the send button disabled state based on loading status.
 */
function updateSendButtonState() {
  const sendBtn = qs('#chat-send-btn');
  const chatInput = qs('#chat-input');

  if (sendBtn) {
    sendBtn.disabled = isLoading;
  }
  if (chatInput) {
    chatInput.disabled = isLoading;
  }
}

/**
 * Renders the full chat history from stored messages.
 */
function renderChatHistory() {
  const container = qs('#chat-messages');
  if (!container) {
    return;
  }

  container.innerHTML = '';
  chatHistory.forEach((msg) => appendMessage(msg));
}

/**
 * Saves chat history to localStorage, trimming to max length.
 */
function saveChatHistory() {
  const trimmed = chatHistory.slice(-APP_CONFIG.MAX_CHAT_HISTORY);
  storage.set('chat_history', trimmed);
}

/**
 * Clears the chat history.
 */
function clearChat() {
  chatHistory = [];
  storage.remove('chat_history');

  const container = qs('#chat-messages');
  if (container) {
    container.innerHTML = '';
  }

  showWelcomeMessage();

  const suggestions = qs('#chat-suggestions');
  if (suggestions) {
    suggestions.classList.remove('hidden');
  }

  showToast('Chat history cleared', 'info');
  announce('Chat history cleared');
}

/**
 * Returns a user-friendly error message based on error type.
 * @param {Error} error - The error object.
 * @returns {string} Human-readable error message.
 */
function getErrorMessage(error) {
  if (error.message === 'API_KEY_MISSING') {
    return '🔑 Please enter your Gemini API key above to start chatting with the AI assistant.';
  }
  if (error.message.includes('API key')) {
    return '🔑 Invalid API key. Please check your Gemini API key and try again.';
  }
  if (error.message.includes('429') || error.message.includes('quota')) {
    return '⏳ Rate limit reached. Please wait a moment and try again.';
  }
  if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
    return '🌐 Network error. Please check your internet connection and try again.';
  }
  return `❌ Something went wrong: ${escapeHTML(error.message)}. Please try again.`;
}
