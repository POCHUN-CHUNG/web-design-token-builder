# DESIGN.md 官方規格整理

來源：https://stitch.withgoogle.com/docs/design-md/specification/

DESIGN.md 檔案分為兩層結構：**YAML frontmatter（機器可讀 token）** ＋ **Markdown 內文（人類可讀章節）**。frontmatter 區塊必須以單獨一行 `---` 開頭，並以單獨一行 `---` 結尾。Token 系統參考 W3C Design Token Format，可與 `tokens.json`、Figma variables、Tailwind theme config 互轉。

規格定位為「foundation, not a prescription」——提供共同基礎，但保留擴充彈性；設計系統可自由新增領域專屬的 section 與 token。

## 一、Token 型別系統（Token Types）

| 型別 | 格式 | 範例 |
|---|---|---|
| Color | `#` + hex code（sRGB） | `"#1A1C1E"` |
| Dimension | 數字 + 單位（`px`／`em`／`rem`） | `48px`、`-0.02em` |
| Token Reference | `{path.to.token}` | `{colors.primary}` |
| Typography | 複合物件（見下表） | 見下 |

Token Reference 以大括號包住一個指向 YAML 樹中另一個值的物件路徑。多數 token 群組的參照必須指向一個原始值（如 `{colors.primary-60}`），而非群組本身；僅在 `components` 區塊內，允許參照複合值（如 `{typography.label-md}`）。

## 二、Typography 屬性

| 屬性 | 型別 | 說明 |
|---|---|---|
| `fontFamily` | string | 字型名稱 |
| `fontSize` | Dimension | 字級 |
| `fontWeight` | number | 數字權重（如 400、700）。YAML 中裸數字與加引號字串等價 |
| `lineHeight` | Dimension \| number | 尺寸（如 `24px`）或無單位倍數（如 `1.6`）。建議使用無單位 |
| `letterSpacing` | Dimension | 字距調整 |
| `fontFeature` | string | 對應 `font-feature-settings` |
| `fontVariation` | string | 對應 `font-variation-settings` |

## 三、Frontmatter 頂層 Schema

```yaml
version: <string>        # 選填，現行版本為 alpha
name: <string>
description: <string>    # 選填
colors:
  <token-name>: <Color>
typography:
  <token-name>: <Typography>
rounded:
  <scale-level>: <Dimension>
spacing:
  <scale-level>: <Dimension | number>
components:
  <component-name>:
    <token-name>: <string | token reference>
```

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `version` | string | 否 | 選填，現行版本為 `alpha` |
| `name` | string | 是 | |
| `description` | string | 否 | |
| `colors` | `map<string, Color>` | — | 至少須定義 `primary` |
| `typography` | `map<string, Typography>` | — | 常見 9–15 個層級 |
| `rounded` | `map<scale-level, Dimension>` | — | |
| `spacing` | `map<scale-level, Dimension \| number>` | — | |
| `components` | `map<component-name, map<token-name, string \| token reference>>` | — | |

`<scale-level>` 為任意具語意的字串鍵，常見為 `xs`／`sm`／`md`／`lg`／`xl`／`full`，任何描述性字串鍵皆合法。

### 完整範例（frontmatter）

```yaml
---
version: alpha
name: Daylight Prestige
colors:
  primary: "#1A1C1E"
  secondary: "#6C7278"
  tertiary: "#B8422E"
typography:
  h1:
    fontFamily: Public Sans
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.02em
rounded:
  sm: 4px
  md: 8px
spacing:
  sm: 8px
  md: 16px
components:
  button-primary:
    backgroundColor: "{colors.primary-60}"
    textColor: "{colors.primary-20}"
    rounded: "{rounded.md}"
    padding: 12px
---
```

## 四、Markdown 內文章節（Section order）

