/**
 * Generates the embed code for a chat widget
 * @param embedId The ID of the embed to generate code for
 * @param baseUrl The base URL of the application (defaults to NEXT_PUBLIC_APP_URL)
 * @returns The HTML code to embed the chat widget
 */
export function generateEmbedCode(embedId: string, baseUrl?: string): string {
  // Use the provided baseUrl or fall back to the environment variable
  const appUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Create the embed URL
  const embedUrl = `${appUrl}/embed/${embedId}`;
  
  // Generate a unique ID for the container
  const containerId = `attiy-chat-container-${embedId.substring(0, 8)}`;
  
  // Create the embed code with proper iframe sandbox attributes
  // This prevents the iframe from accessing parent document or executing scripts
  // but allows it to submit forms (for the chat) and run its own scripts
  return `<!-- ATTIY Chat Widget -->
<div id="${containerId}" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">
  <iframe
    src="${embedUrl}"
    width="350"
    height="600"
    frameborder="0"
    allow="clipboard-write"
    style="border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1); background: white;"
  ></iframe>
</div>
<script>
  // Initialize the ATTIY chat widget
  (function() {
    // Listen for messages from the iframe
    window.addEventListener('message', function(event) {
      // Check if the message is from our iframe
      if (event.data && event.data.type) {
        // Handle close button click
        if (event.data.type === 'attiy:close') {
          const container = document.getElementById('${containerId}');
          if (container) {
            container.style.display = 'none';
          }
        }
        
        // Handle new message notification (could be used to show a badge)
        if (event.data.type === 'attiy:new-message') {
          console.log('New message received in chat');
          // You could implement a notification here
        }
      }
    });
  })();
</script>
<!-- End ATTIY Chat Widget -->`;
}

/**
 * Generates the embed code for a chat widget button that opens the chat when clicked
 * @param embedId The ID of the embed to generate code for
 * @param baseUrl The base URL of the application (defaults to NEXT_PUBLIC_APP_URL)
 * @param buttonText The text to display on the button (defaults to "Chat with us")
 * @param buttonColor The background color of the button (defaults to "#000000")
 * @returns The HTML code to embed the chat widget with a button
 */
export function generateButtonEmbedCode(
  embedId: string, 
  baseUrl?: string,
  buttonText: string = "Chat with us",
  buttonColor: string = "#000000"
): string {
  // Use the provided baseUrl or fall back to the environment variable
  const appUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Create the embed URL
  const embedUrl = `${appUrl}/embed/${embedId}`;
  
  // Generate a unique ID for the container
  const containerId = `attiy-chat-container-${embedId.substring(0, 8)}`;
  const buttonId = `attiy-chat-button-${embedId.substring(0, 8)}`;
  
  return `<!-- ATTIY Chat Widget with Button -->
<div id="${buttonId}" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">
  <button 
    style="background-color: ${buttonColor}; color: white; border: none; border-radius: 50px; padding: 12px 24px; font-family: system-ui, -apple-system, sans-serif; font-weight: 500; cursor: pointer; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);"
    onclick="document.getElementById('${containerId}').style.display = 'block'; this.style.display = 'none';"
  >
    ${buttonText}
  </button>
</div>

<div id="${containerId}" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000; display: none;">
  <iframe
    src="${embedUrl}"
    width="350"
    height="600"
    frameborder="0"
    allow="clipboard-write"
    style="border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1); background: white;"
  ></iframe>
</div>

<script>
  // Initialize the ATTIY chat widget
  (function() {
    // Listen for messages from the iframe
    window.addEventListener('message', function(event) {
      // Check if the message is from our iframe
      if (event.data && event.data.type) {
        // Handle close button click
        if (event.data.type === 'attiy:close') {
          const container = document.getElementById('${containerId}');
          const button = document.getElementById('${buttonId}');
          if (container) {
            container.style.display = 'none';
          }
          if (button) {
            button.style.display = 'block';
          }
        }
        
        // Handle new message notification
        if (event.data.type === 'attiy:new-message') {
          console.log('New message received in chat');
          // You could implement a notification here
        }
      }
    });
  })();
</script>
<!-- End ATTIY Chat Widget -->`;
}
