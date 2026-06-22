/* =============================================
 * 数据源管理页面 - 交互逻辑
 * ============================================= */

// 可用数据源列表（媒体平台）
const MEDIA_SOURCES = [
    {
        key: 'facebook',
        name: 'Facebook Ads',
        desc: '全面访问 Facebook Ads API，用于广告系列管理和效果追踪。',
        svg: '<svg viewBox="0 0 48 48" width="28" height="28"><path fill="#1877F2" d="M24 4C12.95 4 4 12.95 4 24c0 10.02 7.39 18.31 17.02 19.75V30.19h-5.12V24h5.12v-4.71c0-5.05 3.01-7.84 7.61-7.84 2.2 0 4.51.39 4.51.39v4.96h-2.54c-2.5 0-3.28 1.55-3.28 3.14V24h5.58l-.89 6.19h-4.69v13.56C36.61 42.31 44 34.02 44 24c0-11.05-8.95-20-20-20z"/></svg>',
        bg: '#fff'
    },
    {
        key: 'tiktok',
        name: 'TikTok Ads',
        desc: '使用官方 TikTok Marketing API 管理您的 TikTok 广告系列。',
        svg: '<svg viewBox="0 0 48 48" width="28" height="28"><path fill="#000" d="M38.4 21.68c-3.28 0-6.28-1.32-8.44-3.46v15.84c0 7.92-6.44 14.36-14.36 14.36S1.24 42.02 1.24 34.1c0-7.92 6.44-14.36 14.36-14.36.4 0 .8.02 1.2.06v7.08c-.4-.08-.8-.12-1.2-.12-4.02 0-7.28 3.26-7.28 7.28s3.26 7.28 7.28 7.28 7.28-3.26 7.28-7.28V1.24h6.92c.4 6.44 5.64 11.56 12.12 11.56v8.88z"/></svg>',
        bg: '#fff'
    },
    {
        key: 'google',
        name: 'Google Ads',
        desc: '与 Google Ads 全面集成，支持搜索、展示和视频广告系列。',
        svg: '<svg viewBox="0 0 48 48" width="28" height="28"><path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/></svg>',
        bg: '#fff'
    },
    {
        key: 'linkedin',
        name: 'LinkedIn Ads',
        desc: '通过 LinkedIn Marketing Developer Platform 管理您的 B2B 广告系列。',
        svg: '<svg viewBox="0 0 48 48" width="28" height="28"><path fill="#0A66C2" d="M42 37c0 2.762-2.238 5-5 5H11c-2.761 0-5-2.238-5-5V11c0-2.762 2.239-5 5-5h26c2.762 0 5 2.238 5 5v26z"/><path fill="#FFF" d="M12 19h5v17h-5V19zm2.485-3h-.028C12.965 16 12 14.888 12 13.499 12 12.08 12.995 11 14.514 11c1.521 0 2.458 1.08 2.486 2.499C17 14.887 16.035 16 14.485 16zM36 36h-5v-9.099c0-2.198-1.225-3.698-3.192-3.698-1.501 0-2.313 1.012-2.707 1.99-.144.35-.101 1.318-.101 1.807v9h-5V19h5v2.616C25.721 20.5 26.85 19 29.738 19c3.578 0 6.261 2.25 6.261 7.274L36 36z"/></svg>',
        bg: '#fff',
        comingSoon: true
    },
    {
        key: 'twitter',
        name: 'Twitter Ads',
        desc: '连接 Twitter Ads (X Ads) 管理和追踪您的社交媒体广告系列。',
        svg: '<svg viewBox="0 0 48 48" width="28" height="28"><path fill="#000" d="M36.6 8.8L28.4 18.6 38.6 39.2h-8.4l-7.2-13.2-8.4 13.2H6.2l9.2-10.8L6.2 8.8h8.4l6.4 11.6 7.6-11.6h8z"/></svg>',
        bg: '#fff',
        comingSoon: true
    },
    {
        key: 'snapchat',
        name: 'Snapchat Ads',
        desc: '集成 Snapchat Marketing API 管理您的竖屏视频广告系列。',
        svg: '<svg viewBox="0 0 48 48" width="28" height="28"><path fill="#FFFC00" d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4z"/><path fill="#000" d="M24 11c-3.31 0-6 2.69-6 6v6.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5c0-.83-.67-1.5-1.5-1.5S14 22.67 14 23.5c0 1.93 1.57 3.5 3.5 3.5.55 0 1 .45 1 1 0 .28.22.5.5.5h10c.28 0 .5-.22.5-.5 0-.55.45-1 1-1 1.93 0 3.5-1.57 3.5-3.5 0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5V17c0-3.31-2.69-6-6-6z"/></svg>',
        bg: '#fff',
        comingSoon: true
    },
    {
        key: 'adjust',
        name: 'Adjust',
        desc: '移动应用归因和分析平台，用于追踪用户获取和参与度。',
        svg: '<svg viewBox="0 0 48 48" width="28" height="28"><circle fill="#2D87F0" cx="24" cy="24" r="20"/><path fill="#FFF" d="M24 14l-8 8 8 8 8-8-8-8zm0 3.4l4.6 4.6-4.6 4.6-4.6-4.6L24 17.4z"/></svg>',
        bg: '#fff',
        comingSoon: true
    },
    {
        key: 'appsflyer',
        name: 'AppsFlyer',
        desc: '移动归因和营销分析平台，用于应用安装追踪和优化。',
        svg: '<svg viewBox="0 0 48 48" width="28" height="28"><path fill="#00CD86" d="M24 4l-8 8v16l8 8 8-8V12l-8-8zm0 6l4 4v12l-4 4-4-4V14l4-4z"/><circle fill="#00CD86" cx="24" cy="24" r="3"/></svg>',
        bg: '#fff',
        comingSoon: true
    },
    {
        key: 'amazon',
        name: 'Amazon Ads',
        desc: '连接 Amazon Ads，支持 DSP、Sponsored Ads 和 Amazon Marketing Cloud (AMC) 报告。',
        svg: '<svg viewBox="0 0 48 48" width="28" height="28"><path fill="#FF9900" d="M29.5 34c-5.5 4-13.5 6-20.4 6-9.6 0-18.3-3.6-24.8-9.5-.5-.5-.1-1.1.5-.7 7 4.1 15.6 6.5 24.5 6.5 6 0 12.6-1.2 18.7-3.8.9-.4 1.7.6.8 1.3z"/><path fill="#FF9900" d="M31.7 31.5c-.7-.9-4.6-.4-6.4-.2-.5.1-.6-.4-.1-.7 3.1-2.2 8.2-1.6 8.8-.8.6.8-.2 6.3-3.3 8.9-.5.4-.9.2-.7-.3.7-1.7 2.2-5.5 1.5-6.4z"/><path fill="#000" d="M28.4 8v2.3c0 .3.2.5.5.5h5.6c.3 0 .5.2.5.5v11.2c0 .3.2.5.5.5h2.8c.3 0 .5-.2.5-.5V11.3c0-1.8-1.5-3.3-3.3-3.3h-6.6c-.3 0-.5.2-.5.5zm-13.9 14.5c-1.8 0-3.3 1.5-3.3 3.3v.9c0 .3.2.5.5.5h2.8c.3 0 .5-.2.5-.5v-.9c0-.3.2-.5.5-.5h5.6c.3 0 .5.2.5.5v.9c0 .3.2.5.5.5h2.8c.3 0 .5-.2.5-.5v-.9c0-1.8-1.5-3.3-3.3-3.3h-6.6z"/></svg>',
        bg: '#fff'
    },
    {
        key: 'feishu',
        name: '飞书',
        desc: '连接飞书，将电子表格和文档导入为数据集或定时连接器。',
        svg: '<svg viewBox="0 0 48 48" width="28" height="28"><rect fill="#00D6B9" x="4" y="4" width="40" height="40" rx="8"/><path fill="#FFF" d="M24 14c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm0 16c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z"/><circle fill="#FFF" cx="24" cy="24" r="3"/></svg>',
        bg: '#fff'
    }
];

