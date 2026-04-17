const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// Replace UI Texts
content = content.replace(/GitHub 同步凭证/g, 'Gitee 同步凭证');
content = content.replace(/GitHub 同步设置/g, 'Gitee 同步设置');
content = content.replace(/ph-github-logo/g, 'ph-gitlab-logo'); // or whatever icon, keep ph-github-logo if no gitee logo, but let's change to ph-cloud-arrow-up
content = content.replace(/修改你的 GitHub 仓库/g, '修改你的 Gitee 仓库');
content = content.replace(/GitHub 同步配置/g, 'Gitee 同步配置');
content = content.replace(/GitHub配置解析失败/g, 'Gitee配置解析失败');
content = content.replace(/推送到 GitHub/g, '推送到 Gitee');
content = content.replace(/GitHub Personal Access Token/g, 'Gitee 私人令牌(Token)');
content = content.replace(/覆盖到 GitHub 仓库/g, '覆盖到 Gitee 仓库');
content = content.replace(/GitHub API 缓存/g, 'Gitee API 缓存');
content = content.replace(/GitHub API Error/g, 'Gitee API Error');
content = content.replace(/成功推送到 GitHub 仓库/g, '成功推送到 Gitee 仓库');
content = content.replace(/GitHub Raw 地址原生支持 CORS/g, 'Gitee API 原生支持 CORS');

// Replace variable and cache keys
content = content.replace(/githubConfig/g, 'giteeConfig');
content = content.replace(/_github_config/g, '_gitee_config');
content = content.replace(/cachedGithub/g, 'cachedGitee');
content = content.replace(/githubUrl/g, 'giteeUrl');


