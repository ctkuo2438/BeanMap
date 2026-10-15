# BeanMap

BeanMap 是灣區咖啡豆店家目錄，讓使用者依城市找到烘豆品牌、咖啡豆選品店，以及可買豆或預訂取貨的據點，再前往店家網站購買。

目前以 React 前端搭配整理好的 JSON 資料運作，**只需要 Node.js 與 npm**。購買流程在店家網站完成，BeanMap 本身沒有購物車或結帳功能。

## 收錄範圍與功能

第一階段涵蓋 10 座城市：Sunnyvale、Mountain View、Santa Clara、Cupertino、San Jose、Milpitas、Palo Alto、Los Gatos、Campbell、South San Francisco。

截至資料版本 `2026-10-15`，共收錄 18 個品牌／選品店、43 個據點，其中 30 個已依公開來源確認可到店買豆或取貨，13 個的門市售豆方式待確認。

- 依城市、店名／品牌／地址、購買方式與店家類型篩選。
- 分開標示「可到店買豆」、「需預訂自取」及「門市售豆待確認」。
- 提供店家選豆或門市頁面，以及 Google Maps 地址搜尋／導航連結。
- 每個據點附查核日期、公開來源與補充說明。
- 可在繁體中文與 English 介面之間切換，包含店家介紹、取貨說明及來源標題。

「已確認」指查核時有公開販豆或取貨證據，不代表即時有貨。目前尚未提供使用者定位、附近距離排序、內嵌地圖、即時庫存或營業時間；店家座標在獨立查核前維持 `null`。Google Maps 按鈕會開啟外部連結，不需要設定 Maps API。

## 快速開始

先安裝 Node.js 與 npm。本專案前端已在 Node.js `22.14.0`、npm `10.9.2` 環境驗證。

在專案根目錄執行：

```sh
cd beanmap-frontend
npm ci
npm start
```

