# LinkedIn Germany English Job Filter

## 📝 Overview
Finding English-speaking roles in Germany on LinkedIn can be overwhelming due to the high volume of German-language postings. As a **Data Analyst**, I developed this automation tool to improve search efficiency by visually de-prioritizing non-English roles.

## 🤖 Collaborative Development
It showcases the synergy between domain expertise in the German job market and AI-assisted software development.

## 🛠️ Data-Driven Logic
The script uses a multi-layered detection approach:
1. **Keyword Analysis**: Scans for 20+ German business terms (e.g., *Kennzahlen, Finanz, Prüfung*).
2. **Pattern Matching**: Advanced Regex to catch gender markers like `(m/w/d)` .
3. **Linguistic Heuristics**: Detects German-specific characters (ä, ö, ü, ß).
4. **Active UI Monitoring**: Uses `MutationObserver` to handle LinkedIn's dynamic, infinite-scroll interface.

## 🚀 How to Use
1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Click the `linkedin-job-filter.user.js` file in this repo and copy the code.
3. Create a new script in your Tampermonkey dashboard and paste the code.
4. Refresh LinkedIn Jobs. German roles will now appear at 50% transparency.

## 📸 Visual Demo

Below is a demonstration of the script in action. Postings identified as German-language roles are automatically dimmed to **50% transparency**, allowing English roles to remain visually prominent.
<img width="1875" height="1257" alt="image" src="https://github.com/user-attachments/assets/e025861b-8acb-46b7-8c97-4bd8642171d8" />

## ⚖️ License
MIT License
