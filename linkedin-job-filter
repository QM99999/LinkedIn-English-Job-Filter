// ==UserScript==
// @name         linkedin-job-filter
// @namespace    http://tampermonkey.net/
// @version      6.3
// @description  Sets transparency to 50% for German-speaking roles while keeping English roles highlighted.
// @author       Gemini
// @match        https://www.linkedin.com/jobs/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. List of German job-related keywords to flag
    const germanKeywords = [
        'werkstudent', 'praktikum', 'buchhalter', 'steuer', 'prüfung',
        'assistent', 'vertrieb', 'berater', 'leitung', 'leiter',
        'kaufmann', 'kauffrau', 'aushilfe', 'mitarbeiter', 'dozent',
        'betriebswirtschaft', 'finanz', 'personal', 'organisation', 'recht',
        'verwaltung', 'audit', 'beratung', 'unterstützung', 'buchhaltung'
    ];

    const softFilter = () => {
        // Target all possible job card containers used by LinkedIn
        const cards = document.querySelectorAll(`
            .jobs-search-results-list__list-item,
            .job-card-container,
            [data-occludable-job-id]
        `);

        cards.forEach(card => {
            // Find the job title element
            const titleEl = card.querySelector('.job-card-list__title, .artdeco-entity-lockup__title, strong');
            if (!titleEl) return;

            const titleText = titleEl.innerText.toLowerCase();

            // Logic A: Check if the title contains any German keywords
            const isGermanTitle = germanKeywords.some(key => titleText.includes(key));

            // Logic B: Regex to match various gender tag formats like (m/w/d), |m/w/d|, /w/m, (gn)
            const genderRegex = /[\(\[\/\|](m|w|d|gn|x|i)[\/\|*]/i;
            const hasGenderTag = genderRegex.test(titleText) && !titleText.includes('english');

            if (isGermanTitle || hasGenderTag) {
                // Dim the card to 50% opacity if it matches German criteria
                card.style.opacity = '0.5';
                // Optional: Apply grayscale for better visual distinction
                card.style.filter = 'grayscale(50%)';
            } else {
                // Ensure English or non-flagged roles remain at 100% opacity
                card.style.opacity = '1';
                card.style.filter = 'none';
            }
        });
    };

    // Use MutationObserver to handle dynamic content loading during scrolling
    const observer = new MutationObserver(() => {
        softFilter();
    });

    const start = () => {
        // Observe changes in the document body to catch newly loaded job cards
        observer.observe(document.body, { childList: true, subtree: true });
        softFilter();
        console.log("LinkedIn Filter 6.3 Active: German roles set to 50% transparency.");
    };

    // Polling fallback to catch cards that might be missed by the observer
    setInterval(softFilter, 500);

    // Initialization based on document state
    if (document.readyState === 'complete') {
        start();
    } else {
        window.addEventListener('load', start);
    }
})();
