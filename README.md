# 🔖 BookMaven - 书签专家

> **让AI读懂你的网络人格，一键生成专属网络身份标签！**

![BookMaven](https://img.shields.io/badge/BookMaven-书签专家-4F46E5?style=for-the-badge&logo=bookmark&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

## 🌐 Language / 语言

[🇨🇳 中文](README.md) | [🇺🇸 English](README_EN.md)

## 📸 Preview / 效果预览

![BookMaven Preview](example.png)

## 🎯 项目简介

**BookMaven（书签专家）** 是一款基于AI的书签分析工具，能够深度解析你的浏览习惯，生成专属的网络人格画像。只需上传浏览器书签文件，AI就会毒舌点评你的网络生活，并生成可分享的精美卡片！

### ✨ 核心功能

| 功能模块 | 描述 | 特色 |
|---------|------|------|
| 🧠 **AI智能分析** | 深度解析书签内容和分类分布 | 使用阿里云DeepSeek-V3模型 |
| 🏷️ **毒舌点评** | 生成幽默犀利的网络人格评价 | 毫不留情的AI毒舌评论员 |
| 📊 **数据可视化** | 多维度书签统计分析 | 分类、域名、时间分布等 |
| 🎨 **专属卡片** | 自动生成个性化分享图片 | 高清PNG格式，一键下载 |
| 🔍 **重复检测** | 智能识别重复书签 | 帮助清理冗余内容 |

## 🎪 项目亮点

### 🎭 AI毒舌评论员
- **极度犀利**：AI会用最刻薄的语言点评你的网络习惯
- **幽默讽刺**：让你在被吐槽的同时忍俊不禁
- **个性外号**：根据书签特征生成独特的网络身份标签

### 📈 全面数据分析
```
📚 书签总数统计    🗂️ 智能分类整理    🌐 常用网站排行
📅 时间分布图表    🔄 重复内容检测    📊 可视化报表
```

### 🎨 精美卡片生成
- 🖼️ **高清图片**：3倍分辨率，适合社交分享
- 🎯 **个性设计**：渐变背景+专属标签
- 💾 **一键保存**：自动下载到本地
- 📱 **适配完美**：支持各种社交平台尺寸

## 🚀 快速开始

### 环境要求
- Node.js 18.0+
- npm/yarn/pnpm

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/highertq/bookmaven.git
cd bookmaven
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

3. **配置API密钥**
在项目根目录创建 `.env.local` 文件：
```env
DASHSCOPE_API_KEY=your_dashscope_api_key_here
```

4. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

5. **访问应用**
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 🎮 使用方法

### 1️⃣ 导出书签
支持主流浏览器书签导出：
- **Chrome**: 书签管理器 → 导出书签
- **Firefox**: 书签 → 管理书签 → 导出书签为HTML  
- **Edge**: 收藏 → 管理收藏 → 导出收藏
- **Safari**: 文件 → 导出 → 书签

### 2️⃣ 上传分析
- 拖拽HTML书签文件到上传区域
- 或点击选择文件上传
- 系统自动解析书签结构

### 3️⃣ 获得点评
- AI深度分析你的浏览习惯
- 生成犀利幽默的网络人格点评
- 获得专属网络身份外号

### 4️⃣ 生成卡片
- 一键生成精美的个人网络画像卡片
- 高清PNG格式，适合分享收藏
- 展示你独特的网络人格标签

## 🏗️ 技术架构

### 前端技术栈
```
Next.js 15.2.4      - React全栈框架
TypeScript 5.0      - 类型安全开发
TailwindCSS 4.0     - 原子化CSS框架
React Hooks         - 状态管理
React Dropzone      - 文件拖拽上传
```

### AI集成
```
阿里云百炼平台      - AI模型服务
DeepSeek-V3        - 大语言模型
OpenAI SDK         - API调用封装
```

### 图片生成
```
html2canvas        - HTML转图片
dom-to-image       - 备用图片生成
Canvas API         - 图片处理
```

## 📁 项目结构

```
bookmaven/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/
│   │   │   └── generate-comment/  # AI评论生成API
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx           # 首页
│   │   └── globals.css        # 全局样式
│   ├── components/            # React组件
│   │   ├── upload-bookmark.tsx      # 书签上传
│   │   ├── bookmark-analytics.tsx   # 数据分析
│   │   ├── bookmark-comment.tsx     # AI点评
│   │   ├── bookmark-grid.tsx        # 书签网格
│   │   ├── export-help-dialog.tsx   # 导出帮助
│   │   └── client-wrapper.tsx       # 客户端包装
│   └── lib/
│       └── bookmark-parser.ts       # 书签解析器
├── public/                    # 静态资源
├── package.json              # 项目配置
└── README.md                # 项目文档
```

## 🎨 界面预览

### 主界面
- 🎯 简洁优雅的首页设计
- 📤 直观的拖拽上传体验
- 💡 详细的使用指导

### 分析界面  
- 📊 多维度数据可视化
- 🏷️ 智能分类展示
- 🔍 重复书签检测

### 点评界面
- 🧠 AI智能分析结果
- 💬 犀利幽默的点评内容
- 🎨 精美卡片生成功能

## 🌟 特色功能详解

### 🤖 AI毒舌点评系统
BookMaven的核心亮点是其独特的AI毒舌点评功能：

- **深度分析**：AI会分析你的书签分类、网站类型、收藏时间等多个维度
- **性格洞察**：根据浏览偏好推断你的性格特征和生活习惯
- **犀利点评**：用幽默讽刺的语言指出你的网络生活"痛点"
- **专属外号**：为你量身定制独特的网络身份标签

### 📊 智能数据分析
- **分类统计**：自动识别书签分类，生成分布图表
- **域名分析**：统计最常访问的网站，了解你的网络偏好  
- **时间轴**：展示书签收藏的时间分布，回顾你的网络历程
- **重复检测**：智能识别重复书签，帮助清理冗余内容

### 🎨 个性卡片生成
- **专业设计**：精心设计的卡片模板，展现你的网络人格
- **高清输出**：3倍分辨率渲染，确保分享质量
- **一键保存**：自动下载PNG格式图片到本地
- **社交优化**：适配各大社交平台的分享尺寸

## 🔧 开发指南

### 本地开发
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器  
npm start

# 代码检查
npm run lint
```

### 环境变量配置
创建 `.env.local` 文件：
```env
# 阿里云百炼API密钥
DASHSCOPE_API_KEY=your_api_key_here

# Google Analytics（可选）
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### API密钥获取
1. 访问 [阿里云百炼平台](https://dashscope.aliyun.com/)
2. 注册并创建应用
3. 获取API密钥
4. 配置到环境变量中

## 🚀 部署指南

### Vercel部署（推荐）
1. Fork本项目到你的GitHub
2. 在Vercel中导入项目
3. 配置环境变量 `DASHSCOPE_API_KEY`
4. 点击部署

### 其他平台
- **Netlify**: 支持静态导出模式
- **Railway**: 支持全栈部署
- **Docker**: 提供Dockerfile配置

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 贡献方式
- 🐛 **Bug报告**：发现问题请提交Issue
- 💡 **功能建议**：有好想法欢迎讨论
- 🔧 **代码贡献**：提交Pull Request
- 📝 **文档完善**：改进项目文档

### 开发流程
1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📄 开源协议

本项目基于 MIT 协议开源，详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - 强大的React框架
- [TailwindCSS](https://tailwindcss.com/) - 优秀的CSS框架  
- [阿里云百炼](https://dashscope.aliyun.com/) - AI模型服务
- [Heroicons](https://heroicons.com/) - 精美的图标库
- [html2canvas](https://html2canvas.hertzen.com/) - HTML转图片工具

## 📞 联系我们

- 📧 **邮箱**: yourmantq@outlook.com
- 🌐 **网站**: https://bookmarkmaven.space

---

<div align="center">
  <p>
    <strong>🌟 如果这个项目对你有帮助，请给我们一个Star！ 🌟</strong>
  </p>
  <p>
    Made with ❤️ by BookMaven Team
  </p>
</div>