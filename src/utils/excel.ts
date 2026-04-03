import * as XLSX from 'xlsx';
import { Asset, AssetType } from '../types';

const typeMap: Record<string, AssetType> = {
  防火墙: 'Firewall',
  交换机: 'Switch',
  服务器: 'Server',
  数据库: 'Database',
  终端: 'Terminal'
};

export const parseAssetsFromExcel = async (file: File): Promise<Asset[]> => {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
  return rows.map((row, index) => ({
    id: `asset-import-${index}-${Date.now()}`,
    name: row['资产名称'] || row['名称'] || `Asset-${index + 1}`,
    ip: row['IP'] || row['IP地址'] || '0.0.0.0',
    type: typeMap[row['设备类型']] ?? 'Terminal',
    model: row['型号'],
    zone: row['安全域'],
    isDeployed: false
  }));
};

export const downloadSurveyTemplate = () => {
  const data = [
    ['资产名称', 'IP地址', '设备类型', '型号', '安全域'],
    ['FW-Edge', '10.10.0.1', '防火墙', 'PA-3220', '外联区']
  ];
  const sheet = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, '资产');
  XLSX.writeFile(wb, '测评资产调研表.xlsx');
};
