const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// Replace exportExcel function
const exportExcelRegex = /function exportExcel\(\) \{[\s\S]*?XLSX\.writeFile\(wb, `装修预算 \$\{dateStr\}\.xlsx`\);\n        \}/;

const newExportExcel = `function exportExcel() {
            // 使用当前视图的数据（即支持导出过滤和排序后的结果）
            const dataToExport = filteredData.length > 0 || currentFilter !== 'all' || currentSearch !== '' ? filteredData : appliances;

            if (dataToExport.length === 0) {
                return alert('没有可导出的数据！');
            }

            // 1. 获取全局统计数据
            const stats = calculateStatistics(dataToExport);

            // 2. 构造二维数组 (AOA)
            const aoa = [];
            
            // --- A. 添加全局总计汇总区域 ---
            aoa.push(["【总计汇总】"]);
            aoa.push(["总预算(¥)", "实际支出(¥)", "预算差额(¥)", "完成率(%)", "总项目数"]);
            const completionRate = dataToExport.length > 0 ? Math.round((stats.completedCount / dataToExport.length) * 100) : 0;
            const diffPrice = stats.totalBudget - stats.totalActual;
            aoa.push([
                stats.totalBudget, 
                stats.totalActual, 
                diffPrice > 0 ? \`+\${diffPrice}\` : diffPrice, 
                \`\${completionRate}%\`, 
                dataToExport.length
            ]);
            aoa.push([]); // 空行分隔

            // --- B. 添加分类汇总区域 ---
            aoa.push(["【分类汇总】"]);
            aoa.push(["分类", "总预算(¥)", "实际支出(¥)", "完成度", "项目数"]);
            Object.keys(stats.categoryStats).forEach(cat => {
                const cStats = stats.categoryStats[cat];
                aoa.push([
                    cat,
                    cStats.totalBudget,
                    cStats.totalActual,
                    \`\${cStats.completedCount} / \${cStats.itemCount}\`,
                    cStats.itemCount
                ]);
            });
            aoa.push([]); // 空行分隔

            // --- C. 添加明细数据区域 ---
            aoa.push(["【预算明细清单】"]);
            const detailStartRowIndex = aoa.length; // 记录明细数据表头的所在行索引（从0开始）
            const headers = ["名称", "优先度", "分类", "品牌", "数量", "预算金额(¥)", "实际金额(¥)", "差额(¥)", "购买渠道", "状态", "备注"];
            aoa.push(headers);

            dataToExport.forEach(item => {
                const bPrice = Number(item.budgetPrice) || 0;
                const aPrice = Number(item.actualPrice) || 0;
                const itemDiffPrice = item.status === '待购' ? '-' : (bPrice - aPrice);

                aoa.push([
                    item.name || '',
                    item.priority || '',
                    item.category || '',
                    item.brand || '',
                    item.quantity || 1,
                    bPrice,
                    aPrice,
                    itemDiffPrice,
                    item.purchaseChannel || '',
                    item.status || '',
                    item.notes || ''
                ]);
            });

            // 3. 创建工作簿和工作表
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(aoa);

            // 4. 样式定义
            const borderStyle = {
                top: { style: "thin", color: { rgb: "D1D1D6" } },
                bottom: { style: "thin", color: { rgb: "D1D1D6" } },
                left: { style: "thin", color: { rgb: "D1D1D6" } },
                right: { style: "thin", color: { rgb: "D1D1D6" } }
            };

            const headerStyle = {
                font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12, name: "Arial" },
                fill: { fgColor: { rgb: "1C1C1E" } }, // 暗色表头
                alignment: { horizontal: "center", vertical: "center" },
                border: borderStyle
            };

            const titleStyle = {
                font: { bold: true, color: { rgb: "1D1D1F" }, sz: 14, name: "Arial" },
                alignment: { horizontal: "left", vertical: "center" }
            };

            const summaryHeaderStyle = {
                font: { bold: true, color: { rgb: "1D1D1F" }, sz: 11, name: "Arial" },
                fill: { fgColor: { rgb: "F2F2F7" } }, // 浅灰底色
                alignment: { horizontal: "center", vertical: "center" },
                border: borderStyle
            };

            const baseStyle = {
                font: { sz: 11, color: { rgb: "1D1D1F" }, name: "Arial" },
                alignment: { vertical: "center", horizontal: "center" },
                border: borderStyle
            };

            // 获取有效范围
            const range = XLSX.utils.decode_range(ws['!ref']);

            // 行高配置
            ws['!rows'] = [];

            // 合并标题单元格
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // 总计汇总标题
                { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } }, // 分类汇总标题
                { s: { r: detailStartRowIndex - 1, c: 0 }, e: { r: detailStartRowIndex - 1, c: 10 } } // 明细清单标题
            ];

            // 5. 遍历所有单元格应用样式
            for (let R = range.s.r; R <= range.e.r; ++R) {
                // 设置行高：标题和表头高一点
                if (R === 0 || R === 4 || R === detailStartRowIndex - 1) {
                    ws['!rows'][R] = { hpx: 35 }; // 大标题
                } else if (R === 1 || R === 5 || R === detailStartRowIndex) {
                    ws['!rows'][R] = { hpx: 30 }; // 表头
                } else if (aoa[R].length > 0) {
                    ws['!rows'][R] = { hpx: 40 }; // 数据行
                }

                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = {c: C, r: R};
                    const cellRef = XLSX.utils.encode_cell(cellAddress);
                    
                    // 如果该行是空行，跳过样式设置
                    if (aoa[R].length === 0) continue;
                    
                    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' }; // 填充空单元格

                    // --- 标题行样式 ---
                    if (R === 0 || R === 4 || R === detailStartRowIndex - 1) {
                        if (C === 0) ws[cellRef].s = titleStyle;
                        continue;
                    }

                    // --- 汇总表头样式 ---
                    if (R === 1 || R === 5) {
                        if (C < aoa[R].length) ws[cellRef].s = summaryHeaderStyle;
                        continue;
                    }

                    // --- 汇总数据行样式 ---
                    if (R > 1 && R < 4) { // 总计数据
                        if (C < aoa[R].length) {
                            let cellStyle = JSON.parse(JSON.stringify(baseStyle));
                            cellStyle.font.bold = true;
                            if (C === 2) { // 预算差额
                                const val = String(ws[cellRef].v);
                                if (val.startsWith('+')) cellStyle.font.color = { rgb: "30D158" };
                                else if (val.startsWith('-')) cellStyle.font.color = { rgb: "FF3B30" };
                            }
                            ws[cellRef].s = cellStyle;
                        }
                        continue;
                    }

                    if (R > 5 && R < detailStartRowIndex - 2) { // 分类数据
                        if (C < aoa[R].length) {
                            let cellStyle = JSON.parse(JSON.stringify(baseStyle));
                            ws[cellRef].s = cellStyle;
                        }
                        continue;
                    }

                    // --- 明细清单表头 ---
                    if (R === detailStartRowIndex) {
                        ws[cellRef].s = headerStyle;
                        continue;
                    }

                    // --- 明细数据行样式 ---
                    if (R > detailStartRowIndex) {
                        let cellStyle = JSON.parse(JSON.stringify(baseStyle));
                        
                        const rowDataIndex = R - detailStartRowIndex - 1;
                        const rowData = dataToExport[rowDataIndex];
                        if(!rowData) continue; // 安全检查
                        
                        const bPrice = Number(rowData.budgetPrice) || 0;
                        const aPrice = Number(rowData.actualPrice) || 0;
                        const isOverBudget = bPrice > 0 && aPrice > bPrice;

                        // 金额列处理
                        if (C === 5 || C === 6 || C === 7) {
                            ws[cellRef].t = 'n'; 
                            cellStyle.font.bold = (C === 6 || C === 7); 
                            cellStyle.alignment.horizontal = "right"; 
                            
                            if (C === 6 && isOverBudget) cellStyle.font.color = { rgb: "FF3B30" };
                            
                            if (C === 7) {
                                if (rowData.status === '待购') {
                                    ws[cellRef].t = 's';
                                    cellStyle.font.color = { rgb: "8E8E93" };
                                    cellStyle.alignment.horizontal = "center";
                                } else {
                                    const diff = bPrice - aPrice;
                                    if (diff < 0) cellStyle.font.color = { rgb: "FF3B30" };
                                    else if (diff > 0) cellStyle.font.color = { rgb: "30D158" };
                                }
                            }
                        }

                        // 状态列
                        if (C === 9) {
                            const status = ws[cellRef].v;
                            cellStyle.font.bold = true;
                            if (status === '完成') {
                                cellStyle.font.color = { rgb: "248A3D" };
                                cellStyle.fill = { fgColor: { rgb: "EBF9F0" } };
                            } else if (status === '付款') {
                                cellStyle.font.color = { rgb: "B26800" };
                                cellStyle.fill = { fgColor: { rgb: "FFF6E5" } };
                            } else {
                                cellStyle.font.color = { rgb: "0056B3" };
                                cellStyle.fill = { fgColor: { rgb: "E5F1FF" } };
                            }
                        }
                        
                        // 优先度
                        if (C === 1) {
                            const priority = ws[cellRef].v;
                            cellStyle.font.bold = true;
                            if (priority === '高') cellStyle.font.color = { rgb: "FF3B30" };
                            else if (priority === '中') cellStyle.font.color = { rgb: "FF9F0A" };
                            else cellStyle.font.color = { rgb: "8E8E93" };
                        }

                        if (isOverBudget && C !== 9) cellStyle.fill = { fgColor: { rgb: "FFF2F2" } };

                        if (C === 3 || C === 8 || C === 10) {
                            if (!isOverBudget) cellStyle.font.color = { rgb: "86868B" };
                        }

                        if (C === 10) cellStyle.alignment.wrapText = true;

                        ws[cellRef].s = cellStyle;
                    }
                }
            }

            // 6. 设置列宽 (针对明细表的 11 列)
            ws['!cols'] = [
                { wpx: 150 }, // 名称
                { wpx: 60 },  // 优先度
                { wpx: 80 },  // 分类
                { wpx: 120 }, // 品牌
                { wpx: 50 },  // 数量
                { wpx: 100 }, // 预算
                { wpx: 100 }, // 实际
                { wpx: 100 }, // 差额
                { wpx: 120 }, // 渠道
                { wpx: 80 },  // 状态
                { wpx: 250 }  // 备注
            ];

            // 7. 导出文件
            XLSX.utils.book_append_sheet(wb, ws, "预算清单");
            
            const d = new Date();
            const dateStr = \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;
            XLSX.writeFile(wb, \`装修预算_\${dateStr}.xlsx\`);
        }`;

content = content.replace(exportExcelRegex, newExportExcel);
fs.writeFileSync('index.html', content);
console.log('Excel export updated with summaries.');