# 权限设计清单

> 版本：v1.0  
> 范围：CreatiAds 单页应用 - Data Sources / Dashboard / BI 三大模块

---

## 一、权限角色与级别定义

### 1. 权限管理弹窗（permissionModal）—— 用于 Data Sources / Dashboard / BI 共享授权

| 级别 | 说明 | 适用范围 |
| --- | --- | --- |
| **USE** | 可查看和使用 | 用户 / 部门 |
| **EDIT** | 可编辑 | 用户 / 部门 |
| **ADMIN** | 完全管理（含再分享） | 用户 / 部门 |
| **—** | 不设级别（工作空间整体授权） | 工作空间 |

> 代码位置：`index.html` 第 711-714 行（`<select id="permLevel">`）

---

### 2. BI 报表权限模式（侧边栏报表项级别）

| 模式 | 属性值 | 用户体验 |
| --- | --- | --- |
| **可编辑** | `data-perm="edit"` | URL 输入栏可见，可粘贴/修改报表链接 |
| **只读** | `data-perm="view"` | URL 输入栏隐藏，仅可查看 iframe 内容 |

> 实现：`script.js` 第 1003-1012 行 `applyBiPermission()`

---

### 3. 分享弹窗（shareModal，备用，目前未挂载入口）

| 级别 | 说明 |
| --- | --- |
| 可查看 | 只读 |
| 可编辑 | 可编辑 |
| 可管理 | 可管理（含再分享） |
| 所有者 | 报表创建者，不可移除 |

---

## 二、授权对象类型

| 类型 | 数据集 | 说明 |
| --- | --- | --- |
| **用户（user）** | `PERM_USERS`（17 人） | 个体授权，最常用 |
| **部门（department）** | `PERM_DEPARTMENTS`（9 个） | 部门级批量授权 |
| **工作空间（workspace）** | `PERM_WORKSPACES`（5 个） | 整个工作空间共享，无 USE/EDIT/ADMIN 级别 |

> 关键约束：当授权对象 = 工作空间时，权限级别固定为 "—"（`script.js` 第 810 行），UI 上隐藏级别选择控件。

---

## 三、各模块的权限入口

### 3.1 Data Sources

| 入口 | 触发位置 | 行为 |
| --- | --- | --- |
| 账户列表 → "管理权限" 盾牌按钮 | 每个账户行右侧操作列 | 打开 permissionModal，目标 = 账户名 |

### 3.2 Dashboard

| 入口 | 触发位置 | 行为 |
| --- | --- | --- |
| 视图三点菜单 → 管理权限 | 视图项 hover 显示菜单按钮 | 打开 permissionModal，目标 = 视图名 |
| 视图三点菜单 → 分享 | 同上 | 打开 permissionModal，目标 = 视图名 |
| 文件夹三点菜单 → 管理权限 | 文件夹 hover 显示菜单按钮 | 打开 permissionModal，目标 = 文件夹名 |
| 文件夹三点菜单 → 分享 | 同上 | 打开 permissionModal，目标 = 文件夹名 |

### 3.3 BI

| 入口 | 触发位置 | 行为 |
| --- | --- | --- |
| 页面顶部"分享"按钮 | BI 页面 header 右侧 | 打开 permissionModal，目标 = 当前报表名 |
| 报表项三点菜单 → 管理权限 | 侧边栏报表项 hover 菜单 | 打开 permissionModal，目标 = 报表名 |
| 报表项三点菜单 → 分享 | 同上 | 打开 permissionModal，目标 = 报表名 |
| 文件夹三点菜单 → 管理权限/分享 | 复用 Dashboard 文件夹菜单逻辑 | 打开 permissionModal，目标 = 文件夹名 |

> 当前实现：**所有"分享"和"管理权限"入口都统一调用 `openPermissionModal()`**，使用同一个 permissionModal 弹窗。`shareModal` 的 HTML/JS 已存在但没有入口挂载（保留作为未来轻量分享场景的备选）。

---

## 四、可编辑 vs 只读的行为差异（BI 报表）

| 行为 | 可编辑（`data-perm="edit"`） | 只读（`data-perm="view"`） |
| --- | --- | --- |
| URL 输入栏 | 显示，可粘贴新链接 | 隐藏 |
| 副标题文案 | "粘贴报表链接即可嵌入查看" | "只读视图：链接由所有者管理，您可查看但无法编辑" |
| 修改报表链接 | 允许 | 禁止 |
| 查看报表内容 | 允许 | 允许 |
| 侧边栏徽章 | 紫色"编辑笔" | 灰色"眼睛" |

> 用法约定：
> - "我的报表"文件夹下的视图默认按 `edit` 处理（无需声明 `data-perm`）
> - "共享给我"文件夹下的视图必须声明 `data-perm="edit"` 或 `data-perm="view"`

---

## 五、权限管理弹窗结构（permissionModal）

```
permissionModal
├── 标题区
│   ├── 盾牌图标 + "管理权限"
│   └── 副标题：被管理对象名称（动态注入）
├── 当前权限列表（perm-table）
│   ├── 表头：被授权者 | 类型 | 级别 | 操作
│   └── 数据行（每行附"删除"按钮）
└── 授予权限区
    ├── 对象类型 Tab：用户 | 部门 | 工作空间
    ├── 多选搜索组件
    │   ├── 已选标签（可单独移除）
    │   ├── 搜索输入框（实时过滤）
    │   └── 下拉选项列表
    ├── 权限级别下拉（USE / EDIT / ADMIN，工作空间 Tab 下隐藏）
    └── "授予权限"按钮
```

### 当前权限列表的展示

