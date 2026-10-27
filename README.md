1. Project Architecture & SetupTech Stack: Built as a modern TypeScript web application using Vite for bundling and Bun for package management.Backend (server.ts): Serves as the central data hub connecting broker APIs (such as 5Paisa) and asset universes (like NSE and MCX) to the frontend.Automation: Includes automated GitHub Actions CI/CD workflows for continuous linting, type-checking, and building.2. The VCP Contraction AlgorithmTrend Template Prerequisite: Scans to ensure a stock is in a structural Stage 2 uptrend (Price > 50 EMA > 150 SMA > 200 SMA with rising slopes) before running pattern math.Swing Peak & Trough Detection: Maps historical price action into distinct contraction waves ($W_1, W_2, \dots, W_k$) by calculating pullback depths: $\text{Depth} = \frac{\text{Peak} - \text{Trough}}{\text{Peak}} \times 100$.Monotonic Decreasing Rule: Enforces that successive pullbacks shrink in amplitude (e.g., Wave 1: -25%, Wave 2: -12%, Wave 3: -5%) to confirm volatility compression.Volume Dry-Up Validation: Confirms that trading volume shrinks during pullbacks and surges upon breakouts past the pivot point.3. Adaptive ATR Stop-Loss CalculationsDynamic Multipliers: Replaces static stop losses with an adaptive ATR multiplier that scales based on the VCP's final tightness index ($\tau$).Volatility Scaling: Loose bases use wider multipliers to absorb routine noise, while tightly coiled handles use narrower multipliers for tighter risk control.Risk-Adjusted Sizing: Feeds the resulting stop-loss price and ATR into portfolio sizing models to determine exact position quantities.4. Frontend TypeScript DashboardType-Safe Data Modeling: Uses robust TypeScript interfaces (StockResult) to manage live screening data, prices, stages, and VCP metrics.Visual Indicators: Renders color-coded badges, contraction ratios, and stop-loss projections in real-time.Interactive Sorting: Allows traders to sort scanned assets by proximity to breakout pivots and base tightness.
2. ├── .github/
│   └── workflows/        # CI/CD pipelines (linting, type checking, building)
├── src/                  # Frontend source code & application logic
│   ├── components/       # UI sub-components (metrics, tables, badges)
│   ├── screener/         # Core Minervini filters & VCP pattern-matching logic
│   ├── App.tsx           # Main application root component
│   └── main.tsx          # TypeScript entry point
├── server.ts             # Backend server handling API requests & data feeds
├── package.json          # Dependency management & scripts (Bun-powered)
├── vite.config.ts        # Vite build configuration and bundling rules
└── tsconfig.json         # TypeScript configuration files
📄 Main Files & Their Responsibilities
server.ts:

Acts as the backend orchestrator.

Connects the application to external brokerage data feeds (such as the 5Paisa API) and manages market universes (NSE, MCX).

src/screener/:

Contains the core quantitative algorithms implementing Mark Minervini's philosophy.

Handles Stage 2 trend template validation, peak-trough swing detection for the Volatility Contraction Pattern (VCP), volume dry-up analysis, and adaptive ATR calculations.

src/App.tsx & src/main.tsx:

Manages the top-level frontend application state, reactive filtering, and user dashboard layouts.

vite.config.ts & tsconfig.json:

Configure the TypeScript compiler settings, module resolution, and the Vite development/production bundler.

.github/workflows/:

Contains automated scripts that run on every commit to verify code quality, execute linters, and test production builds
1. TypeScript Configuration (tsconfig.json)The TypeScript configuration governs type-checking, module resolution, and how strict the compiler rules are. Typically, for a modern Vite + TypeScript project, it includes:Target & Module System: Configured to target modern JavaScript environments (e.g., ESNext or ES2020) with module resolution set to bundler or Node to seamlessly handle modern ESM imports.Strict Type Safety: Enables "strict": true, enforcing strict null checks, strict function types, and explicit typing across the entire codebase to catch runtime bugs at compile time.JSX Support: Configured with "jsx": "react-jsx" (or equivalent framework settings) to process JSX components without needing manual React imports in every file.Library & Environment Types: Includes definitions for modern browser APIs and DOM elements ("lib": ["ESNext", "DOM", "DOM.Iterable"]).2. Vite Configuration (vite.config.ts)Vite serves as both the development server (leveraging native ES modules) and the production bundler (using Rollup). Its configuration file typically handles:Framework Plugins: Integrates official plugins (such as @vitejs/plugin-react) to enable fast Hot Module Replacement (HMR) and JSX transformation.Path Aliases (resolve.alias): Often configured to map directory shortcuts (like @/ pointing to the src/ directory), making imports clean and maintainable across the codebase.Build & Optimization Settings (build):Specifies output directories (e.g., dist/).Configures chunk-splitting and asset handling for optimal production performance.Server Settings (server): Sets up local development server parameters, such as custom ports (e.g., port: 3000) and proxy rules if backend API requests need to be routed locally during development.
2. {
  "name": "minervini-sepa-vcp-screener",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.3",
    "@typescript-eslint/eslint-plugin": "^7.15.0",
    "@typescript-eslint/parser": "^7.15.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "postcss": "^10.4.19",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.3",
    "vite": "^5.3.3"
  }
}
Explanation of Scripts
dev: Starts the local Vite development server with Hot Module Replacement (HMR) enabled for instant feedback while coding.

build: Runs the TypeScript compiler (tsc) to verify type safety across the entire project, and then triggers vite build to bundle and optimize the application for production deployment.

preview: Locally previews the production build to ensure everything behaves correctly before deployment.

lint: Runs ESLint across all TypeScript and TSX files to enforce code quality rules, detect syntax issues, and prevent unused variables or warnings.

📦 Explanation of Dependencies
1. Core Runtime Dependencies (dependencies)
react & react-dom: The core UI library used to build the interactive component hierarchy (dashboard, tables, metrics, cards).

lucide-react: Provides clean, scalable SVG vector icons used across the screener UI (e.g., trend indicators, volume badges, status icons).

clsx & tailwind-merge: Utility libraries used to conditionally construct and merge Tailwind CSS class names efficiently.

2. Development & Build Tools (devDependencies)
vite & @vitejs/plugin-react: The ultra-fast frontend build tool and development server, paired with the official React plugin for JSX transformation.

typescript: The core programming language compiler and type checker.

tailwindcss, postcss, & autoprefixer: The styling pipeline used for utility-first responsive styling and CSS vendor-prefix management.

eslint & @typescript-eslint/...: Linter tooling configured to catch syntax anomalies and maintain strict code quality standards in TypeScript files.
📁 Workflow Directory & File Location
Path: .github/workflows/ (commonly named something like ci.yml or build.yml).

Trigger Event: Typically configured to run automatically on push and pull_request events to the main or master branches to ensure that broken code or type errors never make it into production.

📄 Typical GitHub Actions Workflow Structure
YAML
name: CI/CD - Lint & Build

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

jobs:
  build-and-lint:
    runs-on: ubuntu-latest

    steps:
      # 1. Checkout repository code
      - name: Checkout Code
        uses: actions/checkout@v4

      # 2. Setup Bun runtime environment (matching package manager)
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      # 3. Install project dependencies
      - name: Install Dependencies
        run: bun install

      # 4. Run TypeScript type-checking
      - name: Type Check
        run: tsc --noEmit

      # 5. Run Linter
      - name: Lint Code
        run: bun run lint

      # 6. Build the application for production
      - name: Build Application
        run: bun run build
        Step-by-Step Breakdown of Jobs
Checkout Code (actions/checkout@v4):

Pulls the latest commit of the repository into the GitHub Actions runner environment so the scripts have access to all source files, package.json, and configuration files.

Setup Bun (oven-sh/setup-bun@v1):

Installs the Bun runtime on the runner, ensuring compatibility with the project's dependency management and build scripts.

Install Dependencies (bun install):

Fetches and installs all runtime and dev dependencies defined in package.json and locked in bun.lock.

Type Check (tsc --noEmit):

Invokes the TypeScript compiler to verify type safety across the entire codebase without generating output files, catching type mismatches early.

Lint Code (bun run lint):

Executes ESLint across all TypeScript and TSX files to enforce strict code quality rules, spot syntax anomalies, and catch unused variables.

Build Application (bun run build):