每份 DESIGN.md 遵循相同結構。不相關的 section 可省略，但存在的 section 必須依下列順序排列。所有 section 一律使用 `##` 標題；文件開頭可選用一個 `#` 標題作文件命名，但不會被解析為 section。Section 結構刻意保持開放——以下為共通詞彙，設計系統可自由新增領域專屬 section。

| # | 章節 | 別名 | 對應 Design Tokens |
|---|---|---|---|
| 1 | Overview | Brand & Style | 無（純敘述） |
| 2 | Colors | — | `colors: map<string, Color>` |
| 3 | Typography | — | `typography: map<string, Typography>` |
| 4 | Layout | Layout & Spacing | `spacing: map<string, Dimension\|number>` |
| 5 | Elevation & Depth | Elevation | 無（純敘述） |
| 6 | Shapes | — | `rounded: map<string, Dimension>` |
| 7 | Components | — | `components: map<string, map<string, string>>` |
| 8 | Do's and Don'ts | — | 無（條列建議） |

### 各章節說明

**1. Overview（Brand & Style）**
對產品外觀與調性的整體描述。定義品牌個性、目標受眾、UI 應喚起的情緒反應。當特定規則或 token 未定義時，作為基礎脈絡依據。

**2. Colors**
定義設計系統的色彩調色盤。至少須定義 `primary` 調色盤。額外調色盤可自由命名，常見慣例為 `primary`、`secondary`、`tertiary`、`neutral`。

**3. Typography**
定義文字層級。多數設計系統有 9–15 個層級，每個層級具備語意角色（headline、body、label）與尺寸變體（small、medium、large）。

**4. Layout（Layout & Spacing）**
描述版面與間距策略——網格模型、間距尺度、容器原則。

**5. Elevation & Depth（Elevation）**
描述視覺層次如何呈現。若設計採用陰影，定義陰影屬性；若為扁平設計，說明替代方案（邊框、色調分層、色彩對比）。此章節無對應的獨立 design tokens 欄位。

**6. Shapes**
描述視覺元素的形狀——圓角、邊緣處理、整體造型語言。

**7. Components**
元件原子的樣式指引。規格定義常見元件類型——Buttons、Chips、Lists、Inputs、Checkboxes、Radio buttons、Tooltips，但鼓勵設計系統依領域新增額外元件。

**8. Do's and Don'ts**
實務指引與常見誤區，作為生成時的護欄準則。

## 五、未知內容的容錯行為（Consumer behavior for unknown content）

規格設計為可擴充。當 consumer 遇到本規格未定義的內容時：

| 情境 | 處理行為 | 範例 |
|---|---|---|
| 未知的 section 標題 | 保留、不報錯 | `## Iconography` |
| 未知的 color token 名稱 | 值合法即接受 | `surface-container-high: '#...'` |
| 未知的 typography token 名稱 | 視為合法 typography 接受 | `telemetry-data` |
| 未知的 spacing 值 | 接受；若非合法 dimension 則以字串儲存 | `grid-columns: '5'` |
| 未知的 component 屬性 | 接受並顯示警告 | `borderColor` |
| 重複的 section 標題 | 報錯，拒絕整個檔案 | 兩個 `## Colors` 標題 |

## 六、建議的 Token 命名慣例（Recommended token names）

以下名稱為跨設計系統常見用法，非強制，僅作為一致性指引。

| 類別 | 建議名稱 |
|---|---|
| Colors | `primary`、`secondary`、`tertiary`、`neutral`、`surface`、`on-surface`、`error` |
| Typography | `headline-display`、`headline-lg`、`headline-md`、`body-lg`、`body-md`、`body-sm`、`label-lg`、`label-md`、`label-sm` |
| Rounded | `none`、`sm`、`md`、`lg`、`xl`、`full` |

## 補充

- 規格頁面目錄結構：Overview → Design tokens（Schema）→ Token types（Typography properties、Token references）→ Sections（Section order、Overview、Colors、Typography、Layout、Elevation & Depth、Shapes、Components、Do's and Don'ts）→ Consumer behavior for unknown content → Recommended token names。
