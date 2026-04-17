// ==UserScript==
// @name         领英求职助手 (多语言双引擎+防呆标签折叠版)
// @namespace    http://tampermonkey.net/
// @version      12.8
// @description  纯净版：修复新版 AI 界面下 `display: contents` 导致的变灰/透明度失效问题。
// @author       Qimin Zhang
// @match        https://www.linkedin.com/jobs/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linkedin.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /**
     * ==========================================
     * 模块一：多语言字典 (i18n)
     * ==========================================
     */
    const i18n = {
        zh: {
            dragHandle: '☷ 拖动控制面板',
            languageToggle: '🌐 界面语言',
            editBlacklist: '⚙️ 编辑自定义黑名单',
            customKeywordsTitle: '📝 黑名单标签 (回车添加):',
            customKeywordsPlaceholder: '输入后按回车...',
            filterGerman: '🚫 过滤德语岗位',
            filterEnglish: '🚫 过滤英语岗位',
            hideCompletely: '👻 彻底隐藏 (否则变灰)'
        },
        en: {
            dragHandle: '☷ Drag Panel',
            languageToggle: '🌐 Language',
            editBlacklist: '⚙️ Edit Custom Blacklist',
            customKeywordsTitle: '📝 Blacklist Tags (Press Enter):',
            customKeywordsPlaceholder: 'Type & hit enter...',
            filterGerman: '🚫 Filter German Jobs',
            filterEnglish: '🚫 Filter English Jobs',
            hideCompletely: '👻 Hide Completely (else gray)'
        },
        de: {
            dragHandle: '☷ Panel ziehen',
            languageToggle: '🌐 Sprache',
            editBlacklist: '⚙️ Eigene Blacklist bearbeiten',
            customKeywordsTitle: '📝 Blacklist Tags (Enter drücken):',
            customKeywordsPlaceholder: 'Tippen & Enter...',
            filterGerman: '🚫 Deutsche Jobs filtern',
            filterEnglish: '🚫 Englische Jobs filtern',
            hideCompletely: '👻 Komplett ausblenden'
        }
    };

    /**
     * ==========================================
     * 模块二：全局状态与配置区
     * ==========================================
     */
    let savedSettings = JSON.parse(localStorage.getItem('linkedin_filter_settings') || '{}');

    const CONFIG = {
        language: savedSettings.language || 'en',
        filterGerman: savedSettings.filterGerman !== undefined ? savedSettings.filterGerman : false,
        filterEnglish: savedSettings.filterEnglish !== undefined ? savedSettings.filterEnglish : false,
        hideCompletely: savedSettings.hideCompletely !== undefined ? savedSettings.hideCompletely : true,
        customBlacklist: savedSettings.customBlacklist !== undefined ? savedSettings.customBlacklist : ['senior', 'student', 'bangkok', 'Consultant'],

        germanKeywords: [],
        whitelistKeywords: [],
        opacityValue: '0.3',
        scanInterval: 800
    };

    const saveSettings = () => {
        localStorage.setItem('linkedin_filter_settings', JSON.stringify({
            language: CONFIG.language,
            filterGerman: CONFIG.filterGerman,
            filterEnglish: CONFIG.filterEnglish,
            hideCompletely: CONFIG.hideCompletely,
            customBlacklist: CONFIG.customBlacklist,
            panelLeft: savedSettings.panelLeft,
            panelTop: savedSettings.panelTop
        }));
    };

    /**
     * ==========================================
     * 模块三：获取与过滤逻辑 (双重架构兼容)
     * ==========================================
     */
    const getUniqueJobCards = () => {
        const cards = new Map();

        // --- 方案 A：兼容最新 AI Semantic Search (无超链接变异版) ---
        const semanticButtons = document.querySelectorAll('div[role="button"][componentkey]');
        semanticButtons.forEach(card => {
            const dismissBtn = card.querySelector('button[aria-label^="Dismiss "][aria-label$=" job"]');
            if (dismissBtn) {
                const jobId = card.getAttribute('componentkey');
                if (jobId && !cards.has(jobId)) {
                    card.setAttribute('data-gemini-job-id', jobId);

                    // 绝杀：直接从按钮提示词里把最纯净的标题抠出来
                    const titleFromBtn = dismissBtn.getAttribute('aria-label').replace(/^Dismiss /i, '').replace(/ job$/i, '').trim();
                    card.setAttribute('data-gemini-title', titleFromBtn);

                    // 顺藤摸瓜：向上找到包含 <hr> 的最外层包装盒，用于彻底隐藏时的排版修复
                    let rootTarget = card;
                    try {
                        const p3 = card.parentElement.parentElement.parentElement;
                        if (p3 && p3.getAttribute('data-display-contents') === 'true') {
                            rootTarget = p3;
                        }
                    } catch(e) {}
                    card.geminiRootTarget = rootTarget;

                    cards.set(jobId, card);
                }
            }
        });

        // --- 方案 B：兼容经典版列表 (逆向 URL 追溯法兜底) ---
        const jobLinks = document.querySelectorAll('a[href*="/jobs/view/"]');
        jobLinks.forEach(link => {
            const match = link.getAttribute('href').match(/\/view\/(\d+)/);
            if (!match) return;
            const jobId = match[1];

            if (cards.has(jobId)) return;

            const card = link.closest('li') || link.closest('.job-card-container') || link.closest('div[data-job-id]');
            if (!card) return;

            card.setAttribute('data-gemini-job-id', jobId);
            cards.set(jobId, card);
        });

        return Array.from(cards.values());
    };

    const runFilter = () => {
        const jobCards = getUniqueJobCards();
        jobCards.forEach(card => {

            // targetNode 是最外层用于物理排版的盒子，card 是负责视觉呈现的实体盒子
            const targetNode = card.geminiRootTarget || card;

            const applyKeep = () => {
                targetNode.style.display = '';
                // 恢复排版分割线
                if (targetNode.previousElementSibling && targetNode.previousElementSibling.tagName === 'HR') {
                    targetNode.previousElementSibling.style.display = '';
                }
                // 恢复视觉卡片的色彩和透明度
                card.style.opacity = '1';
                card.style.filter = 'none';
            };

            // 获取标题
            let titleText = card.getAttribute('data-gemini-title');
            if (!titleText) {
                const titleLinks = card.querySelectorAll('a[href*="/jobs/view/"]');
                titleLinks.forEach(a => {
                    const text = a.textContent.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
                    if (!titleText || text.length > titleText.length) titleText = text;
                });

                if (!titleText) {
                    const fallbackEl = card.querySelector('h3, strong, [aria-label]');
                    if (fallbackEl) {
                        titleText = (fallbackEl.textContent || fallbackEl.getAttribute('aria-label') || '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
                    }
                }
            }

            if (!titleText) return;
            titleText = titleText.toLowerCase();

            const applyFilter = () => {
                if (CONFIG.hideCompletely) {
                    // 彻底隐藏：隐藏最外层排版盒子，清除空间
                    targetNode.style.display = 'none';
                    if (targetNode.previousElementSibling && targetNode.previousElementSibling.tagName === 'HR') {
                        targetNode.previousElementSibling.style.display = 'none';
                    }
                    card.style.opacity = '1';
                    card.style.filter = 'none';
                } else {
                    // 变灰保留：保持排版盒子展示，修改内层实体卡片的视觉属性
                    targetNode.style.display = '';
                    if (targetNode.previousElementSibling && targetNode.previousElementSibling.tagName === 'HR') {
                        targetNode.previousElementSibling.style.display = '';
                    }
                    card.style.opacity = CONFIG.opacityValue;
                    card.style.filter = 'grayscale(100%)';
                }
            };

            // 1. 黑名单
            const isBlacklisted = CONFIG.customBlacklist.some(key => titleText.includes(key.toLowerCase()));
            if (isBlacklisted) { applyFilter(); return; }

            // 2. 白名单
            const isWhitelisted = CONFIG.whitelistKeywords.some(key => titleText.includes(key.toLowerCase()));
            if (isWhitelisted) { applyKeep(); return; }

            // 3. 语言引擎特征识别
            const isGermanKeyword = CONFIG.germanKeywords.some(key => titleText.includes(key));
            const isGermanGenderTag = /[\(\[][^\)\]]*(m[\/\-]w|w[\/\-]m)[^\)\]]*[\)\]]/i.test(titleText);
            const hasGermanChars = /[äöüß]/i.test(titleText);

            const isGermanJob = isGermanKeyword || isGermanGenderTag || hasGermanChars;
            const isExplicitlyEnglish = titleText.includes('english') || titleText.includes('f/m/x') || titleText.includes('m/f/d');

            let shouldFilter = false;
            if (CONFIG.filterGerman && isGermanJob && !isExplicitlyEnglish) shouldFilter = true;
            if (CONFIG.filterEnglish && isExplicitlyEnglish) shouldFilter = true;

            if (shouldFilter) applyFilter(); else applyKeep();
        });
    };

    /**
     * ==========================================
     * 模块四：UI 面板 (折叠标签版)
     * ==========================================
     */
    const initUI = () => {
        const panel = document.createElement('div');
        panel.style.position = 'fixed'; panel.style.zIndex = '9999'; panel.style.backgroundColor = 'white';
        panel.style.border = '1px solid #ddd'; panel.style.borderRadius = '10px'; panel.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
        panel.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
        panel.style.minWidth = '240px';
        panel.style.maxWidth = '280px';

        if (savedSettings.panelLeft && savedSettings.panelTop) {
            panel.style.left = savedSettings.panelLeft;
            panel.style.top = savedSettings.panelTop;
        } else {
            panel.style.bottom = '20px';
            panel.style.right = '20px';
        }

        const dragHandle = document.createElement('div');
        dragHandle.style.cursor = 'grab'; dragHandle.style.backgroundColor = '#f8f9fa';
        dragHandle.style.padding = '10px'; dragHandle.style.textAlign = 'center'; dragHandle.style.fontSize = '12px';
        dragHandle.style.color = '#555'; dragHandle.style.fontWeight = '600'; dragHandle.style.borderBottom = '1px solid #eaeaea';
        dragHandle.style.borderTopLeftRadius = '10px'; dragHandle.style.borderTopRightRadius = '10px'; dragHandle.style.userSelect = 'none';
        panel.appendChild(dragHandle);

        let isDragging = false, offsetX, offsetY;
        dragHandle.addEventListener('mousedown', (e) => {
            isDragging = true; dragHandle.style.cursor = 'grabbing';
            const rect = panel.getBoundingClientRect(); offsetX = e.clientX - rect.left; offsetY = e.clientY - rect.top;
            panel.style.bottom = 'auto'; panel.style.right = 'auto';
            document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp);
        });
        function onMouseMove(e) { if (!isDragging) return; panel.style.left = `${e.clientX - offsetX}px`; panel.style.top = `${e.clientY - offsetY}px`; }
        function onMouseUp() {
            if (!isDragging) return; isDragging = false; dragHandle.style.cursor = 'grab';
            document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp);
            savedSettings.panelLeft = panel.style.left; savedSettings.panelTop = panel.style.top; saveSettings();
        }

        const contentContainer = document.createElement('div');
        contentContainer.style.padding = '15px'; contentContainer.style.display = 'flex'; contentContainer.style.flexDirection = 'column'; contentContainer.style.gap = '12px';
        panel.appendChild(contentContainer);

        const langRow = document.createElement('div');
        langRow.style.display = 'flex'; langRow.style.justifyContent = 'space-between'; langRow.style.alignItems = 'center';
        langRow.style.fontSize = '13px'; langRow.style.color = '#333'; langRow.style.borderBottom = '1px dashed #eee'; langRow.style.paddingBottom = '10px';
        const langLabel = document.createElement('span'); langLabel.style.whiteSpace = 'nowrap'; langLabel.style.flexShrink = '0';
        const langSelect = document.createElement('select');
        langSelect.style.cssText = `border: 1px solid #ccc !important; border-radius: 6px !important; padding: 4px 8px !important; outline: none !important; box-shadow: none !important; background-color: white !important; color: #333 !important; font-size: 12px !important; cursor: pointer !important; margin-left: 10px !important; height: auto !important; line-height: normal !important; appearance: auto !important;`;
        const optionsData = [{ value: 'zh', text: '🇨🇳 中文' }, { value: 'en', text: '🇬🇧 English' }, { value: 'de', text: '🇩🇪 Deutsch' }];
        optionsData.forEach(opt => { const optionNode = document.createElement('option'); optionNode.value = opt.value; optionNode.textContent = opt.text; langSelect.appendChild(optionNode); });
        langSelect.value = CONFIG.language;
        langRow.appendChild(langLabel); langRow.appendChild(langSelect);
        contentContainer.appendChild(langRow);

        const toggleBlacklistBtn = document.createElement('div');
        toggleBlacklistBtn.style.cssText = `
            font-size: 12px; color: #0a66c2; font-weight: bold; text-align: center;
            cursor: pointer; padding: 4px 0; border-bottom: 1px dashed #eee; user-select: none;
            transition: color 0.2s;
        `;
        toggleBlacklistBtn.onmouseover = () => toggleBlacklistBtn.style.color = '#004182';
        toggleBlacklistBtn.onmouseout = () => toggleBlacklistBtn.style.color = '#0a66c2';

        let isBlacklistExpanded = false;

        const keywordRow = document.createElement('div');
        keywordRow.style.display = 'none';
        keywordRow.style.flexDirection = 'column'; keywordRow.style.gap = '6px';
        keywordRow.style.borderBottom = '1px dashed #eee'; keywordRow.style.paddingBottom = '10px';

        const keywordLabel = document.createElement('span');
        keywordLabel.style.fontSize = '12px'; keywordLabel.style.color = '#555'; keywordLabel.style.fontWeight = 'bold';

        const tagsContainer = document.createElement('div');
        tagsContainer.style.cssText = `
            display: flex; flex-wrap: wrap; align-items: center; gap: 4px;
            border: 1px solid #ccc; border-radius: 6px; padding: 4px;
            background-color: #fafafa; min-height: 32px; cursor: text;
            transition: border-color 0.2s; box-sizing: border-box;
        `;

        let keywordInput;

        const renderTags = () => {
            tagsContainer.innerHTML = '';
            CONFIG.customBlacklist.forEach((keyword, index) => {
                const tagEl = document.createElement('div');
                tagEl.style.cssText = `
                    background: #e8f5e9; color: #057642; border: 1px solid #c8e6c9;
                    border-radius: 4px; padding: 2px 6px; display: flex; align-items: center;
                    font-size: 11px; white-space: nowrap; user-select: none;
                `;
                const textSpan = document.createElement('span'); textSpan.textContent = keyword;
                const closeBtn = document.createElement('span'); closeBtn.innerHTML = '&times;';
                closeBtn.style.cssText = `
                    margin-left: 4px; font-weight: bold; cursor: pointer;
                    font-size: 14px; line-height: 1; border-radius: 50%; width: 14px; height: 14px;
                    display: inline-flex; align-items: center; justify-content: center;
                `;
                closeBtn.onmouseover = () => closeBtn.style.backgroundColor = '#c8e6c9';
                closeBtn.onmouseout = () => closeBtn.style.backgroundColor = 'transparent';
                closeBtn.onclick = (e) => { e.stopPropagation(); CONFIG.customBlacklist.splice(index, 1); saveSettings(); runFilter(); renderTags(); };

                tagEl.appendChild(textSpan); tagEl.appendChild(closeBtn); tagsContainer.appendChild(tagEl);
            });

            keywordInput = document.createElement('input');
            keywordInput.type = 'text';
            keywordInput.placeholder = CONFIG.customBlacklist.length === 0 ? i18n[CONFIG.language].customKeywordsPlaceholder : '';
            keywordInput.style.cssText = `
                border: none !important; outline: none !important; background: transparent !important;
                flex-grow: 1 !important; min-width: 80px !important; font-size: 12px !important;
                padding: 2px 4px !important; color: #333 !important; box-shadow: none !important;
            `;

            keywordInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const val = keywordInput.value.trim().replace(/,/g, '');
                    if (val && !CONFIG.customBlacklist.includes(val)) {
                        CONFIG.customBlacklist.push(val);
                        saveSettings(); runFilter(); renderTags();
                        tagsContainer.style.borderColor = '#057642'; setTimeout(() => tagsContainer.style.borderColor = '#ccc', 500);
                    } else { keywordInput.value = ''; }
                } else if (e.key === 'Backspace' && keywordInput.value === '') {
                    if (CONFIG.customBlacklist.length > 0) { CONFIG.customBlacklist.pop(); saveSettings(); runFilter(); renderTags(); }
                }
            });

            tagsContainer.appendChild(keywordInput);
            tagsContainer.onclick = () => keywordInput.focus();
        };

        renderTags();
        keywordRow.appendChild(keywordLabel);
        keywordRow.appendChild(tagsContainer);

        const updateToggleBtnText = () => {
            const t = i18n[CONFIG.language];
            toggleBlacklistBtn.innerHTML = t.editBlacklist + (isBlacklistExpanded ? ' ⏶' : ' ⏷');
        };

        toggleBlacklistBtn.addEventListener('click', () => {
            isBlacklistExpanded = !isBlacklistExpanded;
            keywordRow.style.display = isBlacklistExpanded ? 'flex' : 'none';
            toggleBlacklistBtn.style.borderBottom = isBlacklistExpanded ? 'none' : '1px dashed #eee';
            updateToggleBtnText();
        });

        contentContainer.appendChild(toggleBlacklistBtn);
        contentContainer.appendChild(keywordRow);

        function createToggleSwitch(initialChecked, onChangeCallback) {
            const wrapper = document.createElement('label'); wrapper.style.display = 'flex'; wrapper.style.alignItems = 'center';
            wrapper.style.justifyContent = 'space-between'; wrapper.style.fontSize = '13px'; wrapper.style.color = '#333'; wrapper.style.cursor = 'pointer';
            const textSpan = document.createElement('span'); textSpan.style.whiteSpace = 'nowrap';
            const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = initialChecked; cb.style.display = 'none';
            const track = document.createElement('div'); track.style.width = '36px'; track.style.height = '20px'; track.style.backgroundColor = cb.checked ? '#057642' : '#dcdcdc'; track.style.borderRadius = '20px'; track.style.position = 'relative'; track.style.transition = 'background-color 0.3s'; track.style.flexShrink = '0';
            const thumb = document.createElement('div'); thumb.style.width = '16px'; thumb.style.height = '16px'; thumb.style.backgroundColor = 'white'; thumb.style.borderRadius = '50%'; thumb.style.position = 'absolute'; thumb.style.top = '2px'; thumb.style.left = cb.checked ? '18px' : '2px'; thumb.style.transition = 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; thumb.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            track.appendChild(thumb); wrapper.appendChild(cb); wrapper.appendChild(textSpan); wrapper.appendChild(track);
            cb.addEventListener('change', (e) => {
                const state = e.target.checked; track.style.backgroundColor = state ? '#057642' : '#dcdcdc'; thumb.style.left = state ? '18px' : '2px';
                if(onChangeCallback) onChangeCallback(state);
            });
            return { wrapper, textSpan };
        }

        const filterGermanToggle = createToggleSwitch(CONFIG.filterGerman, (checked) => { CONFIG.filterGerman = checked; saveSettings(); runFilter(); });
        const filterEnglishToggle = createToggleSwitch(CONFIG.filterEnglish, (checked) => { CONFIG.filterEnglish = checked; saveSettings(); runFilter(); });
        const hideToggle = createToggleSwitch(CONFIG.hideCompletely, (checked) => { CONFIG.hideCompletely = checked; saveSettings(); runFilter(); });

        contentContainer.appendChild(filterGermanToggle.wrapper);
        contentContainer.appendChild(filterEnglishToggle.wrapper);
        contentContainer.appendChild(hideToggle.wrapper);
        document.body.appendChild(panel);

        const updateUIText = () => {
            const t = i18n[CONFIG.language];
            dragHandle.innerHTML = t.dragHandle;
            langLabel.innerHTML = t.languageToggle;
            updateToggleBtnText();
            keywordLabel.textContent = t.customKeywordsTitle;
            if(keywordInput) keywordInput.placeholder = CONFIG.customBlacklist.length === 0 ? t.customKeywordsPlaceholder : '';
            filterGermanToggle.textSpan.innerHTML = t.filterGerman;
            filterEnglishToggle.textSpan.innerHTML = t.filterEnglish;
            hideToggle.textSpan.innerHTML = t.hideCompletely;
        };

        langSelect.addEventListener('change', (e) => {
            CONFIG.language = e.target.value;
            saveSettings();
            updateUIText();
        });

        updateUIText();
    };

    const initAll = () => {
        const observer = new MutationObserver(runFilter);
        observer.observe(document.body, { childList: true, subtree: true });
        setInterval(runFilter, CONFIG.scanInterval);
        runFilter();
        setTimeout(initUI, 1000);
    };

    if (document.readyState === 'complete') initAll(); else window.addEventListener('load', initAll);
})();