Runs the production bundling script (combining type checking and Vite bundling), ensuring that the application compiles correctly into optimized static production assets.
Here is a comprehensive summary of the entire Minervini SEPA & VCP Screener project architecture, covering its backend data pipelines, core algorithmic logic, frontend presentation, and CI/CD automation:1. High-Level Architecture OverviewThe project is architected as a modern, full-stack quantitative screening tool designed to ingest raw market data, filter assets through strict momentum and volatility rules, and display high-probability breakout candidates via an interactive TypeScript dashboard.Plaintext[ External Broker APIs / NSE / MCX ]
               │
               ▼
   [ Backend Server (`server.ts`) ] ──(Data Normalization & Feed)
               │
               ▼
   [ Core Screener Algorithms (`src/screener/`) ]
   • Stage 2 Trend Template Validation
   • Peak-Trough VCP Contraction Mapping
   • Adaptive ATR Multiplier & Stop Loss
               │
               ▼
   [ Frontend UI Dashboard (`src/`) ] ──(Vite + React + Tailwind)
               │
               ▼
   [ CI/CD Automation (`.github/workflows/`) ] ──(Bun + ESLint + TypeScript)
2. Core Architectural LayersA. Backend & Data Ingestion (server.ts)Broker & Market Integration: Acts as the gateway connecting the application to financial market feeds (such as the 5Paisa API) and automatic asset universes (including NSE and MCX commodities).Environment & Security: Handles secure persistence, local SQLite database management, and API token authentication.B. Algorithmic Processing Engine (src/screener/)Stage 2 Trend Template: Filters out lagging stocks by verifying that price is trading above key moving averages ($P > EMA_{50} > SMA_{150} > SMA_{200}$) with positively sloping trends.Volatility Contraction Pattern (VCP): Maps swing highs and lows to track progressive contractions in pullback depths ($D_1 > D_2 > D_3$) and validates volume dry-ups during consolidations alongside breakout volume surges.Adaptive ATR Risk Model: Dynamically scales stop-loss multipliers based on base tightness ($\tau$), ensuring wider allowances for loose volatility and tighter stops for coiled handles.C. Frontend & User Interface (src/, App.tsx, index.html)Type-Safe Modeling: Implements rigorous TypeScript interfaces (StockResult) to safely handle live JSON payloads containing ticker data, VCP contraction counts, and risk metrics.Interactive Dashboard: Built with React and styled using Tailwind CSS, featuring color-coded warning/success badges, adaptive indicator tooltips, and sorting utilities for breakout pivots.D. Build & CI/CD Pipeline (.github/workflows/, package.json, vite.config.ts)Package Management: Powered by Bun for ultra-fast dependency installation and script execution.Build Bundler: Configured with Vite and TypeScript (tsc --noEmit) for instant Hot Module Replacement (HMR) during development and optimized static bundling for production.Automated Quality Assurance: GitHub Actions workflows run on every push/pull request to automatically execute type-checking, ESLint rules, and production builds
The Volatility Contraction Pattern (VCP) algorithm in a Mark Minervini–style screener is designed to programmatically detect tightening price behavior and decreasing supply prior to a breakout.Translating Minervini's discretionary rules into deterministic code involves a systematic, multi-step pipeline combining peak-trough segmentation, progressive amplitude checking, and volume profile analysis.1. High-Level Technical Logic FlowThe algorithm evaluates daily price arrays ($O, H, L, C, V$) to find structures matching a coiling spring:Trend Template Prerequisite: Confirms the stock is in a structural Stage 2 uptrend ($Price > EMA_{50} > SMA_{150} > SMA_{200}$, with rising slopes) before running pattern math.Swing Peak & Trough Detection: Identifies local swing highs and subsequent pullbacks (troughs) to map distinct contraction waves.Progressive Contraction Constraint: Asserts that each successive pullback is smaller in amplitude than the preceding one (e.g., Wave 1: -25%, Wave 2: -12%, Wave 3: -5%).Volume Dry-Up Validation: Confirms that trading volume shrinks during pullbacks and expands on rallies or near the breakout pivot.2. Mathematical Implementation & Code LogicStep A: Swing Extremum Identification (Peak-to-Trough Mapping)The algorithm iterates through historical price bars to find local peaks (swing highs where price is higher than $N$ bars left and right) and subsequent local troughs.Let a contraction wave $W_i$ be defined by a peak price $P_i$ and its corresponding subsequent trough price $T_i$.Depth Percentage Calculation:$$D_i = \frac{P_i - T_i}{P_i} \times 100$$Step B: The Monotonic Decreasing Rule (Contraction Constraint)For a valid VCP with $k$ contractions (typically 2 to 4 waves), the algorithm enforces a strictly decreasing sequence of depths:$$D_1 > D_2 > D_3 > \dots > D_k$$Additionally, the code frequently checks a contraction ratio threshold ($R$):$$R = \frac{D_{i+1}}{D_i}$$Minervini notes that each contraction is roughly half the depth of the prior one ($R \approx 0.4 \text{ to } 0.6$). Code implementations typically flag a valid contraction if $R \le 0.75$, ensuring the volatility is compressing.Step C: The Final Tightness (Low Volatility) CheckThe final contraction ($W_k$, acting as the final consolidation handle) must be exceptionally tight, indicating supply exhaustion.Daily Range Tightness:$$\text{Daily Range}_j = \frac{H_j - L_j}{C_j} \times 100$$The algorithm loops through the final 5 to 10 bars of the base to verify that multiple consecutive days show tight ranges (e.g., $\le 1.5\%$ to $2.0\%$ daily spread) and narrow closing changes.Step D: Volume Profile AnalysisPrice contraction without volume confirmation is prone to failure. The algorithm applies two core volume filters:Pullback Volume Dry-Up: During the downward leg of contraction $W_i$, average volume must fall below a moving average baseline (e.g., Volume < 50-day Volume SMA).$$\bar{V}_{\text{pullback}} < \bar{V}_{\text{baseline}}$$Breakout Volume Surge: As price pushes past the pivot point ($P_{\text{pivot}}$—the absolute high of the final contraction), volume must surge relative to average volume:$$V_{\text{breakout}} \ge \bar{V}_{50} \times 1.40 \quad (+40\% \text{ or higher})$$Summary Table of Core Rules in CodeRule ComponentMathematical ConditionCode Verification LogicStage 2 Trend$P > EMA_{50} > SMA_{150} > SMA_{200}$Validates structural macro trend before scanningContraction Decay$D_{i+1} < D_i$Asserts each pullback is shallower than the lastContraction Ratio$0.3 \le \frac{D_{i+1}}{D_i} \le 0.75$Ensures proper geometric tighteningFinal Tightness$\max(H_j - L_j) \le \text{Threshold}$Confirms lack of volatility in final base barsVolume Dry-Up$\sum V_{\text{pullback}} < \sum V_{\text{baseline}}$Proves supply is drying up
The Volatility Contraction Pattern (VCP) algorithm in a Mark Minervini–style screener is designed to programmatically detect tightening price behavior and decreasing supply prior to a breakout.

Translating Minervini's discretionary rules into deterministic code involves a systematic, multi-step pipeline combining peak-trough segmentation, progressive amplitude checking, and volume profile analysis.

1. High-Level Technical Logic Flow
The algorithm evaluates daily price arrays (
𝑂
,
𝐻
,
𝐿
,
𝐶
,
𝑉
O,H,L,C,V) to find structures matching a coiling spring:

Trend Template Prerequisite: Confirms the stock is in a structural Stage 2 uptrend (
𝑃
𝑟
𝑖
𝑐
𝑒
>
𝐸
𝑀
𝐴
50
>
𝑆
𝑀
𝐴
150
>
𝑆
𝑀
𝐴
200
Price>EMA 
50
​
 >SMA 
150
​
 >SMA 
200
​
 , with rising slopes) before running pattern math.

Swing Peak & Trough Detection: Identifies local swing highs and subsequent pullbacks (troughs) to map distinct contraction waves.

Progressive Contraction Constraint: Asserts that each successive pullback is smaller in amplitude than the preceding one (e.g., Wave 1: -25%, Wave 2: -12%, Wave 3: -5%).

Volume Dry-Up Validation: Confirms that trading volume shrinks during pullbacks and expands on rallies or near the breakout pivot.

2. Mathematical Implementation & Code Logic
Step A: Swing Extremum Identification (Peak-to-Trough Mapping)
The algorithm iterates through historical price bars to find local peaks (swing highs where price is higher than 
𝑁
N bars left and right) and subsequent local troughs.