| 列 | 内容 | 样式 |
| --- | --- | --- |
| 被授权者 | 用户名 / 部门名 / 工作空间名 | 普通文本 |
| 类型 | USER / 部门 / 工作空间 | 灰色 badge |
| 级别 | USE / EDIT / ADMIN / — | 绿色 badge 或灰色占位 |
| 操作 | 删除按钮 | 红色图标 |

---

## 六、权限授予流程

1. 用户在某个入口（账户操作 / 右键菜单 / 分享按钮）触发 `openPermissionModal({ name })`
2. 弹窗顶部显示目标名称，下方加载已有权限列表
3. 用户切换 Tab 选择对象类型（用户 / 部门 / 工作空间）
4. 通过多选搜索选择一个或多个对象
5. 用户类型 / 部门类型 → 选择权限级别（USE / EDIT / ADMIN）；工作空间 → 跳过此步
6. 点击"授予权限"
7. 新权限追加到 `CURRENT_PERMISSIONS` 数组并刷新当前权限表格

---

## 七、视觉权限徽章

| 徽章 | CSS 类 | 颜色 | 含义 |
| --- | --- | --- | --- |
| 可编辑 | `.perm-badge.perm-edit` | 紫色（`#ede9fe` / `#7c3aed`） | 共享报表可编辑 |
| 只读 | `.perm-badge.perm-view` | 灰色（`#f3f4f6` / `#6b7280`） | 共享报表只读 |

应用位置：BI 侧边栏 `view-item` 的视图名称右侧（`index.html` 第 215-217 / 225-227 行）

---

## 八、BI 侧边栏的权限分组

| 文件夹 | 含义 | 默认权限 |
| --- | --- | --- |
| **我的报表** | 用户自创的报表 | edit（不需要声明 data-perm） |
| **共享给我** | 他人分享给我的报表 | 必须声明 `data-perm="edit"` 或 `"view"` |

> 设计意图：用文件夹分组直接表达"所有权"，让用户一眼区分自己创建的和别人共享的；权限徽章在共享分组内进一步区分操作权限。

---

## 九、隐性权限边界（非弹窗类）

| 边界 | 实现方式 | 位置 |
| --- | --- | --- |
| iframe 沙箱 | `sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"` | `index.html` 第 393 行 |
| 数据源"即将推出"禁用 | `comingSoon: true` → 卡片加 `.disabled` 类 | `script.js` 第 117 行 / `styles.css` 第 338-347 行 |
| Dashboard 编辑模式 | `isEditMode` 状态切换工具栏视觉 | `script.js` 第 825-849 行 |
| 分享弹窗中"所有者"不可移除 | 当前用户行不渲染删除按钮 | `index.html` 第 599-608 行 |
| 链接分享公开访问 | shareModal 的 checkbox + 公开链接 | `index.html` 第 616-617 行 |

---

## 十、右键菜单权限相关选项汇总

### 视图右键菜单（viewContextMenu）

| 选项 | data-action | 行为 |
| --- | --- | --- |
| 管理权限 | `permission` | 打开 permissionModal |
| 分享 | `share` | 打开 permissionModal |
| 复制 | `duplicate` | 占位（alert） |
| 重命名 | `rename` | 占位 |
| 删除视图 | `delete` | 占位 |

### 文件夹右键菜单（folderContextMenu）

| 选项 | data-action | 行为 |
| --- | --- | --- |
| 重命名 | `folder-rename` | 占位 |
| 复制 | `folder-duplicate` | 占位 |
| 新建视图 | `folder-new-view` | 占位 |
| 管理权限 | `folder-permission` | 打开 permissionModal |
| 分享 | `folder-share` | 打开 permissionModal |
| 删除文件夹 | `folder-delete` | 占位（红色危险样式） |

---

## 十一、待落实 / 可扩展的权限设计

> 以下是当前 UI 已铺垫但后端逻辑未实现的部分，建议在下一轮迭代中明确

1. **权限继承**：文件夹级别授权后，文件夹内的视图/报表是否自动继承？
2. **跨工作空间访问**：当前 workspace 切换器（顶部 "Development"）是否影响权限范围？
3. **链接分享的过期时间**：shareModal 中的公开链接是否需要失效机制？
4. **审计日志**：谁在什么时候授予/撤销了哪些权限，是否需要可视化历史？
5. **权限级别迁移**：当用户已有 USE 权限时再次被授予 EDIT，是替换还是追加？
6. **批量撤销**：当前权限表格只支持单行删除，是否需要多选批量撤销？
7. **管理员越权场景**：ADMIN 用户能否撤销其他 ADMIN 的权限？
8. **离开工作空间**：用户被移除工作空间时，其在该空间内的所有授权如何处理？
9. **权限申请流程**：只读用户能否主动申请 EDIT 权限？
10. **iframe 嵌入策略**：第三方 BI（Quick BI / Looker / Power BI）的 `X-Frame-Options` 限制如何与本系统的权限模型协同？

---

## 十二、文件位置索引

| 模块 | HTML | JS | CSS |
| --- | --- | --- | --- |
| 权限弹窗 permissionModal | 第 633-700 行 | 第 615-815 行 | 第 ~1900 行起 `.modal-permission` |
| 分享弹窗 shareModal | 第 562-631 行 | 第 1136-1214 行 | `.share-section` 等 |
| Dashboard 视图/文件夹菜单 | 第 518-560 行 | `setupDashboard()` | `.context-menu` |
| BI 侧边栏权限徽章 | 第 166-233 行 | `applyBiPermission()` | `.perm-badge` |
| BI URL 栏控制 | `#biPage .bi-url-bar` | `applyBiPermission()` | `.bi-url-bar` |

---

> 后续若新增权限边界，请同步更新本文档，并在 `CURRENT_PERMISSIONS` 数据结构和 `permissionModal` 弹窗中保持一致。
