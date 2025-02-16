const typingForm = document.querySelector(".typing_form");
const chatList = document.querySelector(".chat_list");
const suggessions = document.querySelectorAll(".suggession_list .suggession");
const toggleThemeButton = document.querySelector("#toggle_theme_button");
const deleteChatButton = document.querySelector("#delete_chat_button");

let userMessage = null;
let isResponseGenerating = false;

// API Configuration
// const API_KEY = "AIzaSyDMywC9vGkmbuZ1NQ5aXJsGrdW_BfjPqYg    ";
// const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const GEMINI_API_KEY = "AIzaSyD2a-qvSQOie2Q1LsQVM4eKVmM9msjsuYY"
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;


const typingInput = document.querySelector('.typing_input');

// Function to adjust the height based on input
function adjustTextareaHeight() {
    // Reset the height to auto before calculating the scrollHeight
    typingInput.style.height = 'auto';
    
    // Set the height to the scrollHeight, but don't exceed the max-height
    typingInput.style.height = `${Math.min(typingInput.scrollHeight, 120)}px`;
    
    // To show the scrollbar only when needed
    if (typingInput.scrollHeight > 120) {
        typingInput.style.overflowY = 'scroll';
    } else {
        typingInput.style.overflowY = 'hidden';
    }
}

// Event listener to call the function on input
typingInput.addEventListener('input', adjustTextareaHeight);

// Initialize the textarea height when the page loads
adjustTextareaHeight();


const loadLocalstorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

    // Apply the stored theme
    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    // Restore Saved Chats
    chatList.innerHTML = savedChats || "";

    document.body.classList.toggle("hide_header", savedChats);
    chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
}

loadLocalstorageData();

// Create a new message element and return it
const createMessageElement = (contemt, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = contemt;
    return div; 
}

// Show typing effects by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currentWordIndex = 0;

    const typingInterval = setInterval(() => {
        // Append each word to the text element with a space
        textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        // If all words are displayed
        if(currentWordIndex === words.length) {
            clearInterval(typingInterval);
            isResponseGenerating = false;
        incomingMessageDiv.querySelector(".icon").classList.remove("hide");
        localStorage.setItem("savedChats", chatList.innerHTML); // save chats to local storage
        } 
        chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
    }, 75);
}

// Fetch response from the API based on user message 
const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text"); //Get text Element

    // Send a POST request to the API with the user's message
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json3" },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: userMessage }]
                }]
            })
        });

        const data = await response.json();
        if(!response.ok) throw new Error(data.error.message);

        // Get the API response text and remove asteriks from it
        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
        showTypingEffect(apiResponse, textElement, incomingMessageDiv);    
    } catch(error) {
        isResponseGenerating = false;
        textElement.innerText = error.message;
        textElement.classList.add("error");
    }
    finally{
        incomingMessageDiv.classList.remove("loading");
    }
}

// Show a loading animation while waiting for the API response
const showLoadinganimation = () => {
    const html = `<div class="message_content">
                    <img src="images/bot.png" alt="Bot Img" class="avatar">
                    <p class="text"></p>
                    <div class="loading_indicator">
                        <div class="loading_bar"></div>
                        <div class="loading_bar"></div>
                        <div class="loading_bar"></div>
                    </div>
                </div>
                <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatList.appendChild(incomingMessageDiv);
    
    chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
    generateAPIResponse(incomingMessageDiv);
}

// Copy message text to the clipboard
const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;
    
    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done"; // show tick icon
    setTimeout(() => copyIcon.innerText = "content_copy", 1000); // revert icon after 1 second
}

// Handle sending outgoing chat messages
function handleOutgoingChat() {
    userMessage = typingForm.querySelector(".typing_input").value.trim() || userMessage;
    if (!userMessage || isResponseGenerating) return; // Exit if there is no message

    isResponseGenerating = true;

    const html = `
            <div class="message_content">
                <img src="images/new_user.png" alt="User Img" class="avatar">
                <p class="text"></p>
            </div>`;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset(); // Clear input Feild
    chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
    document.body.classList.add("hide_header"); // hide the header once chat start
    setTimeout(showLoadinganimation, 500); // Show loading animation after a delay

}

// Set userMessage and handle outgoing chat when a suggession is clicked
suggessions.forEach(suggession => {
    suggession.addEventListener("click", () => {
        userMessage = suggession.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});

// toggle between light and dark themes
toggleThemeButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

// Delete all chats from local storage when button is clicked
deleteChatButton.addEventListener("click", () => {
    if(confirm("Are you sure you want to delete all messages?")) {
        localStorage.removeItem("savedChats");
        loadLocalstorageData();
    }
});

// // Prevent default from submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
    e.preventDefault();

    handleOutgoingChat();
});