開啟 [http://localhost:3000](http://localhost:3000)。若連接埠已被占用，依終端機提示選擇其他連接埠；停止服務請按 `Ctrl+C`。

`npm ci` 會依 `package-lock.json` 安裝前端套件。後續已安裝套件時，直接在 `beanmap-frontend/` 執行 `npm start` 即可。啟動前會自動驗證店家資料並產生前端使用的 JSON。

## 使用方式

頁面右上角的「繁中／English」可切換語言，預設為繁體中文。瀏覽器會記住上次選擇；切換語言會保留當下的城市、搜尋與篩選條件。若瀏覽器禁止本機儲存，當次仍可切換，但重新開啟時會回到預設語言。

1. 點選「開始找豆」，進入店家列表。
2. 選擇城市，或保留「全部城市」；搜尋欄可輸入店名、品牌或地址。
3. 調整「購買方式」及「店家類型」，縮小結果。
4. 展開「查核來源」，查看資訊來源、日期與取貨注意事項。
5. 點「前往選豆」到品牌網站購買，或點「店家頁面」查看門市資訊；「地圖與導航」可查看地址與規劃路線。

購買方式的差別：

| 選項 | 顯示內容 |
| --- | --- |
| 已確認到店買豆／取貨（預設） | 有公開證據支持到店買豆或取貨的據點。標示「需預訂自取」的據點，請先依店家流程下單。 |
| 品牌提供網路購買入口 | 品牌有已查核的咖啡豆購物連結；該分店的門市售豆狀態仍可能待確認。 |
| 所有據點（含待確認） | 顯示全部收錄據點，包括尚未確認門市售豆方式的店家。 |

各篩選條件會同時套用。沒有結果時，可點「重設篩選」回到全部城市、已確認據點。前往店家前，請以店家最新公告、豆款及庫存為準。

## 開發、檢查與建置

以下指令都在 `beanmap-frontend/` 執行：

| 指令 | 用途 |
| --- | --- |
| `npm start` | 啟動開發伺服器。 |
| `npm run catalog:check` | 驗證原始店家資料，不寫入產生檔。 |
| `npm test` | 啟動互動式前端測試。 |
| `CI=true npm test -- --watchAll=false` | 執行一次完整前端測試後結束（macOS／Linux）。 |
| `npm run build` | 產生正式版本，輸出至 `beanmap-frontend/build/`。 |

`start`、`test`、`build` 的前置指令都會驗證並同步資料；驗證失敗時，請先修正終端機指出的資料問題。正式建置產物可交由靜態網站服務提供。

## 店家資料維護

唯一的原始資料檔是 [data/bay_area_catalog.json](data/bay_area_catalog.json)，由人工依店家公開來源整理，目前不會自動抓取或更新庫存。

| 欄位 | 內容 |
| --- | --- |
| `scope.cities` | 收錄城市及其 ID；目前驗證器限定第一階段的 10 座城市。 |
| `brands` | 品牌名稱、類型、官網、選豆連結與連結證據；`summary`／`summary_en` 為中英文介紹。 |
| `locations` | 各據點地址、售豆狀態、到訪方式、來源 ID 與查核日期；`notes`／`notes_en` 為中英文補充說明。 |
| `sources` | 來源網址、類型、查核日期，以及該來源支持的資訊；`title`／`title_en` 為中英文標題。 |
| `excluded_locations` | 未收錄或移除據點及其原因，例如暫停營業、非對外取貨點或過時資訊。 |

新增或更新據點時：

1. 先核對官方門市頁、店家菜單或售豆／取貨政策，將來源加入 `sources`。
2. 在 `brands` 與 `locations` 使用不重複的 ID，填寫地址與對應來源 ID。
3. 有門市聲明、菜單、明確取貨政策，或品牌門市售豆政策加上有效分店頁面，才可將 `in_store_beans` 設為 `confirmed`，並填入 `confirmation_basis` 與 `sales_evidence_source_ids`。僅有品牌網路商店不足以確認該分店能現場買豆。
4. 證據不足時設為 `unconfirmed`，`confirmation_basis` 也使用 `unconfirmed`，售豆證據陣列保持空白。`visit_mode` 使用 `walk_in` 或 `order_ahead_pickup`，`stock_status` 維持 `unknown`。
5. 更新來源的 `checked_on`、據點的 `last_checked_on` 與整份資料的 `updated_on`，日期格式為 `YYYY-MM-DD`。座標未確認時，`coordinates` 與 `coordinate_source_id` 都保持 `null`。
6. 一併補上 `summary_en`、`title_en` 與 `notes_en`。沒有補充說明時，`notes` 和 `notes_en` 都使用空字串；英文翻譯不得改變售豆或取貨的確認狀態。

完成後，在**專案根目錄**執行：

```sh
node scripts/sync-catalog.mjs --check
node scripts/sync-catalog.mjs
```

第二個指令會產生 `beanmap-frontend/src/data/catalog.generated.json`。這個檔案已排除版本追蹤，請勿直接編輯；`npm start`、`npm test`、`npm run build` 也會重新產生它。若開發伺服器已在執行，修改原始資料後仍需手動同步，或重新執行 `npm start`，頁面才會使用新資料。

介面翻譯集中在 `beanmap-frontend/src/i18n.js`；店家相關翻譯則保存在原始資料中。新增介面文字時，請同時補上 `zh-Hant` 與 `en` 內容。

## 技術與套件

套件記錄在 [beanmap-frontend/package.json](beanmap-frontend/package.json)，完整安裝版本由 `package-lock.json` 管理，使用 `npm ci` 安裝。

| 技術／套件 | 用途 |
| --- | --- |
| React、React DOM | 雙語介面、搜尋及篩選。 |
| React Scripts | 開發伺服器、測試與正式建置。 |
| Testing Library（React、DOM、jest-dom） | 操作及驗證前端功能。 |
| Node.js 內建模組 | 驗證 JSON 目錄並產生前端資料，不需另外安裝套件。 |

資料流程為 `data/bay_area_catalog.json` → `scripts/sync-catalog.mjs` → 前端產生檔 → React 介面。執行網站不需要 API key、資料庫或額外後端服務。

## 專案結構

```text
BeanMap/
├── beanmap-frontend/          # 目前的 React 網站、前端套件與測試
│   ├── public/               # 網頁入口、BeanMap 圖示及網站資訊
│   ├── src/                  # 介面、樣式、雙語文字及測試
│   ├── package.json          # npm 套件與指令
│   └── package-lock.json     # 套件安裝版本
├── data/
│   └── bay_area_catalog.json # 灣區店家原始資料及查核來源
├── scripts/
│   └── sync-catalog.mjs      # 驗證資料並產生前端 JSON
└── README.md
```

## 常見問題

- **npm 找不到 `package.json`**：先進入 `beanmap-frontend/` 再執行 npm 指令。
- **找不到 `catalog.generated.json`**：從前端目錄執行 `npm start`，或在根目錄執行 `node scripts/sync-catalog.mjs`。
- **修改資料後畫面沒有更新**：重新執行同步指令；只修改根目錄 JSON 不會觸發資料同步。
- **某城市看不到預期店家**：預設只顯示已確認據點；可改選「所有據點（含待確認）」並清除搜尋與類型條件。
- **需要申請 Google API key 或設定資料庫嗎？** 不需要，依「快速開始」安裝 npm 套件即可。