Let a contraction wave 
𝑊
𝑖
W 
i
​
  be defined by a peak price 
𝑃
𝑖
P 
i
​
  and its corresponding subsequent trough price 
𝑇
𝑖
T 
i
​
 .

Depth Percentage Calculation:

𝐷
𝑖
=
𝑃
𝑖
−
𝑇
𝑖
𝑃
𝑖
×
100
D 
i
​
 = 
P 
i
​
 
P 
i
​
 −T 
i
​
 
​
 ×100
Step B: The Monotonic Decreasing Rule (Contraction Constraint)
For a valid VCP with 
𝑘
k contractions (typically 2 to 4 waves), the algorithm enforces a strictly decreasing sequence of depths:

𝐷
1
>
𝐷
2
>
𝐷
3
>
⋯
>
𝐷
𝑘
D 
1
​
 >D 
2
​
 >D 
3
​
 >⋯>D 
k
​
 
Additionally, the code frequently checks a contraction ratio threshold (
𝑅
R):

𝑅
=
𝐷
𝑖
+
1
𝐷
𝑖
R= 
D 
i
​
 
D 
i+1
​
 
​
 
Minervini notes that each contraction is roughly half the depth of the prior one (
𝑅
≈
0.4
 to 
0.6
R≈0.4 to 0.6). Code implementations typically flag a valid contraction if 
𝑅
≤
0.75
R≤0.75, ensuring the volatility is compressing.

Step C: The Final Tightness (Low Volatility) Check
The final contraction (
𝑊
𝑘
W 
k
​
 , acting as the final consolidation handle) must be exceptionally tight, indicating supply exhaustion.

Daily Range Tightness:

Daily Range
𝑗
=
𝐻
𝑗
−
𝐿
𝑗
𝐶
𝑗
×
100
Daily Range 
j
​
 = 
C 
j
​
 
H 
j
​
 −L 
j
​
 
​
 ×100
The algorithm loops through the final 5 to 10 bars of the base to verify that multiple consecutive days show tight ranges (e.g., 
≤
1.5
%
≤1.5% to 
2.0
%
2.0% daily spread) and narrow closing changes.

Step D: Volume Profile Analysis
Price contraction without volume confirmation is prone to failure. The algorithm applies two core volume filters:

Pullback Volume Dry-Up: During the downward leg of contraction 
𝑊
𝑖
W 
i
​
 , average volume must fall below a moving average baseline (e.g., Volume < 50-day Volume SMA).

𝑉
ˉ
pullback
<
𝑉
ˉ
baseline
V
ˉ
  
pullback
​
 < 
V
ˉ
  
baseline
​
 
Breakout Volume Surge: As price pushes past the pivot point (
𝑃
pivot
P 
pivot
​
 —the absolute high of the final contraction), volume must surge relative to average volume:

𝑉
breakout
≥
𝑉
ˉ
50
×
1.40
(
+
40
%
 or higher
)
V 
breakout
​
 ≥ 
V
ˉ
  
50
​
 ×1.40(+40% or higher)
Summary Table of Core Rules in Code
Rule Component	Mathematical Condition	Code Verification Logic
Stage 2 Trend	P>EMA 
50
​
 >SMA 
150
​
 >SMA 
200
​
 	Validates structural macro trend before scanning
Contraction Decay	D 
i+1
​
 <D 
i
​
 	Asserts each pullback is shallower than the last
Contraction Ratio	0.3≤ 
D 
i
​
 
D 
i+1
​
 
​
 ≤0.75	Ensures proper geometric tightening
Final Tightness	max(H 
j
​
 −L 
j
​
 )≤Threshold	Confirms lack of volatility in final base bars
Volume Dry-Up	∑V 
pullback
​
 <∑V 
baseline
​
 	Proves supply is drying up
  The frontend of the Minervini screener is built with TypeScript and modern reactive UI patterns to present real-time screening results, VCP metrics, and adaptive indicators clearly.Here is how the frontend code orchestrates data fetching, state management, and visual rendering for the stock lists and adaptive indicators:1. Component Architecture & State ManagementThe UI is structured around modular view components that manage state locally or through reactive stores:Screener Dashboard Container: Manages global state such as active filters (e.g., Minervini Trend Template rules, minimum relative strength, volume criteria) and handles polling or WebSocket triggers to refresh data from the backend (server.ts).Table / Grid View Component: Receives the array of filtered stocks and renders them into rows, sorting them by priority scores or VCP tightness.Metric Card & Badge Sub-components: Specialized sub-components that render numerical indicators (like the ATR multiplier, contraction ratio, and stage trend status) with color-coded warning/success badges.2. Displaying Screened Stock ListsThe stock list rendering relies on robust TypeScript interfaces to ensure type safety when mapping over backend JSON responses:Data Modeling: The frontend defines strict TypeScript types for each scanned asset:TypeScriptinterface StockResult {
  ticker: string;
  companyName: string;
  currentPrice: number;
  stage: number;
  vcpContractionsCount: number;
  contractionRatio: number;
  adaptiveAtrMultiplier: number;
  pivotPrice: number;
  volumeSurge: boolean;
}
Dynamic Table Rendering: The stock list component maps through the array of StockResult objects, formatting currencies, highlighting active Stage 2 uptrends, and providing interactive sorting (e.g., sorting by closest to breakout pivot or tightest VCP handle).3. Rendering Adaptive Indicators & VCP MetricsAdaptive indicators—specifically the dynamic ATR multiplier and contraction depth gauges—are rendered visually to give traders instant insight into risk parameters:Badge & Tooltip Visuals:The adaptive ATR multiplier (e.g., $1.2\times$ vs $1.8\times$) is displayed using conditional styling. A tighter handle displays a distinct badge (e.g., green indicator for tight coiling, yellow for wide/loose volatility).Hover tooltips break down the mathematical components behind the multiplier, showing the user the underlying 14-day ATR value and the contraction ratio ($\tau$).Stop-Loss and Risk Projection Integration:Next to each stock ticker, the UI calculates and displays the suggested stop-loss price in real-time using the adaptive formula:$$\text{Stop Price} = \text{Pivot} - (\text{Adaptive Multiplier} \times \text{ATR})$$This allows the trader to instantly evaluate the risk-to-reward profile before placing an order.
{
  "name": "minervini-sepa-vcp-screener",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.3",
    "@typescript-eslint/eslint-plugin": "^7.15.0",
    "@typescript-eslint/parser": "^7.15.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "postcss": "^10.4.19",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.3",
    "vite": "^5.3.3"
  }
}
Explanation of Scripts
dev: Starts the local Vite development server with Hot Module Replacement (HMR) enabled for instant feedback while coding.

build: Runs the TypeScript compiler (tsc) to verify type safety across the entire project without emitting output, and then triggers vite build to bundle and optimize the application for production deployment.

preview: Locally previews the production build to ensure everything behaves correctly before deployment.

lint: Runs ESLint across all TypeScript and TSX files to enforce code quality rules, detect syntax issues, and prevent unused variables or warnings.

📦 Explanation of Dependencies
1. Core Runtime Dependencies (dependencies)
react & react-dom: The core UI library used to build the interactive component hierarchy (dashboard, tables, metrics, cards).

lucide-react: Provides clean, scalable SVG vector icons used across the screener UI (e.g., trend indicators, volume badges, status icons).

clsx & tailwind-merge: Utility libraries used to conditionally construct and merge Tailwind CSS class names efficiently.

2. Development & Build Tools (devDependencies)
vite & @vitejs/plugin-react: The ultra-fast frontend build tool and development server, paired with the official React plugin for JSX transformation.

typescript: The core programming language compiler and type checker.

tailwindcss, postcss, & autoprefixer: The styling pipeline used for utility-first responsive styling and CSS vendor-prefix management.

eslint & @typescript-eslint/...: Linter tooling configured to catch syntax anomalies and maintain strict code quality standards in TypeScript files.
Here is a detailed breakdown of how the GitHub Actions CI/CD workflow configuration is set up for linting, type-checking, and building the Minervini screener repository:

📁 Workflow Directory & File Location
Path: .github/workflows/ (commonly named ci.yml or build.yml).

Trigger Event: Configured to run automatically on push and pull_request events targeting the main or master branches to ensure that broken code or type errors never make it into production.

