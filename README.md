# 💼 LinkedIn Ultimate Job Hunter Assistant (Minimalist Workflow Edition)

An advanced, zero-dependency Tampermonkey userscript engineered to optimize the LinkedIn job search experience. Built specifically to handle LinkedIn's dynamic Single Page Application (SPA) architecture, this tool programmatically injects a customized filtering algorithm and a clean data extraction pipeline directly into your browser.

If you are dealing with high-volume job feeds cluttered with irrelevant roles (e.g., local language requirements, wrong seniority levels), this script provides an automated, client-side solution to sanitize your feed and export structured data.

---

## 🎯 Real-World Scenario: The "English-Only Junior Developer" Workflow

To understand the power of this script, consider this common engineering job search scenario:

**The Problem:** You are a Junior or Mid-level Software Engineer looking for English-speaking roles in Germany (e.g., Berlin or Munich). You search for "Frontend Developer" on LinkedIn. The native filters are inadequate—your feed is instantly polluted with:
1. Roles requiring fluent German (hidden deep in the text or indicated by localized tags like `(m/w/d)`).
2. "Senior", "Lead", or "Principal" roles that LinkedIn's algorithm pushes to the top.
3. Irrelevant IT Consulting or Student Internship gigs.

# The Execution & Result:

* **Automated Purge:** As you scroll, the `MutationObserver` instantly detects job cards containing `(m/w/d)` or `Senior` in the title node and injects `display: none;`. The UI remains clean, showing only English-speaking, appropriate-level roles.
* **Smart Exemption:** A job titled *"Frontend Developer (m/w/d) - English speaking"* appears. The script's regex catches the `m/w/d`, but the whitelist logic catches `english` and forces the job to render.
* **Bulk Extraction:** You scroll through 10 pages of pagination. On each page, you click **"➕ Extract Current Page"**. The script parses the DOM, sanitizes the text, drops duplicates, and pushes the data to `sessionStorage`.
* **Data Delivery:** You click **"📥 Export & Clear"**. The `Blob API` instantly generates a `Jobs_Export.csv` file containing 40 perfectly matched roles with their direct URLs, ready to be imported into your Notion or Excel tracking board.


### 🛠️ Technical Architecture & Under the Hood

This script leverages modern **Vanilla JavaScript** and native browser APIs to ensure high performance and zero external dependencies:

* **Dynamic DOM Monitoring (`MutationObserver`):** LinkedIn is heavily built on React and loads job cards dynamically as you scroll. The script uses a `MutationObserver` paired with a throttling `setInterval` to accurately detect and process new DOM nodes as they enter the viewport, without freezing the browser.

* **Complex Regex Pattern Matching:**
    * **Localization Tags:** Uses custom RegEx (`/[\(\[][^\)\]]*(m[\/\-]w|w[\/\-]m)[^\)\]]*[\)\]]/i`) to instantly identify German/European gender tags (like `(m/w/d)` or `[w/m/div]`).
    * **Character Sets:** Scans raw text nodes for localized characters (`/[äöüß]/i`) to aggressively filter out non-target languages.

* **String Sanitization Pipeline:** LinkedIn job cards often contain hidden `<span>` tags, visually hidden badges ("Actively recruiting", "Promoted"), and line breaks. The script bypasses this DOM clutter by specifically targeting core text elements and applying truncation pipelines (`split('\n')[0].trim()`) to guarantee pristine data extraction.

* **Client-Side CSV Generation (`Blob API`):** Data export is handled entirely in-browser using the `Blob API` (`type: 'text/csv;charset=utf-8;'`) and `URL.createObjectURL()`. It automatically formats JSON objects into valid CSV strings, preventing comma-delimitation breaks by wrapping data in quotes.

* **Persistent State Management:**
    * **`localStorage`:** Serializes and stores the user's custom UI coordinates (X/Y drag positions) and boolean toggle states.
    * **`sessionStorage`:** Acts as a temporary memory buffer for scraped jobs, preventing data loss across accidental page reloads while avoiding permanent disk clutter.


### ✨ Core Features

#### 1. Multi-Layered Algorithmic Filtering
* **Blacklist vs. Whitelist Priorities:** The algorithm runs an execution chain. A "Whitelist" keyword match (e.g., "English", "Software") immediately halts further checks and forces the job to render, bypassing even strict localized Regex checks.
* **Custom Exemption Logic:** Automatically ignores local language triggers if explicitly exempted terms (e.g., "f/m/x", "English") are present in the exact same string context.
* **CSS Override Engine:** Rather than destroying DOM nodes (which breaks LinkedIn's native React state), the script safely injects inline CSS (`display: none` or `filter: grayscale(100%); opacity: 0.3`) to hide or visually deprioritize irrelevant cards.

#### 2. Stateful & Draggable Injected UI
* **Custom Floating DOM Element:** Injects an isolated control panel directly into the `<body>`.
* **Physics/Drag Logic:** Implements native `mousedown`, `mousemove`, and `mouseup` event listeners calculating absolute positional offsets (`e.clientX - rect.left`) for smooth, real-time UI dragging.
* **Real-time DOM Updates:** Toggling settings on the panel instantly re-evaluates the active DOM array and applies new CSS rules without requiring a page refresh.

#### 3. Smart Extraction & Deduplication
* **Targeted Selectors:** Maps to LinkedIn's specific obfuscated class names (`.job-card-list__title`, `.artdeco-entity-lockup__subtitle`) to accurately parse Title, Company, Location, and raw `href` URLs stripped of tracking parameters.
* **O(N) Array Deduplication:** Cross-references extracted URLs against the current `sessionStorage` buffer in real-time, completely preventing duplicate entries when aggressively scanning multiple pages.


## 🚀 Installation & Setup

1.  **Prerequisites:** Install [Tampermonkey](https://www.tampermonkey.net/) (or a similar userscript manager) in your browser.
2.  **Install Script:** * Click on `linkedin-job-hunter.user.js` in this repository.
    * Click the **Raw** button.
    * Confirm the installation when the Tampermonkey prompt appears.
3.  **Execution:** Navigate to [LinkedIn Jobs](https://www.linkedin.com/jobs/). The script executes automatically (`@match https://www.linkedin.com/jobs/*`) upon DOM load.


## 📸 Screenshots
<img width="309" height="387" alt="image" src="https://github.com/user-attachments/assets/2b374060-dc4b-4479-a134-5e17357ce62c" />

<img width="822" height="249" alt="image" src="https://github.com/user-attachments/assets/ed371369-7aae-46c6-9745-81290c5592fc" />


