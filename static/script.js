document.addEventListener('DOMContentLoaded', function() {
    // Website Chatbot Elements
    const chatbotButton = document.getElementById('chatbot-button');
    const chatbotContainer = document.getElementById('chatbot-container');
    const chatbotMinimize = document.getElementById('chatbot-minimize');
    const chatbotExpand = document.getElementById('chatbot-expand');
    const fullscreenChatbot = document.getElementById('fullscreen-chatbot');
    const fullscreenMinimize = document.getElementById('fullscreen-minimize');
    const fullscreenClose = document.getElementById('fullscreen-close');
    
    // New Chat buttons
    const newChatMini = document.getElementById('new-chat-mini');
    const newChatFull = document.getElementById('new-chat-full');
    
    // Chat elements for small chatbot
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInputField = document.getElementById('chatbot-input-field');
    const chatbotSendBtn = document.getElementById('chatbot-send-btn');
    const quickQuestionBtns = document.querySelectorAll('.quick-question-btn');
    
    // Chat elements for fullscreen chatbot
    const fullscreenMessages = document.getElementById('fullscreen-messages');
    const fullscreenInputField = document.getElementById('fullscreen-input-field');
    const fullscreenSendBtn = document.getElementById('fullscreen-send-btn');
    
    // Chat history elements
    const showHistoryBtn = document.getElementById('show-history-btn');
    const chatHistoryDropdown = document.getElementById('chat-history-dropdown');
    const fullscreenHistory = document.getElementById('fullscreen-history');
    
    // FAQ links
    const faqLinks = document.querySelectorAll('.faq-link');
    
    // Chat history storage
    let chatHistory = [];
    let userId = 'user_' + Date.now();
    let currentChatId = 'chat_' + Date.now();
    let savedChats = {}; // Object to store multiple chat sessions
    
    // Generate unique user ID if none exists
    if (localStorage.getItem('chatUserId')) {
        userId = localStorage.getItem('chatUserId');
    } else {
        localStorage.setItem('chatUserId', userId);
    }
    
    // Load chat history from localStorage if available
    if (localStorage.getItem('chatHistory')) {
        try {
            chatHistory = JSON.parse(localStorage.getItem('chatHistory'));
            updateHistoryUI();
        } catch (e) {
            console.error('Error loading chat history:', e);
            chatHistory = [];
        }
    }
    
    // Load saved chats if available
    if (localStorage.getItem('savedChats')) {
        try {
            savedChats = JSON.parse(localStorage.getItem('savedChats'));
            updateSavedChatsUI();
        } catch (e) {
            console.error('Error loading saved chats:', e);
            savedChats = {};
        }
    }
    
    // Toggle chatbot container visibility with animation
    chatbotButton.addEventListener('click', function() {
        if (!chatbotContainer.classList.contains('active')) {
            chatbotContainer.style.visibility = 'visible';
            setTimeout(() => {
                chatbotContainer.classList.add('active');
            }, 10);
        } else {
            chatbotContainer.classList.remove('active');
            setTimeout(() => {
                chatbotContainer.style.visibility = 'hidden';
            }, 300);
        }
    });
    
    // Minimize chatbot
    chatbotMinimize.addEventListener('click', function() {
        chatbotContainer.classList.remove('active');
        setTimeout(() => {
            chatbotContainer.style.visibility = 'hidden';
        }, 300);
    });
    
    // Expand to fullscreen with improved animation
    chatbotExpand.addEventListener('click', function() {
        chatbotContainer.classList.remove('active');
        setTimeout(() => {
            chatbotContainer.style.visibility = 'hidden';
            fullscreenChatbot.style.visibility = 'visible';
            setTimeout(() => {
                fullscreenChatbot.classList.add('active');
                // Copy messages from small chatbot to fullscreen
                syncMessages(chatbotMessages, fullscreenMessages);
                // Force scroll after transition
                setTimeout(() => {
                    scrollToBottomSmooth(fullscreenMessages);
                }, 300);
            }, 10);
        }, 300);
    });
    
    // Minimize fullscreen with improved animation
    fullscreenMinimize.addEventListener('click', function() {
        fullscreenChatbot.classList.remove('active');
        setTimeout(() => {
            fullscreenChatbot.style.visibility = 'hidden';
            chatbotContainer.style.visibility = 'visible';
            setTimeout(() => {
                chatbotContainer.classList.add('active');
                // Copy messages from fullscreen to small chatbot
                syncMessages(fullscreenMessages, chatbotMessages);
                scrollToBottom(chatbotMessages);
            }, 10);
        }, 300);
    });
    
    // Close fullscreen
    fullscreenClose.addEventListener('click', function() {
        fullscreenChatbot.classList.remove('active');
        setTimeout(() => {
            fullscreenChatbot.style.visibility = 'hidden';
        }, 300);
    });
    
    // New Chat functionality (Mini)
    newChatMini.addEventListener('click', function() {
        // Save current chat if it exists
        if (chatHistory.length > 0) {
            savedChats[currentChatId] = [...chatHistory];
            localStorage.setItem('savedChats', JSON.stringify(savedChats));
        }
        
        // Start new chat
        chatHistory = [];
        currentChatId = 'chat_' + Date.now();
        
        // Clear UI
        clearChatMessages(chatbotMessages);
        clearChatMessages(fullscreenMessages);
        
        // Show welcome message again
        showWelcomeMessage(chatbotMessages);
        
        // Update localStorage
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        
        // Update history UI
        updateSavedChatsUI();
    });
    
    // New Chat functionality (Fullscreen)
    newChatFull.addEventListener('click', function() {
        // Save current chat if it exists
        if (chatHistory.length > 0) {
            savedChats[currentChatId] = [...chatHistory];
            localStorage.setItem('savedChats', JSON.stringify(savedChats));
        }
        
        // Start new chat
        chatHistory = [];
        currentChatId = 'chat_' + Date.now();
        
        // Clear UI
        clearChatMessages(chatbotMessages);
        clearChatMessages(fullscreenMessages);
        
        // Show welcome message again in fullscreen
        showWelcomeMessage(fullscreenMessages);
        
        // Update localStorage
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        
        // Update history UI
        updateSavedChatsUI();
    });
    
    // Toggle chat history dropdown
    showHistoryBtn.addEventListener('click', function() {
        chatHistoryDropdown.classList.toggle('active');
    });
    
    // Click outside history dropdown to close
    document.addEventListener('click', function(event) {
        if (!showHistoryBtn.contains(event.target) && !chatHistoryDropdown.contains(event.target)) {
            chatHistoryDropdown.classList.remove('active');
        }
    });
    
    // Send message from small chatbot
    chatbotSendBtn.addEventListener('click', function() {
        sendMessage(chatbotInputField.value, chatbotMessages, chatbotInputField);
    });
    
    // Send message on Enter key in small chatbot
    chatbotInputField.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage(chatbotInputField.value, chatbotMessages, chatbotInputField);
        }
    });
    
    // Send message from fullscreen chatbot
    fullscreenSendBtn.addEventListener('click', function() {
        sendMessage(fullscreenInputField.value, fullscreenMessages, fullscreenInputField);
    });
    
    // Send message on Enter key in fullscreen chatbot
    fullscreenInputField.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage(fullscreenInputField.value, fullscreenMessages, fullscreenInputField);
        }
    });
    
    // Handle quick question buttons
    quickQuestionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const question = this.textContent;
            sendMessage(question, chatbotMessages, chatbotInputField);
        });
    });

    // Handle FAQ links
    faqLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const question = this.textContent;
            sendMessage(question, fullscreenMessages, fullscreenInputField);
        });
    });

    // Function to clear chat messages
    function clearChatMessages(container) {
        // Remove all child elements except welcome message
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }
    
    // Function to show welcome message
    function showWelcomeMessage(container) {
        const welcomeMsg = document.createElement('div');
        welcomeMsg.classList.add('welcome-message');
        welcomeMsg.innerHTML = `
            <h4>Welcome to DYPIEMR Chat</h4>
            <p>How can I assist you today?</p>
            <div class="quick-questions">
                <button class="quick-question-btn">Admission Process</button>
                <button class="quick-question-btn">Courses Offered</button>
                <button class="quick-question-btn">Hostel Facilities</button>
                <button class="quick-question-btn">Placement Records</button>
            </div>
        `;
        container.appendChild(welcomeMsg);
        
        // Add event listeners to new quick question buttons
        welcomeMsg.querySelectorAll('.quick-question-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const question = this.textContent;
                sendMessage(question, container, 
                    container === chatbotMessages ? chatbotInputField : fullscreenInputField);
            });
        });
    }

    // Function to send message
    function sendMessage(messageText, messagesContainer, inputField) {
        messageText = messageText.trim();
        if (messageText === '') return;
        
        // Add user message to UI
        addMessageToUI(messageText, 'user', messagesContainer);
        
        // Clear input field
        inputField.value = '';
        
        // Add to chat history
        chatHistory.push({ user: messageText });
        
        // Save to localStorage
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        
        // Scroll to bottom
        scrollToBottom(messagesContainer);
        
        // Update history UI
        updateHistoryUI();
        
        // Show typing indicator (we'll check if it's likely a Gemini response first)
        getBotResponse(messageText).then(response => {
            // Check if this is a Gemini response
            const isGeminiResponse = response && response.includes('class="gemini-response"');
            
            // If it's a Gemini response, show the Gemini typing indicator
            if (isGeminiResponse) {
                // Show Gemini thinking indicator
                const typingIndicatorElement = showGeminiTypingIndicator(messagesContainer);
                
                // Give Gemini typing indicator some time to be visible (minimum 1.5 seconds)
                setTimeout(() => {
                    // Remove typing indicator
                    removeTypingIndicator(messagesContainer);
                    
                    // Add bot message with typing effect
                    addMessageToUI(response, 'bot', messagesContainer, true);
                    
                    // Add to chat history
                    chatHistory.push({ bot: response });
                    
                    // Save to localStorage
                    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
                    
                    // Save current chat to saved chats
                    savedChats[currentChatId] = [...chatHistory];
                    localStorage.setItem('savedChats', JSON.stringify(savedChats));
                    
                    // Update history UI
                    updateHistoryUI();
                    
                    // Sync messages between containers
                    if (messagesContainer === chatbotMessages) {
                        syncMessages(chatbotMessages, fullscreenMessages);
                    } else {
                        syncMessages(fullscreenMessages, chatbotMessages);
                    }
                }, 1500); // Minimum time the Gemini typing indicator is shown
            } else {
                // Standard response handling for non-Gemini responses
                // Show standard typing indicator for non-Gemini responses
                const typingIndicatorElement = showTypingIndicator(messagesContainer);
                
                // Short delay for typing indicator to be visible
                setTimeout(() => {
                    // Remove typing indicator
                    removeTypingIndicator(messagesContainer);
                    
                    // Add bot message with typing effect
                    addMessageToUI(response, 'bot', messagesContainer, true);
                    
                    // Add to chat history
                    chatHistory.push({ bot: response });
                    
                    // Save to localStorage
                    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
                    
                    // Save current chat to saved chats
                    savedChats[currentChatId] = [...chatHistory];
                    localStorage.setItem('savedChats', JSON.stringify(savedChats));
                    
                    // Update history UI
                    updateHistoryUI();
                    
                    // Sync messages between containers
                    if (messagesContainer === chatbotMessages) {
                        syncMessages(chatbotMessages, fullscreenMessages);
                    } else {
                        syncMessages(fullscreenMessages, chatbotMessages);
                    }
                }, 500); // Shorter time for standard typing indicator
            }
        });
    }
    
    // Function to show Gemini typing indicator
    function showGeminiTypingIndicator(container) {
        const typingElement = document.createElement('div');
        typingElement.classList.add('message', 'bot', 'typing-indicator-container');
        typingElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="gemini-typing">
                        <span>Gemini is thinking</span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(typingElement);
        scrollToBottom(container);
        return typingElement;
    }
    
    // Function to add message to UI with improved animations and link detection
    function addMessageToUI(text, sender, container, withTypingEffect = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        messageElement.setAttribute('role', 'article');

        const avatarElement = document.createElement('div');
        avatarElement.classList.add('message-avatar');
        const avatarIcon = document.createElement('i');

        if (sender === 'bot') {
            avatarIcon.classList.add('fas', 'fa-robot');
            avatarElement.setAttribute('aria-label', 'Bot message');
        } else {
            avatarIcon.classList.add('fas', 'user');
            avatarElement.setAttribute('aria-label', 'Your message');
        }

        avatarElement.appendChild(avatarIcon);
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');

        // Check if this is a Gemini response (has the gemini-response class)
        const isGeminiResponse = sender === 'bot' && text.includes('class="gemini-response"');
        
        // Extract actual content from Gemini wrapper if present
        if (isGeminiResponse) {
            // Create a temporary element to parse the HTML
            const tempElement = document.createElement('div');
            tempElement.innerHTML = text;
            const geminiElement = tempElement.querySelector('.gemini-response');
            if (geminiElement) {
                text = geminiElement.innerHTML;
            }
            // Mark this as a Gemini response for styling
            contentElement.classList.add('gemini-message');
        }

        // For Gemini responses, always apply typing effect
        // For other responses, skip typing effect for long content
        if ((isGeminiResponse || (withTypingEffect && sender === 'bot')) && text.length < 800) {
            contentElement.classList.add('typing-effect');
            contentElement.innerHTML = '<span class="typing-cursor"></span>';
            messageElement.appendChild(avatarElement);
            messageElement.appendChild(contentElement);
            container.appendChild(messageElement);
            scrollToBottomSmooth(container);

            const typeWriter = () => {
                let i = 0;
                // Make Gemini typing a bit slower for effect
                const speed = isGeminiResponse ? 15 : 10;
                const txtDisplay = contentElement.querySelector('.typing-cursor');
                // Smaller chunk size for Gemini to make typing more visible
                const chunkSize = isGeminiResponse ? 3 : 5;

                function type() {
                    if (i < text.length) {
                        // Process a chunk of characters
                        let chunk = '';
                        for (let j = 0; j < chunkSize && i + j < text.length; j++) {
                            if (text[i + j] === '<') {
                                // Find the end of the HTML tag
                                let tagEnd = text.indexOf('>', i + j);
                                if (tagEnd !== -1) {
                                    chunk += text.substring(i + j, tagEnd + 1);
                                    j = tagEnd - i;
                                } else {
                                    chunk += text[i + j];
                                }
                            } else {
                                chunk += text[i + j];
                            }
                        }
                        txtDisplay.innerHTML = text.substring(0, i) + chunk;
                        i += chunkSize;
                        setTimeout(type, speed);
                    } else {
                        contentElement.innerHTML = text;
                        contentElement.classList.remove('typing-effect');
                        
                        // Add gemini-message class again if it was a Gemini response
                        if (isGeminiResponse) {
                            contentElement.classList.add('gemini-message');
                        }
                    }
                    scrollToBottomSmooth(container);
                }

                type();
            };

            setTimeout(typeWriter, 100);
        } else {
            // For long messages, display immediately
            contentElement.innerHTML = text;
            
            // Add gemini-message class if it was a Gemini response
            if (isGeminiResponse) {
                contentElement.classList.add('gemini-message');
            }
            
            messageElement.appendChild(avatarElement);
            messageElement.appendChild(contentElement);
            container.appendChild(messageElement);
            
            setTimeout(() => {
                scrollToBottomSmooth(container);
            }, 0);
        }
    }
    
    // Function to format text with clickable links
    function formatTextWithLinks(text) {
        // URL pattern to detect links
        const urlPattern = /(https?:\/\/[^\s]+)/g;
        
        // Replace URLs with anchor tags
        const formattedText = text.replace(urlPattern, function(url) {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
        
        return formattedText;
    }
    
    // Enhanced scroll to bottom function with improved behavior
    function scrollToBottomSmooth(container) {
        // Force immediate scroll first
        container.scrollTop = container.scrollHeight;
        
        // For fullscreen container, ensure we're scrolling the correct element
        if (container === fullscreenMessages) {
            // Double-check if we're in fullscreen mode
            const isFullscreen = fullscreenChatbot.classList.contains('active');
            if (isFullscreen) {
                // Force scroll after a brief delay to ensure content is rendered
                setTimeout(() => {
                    container.scrollTop = container.scrollHeight;
                    // Additional force scroll after animation
                    setTimeout(() => {
                        container.scrollTop = container.scrollHeight;
                    }, 100);
                }, 50);
            }
        }
        
        // Then apply smooth scroll
        requestAnimationFrame(() => {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
            
            // Additional check for scroll position
            setTimeout(() => {
                if (container.scrollTop + container.clientHeight < container.scrollHeight) {
                    container.scrollTop = container.scrollHeight;
                }
            }, 300);
        });
    }
    
    // Function to show typing indicator
    function showTypingIndicator(container) {
        const typingElement = document.createElement('div');
        typingElement.classList.add('message', 'bot', 'typing-indicator-container');
        typingElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>
            </div>
        `;
        container.appendChild(typingElement);
        scrollToBottom(container);
        return typingElement;
    }
    
    // Function to remove typing indicator
    function removeTypingIndicator(container) {
        const typingIndicator = container.querySelector('.typing-indicator-container');
        if (typingIndicator) {
            container.removeChild(typingIndicator);
        }
    }
    
    // Function to get bot response from server
    async function getBotResponse(message) {
        try {
            // Check if the message is about hostel facilities
            if (message.toLowerCase() === 'hostel facilities') {
                const hostelInfo = `<div class="hostel-facilities">
                    <h2>D Y Patil Residency - Hostel Facilities</h2>
                    
                    <div class="video-container">
                        <iframe 
                            width="100%" 
                            height="315" 
                            src="https://www.youtube.com/embed/om10LScnct0" 
                            title="DYPIEMR Hostel Virtual Tour" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                        </iframe>
                    </div>

                    <div class="hostel-details">
                        <h3>Features & Amenities</h3>
                        <ul>
                            <li>Modern and comfortable living spaces for boys and girls</li>
                            <li>Spacious single and multiple-bedded rooms with attached washrooms</li>
                            <li>State-of-the-art Indoor Sports Complex</li>
                            <li>Fully-equipped gym</li>
                            <li>Mini Shopping Arcade</li>
                            <li>Large Dining Hall with nutritious meals</li>
                            <li>Dedicated Reading Room</li>
                            <li>TV room for entertainment</li>
                        </ul>

                        <h3>Additional Facilities</h3>
                        <ul>
                            <li>24/7 security</li>
                            <li>High-speed internet connectivity</li>
                            <li>Regular housekeeping services</li>
                            <li>Medical facilities</li>
                            <li>Power backup</li>
                            <li>Clean drinking water</li>
                        </ul>

                        <div class="hostel-contact">
                            <h3>Contact Information</h3>
                            <p><strong>Address:</strong> D.Y. Patil Educational Complex, Sector 29, Nigdi Pradhikaran, Akurdi, Pune 411044</p>
                            <p><strong>Phone:</strong> +91-20-27654470</p>
                            <p><strong>Email:</strong> hostel@dypiemr.ac.in</p>
                        </div>

                        <div class="hostel-note">
                            <p><em>Note: Hostel accommodation is subject to availability. Early application is recommended.</em></p>
                        </div>
                    </div>
                </div>`;
                
                return hostelInfo;
            }

            // Check if the message is about admission process
            if (message.toLowerCase() === 'admission process') {
                // Embed admission process data directly
                const data = {
                    "title": "Admission Process - DYPIEMR",
                    "sections": [
                        {
                            "title": "Important Dates",
                            "content": [
                                "Application Start Date: June 1, 2025",
                                "Application End Date: July 15, 2025",
                                "First Merit List: July 25, 2025",
                                "Second Merit List: August 5, 2025",
                                "Classes Begin: August 15, 2025"
                            ]
                        },
                        {
                            "title": "Eligibility Criteria",
                            "content": [
                                "Passed HSC/12th with minimum 50% marks (45% for reserved categories)",
                                "Valid JEE Main/MHT-CET score",
                                "Mathematics and Physics as compulsory subjects in 12th",
                                "Age limit as per state government norms"
                            ]
                        },
                        {
                            "title": "Required Documents",
                            "content": [
                                "10th Mark Sheet and Passing Certificate",
                                "12th Mark Sheet and Passing Certificate",
                                "JEE Main/MHT-CET Score Card",
                                "Domicile Certificate (if applicable)",
                                "Category Certificate (if applicable)",
                                "Income Certificate (if applicable)",
                                "Aadhar Card",
                                "Migration Certificate (if applicable)",
                                "4 Recent Passport Size Photographs",
                                "Gap Certificate (if applicable)"
                            ]
                        },
                        {
                            "title": "Application Process",
                            "steps": [
                                {
                                    "step": "Step 1: Online Registration",
                                    "details": [
                                        "Visit official DYPIEMR website",
                                        "Click on 'Admission 2025' link",
                                        "Fill the online application form",
                                        "Upload required documents",
                                        "Pay application fees"
                                    ]
                                },
                                {
                                    "step": "Step 2: Document Verification",
                                    "details": [
                                        "Visit campus with original documents",
                                        "Get documents verified by admission cell",
                                        "Collect verification slip"
                                    ]
                                },
                                {
                                    "step": "Step 3: Merit List & Counseling",
                                    "details": [
                                        "Check merit list on website/notice board",
                                        "Attend counseling as per schedule",
                                        "Select preferred branch based on availability"
                                    ]
                                },
                                {
                                    "step": "Step 4: Fee Payment",
                                    "details": [
                                        "Pay required fees within deadline",
                                        "Submit fee payment receipt",
                                        "Collect provisional admission letter"
                                    ]
                                }
                            ]
                        },
                        {
                            "title": "Fee Structure",
                            "content": [
                                "Application Fee: ₹1,000",
                                "Tuition Fee: ₹1,25,000 per year",
                                "Development Fee: ₹15,000 per year",
                                "Caution Money Deposit: ₹5,000 (Refundable)",
                                "Hostel Fee (Optional): ₹75,000 per year"
                            ]
                        }
                    ],
                    "contact": {
                        "title": "Contact Information",
                        "details": {
                            "admission_office": "Admission Office, DYPIEMR",
                            "address": "D.Y. Patil Educational Complex, Sector 29, Nigdi Pradhikaran, Akurdi, Pune 411044",
                            "phone": ["+91-20-27654545", "+91-20-27656565"],
                            "email": "admissions@dypiemr.ac.in",
                            "website": "www.dypiemr.ac.in"
                        },
                        "timing": "Monday to Saturday: 10:00 AM to 5:00 PM"
                    },
                    "note": "* All dates are tentative and subject to change. Please keep checking the official website for updates."
                };

                try {
                    // Format the admission process data into HTML
                    let formattedResponse = `<div class="admission-process">`;
                    
                    // Add title
                    formattedResponse += `<h2>${data.title}</h2>`;
                    
                    // Add sections
                    data.sections.forEach(section => {
                        formattedResponse += `<div class="admission-section">`;
                        formattedResponse += `<h3>${section.title}</h3>`;
                        
                        if (section.content) {
                            formattedResponse += `<ul>`;
                            section.content.forEach(item => {
                                formattedResponse += `<li>${item}</li>`;
                            });
                            formattedResponse += `</ul>`;
                        }
                        
                        if (section.steps) {
                            section.steps.forEach(step => {
                                formattedResponse += `<div class="admission-step">`;
                                formattedResponse += `<h4>${step.step}</h4>`;
                                formattedResponse += `<ul>`;
                                step.details.forEach(detail => {
                                    formattedResponse += `<li>${detail}</li>`;
                                });
                                formattedResponse += `</ul>`;
                                formattedResponse += `</div>`;
                            });
                        }
                        
                        formattedResponse += `</div>`;
                    });
                    
                    // Add contact information
                    formattedResponse += `<div class="admission-contact">`;
                    formattedResponse += `<h3>${data.contact.title}</h3>`;
                    formattedResponse += `<p><strong>${data.contact.details.admission_office}</strong></p>`;
                    formattedResponse += `<p>${data.contact.details.address}</p>`;
                    formattedResponse += `<p>Phone: ${data.contact.details.phone.join(' / ')}</p>`;
                    formattedResponse += `<p>Email: ${data.contact.details.email}</p>`;
                    formattedResponse += `<p>Website: ${data.contact.details.website}</p>`;
                    formattedResponse += `<p>Timing: ${data.contact.timing}</p>`;
                    formattedResponse += `</div>`;
                    
                    // Add note
                    formattedResponse += `<div class="admission-note"><em>${data.note}</em></div>`;
                    
                    formattedResponse += `</div>`;
                    
                    return formattedResponse;
                } catch (error) {
                    console.error('Error formatting admission process data:', error);
                    return "Sorry, I'm having trouble formatting the admission process information. Please try again later.";
                }
            }

            // Check if the message is about placement records
            if (message.toLowerCase() === 'placement records') {
                const placementInfo = `<div class="placement-records">
                    <h2>DYPIEMR Placement Records</h2>
                    
                    <div class="placement-highlights">
                        <h3>Our Elite Recruiters</h3>
                        <div class="recruiters-grid">
                            <div class="recruiter-category">
                                <h4>Top IT Companies</h4>
                                <ul>
                                    <li>TCS</li>
                                    <li>Cognizant</li>
                                    <li>Tech Mahindra</li>
                                    <li>Persistent</li>
                                    <li>Capgemini</li>
                                    <li>Accenture</li>
                                    <li>IBM</li>
                                    <li>Amdocs</li>
                                    <li>Hitachi Vantara</li>
                                    <li>LTI</li>
                                </ul>
                            </div>
                            <div class="recruiter-category">
                                <h4>Core Engineering</h4>
                                <ul>
                                    <li>Bosch</li>
                                    <li>Rockwell Automation</li>
                                    <li>Johnson Controls</li>
                                    <li>Kalyani Group</li>
                                    <li>Godrej & Boyce</li>
                                    <li>Atlas Copco</li>
                                    <li>Emerson</li>
                                    <li>Schaeffler</li>
                                    <li>Toshiba</li>
                                    <li>Bharat Forge</li>
                                </ul>
                            </div>
                            <div class="recruiter-category">
                                <h4>Product Companies</h4>
                                <ul>
                                    <li>Veritas Technologies</li>
                                    <li>PTC</li>
                                    <li>Juspay Technologies</li>
                                    <li>Darwinbox</li>
                                    <li>Xperi</li>
                                    <li>IDFY</li>
                                    <li>VuClip India</li>
                                    <li>Bitwise</li>
                                    <li>Josh Software</li>
                                    <li>Coditas</li>
                                </ul>
                            </div>
                        </div>

                        <div class="placement-stats">
                            <h3>Key Statistics</h3>
                            <ul>
                                <li>150+ Companies visiting campus annually</li>
                                <li>Multiple job offers for eligible students</li>
                                <li>Strong alumni network in leading organizations</li>
                                <li>Regular pre-placement training programs</li>
                                <li>Industry collaboration through MoUs</li>
                            </ul>
                        </div>

                        <div class="placement-support">
                            <h3>Training & Placement Support</h3>
                            <ul>
                                <li>Dedicated Training & Placement Cell</li>
                                <li>Career counseling and guidance</li>
                                <li>Soft skills development programs</li>
                                <li>Technical training workshops</li>
                                <li>Mock interviews and group discussions</li>
                                <li>Industry expert sessions</li>
                            </ul>
                        </div>

                        <div class="placement-contact">
                            <h3>Contact TPO Cell</h3>
                            <p><strong>Training & Placement Officer</strong></p>
                            <p>Email: tpo@dypiemr.ac.in</p>
                            <p>Phone: +91-20-27654470</p>
                            <p>Location: Training & Placement Cell, DYPIEMR Campus</p>
                        </div>
                    </div>
                </div>`;
                
                return placementInfo;
            }

            // Check if the message is about courses offered
            if (message.toLowerCase() === 'courses offered') {
                const coursesInfo = `<div class="courses-offered">
                    <h2>Undergraduate Courses at DYPIEMR</h2>
                    
                    <div class="courses-grid">
                        <div class="course-card">
                            <h3>Computer Engineering</h3>
                            <div class="course-details">
                                <p class="intake">Sanctioned Intake: 120 Students</p>
                                <p class="course-code">Course Code: 680224510</p>
                                <div class="course-description">
                                    <p>The Computer Engineering program at DYPIEMR focuses on:</p>
                                    <ul>
                                        <li>Software Development & Programming</li>
                                        <li>Data Structures & Algorithms</li>
                                        <li>Database Management Systems</li>
                                        <li>Artificial Intelligence & Machine Learning</li>
                                        <li>Web & Mobile Application Development</li>
                                        <li>Computer Networks & Security</li>
                                    </ul>
                                    <p>Career opportunities include Software Developer, System Analyst, Data Scientist, and more.</p>
                                </div>
                            </div>
                        </div>

                        <div class="course-card">
                            <h3>Artificial Intelligence and Data Science</h3>
                            <div class="course-details">
                                <p class="intake">Sanctioned Intake: 120 Students</p>
                                <p class="course-code">Course Code: 680299510</p>
                                <div class="course-description">
                                    <p>This cutting-edge program covers:</p>
                                    <ul>
                                        <li>Machine Learning & Deep Learning</li>
                                        <li>Big Data Analytics</li>
                                        <li>Natural Language Processing</li>
                                        <li>Computer Vision</li>
                                        <li>Statistical Analysis</li>
                                        <li>Data Visualization</li>
                                    </ul>
                                    <p>Graduates can pursue careers as AI Engineers, Data Scientists, ML Engineers, and Research Scientists.</p>
                                </div>
                            </div>
                        </div>

                        <div class="course-card">
                            <h3>Electronics & Telecommunications Engineering</h3>
                            <div class="course-details">
                                <p class="intake">Sanctioned Intake: 60 Students</p>
                                <p class="course-code">Course Code: 680237210</p>
                                <div class="course-description">
                                    <p>The program emphasizes:</p>
                                    <ul>
                                        <li>Digital & Analog Communication</li>
                                        <li>VLSI Design</li>
                                        <li>Embedded Systems</li>
                                        <li>Signal Processing</li>
                                        <li>Wireless Communication</li>
                                        <li>IoT Technologies</li>
                                    </ul>
                                    <p>Career paths include Telecom Engineer, Electronics Designer, IoT Specialist, and Network Engineer.</p>
                                </div>
                            </div>
                        </div>

                        <div class="course-card">
                            <h3>Mechanical Engineering</h3>
                            <div class="course-details">
                                <p class="intake">Sanctioned Intake: 120 Students</p>
                                <p class="course-code">Course Code: 680261210</p>
                                <div class="course-description">
                                    <p>This comprehensive program covers:</p>
                                    <ul>
                                        <li>Design & Manufacturing</li>
                                        <li>Thermal Engineering</li>
                                        <li>Robotics & Automation</li>
                                        <li>CAD/CAM</li>
                                        <li>Industrial Engineering</li>
                                        <li>Automotive Technology</li>
                                    </ul>
                                    <p>Opportunities include Design Engineer, Production Manager, R&D Engineer, and Automation Specialist.</p>
                                </div>
                            </div>
                        </div>

                        <div class="course-card">
                            <h3>Civil Engineering</h3>
                            <div class="course-details">
                                <p class="intake">Sanctioned Intake: 60 Students</p>
                                <p class="course-code">Course Code: 680219110</p>
                                <div class="course-description">
                                    <p>The program focuses on:</p>
                                    <ul>
                                        <li>Structural Engineering</li>
                                        <li>Construction Management</li>
                                        <li>Environmental Engineering</li>
                                        <li>Transportation Engineering</li>
                                        <li>Geotechnical Engineering</li>
                                        <li>Water Resources Management</li>
                                    </ul>
                                    <p>Graduates work as Structural Engineers, Project Managers, Construction Managers, and Environmental Engineers.</p>
                                </div>
                            </div>
                        </div>

                        <div class="course-card">
                            <h3>Chemical Engineering</h3>
                            <div class="course-details">
                                <p class="intake">Sanctioned Intake: 60 Students</p>
                                <p class="course-code">Course Code: 680250710</p>
                                <div class="course-description">
                                    <p>This program encompasses:</p>
                                    <ul>
                                        <li>Process Engineering</li>
                                        <li>Plant Design</li>
                                        <li>Reaction Engineering</li>
                                        <li>Environmental Technology</li>
                                        <li>Petrochemical Processing</li>
                                        <li>Safety Management</li>
                                    </ul>
                                    <p>Career options include Process Engineer, Plant Manager, Environmental Consultant, and Research Scientist.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="course-contact">
                        <h3>For Admission Enquiries</h3>
                        <p><strong>Contact:</strong> Admission Office, DYPIEMR</p>
                        <p><strong>Email:</strong> admission@dypakurdipune.edu.in</p>
                        <p><strong>Phone:</strong> +91-20-27654470</p>
                        <p><strong>Address:</strong> D.Y. Patil Educational Complex, Sector 29, Nigdi Pradhikaran, Akurdi, Pune 411044</p>
                    </div>
                </div>`;
                
                return coursesInfo;
            }

            // Check if the message is about admission FAQs
            if (message.toLowerCase().includes('admission faq') || message.toLowerCase().includes('admission faqs')) {
                const faqsInfo = `<div class="admission-faqs">
                    <h2>Admission FAQs - DYPIEMR</h2>
                    
                    <div class="faq-section">
                        <div class="faq-item">
                            <h3>General Admission Questions</h3>
                            <div class="faq-qa">
                                <div class="faq-pair">
                                    <p class="question">Q: What are the admission requirements for B.Tech programs?</p>
                                    <p class="answer">A: Candidates must have:</p>
                                    <ul>
                                        <li>Passed HSC/12th with Physics, Chemistry, Mathematics</li>
                                        <li>Minimum 45% aggregate marks (40% for reserved categories)</li>
                                        <li>Valid MHT-CET/JEE(Main) score</li>
                                        <li>Completed age of 17 years as on 31st December</li>
                                    </ul>
                                </div>

                                <div class="faq-pair">
                                    <p class="question">Q: What is the admission process?</p>
                                    <p class="answer">A: The admission process involves:</p>
                                    <ul>
                                        <li>Register for MHT-CET/JEE(Main)</li>
                                        <li>Apply through DTE Maharashtra CAP rounds</li>
                                        <li>Merit list based admission</li>
                                        <li>Document verification</li>
                                        <li>Fee payment and confirmation</li>
                                    </ul>
                                </div>

                                <div class="faq-pair">
                                    <p class="question">Q: Which documents are required for admission?</p>
                                    <p class="answer">A: Required documents include:</p>
                                    <ul>
                                        <li>10th and 12th marksheets</li>
                                        <li>MHT-CET/JEE(Main) score card</li>
                                        <li>Domicile certificate</li>
                                        <li>Category certificate (if applicable)</li>
                                        <li>Aadhar card</li>
                                        <li>Migration certificate (if applicable)</li>
                                        <li>Gap certificate (if applicable)</li>
                                    </ul>
                                </div>

                                <div class="faq-pair">
                                    <p class="question">Q: What are the available branches and their intake capacity?</p>
                                    <p class="answer">A: The following branches are available:</p>
                                    <ul>
                                        <li>Computer Engineering - 120 seats</li>
                                        <li>AI & Data Science - 120 seats</li>
                                        <li>Mechanical Engineering - 120 seats</li>
                                        <li>E&TC Engineering - 60 seats</li>
                                        <li>Civil Engineering - 60 seats</li>
                                        <li>Chemical Engineering - 60 seats</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div class="faq-item">
                            <h3>Fees & Scholarships</h3>
                            <div class="faq-qa">
                                <div class="faq-pair">
                                    <p class="question">Q: What scholarships are available?</p>
                                    <p class="answer">A: Available scholarships include:</p>
                                    <ul>
                                        <li>Government scholarships for SC/ST/OBC students</li>
                                        <li>Merit-based scholarships</li>
                                        <li>EBC scholarship</li>
                                        <li>Girls scholarship schemes</li>
                                        <li>Central sector scholarship schemes</li>
                                    </ul>
                                </div>

                                <div class="faq-pair">
                                    <p class="question">Q: What are the payment modes for fees?</p>
                                    <p class="answer">A: Fees can be paid through:</p>
                                    <ul>
                                        <li>Online payment gateway</li>
                                        <li>Demand Draft</li>
                                        <li>NEFT/RTGS transfer</li>
                                        <li>Challan payment at designated banks</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div class="faq-item">
                            <h3>Important Dates</h3>
                            <div class="faq-qa">
                                <div class="faq-pair">
                                    <p class="question">Q: What is the admission timeline?</p>
                                    <p class="answer">A: Key dates to remember:</p>
                                    <ul>
                                        <li>CAP Round Registration: As per DTE Maharashtra schedule</li>
                                        <li>Document Verification: During CAP rounds</li>
                                        <li>Merit List Display: After each CAP round</li>
                                        <li>Institute Level Admissions: After CAP rounds</li>
                                        <li>Commencement of Classes: Usually in August</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div class="admission-contact-info">
                            <h3>Still have questions?</h3>
                            <p>Contact our admission office:</p>
                            <p>📧 Email: admission@dypakurdipune.edu.in</p>
                            <p>📞 Phone: +91-20-27654470</p>
                            <p>🏢 Visit: Admission Office, DYPIEMR Campus</p>
                            <p class="note">Note: All dates are tentative and subject to change as per DTE Maharashtra guidelines.</p>
                        </div>
                    </div>
                </div>`;
                
                return faqsInfo;
            }

            const response = await fetch('http://127.0.0.1:5000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    user_id: userId,
                    query: message
                }),
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.response;
            } else {
                console.error('Server error:', response.status);
                return "Sorry, I'm having trouble connecting to the server. Please try again later.";
            }
        } catch (error) {
            console.error('Error:', error);
            return "Sorry, I'm having trouble processing your request. Please try again later.";
        }
    }

    // Function to scroll to bottom of messages container
    function scrollToBottom(container) {
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        });
    }
    
    // Function to sync messages between containers with proper scrolling
    function syncMessages(source, target) {
        // Clone source content to target
        target.innerHTML = source.innerHTML;
        
        // Add event listeners to links in the target
        const links = target.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent bubbling
            });
        });
        
        // Force scroll after sync
        setTimeout(() => {
            scrollToBottomSmooth(target);
        }, 100);
    }
    
    // Function to update chat history UI
    function updateHistoryUI() {
        // Clear history containers
        chatHistoryDropdown.innerHTML = '';
        fullscreenHistory.innerHTML = '';
        
        // Get unique conversation starters (user messages)
        const userMessages = chatHistory.filter(item => item.user).map(item => item.user);
        const uniqueMessages = [...new Set(userMessages)].slice(-10).reverse(); // Get last 10 unique messages
        
        // Add to dropdown
        uniqueMessages.forEach(message => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            historyItem.textContent = message;
            historyItem.addEventListener('click', function() {
                sendMessage(message, chatbotMessages, chatbotInputField);
                chatHistoryDropdown.classList.remove('active');
            });
            chatHistoryDropdown.appendChild(historyItem);
            
            // Add to fullscreen history
            const fullscreenItem = document.createElement('li');
            fullscreenItem.classList.add('history-item');
            fullscreenItem.textContent = message;
            fullscreenItem.addEventListener('click', function() {
                sendMessage(message, fullscreenMessages, fullscreenInputField);
            });
            fullscreenHistory.appendChild(fullscreenItem);
        });
    }
    
    // Update saved chats UI
    function updateSavedChatsUI() {
        // Update dropdown
        chatHistoryDropdown.innerHTML = '';
        
        // Add saved chats to dropdown
        for (const chatId in savedChats) {
            const chat = savedChats[chatId];
            if (chat.length > 0) {
                const firstUserMsg = chat.find(msg => msg.user)?.user || 'New Conversation';
                const truncatedMsg = firstUserMsg.length > 25 ? firstUserMsg.substring(0, 25) + '...' : firstUserMsg;
                
                const historyItem = document.createElement('div');
                historyItem.classList.add('history-item');
                historyItem.dataset.chatId = chatId;
                historyItem.innerHTML = `
                    <span>${truncatedMsg}</span>
                    <button class="load-chat-btn"><i class="fas fa-arrow-right"></i></button>
                `;
                
                chatHistoryDropdown.appendChild(historyItem);
                
                // Add event listener to load chat
                historyItem.querySelector('.load-chat-btn').addEventListener('click', function() {
                    loadSavedChat(chatId);
                });
            }
        }
        
        // Update fullscreen history list
        fullscreenHistory.innerHTML = '';
        
        // Add saved chats to fullscreen
        for (const chatId in savedChats) {
            const chat = savedChats[chatId];
            if (chat.length > 0) {
                const firstUserMsg = chat.find(msg => msg.user)?.user || 'New Conversation';
                const truncatedMsg = firstUserMsg.length > 30 ? firstUserMsg.substring(0, 30) + '...' : firstUserMsg;
                
                const historyItem = document.createElement('li');
                historyItem.classList.add('history-item');
                historyItem.dataset.chatId = chatId;
                historyItem.innerHTML = `
                    <span>${truncatedMsg}</span>
                    <button class="load-chat-btn"><i class="fas fa-arrow-right"></i></button>
                `;
                
                fullscreenHistory.appendChild(historyItem);
                
                // Add event listener to load chat
                historyItem.querySelector('.load-chat-btn').addEventListener('click', function() {
                    loadSavedChat(chatId);
                });
            }
        }
    }
    
    // Function to load a saved chat
    function loadSavedChat(chatId) {
        if (savedChats[chatId]) {
            // Set current chat history to the saved chat
            chatHistory = [...savedChats[chatId]];
            currentChatId = chatId;
            
            // Update localStorage
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
            
            // Clear UI
            clearChatMessages(chatbotMessages);
            clearChatMessages(fullscreenMessages);
            
            // Populate messages in both containers
            chatHistory.forEach(msg => {
                if (msg.user) {
                    addMessageToUI(msg.user, 'user', chatbotMessages);
                    addMessageToUI(msg.user, 'user', fullscreenMessages);
                } else if (msg.bot) {
                    addMessageToUI(msg.bot, 'bot', chatbotMessages);
                    addMessageToUI(msg.bot, 'bot', fullscreenMessages);
                }
            });
            
            // Close dropdown
            chatHistoryDropdown.classList.remove('active');
            
            // Scroll to bottom
            scrollToBottom(chatbotMessages);
            scrollToBottom(fullscreenMessages);
        }
    }
    
    // Add accessibility keyboard navigation for chat buttons
    function setupAccessibility() {
        // Make buttons keyboard accessible
        const allButtons = document.querySelectorAll('button');
        allButtons.forEach(button => {
            if (!button.hasAttribute('aria-label')) {
                button.setAttribute('aria-label', button.textContent || 'Button');
            }
            
            button.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    button.click();
                }
            });
        });
        
        // Make chat inputs accessible
        chatbotInputField.setAttribute('aria-label', 'Type your message');
        fullscreenInputField.setAttribute('aria-label', 'Type your message');
        
        // Focus management
        chatbotButton.addEventListener('click', function() {
            if (chatbotContainer.classList.contains('active')) {
                setTimeout(() => {
                    chatbotInputField.focus();
                }, 300);
            }
        });
        
        chatbotExpand.addEventListener('click', function() {
            setTimeout(() => {
                fullscreenInputField.focus();
            }, 300);
        });
    }
    
    // Add tooltips to UI elements
    function addTooltips() {
        // Add tooltips to control buttons
        chatbotMinimize.setAttribute('data-tooltip', 'Minimize chat');
        chatbotExpand.setAttribute('data-tooltip', 'Expand to full screen');
        fullscreenMinimize.setAttribute('data-tooltip', 'Return to small chat');
        fullscreenClose.setAttribute('data-tooltip', 'Close chat');
        newChatMini.setAttribute('data-tooltip', 'Start a new conversation');
        newChatFull.setAttribute('data-tooltip', 'Start a new conversation');
        
        // Add tooltips to send buttons
        chatbotSendBtn.setAttribute('data-tooltip', 'Send message');
        fullscreenSendBtn.setAttribute('data-tooltip', 'Send message');
    }
    
    // Initialize accessibility features and tooltips
    setupAccessibility();
    addTooltips();

    // Set up mutation observers for both chat containers to handle scrolling
    const setupScrollObserver = (container) => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if the added node is a message
                    const addedNode = mutation.addedNodes[0];
                    if (addedNode.classList && addedNode.classList.contains('message')) {
                        scrollToBottomSmooth(container);
                    }
                }
            });
        });

        observer.observe(container, {
            childList: true,
            subtree: true
        });
    };

    // Set up observers for both chat containers
    setupScrollObserver(chatbotMessages);
    setupScrollObserver(fullscreenMessages);

    // Add scroll to bottom on window resize
    window.addEventListener('resize', () => {
        scrollToBottomSmooth(chatbotMessages);
        scrollToBottomSmooth(fullscreenMessages);
    });

    // Ensure proper scrolling after images load
    document.addEventListener('load', (event) => {
        if (event.target.tagName === 'IMG') {
            const container = event.target.closest('.chatbot-messages, .fullscreen-messages');
            if (container) {
                scrollToBottomSmooth(container);
            }
        }
    }, true);
    
    // Make the fullscreen view properly structured for layout
    function setupFullscreenLayout() {
        // Make sure the body element exists before modifying
        const fullscreenBody = document.createElement('div');
        fullscreenBody.classList.add('fullscreen-body');
        
        // Check if fullscreen chatbot already has the body element
        if (!fullscreenChatbot.querySelector('.fullscreen-body')) {
            // Get the elements that need to be wrapped
            const sidebar = fullscreenChatbot.querySelector('.fullscreen-sidebar');
            const chat = fullscreenChatbot.querySelector('.fullscreen-chat');
            
            // Remove them from their current position
            if (sidebar) {
                sidebar.parentNode.removeChild(sidebar);
            }
            if (chat) {
                chat.parentNode.removeChild(chat);
            }
            
            // Add them to the new body element
            if (sidebar) fullscreenBody.appendChild(sidebar);
            if (chat) fullscreenBody.appendChild(chat);
            
            // Find the header element to insert after
            const header = fullscreenChatbot.querySelector('.fullscreen-header');
            if (header) {
                header.after(fullscreenBody);
            } else {
                fullscreenChatbot.appendChild(fullscreenBody);
            }
        }
    }
    
    // Call this function on page load
    setupFullscreenLayout();
    
    // Ensure smooth animations on page load
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);

    document.getElementById('faculty-data-btn').addEventListener('click', function() {
        fetch('faculty_data.json')
            .then(response => response.json())
            .then(data => {
                displayFacultyData(data);
            })
            .catch(error => console.error('Error fetching faculty data:', error));
    });

    function displayFacultyData(data) {
        const facultyContainer = document.getElementById('faculty-container');
        facultyContainer.innerHTML = ''; // Clear previous data

        data.Departments.forEach(department => {
            const departmentDiv = document.createElement('div');
            departmentDiv.classList.add('department');

            const departmentName = document.createElement('h3');
            departmentName.textContent = department.Name;
            departmentDiv.appendChild(departmentName);

            // Create table
            const table = document.createElement('table');
            table.classList.add('faculty-table');
            
            // Create table header
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Name</th>
                    <th>Designation</th>
                    <th>Qualification</th>
                    <th>Specialization</th>
                    <th>Experience</th>
                </tr>
            `;
            table.appendChild(thead);

            // Create table body
            const tbody = document.createElement('tbody');
            department.Faculty.forEach(faculty => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${faculty.Name}</td>
                    <td>${faculty.Designation}</td>
                    <td>${faculty.Qualification}</td>
                    <td>${faculty.Specialization}</td>
                    <td>${faculty.Experience}</td>
                `;
                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            departmentDiv.appendChild(table);
            facultyContainer.appendChild(departmentDiv);
        });
    }

    // Events Button Functionality
    const eventsBtn = document.getElementById('events-btn');
    const eventsSection = document.getElementById('events-section');
    
    if (eventsBtn && eventsSection) {
        eventsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            eventsSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // New code for events button in quick links
    const eventsDataBtn = document.getElementById('events-data-btn');
    
    if (eventsDataBtn) {
        eventsDataBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Custom events information
            const eventsContent = `
                <div class="custom-events-info">
                    <h2>Nakshatra - DYPIEMR Annual College Fest</h2>
                    
                    <div class="event-description">
                        <p>DYPIEMR (Dr. D.Y. Patil Institute of Engineering, Management and Research) hosts an annual college fest called Nakshatra. The fest includes various events, skill competitions, themed days, and a talent showcase.</p>
                        <p>The fest is conducted in the start or mid of February. Fest has all types of events like sports, technical, cultural.</p>
                        <p>The fest starts with flash mob at the college campus then the sports events and technical events are conducted parallelly. After the sports and technical events, the themed days and cultural events start.</p>
                    </div>
                    
                    <div class="event-categories">
                        <div class="event-category">
                            <h3>Sports Events</h3>
                            <img src="https://media.istockphoto.com/id/1368151370/photo/various-sport-equipment-background.jpg?s=612x612&w=0&k=20&c=0yPo4YiGnhpZqEj8zXhh4YRJ_l0yp7zs3TOVaWQYXlc=" alt="Sports Events" class="category-image">
                            <img src="https://img.freepik.com/free-photo/sports-tools_53876-138077.jpg" alt="Sports Equipment" class="category-image">
                            <ul>
                                <li>Football</li>
                                <li>Cricket</li>
                                <li>Badminton</li>
                                <li>Athletics</li>
                                <li>Indoor Games</li>
                                <li>And many more...</li>
                            </ul>
                        </div>
                        
                        <div class="event-category">
                            <h3>Technical Events</h3>
                            <img src="https://img.freepik.com/free-vector/hand-drawn-web-developers_23-2148819604.jpg" alt="Technical Events" class="category-image">
                            <ul>
                                <li>Code Quest</li>
                                <li>Techno Hunt</li>
                                <li>Tech Quiz</li>
                                <li>Decode Mania</li>
                                <li>And more fun events which use our technical knowledge</li>
                            </ul>
                        </div>
                        
                        <div class="event-category">
                            <h3>Themed Days</h3>
                            <img src="https://img.freepik.com/free-vector/flat-design-holi-festival-illustration_23-2149275271.jpg" alt="Themed Days" class="category-image">
                            <ul>
                                <li>Traditional Day</li>
                                <li>Bollywood Day</li>
                            </ul>
                        </div>
                        
                        <div class="event-category">
                            <h3>Cultural Events</h3>
                            <img src="https://media.istockphoto.com/id/1175466248/photo/group-of-young-dancers-performing-on-stage.jpg?s=612x612&w=0&k=20&c=3zZqmCRIAuCnJVZU9GMBhVTgJqK1MqxwPJqR_7wL5Ow=" alt="Cultural Dance" class="category-image">
                            <img src="https://media.istockphoto.com/id/1366724990/photo/young-woman-singing-on-stage.jpg?s=612x612&w=0&k=20&c=svbHCNO1MoGVHVEE9lqKL-g1THF2YyM2ZfzHQQtEfzE=" alt="Cultural Performance" class="category-image">
                            <ul>
                                <li>Annual Day & DJ Night</li>
                                <li>Cultural Day</li>
                                <li>Flash Mob</li>
                                <li>Talent Showcase</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="register-info">
                        <h3>Join Us This February!</h3>
                        <p>Don't miss out on the most exciting college fest of the year. Stay tuned for registration details.</p>
                    </div>
                </div>
            `;
            
            // Display in the fullscreen chat
            const fullscreenMessages = document.getElementById('fullscreen-messages');
            if (fullscreenMessages) {
                // Add bot message with events content
                setTimeout(() => {
                    addMessageToUI(eventsContent, 'bot', fullscreenMessages);
                }, 500);
            }
        });
    }

    // Courses Button Functionality
    const coursesDataBtn = document.getElementById('courses-data-btn');
    
    if (coursesDataBtn) {
        coursesDataBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const coursesContent = `
                <div class="courses-container">
                    <h2>Department Syllabi - DYPIEMR</h2>
                    
                    <div class="department-section">
                        <h3>Computer Engineering</h3>
                        <div class="pdf-links">
                            <div class="pdf-link">
                                <i class="fas fa-file-pdf"></i>
                                <a href="data/course_pdfs/computer/CS SYLLABUS.pdf" target="_blank">Computer Engineering Syllabus</a>
                            </div>
                        </div>
                    </div>
                    
                    <div class="department-section">
                        <h3>Electronics & Telecommunication Engineering</h3>
                        <div class="pdf-links">
                            <div class="pdf-link">
                                <i class="fas fa-file-pdf"></i>
                                <a href="data/course_pdfs/entc/ENTC SYLLABUS.pdf" target="_blank">Electronics & Telecommunication Engineering Syllabus</a>
                            </div>
                        </div>
                    </div>
                    
                    <div class="department-section">
                        <h3>Mechanical Engineering</h3>
                        <div class="pdf-links">
                            <div class="pdf-link">
                                <i class="fas fa-file-pdf"></i>
                                <a href="data/course_pdfs/mechanical/MECH SYLLABUS.pdf" target="_blank">Mechanical Engineering Syllabus</a>
                            </div>
                        </div>
                    </div>
                    
                    <div class="department-section">
                        <h3>Civil Engineering</h3>
                        <div class="pdf-links">
                            <div class="pdf-link">
                                <i class="fas fa-file-pdf"></i>
                                <a href="data/course_pdfs/civil/CIVIL SYLLABUS.pdf" target="_blank">Civil Engineering Syllabus</a>
                            </div>
                        </div>
                    </div>
                    
                    <div class="department-section">
                        <h3>Chemical Engineering</h3>
                        <div class="pdf-links">
                            <div class="pdf-link">
                                <i class="fas fa-file-pdf"></i>
                                <a href="data/course_pdfs/chemical/CHEM SYLLABUS.pdf" target="_blank">Chemical Engineering Syllabus</a>
                            </div>
                        </div>
                    </div>
                    
                    <div class="department-section">
                        <h3>Artificial Intelligence and Data Science</h3>
                        <div class="pdf-links">
                            <div class="pdf-link">
                                <i class="fas fa-file-pdf"></i>
                                <a href="data/course_pdfs/aids/AI DS SYLLABUS.pdf" target="_blank">AI & DS Engineering Syllabus</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            const fullscreenMessages = document.getElementById('fullscreen-messages');
            
            // Instead of replacing all content, add as a new message
            addMessageToUI(coursesContent, 'bot', fullscreenMessages);
            
            // Scroll to show the new content while preserving the ability to scroll up
            setTimeout(() => {
                const newMessage = fullscreenMessages.lastElementChild;
                if (newMessage) {
                    newMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 100);
        });
    }
}); 