📄 Typical GitHub Actions Workflow Structure
YAML
name: CI/CD - Lint & Build

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

jobs:
  build-and-lint:
    runs-on: ubuntu-latest

    steps:
      # 1. Checkout repository code
      - name: Checkout Code
        uses: actions/checkout@v4

      # 2. Setup Bun runtime environment (matching package manager)
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      # 3. Install project dependencies
      - name: Install Dependencies
        run: bun install

      # 4. Run TypeScript type-checking
      - name: Type Check
        run: tsc --noEmit

      # 5. Run Linter
      - name: Lint Code
        run: bun run lint

      # 6. Build the application for production
      - name: Build Application
        run: bun run build
⚙️ Step-by-Step Breakdown of Jobs
Checkout Code (actions/checkout@v4):

Pulls the latest commit of the repository into the GitHub Actions runner environment so the scripts have access to all source files, package.json, and configuration files.

Setup Bun (oven-sh/setup-bun@v1):

Installs the Bun runtime on the runner, ensuring compatibility with the project's dependency management and build scripts.

Install Dependencies (bun install):

Fetches and installs all runtime and dev dependencies defined in package.json and locked in bun.lock.

Type Check (tsc --noEmit):

Invokes the TypeScript compiler to verify type safety across the entire codebase without generating output files, catching type mismatches early.

Lint Code (bun run lint):

Executes ESLint across all TypeScript and TSX files to enforce strict code quality rules, spot syntax anomalies, and catch unused variables.

Build Application (bun run build):

Runs the production bundling script (combining type checking and Vite bundling), ensuring that the application compiles correctly into optimized static production assets.
Here is a comprehensive summary of the entire Minervini SEPA & VCP Screener project architecture, covering its backend data pipelines, core algorithmic logic, frontend presentation, and CI/CD automation:1. High-Level Architecture OverviewThe project is architected as a modern, full-stack quantitative screening tool designed to ingest raw market data, filter assets through strict momentum and volatility rules, and display high-probability breakout candidates via an interactive TypeScript dashboard.Plaintext[ External Broker APIs / NSE / MCX ]
               │
               ▼
   [ Backend Server (`server.ts`) ] ──(Data Normalization & Feed)
               │
               ▼
   [ Core Screener Algorithms (`src/screener/`) ]
   • Stage 2 Trend Template Validation
   • Peak-Trough VCP Contraction Mapping
   • Adaptive ATR Multiplier & Stop Loss
               │
               ▼
   [ Frontend UI Dashboard (`src/`) ] ──(Vite + React + Tailwind)
               │
               ▼
   [ CI/CD Automation (`.github/workflows/`) ] ──(Bun + ESLint + TypeScript)
2. Core Architectural LayersA. Backend & Data Ingestion (server.ts)Broker & Market Integration: Acts as the gateway connecting the application to financial market feeds (such as the 5Paisa API) and automatic asset universes (including NSE and MCX commodities).Environment & Security: Handles secure persistence, local SQLite database management, and API token authentication.B. Algorithmic Processing Engine (src/screener/)Stage 2 Trend Template: Filters out lagging stocks by verifying that price is trading above key moving averages ($P > EMA_{50} > SMA_{150} > SMA_{200}$) with positively sloping trends.Volatility Contraction Pattern (VCP): Maps swing highs and lows to track progressive contractions in pullback depths ($D_1 > D_2 > D_3$) and validates volume dry-ups during consolidations alongside breakout volume surges.Adaptive ATR Risk Model: Dynamically scales stop-loss multipliers based on base tightness ($\tau$), ensuring wider allowances for loose volatility and tighter stops for coiled handles.C. Frontend & User Interface (src/, App.tsx, index.html)Type-Safe Modeling: Implements rigorous TypeScript interfaces (StockResult) to safely handle live JSON payloads containing ticker data, VCP contraction counts, and risk metrics.Interactive Dashboard: Built with React and styled using Tailwind CSS, featuring color-coded warning/success badges, adaptive indicator tooltips, and sorting utilities for breakout pivots.D. Build & CI/CD Pipeline (.github/workflows/, package.json, vite.config.ts)Package Management: Powered by Bun for ultra-fast dependency installation and script execution.Build Bundler: Configured with Vite and TypeScript (tsc --noEmit) for instant Hot Module Replacement (HMR) during development and optimized static bundling for production.Automated Quality Assurance: GitHub Actions workflows run on every push/pull request to automatically execute type-checking, ESLint rules, and production builds
mathematical implementation of the VCP contraction algorithm in the source code.
The Volatility Contraction Pattern (VCP) algorithm in a Mark Minervini–style screener is designed to programmatically detect tightening price behavior and decreasing supply prior to a breakout.

Translating Minervini's discretionary rules into deterministic code involves a systematic, multi-step pipeline combining peak-trough segmentation, progressive amplitude checking, and volume profile analysis.

1. High-Level Technical Logic Flow
The algorithm evaluates daily price arrays (
O
,
H
,
L
,
C
,
V
O,H,L,C,V) to find structures matching a coiling spring:

Trend Template Prerequisite: Confirms the stock is in a structural Stage 2 uptrend (
P
r
i
c
e
>
E
M
A
50
>
S
M
A
150
>
S
M
A
200
Price>EMA 
50
​
 >SMA 
150
​
 >SMA 
200
​
 , with rising slopes) before running pattern math.

Swing Peak & Trough Detection: Identifies local swing highs and subsequent pullbacks (troughs) to map distinct contraction waves.

Progressive Contraction Constraint: Asserts that each successive pullback is smaller in amplitude than the preceding one (e.g., Wave 1: -25%, Wave 2: -12%, Wave 3: -5%).

Volume Dry-Up Validation: Confirms that trading volume shrinks during pullbacks and expands on rallies or near the breakout pivot.

2. Mathematical Implementation & Code Logic
Step A: Swing Extremum Identification (Peak-to-Trough Mapping)
The algorithm iterates through historical price bars to find local peaks (swing highs where price is higher than 
N
N bars left and right) and subsequent local troughs.

Let a contraction wave 
W
i
W 
i
​
  be defined by a peak price 
P
i
P 
i
​
  and its corresponding subsequent trough price 
T
i
T 
i
​
 .

Depth Percentage Calculation:

D
i
=
P
i
−
T
i
P
i
×
100
D 
i
​
 = 
P 
i
​
 
P 
i
​
 −T 
i
​
 
​
 ×100
Step B: The Monotonic Decreasing Rule (Contraction Constraint)
For a valid VCP with 
k
k contractions (typically 2 to 4 waves), the algorithm enforces a strictly decreasing sequence of depths:

D
1
>
D
2
>
D
3
>
⋯
>
D
k
D 
1
​
 >D 
2
​
 >D 
3
​
 >⋯>D 
k
​
 
Additionally, the code frequently checks a contraction ratio threshold (
R
R):

R
=
D
i
+
1
D
i
R= 
D 
i
​
 
D 
i+1
​
 
​
 
Minervini notes that each contraction is roughly half the depth of the prior one (
R
≈
0.4
 to 
0.6
R≈0.4 to 0.6). Code implementations typically flag a valid contraction if 
R
≤
0.75
R≤0.75, ensuring the volatility is compressing.

Step C: The Final Tightness (Low Volatility) Check
The final contraction (
W
k
W 
k
​
 , acting as the final consolidation handle) must be exceptionally tight, indicating supply exhaustion.

Daily Range Tightness:

Daily Range
j
=
H
j
−
L
j
C
j
×
100
Daily Range 
j
​
 = 
C 
j
​
 
H 
j
​
 −L 
j
​
 
​
 ×100
The algorithm loops through the final 5 to 10 bars of the base to verify that multiple consecutive days show tight ranges (e.g., 
≤
1.5
%
≤1.5% to 
2.0
%
2.0% daily spread) and narrow closing changes.

Step D: Volume Profile Analysis
Price contraction without volume confirmation is prone to failure. The algorithm applies two core volume filters:

Pullback Volume Dry-Up: During the downward leg of contraction 
W
i
W 
i
​
 , average volume must fall below a moving average baseline (e.g., Volume < 50-day Volume SMA).

V
ˉ
pullback
<
V
ˉ
baseline
V
ˉ
  
pullback
​
 < 
V
ˉ
  
baseline
​
 
Breakout Volume Surge: As price pushes past the pivot point (
P
pivot
P 
pivot
​
 —the absolute high of the final contraction), volume must surge relative to average volume:

