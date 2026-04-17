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

// Replace API URLs
// 1. apiUrl
content = content.replace(
    /https:\/\/api\.github\.com\/repos\/\$\{giteeConfig\.owner\}\/\$\{giteeConfig\.repo\}\/contents\/\$\{encodeURIComponent\(giteeConfig\.path\)\}/g,
    'https://gitee.com/api/v5/repos/${giteeConfig.owner}/${giteeConfig.repo}/contents/${encodeURIComponent(giteeConfig.path)}'
);

// 2. backupApiUrl
content = content.replace(
    /https:\/\/api\.github\.com\/repos\/\$\{giteeConfig\.owner\}\/\$\{giteeConfig\.repo\}\/contents\/\$\{encodeURIComponent\(backupPath\)\}/g,
    'https://gitee.com/api/v5/repos/${giteeConfig.owner}/${giteeConfig.repo}/contents/${encodeURIComponent(backupPath)}'
);

// 3. Raw URL for sync
content = content.replace(
    /https:\/\/raw\.githubusercontent\.com\/\$\{giteeConfig\.owner\}\/\$\{giteeConfig\.repo\}\/refs\/heads\/\$\{giteeConfig\.branch\}\/\$\{encodeURIComponent\(giteeConfig\.path\)\}/g,
    'https://gitee.com/api/v5/repos/${giteeConfig.owner}/${giteeConfig.repo}/contents/${encodeURIComponent(giteeConfig.path)}'
);

fs.writeFileSync('index.html', content);
console.log('Replacements done.');