// 其他数据源
const OTHER_SOURCES = [
    {
        key: 'database',
        name: '数据库表',
        desc: '连接外部数据库表（PostgreSQL、MySQL 等）作为图表和管道的数据源。',
        svg: '<svg viewBox="0 0 48 48" width="28" height="28"><ellipse fill="#6366F1" cx="24" cy="10" rx="16" ry="6"/><path fill="#6366F1" d="M8 10v8c0 3.3 7.2 6 16 6s16-2.7 16-6v-8c0 3.3-7.2 6-16 6S8 13.3 8 10z"/><path fill="#6366F1" d="M8 18v8c0 3.3 7.2 6 16 6s16-2.7 16-6v-8c0 3.3-7.2 6-16 6S8 21.3 8 18z"/><path fill="#6366F1" d="M8 26v8c0 3.3 7.2 6 16 6s16-2.7 16-6v-8c0 3.3-7.2 6-16 6S8 29.3 8 26z"/></svg>',
        bg: '#fff'
    }
];

// 数据源账户列表（按平台分组的授权账户）
const ACCOUNTS = [
    {
        platform: 'Facebook',
        platformKey: 'facebook',
        email: 'ads.developer-readonly@te...',
        username: 'Chen Baosui',
        status: 'ACTIVE',
        createdAt: '2026/3/20'
    }
];

// 各平台已授权的详细账户数据
const PLATFORM_ACCOUNTS = {
    google: [
        {
            id: '10156954697849523977',
            type: 'Google 用户',
            email: 'bingy7475@gmail.com',
            status: 'ACTIVE',
            expiry: '0 天后过期',
            adAccounts: 6
        },
        {
            id: '10969662171462430997',
            type: 'Google 用户',
            email: 'weiyuju997@gmail.com',
            status: 'ACTIVE',
            expiry: '0 天后过期',
            adAccounts: 1
        },
        {
            id: '11436637642754935191',
            type: 'Google 用户',
            email: 'alosthusky520@gmail.com',
            status: 'ACTIVE',
            expiry: '已过期',
            adAccounts: 0
        }
    ],
    facebook: [],
    tiktok: [],
    amazon: [],
    feishu: []
};

/* ===== 渲染数据源卡片 ===== */
function renderSourceCard(source) {
    const iconHTML = source.svg
        ? source.svg
        : `<span style="font-size:22px">${source.emoji || '🔗'}</span>`;

    const tagHTML = source.comingSoon
        ? `<span class="tag-coming">即将推出</span>`
        : `<span class="tag-available">可用</span>`;

    const cardClass = source.comingSoon ? 'source-card disabled' : 'source-card';

    return `
        <div class="${cardClass}" data-key="${source.key}" data-coming="${!!source.comingSoon}">
            <div class="source-icon" style="background:${source.bg || '#f9fafb'}">
                ${iconHTML}
            </div>
            <div class="source-info">
                <div class="source-name">
                    <strong>${source.name}</strong>
                    ${tagHTML}
                </div>
                <div class="source-desc">${source.desc}</div>
            </div>
        </div>
    `;
}

function renderSources(tab) {
    const grid = document.getElementById('sourceGrid');
    const list = tab === 'media' ? MEDIA_SOURCES : OTHER_SOURCES;
    grid.innerHTML = list.map(renderSourceCard).join('');

    // 绑定点击：打开数据源详情页
    grid.querySelectorAll('.source-card').forEach(card => {
        card.addEventListener('click', () => {
            if (card.dataset.coming === 'true') {
                return; // 即将推出的不响应点击
            }
            const key = card.dataset.key;
            openSourceDetail(key);
        });
    });
}

/* ===== 渲染账户列表 ===== */
function renderAccounts() {
    const list = document.getElementById('accountList');
    const count = document.getElementById('accountCount');
    count.textContent = `${ACCOUNTS.length} 个账户`;

    list.innerHTML = ACCOUNTS.map(acc => {
        const source = MEDIA_SOURCES.find(s => s.key === acc.platformKey);
        const iconHTML = source && source.svg
            ? source.svg
            : `<span>🔗</span>`;
        return `
            <div class="table-row" data-key="${acc.platformKey}">
                <div class="platform-cell">
                    <div class="source-icon" style="background:${source?.bg || '#f9fafb'}">${iconHTML}</div>
                    <span>${acc.platform}</span>
                </div>
                <div class="cell-text" title="${acc.email}">${acc.email}</div>
                <div class="cell-text">${acc.username}</div>
                <div><span class="status-badge status-active">${acc.status}</span></div>
                <div class="cell-text">${acc.createdAt}</div>
                <div class="action-cell">
                    <button class="icon-btn" title="管理权限" data-action="permission">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </button>
                    <button class="icon-btn" title="刷新" data-action="refresh">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    </button>
                    <button class="icon-btn danger" title="删除" data-action="delete">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // 操作按钮事件
    list.querySelectorAll('.icon-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.dataset.action;
            const row = btn.closest('.table-row');
            const key = row.dataset.key;
            handleAccountAction(action, key);
        });
    });
}

/* ===== 账户操作 ===== */
function handleAccountAction(action, key) {
    const acc = ACCOUNTS.find(a => a.platformKey === key);
    if (!acc) return;

    if (action === 'delete') {
        if (confirm(`确定删除 ${acc.platform} 账户（${acc.username}）吗？`)) {
            const idx = ACCOUNTS.findIndex(a => a.platformKey === key);
            ACCOUNTS.splice(idx, 1);
            renderAccounts();
        }
    } else if (action === 'refresh') {
        const btn = event.currentTarget;
        const svg = btn.querySelector('svg');
        svg.style.transition = 'transform 0.6s';
        svg.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            svg.style.transition = '';
            svg.style.transform = '';
            alert(`${acc.platform} 账户已刷新`);
        }, 600);
    } else if (action === 'auth' || action === 'permission') {
        openPermissionModal(acc);
    }
}

/* ===== 数据源详情页 ===== */
let currentDetailPlatform = null;

function openSourceDetail(platformKey) {
    currentDetailPlatform = platformKey;
    const source = [...MEDIA_SOURCES, ...OTHER_SOURCES].find(s => s.key === platformKey);
    if (!source) return;

    const accounts = PLATFORM_ACCOUNTS[platformKey] || [];
    
    // 更新页面标题和图标
    document.getElementById('detailPlatformIcon').innerHTML = source.svg;
    document.getElementById('detailPlatformIcon').style.background = source.bg || '#f9fafb';
    document.getElementById('detailPlatformTitle').textContent = `${source.name} 账户`;
    document.getElementById('detailPlatformSubtitle').textContent = `管理已连接的 ${source.name} 账户`;
    
    // 更新空状态
    document.getElementById('detailEmptyIcon').innerHTML = source.svg;
    document.getElementById('detailEmptyTitle').textContent = `暂无 ${source.name} 账户`;
    document.getElementById('detailEmptyDesc').textContent = `连接您的第一个 ${source.name} 账户，开始同步广告账户和广告系列数据。`;
    document.getElementById('btnDetailConnectText').textContent = `连接 ${source.name} 账户`;
    
    // 显示账户列表或空状态
    const emptyState = document.getElementById('detailEmptyState');
    const accountList = document.getElementById('detailAccountList');
    
    if (accounts.length === 0) {
        emptyState.style.display = 'flex';
        accountList.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        accountList.style.display = 'flex';
        renderDetailAccounts(platformKey, accounts);
    }
    
    // 切换到详情页
    switchPage('sourceDetail');
}

function renderDetailAccounts(platformKey, accounts) {
    const container = document.getElementById('detailAccountList');
    
    container.innerHTML = accounts.map(acc => {
        const initial = acc.email ? acc.email.charAt(0).toUpperCase() : 'U';
        const avatarClass = `source-detail-account-avatar ${platformKey}`;
        const expiryBadge = acc.expiry === '已过期' 
            ? `<span class="badge-expired">已过期</span>`
            : `<span class="badge-expiry">${acc.expiry}</span>`;
        
        return `
            <div class="source-detail-account-item">
                <div class="source-detail-account-left">
                    <div class="${avatarClass}">${initial}</div>
                    <div class="source-detail-account-info">
                        <div class="source-detail-account-name">${acc.type}</div>
                        <div class="source-detail-account-meta">
                            <span>${acc.email}</span>
                            <span>ID: ${acc.id}</span>
                        </div>
                        <div class="source-detail-account-badges">
                            <span class="badge-active">${acc.status}</span>
                            ${expiryBadge}
                        </div>
                    </div>
                </div>
                <div class="source-detail-account-right">
                    <div class="account-ad-count">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                        <span>广告账户 (${acc.adAccounts})</span>
                    </div>
                    <button class="account-refresh-btn" title="刷新">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function setupSourceDetail() {
    // 返回按钮
    document.getElementById('btnBackToSources').addEventListener('click', () => {
        switchPage('sources');
        currentDetailPlatform = null;
    });
    
    // 刷新按钮
    document.getElementById('btnDetailRefresh').addEventListener('click', () => {
        if (currentDetailPlatform) {
            alert(`正在刷新 ${currentDetailPlatform} 账户...`);
        }
    });
    
    // 添加账户按钮（详情页头部）
    document.getElementById('btnDetailAddAccount').addEventListener('click', () => {
        if (currentDetailPlatform) {
            openOauthPage(currentDetailPlatform);
        }
    });
    
    // 连接账户按钮（空状态）
    document.getElementById('btnDetailConnect').addEventListener('click', () => {
        if (currentDetailPlatform) {
            openOauthPage(currentDetailPlatform);
        }
    });
}

/* ===== OAuth 授权页面 ===== */
function openOauthPage(platformKey) {
    const source = [...MEDIA_SOURCES, ...OTHER_SOURCES].find(s => s.key === platformKey);
    if (!source) return;

    // 更新页面内容
    document.getElementById('oauthPageTitle').textContent = `连接 ${source.name}`;
    document.getElementById('oauthPlatformIcon').innerHTML = source.svg;
    document.getElementById('oauthCardTitle').textContent = `连接到 ${source.name}`;
    document.getElementById('oauthCardDesc').textContent = `授权 Creatiads 访问您的 ${source.name} 广告账户和营销数据。`;
    document.getElementById('oauthConnectText').textContent = `使用 ${source.name.split(' ')[0]} 连接`;

    // 确保显示请求卡片，隐藏成功卡片
    document.getElementById('oauthRequestCard').style.display = '';
    document.getElementById('oauthSuccessCard').style.display = 'none';
    document.querySelector('.oauth-title-bar').style.display = '';

    // 显示 OAuth 页面
    document.getElementById('oauthPage').classList.add('show');
}

function closeOauthPage() {
    document.getElementById('oauthPage').classList.remove('show');
}

function showOauthSuccess(source) {
    // 更新成功卡片内容
    document.getElementById('oauthSuccessTitle').textContent = `${source.name} 账户连接成功！`;
    document.getElementById('oauthSuccessDesc').textContent = `您的 ${source.name} 账户已成功授权。您现在可以同步广告数据并查看效果分析。`;
    document.getElementById('oauthSuccessAccountEmail').textContent = 'new.user@example.com';
    document.getElementById('oauthSuccessPlatform').textContent = source.name;

    // 切换卡片显示
    document.getElementById('oauthRequestCard').style.display = 'none';
    document.getElementById('oauthSuccessCard').style.display = '';
    document.querySelector('.oauth-title-bar').style.display = 'none';
}

function setupOauthPage() {
    // 返回按钮
    document.getElementById('btnOauthBack').addEventListener('click', closeOauthPage);

    // 取消按钮
    document.getElementById('btnOauthCancel').addEventListener('click', closeOauthPage);

    // 连接按钮 - 模拟授权成功，显示成功页
    document.getElementById('btnOauthConnect').addEventListener('click', () => {
        const source = [...MEDIA_SOURCES, ...OTHER_SOURCES].find(s => s.key === currentDetailPlatform);
        if (!source) return;

        // 模拟新增账户
        if (!PLATFORM_ACCOUNTS[source.key]) {
            PLATFORM_ACCOUNTS[source.key] = [];
        }
        PLATFORM_ACCOUNTS[source.key].push({
            id: String(Math.floor(Math.random() * 99999999999)),
            type: `${source.name} 用户`,
            email: 'new.user@example.com',
            status: 'ACTIVE',
            expiry: '30 天后过期',
            adAccounts: 0
        });

        const today = new Date();
        const dateStr = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
        ACCOUNTS.push({
            platform: source.name,
            platformKey: source.key,
            email: 'new.user@example.com',
            username: 'New User',
            status: 'ACTIVE',
            createdAt: dateStr
        });
        renderAccounts();

        // 显示成功卡片
        showOauthSuccess(source);
    });

    // 查看账户按钮 - 回到详情页
    document.getElementById('btnOauthViewAccount').addEventListener('click', () => {
        closeOauthPage();
        openSourceDetail(currentDetailPlatform);
    });

    // 前往仪表盘按钮
    document.getElementById('btnOauthGoDashboard').addEventListener('click', () => {
        closeOauthPage();
        currentDetailPlatform = null;
        switchPage('dashboard');
    });
}

/* ===== Tab 切换 ===== */
function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderSources(tab.dataset.tab);
        });
    });
}