V
breakout
≥
V
ˉ
50
×
1.40
(
+
40
%
 or higher
)
V 
breakout
​
 ≥ 
V
ˉ
  
50
​
 ×1.40(+40% or higher)
Summary Table of Core Rules in Code
Rule Component	Mathematical Condition	Code Verification Logic
Stage 2 Trend	P>EMA 
50
​
 >SMA 
150
​
 >SMA 
200
​
 	Validates structural macro trend before scanning
Contraction Decay	D 
i+1
​
 <D 
i
​
 	Asserts each pullback is shallower than the last
Contraction Ratio	0.3≤ 
D 
i
​
 
D 
i+1
​
 
​
 ≤0.75	Ensures proper geometric tightening
Final Tightness	max(H 
j
​
 −L 
j
​
 )≤Threshold	Confirms lack of volatility in final base bars
Volume Dry-Up	∑V 
pullback
​
 <∑V 
baseline
​
 	Proves supply is drying up
  In quantitative breakout screeners implementing Mark Minervini's principles, adaptive Average True Range (ATR) multipliers are used to dynamically compute stop losses based on how tight a Volatility Contraction Pattern (VCP) has become.While static stop-loss models rely on a fixed percentage (e.g., 7% or 8% below entry), an adaptive ATR system scales risk dynamically relative to market volatility and base structure. Here is how the source code implements this logic mathematically and programmatically:1. The Core Adaptive ConceptAs a stock progresses through a VCP from early wide waves ($W_1$) to the final tight handle ($W_k$), its daily range and ATR naturally shrink.Loose Base: High volatility $\rightarrow$ wider ATR $\rightarrow$ needs a larger multiplier to avoid getting stopped out by routine market noise.Tight Base (VCP Handle): Low volatility $\rightarrow$ compressed ATR $\rightarrow$ allows a tighter multiplier (closer stop) because the stock is coiling tightly near the breakout pivot.2. Mathematical Implementation & Code LogicStep A: Calculating the Baseline ATRThe codebase first computes the standard $N$-period ATR (typically a 14-day or 22-day window to capture short-to-medium-term price fluctuations):$$\text{TR}_i = \max \left( H_i - L_i, \vert{}H_i - C_{i-1}\vert{}, \vert{}L_i - C_{i-1}\vert{} \right)$$
 Step B: Quantifying VCP Tightness (The Contraction Factor)To make the ATR multiplier adaptive rather than static, the code calculates a tightness coefficient based on the depth and duration of the final contraction leg:$$\text{Tightness Index } (\tau) = \frac{D_k}{D_1}$$Where $D_1$ is the depth of the initial pullback wave and $D_k$ is the depth of the final consolidation handle.As the pattern matures, $\tau$ approaches 0 (e.g., contracting from an initial 20% drop down to a tight 3% handle).Step C: Dynamic Multiplier ScalingThe adaptive multiplier ($\text{AM}$) scales inverse-linearly or via a scaling function tied directly to $\tau$ and daily range compression:$$\text{AM} = \text{Base Multiplier} \times \left( 1 + w \cdot (1 - \tau) \right)$$Alternatively, in simplified programmatic implementations, the code checks the final base daily range or ATR percentage relative to price ($\text{ATR}\% = \frac{\text{ATR}_N}{\text{Close}} \times 100$):If $\text{ATR}\%$ is very low (indicating extreme tightness), a lower multiplier (e.g., $1.0\times \text{to } 1.2\times \text{ATR}$) is applied.If volatility is still expanding or loose, the multiplier scales up (e.g., $1.5\times \text{to } 2.0\times \text{ATR}$) to accommodate normal volatility.3. Programmatic Stop-Loss & Position Sizing OutputOnce the adaptive multiplier is resolved, the final stop-loss price ($S$) and position sizing variables are computed as follows:Stop-Loss Price Level:$$S = \text{Pivot Price} - (\text{AM} \times \text{ATR}_N)$$(The code will often choose the higher value between this ATR-derived stop and the actual structural swing-low of the final VCP trough to ensure logical technical placement).Risk-Adjusted Position Sizing:
The calculated risk per share ($\text{Risk}_{\text{share}} = \text{Entry Price} - S$) is fed into the portfolio risk model:$$\text{Shares to Buy} = \frac{\text{Total Capital} \times \text{Risk Allocation \%}}{\text{Risk}_{\text{share}}}$$
The frontend of the Minervini screener is built with TypeScript and modern reactive UI patterns to present real-time screening results, VCP metrics, and adaptive indicators clearly.Here is how the frontend code orchestrates data fetching, state management, and visual rendering for the stock lists and adaptive indicators:1. Component Architecture & State ManagementThe UI is structured around modular view components that manage state locally or through reactive stores:Screener Dashboard Container: Manages global state such as active filters (e.g., Minervini Trend Template rules, minimum relative strength, volume criteria) and handles polling or WebSocket triggers to refresh data from the backend (server.ts).Table / Grid View Component: Receives the array of filtered stocks and renders them into rows, sorting them by priority scores or VCP tightness.Metric Card & Badge Sub-components: Specialized sub-components that render numerical indicators (like the ATR multiplier, contraction ratio, and stage trend status) with color-coded warning/success badges.2. Displaying Screened Stock ListsThe stock list rendering relies on robust TypeScript interfaces to ensure type safety when mapping over backend JSON responses:Data Modeling: The frontend defines strict TypeScript types for each scanned asset:TypeScriptinterface StockResult {
  ticker: string;
  companyName: string;
  currentPrice: number;
  stage: number;
  vcpContractionsCount: number;
  contractionRatio: number;
  adaptiveAtrMultiplier: number;
  pivotPrice: number;
  volumeSurge: boolean;
}
Dynamic Table Rendering: The stock list component maps through the array of StockResult objects, formatting currencies, highlighting active Stage 2 uptrends, and providing interactive sorting (e.g., sorting by closest to breakout pivot or tightest VCP handle).3. Rendering Adaptive Indicators & VCP MetricsAdaptive indicators—specifically the dynamic ATR multiplier and contraction depth gauges—are rendered visually to give traders instant insight into risk parameters:Badge & Tooltip Visuals:The adaptive ATR multiplier (e.g., $1.2\times$ vs $1.8\times$) is displayed using conditional styling. A tighter handle displays a distinct badge (e.g., green indicator for tight coiling, yellow for wide/loose volatility).Hover tooltips break down the mathematical components behind the multiplier, showing the user the underlying 14-day ATR value and the contraction ratio ($\tau$).Stop-Loss and Risk Projection Integration:Next to each stock ticker, the UI calculates and displays the suggested stop-loss price in real-time using the adaptive formula:$$\text{Stop Price} = \text{Pivot} - (\text{Adaptive Multiplier} \times \text{ATR})$$This allows the trader to instantly evaluate the risk-to-reward profile before placing an order.
interface StockResult {
  ticker: string;
  companyName: string;
  currentPrice: number;
  stage: number;
  vcpContractionsCount: number;
  contractionRatio: number;
  adaptiveAtrMultiplier: number;
  pivotPrice: number;
  volumeSurge: boolean;
}
{
  "name": "minervini-sepa-vcp-screener",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.3",
    "@typescript-eslint/eslint-plugin": "^7.15.0",
    "@typescript-eslint/parser": "^7.15.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "postcss": "^10.4.19",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.3",
    "vite": "^5.3.3"
  }
}
Explanation of Scripts
dev: Starts the local development server using Vite, enabling instant Hot Module Replacement (HMR) for rapid frontend iteration.

build: Runs the TypeScript compiler (tsc --noEmit) to verify that the entire codebase is type-safe without emitting redundant files, followed by vite build to bundle and optimize assets for production deployment.

preview: Serves the production build locally so you can verify that everything bundles and renders correctly before pushing to deployment.

lint: Runs ESLint across all TypeScript (.ts and .tsx) files to enforce strict code quality rules, spot syntax errors, and flag unused variables.

📦 Explanation of Dependencies
1. Core Runtime Dependencies (dependencies)
react & react-dom: The core framework libraries used to build the reactive component hierarchy (dashboard, tables, filter controls, metric cards).

lucide-react: Provides clean, scalable SVG vector icons used across the screener UI (e.g., trend indicators, volume badges, status icons).

clsx & tailwind-merge: Utility helpers used to conditionally construct and cleanly merge Tailwind CSS class names without style conflicts.

