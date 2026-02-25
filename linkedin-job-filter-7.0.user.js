// ==UserScript==
// @name         linkedin-job-filter
// @namespace    http://tampermonkey.net/
// @version      7.0
// @description  Full control with both Whitelist and Blacklist. Prioritizes Whitelist and dims everything else that looks German.
// @author       Qimin Zhang 
// @match        https://www.linkedin.com/jobs/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /**
     * CONFIGURATION
     */
    const CONFIG = {
        // 1. GERMAN INDICATORS: Dims if these German words appear (unless whitelisted)
        germanKeywords: [
            'werkstudent', 'praktikum', 'buchhalter', 'steuer', 'prüfung',
            'assistent', 'vertrieb', 'berater', 'leitung', 'leiter',
            'kaufmann', 'kauffrau', 'aushilfe', 'mitarbeiter', 'dozent',
            'betriebswirtschaft', 'finanz', 'personal', 'organisation', 'recht',
            'verwaltung', 'audit', 'beratung', 'unterstützung', 'buchhaltung',
            'kennzahlen', 'wesen', 'bereich', 'abteilung', 'tätigkeit', 'verantwortung'
        ],

        // 2. WHITELIST: NEVER dim if title contains these (High Priority)
        whitelistKeywords: [

        ],

        // 3. CUSTOM BLACKLIST: ALWAYS dim if title contains these (e.g., sectors you don't like)
        customBlacklist: [
            'intern',
        ],

        opacityValue: '0.4',
        scanInterval: 600
    };

    const runFilter = () => {
        const jobCards = document.querySelectorAll(`
            .jobs-search-results-list__list-item,
            .job-card-container,
            [data-occludable-job-id]
        `);

        jobCards.forEach(card => {
            const titleEl = card.querySelector('.job-card-list__title, .artdeco-entity-lockup__title, strong');
            if (!titleEl) return;

            const titleText = titleEl.innerText.toLowerCase();

            // STEP 1: Check Custom Blacklist (Dim immediately)
            const isBlacklisted = CONFIG.customBlacklist.some(key => titleText.includes(key.toLowerCase()));
            if (isBlacklisted) {
                card.style.opacity = CONFIG.opacityValue;
                card.style.filter = 'grayscale(80%)';
                return;
            }

            // STEP 2: Check Whitelist (Bright immediately, skip German detection)
            const isWhitelisted = CONFIG.whitelistKeywords.some(key => titleText.includes(key.toLowerCase()));
            if (isWhitelisted) {
                card.style.opacity = '1';
                card.style.filter = 'none';
                return;
            }

            // STEP 3: Standard German Detection
            // A. German Keyword Match
            const isGermanKeyword = CONFIG.germanKeywords.some(key => titleText.includes(key));

            // B. Strict Gender Tag Detection (m/w/d)
            const isGermanGenderTag = /[\(\[\/\|][^)\|\s]*m[^)\|\s]*w[^)\|\s]*[\)\]\/\|]/i.test(titleText) ||
                                      /[\(\[\/\|][^)\|\s]*w[^)\|\s]*m[^)\|\s]*[\)\]\/\|]/i.test(titleText);

            // C. Exemptions (English indicators)
            const isEnglishExemption = titleText.includes('english') || titleText.includes('f/m/x') || titleText.includes('m/f/d');

            // D. German-specific characters
            const hasGermanChars = /[äöüß]/i.test(titleText);

            // DECISION
            const shouldDim = isGermanKeyword || (isGermanGenderTag && !isEnglishExemption) || hasGermanChars;

            if (shouldDim) {
                card.style.opacity = CONFIG.opacityValue;
                card.style.filter = 'grayscale(60%)';
            } else {
                card.style.opacity = '1';
                card.style.filter = 'none';
            }
        });
    };

    const init = () => {
        const observer = new MutationObserver(runFilter);
        observer.observe(document.body, { childList: true, subtree: true });
        setInterval(runFilter, CONFIG.scanInterval);
        runFilter();
    };

    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init);
})();