/* ===== 侧边栏交互 ===== */
function setupSidebar() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const key = item.dataset.key;
            if (key === 'dashboard') {
                document.querySelectorAll('.sub-item').forEach(i => i.classList.remove('active'));
                switchPage('dashboard');
            } else if (key === 'bi') {
                switchPage('bi');
            } else if (key === 'data') {
                switchPage('autoReport');
            } else if (key === 'ad-studio') {
                // 主菜单点 Ad Studio → 默认显示 Amazon DSP 子项
                document.querySelectorAll('.sub-item').forEach(i => i.classList.remove('active'));
                const amz = document.querySelector('.sub-item[data-ads-key="amazon"]');
                if (amz) amz.classList.add('active');
                switchPage('ad-studio-amazon');
            }
        });
    });

    // Data 侧边栏子项
    document.querySelectorAll('.sub-item[data-key]').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.sub-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            switchPage(item.dataset.key);
        });
    });

    // Ad Studio 子菜单
    document.querySelectorAll('.sub-item[data-ads-key]').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.sub-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const k = item.dataset.adsKey;
            switchPage(k === 'amazon' ? 'ad-studio-amazon' : 'ad-studio-facebook');
        });
    });

    // BI 侧边栏报表项点击
    document.querySelectorAll('#biSidebar .view-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('#biSidebar .view-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            // 更新 BI 页面标题
            const nameEl = item.querySelector('span:not(.perm-badge)');
            const titleEl = document.getElementById('biTitle');
            if (titleEl && nameEl) titleEl.textContent = nameEl.textContent;

            const url = item.dataset.reportUrl;
            const perm = item.dataset.perm || 'edit';
            applyBiPermission(perm);
            if (url) {
                loadBiFrame(url);
            } else {
                clearBiFrame();
            }
        });
    });

    // 折叠按钮
    const collapseBtn = document.querySelector('.collapse-btn');
    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar-secondary');
            sidebar.style.display = sidebar.style.display === 'none' ? '' : 'none';
        });
    }
}

/* ===== 页面切换 ===== */
function switchPage(key) {
    const autoReportPage = document.getElementById('autoReportPage');
    const sourcesPage = document.getElementById('sourcesPage');
    const sourceDetailPage = document.getElementById('sourceDetailPage');
    const connectorsPage = document.getElementById('connectorsPage');
    const dashboardPage = document.getElementById('dashboardPage');
    const biPage = document.getElementById('biPage');
    const adStudioPage = document.getElementById('adStudioPage');
    const adStudioAmazonPage = document.getElementById('adStudioAmazonPage');
    const dataSidebar = document.getElementById('dataSidebar');
    const dashboardSidebar = document.getElementById('dashboardSidebar');
    const biSidebar = document.getElementById('biSidebar');
    const adStudioSidebar = document.getElementById('adStudioSidebar');

    autoReportPage.style.display = 'none';
    sourcesPage.style.display = 'none';
    sourceDetailPage.style.display = 'none';
    connectorsPage.style.display = 'none';
    dashboardPage.style.display = 'none';
    biPage.style.display = 'none';
    if (adStudioPage) adStudioPage.style.display = 'none';
    if (adStudioAmazonPage) adStudioAmazonPage.style.display = 'none';
    dataSidebar.style.display = 'none';
    dashboardSidebar.style.display = 'none';
    biSidebar.style.display = 'none';
    if (adStudioSidebar) adStudioSidebar.style.display = 'none';

    if (key === 'autoReport') {
        autoReportPage.style.display = '';
        dataSidebar.style.display = '';
    } else if (key === 'connectors') {
        connectorsPage.style.display = '';
        dataSidebar.style.display = '';
    } else if (key === 'sources') {
        sourcesPage.style.display = '';
        dataSidebar.style.display = '';
    } else if (key === 'sourceDetail') {
        sourceDetailPage.style.display = '';
        dataSidebar.style.display = '';
    } else if (key === 'dashboard') {
        dashboardPage.style.display = '';
        dashboardSidebar.style.display = '';
    } else if (key === 'bi') {
        biPage.style.display = '';
        biSidebar.style.display = '';
    } else if (key === 'ad-studio' || key === 'ad-studio-facebook') {
        if (adStudioPage) adStudioPage.style.display = '';
        if (adStudioSidebar) adStudioSidebar.style.display = '';
    } else if (key === 'ad-studio-amazon') {
        if (adStudioAmazonPage) adStudioAmazonPage.style.display = '';
        if (adStudioSidebar) adStudioSidebar.style.display = '';
    } else {
        dataSidebar.style.display = '';
        alert(`\u300C${key}\u300D\u9875\u9762\u6B63\u5728\u5F00\u53D1\u4E2D`);
    }
}

