import React from 'react';
import { FloatingChatWidget } from './FloatingChatWidget';

interface EmbeddableChatWidgetProps {
  chatbotId: string;
}

/**
 * This component is designed to be embedded in client websites.
 * It provides a floating chat button that opens a side panel with conversation history.
 */
export function EmbeddableChatWidget({ chatbotId }: EmbeddableChatWidgetProps) {
  return <FloatingChatWidget chatbotId={chatbotId} />;
}

/**
 * This function can be used to embed the chat widget in any website.
 * 
 * Usage:
 * <script src="https://your-domain.com/widget.js"></script>
 * <script>
 *   initChatWidget('your-chatbot-id');
 * </script>
 */
export function initChatWidget(chatbotId: string, targetElementId?: string) {
  // If a target element is provided, render the widget there
  if (targetElementId) {
    const targetElement = document.getElementById(targetElementId);
    if (targetElement) {
      const widgetContainer = document.createElement('div');
      targetElement.appendChild(widgetContainer);
      
      // Render the widget (this would require React to be loaded)
      // In a real implementation, you'd use ReactDOM.render or createRoot
      // ReactDOM.render(<EmbeddableChatWidget chatbotId={chatbotId} />, widgetContainer);
    }
  } else {
    // Otherwise, create a new element and append it to the body
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'chat-widget-container';
    document.body.appendChild(widgetContainer);
    
    // Render the widget (this would require React to be loaded)
    // In a real implementation, you'd use ReactDOM.render or createRoot
    // ReactDOM.render(<EmbeddableChatWidget chatbotId={chatbotId} />, widgetContainer);
  }
}

// For non-React websites, you could expose this function globally
if (typeof window !== 'undefined') {
  (window as any).initChatWidget = initChatWidget;
}