// Replace pushToCloud logic
const pushRegex = /async function pushToCloud\(\) \{[\s\S]*?async function syncFromCloud\(\) \{/m;

const newPushLogic = `async function pushToCloud() {
            if (!giteeConfig.token) {
                alert('请先点击"设置"配置你的 Gitee 私人令牌(Token)！');
                openSettingsModal();
                return;
            }

            if (!confirm('这将会把当前本地的所有数据覆盖到 Gitee 仓库中，是否继续？')) return;

            const btn = document.querySelector('button[onclick="pushToCloud()"]');
            const originalText = btn.innerHTML;
            
            try {
                btn.innerHTML = '<i class="ph ph-spinner ph-spin" style="font-size: 16px;"></i> 推送中';
                btn.style.opacity = '0.7';
                btn.style.pointerEvents = 'none';

                // 1. 构造需要推送的数据
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

                // base64 encode for unicode string
                const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(exportData, null, 2))));
                const apiUrl = \`https://gitee.com/api/v5/repos/\${giteeConfig.owner}/\${giteeConfig.repo}/contents/\${encodeURIComponent(giteeConfig.path)}\`;

                // 2. 先获取当前主文件的 SHA (如果文件已存在)
                let currentSha = null;
                let oldContentBase64 = null;
                try {
                    const getRes = await fetch(\`\${apiUrl}?ref=\${giteeConfig.branch}&access_token=\${giteeConfig.token}&t=\${new Date().getTime()}\`);
                    if (getRes.ok) {
                        const fileData = await getRes.json();
                        currentSha = fileData.sha;
                        oldContentBase64 = fileData.content;
                    } else {
                        console.log('获取文件信息响应状态异常:', getRes.status);
                    }
                } catch (e) {
                    console.error('获取文件SHA失败，可能主文件是第一次创建或网络异常:', e);
                }
                
                // 3. 只要旧文件存在，就备份一份到 history 目录
                if (currentSha && oldContentBase64) {
                    try {
                        const d = new Date();
                        const timeStr = \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}_\${String(d.getHours()).padStart(2, '0')}-\${String(d.getMinutes()).padStart(2, '0')}-\${String(d.getSeconds()).padStart(2, '0')}\`;
                        
                        const pathParts = giteeConfig.path.split('/');
                        pathParts.pop(); // 丢弃原文件名
                        
                        const backupDir = pathParts.length > 0 ? \`history/\${pathParts.join('/')}\` : 'history';
                        const backupPath = \`\${backupDir}/\${timeStr}.json\`;
                        const backupApiUrl = \`https://gitee.com/api/v5/repos/\${giteeConfig.owner}/\${giteeConfig.repo}/contents/\${encodeURIComponent(backupPath)}\`;
                        
                        console.log(\`正在备份旧数据到: \${backupPath}\`);
                        
                        // Gitee 创建文件使用 POST
                        const backupRes = await fetch(backupApiUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                access_token: giteeConfig.token,
                                message: \`Auto backup before update - \${timeStr}\`,
                                content: oldContentBase64,
                                branch: giteeConfig.branch
                            })
                        });
                        
                        if (backupRes.ok) {
                            console.log(\`✅ 历史备份成功: \${backupPath}\`);
                        } else {
                            const errorMsg = await backupRes.text();
                            console.error('❌ 备份请求失败:', errorMsg);
                            alert(\`备份文件创建失败，错误码：\${backupRes.status}，详细信息请查看控制台。\`);
                        }
                    } catch (backupErr) {
                        console.error('❌ 备份历史数据请求抛出异常', backupErr);
                        alert('备份请求异常：' + backupErr.message);
                    }
                }

                // 4. 执行 PUT 更新或 POST 创建主文件
                const bodyData = {
                    access_token: giteeConfig.token,
                    message: \`Update budget via Web App - \${new Date().toLocaleString()}\`,
                    content: contentBase64,
                    branch: giteeConfig.branch
                };
                if (currentSha) {
                    bodyData.sha = currentSha;
                }

                const putRes = await fetch(apiUrl, {
                    method: currentSha ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(bodyData)
                });

                if (!putRes.ok) {
                    const errorMsg = await putRes.text();
                    throw new Error(\`Gitee API Error: \${putRes.status} \${errorMsg}\`);
                }

                alert('🚀 成功推送到 Gitee 仓库！');
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


// Replace syncFromCloud logic
const syncRegex = /async function syncFromCloud\(\) \{[\s\S]*?function exportJSON\(\) \{/m;

const newSyncLogic = `async function syncFromCloud() {
            if (!confirm('从云端同步将覆盖当前本地所有数据，并且不可恢复。\\n请确认云端数据是最新的！是否继续？')) {
                return;
            }

            if (!giteeConfig.token) {
                alert('请先点击"设置"配置你的 Gitee 私人令牌(Token)，Gitee API 拉取私有或公有仓库均需要Token！');
                openSettingsModal();
                return;
            }

            // Gitee API 原生支持 CORS
            const apiUrl = \`https://gitee.com/api/v5/repos/\${giteeConfig.owner}/\${giteeConfig.repo}/contents/\${encodeURIComponent(giteeConfig.path)}?ref=\${giteeConfig.branch}&access_token=\${giteeConfig.token}&t=\${new Date().getTime()}\`;
            
            const btn = document.querySelector('button[onclick="syncFromCloud()"]');
            const originalText = btn.innerHTML;
            
            try {
                // 按钮加载状态
                btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> 同步中...';
                btn.style.opacity = '0.7';
                btn.style.pointerEvents = 'none';

                const response = await fetch(apiUrl);
                
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
                    // --- 核心 Diff 对比算法 ---
                    let addedCount = 0;
                    let updatedCount = 0;
                    let deletedCount = 0;
                    
                    const localDataMap = new Map(appliances.map(item => [item.id, item]));
                    const cloudDataMap = new Map(importedData.appliances.map(item => [item.id, item]));
                    
                    // 1. 找新增和修改
                    importedData.appliances.forEach(cloudItem => {
                        if (!localDataMap.has(cloudItem.id)) {
                            addedCount++;
                        } else {
                            // 深度对比对象是否发生变化
                            const localItemStr = JSON.stringify(localDataMap.get(cloudItem.id));
                            const cloudItemStr = JSON.stringify(cloudItem);
                            if (localItemStr !== cloudItemStr) {
                                updatedCount++;
                            }
                        }
                    });
                    
                    // 2. 找删除
                    appliances.forEach(localItem => {
                        if (!cloudDataMap.has(localItem.id)) {
                            deletedCount++;
                        }
                    });

                    // 覆盖本地数据
                    appliances = importedData.appliances;
                    
                    // 重置筛选和搜索状态，展示云端全量数据
                    currentFilter = 'all';
                    currentSearch = '';
                    sortConfig = { key: null, isDesc: false };
                    document.getElementById('searchInput').value = '';
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.status === 'all'));
                    
                    applyFiltersAndSort();
                    
                    // 动态弹窗提示 Diff 结果
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
                alert(\`云端同步失败，请检查网络或文件地址是否正确。\\n可能的原因：Token 无效、文件尚未上传，或者网络被拦截。\\n\\n错误信息：\${err.message}\`);
            } finally {
                // 恢复按钮状态
                btn.innerHTML = originalText;
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
            }
        }

        function exportJSON() {`;

content = content.replace(syncRegex, newSyncLogic);

fs.writeFileSync('index.html', content);
console.log('Update complete.');
