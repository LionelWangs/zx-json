const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// Update UI Texts in Settings Modal
content = content.replace(/<h2><i class="ph ph-gitlab-logo"><\/i> Gitee 同步设置<\/h2>/, '<h2><i class="ph ph-cloud-arrow-up"></i> 云端同步设置</h2>');
content = content.replace(/用于授权修改你的 Gitee 仓库/g, '用于授权修改你的云端仓库');
content = content.replace(/Gitee 同步配置/g, '云端同步配置');
content = content.replace(/推送到 Gitee/g, '推送到云端');
content = content.replace(/覆盖到 Gitee 仓库/g, '覆盖到云端仓库');
content = content.replace(/成功推送到 Gitee 仓库/g, '成功推送到云端仓库');

// Add Provider Select in Modal Body
const providerHtml = `
                <div class="form-group full">
                    <label>同步平台 (Platform)</label>
                    <select class="form-control" id="setting-provider">
                        <option value="gitee">Gitee (码云)</option>
                        <option value="github">GitHub</option>
                    </select>
                </div>
`;
content = content.replace(/<div class="modal-body">/, `<div class="modal-body">\n${providerHtml}`);


// Update JavaScript Config variables
content = content.replace(/let giteeConfig = \{/g, 'let syncConfig = {');
content = content.replace(/giteeConfig/g, 'syncConfig');
content = content.replace(/_gitee_config/g, '_sync_config');

const configInitMatch = /let syncConfig = \{[\s\S]*?branch: 'gitee'\n        \};/;
const newConfigInit = `let syncConfig = {
            provider: 'gitee', // 'gitee' or 'github'
            token: '',
            owner: 'lionel-wang',
            repo: 'zx-json',
            path: '装修预算.json',
            branch: 'gitee'
        };`;
content = content.replace(configInitMatch, newConfigInit);


// Update settings logic
const openSettingsRegex = /function openSettingsModal\(\) \{[\s\S]*?settingsModal\.classList\.add\('active'\);\n        \}/;
const newOpenSettings = `function openSettingsModal() {
            document.getElementById('setting-provider').value = syncConfig.provider || 'gitee';
            document.getElementById('setting-token').value = syncConfig.token;
            document.getElementById('setting-owner').value = syncConfig.owner;
            document.getElementById('setting-repo').value = syncConfig.repo;
            document.getElementById('setting-path').value = syncConfig.path;
            document.getElementById('setting-branch').value = syncConfig.branch || 'gitee';
            settingsModal.classList.add('active');
        }`;
content = content.replace(openSettingsRegex, newOpenSettings);

const saveSettingsRegex = /function saveSettings\(\) \{[\s\S]*?alert\('配置已保存到本地缓存'\);\n        \}/;
const newSaveSettings = `function saveSettings() {
            syncConfig.provider = document.getElementById('setting-provider').value;
            syncConfig.token = document.getElementById('setting-token').value.trim();
            syncConfig.owner = document.getElementById('setting-owner').value.trim();
            syncConfig.repo = document.getElementById('setting-repo').value.trim();
            syncConfig.path = document.getElementById('setting-path').value.trim();
            syncConfig.branch = document.getElementById('setting-branch').value.trim() || 'gitee';
            
            localStorage.setItem(CACHE_KEY + '_sync_config', JSON.stringify(syncConfig));
            closeSettingsModal();
            alert('配置已保存到本地缓存');
        }`;
content = content.replace(saveSettingsRegex, newSaveSettings);

// Update init logic for backward compatibility
const initLogicRegex = /const cachedGitee = localStorage\.getItem\(CACHE_KEY \+ '_sync_config'\);\n            if \(cachedGitee\) \{[\s\S]*?\}\n            \}/;
const newInitLogic = `const cachedSync = localStorage.getItem(CACHE_KEY + '_sync_config') || localStorage.getItem(CACHE_KEY + '_gitee_config') || localStorage.getItem(CACHE_KEY + '_github_config');
            if (cachedSync) {
                try {
                    syncConfig = { ...syncConfig, ...JSON.parse(cachedSync) };
                } catch(e) {
                    console.error('云端配置解析失败', e);
                }
            }`;
content = content.replace(initLogicRegex, newInitLogic);


