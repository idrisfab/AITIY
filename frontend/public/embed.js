// ATTIY Chat Widget Embed Script
(function() {
  // Configuration
  const WIDGET_URL = 'http://localhost:3000';
  
  // Create and inject styles
  const style = document.createElement('style');
  style.textContent = `
    .attiy-chat-widget {
      position: fixed;
      z-index: 999999;
      max-height: 90vh;
      max-width: 400px;
      min-height: 250px;
      width: 100%;
      box-shadow: 0 12px 24px -6px rgba(0,0,0,.15),0 0 10px -6px rgba(0,0,0,.1);
      border-radius: 16px;
      overflow: hidden;
      opacity: 1;
      transform-origin: bottom right;
      transition: all 0.3s ease;
    }
    .attiy-chat-widget.bottom-right {
      bottom: 20px;
      right: 20px;
    }
    .attiy-chat-widget.bottom-left {
      bottom: 20px;
      left: 20px;
    }
    .attiy-chat-widget.top-right {
      top: 20px;
      right: 20px;
    }
    .attiy-chat-widget.top-left {
      top: 20px;
      left: 20px;
    }
    .attiy-chat-widget iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
    }
    .attiy-chat-widget.closed {
      opacity: 0;
      transform: scale(0.8);
      pointer-events: none;
    }
    .attiy-chat-toggle {
      position: fixed;
      z-index: 999999;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--attiy-primary-color, #000);
      cursor: pointer;
      box-shadow: 0 8px 16px -4px rgba(0,0,0,.1);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .attiy-chat-toggle:hover {
      transform: scale(1.1);
    }
    .attiy-chat-toggle:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(var(--attiy-primary-color-rgb, 0, 0, 0), 0.3), 0 8px 16px -4px rgba(0,0,0,.1);
    }
    .attiy-chat-toggle.bottom-right {
      bottom: 20px;
      right: 20px;
    }
    .attiy-chat-toggle.bottom-left {
      bottom: 20px;
      left: 20px;
    }
    .attiy-chat-toggle.top-right {
      top: 20px;
      right: 20px;
    }
    .attiy-chat-toggle.top-left {
      top: 20px;
      left: 20px;
    }
    .attiy-chat-toggle .attiy-chat-icon {
      width: 24px;
      height: 24px;
      transition: transform 0.3s ease;
    }
    .attiy-chat-toggle.open .attiy-chat-icon {
      transform: rotate(45deg);
    }
    .attiy-chat-toggle .attiy-unread-badge {
      position: absolute;
      top: 0;
      right: 0;
      width: 20px;
      height: 20px;
      background-color: #ff4c4c;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: bold;
      opacity: 0;
      transform: scale(0);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .attiy-chat-toggle .attiy-unread-badge.show {
      opacity: 1;
      transform: scale(1);
    }
    
    /* Animations */
    @keyframes attiy-pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(var(--attiy-primary-color-rgb, 0, 0, 0), 0.4);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(var(--attiy-primary-color-rgb, 0, 0, 0), 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(var(--attiy-primary-color-rgb, 0, 0, 0), 0);
      }
    }
    
    /* Initial animation */
    .attiy-chat-toggle.pulse {
      animation: attiy-pulse 2s infinite;
    }
    
    /* Loading animation */
    .attiy-loading-dots {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }
    .attiy-loading-dots span {
      width: 8px;
      height: 8px;
      margin: 0 4px;
      background-color: white;
      border-radius: 50%;
      opacity: 0.8;
      animation: attiy-loading-dot 1.4s infinite;
    }
    .attiy-loading-dots span:nth-child(2) {
      animation-delay: 0.2s;
    }
    .attiy-loading-dots span:nth-child(3) {
      animation-delay: 0.4s;
    }
    @keyframes attiy-loading-dot {
      0%, 100% {
        transform: scale(0.5);
        opacity: 0.5;
      }
      50% {
        transform: scale(1);
        opacity: 1;
      }
    }
    
    /* Media query for mobile devices */
    @media screen and (max-width: 480px) {
      .attiy-chat-widget {
        width: 100%;
        max-width: 100%;
        max-height: 100%;
        height: 70vh;
        bottom: 0 !important;
        top: auto !important;
        left: 0 !important;
        right: 0 !important;
        border-radius: 16px 16px 0 0;
      }
      .attiy-chat-toggle {
        width: 50px;
        height: 50px;
      }
    }
  `;
  document.head.appendChild(style);

  // Helper function to convert hex to RGB
  function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
  }

  // Initialize widget
  function initWidget() {
    const containers = document.querySelectorAll('[data-embed-id]');
    containers.forEach(container => {
      const embedId = container.getAttribute('data-embed-id');
      const position = container.getAttribute('data-position') || 'bottom-right';
      const primaryColor = container.getAttribute('data-primary-color') || '#000000';
      
      // Set primary color CSS variables
      document.documentElement.style.setProperty('--attiy-primary-color', primaryColor);
      document.documentElement.style.setProperty('--attiy-primary-color-rgb', hexToRgb(primaryColor));

      // Create widget container
      const widgetContainer = document.createElement('div');
      widgetContainer.className = `attiy-chat-widget ${position} closed`;
      widgetContainer.setAttribute('aria-hidden', 'true');
      
      // Create toggle button
      const toggleButton = document.createElement('button'); // Use button for better accessibility
      toggleButton.className = `attiy-chat-toggle ${position} pulse`;
      toggleButton.setAttribute('aria-label', 'Chat with us');
      toggleButton.setAttribute('title', 'Chat with us');
      
      // Create chat icon
      const chatIcon = document.createElement('div');
      chatIcon.className = 'attiy-chat-icon';
      chatIcon.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
      
      // Create unread badge
      const unreadBadge = document.createElement('div');
      unreadBadge.className = 'attiy-unread-badge';
      unreadBadge.textContent = '1';
      
      toggleButton.appendChild(chatIcon);
      toggleButton.appendChild(unreadBadge);

      // Create loading indicator that shows while iframe is loading
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'attiy-loading-dots';
      loadingIndicator.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
      `;
      widgetContainer.appendChild(loadingIndicator);

      // Create iframe (but don't set src yet to allow loading animation)
      const iframe = document.createElement('iframe');
      iframe.allow = 'microphone';
      iframe.title = 'Chat with us';
      iframe.style.display = 'none'; // Hide initially until loaded
      widgetContainer.appendChild(iframe);

      // Add event listeners
      toggleButton.addEventListener('click', () => {
        widgetContainer.classList.toggle('closed');
        toggleButton.classList.toggle('open');
        
        // Set iframe src only on first open to avoid unnecessary loads
        if (iframe.src === '') {
          iframe.src = `${WIDGET_URL}/embed/${embedId}`;
        }
        
        if (widgetContainer.classList.contains('closed')) {
          widgetContainer.setAttribute('aria-hidden', 'true');
          toggleButton.setAttribute('aria-expanded', 'false');
          toggleButton.setAttribute('aria-label', 'Open chat');
        } else {
          widgetContainer.setAttribute('aria-hidden', 'false');
          toggleButton.setAttribute('aria-expanded', 'true');
          toggleButton.setAttribute('aria-label', 'Close chat');
          // Remove the pulse animation after first click
          toggleButton.classList.remove('pulse');
          // Hide unread badge when opening
          unreadBadge.classList.remove('show');
        }
      });

      // Add to page
      document.body.appendChild(widgetContainer);
      document.body.appendChild(toggleButton);

      // Handle iframe loaded event
      iframe.addEventListener('load', () => {
        loadingIndicator.style.display = 'none';
        iframe.style.display = 'block';
      });

      // Handle messages from iframe
      window.addEventListener('message', (event) => {
        if (event.origin !== WIDGET_URL) return;
        
        if (event.data.type === 'attiy:close') {
          widgetContainer.classList.add('closed');
          toggleButton.classList.remove('open');
          widgetContainer.setAttribute('aria-hidden', 'true');
          toggleButton.setAttribute('aria-expanded', 'false');
        } else if (event.data.type === 'attiy:new-message' && widgetContainer.classList.contains('closed')) {
          // Show unread badge when new message comes in and chat is closed
          unreadBadge.classList.add('show');
        }
      });
      
      // Add keyboard shortcut to open/close chat (Shift+/)
      document.addEventListener('keydown', (e) => {
        if (e.shiftKey && e.key === '?') {
          toggleButton.click();
        }
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})(); 