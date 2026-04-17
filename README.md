# 🚀 领英求职助手 | LinkedIn Job Filter

**多语言双引擎纯净版 | AI 搜索完美适配 | 极简防呆设计** **Trilingual Dual-Engine | AI Search Compatible | Minimalist & Idiot-proof Design**

---

## 💡 快速排错 | Quick Troubleshooting

> **中文：** 如果脚本已开启但页面没有出现面板，或者修改设置后没有反应，**请尝试强制刷新页面 (F5) 几次**。由于领英是单页应用 (SPA)，有时底层 DOM 加载顺序会导致脚本加载滞后。  
> **English:** If the script is enabled but the panel doesn't appear, or settings won't apply, **please try refreshing the page (F5) a few times**. Since LinkedIn is a Single Page Application (SPA), the script might occasionally fall behind the DOM loading sequence.

---

## ✨ 核心功能 | Key Features

* **🤖 完美适配新版 AI 界面 | Full AI Search Compatibility**
    * **CN:** 独创“语义按钮抓取”架构，彻底解决了领英新版 AI 搜索界面中取消超链接、`display: contents` 幽灵盒子等导致的过滤失效难题。
    * **EN:** Utilizes "Semantic Button Tracking" architecture to overcome challenges in LinkedIn's new AI Search UI, such as hidden hyperlinks and `display: contents` ghost boxes.
* **🏷️ 防呆标签系统 | Idiot-proof Tag System**
    * **CN:** 告别代码修改。直接在面板输入关键词（如 `Senior`），按回车或逗号自动生成标签。即时生效，设置自动本地保存。
    * **EN:** No coding required. Type keywords (e.g., `Intern`) and hit Enter/Comma to generate tags. Changes apply instantly and save locally.
* **🌍 双引擎语言过滤 | Dual-Engine Language Filter**
    * **CN:** 独立开关识别德语（`m/w/d`、`äöüß`）或英语（`f/m/x`、`English`）特征，适合在欧洲/国际化环境求职的用户。
    * **EN:** Independent toggles to filter German or English jobs by detecting language traits like `m/w/d` or `English`.
* **👻 彻底隐藏 vs 视觉变灰 | Hide vs. Grayscale**
    * **CN:** 可选将垃圾岗位彻底删除（节省空间）或变为半透明灰色（降低 50% 透明度并附加黑白滤镜，方便偶尔检漏）。
    * **EN:** Choose between removing jobs completely or making them 50% transparent grayscale for a less intrusive view.
* **🌐 三语界面切换 | Trilingual UI**
    * **CN:** 原生支持中文、英语、德语界面，并支持全屏自由拖拽控制面板。
    * **EN:** Supports Chinese, English, and German UI; includes a draggable control panel.

---

## 🛠️ 安装指南 | Installation Guide

1.  **环境准备 | Environment:** * **CN:** 确保浏览器已安装 **[Tampermonkey (油猴)](https://www.tampermonkey.net/)** 扩展。  
    * **EN:** Ensure you have the **[Tampermonkey](https://www.tampermonkey.net/)** extension installed in your browser.
2.  **添加脚本 | Add Script:** * **CN:** 点击油猴图标 -> “添加新脚本”，将本项目中的代码全部粘贴进去并保存 (`Ctrl+S`)。  
    * **EN:** Click Tampermonkey icon -> "Create a new script", paste the code and save (`Ctrl+S`).
3.  **运行脚本 | Run:** * **CN:** 打开或刷新 [LinkedIn Jobs](https://www.linkedin.com/jobs/) 页面，面板会自动出现在右下角。  
    * **EN:** Open or refresh [LinkedIn Jobs](https://www.linkedin.com/jobs/), the panel will appear at the bottom-right automatically.

---

## 📖 使用说明 | How to Use

### 1. 设置黑名单 | Setting Blacklist
* **CN:** 点击 **“⚙️ 编辑自定义黑名单”** 展开。输入关键词后按下回车键即可生成标签。
* **EN:** Click **"⚙️ Edit Custom Blacklist"** to expand. Type a keyword and hit Enter to generate a tag.

### 2. 模式切换 | Toggle Modes
* **🚫 Filter German/English:** * **CN:** 针对对应语言特征进行智能拦截。
    * **EN:** Smart interception based on specific language traits.
* **👻 Hide Completely:** * **CN:** 开启则完全隐藏；关闭则变为 50% 灰度半透明。
    * **EN:** ON to hide completely; OFF to show as 50% transparent grayscale.

---

## ⚠️ 注意事项 | Important Notes

1.  **JD Filter:**
    * **CN:** 为保护账号安全，本脚本仅过滤标题，不执行后台 JD 全文爬取（防止被领英风控封号）。
    * **EN:** Filters titles only. Does not fetch full JDs to avoid triggering LinkedIn's anti-scraping protections.
2.  **UI Adaption:**
    * **CN:** 领英经常改版。如遇失效，请尝试刷新页面或提交 Issue。
    * **EN:** LinkedIn updates its UI frequently. Try refreshing or submit an Issue if it breaks.
3.  **Privacy:**
    * **CN:** 100% 本地运行，数据仅存储在本地浏览器，不上传任何个人信息。
    * **EN:** 100% local execution. Data is stored locally; no personal info is ever uploaded.

---

## 🌟 支持项目 | Support

* **CN:** 如果这个脚本帮到了你，请给我的 GitHub 项目点个 **Star** 呀！你的支持是我持续更新、对抗领英改版的最大动力。
* **EN:** If this script helps you, please consider giving the project a **Star**! Your support keeps me motivated to maintain the script and fight against LinkedIn's constant UI changes.

---

## 👨‍💻 作者 | Authors
* **Qimin Zhang**
* *Special thanks to the open-source community for inspiration on anti-obfuscation.*