// Replace Push Logic
const pushRegex = /async function pushToCloud\(\) \{[\s\S]*?async function syncFromCloud\(\) \{/m;
const newPushLogic = `async function pushToCloud() {
            if (!syncConfig.token) {
                alert('请先点击"设置"配置你的私人令牌(Token)！');
                openSettingsModal();
                return;
            }

            if (!confirm('这将会把当前本地的所有数据覆盖到云端仓库中，是否继续？')) return;

            const btn = document.querySelector('button[onclick="pushToCloud()"]');
            const originalText = btn.innerHTML;
            
            try {
                btn.innerHTML = '<i class="ph ph-spinner ph-spin" style="font-size: 16px;"></i> 推送中';
                btn.style.opacity = '0.7';
                btn.style.pointerEvents = 'none';

                const stats = calculateStatistics(appliances);
                const exportData = {
                    exportTime: new Date().toLocaleString('zh-CN', { hour12: false }),
                    appliances: appliances,
                    statistics: {
                        totalBudget: stats.totalBudget,
                        totalActual: stats.totalActual,
                        budgetDifference: stats.totalBudget - stats.totalActual,
                        totalQuantity: stats.totalQuantity,
                        completedCount: stats.completedCount,
                        completionRate: appliances.length > 0 ? Math.round((stats.completedCount / appliances.length) * 100) : 0,
                        categoryStats: stats.categoryStats
                    }
                };

                const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(exportData, null, 2))));
                const isGithub = syncConfig.provider === 'github';
                
                const apiUrl = isGithub
                    ? \`https://api.github.com/repos/\${syncConfig.owner}/\${syncConfig.repo}/contents/\${encodeURIComponent(syncConfig.path)}\`
                    : \`https://gitee.com/api/v5/repos/\${syncConfig.owner}/\${syncConfig.repo}/contents/\${encodeURIComponent(syncConfig.path)}\`;

                // 2. 获取当前主文件的 SHA
                let currentSha = null;
                let oldContentBase64 = null;
                try {
                    const getUrl = isGithub
                        ? \`\${apiUrl}?ref=\${syncConfig.branch}&t=\${new Date().getTime()}\`
                        : \`\${apiUrl}?ref=\${syncConfig.branch}&access_token=\${syncConfig.token}&t=\${new Date().getTime()}\`;
                    
                    const headers = isGithub ? {
                        'Authorization': \`token \${syncConfig.token}\`,
                        'Accept': 'application/vnd.github.v3+json'
                    } : {};

                    const getRes = await fetch(getUrl, { headers });
                    if (getRes.ok) {
                        const fileData = await getRes.json();
                        currentSha = fileData.sha;
                        oldContentBase64 = fileData.content;
                    }
                } catch (e) {
                    console.error('获取文件SHA失败', e);
                }
                
                // 3. 备份历史记录
                if (currentSha && oldContentBase64) {
                    try {
                        const d = new Date();
                        const timeStr = \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}_\${String(d.getHours()).padStart(2, '0')}-\${String(d.getMinutes()).padStart(2, '0')}-\${String(d.getSeconds()).padStart(2, '0')}\`;
                        
                        const pathParts = syncConfig.path.split('/');
                        pathParts.pop(); 
                        const backupDir = pathParts.length > 0 ? \`history/\${pathParts.join('/')}\` : 'history';
                        const backupPath = \`\${backupDir}/\${timeStr}.json\`;
                        
                        const backupApiUrl = isGithub
                            ? \`https://api.github.com/repos/\${syncConfig.owner}/\${syncConfig.repo}/contents/\${encodeURIComponent(backupPath)}\`
                            : \`https://gitee.com/api/v5/repos/\${syncConfig.owner}/\${syncConfig.repo}/contents/\${encodeURIComponent(backupPath)}\`;
                        
                        const backupBody = {
                            message: \`Auto backup before update - \${timeStr}\`,
                            content: oldContentBase64,
                            branch: syncConfig.branch
                        };
                        if (!isGithub) backupBody.access_token = syncConfig.token;

                        await fetch(backupApiUrl, {
                            method: isGithub ? 'PUT' : 'POST',
                            headers: isGithub ? {
                                'Authorization': \`token \${syncConfig.token}\`,
                                'Content-Type': 'application/json'
                            } : {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(backupBody)
                        });
                    } catch (backupErr) {
                        console.error('备份请求异常', backupErr);
                    }
                }

                // 4. 执行更新或创建
                const bodyData = {
                    message: \`Update budget via Web App - \${new Date().toLocaleString()}\`,
                    content: contentBase64,
                    branch: syncConfig.branch
                };
                if (!isGithub) bodyData.access_token = syncConfig.token;
                if (currentSha) bodyData.sha = currentSha;

                const method = isGithub ? 'PUT' : (currentSha ? 'PUT' : 'POST');
                const headers = isGithub ? {
                    'Authorization': \`token \${syncConfig.token}\`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                } : {
                    'Content-Type': 'application/json'
                };

                const putRes = await fetch(apiUrl, {
                    method: method,
                    headers: headers,
                    body: JSON.stringify(bodyData)
                });

                if (!putRes.ok) {
                    const errorMsg = await putRes.text();
                    throw new Error(\`Cloud API Error: \${putRes.status} \${errorMsg}\`);
                }

                alert('🚀 成功推送到云端仓库！');
            } catch (err) {
                console.error("推送失败", err);
                alert(\`推送失败，请检查 Token 权限、仓库名及路径是否正确。\\n\\n错误信息：\${err.message}\`);
            } finally {
                btn.innerHTML = originalText;
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
            }
        }

        async function syncFromCloud() {`;
content = content.replace(pushRegex, newPushLogic);


// Replace Sync Logic
const syncRegex = /async function syncFromCloud\(\) \{[\s\S]*?function exportJSON\(\) \{/m;
const newSyncLogic = `async function syncFromCloud() {
            if (!confirm('从云端同步将覆盖当前本地所有数据，并且不可恢复。\\n请确认云端数据是最新的！是否继续？')) {
                return;
            }

            if (!syncConfig.token) {
                alert('请先点击"设置"配置你的私人令牌(Token)！');
                openSettingsModal();
                return;
            }

            const isGithub = syncConfig.provider === 'github';
            const apiUrl = isGithub
                ? \`https://api.github.com/repos/\${syncConfig.owner}/\${syncConfig.repo}/contents/\${encodeURIComponent(syncConfig.path)}?ref=\${syncConfig.branch}&t=\${new Date().getTime()}\`
                : \`https://gitee.com/api/v5/repos/\${syncConfig.owner}/\${syncConfig.repo}/contents/\${encodeURIComponent(syncConfig.path)}?ref=\${syncConfig.branch}&access_token=\${syncConfig.token}&t=\${new Date().getTime()}\`;
            
            const headers = isGithub ? {
                'Authorization': \`token \${syncConfig.token}\`,
                'Accept': 'application/vnd.github.v3+json'
            } : {};

            const btn = document.querySelector('button[onclick="syncFromCloud()"]');
            const originalText = btn.innerHTML;
            
            try {
                btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> 同步中...';
                btn.style.opacity = '0.7';
                btn.style.pointerEvents = 'none';

                const response = await fetch(apiUrl, { headers });
                
                if (!response.ok) {
                    throw new Error(\`HTTP error! status: \${response.status}\`);
                }
                
                const fileData = await response.json();
                if (!fileData.content) {
                    throw new Error('未找到文件内容，可能是路径错误或空文件。');
                }

                // Base64 解码 utf-8
                const jsonStr = decodeURIComponent(escape(atob(fileData.content)));
                const importedData = JSON.parse(jsonStr);
                
                if (importedData.appliances && Array.isArray(importedData.appliances)) {
                    let addedCount = 0;
                    let updatedCount = 0;
                    let deletedCount = 0;
                    
                    const localDataMap = new Map(appliances.map(item => [item.id, item]));
                    const cloudDataMap = new Map(importedData.appliances.map(item => [item.id, item]));
                    
                    importedData.appliances.forEach(cloudItem => {
                        if (!localDataMap.has(cloudItem.id)) {
                            addedCount++;
                        } else {
                            const localItemStr = JSON.stringify(localDataMap.get(cloudItem.id));
                            const cloudItemStr = JSON.stringify(cloudItem);
                            if (localItemStr !== cloudItemStr) {
                                updatedCount++;
                            }
                        }
                    });
                    
                    appliances.forEach(localItem => {
                        if (!cloudDataMap.has(localItem.id)) {
                            deletedCount++;
                        }
                    });

                    appliances = importedData.appliances;
                    
                    currentFilter = 'all';
                    currentSearch = '';
                    sortConfig = { key: null, isDesc: false };
                    document.getElementById('searchInput').value = '';
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.status === 'all'));
                    
                    applyFiltersAndSort();
                    
                    if (addedCount === 0 && updatedCount === 0 && deletedCount === 0) {
                        alert('🎉 云端同步成功！\\n\\n云端数据与本地完全一致，没有发生任何变更。');
                    } else {
                        alert(\`🎉 云端同步成功！\\n\\n数据变更详情：\\n✨ 新增：\${addedCount} 条\\n📝 修改：\${updatedCount} 条\\n🗑️ 删除：\${deletedCount} 条\`);
                    }
                } else {
                    throw new Error('文件格式错误：未找到 appliances 数组。');
                }
            } catch (err) {
                console.error("同步失败", err);
                alert(\`云端同步失败，请检查网络或文件地址是否正确。\\n\\n错误信息：\${err.message}\`);
            } finally {
                btn.innerHTML = originalText;
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
            }
        }

        function exportJSON() {`;
content = content.replace(syncRegex, newSyncLogic);

fs.writeFileSync('index.html', content);
console.log('Dual platform support added.');