// ==UserScript==
// @name         LinkedIn Ultimate Job Hunter Assistant (Minimalist v5.1)
// @namespace    http://tampermonkey.net/
// @version      5.1
// @description  Auto-filter irrelevant/German jobs, sliding switch controls, fixed title duplication bug, auto-clears data after CSV export.
// @author       Qimin Zhang
// @match        https://www.linkedin.com/jobs/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linkedin.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /**
     * ==========================================
     * Module 1: Configuration & State Management (Remembers user settings and position)
     * ==========================================
     */
    let savedSettings = JSON.parse(localStorage.getItem('linkedin_helper_settings') || '{}');

    const CONFIG = {
        enableFilter: savedSettings.enableFilter !== undefined ? savedSettings.enableFilter : true,
        hideCompletely: savedSettings.hideCompletely !== undefined ? savedSettings.hideCompletely : true,

        germanKeywords: [],
        whitelistKeywords: [],   // e.g., 'software', 'english'
        customBlacklist: ['senior','student', 'intern', 'bangkok','Consultant'],
        opacityValue: '0.3',
        scanInterval: 800
    };

    const saveSettings = () => {
        localStorage.setItem('linkedin_helper_settings', JSON.stringify({
            enableFilter: CONFIG.enableFilter,
            hideCompletely: CONFIG.hideCompletely,
            panelLeft: savedSettings.panelLeft,
            panelTop: savedSettings.panelTop
        }));
    };

    /**
     * ==========================================
     * Module 2: Core Filtering Logic
     * ==========================================
     */
    const runFilter = () => {
        const jobCards = document.querySelectorAll(`
            .jobs-search-results-list__list-item,
            .job-card-container,
            [data-occludable-job-id]
        `);

        jobCards.forEach(card => {
            const applyKeep = () => {
                card.setAttribute('data-is-filtered', 'false');
                card.style.display = '';
                card.style.opacity = '1';
                card.style.filter = 'none';
            };

            if (!CONFIG.enableFilter) {
                applyKeep();
                return;
            }

            const titleEl = card.querySelector('.job-card-list__title, .artdeco-entity-lockup__title, strong');
            if (!titleEl) return;

            const titleText = titleEl.textContent.toLowerCase();

            const applyFilter = () => {
                card.setAttribute('data-is-filtered', 'true');
                if (CONFIG.hideCompletely) {
                    card.style.display = 'none';
                } else {
                    card.style.display = '';
                    card.style.opacity = CONFIG.opacityValue;
                    card.style.filter = 'grayscale(100%)';
                }
            };

            const isBlacklisted = CONFIG.customBlacklist.some(key => titleText.includes(key.toLowerCase()));
            if (isBlacklisted) { applyFilter(); return; }

            const isWhitelisted = CONFIG.whitelistKeywords.some(key => titleText.includes(key.toLowerCase()));
            if (isWhitelisted) { applyKeep(); return; }

            const isGermanKeyword = CONFIG.germanKeywords.some(key => titleText.includes(key));
            const isGermanGenderTag = /[\(\[][^\)\]]*(m[\/\-]w|w[\/\-]m)[^\)\]]*[\)\]]/i.test(titleText);
            const isEnglishExemption = titleText.includes('english') || titleText.includes('f/m/x') || titleText.includes('m/f/d');
            const hasGermanChars = /[äöüß]/i.test(titleText);

            if (isGermanKeyword || (isGermanGenderTag && !isEnglishExemption) || hasGermanChars) {
                applyFilter();
            } else {
                applyKeep();
            }
        });
    };

    /**
     * ==========================================
     * Module 3: UI Panel & Data Collection Logic
     * ==========================================
     */
    const initUI = () => {
        let jobs = JSON.parse(sessionStorage.getItem('linkedin_collected_jobs') || '[]');

        const panel = document.createElement('div');
        panel.style.position = 'fixed';
        panel.style.zIndex = '9999';
        panel.style.backgroundColor = 'white';
        panel.style.border = '1px solid #ddd';
        panel.style.borderRadius = '10px';
        panel.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
        panel.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
        panel.style.minWidth = '240px';

        if (savedSettings.panelLeft && savedSettings.panelTop) {
            panel.style.left = savedSettings.panelLeft;
            panel.style.top = savedSettings.panelTop;
        } else {
            panel.style.bottom = '20px';
            panel.style.right = '20px';
        }

        const dragHandle = document.createElement('div');
        dragHandle.innerHTML = '☷ Drag Control Panel';
        dragHandle.style.cursor = 'grab';
        dragHandle.style.backgroundColor = '#f8f9fa';
        dragHandle.style.padding = '10px';
        dragHandle.style.textAlign = 'center';
        dragHandle.style.fontSize = '12px';
        dragHandle.style.color = '#555';
        dragHandle.style.fontWeight = '600';
        dragHandle.style.borderBottom = '1px solid #eaeaea';
        dragHandle.style.borderTopLeftRadius = '10px';
        dragHandle.style.borderTopRightRadius = '10px';
        dragHandle.style.userSelect = 'none';
        panel.appendChild(dragHandle);

        let isDragging = false;
        let offsetX, offsetY;

        dragHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragHandle.style.cursor = 'grabbing';
            const rect = panel.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            panel.style.bottom = 'auto';
            panel.style.right = 'auto';
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        function onMouseMove(e) {
            if (!isDragging) return;
            panel.style.left = `${e.clientX - offsetX}px`;
            panel.style.top = `${e.clientY - offsetY}px`;
        }

        function onMouseUp() {
            if (!isDragging) return;
            isDragging = false;
            dragHandle.style.cursor = 'grab';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            savedSettings.panelLeft = panel.style.left;
            savedSettings.panelTop = panel.style.top;
            saveSettings();
        }

        const contentContainer = document.createElement('div');
        contentContainer.style.padding = '15px';
        contentContainer.style.display = 'flex';
        contentContainer.style.flexDirection = 'column';
        contentContainer.style.gap = '12px';
        panel.appendChild(contentContainer);

        const statusText = document.createElement('div');
        statusText.innerHTML = `Collected: <strong style="color:#0a66c2; font-size:18px;">${jobs.length}</strong>`;
        statusText.style.fontSize = '14px';
        statusText.style.color = '#333';
        statusText.style.textAlign = 'center';
        statusText.style.marginBottom = '4px';
        contentContainer.appendChild(statusText);

        function createBtn(text, bgColor) {
            const btn = document.createElement('button');
            btn.innerHTML = text;
            btn.style.padding = '10px 12px';
            btn.style.backgroundColor = bgColor;
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.borderRadius = '6px';
            btn.style.cursor = 'pointer';
            btn.style.fontWeight = 'bold';
            btn.style.fontSize = '13px';
            btn.style.transition = 'all 0.2s ease';
            btn.onmouseover = () => { btn.style.transform = 'translateY(-1px)'; btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'; };
            btn.onmouseout = () => { btn.style.transform = 'translateY(0)'; btn.style.boxShadow = 'none'; };
            return btn;
        }

        const btnCollect = createBtn('➕ Extract Current Page', '#0a66c2');
        const btnExport = createBtn('📥 Export & Clear', '#057642');
        const btnClear = createBtn('🗑️ Clear Data', '#dc3545');

        contentContainer.appendChild(btnCollect);
        contentContainer.appendChild(btnExport);
        contentContainer.appendChild(btnClear);

        const divider = document.createElement('div');
        divider.style.height = '1px';
        divider.style.backgroundColor = '#eaeaea';
        divider.style.margin = '4px 0';
        contentContainer.appendChild(divider);

        const settingsTitle = document.createElement('div');
        settingsTitle.innerHTML = '⚙️ Filter Settings (Live)';
        settingsTitle.style.fontSize = '13px';
        settingsTitle.style.color = '#666';
        settingsTitle.style.fontWeight = 'bold';
        contentContainer.appendChild(settingsTitle);

        function createToggleSwitch(labelText, configKey) {
            const wrapper = document.createElement('label');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.justifyContent = 'space-between';
            wrapper.style.fontSize = '13px';
            wrapper.style.color = '#333';
            wrapper.style.cursor = 'pointer';

            const textSpan = document.createElement('span');
            textSpan.innerHTML = labelText;

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = CONFIG[configKey];
            cb.style.display = 'none';

            const track = document.createElement('div');
            track.style.width = '36px';
            track.style.height = '20px';
            track.style.backgroundColor = cb.checked ? '#057642' : '#dcdcdc';
            track.style.borderRadius = '20px';
            track.style.position = 'relative';
            track.style.transition = 'background-color 0.3s';
            track.style.flexShrink = '0';

            const thumb = document.createElement('div');
            thumb.style.width = '16px';
            thumb.style.height = '16px';
            thumb.style.backgroundColor = 'white';
            thumb.style.borderRadius = '50%';
            thumb.style.position = 'absolute';
            thumb.style.top = '2px';
            thumb.style.left = cb.checked ? '18px' : '2px';
            thumb.style.transition = 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            thumb.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

            track.appendChild(thumb);
            wrapper.appendChild(cb);
            wrapper.appendChild(textSpan);
            wrapper.appendChild(track);

            cb.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                CONFIG[configKey] = isChecked;
                saveSettings();
                runFilter();

                track.style.backgroundColor = isChecked ? '#057642' : '#dcdcdc';
                thumb.style.left = isChecked ? '18px' : '2px';
            });

            return wrapper;
        }

        contentContainer.appendChild(createToggleSwitch('🟢 Enable Keyword/German Filter', 'enableFilter'));
        contentContainer.appendChild(createToggleSwitch('👻 Hide Completely (Uncheck to dim)', 'hideCompletely'));

        document.body.appendChild(panel);

        // --- Core Fix Area: Extract only the first line of clean text ---
        btnCollect.addEventListener('click', () => {
            const jobCards = document.querySelectorAll('.job-card-container, .scaffold-layout__list-item');
            let newCount = 0;

            jobCards.forEach(card => {
                if (card.getAttribute('data-is-filtered') === 'true') return;

                const titleElement = card.querySelector('.artdeco-entity-lockup__title, .job-card-list__title');
                const companyElement = card.querySelector('.artdeco-entity-lockup__subtitle, .job-card-container__company-name');
                const locationElement = card.querySelector('.artdeco-entity-lockup__caption, .job-card-container__metadata-item');
                const linkElement = card.querySelector('a.job-card-list__title, a.job-card-container__link');

                // Truncate trailing hidden text/badges using split('\n')[0]
                const title = titleElement ? titleElement.innerText.split('\n')[0].trim().replace(/"/g, '""') : 'Unknown Title';
                const company = companyElement ? companyElement.innerText.split('\n')[0].trim().replace(/"/g, '""') : 'Unknown Company';
                const location = locationElement ? locationElement.innerText.split('\n')[0].trim().replace(/"/g, '""') : 'Unknown Location';
                const link = linkElement ? linkElement.href.split('?')[0] : 'No Link';

                if (title !== 'Unknown Title') {
                    if (!jobs.find(j => j.Link === link)) {
                        jobs.push({ Title: title, Company: company, Location: location, Link: link });
                        newCount++;
                    }
                }
            });

            sessionStorage.setItem('linkedin_collected_jobs', JSON.stringify(jobs));
            statusText.innerHTML = `Collected: <strong style="color:#0a66c2; font-size:18px;">${jobs.length}</strong>`;

            const originalText = btnCollect.innerHTML;
            btnCollect.innerHTML = `✅ Added ${newCount}`;
            btnCollect.style.backgroundColor = '#057642';
            setTimeout(() => {
                btnCollect.innerHTML = originalText;
                btnCollect.style.backgroundColor = '#0a66c2';
            }, 2000);
        });

        btnExport.addEventListener('click', () => {
            if (jobs.length === 0) { alert('No data collected currently!'); return; }
            let csvContent = "\uFEFFTitle,Company,Location,Link\n";
            jobs.forEach(row => { csvContent += `"${row.Title}","${row.Company}","${row.Location}","${row.Link}"\n`; });
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `LinkedIn_SelectedJobs_${jobs.length}_${new Date().getTime()}.csv`;
            link.click();

            jobs = [];
            sessionStorage.removeItem('linkedin_collected_jobs');
            statusText.innerHTML = `Collected: <strong style="color:#0a66c2; font-size:18px;">0</strong>`;

            const originalText = btnExport.innerHTML;
            btnExport.innerHTML = `✅ Exported & Cleared successfully`;
            setTimeout(() => {
                btnExport.innerHTML = originalText;
            }, 2000);
        });

        btnClear.addEventListener('click', () => {
            if(confirm(`Are you sure you want to clear ${jobs.length} items?`)) {
                jobs = [];
                sessionStorage.removeItem('linkedin_collected_jobs');
                statusText.innerHTML = `Collected: <strong style="color:#0a66c2; font-size:18px;">0</strong>`;
            }
        });
    };

    /**
     * ==========================================
     * Module 4: Initialization
     * ==========================================
     */
    const initAll = () => {
        const observer = new MutationObserver(runFilter);
        observer.observe(document.body, { childList: true, subtree: true });
        setInterval(runFilter, CONFIG.scanInterval);
        runFilter();
        setTimeout(initUI, 2000);
    };

    if (document.readyState === 'complete') initAll();
    else window.addEventListener('load', initAll);
})();