/* ===== 添加数据源弹窗 ===== */
function renderVerticalCard(source) {
    const iconHTML = source.svg
        ? source.svg
        : `<span style="font-size:22px">${source.emoji || '🔗'}</span>`;
    return `
        <div class="source-card-v" data-key="${source.key}">
            <div class="source-icon" style="background:${source.bg || '#f9fafb'}">
                ${iconHTML}
            </div>
            <div class="source-name">${source.name}</div>
            <div class="source-desc">${source.desc}</div>
            <span class="source-tag">可用</span>
        </div>
    `;
}

function getAvailableSources() {
    return [...MEDIA_SOURCES, ...OTHER_SOURCES].filter(s => !s.comingSoon);
}

/* 连接器添加流程只展示这几个数据源 */
const CONNECTOR_SOURCE_KEYS = ['facebook', 'google', 'tiktok', 'amazon', 'feishu'];

function getConnectorSources() {
    return [...MEDIA_SOURCES, ...OTHER_SOURCES].filter(s => CONNECTOR_SOURCE_KEYS.includes(s.key));
}

function renderModalGrid(keyword) {
    const grid = document.getElementById('modalGrid');
    const kw = (keyword || '').trim().toLowerCase();
    const sources = getConnectorSources().filter(s =>
        s.name.toLowerCase().includes(kw) || s.desc.toLowerCase().includes(kw)
    );
    if (sources.length === 0) {
        grid.innerHTML = '<div class="modal-empty">没有匹配的数据源</div>';
        return;
    }
    grid.innerHTML = sources.map(renderVerticalCard).join('');
    grid.querySelectorAll('.source-card-v').forEach(card => {
        card.addEventListener('click', () => {
            const key = card.dataset.key;
            const source = getConnectorSources().find(s => s.key === key);
            closeModal();
            // 选择数据源后，拉出配置连接器抽屉
            openConnectorConfig(source);
        });
    });
}

/* ===== 连接器配置抽屉 ===== */
// 媒体平台 key → config-modal 支持的 platform 参数
const CONFIG_PLATFORM_MAP = {
    facebook: 'facebook',
    google: 'google',
    tiktok: 'tiktok',
    amazon: 'amazon'
};

function openConnectorConfig(source) {
    if (!source) return;
    // 飞书走专属表单抽屉
    if (source.key === 'feishu') {
        openFeishuConfig(source);
        return;
    }
    const platform = CONFIG_PLATFORM_MAP[source.key];
    if (!platform) {
        // 其他数据源（如数据库表）暂用占位提示
        alert(`「${source.name}」的连接器配置稍后接入`);
        return;
    }
    const mask = document.getElementById('connDrawerMask');
    const drawer = document.getElementById('connDrawer');
    const frame = document.getElementById('connConfigFrame');
    if (!mask || !drawer || !frame) return;
    // 通过 URL 参数告诉配置页当前是哪个平台（标题/字段随之匹配）
    frame.src = `connector-demo/config-modal.html?platform=${platform}`;
    mask.classList.add('show');
    void drawer.offsetWidth;
    drawer.classList.add('open');
}

function closeConnectorConfig() {
    const mask = document.getElementById('connDrawerMask');
    const drawer = document.getElementById('connDrawer');
    if (!mask || !drawer) return;
    drawer.classList.remove('open');
    mask.classList.remove('show');
}

/* 飞书：专属表单抽屉（与媒体平台格式不同） */
function openFeishuConfig(source) {
    const mask = document.getElementById('connDrawerMask');
    const drawer = document.getElementById('connDrawer');
    const frame = document.getElementById('connConfigFrame');
    if (!mask || !drawer || !frame) return;
    frame.src = 'connector-demo/config-feishu.html';
    mask.classList.add('show');
    void drawer.offsetWidth;
    drawer.classList.add('open');
}

function openAddModal(presetKey) {
    const modal = document.getElementById('addModal');
    const searchInput = document.getElementById('modalSearch');
    searchInput.value = '';
    renderModalGrid('');
    modal.classList.add('show');
}

function closeModal() {
    document.getElementById('addModal').classList.remove('show');
}

function simulateAddAccount(source) {
    if (!source) return;
    const ok = confirm(`即将连接「${source.name}」，跳转至授权页面？`);
    if (!ok) return;

    // 模拟新增账户
    const today = new Date();
    const dateStr = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
    ACCOUNTS.push({
        platform: source.name,
        platformKey: source.key,
        email: 'new.user@example.com',
        username: 'New User',
        status: 'ACTIVE',
        createdAt: dateStr
    });
    renderAccounts();

    // 同步到 PLATFORM_ACCOUNTS
    if (!PLATFORM_ACCOUNTS[source.key]) {
        PLATFORM_ACCOUNTS[source.key] = [];
    }
    PLATFORM_ACCOUNTS[source.key].push({
        id: String(Math.floor(Math.random() * 9999999999)),
        type: `${source.name} 用户`,
        email: 'new.user@example.com',
        status: 'ACTIVE',
        expiry: '30 天后过期',
        adAccounts: 0
    });

    // 如果当前在详情页，刷新详情页
    if (currentDetailPlatform === source.key) {
        openSourceDetail(source.key);
    }
}

function setupModal() {
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.querySelector('#addModal .modal-mask').addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // 搜索过滤
    document.getElementById('modalSearch').addEventListener('input', (e) => {
        renderModalGrid(e.target.value);
    });

    // 添加连接器按钮
    const btnAdd = document.getElementById('btnAddConnector');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => openAddModal());
    }

    // 连接器配置抽屉：点遮罩关闭
    const connMask = document.getElementById('connDrawerMask');
    if (connMask) {
        connMask.addEventListener('click', closeConnectorConfig);
    }
    // 接收 iframe 内部的关闭/创建消息
    window.addEventListener('message', (e) => {
        const t = e.data && e.data.type;
        if (t === 'connector-config-close' || t === 'connector-config-created') {
            closeConnectorConfig();
        }
    });
}

/* ===== Connectors 数据 ===== */
const CONNECTORS = [
    {
        id: 1,
        name: 'Facebook Test - Adme...',
        platformKey: 'facebook',
        type: 'FACEBOOK INSIGHTS',
        typeBadge: 'CUSTOM',
        schedule: 'daily',
        nextRun: '2026/5/19 11:49:00',
        lastRun: '2026/5/18 11:49:00',
        lastRunAgo: '4h ago',
        timeRange: 'Last 7 days',
        status: 'ACTIVE',
        successCount: 7,
        errorCount: 0
    },
    {
        id: 2,
        name: 'test',
        platformKey: 'feishu',
        type: 'FEISHU SHEET',
        typeBadge: 'FEISHU_SHEET',
        schedule: 'daily',
        nextRun: '2026/5/19 06:07:00',
        lastRun: '2026/5/18 06:07:00',
        lastRunAgo: '9h ago',
        timeRange: 'Default',
        status: 'ACTIVE',
        successCount: 5,
        errorCount: 0
    }
];

