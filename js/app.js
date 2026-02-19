/**
 * Research Archive Interface
 * Main Application JavaScript
 */

// ===========================================
// DOM ELEMENTS
// ===========================================
let chatMessages;
let chatInput;
let chatInputBottom;
let sendBtn;
let sendBtnBottom;
let voiceBtn;
let voiceBtnBottom;
let contextDrawer;
let toggleDrawer;
let closeDrawer;
let sidebar;
let welcomeScreen;
let chatInputContainer;

// ===========================================
// DATA STORAGE
// ===========================================
let timelineData = null;
let epsteinData = null;
let scrapedJudaismData = null;
let dataLoaded = false;

// ===========================================
// OPENAI API CONFIGURATION
// ===========================================
const OPENAI_CONFIG = {
    // OpenAI API endpoint
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    // Model to use (gpt-3.5-turbo is fast and cheap, gpt-4 is more capable)
    model: 'gpt-3.5-turbo',
    // Your OpenAI API key - REPLACE THIS WITH YOUR ACTUAL KEY
    apiKey: 'YOUR_OPENAI_API_KEY_HERE',
    // Set to true to use OpenAI, false for demo mode
    useOpenAI: true
};

// ===========================================
// SCRAPED DATA STORAGE
// ===========================================
let scrapedData = [];

/**
 * Load scraped data from localStorage (saved by scraper tool)
 */
function loadScrapedData() {
    try {
        const stored = localStorage.getItem('scraperArchive');
        if (stored) {
            scrapedData = JSON.parse(stored);
            console.log(`Loaded ${scrapedData.length} scraped items from archive`);
        }
    } catch (error) {
        console.error('Error loading scraped data:', error);
    }
}

/**
 * Build context from scraped data for the AI
 */
function buildScrapedContext() {
    let context = '';
    
    // Add localStorage scraped data
    if (scrapedData.length > 0) {
        context += '\n\n--- SCRAPED KNOWLEDGE BASE ---\n\n';
        scrapedData.forEach((item, index) => {
            context += `[Item ${index + 1}]\n`;
            if (item.title) context += `Title: ${item.title}\n`;
            if (item.summary) context += `Summary: ${item.summary}\n`;
            if (item.key_facts && item.key_facts.length > 0) {
                context += `Key Facts:\n${item.key_facts.map(f => `- ${f}`).join('\n')}\n`;
            }
            if (item.people && item.people.length > 0) {
                context += `People: ${item.people.join(', ')}\n`;
            }
            if (item.dates && item.dates.length > 0) {
                context += `Dates: ${item.dates.join(', ')}\n`;
            }
            if (item.raw_text) {
                context += `Content: ${item.raw_text.substring(0, 2000)}...\n`;
            }
            context += '\n';
        });
    }
    
    // Add Judaism-Epstein data from JSON file
    if (scrapedJudaismData && scrapedJudaismData.documents) {
        context += '\n\n--- JUDAISM & EPSTEIN FILES DATA ---\n\n';
        context += `Source: ${scrapedJudaismData.metadata.source}\n`;
        context += `Search Term: ${scrapedJudaismData.metadata.searchTerm}\n\n`;
        
        scrapedJudaismData.documents.forEach(doc => {
            context += `[Document ${doc.id}]\n`;
            doc.content.forEach(text => {
                context += `- ${text}\n`;
            });
            context += '\n';
        });
        
        if (scrapedJudaismData.summary) {
            context += `\nKey Themes: ${scrapedJudaismData.summary.keyThemes.join(', ')}\n`;
            context += `Named Individuals: ${scrapedJudaismData.summary.namedIndividuals.join(', ')}\n`;
            if (scrapedJudaismData.summary.organizations) {
                context += `Organizations: ${scrapedJudaismData.summary.organizations.join(', ')}\n`;
            }
            if (scrapedJudaismData.summary.locations) {
                context += `Locations: ${scrapedJudaismData.summary.locations.join(', ')}\n`;
            }
        }
        
        // Add verified connections section for better AI responses
        if (scrapedJudaismData.verifiedConnections) {
            context += '\n\n--- VERIFIED CONNECTIONS (Use these to answer questions) ---\n\n';
            
            // People directly in Epstein documents
            if (scrapedJudaismData.verifiedConnections.peopleInEpsteinDocuments) {
                context += 'JEWISH INDIVIDUALS IN EPSTEIN DOCUMENTS:\n';
                scrapedJudaismData.verifiedConnections.peopleInEpsteinDocuments.forEach(person => {
                    context += `• ${person.name}: ${person.connection} (Source: ${person.context})\n`;
                });
                context += '\n';
            }
            
            // Organizations
            if (scrapedJudaismData.verifiedConnections.organizationsInDocuments) {
                context += 'ORGANIZATIONS IN DOCUMENTS:\n';
                scrapedJudaismData.verifiedConnections.organizationsInDocuments.forEach(org => {
                    context += `• ${org.name}: ${org.connection}\n`;
                });
                context += '\n';
            }
            
            // Key locations
            if (scrapedJudaismData.verifiedConnections.keyLocationsLinked) {
                context += 'KEY LOCATIONS:\n';
                scrapedJudaismData.verifiedConnections.keyLocationsLinked.forEach(loc => {
                    context += `• ${loc.location}: ${loc.connection}\n`;
                });
                context += '\n';
            }
            
            // Documented activities
            if (scrapedJudaismData.verifiedConnections.documentedActivities) {
                context += 'DOCUMENTED ACTIVITIES:\n';
                scrapedJudaismData.verifiedConnections.documentedActivities.forEach(act => {
                    context += `• ${act.activity}: ${act.details} (Documents: ${act.documents.join(', ')})\n`;
                });
                context += '\n';
            }
            
            // Political connections
            if (scrapedJudaismData.verifiedConnections.politicalConnections) {
                context += 'POLITICAL CONNECTIONS:\n';
                scrapedJudaismData.verifiedConnections.politicalConnections.forEach(pol => {
                    context += `• ${pol.topic}: ${pol.details}\n`;
                });
                context += '\n';
            }
        }
    }
    
    if (context) {
        context += '\n--- END KNOWLEDGE BASE ---\n\n';
    }
    
    return context;
}