2. Development & Build Tools (devDependencies)
vite & @vitejs/plugin-react: The primary frontend build tool and dev server, paired with the official React plugin for lightning-fast bundling and JSX compilation.

typescript: The core programming language compiler and type checker.

tailwindcss, postcss, & autoprefixer: The CSS styling pipeline responsible for utility-first responsive design and vendor-prefix management.

eslint & @typescript-eslint/...: Linter plugins configured to catch code smells, syntax anomalies, and maintain strict type standards in TypeScript files.
Here is a detailed breakdown of how the GitHub Actions CI/CD workflow configuration is set up for linting, type-checking, and building the Minervini screener repository:📁 Workflow Directory & File LocationPath: .github/workflows/ (commonly named ci.yml or build.yml).Trigger Event: Configured to run automatically on push and pull_request events targeting the main or master branches to ensure that broken code or type errors never make it into production.📄 Typical GitHub Actions Workflow StructureYAMLname: CI/CD - Lint & Build

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

jobs:
  build-and-lint:
    runs-on: ubuntu-latest

    steps:
      # 1. Checkout repository code
      - name: Checkout Code
        uses: actions/checkout@v4

      # 2. Setup Bun runtime environment (matching package manager)
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      # 3. Install project dependencies
      - name: Install Dependencies
        run: bun install

      # 4. Run TypeScript type-checking
      - name: Type Check
        run: tsc --noEmit

      # 5. Run Linter
      - name: Lint Code
        run: bun run lint

      # 6. Build the application for production
      - name: Build Application
        run: bun run build
⚙️ Step-by-Step Breakdown of JobsCheckout Code (actions/checkout@v4):Pulls the latest commit of the repository into the GitHub Actions runner environment so the scripts have access to all source files, package.json, and configuration files.Setup Bun (oven-sh/setup-bun@v1):Installs the Bun runtime on the runner, ensuring compatibility with the project's dependency management and build scripts.Install Dependencies (bun install):Fetches and installs all runtime and dev dependencies defined in package.json and locked in bun.lock.Type Check (tsc --noEmit):Invokes the TypeScript compiler to verify type safety across the entire codebase without generating output files, catching type mismatches early.Lint Code (bun run lint):Executes ESLint across all TypeScript and TSX files to enforce strict code quality rules, spot syntax anomalies, and catch unused variables.Build Application (bun run build):Runs the production bundling script (combining type checking and Vite bundling), ensuring that the application compiles correctly into optimized static production assets.
Here is a comprehensive summary of the entire Minervini SEPA & VCP Screener project architecture, detailing how data flows from external market feeds down to the user interface and CI/CD automation:🌐 High-Level Architecture OverviewThe application is structured as a full-stack quantitative screening platform designed to ingest raw financial market data, evaluate it against Mark Minervini's Strict Entry Point Analysis (SEPA) and Volatility Contraction Pattern (VCP) rules, and render high-probability breakout setups on an interactive dashboard.Plaintext[ External Market Feeds (NSE, MCX, 5Paisa API) ]
                       │
                       ▼
      [ Backend Server (`server.ts`) ] ──(Data Normalization & Persistence)
                       │
                       ▼
     [ Algorithmic Engine (`src/screener/`) ]
     • Stage 2 Trend Template Validation
     • Peak-Trough VCP Contraction Mapping
     • Adaptive ATR Multiplier & Risk Model
                       │
                       ▼
     [ Frontend UI Dashboard (`src/`) ] ──(React + Vite + Tailwind CSS)
                       │
                       ▼
     [ CI/CD Pipeline (.github/workflows/) ] ──(Bun + ESLint + TypeScript)