/* ===== 渲染连接器列表 ===== */
function renderConnectors() {
    const list = document.getElementById('connectorList');
    const total = document.getElementById('connectorTotal');
    total.textContent = CONNECTORS.length;

    list.innerHTML = CONNECTORS.map(conn => {
        const source = MEDIA_SOURCES.find(s => s.key === conn.platformKey);
        const iconHTML = source && source.svg ? source.svg : '<span>🔗</span>';

        return `
            <div class="table-row" data-id="${conn.id}">
                <div><input type="checkbox" class="row-checkbox"></div>
                <div class="connector-cell">
                    <div class="connector-icon">${iconHTML}</div>
                    <div class="connector-info">
                        <strong>${conn.name}</strong>
                        <small>
                            <span style="color:#059669">✓ ${conn.successCount}</span>
                            <span style="color:#dc2626; margin-left:6px">✕ ${conn.errorCount}</span>
                        </small>
                    </div>
                </div>
                <div>
                    <div class="cell-text" style="font-weight:500">${conn.type}</div>
                    <span class="type-badge">${conn.typeBadge}</span>
                </div>
                <div>
                    <span class="schedule-badge">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        ${conn.schedule}
                    </span>
                </div>
                <div class="time-text">${conn.nextRun}</div>
                <div class="time-text">${conn.lastRun}<small>${conn.lastRunAgo}</small></div>
                <div><span class="range-badge">${conn.timeRange}</span></div>
                <div><span class="status-badge status-active">${conn.status}</span></div>
                <div class="action-cell">
                    <button class="icon-btn" title="查看">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button class="icon-btn" title="编辑">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="icon-btn" title="立即执行">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    </button>
                    <button class="icon-btn" title="暂停">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    </button>
                    <button class="icon-btn" title="更多">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/* ===== 初始化 ===== */
document.addEventListener('DOMContentLoaded', () => {
    renderSources('media');
    renderAccounts();
    renderConnectors();
    setupTabs();
    setupSidebar();
    setupModal();
    setupSourceDetail();
    setupOauthPage();
    setupPermissionModal();
    setupCustomSelects();
    setupDashboard();
    setupBI();
});

/* ===== iframe 跨窗口消息监听（Auto Report → 授权页 / 导航切换 / 显示报表） ===== */
window.addEventListener('message', (event) => {
    if (!event.data || !event.data.type) return;
    if (event.data.type === 'creatiads-open-oauth' && event.data.platformKey) {
        openOauthPage(event.data.platformKey);
    } else if (event.data.type === 'creatiads-show-report' && event.data.report) {
        // iframe 请求显示报表 → 切换到 Dashboard 并渲染
        renderAutoReportInDashboard(event.data.report);
        // 切换到 dashboard 页面
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const dashItem = document.querySelector('.nav-item[data-key="dashboard"]');
        if (dashItem) dashItem.classList.add('active');
        switchPage('dashboard');
    } else if (event.data.type === 'creatiads-switch-nav') {
        const target = event.data.target;
        if (target === 'autoReport') {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            const dataItem = document.querySelector('.nav-item[data-key="data"]');
            if (dataItem) dataItem.classList.add('active');
            document.querySelectorAll('.sub-item').forEach(i => i.classList.remove('active'));
            const arItem = document.querySelector('.sub-item[data-key="autoReport"]');
            if (arItem) arItem.classList.add('active');
        }
    } else if (event.data.type === 'ad-studio-back') {
        // Ad Studio 内部「返回」→ 回到 Dashboard
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const dashItem = document.querySelector('.nav-item[data-key="dashboard"]');
        if (dashItem) dashItem.classList.add('active');
        switchPage('dashboard');
    }
});

/* ===== 渲染 Auto Report 生成的报表到 Dashboard ===== */
const AUTO_REPORT_MOCK_VALUES = {
    '展示量 Impressions':'2.4M','点击量 Clicks':'76.8K','花费 Cost':'¥128.5K',
    '点击率 CTR':'3.2%','平均点击成本 Avg.CPC':'¥2.8','平均千次展示成本 Avg.CPM':'¥18.6',
    '转化量 Conversions':'1,847','每次转化费用 Cost/Conv.':'¥69.5',
    '视频25%播放 Video P25':'68.4%','视频50%播放 Video P50':'52.1%',
    '视频75%播放 Video P75':'38.6%','视频完播 Video P100':'24.3%',
    '平均观看时长 Avg.Watch Time':'12.8s'
};
const AUTO_REPORT_MOCK_CHANGES = {
    '展示量 Impressions':'+8.7%','点击量 Clicks':'+6.4%','花费 Cost':'+12.3%',
    '点击率 CTR':'-0.3%','平均点击成本 Avg.CPC':'-5.1%','平均千次展示成本 Avg.CPM':'+3.2%',
    '转化量 Conversions':'+15.2%','每次转化费用 Cost/Conv.':'-8.4%',
    '视频25%播放 Video P25':'+4.2%','视频50%播放 Video P50':'+2.8%',
    '视频75%播放 Video P75':'+1.5%','视频完播 Video P100':'+0.9%',
    '平均观看时长 Avg.Watch Time':'+1.2s'
};

function renderAutoReportInDashboard(report) {
    const content = document.querySelector('#dashboardPage .dashboard-content');
    if (!content) return;

    const metrics = report.metrics || [];
    const dims = report.dimensions || [];
    const platforms = report.platforms || [];
    const style = report.style || 'comprehensive';

    const isPos = (v) => v && v.startsWith('+');
    const v = (m) => AUTO_REPORT_MOCK_VALUES[m] || '--';
    const c = (m) => AUTO_REPORT_MOCK_CHANGES[m] || '';

    // 头部：报表标题 + 元数据 + 编辑按钮
    let html = `
        <div class="auto-report-header" style="margin-bottom:20px;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;">
                <div>
                    <h2 style="font-size:18px;font-weight:600;margin-bottom:4px;color:#111827;">${report.name}</h2>
                    <div style="font-size:12px;color:#6b7280;">${platforms.join(', ')} · ${report.dateRange} · 同步: ${{'hourly':'每小时','daily':'每日','weekly':'每周'}[report.syncFrequency]||'每日'} · 更新于 ${new Date().toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <button class="btn btn-ghost btn-sm" onclick="editAutoReportFromDashboard()" title="二次编辑配置">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    编辑配置
                </button>
            </div>
        </div>
    `;

    // KPI 卡片
    html += '<div class="auto-report-kpi-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">';
    metrics.slice(0, 8).forEach(m => {
        const change = c(m);
        const color = isPos(change) ? '#16a34a' : '#dc2626';
        html += `
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:14px;">
                <div style="font-size:11px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m}</div>
                <div style="font-size:20px;font-weight:700;margin-top:4px;color:#111827;">${v(m)}</div>
                <div style="font-size:11px;margin-top:2px;color:${color};">${change}</div>
            </div>
        `;
    });
    html += '</div>';

    // 趋势图
    if (style === 'trend' || style === 'comprehensive') {
        const bars = [40,55,45,60,52,70,65,80,72,90,85,95,88,78];
        html += `
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:18px;margin-bottom:16px;">
                <div style="font-size:13px;font-weight:600;margin-bottom:14px;color:#111827;">${metrics[0]||'指标'} 趋势</div>
                <div style="height:180px;display:flex;align-items:flex-end;gap:4px;padding:0 8px;">
                    ${bars.map(h => `<div style="flex:1;background:#d1d5db;border-radius:3px 3px 0 0;height:${h}%;"></div>`).join('')}
                </div>
                <div style="display:flex;justify-content:space-between;font-size:10px;color:#9ca3af;margin-top:6px;padding:0 8px;">
                    <span>05/14</span><span>05/21</span><span>05/28</span>
                </div>
            </div>
        `;
    }

    // 平台对比
    if (style === 'comparison' || style === 'comprehensive') {
        html += `
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:18px;margin-bottom:16px;">
                <div style="font-size:13px;font-weight:600;margin-bottom:14px;color:#111827;">平台对比</div>
                <div style="display:flex;flex-direction:column;gap:12px;">
        `;
        platforms.forEach((pname, idx) => {
            const widths = [85, 72, 64, 50, 40];
            const w = widths[idx] || (40 + Math.floor(Math.random() * 50));
            html += `
                <div style="display:flex;align-items:center;gap:12px;">
                    <span style="font-size:12px;width:120px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${pname}</span>
                    <div style="flex:1;height:24px;background:#f3f4f6;border-radius:4px;">
                        <div style="height:100%;background:#374151;border-radius:4px;width:${w}%;"></div>
                    </div>
                    <span style="font-size:12px;font-weight:500;width:48px;text-align:right;">${w}%</span>
                </div>
            `;
        });
        html += '</div></div>';
    }

    // 明细表
    if (style === 'detail' || style === 'comprehensive') {
        html += `
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:16px;">
                <div style="padding:14px 18px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:600;color:#111827;">明细数据</div>
                <div style="overflow-x:auto;">
                    <table style="width:100%;font-size:12px;border-collapse:collapse;">
                        <thead style="background:#f9fafb;">
                            <tr>
                                <th style="text-align:left;padding:10px 16px;font-weight:500;color:#6b7280;">${dims[0]||'维度'}</th>
                                ${metrics.slice(0,5).map(m => `<th style="text-align:right;padding:10px 16px;font-weight:500;color:#6b7280;">${m}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
        `;
        ['2026/05/28','2026/05/27','2026/05/26','2026/05/25','2026/05/24'].forEach(d => {
            html += `<tr style="border-top:1px solid #e5e7eb;"><td style="padding:10px 16px;">${d}</td>`;
            metrics.slice(0,5).forEach(m => { html += `<td style="text-align:right;padding:10px 16px;">${v(m)}</td>`; });
            html += '</tr>';
        });
        html += '</tbody></table></div></div>';
    }

    content.innerHTML = html;

    // 在 Dashboard 左侧 sidebar 视图列表中添加/高亮该报表
    addAutoReportToSidebar(report);

    // 缓存当前报表，供 editAutoReportFromDashboard 用
    window._currentAutoReport = report;
}

function addAutoReportToSidebar(report) {
    const viewList = document.querySelector('#dashboardSidebar .view-list');
    if (!viewList) return;
    const id = 'auto-report-' + (report.name || '').replace(/\s+/g,'-');
    // 取消所有 active
    viewList.querySelectorAll('.view-item').forEach(i => i.classList.remove('active'));
    // 已存在则只高亮
    let item = viewList.querySelector('[data-view="' + id + '"]');
    if (!item) {
        item = document.createElement('div');
        item.className = 'view-item';
        item.setAttribute('data-view', id);
        item.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 17V9M12 17v-5M16 17v-3"/></svg>
            <span>${report.name}</span>
            <button class="view-menu-btn">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
        `;
        item.addEventListener('click', () => {
            viewList.querySelectorAll('.view-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            renderAutoReportInDashboard(report);
        });
        viewList.appendChild(item);
        // 更新计数
        const count = viewList.parentElement.querySelector('.folder-count');
        if (count) count.textContent = viewList.querySelectorAll('.view-item').length;
    }
    item.classList.add('active');
}

function editAutoReportFromDashboard() {
    // 跳回 Auto Report 配置页
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const dataItem = document.querySelector('.nav-item[data-key="data"]');
    if (dataItem) dataItem.classList.add('active');
    document.querySelectorAll('.sub-item').forEach(i => i.classList.remove('active'));
    const arItem = document.querySelector('.sub-item[data-key="autoReport"]');
    if (arItem) arItem.classList.add('active');
    switchPage('autoReport');
    // 通知 iframe 进入编辑模式（可选，先不实现 deep-link，让用户手动选历史报表的"编辑配置"）
}

/* ===== 自定义下拉 ===== */
function setupCustomSelects() {
    document.querySelectorAll('.custom-select').forEach(cs => {
        const trigger = cs.querySelector('.cs-trigger');
        const valueEl = cs.querySelector('.cs-value');
        const options = cs.querySelectorAll('.cs-option');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // 关闭其他打开的下拉
            document.querySelectorAll('.custom-select.open').forEach(other => {
                if (other !== cs) other.classList.remove('open');
            });
            cs.classList.toggle('open');
        });

        options.forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                options.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                valueEl.textContent = opt.textContent;
                cs.classList.remove('open');
                // 触发事件
                cs.dispatchEvent(new CustomEvent('change', {
                    detail: { value: opt.dataset.value, label: opt.textContent }
                }));
            });
        });
    });

    // 点击外部关闭所有下拉
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select.open').forEach(cs => cs.classList.remove('open'));
    });
}

/* =============================================
 * 权限管理弹窗
 * ============================================= */

// 模拟数据：用户、部门、工作空间
const PERM_USERS = [
    { id: 'u1', label: '蔡雨廷 (theodore.cai@tec-do.com)' },
    { id: 'u2', label: '王涛 (theo.wang@tec-do.com)' },
    { id: 'u3', label: '李欣茹 (claire.lee@tec-do.com)' },
    { id: 'u4', label: '邹依洁 (jenny.zou@tec-do.com)' },
    { id: 'u5', label: '牛建 (shawn.rorschach@tec-do.com)' },
    { id: 'u6', label: '王珈慧 (celia.wang@tec-do.com)' },
    { id: 'u7', label: '杜铮威 (david.du@tec-do.com)' },
    { id: 'u8', label: 'bing (bingy7475@gmail.com)' },
    { id: 'u9', label: '李彦葳 (ellie.li@tec-do.com)' },
    { id: 'u10', label: '魏育炬 (martin.wei@tec-do.com)' },
    { id: 'u11', label: 'kimcy (kimcy.wei@tec-do.com)' },
    { id: 'u12', label: '陈登科 (dekker.chen@tec-do.com)' },
    { id: 'u13', label: '杨璞 (carrie.yang@tec-do.com)' },
    { id: 'u14', label: '王雪 (nora.wang@tec-do.com)' },
    { id: 'u15', label: '黄苏出 (sammy.huang@tec-do.com)' },
    { id: 'u16', label: 'Developer (developer@free.com)' },
    { id: 'u17', label: '王莹颖 (annie.wang1@tec-do.com)' }
];

const PERM_DEPARTMENTS = [
    { id: 'd1', label: '产品研发部' },
    { id: 'd2', label: '算法工程部' },
    { id: 'd3', label: '数据分析部' },
    { id: 'd4', label: '市场营销部' },
    { id: 'd5', label: '客户成功部' },
    { id: 'd6', label: '设计部' },
    { id: 'd7', label: '运营部' },
    { id: 'd8', label: '人力资源部' },
    { id: 'd9', label: '财务部' }
];

const PERM_WORKSPACES = [
    { id: 'w1', label: 'Development' },
    { id: 'w2', label: 'Production' },
    { id: 'w3', label: 'Staging' },
    { id: 'w4', label: 'QA Testing' },
    { id: 'w5', label: 'Sandbox' }
];

// 当前权限列表（示例数据）
const CURRENT_PERMISSIONS = [
    { grantee: '王涛', type: 'USER', level: 'USE' },
    { grantee: 'Development', type: '工作空间', level: '—' }
];

let currentPermType = 'user';
let msSelected = []; // 当前已选项 [{id, label}]
let msFilteredOptions = [];

function openPermissionModal(account) {
    const modal = document.getElementById('permissionModal');
    const target = (account && (account.name || account.username || account.platform)) || '';
    document.getElementById('permissionTarget').textContent = target;
    renderPermTable();
    switchPermType('user');
    modal.classList.add('show');
}

function closePermissionModal() {
    document.getElementById('permissionModal').classList.remove('show');
    closeMsDropdown();
}

function renderPermTable() {
    const body = document.getElementById('permTableBody');
    body.innerHTML = CURRENT_PERMISSIONS.map((p, idx) => `
        <div class="perm-row">
            <div>${p.grantee}</div>
            <div><span class="badge-type">${p.type}</span></div>
            <div>${p.level === '—' ? '<span class="badge-empty">—</span>' : `<span class="badge-level">${p.level}</span>`}</div>
            <div>
                <button class="icon-btn danger" data-perm-idx="${idx}" title="删除">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/></svg>
                </button>
            </div>
        </div>
    `).join('');

    body.querySelectorAll('[data-perm-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = +btn.dataset.permIdx;
            if (confirm(`确定删除 ${CURRENT_PERMISSIONS[idx].grantee} 的权限？`)) {
                CURRENT_PERMISSIONS.splice(idx, 1);
                renderPermTable();
            }
        });
    });
}

function switchPermType(type) {
    currentPermType = type;
    document.querySelectorAll('.perm-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.permType === type);
    });
    const labelMap = { user: '选择用户', department: '选择部门', workspace: '选择工作空间' };
    const placeholderMap = {
        user: '搜索用户姓名或邮箱...',
        department: '搜索部门...',
        workspace: '搜索工作空间...'
    };
    document.getElementById('permGranteeLabel').textContent = labelMap[type];
    document.getElementById('msInput').placeholder = placeholderMap[type];
    msSelected = [];
    renderMsTags();
    renderMsOptions('');
}

function getCurrentDataSet() {
    return currentPermType === 'user' ? PERM_USERS
        : currentPermType === 'department' ? PERM_DEPARTMENTS
        : PERM_WORKSPACES;
}

/* ===== Multi-select 渲染 ===== */
function renderMsTags() {
    const tagsBox = document.getElementById('msTags');
    const input = document.getElementById('msInput');
    // 清空现有 tag（保留 input）
    tagsBox.querySelectorAll('.ms-tag').forEach(el => el.remove());

    msSelected.forEach(item => {
        const tag = document.createElement('span');
        tag.className = 'ms-tag';
        tag.innerHTML = `<span>${item.label}</span><button class="ms-tag-remove" type="button" data-id="${item.id}">&times;</button>`;
        tagsBox.insertBefore(tag, input);
    });

    tagsBox.querySelectorAll('.ms-tag-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            msSelected = msSelected.filter(s => s.id !== id);
            renderMsTags();
            renderMsOptions(input.value);
        });
    });
}

function renderMsOptions(keyword) {
    const list = document.getElementById('msOptionList');
    const data = getCurrentDataSet();
    const kw = (keyword || '').trim().toLowerCase();
    msFilteredOptions = data.filter(o => o.label.toLowerCase().includes(kw));

    if (msFilteredOptions.length === 0) {
        list.innerHTML = '<div class="ms-empty">暂无匹配结果</div>';
        return;
    }

    list.innerHTML = msFilteredOptions.map(o => {
        const selected = msSelected.some(s => s.id === o.id);
        return `
            <div class="ms-option ${selected ? 'selected' : ''}" data-id="${o.id}">
                <span>${o.label}</span>
                <svg class="ms-check" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
        `;
    }).join('');

    list.querySelectorAll('.ms-option').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = el.dataset.id;
            const opt = msFilteredOptions.find(o => o.id === id);
            const idx = msSelected.findIndex(s => s.id === id);
            if (idx >= 0) {
                msSelected.splice(idx, 1);
            } else {
                msSelected.push(opt);
            }
            renderMsTags();
            renderMsOptions(document.getElementById('msInput').value);
            document.getElementById('msInput').focus();
        });
    });
}

function openMsDropdown() {
    document.getElementById('multiSelect').classList.add('open');
}

function closeMsDropdown() {
    document.getElementById('multiSelect').classList.remove('open');
}

function setupPermissionModal() {
    document.getElementById('permissionModalClose').addEventListener('click', closePermissionModal);
    document.querySelector('#permissionModal .modal-mask').addEventListener('click', closePermissionModal);

    // 切换 用户/部门/工作空间
    document.querySelectorAll('.perm-tab').forEach(tab => {
        tab.addEventListener('click', () => switchPermType(tab.dataset.permType));
    });

    // 多选搜索框交互
    const msControl = document.getElementById('msControl');
    const msInput = document.getElementById('msInput');
    const multiSelect = document.getElementById('multiSelect');

    msControl.addEventListener('click', () => {
        msInput.focus();
        openMsDropdown();
    });

    msInput.addEventListener('focus', openMsDropdown);
    msInput.addEventListener('input', (e) => {
        renderMsOptions(e.target.value);
        openMsDropdown();
    });

    msInput.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !msInput.value && msSelected.length > 0) {
            msSelected.pop();
            renderMsTags();
            renderMsOptions('');
        }
    });

    // 点击外部关闭下拉
    document.addEventListener('click', (e) => {
        if (!multiSelect.contains(e.target)) {
            closeMsDropdown();
        }
    });

    // 授予权限
    document.getElementById('btnGrant').addEventListener('click', () => {
        if (msSelected.length === 0) {
            alert('请至少选择一个被授权对象');
            return;
        }
        const level = document.getElementById('permLevel').value;
        const typeMap = { user: 'USER', department: '部门', workspace: '工作空间' };
        msSelected.forEach(s => {
            const granteeName = s.label.split(' (')[0];
            CURRENT_PERMISSIONS.push({
                grantee: granteeName,
                type: typeMap[currentPermType],
                level: currentPermType === 'workspace' ? '—' : level
            });
        });
        renderPermTable();
        msSelected = [];
        msInput.value = '';
        renderMsTags();
        renderMsOptions('');
        closeMsDropdown();
    });
}

/* =============================================
 * Dashboard 交互
 * ============================================= */
let isEditMode = false;

function setupDashboard() {
    const btnEdit = document.getElementById('btnEdit');
    const toolbar = document.querySelector('.dashboard-toolbar');

    // 编辑模式切换
    if (btnEdit) {
        btnEdit.addEventListener('click', () => {
            isEditMode = !isEditMode;
            if (isEditMode) {
                toolbar && toolbar.classList.add('edit-mode');
                btnEdit.innerHTML = `
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    退出编辑
                `;
            } else {
                toolbar && toolbar.classList.remove('edit-mode');
                btnEdit.innerHTML = `
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    编辑
                `;
            }
        });
    }

    // 视图右键菜单
    const contextMenu = document.getElementById('viewContextMenu');
    const viewItems = document.querySelectorAll('.view-item');
    let currentViewTarget = '';

    viewItems.forEach(item => {
        const menuBtn = item.querySelector('.view-menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const span = item.querySelector('span');
                currentViewTarget = span ? span.textContent.trim() : '';
                const rect = menuBtn.getBoundingClientRect();
                contextMenu.style.left = rect.right + 4 + 'px';
                contextMenu.style.top = rect.top + 'px';
                contextMenu.classList.add('show');
            });
        }
    });

    // 右键菜单项点击
    contextMenu.querySelectorAll('.ctx-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            contextMenu.classList.remove('show');
            handleViewAction(action, currentViewTarget);
        });
    });

    // 文件夹右键菜单
    const folderContextMenu = document.getElementById('folderContextMenu');
    let currentFolderTarget = '';
    document.querySelectorAll('.folder-header').forEach(header => {
        const menuBtn = header.querySelector('.folder-menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const titleEl = header.querySelector('.folder-title');
                currentFolderTarget = titleEl ? titleEl.textContent.trim() : '';
                const rect = menuBtn.getBoundingClientRect();
                folderContextMenu.style.left = rect.right + 4 + 'px';
                folderContextMenu.style.top = rect.top + 'px';
                folderContextMenu.classList.add('show');
            });
        }
    });

    // 文件夹菜单项点击
    folderContextMenu.querySelectorAll('.ctx-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            folderContextMenu.classList.remove('show');
            handleFolderAction(action, currentFolderTarget);
        });
    });

    // 点击外部关闭右键菜单
    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            contextMenu.classList.remove('show');
        }
        if (!folderContextMenu.contains(e.target)) {
            folderContextMenu.classList.remove('show');
        }
    });

    // 文件夹折叠/展开
    document.querySelectorAll('.folder-header').forEach(header => {
        header.addEventListener('click', (e) => {
            // 如果点击的是菜单按钮，不触发折叠
            if (e.target.closest('.folder-menu-btn')) return;
            
            const group = header.closest('.view-group');
            if (group) {
                group.classList.toggle('collapsed');
                // 更新 count 显示
                const list = group.querySelector('.view-list');
                const countEl = header.querySelector('.folder-count');
                if (countEl && list) {
                    countEl.textContent = list.querySelectorAll('.view-item').length;
                }
            }
        });
    });

    // 顶部"+"号添加菜单（新建文件夹/新建视图）
    const btnAddView = document.getElementById('btnAddView');
    const addViewMenu = document.getElementById('addViewMenu');
    if (btnAddView && addViewMenu) {
        btnAddView.addEventListener('click', (e) => {
            e.stopPropagation();
            // 关闭其他菜单
            contextMenu.classList.remove('show');
            folderContextMenu.classList.remove('show');
            addViewMenu.classList.toggle('show');
        });

        addViewMenu.querySelectorAll('.ctx-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.dataset.action;
                addViewMenu.classList.remove('show');
                handleAddAction(action);
            });
        });

        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (!addViewMenu.contains(e.target) && e.target !== btnAddView && !btnAddView.contains(e.target)) {
                addViewMenu.classList.remove('show');
            }
        });
    }
}

function handleAddAction(action) {
    if (action === 'new-folder') {
        alert('新建文件夹');
    } else if (action === 'new-view') {
        alert('新建视图');
    }
}

function handleViewAction(action, targetName) {
    // 分享 / 管理权限 → 打开权限弹窗
    if (action === 'share' || action === 'permission') {
        openPermissionModal({ name: targetName || '视图' });
        return;
    }
    const actions = {
        rename: '重命名视图',
        duplicate: '复制视图',
        delete: '删除视图'
    };
    alert(`执行操作：${actions[action] || action}`);
}

function handleFolderAction(action, targetName) {
    if (action === 'folder-share' || action === 'folder-permission') {
        openPermissionModal({ name: targetName || '文件夹' });
        return;
    }
    const actions = {
        'folder-rename': '重命名文件夹',
        'folder-duplicate': '复制文件夹',
        'folder-new-view': '新建视图',
        'folder-delete': '删除文件夹'
    };
    alert(`执行操作：${actions[action] || action}`);
}

/* ===== BI 报表 ===== */
function applyBiPermission(perm) {
    // perm: 'edit' | 'view'
    const urlBar = document.querySelector('#biPage .bi-url-bar');
    const subtitle = document.getElementById('biSubtitle');
    if (urlBar) urlBar.style.display = perm === 'view' ? 'none' : '';
    if (subtitle) {
        subtitle.textContent = perm === 'view'
            ? '只读视图：链接由所有者管理，您可查看但无法编辑'
            : '粘贴报表链接即可嵌入查看';
    }
}

function loadBiFrame(url) {
    const frame = document.getElementById('biFrame');
    const empty = document.getElementById('biEmpty');
    const urlInput = document.getElementById('biUrlInput');
    if (!frame || !empty) return;
    if (urlInput) urlInput.value = url;
    frame.src = url;
    frame.style.display = '';
    empty.style.display = 'none';
}

function clearBiFrame() {
    const frame = document.getElementById('biFrame');
    const empty = document.getElementById('biEmpty');
    if (frame) {
        frame.src = '';
        frame.style.display = 'none';
    }
    if (empty) empty.style.display = '';
}

function setupBI() {
    const urlInput = document.getElementById('biUrlInput');
    const urlClear = document.getElementById('biUrlClear');
    const urlLoad = document.getElementById('biUrlLoad');
    const refreshBtn = document.getElementById('btnReportRefresh');
    const shareBtn = document.getElementById('btnReportShare');

    // URL 输入框 - 显示清除按钮
    if (urlInput) {
        urlInput.addEventListener('input', () => {
            urlClear.style.display = urlInput.value ? '' : 'none';
        });
        // 回车加载
        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && urlInput.value.trim()) {
                loadBiFrame(urlInput.value.trim());
                // 同步保存到当前选中的报表项
                const active = document.querySelector('#biSidebar .view-item.active');
                if (active) active.dataset.reportUrl = urlInput.value.trim();
            }
        });
    }

    if (urlClear) {
        urlClear.addEventListener('click', () => {
            urlInput.value = '';
            urlClear.style.display = 'none';
            clearBiFrame();
        });
    }

    if (urlLoad) {
        urlLoad.addEventListener('click', () => {
            const url = urlInput.value.trim();
            if (!url) {
                alert('请先粘贴报表链接');
                return;
            }
            loadBiFrame(url);
            const active = document.querySelector('#biSidebar .view-item.active');
            if (active) active.dataset.reportUrl = url;
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const frame = document.getElementById('biFrame');
            if (frame && frame.src) {
                frame.src = frame.src;
            }
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const titleEl = document.getElementById('biTitle');
            const name = titleEl ? titleEl.textContent.trim() : '报表';
            openPermissionModal({ name });
        });
    }

    // 加号按钮（新建文件夹/报表）
    const btnAddReport = document.getElementById('btnAddReport');
    const addReportMenu = document.getElementById('addReportMenu');
    if (btnAddReport && addReportMenu) {
        btnAddReport.addEventListener('click', (e) => {
            e.stopPropagation();
            addReportMenu.classList.toggle('show');
        });
        addReportMenu.querySelectorAll('.ctx-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                addReportMenu.classList.remove('show');
                const action = item.dataset.action;
                if (action === 'new-bi-folder') alert('新建文件夹');
                else if (action === 'new-bi-report') alert('新建报表');
            });
        });
        document.addEventListener('click', (e) => {
            if (!addReportMenu.contains(e.target) && !btnAddReport.contains(e.target)) {
                addReportMenu.classList.remove('show');
            }
        });
    }

    setupShareModal();

    // 页面加载时若有默认激活的 BI 报表项（含 URL），自动加载
    const defaultActive = document.querySelector('#biSidebar .view-item.active');
    if (defaultActive && defaultActive.dataset.reportUrl) {
        const url = defaultActive.dataset.reportUrl;
        const perm = defaultActive.dataset.perm || 'edit';
        const titleEl = document.getElementById('biTitle');
        const nameEl = defaultActive.querySelector('span:not(.perm-badge)');
        if (titleEl && nameEl) titleEl.textContent = nameEl.textContent;
        applyBiPermission(perm);
        loadBiFrame(url);
    }
}

/* ===== 分享弹窗 ===== */
function openShareModal() {
    const modal = document.getElementById('shareModal');
    const subtitle = document.getElementById('shareSubtitle');
    const titleEl = document.getElementById('biTitle');
    if (subtitle && titleEl) subtitle.textContent = titleEl.textContent;
    if (modal) modal.classList.add('show');
}

function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) modal.classList.remove('show');
}

function setupShareModal() {
    const closeBtn = document.getElementById('shareModalClose');
    const cancelBtn = document.getElementById('shareCancelBtn');
    const confirmBtn = document.getElementById('shareConfirmBtn');
    const addBtn = document.getElementById('shareAddBtn');
    const linkEnable = document.getElementById('shareLinkEnable');
    const linkBox = document.getElementById('shareLinkBox');
    const linkCopy = document.getElementById('shareLinkCopy');
    const linkInput = document.getElementById('shareLink');
    const shareList = document.getElementById('shareList');
    const inviteInput = document.getElementById('shareInvite');
    const permSelect = document.getElementById('sharePerm');
    const modal = document.getElementById('shareModal');

    if (closeBtn) closeBtn.addEventListener('click', closeShareModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeShareModal);
    if (confirmBtn) confirmBtn.addEventListener('click', closeShareModal);

    // 点击遮罩关闭
    if (modal) {
        const mask = modal.querySelector('.modal-mask');
        if (mask) mask.addEventListener('click', closeShareModal);
    }

    // 启用链接分享
    if (linkEnable && linkBox) {
        linkEnable.addEventListener('change', () => {
            linkBox.style.display = linkEnable.checked ? '' : 'none';
        });
    }

    // 复制链接
    if (linkCopy && linkInput) {
        linkCopy.addEventListener('click', () => {
            linkInput.select();
            document.execCommand('copy');
            linkCopy.textContent = '已复制';
            setTimeout(() => { linkCopy.textContent = '复制'; }, 1500);
        });
    }

    // 添加用户
    if (addBtn && inviteInput && permSelect && shareList) {
        addBtn.addEventListener('click', () => {
            const email = inviteInput.value.trim();
            if (!email) return;
            const permLabel = { view: '可查看', edit: '可编辑', manage: '可管理' }[permSelect.value];
            const initial = email.charAt(0).toUpperCase();
            const row = document.createElement('div');
            row.className = 'share-row';
            row.innerHTML = `
                <div class="share-user">
                    <div class="share-avatar">${initial}</div>
                    <div>
                        <div class="share-name">${email}</div>
                        <div class="share-email">${email}</div>
                    </div>
                </div>
                <span class="share-role">${permLabel}</span>
            `;
            shareList.appendChild(row);
            inviteInput.value = '';
        });
    }
}