// ===========================================
// AI PERSONALITY CONFIGURATION
// ===========================================
const AI_PERSONALITY = {
    // Core identity traits
    identity: [
        'investigative journalist',
        'legal researcher',
        'documentary narrator'
    ],
    
    // Tone guidelines
    tone: {
        do: [
            'Speak in calm, structured sentences',
            'Use neutral factual framing',
            'Lead with evidence-first explanations',
            'Maintain professional distance'
        ],
        avoid: [
            'Emotional language',
            'Speculation phrasing',
            'Dramatic storytelling tone',
            'Moral preaching or editorializing'
        ]
    },
    
    // Evidence classification types
    evidenceTypes: {
        confirmed: {
            label: 'Confirmed Fact',
            description: 'Official government records, court filings',
            class: 'tag-confirmed'
        },
        testimony: {
            label: 'Testimony',
            description: 'Sworn depositions, witness statements',
            class: 'tag-testimony'
        },
        allegation: {
            label: 'Allegation',
            description: 'Unproven claims in legal filings',
            class: 'tag-allegation'
        },
        media: {
            label: 'Media Report',
            description: 'Journalism, not independently verified',
            class: 'tag-media'
        }
    },
    
    // Response structure template
    responseTemplate: {
        directAnswer: 'Clear, neutral summary addressing the question directly.',
        context: 'Short explanation of relevant events, timeline, or relationships.',
        evidenceFraming: 'Explicitly clarify the nature of information.',
        closing: 'Offer next steps for further research.'
    },
    
    // Refusal message template
    refusalTemplate: `We can only answer questions about Jews and the Epstein case.`,
    
    // Placeholder text
    inputPlaceholder: 'Ask about Jewish connections to the Epstein case...',
    
    // Loading state text
    loadingText: 'Researching...'
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Create a unique ID
 */
function generateId() {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Get current timestamp formatted
 */
function getTimestamp() {
    return new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Scroll chat to bottom smoothly
 */
function scrollToBottom() {
    if (chatMessages) {
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    }
}

/**
 * Create evidence tag HTML
 */
function createEvidenceTag(type) {
    const evidence = AI_PERSONALITY.evidenceTypes[type];
    if (!evidence) return '';
    return `<span class="evidence-tag ${evidence.class}">${evidence.label}</span>`;
}

/**
 * Switch from welcome screen to chat mode
 */
function switchToChatMode() {
    if (welcomeScreen) {
        welcomeScreen.classList.add('hidden');
    }
    if (chatMessages) {
        chatMessages.classList.remove('hidden');
    }
    if (chatInputContainer) {
        chatInputContainer.classList.remove('hidden');
    }
    // Focus the bottom input
    if (chatInputBottom) {
        chatInputBottom.focus();
    }
}

/**
 * Reset to home/welcome screen with fresh chat
 */
function resetToHome() {
    // Show welcome screen
    if (welcomeScreen) {
        welcomeScreen.classList.remove('hidden');
    }
    
    // Hide chat messages and input container
    if (chatMessages) {
        chatMessages.classList.add('hidden');
        // Clear all messages except the header logo
        const headerLogo = chatMessages.querySelector('.chat-header-logo');
        chatMessages.innerHTML = '';
        if (headerLogo) {
            chatMessages.appendChild(headerLogo);
        }
    }
    if (chatInputContainer) {
        chatInputContainer.classList.add('hidden');
    }
    
    // Clear inputs
    if (chatInput) {
        chatInput.value = '';
    }
    if (chatInputBottom) {
        chatInputBottom.value = '';
    }
    
    // Hide context drawer
    const drawer = document.getElementById('contextDrawer');
    const toggleBtn = document.getElementById('toggleDrawer');
    if (drawer) {
        drawer.classList.add('hidden');
    }
    if (toggleBtn) {
        toggleBtn.classList.add('hidden');
    }
    
    // Clear context drawer content
    const sourceList = document.getElementById('sourceList');
    const relatedPeopleList = document.getElementById('relatedPeopleList');
    const keyThemesList = document.getElementById('keyThemesList');
    if (sourceList) sourceList.innerHTML = '';
    if (relatedPeopleList) relatedPeopleList.innerHTML = '';
    if (keyThemesList) keyThemesList.innerHTML = '';
    
    // Focus welcome input
    if (chatInput) {
        chatInput.focus();
    }
}

// ===========================================
// MESSAGE HANDLING
// ===========================================

/**
 * Create a user message element
 */
function createUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message message-user';
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${escapeHtml(text)}</p>
        </div>
    `;
    return messageDiv;
}

/**
 * Create an AI message element with structured response
 */
function createAIMessage(response) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message message-ai';
    
    let contentHTML = `<div class="message-content">`;
    
    // Direct answer - format with markdown-like parsing
    if (response.directAnswer) {
        // Convert markdown-style formatting to HTML
        let formattedAnswer = response.directAnswer
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
        
        // If using Ollama (plain text response), don't add "Direct Answer:" prefix
        if (OLLAMA_CONFIG.useOllama && !response.context && response.evidence.length === 0) {
            contentHTML += `<p>${formattedAnswer}</p>`;
        } else {
            contentHTML += `<p><strong>Direct Answer:</strong> ${formattedAnswer}</p>`;
        }
    }
    
    // Context block
    if (response.context) {
        contentHTML += `
            <div class="context-block">
                <h4 class="context-title">Context</h4>
                <p>${response.context}</p>
            </div>
        `;
    }
    
    // Evidence block
    if (response.evidence && response.evidence.length > 0) {
        contentHTML += `
            <div class="evidence-block">
                <h4 class="evidence-title">Evidence Classification</h4>
                <ul class="evidence-list">
        `;
        response.evidence.forEach(item => {
            contentHTML += `
                <li>
                    ${createEvidenceTag(item.type)}
                    ${item.description}
                </li>
            `;
        });
        contentHTML += `</ul></div>`;
    }
    
    // Closing line
    if (response.closing) {
        contentHTML += `<p class="message-closing">${response.closing}</p>`;
    }
    
    // Refusal message
    if (response.isRefusal) {
        contentHTML += `<div class="message-refusal">${AI_PERSONALITY.refusalTemplate}</div>`;
    }
    
    contentHTML += `</div>`;
    messageDiv.innerHTML = contentHTML;
    
    return messageDiv;
}

/**
 * Create typing indicator
 */
function createTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message message-ai message-typing';
    messageDiv.id = 'typingIndicator';
    messageDiv.innerHTML = `
        <div class="typing-indicator">
            <span class="typing-text">${AI_PERSONALITY.loadingText}</span>
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    return messageDiv;
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===========================================
// DATA LOADING
// ===========================================

/**
 * Load timeline and Epstein data from JSON files
 */
async function loadArchiveData() {
    try {
        const [timelineResponse, epsteinResponse, judaismResponse] = await Promise.all([
            fetch('data/timeline-data.json'),
            fetch('data/epstein-data.json'),
            fetch('data/scraped-judaism-epstein.json')
        ]);
        
        if (timelineResponse.ok) {
            timelineData = await timelineResponse.json();
            console.log('Timeline data loaded:', timelineData.events.length, 'events');
        }
        
        if (epsteinResponse.ok) {
            epsteinData = await epsteinResponse.json();
            console.log('Epstein data loaded');
        }
        
        if (judaismResponse.ok) {
            scrapedJudaismData = await judaismResponse.json();
            console.log('Judaism-Epstein data loaded:', scrapedJudaismData.documents.length, 'documents');
        }
        
        dataLoaded = true;
    } catch (error) {
        console.error('Error loading archive data:', error);
        dataLoaded = false;
    }
}

// ===========================================
// DATA SEARCH FUNCTIONS
// ===========================================

/**
 * Search timeline events by keyword
 */
function searchTimelineEvents(query) {
    if (!timelineData || !timelineData.events) return [];
    
    const queryLower = query.toLowerCase();
    return timelineData.events.filter(event => {
        const searchText = [
            event.actor,
            event.action,
            event.target,
            event.location,
            event.details?.summary,
            event.details?.context,
            event.dateDisplay
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchText.includes(queryLower);
    });
}

/**
 * Search people in the database
 */
function searchPeople(query) {
    if (!timelineData || !timelineData.people) return [];
    
    const queryLower = query.toLowerCase();
    return Object.values(timelineData.people).filter(person => {
        const searchText = [
            person.name,
            person.fullName,
            person.role,
            person.biography
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchText.includes(queryLower);
    });
}

/**
 * Search Epstein-related data
 */
function searchEpsteinData(query) {
    if (!epsteinData) return null;
    
    const queryLower = query.toLowerCase();
    const results = {
        timeline: [],
        people: [],
        locations: [],
        cases: []
    };
    
    // Search timeline
    if (epsteinData.timeline) {
        results.timeline = epsteinData.timeline.filter(event => {
            const searchText = [event.event, event.details, event.category].filter(Boolean).join(' ').toLowerCase();
            return searchText.includes(queryLower);
        });
    }
    
    // Search prominent names
    if (epsteinData.prominentNamesInDocuments?.categories) {
        Object.values(epsteinData.prominentNamesInDocuments.categories).forEach(category => {
            category.forEach(person => {
                if (person.name.toLowerCase().includes(queryLower) || 
                    person.context.toLowerCase().includes(queryLower)) {
                    results.people.push(person);
                }
            });
        });
    }
    
    // Search locations
    if (epsteinData.keyLocations) {
        Object.values(epsteinData.keyLocations).forEach(location => {
            const searchText = [location.name, location.address, location.location, location.details].filter(Boolean).join(' ').toLowerCase();
            if (searchText.includes(queryLower)) {
                results.locations.push(location);
            }
        });
    }
    
    return results;
}

/**
 * Get events by year range
 */
function getEventsByYearRange(startYear, endYear) {
    if (!timelineData || !timelineData.events) return [];
    
    return timelineData.events.filter(event => {
        const eventYear = parseInt(event.date.substring(0, 4));
        return eventYear >= startYear && eventYear <= endYear;
    });
}

/**
 * Get person by name
 */
function getPersonByName(name) {
    if (!timelineData || !timelineData.people) return null;
    
    const nameLower = name.toLowerCase();
    return Object.values(timelineData.people).find(person => 
        person.name.toLowerCase().includes(nameLower) ||
        (person.fullName && person.fullName.toLowerCase().includes(nameLower))
    );
}

/**
 * Check if query is related to archive content
 * Returns true if the query matches any content in our data
 */
function isQueryRelatedToArchive(query) {
    const queryLower = query.toLowerCase();
    
    // List of keywords that indicate archive-related queries
    const archiveKeywords = [
        // Judaism-related
        'jew', 'jews', 'jewish', 'judaism', 'rabbi', 'torah', 'talmud', 'synagogue',
        'kosher', 'shabbat', 'sabbath', 'hebrew', 'israel', 'israeli', 'zion', 'zionism', 'zionist',
        'antisemitism', 'anti-semitism', 'anti-judaism', 'semitic', 'holocaust', 'shoah',
        'orthodox', 'reform', 'conservative', 'hasidic', 'haredi', 'chabad',
        'kabbala', 'kabbalah', 'passover', 'hanukkah', 'yom kippur', 'rosh hashanah',
        'bar mitzvah', 'bat mitzvah', 'circumcision', 'kosher', 'mitzva', 'mitzvah',
        'maimonides', 'torah', 'talmud', 'midrash', 'shekhinah',
        'temple mount', 'western wall', 'jerusalem', 'hebron', 'tel aviv',
        'knesset', 'likud', 'netanyahu', 'sharon', 'rabin', 'peres',
        'mossad', 'idf', 'shin bet',
        'adelson', 'steinhardt', 'wiesel', 'neusner',
        'conversion', 'convert', 'converted',
        
        // Epstein-related
        'epstein', 'maxwell', 'ghislaine', 'trafficking', 'island', 'little st james',
        'lolita express', 'flight log', 'unsealed', 'documents released',
        'pedophile', 'sex trafficking', 'victims', 'accusers',
        'woody allen', 'prince andrew', 'bill clinton', 'donald trump',
        'alan dershowitz', 'les wexner', 'jean-luc brunel',
        
        // Key people from our data
        'sammy davis', 'ivanka trump', 'jared kushner', 'putin', 'chabad',
        'madoff', 'broidy', 'mowbray', 'rafsanjani', 'kook',
        
        // General archive terms
        'documents', 'records', 'evidence', 'testimony', 'court', 'trial'
    ];
    
    // Check if any keyword matches
    for (const keyword of archiveKeywords) {
        if (queryLower.includes(keyword)) {
            return true;
        }
    }
    
    // Check if query matches any events in timeline
    const timelineResults = searchTimelineEvents(query);
    if (timelineResults.length > 0) {
        return true;
    }
    
    // Check if query matches any people
    const peopleResults = searchPeople(query);
    if (peopleResults.length > 0) {
        return true;
    }
    
    // Check Epstein data
    const epsteinResults = searchEpsteinData(query);
    if (epsteinResults && (
        epsteinResults.timeline.length > 0 ||
        epsteinResults.people.length > 0 ||
        epsteinResults.locations.length > 0
    )) {
        return true;
    }
    
    return false;
}

/**
 * Get the out-of-scope response for unrelated queries
 */
function getOutOfScopeResponse() {
    return {
        directAnswer: 'We can only answer questions about Jews and the Epstein case.',
        context: null,
        evidence: [],
        closing: null
    };
}

// ===========================================
// OPENAI API INTEGRATION
// ===========================================

/**
 * Call OpenAI API for chat completion
 */
async function callOpenAIAPI(userMessage) {
    // Build system prompt with scraped data context
    const scrapedContext = buildScrapedContext();
    
    let systemPrompt = `You are a research assistant that ONLY discusses how Jewish individuals and Jewish organizations are connected to Jeffrey Epstein and the Epstein files.

YOUR SOLE PURPOSE: Explain connections between Jews/Judaism and the Epstein case using ONLY the documented evidence provided below.

CRITICAL RULES:
1. EVERY response must focus on Jewish connections to Epstein. Even if asked about Judaism generally, relate it back to the Epstein documents.
2. If a user asks about ANY topic not related to Jews AND Epstein together, respond with EXACTLY: "We can only answer questions about Jews and the Epstein case."
3. ONLY use information from the knowledge base below. Do not make up connections that aren't documented.
4. When answering, always cite which document the information comes from (e.g., "According to document EFTA00090314...").
5. Speak in a calm, investigative tone like a documentary narrator.
6. Keep responses factual and evidence-based. Never speculate beyond what the documents say.

KEY VERIFIED CONNECTIONS YOU CAN DISCUSS:
- Woody Allen: Conversion to Judaism messages in Epstein documents
- Elisabeth Maxwell: Ghislaine Maxwell's mother, CV found in documents
- Ivanka Trump & Jared Kushner: Conversion to Judaism mentioned in documents
- Chabad: Described as "state-sanctioned Judaism" used by Putin to monitor oligarchs, trying to "co-opt Trump presidency"
- Sheldon Adelson & Michael Steinhardt: Jewish philanthropists named in documents
- Dr Ting: Judaism classes conducted "over the phone" from "the island" (Little St. James)
- Jeffrey E.: Email about "proceeding with conversion to Judaism"
- Moscow contacts: Could provide forged "Judaism origins certificates"
- Broidy & Mowbray: Mowbray (convert to Judaism) would "flip on Broidy"
- Madoff case: PhD student studying connection to Judaism

${scrapedContext}`;

    try {
        const response = await fetch(OPENAI_CONFIG.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: OPENAI_CONFIG.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        // Remove emojis from response
        let cleanContent = data.choices[0].message.content.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/gu, '');
        return {
            directAnswer: cleanContent,
            context: null,
            evidence: [],
            closing: null
        };
    } catch (error) {
        console.error('OpenAI API error:', error);
        return {
            directAnswer: `Error connecting to OpenAI: ${error.message}`,
            context: 'Make sure your API key is valid and you have credits available.',
            evidence: [],
            closing: 'Check the console for more details.'
        };
    }
}

// ===========================================
// RESPONSE GENERATOR
// ===========================================

/**
 * Generate a response based on user input using loaded data
 */
function generateDemoResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // Check for speculative/unsupported queries
    if (message.includes('predict') || message.includes('will happen') || message.includes('guilty') || message.includes('innocent')) {
        return {
            isRefusal: true,
            directAnswer: null,
            context: null,
            evidence: null,
            closing: null
        };
    }
    
    // CHECK IF QUERY IS RELATED TO ARCHIVE CONTENT
    // If not related, return out-of-scope response
    if (!isQueryRelatedToArchive(message)) {
        return getOutOfScopeResponse();
    }
    
    // ========================================
    // EPSTEIN-RELATED QUERIES
    // ========================================
    
    if (message.includes('epstein') || message.includes('maxwell') || message.includes('ghislaine')) {
        const epsteinResults = searchEpsteinData(message);
        
        if (message.includes('document') || message.includes('unsealed') || message.includes('released')) {
            return {
                directAnswer: 'In January 2024, a federal judge began unsealing court records from the Virginia Giuffre v. Ghislaine Maxwell lawsuit, releasing approximately 1,270 pages naming around 153 individuals.',
                context: epsteinData ? `${epsteinData.documentReleases.january2024Unsealing.description}. The releases came after years of efforts by victims and investigative journalist Julie K. Brown of the Miami Herald.` : 'Document releases have occurred in multiple phases through court proceedings and congressional action.',
                evidence: [
                    { type: 'confirmed', description: 'Court-ordered document releases from civil litigation' },
                    { type: 'confirmed', description: 'DOJ releases under Epstein Files Transparency Act' }
                ],
                closing: 'I can provide information about specific document releases, named individuals, or the timeline of legal proceedings.'
            };
        }
        
        if (message.includes('island') || message.includes('little st james') || message.includes('virgin islands')) {
            const island = epsteinData?.keyLocations?.littleStJames;
            return {
                directAnswer: island ? `Little St. James Island is a 71.5-acre private island in the US Virgin Islands purchased by Epstein in 1998 for $7.95 million.` : 'Little St. James Island was Epstein\'s private island in the US Virgin Islands.',
                context: island ? `The island featured a main residence, guest houses, staff quarters, helipad, dock, and a distinctive temple-like structure. It was colloquially referred to as "Epstein Island." ${island.status || ''}` : 'The island was a key location in investigations and victim testimony.',
                evidence: [
                    { type: 'confirmed', description: 'Property records and purchase documentation' },
                    { type: 'testimony', description: 'Victim accounts of events at the location' }
                ],
                closing: 'Would you like information about other Epstein properties or the timeline of events related to this location?'
            };
        }
        
        if (message.includes('conviction') || message.includes('sentence') || message.includes('trial')) {
            return {
                directAnswer: 'Ghislaine Maxwell was convicted on December 29, 2021, on five of six counts including sex trafficking of minors, and was sentenced to 20 years in federal prison on June 28, 2022.',
                context: epsteinData ? `Jeffrey Epstein faced charges in 2008 (Florida state charges, resulting in 18-month sentence with work release) and 2019 (federal sex trafficking charges in SDNY, dismissed after his death on August 10, 2019).` : 'Legal proceedings have spanned multiple jurisdictions and years.',
                evidence: [
                    { type: 'confirmed', description: 'Court records from Maxwell trial' },
                    { type: 'confirmed', description: 'Federal indictment and case records' }
                ],
                closing: 'I can provide details on specific legal proceedings, the 2008 plea deal controversy, or victim lawsuits.'
            };
        }
        
        if (message.includes('death') || message.includes('suicide') || message.includes('died')) {
            return {
                directAnswer: 'Jeffrey Epstein was found dead in his cell at the Metropolitan Correctional Center in New York on August 10, 2019. The official ruling was suicide by hanging.',
                context: 'The death occurred under controversial circumstances that have raised questions. Epstein had been removed from suicide watch despite a prior incident on July 23. Guards failed to conduct required checks, his cellmate was transferred the day before, and surveillance cameras reportedly malfunctioned.',
                evidence: [
                    { type: 'confirmed', description: 'Official medical examiner ruling: suicide' },
                    { type: 'confirmed', description: 'DOJ Inspector General investigation of MCC failures' }
                ],
                closing: 'Would you like more details about the circumstances, the investigation into facility failures, or subsequent legal proceedings?'
            };
        }
        
        // General Epstein query
        return {
            directAnswer: 'Jeffrey Epstein (1953-2019) was a financier charged with sex trafficking of minors. He died in custody before trial. His associate Ghislaine Maxwell was convicted in 2021.',
            context: epsteinData ? `Key locations included his Manhattan townhouse, Palm Beach estate, Zorro Ranch in New Mexico, and Little St. James Island. Document releases in January 2024 named approximately 153 individuals, though appearance in documents does not imply wrongdoing.` : 'Court documents have been progressively unsealed since 2024.',
            evidence: [
                { type: 'confirmed', description: 'Federal indictments and court records' },
                { type: 'confirmed', description: 'Ghislaine Maxwell conviction (December 2021)' },
                { type: 'allegation', description: 'Various civil lawsuits and victim claims' }
            ],
            closing: 'I can provide information on specific topics: documents released, named individuals, timeline of events, properties, or legal proceedings.'
        };
    }
    
    // ========================================
    // MIDDLE EAST / ISRAEL-PALESTINE QUERIES
    // ========================================
    
    // Oslo Accords
    if (message.includes('oslo') || (message.includes('1993') && (message.includes('peace') || message.includes('israel')))) {
        const osloTopic = timelineData?.topics?.oslo_accords;
        const osloEvents = searchTimelineEvents('oslo');
        
        return {
            directAnswer: 'The Oslo Accords (1993, 1995) were landmark agreements between Israel and the PLO establishing mutual recognition and a framework for Palestinian self-governance.',
            context: osloTopic ? `${osloTopic.description} Key negotiator Uri Savir led Israeli teams in secret talks in Oslo. The accords were signed on September 13, 1993, in Washington, with PLO Chairman Yasser Arafat and Israeli PM Yitzhak Rabin exchanging letters of recognition.` : 'The accords represented the first direct agreement between Israel and the PLO.',
            evidence: [
                { type: 'confirmed', description: 'Official treaty documents and declarations' },
                { type: 'confirmed', description: 'Historical records of signing ceremonies' }
            ],
            closing: 'Would you like details about the secret negotiations, key figures involved, or subsequent agreements like Oslo II?'
        };
    }
    
    // Saddam Hussein / Scud missiles
    if (message.includes('saddam') || message.includes('scud') || message.includes('hussein') || (message.includes('iraq') && message.includes('israel'))) {
        const scudEvent = searchTimelineEvents('scud')[0];
        const saddam = timelineData?.people?.saddam_hussein;
        
        return {
            directAnswer: 'Saddam Hussein ordered Scud missile attacks against Israel from January 17 to February 23, 1991, during the Gulf War, launching over 40 missiles at Tel Aviv and Haifa.',
            context: saddam ? `${saddam.biography.substring(0, 300)}...` : 'The attacks used modified al-Husayn missiles (Soviet Scud derivatives) with extended range but reduced accuracy. The strategic goal was to provoke Israeli retaliation and fracture the US-led coalition.',
            evidence: [
                { type: 'confirmed', description: 'Military records and contemporary reporting' },
                { type: 'confirmed', description: 'Casualty reports: 2 direct deaths, 11-74 indirect' }
            ],
            closing: 'Would you like more details about the military operations, Israel\'s response, or the broader Gulf War context?'
        };
    }
    
    // Gaza Disengagement
    if (message.includes('disengagement') || message.includes('gaza withdrawal') || (message.includes('2005') && message.includes('gaza'))) {
        const gazaTopic = timelineData?.topics?.gaza_disengagement;
        
        return {
            directAnswer: 'Israel withdrew from the Gaza Strip in August-September 2005, dismantling all 21 settlements and evacuating approximately 8,500 settlers under Prime Minister Ariel Sharon\'s Disengagement Plan.',
            context: gazaTopic ? `${gazaTopic.description} The operation involved 55,000 Israeli troops. Approximately half of settlers accepted government compensation ($150,000-$400,000 per family); the remainder resisted forcibly.` : 'The withdrawal ended nearly four decades of Israeli military presence in Gaza.',
            evidence: [
                { type: 'confirmed', description: 'Disengagement Plan Implementation Law (Knesset)' },
                { type: 'confirmed', description: 'IDF operational records' }
            ],
            closing: 'Would you like information about the political debate, settler resistance, or subsequent events in Gaza?'
        };
    }
    
    // Camp David 2000
    if (message.includes('camp david') || (message.includes('2000') && message.includes('peace'))) {
        return {
            directAnswer: 'The Camp David Summit (July 11-25, 2000) was a peace negotiation between Israeli PM Ehud Barak, Palestinian Authority Chairman Yasser Arafat, and US President Bill Clinton.',
            context: 'Barak offered Israeli withdrawal from up to 95% of the West Bank and 100% of Gaza, along with Palestinian control over parts of Jerusalem. The summit failed over disagreements about sovereignty of the Temple Mount (Haram al-Sharif). Clinton blamed Arafat for the failure.',
            evidence: [
                { type: 'confirmed', description: 'Official summit records and statements' },
                { type: 'testimony', description: 'Participant accounts (varying interpretations)' }
            ],
            closing: 'Would you like details about the specific proposals, the subsequent Taba talks, or the Second Intifada that followed?'
        };
    }
    
    // 2006 Lebanon War
    if (message.includes('lebanon') || message.includes('hezbollah') || (message.includes('2006') && message.includes('war'))) {
        const lebanonEvent = searchTimelineEvents('hezbollah')[0];
        
        return {
            directAnswer: 'The 2006 Lebanon War (July 12 - August 14, 2006) was a 34-day conflict between Israel and Hezbollah, triggered by a Hezbollah cross-border raid that killed 8 Israeli soldiers and kidnapped 2.',
            context: 'Israel responded with massive air operations targeting Hezbollah infrastructure. Hezbollah fired nearly 4,000 rockets at Israeli cities. Casualties included 157 Israelis and an estimated 1,000 Lebanese. The war ended with UN Security Council Resolution 1701.',
            evidence: [
                { type: 'confirmed', description: 'UN Security Council Resolution 1701' },
                { type: 'confirmed', description: 'IDF and Lebanese government casualty reports' }
            ],
            closing: 'Would you like information about specific operations, the aftermath, or Hezbollah\'s role in the region?'
        };
    }
    
    // Operation Orchard / Syria nuclear reactor
    if (message.includes('syria') && (message.includes('nuclear') || message.includes('reactor') || message.includes('bomb'))) {
        return {
            directAnswer: 'On September 6, 2007, Israeli fighter jets destroyed Syria\'s Al-Kibar nuclear reactor in Operation Orchard. The facility, built with North Korean assistance, was capable of producing weapons-grade plutonium.',
            context: 'Eight Israeli jets (4 F-15s and 4 F-16s) dropped 17-18 tons of explosives, completely destroying the reactor. Israel maintained silence for over a decade, officially confirming the attack only in March 2018. Officials framed it as a warning to Iran.',
            evidence: [
                { type: 'confirmed', description: 'Israeli government confirmation (2018)' },
                { type: 'confirmed', description: 'Declassified footage and intelligence documents' }
            ],
            closing: 'Would you like more details about the intelligence gathering, political context, or Iran-related implications?'
        };
    }
    
    // Mavi Marmara / Turkey-Israel relations
    if (message.includes('mavi marmara') || message.includes('flotilla') || (message.includes('turkey') && message.includes('israel'))) {
        return {
            directAnswer: 'On May 31, 2010, Israeli commandos raided the Turkish-flagged Mavi Marmara ship attempting to break the Gaza blockade, killing 10 activists. This caused a major diplomatic crisis between Israel and Turkey.',
            context: 'The UN Palmer Report (2011) found Israel\'s blockade was legal but the raid was excessive. Turkey expelled Israel\'s ambassador, suspended military agreements, and downgraded relations. Turkey demanded an apology; Israel offered regret but refused a full apology.',
            evidence: [
                { type: 'confirmed', description: 'UN Palmer Commission Report findings' },
                { type: 'confirmed', description: 'Turkish government diplomatic announcements' }
            ],
            closing: 'Would you like details about the Palmer Report findings, Turkey\'s specific sanctions, or the subsequent reconciliation efforts?'
        };
    }
    
    // Operation Cast Lead
    if (message.includes('cast lead') || (message.includes('2008') && message.includes('gaza')) || (message.includes('2009') && message.includes('gaza'))) {
        return {
            directAnswer: 'Operation Cast Lead (December 27, 2008 - January 17, 2009) was a 22-day Israeli military campaign against Hamas in Gaza, resulting in 1,385-1,419 Palestinian deaths and 13 Israeli deaths.',
            context: 'The operation was launched in response to eight years of rocket attacks. It began with aerial bombardment followed by a ground offensive. Over 3,540 housing units were destroyed and 20,000+ people displaced. UN investigations found evidence of war crimes by both sides.',
            evidence: [
                { type: 'confirmed', description: 'UN Fact-Finding Mission (Goldstone Report)' },
                { type: 'confirmed', description: 'IDF operational records' }
            ],
            closing: 'Would you like more details about specific incidents, the Goldstone Report findings, or the ceasefire negotiations?'
        };
    }
    
    // ========================================
    // PERSON-SPECIFIC QUERIES
    // ========================================
    
    // Check for specific people
    const peopleNames = ['barak', 'rabin', 'arafat', 'sharon', 'olmert', 'abbas', 'savir', 'netanyahu'];
    for (const name of peopleNames) {
        if (message.includes(name)) {
            const person = getPersonByName(name);
            if (person) {
                const relatedEvents = person.relatedEvents ? 
                    person.relatedEvents.map(id => searchTimelineEvents(id.substring(0, 4))).flat().slice(0, 3) : [];
                
                return {
                    directAnswer: `${person.name} served as ${person.role}.`,
                    context: person.biography,
                    evidence: [
                        { type: 'confirmed', description: 'Official biographical records' },
                        { type: 'confirmed', description: 'Government and historical documentation' }
                    ],
                    closing: `Would you like information about specific events involving ${person.name} or their connections to other figures?`
                };
            }
        }
    }
    
    // ========================================
    // YEAR-SPECIFIC QUERIES
    // ========================================
    
    const yearMatch = message.match(/\b(19\d{2}|20[0-2]\d)\b/);
    if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        const events = getEventsByYearRange(year, year);
        
        if (events.length > 0) {
            const eventSummaries = events.slice(0, 5).map(e => 
                `• ${e.dateDisplay}: ${e.actor} ${e.action} ${e.target}${e.location ? ` (${e.location})` : ''}`
            ).join('\n');
            
            return {
                directAnswer: `Found ${events.length} documented event(s) from ${year} in the archive.`,
                context: `Key events:\n${eventSummaries}`,
                evidence: [
                    { type: 'confirmed', description: 'Events verified from official records' }
                ],
                closing: `Would you like detailed information about any specific event from ${year}?`
            };
        }
    }
    
    // ========================================
    // GENERAL QUERIES
    // ========================================
    
    // Timeline query
    if (message.includes('timeline')) {
        const eventCount = timelineData ? timelineData.events.length : 0;
        return {
            directAnswer: `The archive contains ${eventCount} documented events spanning 1990-2012, covering Israeli-Palestinian relations, Middle East conflicts, and diplomatic initiatives.`,
            context: 'Events are sourced from official records, court filings, treaty documents, and verified witness testimonies. Each event is categorized by type (military, diplomatic, political) and evidence classification.',
            evidence: [
                { type: 'confirmed', description: 'Official government and UN records' },
                { type: 'testimony', description: 'Verified witness accounts' }
            ],
            closing: 'Would you like to explore events by year, by actor, or by topic (Oslo Accords, Gaza, Lebanon, etc.)?'
        };
    }
    
    // Document query
    if (message.includes('document') || message.includes('record') || message.includes('filing')) {
        return {
            directAnswer: 'Documents in this archive are classified by source type, verification status, and relevance.',
            context: 'The archive includes treaty texts, UN resolutions, court documents, official statements, and investigative records. Each document maintains metadata about origin, date, and verification chain.',
            evidence: [
                { type: 'confirmed', description: 'Court filings and government records' },
                { type: 'media', description: 'Investigative journalism and news reports' },
                { type: 'allegation', description: 'Claims in legal proceedings' }
            ],
            closing: 'Would you like to search for specific document types or explore materials from a particular case or time period?'
        };
    }
    
    // People/person query
    if (message.includes('people') || message.includes('person') || message.includes('who') || message.includes('key')) {
        const peopleCount = timelineData && timelineData.people ? Object.keys(timelineData.people).length : 0;
        return {
            directAnswer: `The archive contains profiles on ${peopleCount} key individuals involved in documented events.`,
            context: 'Profiles include political leaders (Rabin, Barak, Sharon, Arafat, Abbas), diplomats (Uri Savir), and other figures. Each profile contains verified biographical information, roles, and connections to documented events.',
            evidence: [
                { type: 'confirmed', description: 'Official positions and public records' },
                { type: 'testimony', description: 'Statements made under oath or officially' }
            ],
            closing: 'Would you like to explore specific individuals or view relationship mappings between people?'
        };
    }
    
    // Summary/findings query
    if (message.includes('summary') || message.includes('finding') || message.includes('summarize')) {
        return {
            directAnswer: 'The archive covers two major areas: Israeli-Palestinian/Middle East events (1990-2012) and Epstein case documentation.',
            context: 'Key topics include: Oslo Accords (1993-1995), Gaza Disengagement (2005), multiple military operations (Grapes of Wrath, Cast Lead, Pillar of Defense), peace negotiations (Camp David, Taba, Annapolis), and comprehensive Epstein case records including document releases and legal proceedings.',
            evidence: [
                { type: 'confirmed', description: 'Verified facts from official sources' },
                { type: 'testimony', description: 'Documented witness accounts' },
                { type: 'allegation', description: 'Claims in legal proceedings' }
            ],
            closing: 'Would you like to focus on a specific topic area or explore the complete timeline?'
        };
    }
    
    // Default response - query matched keywords but no specific handler
    // Provide guidance on available topics
    const hasData = timelineData && epsteinData;
    const eventCount = timelineData ? timelineData.events.length : 0;
    const peopleCount = timelineData?.people ? Object.keys(timelineData.people).length : 0;
    
    return {
        directAnswer: 'Your query relates to archive content. Here\'s what I can help you explore:',
        context: hasData ?
            `**Israeli-Palestinian / Middle East (1990-2012)**\n` +
            `• ${eventCount} documented events\n` +
            `• ${peopleCount} key figure profiles\n` +
            `• Topics: Oslo Accords, Gaza Disengagement, Lebanon War, Camp David, Annapolis\n\n` +
            `**Epstein Case Documentation**\n` +
            `• 2024 document releases (~153 individuals named)\n` +
            `• Maxwell conviction and sentencing\n` +
            `• Key locations and legal timeline` :
            'The archive covers Israeli-Palestinian events (1990-2012) and Epstein case documentation.',
        evidence: [
            { type: 'confirmed', description: 'Court records and official documents' },
            { type: 'testimony', description: 'Verified statements and depositions' }
        ],
        closing: 'Try a specific question like:\n• "What happened at Oslo in 1993?"\n• "Tell me about Operation Cast Lead"\n• "What documents were released about Epstein?"\n• "Who was Ehud Barak?"'
    };
}

// ===========================================
// EVENT HANDLERS
// ===========================================

/**
 * Handle sending a message (from welcome screen input)
 */
async function handleSendMessage(inputElement) {
    const input = inputElement || chatInput;
    const message = input.value.trim();
    
    if (!message) return;
    
    // Switch to chat mode if on welcome screen
    switchToChatMode();
    
    // Clear input
    input.value = '';
    if (chatInputBottom) {
        chatInputBottom.value = '';
    }
    
    // Add to recent searches in sidebar
    addRecentSearch(message);
    
    // Update context drawer with relevant info
    updateContextDrawer(message);
    
    // Add user message
    const userMessageEl = createUserMessage(message);
    chatMessages.appendChild(userMessageEl);
    scrollToBottom();
    
    // Show typing indicator
    const typingIndicator = createTypingIndicator();
    chatMessages.appendChild(typingIndicator);
    scrollToBottom();
    
    // Get AI response (OpenAI or demo mode)
    let response;
    if (OPENAI_CONFIG.useOpenAI) {
        response = await callOpenAIAPI(message);
    } else {
        // Demo mode - simulate delay
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
        response = generateDemoResponse(message);
    }
    
    // Remove typing indicator
    removeTypingIndicator();
    
    // Generate and display AI response
    const aiMessageEl = createAIMessage(response);
    chatMessages.appendChild(aiMessageEl);
    scrollToBottom();
}

/**
 * Handle input keypress (Enter to send)
 */
function handleInputKeypress(e, inputElement) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(inputElement);
    }
}

/**
 * Handle topic chip click
 */
function handleTopicClick(e) {
    const chip = e.target.closest('.topic-chip');
    if (!chip) return;
    
    const query = chip.dataset.query;
    if (query && chatInput) {
        chatInput.value = query;
        handleSendMessage(chatInput);
    }
}

/**
 * Toggle context drawer
 */
function toggleContextDrawer() {
    if (contextDrawer) {
        contextDrawer.classList.toggle('collapsed');
    }
}

/**
 * Update sidebar with recent search
 */
function addRecentSearch(query) {
    const savedChatsSection = document.getElementById('savedChatsSection');
    const savedChatsList = document.getElementById('savedChatsList');
    
    if (!savedChatsSection || !savedChatsList) return;
    
    // Show the section
    savedChatsSection.classList.remove('hidden');
    
    // Create new chat item
    const chatItem = document.createElement('li');
    chatItem.className = 'nav-item chat-item';
    
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    // Truncate query for display
    const displayQuery = query.length > 30 ? query.substring(0, 30) + '...' : query;
    
    chatItem.innerHTML = `
        <span class="chat-title">${escapeHtml(displayQuery)}</span>
        <span class="chat-date">${dateStr}</span>
    `;
    
    // Add to top of list
    savedChatsList.insertBefore(chatItem, savedChatsList.firstChild);
    
    // Limit to 5 recent searches
    while (savedChatsList.children.length > 5) {
        savedChatsList.removeChild(savedChatsList.lastChild);
    }
}

/**
 * Update context drawer with relevant information based on the query
 */
function updateContextDrawer(query) {
    const drawer = document.getElementById('contextDrawer');
    const toggleBtn = document.getElementById('toggleDrawer');
    const sourceList = document.getElementById('sourceList');
    const relatedPeopleList = document.getElementById('relatedPeopleList');
    const keyThemesList = document.getElementById('keyThemesList');
    
    if (!drawer || !sourceList || !relatedPeopleList || !keyThemesList) return;
    
    // Clear existing content
    sourceList.innerHTML = '';
    relatedPeopleList.innerHTML = '';
    keyThemesList.innerHTML = '';
    
    const queryLower = query.toLowerCase();
    
    // Track if we found any relevant content
    let hasRelevantContent = false;
    
    // Find relevant documents from our data
    if (scrapedJudaismData && scrapedJudaismData.documents) {
        let relevantDocs = [];
        let relevantPeople = new Set();
        let relevantThemes = new Set();
        
        // Search through documents for matches
        scrapedJudaismData.documents.forEach(doc => {
            const docContent = doc.content.join(' ').toLowerCase();
            if (docContent.includes(queryLower) || 
                queryLower.split(' ').some(word => word.length > 3 && docContent.includes(word))) {
                relevantDocs.push(doc);
            }
        });
        
        // Only show documents if we found matches - NO fallback to defaults
        if (relevantDocs.length > 0) {
            hasRelevantContent = true;
            relevantDocs.slice(0, 5).forEach(doc => {
                const li = document.createElement('li');
                li.className = 'source-item';
                li.innerHTML = `
                    <span class="source-type">${doc.type || 'Document'}</span>
                    <span class="source-name">${doc.id}</span>
                    <span class="source-date">${doc.matches || 1} match(es)</span>
                `;
                sourceList.appendChild(li);
            });
        }
        
        // Find relevant people - only if they match the query
        if (scrapedJudaismData.summary && scrapedJudaismData.summary.namedIndividuals) {
            scrapedJudaismData.summary.namedIndividuals.forEach(person => {
                if (queryLower.includes(person.toLowerCase()) || 
                    queryLower.split(' ').some(word => word.length > 3 && person.toLowerCase().includes(word))) {
                    relevantPeople.add(person);
                }
            });
        }
        
        // Only add people if we found matches - NO fallback to defaults
        if (relevantPeople.size > 0) {
            hasRelevantContent = true;
            Array.from(relevantPeople).slice(0, 5).forEach(person => {
                const li = document.createElement('li');
                li.className = 'related-item';
                const initials = person.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                li.innerHTML = `
                    <div class="related-avatar">${initials}</div>
                    <div class="related-info">
                        <span class="related-name">${escapeHtml(person)}</span>
                        <span class="related-role">In Epstein documents</span>
                    </div>
                `;
                relatedPeopleList.appendChild(li);
            });
        }
        
        // Find relevant themes - only if they match the query
        if (scrapedJudaismData.summary && scrapedJudaismData.summary.keyThemes) {
            scrapedJudaismData.summary.keyThemes.forEach(theme => {
                if (queryLower.split(' ').some(word => word.length > 3 && theme.toLowerCase().includes(word))) {
                    relevantThemes.add(theme);
                }
            });
        }
        
        // Only add themes if we found matches - NO fallback to defaults
        if (relevantThemes.size > 0) {
            hasRelevantContent = true;
            Array.from(relevantThemes).slice(0, 5).forEach(theme => {
                const li = document.createElement('li');
                li.className = 'event-item';
                li.innerHTML = `
                    <span class="event-name">${escapeHtml(theme)}</span>
                `;
                keyThemesList.appendChild(li);
            });
        }
    }
    
    // Only show drawer if we have relevant content to display
    if (hasRelevantContent) {
        drawer.classList.remove('hidden');
        if (toggleBtn) toggleBtn.classList.remove('hidden');
    } else {
        drawer.classList.add('hidden');
        if (toggleBtn) toggleBtn.classList.add('hidden');
    }
}

/**
 * Toggle sidebar (mobile)
 */
function toggleSidebar() {
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

/**
 * Handle voice button click
 */
function handleVoiceClick(btn, input) {
    btn.classList.toggle('active');
    
    if (btn.classList.contains('active')) {
        // Voice recording would start here
        if (input) input.placeholder = 'Listening...';
    } else {
        if (input) input.placeholder = AI_PERSONALITY.inputPlaceholder;
    }
}

// ===========================================
// NAVIGATION HANDLING
// ===========================================

/**
 * Handle nav item click
 */
function handleNavClick(e) {
    const navItem = e.target.closest('.nav-item');
    if (!navItem) return;
    
    // Remove active class from all items in same list
    const navList = navItem.closest('.nav-list');
    if (navList) {
        navList.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
    }
    
    // Add active class to clicked item
    navItem.classList.add('active');
}

// ===========================================
// INITIALIZATION
// ===========================================

/**
 * Initialize the application
 */
async function init() {
    // Get DOM elements
    chatMessages = document.getElementById('chatMessages');
    chatInput = document.getElementById('chatInput');
    chatInputBottom = document.getElementById('chatInputBottom');
    sendBtn = document.getElementById('sendBtn');
    voiceBtn = document.getElementById('voiceBtn');
    contextDrawer = document.getElementById('contextDrawer');
    toggleDrawer = document.getElementById('toggleDrawer');
    closeDrawer = document.getElementById('closeDrawer');
    sidebar = document.getElementById('sidebar');
    welcomeScreen = document.getElementById('welcomeScreen');
    chatInputContainer = document.getElementById('chatInputContainer');
    
    // Get bottom input buttons
    sendBtnBottom = document.querySelector('.btn-send-bottom');
    voiceBtnBottom = document.querySelector('.btn-voice-bottom');
    
    // Load archive data (demo data)
    await loadArchiveData();
    
    // Load scraped data from localStorage
    loadScrapedData();
    
    // Welcome screen input events
    if (sendBtn) {
        sendBtn.addEventListener('click', () => handleSendMessage(chatInput));
    }
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => handleInputKeypress(e, chatInput));
    }
    if (voiceBtn) {
        voiceBtn.addEventListener('click', () => handleVoiceClick(voiceBtn, chatInput));
    }
    
    // Bottom input events (chat mode)
    if (sendBtnBottom) {
        sendBtnBottom.addEventListener('click', () => handleSendMessage(chatInputBottom));
    }
    if (chatInputBottom) {
        chatInputBottom.addEventListener('keypress', (e) => handleInputKeypress(e, chatInputBottom));
    }
    if (voiceBtnBottom) {
        voiceBtnBottom.addEventListener('click', () => handleVoiceClick(voiceBtnBottom, chatInputBottom));
    }
    
    // Topic chips
    const topicChips = document.querySelectorAll('.topic-chip');
    topicChips.forEach(chip => {
        chip.addEventListener('click', handleTopicClick);
    });
    
    // Drawer controls
    if (toggleDrawer) {
        toggleDrawer.addEventListener('click', toggleContextDrawer);
    }
    if (closeDrawer) {
        closeDrawer.addEventListener('click', toggleContextDrawer);
    }
    
    // Navigation
    document.querySelectorAll('.nav-list').forEach(list => {
        list.addEventListener('click', handleNavClick);
    });
    
    // Logo and Star click handlers - reset to home
    const logoText = document.getElementById('logoText');
    const welcomeStarLogo = document.getElementById('welcomeStarLogo');
    const chatStarLogo = document.getElementById('chatStarLogo');
    
    if (logoText) {
        logoText.addEventListener('click', resetToHome);
    }
    if (welcomeStarLogo) {
        welcomeStarLogo.addEventListener('click', resetToHome);
    }
    if (chatStarLogo) {
        chatStarLogo.addEventListener('click', resetToHome);
    }
    
    // Focus input
    if (chatInput) {
        chatInput.focus();
    }
    
    console.log('Research Archive Interface initialized');
    if (dataLoaded) {
        console.log('Archive data loaded successfully');
        if (timelineData) console.log(`- ${timelineData.events.length} timeline events`);
        if (timelineData?.people) console.log(`- ${Object.keys(timelineData.people).length} people profiles`);
        if (epsteinData) console.log('- Epstein case data loaded');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