⚙️ Core Architectural Layers1. Backend Server & Data Ingestion (server.ts)API Integration: Connects to external brokerage and market data feeds (such as the 5Paisa API) to pull real-time or end-of-day OHLCV data for universes like the NSE (National Stock Exchange) and MCX commodities.Data Normalization: Cleans raw JSON payloads, calculates moving averages and true ranges, and standardizes ticker objects for the screener engine.2. Quantitative Algorithmic Engine (src/screener/)Stage 2 Trend Template: Filters out lagging assets by verifying macro uptrend rules ($Price > EMA_{50} > SMA_{150} > SMA_{200}$ with rising moving average slopes).VCP Contraction Mapping: Identifies swing highs and lows to track progressive contractions in pullback depths ($D_1 > D_2 > D_3$), verifying volume dry-ups during consolidations and volume surges at breakouts.Adaptive ATR Risk Model: Dynamically scales stop-loss multipliers based on base tightness ($\tau$), allowing wider stops for volatile bases and tighter risk parameters for coiled handles.3. Frontend Dashboard & UI (src/, App.tsx)Type-Safe Component Architecture: Built using React and typed strictly via TypeScript interfaces (StockResult) to ensure safe data flow across tables, metric cards, and filter panels.Visual Indicators: Renders color-coded badges, contraction depth gauges, and real-time stop-loss projections styled with Tailwind CSS for rapid decision-making.4. Build Tools & CI/CD Pipeline (vite.config.ts, package.json, .github/workflows/)Package Manager & Bundler: Powered by Bun for ultra-fast dependency installation, paired with Vite for instant Hot Module Replacement (HMR) and optimized static production builds.Automated Quality Checks: GitHub Actions workflows automatically execute type-checking (tsc --noEmit), ESLint linting, and production builds on every pull request and push to main.
The implementation of the Volatility Contraction Pattern (VCP) algorithm translates Mark Minervini's discretionary visual rules into a deterministic, multi-stage quantitative pipeline. The algorithm processes historical daily price and volume arrays ($\text{OHLCV}$) to identify structural coiling behavior preceding a breakout.Phase 1: Macro Trend Prerequisite (Stage 2 Validation)Before running contraction math, the algorithm filters out stocks not meeting structural uptrend criteria. A stock must satisfy the Minervini Stage 2 Trend Template:$$\text{Close} > \text{EMA}_{50} > \text{SMA}_{150} > \text{SMA}_{200}$$Additionally, the moving averages must exhibit positive slopes over a defined lookback window ($N$ bars):$$\frac{d(\text{SMA}_{200})}{dt} > 0$$Phase 2: Swing Extremum Identification (Peak-Trough Segmentation)The core of the VCP algorithm relies on segmenting price action into distinct swing waves (peaks and troughs).Local Extrema Detection: The code scans the price series using a rolling window to identify local swing highs ($P_i$) and subsequent local swing lows ($T_i$).Pullback Depth Calculation: For each identified contraction wave $W_i$, the percentage depth is calculated as:$$D_i = \frac{P_i - T_i}{P_i} \times 100$$Phase 3: Contraction Validation & Monotonic DecayFor a pattern to be classified as a valid VCP, it must exhibit a progressive decrease in volatility across $k$ waves (typically $k = 2 \text{ to } 4$).Monotonic Decreasing Rule:$$D_1 > D_2 > D_3 > \dots > D_k$$Contraction Ratio Threshold ($R$): The algorithm computes the ratio between successive wave depths to ensure proper geometric compression:$$R_i = \frac{D_{i+1}}{D_i}$$Typically, code enforces $0.3 \le R_i \le 0.75$, reflecting Minervini's observation that each successive contraction is roughly half to three-quarters the depth of the preceding one.Phase 4: Final Handle Tightness & Volatility CompressionThe final contraction wave ($W_k$, acting as the "handle") must show acute supply exhaustion and narrow price ranges.Daily Range Tightness: The algorithm iterates through the final $m$ bars of the base (e.g., the last 5 to 10 trading sessions) and checks that daily price spreads remain compressed:$$\max \left( \frac{H_j - L_j}{C_j} \times 100 \right) \le \text{Threshold}_{\text{tight}}$$(Where $\text{Threshold}_{\text{tight}}$ is typically set between $1.5\%$ and $2.0\%$).Phase 5: Volume Profile VerificationPrice contraction without volume confirmation invalidates the pattern. The algorithm enforces two volume conditions:Pullback Volume Dry-Up: During the downward leg of each contraction wave, average trading volume must fall significantly below the baseline moving average:$$\bar{V}_{\text{pullback}} < \bar{V}_{\text{baseline} (50)}$$Breakout Volume Surge: As price pushes past the pivot point ($P_{\text{pivot}}$—defined as the absolute high of the final handle), volume must expand sharply:$$V_{\text{breakout}} \ge \bar{V}_{50} \times 1.40$$💻 Algorithmic Pseudocode ImplementationPythondef validate_vcp_pattern(df, min_waves=2, max_waves=4):
    # Step 1: Verify Stage 2 Trend Template
    if not check_stage_2_trend(df):
        return False, None
    
    # Step 2: Extract swing peaks and troughs
    peaks, troughs = find_swing_extrema(df)
    waves = compute_wave_depths(peaks, troughs)
    
    if not (min_waves <= len(waves) <= max_waves):
        return False, None
        
    # Step 3: Verify monotonic decreasing depth (D1 > D2 > D3...)
    for i in range(len(waves) - 1):
        if waves[i+1] >= waves[i]:
            return False, None
        ratio = waves[i+1] / waves[i]
        if not (0.3 <= ratio <= 0.75):
            return False, None
            
    # Step 4: Check final handle tightness
    final_handle = df.tail(8)
    max_daily_range = ((final_handle['High'] - final_handle['Low']) / final_handle['Close']).max()
    if max_daily_range > 0.02: # greater than 2% daily range fails tightness
        return False, None
        
    return True, {
        "contractions_count": len(waves),
        "contraction_ratios": waves,
        "pivot_price": peaks[-1]
    }
    In a quantitative breakout screener implementing Mark Minervini's trading philosophy, adaptive Average True Range (ATR) multipliers are used to dynamically size stop losses based on the tightness of a Volatility Contraction Pattern (VCP).While static stop-loss models rely on a fixed percentage (e.g., 7% or 8% below entry), an adaptive ATR system scales risk dynamically relative to market volatility and base structure. Here is how the source code implements this logic mathematically and programmatically:1. The Core Adaptive ConceptAs a stock progresses through a VCP from early wide waves ($W_1$) to the final tight handle ($W_k$), its daily price range and ATR naturally shrink.Loose Base / Wide Wave: High volatility $\rightarrow$ wider ATR $\rightarrow$ requires a larger multiplier to avoid getting stopped out by routine market noise.Tight Base (VCP Handle): Low volatility $\rightarrow$ compressed ATR $\rightarrow$ allows a tighter multiplier (closer stop) because the stock is coiling tightly near the breakout pivot.2. Mathematical Implementation & Code LogicStep A: Calculating Baseline ATRThe codebase first computes the standard $N$-period ATR (typically 14 or 22 trading sessions) to capture short-to-medium-term price fluctuations:$$\text{TR}_i = \max \left( H_i - L_i, \vert{}H_i - C_{i-1}\vert{}, \vert{}L_i - C_{i-1}\vert{} \right)$$$$\text{ATR}_N = \frac{1}{N} \sum_{j=0}^{N-1} \text{TR}_{i-j}$$Step B: Quantifying VCP Tightness (The Contraction Factor)To make the multiplier adaptive rather than static, the code calculates a tightness coefficient ($\tau$) based on the depth of the final contraction relative to the initial pullback:$$\tau = \frac{D_k}{D_1}$$Where $D_1$ is the percentage depth of the initial pullback wave and $D_k$ is the depth of the final consolidation handle.As the pattern matures and tightens, $\tau$ approaches 0 (e.g., contracting from an initial 25% drop down to a tight 3% handle).Step C: Dynamic Multiplier ScalingThe adaptive multiplier ($\text{AM}$) scales inversely with base tightness using a linear or exponential interpolation function:$$\text{AM} = \text{Base Multiplier} \times \left( 1 + w \cdot (1 - \tau) \right)$$Alternatively, in simplified programmatic implementations, the code checks the final base daily range or ATR percentage relative to price ($\text{ATR}\% = \frac{\text{ATR}_N}{\text{Close}} \times 100$):If $\text{ATR}\%$ is very low (extreme tightness), a lower multiplier (e.g., $1.0\times \text{to } 1.2\times \text{ATR}$) is applied.If volatility is still expanding or loose, the multiplier scales up (e.g., $1.6\times \text{to } 2.0\times \text{ATR}$) to accommodate normal market noise.3. Programmatic Implementation ExampleHere is how the calculation is structured in the screener's risk management module:TypeScriptfunction calculateAdaptiveStopLoss(
  pivotPrice: number,
  atr14: number,
  initialDepth: number,
  finalDepth: number,
  baseMultiplier: number = 1.5
): { adaptiveMultiplier: number; stopLossPrice: number } {
  
  // Compute tightness index (tau)
  const tightnessIndex = finalDepth / initialDepth; // e.g., 3% / 20% = 0.15
  
  // Scale the multiplier: tighter base (smaller tau) yields a tighter risk multiplier
  const adaptiveMultiplier = baseMultiplier * (0.8 + (0.4 * tightnessIndex));
  
  // Ensure multiplier stays within safe boundaries (e.g., between 1.0x and 2.0x ATR)
  const clampedMultiplier = Math.max(1.0, Math.min(2.0, adaptiveMultiplier));
  
  // Calculate final stop loss price below the breakout pivot
  const stopLossPrice = pivotPrice - (clampedMultiplier * atr14);
  
  return {
    adaptiveMultiplier: Number(clampedMultiplier.toFixed(2)),
    stopLossPrice: Number(stopLossPrice.toFixed(2))
  };
}
4. Integration with Position SizingOnce the adaptive stop-loss price ($S$) is computed, it feeds directly into the position sizing engine to manage account risk:$$\text{Risk}_{\text{share}} = \text{Breakout Pivot Price} - S$$$$\text{Shares to Buy} = \frac{\text{Total Capital} \times \text{Risk Allocation \%}}{\text{Risk}_{\text{share}}}$$
The Volatility Contraction Pattern (VCP) algorithm translates Mark Minervini's discretionary visual rules into a deterministic, multi-stage quantitative pipeline. The algorithm processes historical daily price and volume arrays ($\text{OHLCV}$) to identify structural coiling behavior preceding a breakout.Phase 1: Macro Trend Prerequisite (Stage 2 Validation)Before running contraction math, the algorithm filters out stocks not meeting structural uptrend criteria. A stock must satisfy the Minervini Stage 2 Trend Template:$$\text{Close} > \text{EMA}_{50} > \text{SMA}_{150} > \text{SMA}_{200}$$Additionally, the moving averages must exhibit positive slopes over a defined lookback window ($N$ bars):$$\frac{d(\text{SMA}_{200})}{dt} > 0$$Phase 2: Swing Extremum Identification (Peak-Trough Segmentation)The core of the VCP algorithm relies on segmenting price action into distinct swing waves (peaks and troughs).Local Extrema Detection: The code scans the price series using a rolling window to identify local swing highs ($P_i$) and subsequent local swing lows ($T_i$).Pullback Depth Calculation: For each identified contraction wave $W_i$, the percentage depth is calculated as:$$D_i = \frac{P_i - T_i}{P_i} \times 100$$Phase 3: Contraction Validation & Monotonic DecayFor a pattern to be classified as a valid VCP, it must exhibit a progressive decrease in volatility across $k$ waves (typically $k = 2 \text{ to } 4$).Monotonic Decreasing Rule:$$D_1 > D_2 > D_3 > \dots > D_k$$Contraction Ratio Threshold ($R$): The algorithm computes the ratio between successive wave depths to ensure proper geometric compression:$$R_i = \frac{D_{i+1}}{D_i}$$Typically, code enforces $0.3 \le R_i \le 0.75$, reflecting Minervini's observation that each successive contraction is roughly half to three-quarters the depth of the preceding one.Phase 4: Final Handle Tightness & Volatility CompressionThe final contraction wave ($W_k$, acting as the "handle") must show acute supply exhaustion and narrow price ranges.Daily Range Tightness: The algorithm iterates through the final $m$ bars of the base (e.g., the last 5 to 10 trading sessions) and checks that daily price spreads remain compressed:$$\max \left( \frac{H_j - L_j}{C_j} \times 100 \right) \le \text{Threshold}_{\text{tight}}$$(Where $\text{Threshold}_{\text{tight}}$ is typically set between $1.5\%$ and $2.0\%$).Phase 5: Volume Profile VerificationPrice contraction without volume confirmation invalidates the pattern. The algorithm enforces two volume conditions:Pullback Volume Dry-Up: During the downward leg of each contraction wave, average trading volume must fall significantly below the baseline moving average:$$\bar{V}_{\text{pullback}} < \bar{V}_{\text{baseline} (50)}$$Breakout Volume Surge: As price pushes past the pivot point ($P_{\text{pivot}}$—defined as the absolute high of the final handle), volume must expand sharply:$$V_{\text{breakout}} \ge \bar{V}_{50} \times 1.40$$
In a quantitative breakout screener implementing Mark Minervini’s trading framework, adaptive Average True Range (ATR) multipliers scale risk dynamically based on how tight a Volatility Contraction Pattern (VCP) has become.Unlike static stop-loss models (e.g., a fixed 7% or 8% drop), an adaptive ATR system adjusts stop distances in response to volatility compression: wide bases require wider breathing room, while tight handles allow for tighter risk parameters.1. High-Level Logic Flow in the Source CodeThe risk management module evaluates the final state of a VCP base through a sequence of programmatic steps:Volatility Baseline Extraction: Computes the standard $N$-period ATR ($\text{ATR}_{14}$ or $\text{ATR}_{22}$) to capture immediate price volatility.Contraction Ratio & Tightness Index ($\tau$): Measures the geometric compression from the initial wide wave ($D_1$) to the final tight handle ($D_k$).Multiplier Scaling: Maps $\tau$ through an interpolation function to output an active multiplier ($\text{AM}$) between a predefined safety floor and ceiling (e.g., $1.0\times$ to $2.0\times$).Stop-Loss Derivation: Multiplies the active ATR value by the dynamic multiplier and subtracts it from the breakout pivot price.2. Mathematical FormulationStep A: Baseline ATR Calculation$$\text{TR}_i = \max \left( H_i - L_i, \vert{}H_i - C_{i-1}\vert{}, \vert{}L_i - C_{i-1}\vert{} \right)$$$$\text{ATR}_N = \frac{1}{N} \sum_{j=0}^{N-1} \text{TR}_{i-j}$$Step B: The Tightness Index ($\tau$)The source code quantifies base maturity by computing the ratio between the final contraction depth ($D_k$) and the initial pullback depth ($D_1$):$$\tau = \frac{D_k}{D_1}$$Wide Base: $\tau \approx 1.0$ (e.g., final pullback is almost as deep as the first).Coiled Base: $\tau \approx 0.1 \text{ to } 0.2$ (e.g., initial 25% drop has compressed down to a tight 3% handle).Step C: Dynamic Multiplier InterpolationThe code scales the base multiplier ($\text{AM}_{\text{base}}$) inversely with $\tau$:$$\text{AM} = \text{AM}_{\text{base}} \times \left( \alpha + \beta \cdot \tau \right)$$(Where $\alpha$ and $\beta$ are tuning coefficients—typically $\alpha = 0.8$ and $\beta = 0.4$—ensuring the multiplier decreases safely as the base coils tighter).3. Source Code Implementation ExampleHere is how the calculation is structured in the backend risk engine:TypeScriptinterface StopLossResult {
  adaptiveMultiplier: number;
  stopLossPrice: number;
  riskPerShare: number;
}

function calculateAdaptiveStopLoss(
  pivotPrice: number,
  atr14: number,
  initialDepth: number,
  finalDepth: number,
  baseMultiplier: number = 1.5
): StopLossResult {
  // 1. Calculate tightness index (tau)
  const tightnessIndex = finalDepth / initialDepth; // e.g., 3% / 20% = 0.15
  
  // 2. Scale multiplier dynamically based on tightness
  let adaptiveMultiplier = baseMultiplier * (0.8 + (0.4 * tightnessIndex));
  
  // 3. Clamp within strict risk boundaries (min 1.0x, max 2.0x ATR)
  adaptiveMultiplier = Math.max(1.0, Math.min(2.0, adaptiveMultiplier));
  
  // 4. Compute final stop loss price below the breakout pivot
  const stopLossPrice = pivotPrice - (adaptiveMultiplier * atr14);
  const riskPerShare = pivotPrice - stopLossPrice;
  
  return {
    adaptiveMultiplier: Number(adaptiveMultiplier.toFixed(2)),
    stopLossPrice: Number(stopLossPrice.toFixed(2)),
    riskPerShare: Number(riskPerShare.toFixed(2))
  };
}
The frontend of the Minervini screener is built using TypeScript, React, and Tailwind CSS to provide a reactive, type-safe dashboard that translates complex quantitative screening data into clear, actionable visual components.Here is a detailed breakdown of how the frontend TypeScript code handles data modeling, stock list rendering, and the visualization of adaptive indicators.1. Data Modeling & TypeScript InterfacesTo ensure type safety across API payloads and component props, the frontend defines rigorous TypeScript interfaces mirroring the backend screening output:TypeScriptinterface StockResult {
  ticker: string;
  companyName: string;
  currentPrice: number;
  stage: number; // e.g., Stage 2 Uptrend
  vcpContractionsCount: number; // e.g., 2, 3, or 4 waves
  contractionRatio: number; // Geometric compression index (tau)
  adaptiveAtrMultiplier: number; // Dynamic risk multiplier (e.g., 1.2x - 1.8x)
  atr14: number; // 14-period Average True Range
  pivotPrice: number; // Breakout trigger level
  volumeSurge: boolean; // Confirms breakout volume expansion
  stopLossPrice: number; // Calculated dynamic stop loss
}
2. Rendering Screened Stock Lists (Tables & Filtering)The main dashboard container manages state for active filters (such as minimum relative strength, volume surge flags, and VCP wave counts) and maps over the filtered StockResult array to render an interactive data table.Interactive Sorting & Formatting: Users can sort stocks by proximity to their breakout pivot, contraction tightness, or ATR risk multiplier.Conditional Row Highlighting: Rows are dynamically styled using utility classes (via clsx and tailwind-merge) to highlight prime setup candidates—such as stocks exhibiting a clean 3-contraction VCP with a confirmed volume surge.3. Displaying Adaptive Indicators & Risk MetricsAdaptive indicators—specifically the dynamic ATR multiplier and calculated stop-loss prices—are rendered visually to give traders instant insight into risk parameters:Color-Coded Tightness Badges:The adaptive ATR multiplier (e.g., $1.2\times$ vs $1.8\times$) is rendered inside a dynamic badge component. Tighter bases ($\tau \le 0.2$) display a green coiling indicator, while wider bases display neutral or warning states.Real-Time Stop-Loss Projections:Next to each ticker, the UI computes and displays the dynamic stop-loss price in real time:$$\text{Stop Price} = \text{Pivot} - (\text{Adaptive Multiplier} \times \text{ATR}_{14})$$Hover tooltips break down the mathematical components behind the multiplier, showing the underlying 14-day ATR value and contraction ratio so traders can evaluate risk-to-reward ratios at a glance.
package.json
JSON
{
  "name": "minervini-sepa-vcp-screener",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.3",
    "@typescript-eslint/eslint-plugin": "^7.15.0",
    "@typescript-eslint/parser": "^7.15.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "postcss": "^10.4.19",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.3",
    "vite": "^5.3.3"
  }
}
⚙️ Build Scripts Breakdown
dev: Starts the local Vite development server with Hot Module Replacement (HMR) for instant component reloading during development.

build: Runs the TypeScript compiler (tsc) to verify type safety across the codebase without emitting unnecessary files, followed by vite build to bundle and optimize assets for production deployment.

preview: Locally previews the production build to ensure static assets bundle correctly before pushing to production.

lint: Executes ESLint across all TypeScript and TSX files to enforce strict code quality rules, spot syntax errors, and flag unused variables.

📦 Installed Dependencies Breakdown
1. Core Runtime Dependencies (dependencies)
react & react-dom: The core library powering the reactive component hierarchy (dashboard, tables, metrics cards).

lucide-react: Provides clean, scalable SVG vector icons used across the screener UI for status indicators, trends, and buttons.

clsx & tailwind-merge: Utility helpers used to conditionally construct and cleanly merge Tailwind CSS class names without style collisions.

2. Development & Build Tools (devDependencies)
vite & @vitejs/plugin-react: The primary frontend bundler and dev server, paired with the official React plugin for JSX compilation.

typescript: The core programming language compiler and type checker.

tailwindcss, postcss, & autoprefixer: The CSS styling pipeline responsible for utility-first responsive styling and vendor prefix management.

eslint & @typescript-eslint/...: Linter plugins configured to catch code anomalies and maintain strict typing standards in TypeScript files.

