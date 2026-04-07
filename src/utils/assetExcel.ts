import * as XLSX from 'xlsx';
import { nanoid } from 'nanoid';
import type { Asset, AssetType } from '../types/diagram';

export const columnAliases = {
  name: ['资产名称', '名称', '设备名称', 'name'],
  ip: ['IP地址', 'IP', 'ip'],
  type: ['设备类型', '类型', 'type'],
  model: ['设备型号', '型号', 'model'],
  zone: ['所属安全域', '安全域', 'zone'],
  notes: ['备注', '说明', 'notes'],
} as const;

export type ImportMode = 'overwrite' | 'append';

export interface AssetExcelParseError {
  type: 'missing_required_columns' | 'unrecognized_type' | 'duplicate_ip' | 'invalid_format';
  message: string;
  rowIndex?: number;
}

export interface AssetExcelParseResult {
  assets: Asset[];
  errors: AssetExcelParseError[];
  ignoredEmptyRows: number;
}

const canonicalTypeMap: Record<string, AssetType> = {
  防火墙: '防火墙',
  日志审计: '日志审计',
  数据库审计: '数据库审计',
  堡垒机: '堡垒机',
  vpn: 'VPN',
  VPN: 'VPN',
  ips: 'IPS',
  IPS: 'IPS',
  ids: 'IDS',
  IDS: 'IDS',
  edr: 'EDR',
  EDR: 'EDR',
  上网行为管理: '上网行为管理',
  态势感知: '态势感知',
  探针: '探针',
  交换机: '交换机',
  路由器: '路由器',
  网关: '网关',
  单台服务器: '单台服务器',
  服务器集群: '服务器集群',
  数据库: '数据库',
  其他设备: '其他设备',
};

const normalize = (value: unknown) => String(value ?? '').trim();

const findColumn = (headers: string[], aliases: readonly string[]): number => {
  const lowerHeaders = headers.map((h) => h.trim().toLowerCase());
  for (const alias of aliases) {
    const idx = lowerHeaders.indexOf(alias.toLowerCase());
    if (idx >= 0) return idx;
  }

  return -1;
};

const toAssetType = (rawType: string): AssetType | undefined => {
  return canonicalTypeMap[rawType.trim().toLowerCase()] ?? canonicalTypeMap[rawType.trim()];
};

export const parseAssetExcelFile = async (file: File): Promise<AssetExcelParseResult> => {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return {
        assets: [],
        errors: [{ type: 'invalid_format', message: '文件格式错误：未找到工作表。' }],
        ignoredEmptyRows: 0,
      };
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, { header: 1, raw: false });

    if (!rows.length) {
      return {
        assets: [],
        errors: [{ type: 'invalid_format', message: '文件格式错误：内容为空。' }],
        ignoredEmptyRows: 0,
      };
    }

    const headers = (rows[0] ?? []).map((cell) => normalize(cell));
    const nameCol = findColumn(headers, columnAliases.name);
    const ipCol = findColumn(headers, columnAliases.ip);
    const typeCol = findColumn(headers, columnAliases.type);
    const modelCol = findColumn(headers, columnAliases.model);
    const zoneCol = findColumn(headers, columnAliases.zone);
    const notesCol = findColumn(headers, columnAliases.notes);

    if (nameCol < 0 || ipCol < 0 || typeCol < 0) {
      return {
        assets: [],
        errors: [
          {
            type: 'missing_required_columns',
            message: '缺少必填列：资产名称(name)、IP(ip)、设备类型(type) 至少需匹配其别名之一。',
          },
        ],
        ignoredEmptyRows: 0,
      };
    }

    const errors: AssetExcelParseError[] = [];
    const assets: Asset[] = [];
    const seenIps = new Set<string>();
    let ignoredEmptyRows = 0;

    rows.slice(1).forEach((row, idx) => {
      const rowNumber = idx + 2;
      const name = normalize(row[nameCol]);
      const ip = normalize(row[ipCol]);
      const typeRaw = normalize(row[typeCol]);
      const model = modelCol >= 0 ? normalize(row[modelCol]) : '';
      const zoneName = zoneCol >= 0 ? normalize(row[zoneCol]) : '';
      const notes = notesCol >= 0 ? normalize(row[notesCol]) : '';

      if (!name && !ip && !typeRaw && !model && !zoneName && !notes) {
        ignoredEmptyRows += 1;
        return;
      }

      const assetType = toAssetType(typeRaw);
      if (!assetType) {
        errors.push({
          type: 'unrecognized_type',
          message: `第 ${rowNumber} 行设备类型未识别：${typeRaw || '(空)'}`,
          rowIndex: rowNumber,
        });
        return;
      }

      if (!ip) {
        errors.push({
          type: 'invalid_format',
          message: `第 ${rowNumber} 行 IP 为空。`,
          rowIndex: rowNumber,
        });
        return;
      }

      const ipKey = ip.toLowerCase();
      if (seenIps.has(ipKey)) {
        errors.push({
          type: 'duplicate_ip',
          message: `第 ${rowNumber} 行出现重复 IP：${ip}`,
          rowIndex: rowNumber,
        });
        return;
      }

      seenIps.add(ipKey);
      assets.push({
        id: nanoid(10),
        name: name || `未命名资产-${rowNumber}`,
        ip,
        type: assetType,
        model: model || undefined,
        zoneName: zoneName || undefined,
        notes: notes || undefined,
        sourceRowIndex: rowNumber,
        sourceFileName: file.name,
      });
    });

    return { assets, errors, ignoredEmptyRows };
  } catch {
    return {
      assets: [],
      errors: [{ type: 'invalid_format', message: '文件格式错误：无法读取或解析 Excel。' }],
      ignoredEmptyRows: 0,
    };
  }
};

export const downloadAssetExcelTemplate = () => {
  const supportedTypes: AssetType[] = [
    '防火墙',
    '日志审计',
    '数据库审计',
    '堡垒机',
    'VPN',
    'IPS',
    'IDS',
    'EDR',
    '上网行为管理',
    '态势感知',
    '探针',
    '交换机',
    '路由器',
    '网关',
    '单台服务器',
    '服务器集群',
    '数据库',
    '其他设备',
  ];
  const rows = [
    ['资产名称', 'IP地址', '设备类型', '设备型号', '所属安全域', '备注'],
    ['核心防火墙', '10.0.0.1', '防火墙', 'PA-VM', '生产区', '模板示例'],
    ['业务数据库', '10.0.1.20', '数据库', 'PostgreSQL', '数据区', '模板示例'],
  ];
  const guideRows = [
    ['使用说明', '内容'],
    ['支持的设备类型（选项）', supportedTypes.join('、')],
    ['模板约束', '设备类型列为单选下拉，请勿手填其他值'],
    ['设备类型填写建议', '请仅使用下拉列表中固定选项'],
  ];
  const optionRows = [['设备类型选项'], ...supportedTypes.map((type) => [type])];

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const guideSheet = XLSX.utils.aoa_to_sheet(guideRows);
  const optionSheet = XLSX.utils.aoa_to_sheet(optionRows);
  (sheet as XLSX.WorkSheet & { ['!dataValidation']?: unknown })['!dataValidation'] = [
    {
      type: 'list',
      allowBlank: false,
      sqref: 'C2:C500',
      formulas: ['设备类型选项!$A$2:$A$19'],
    },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Assets');
  XLSX.utils.book_append_sheet(workbook, guideSheet, '说明');
  XLSX.utils.book_append_sheet(workbook, optionSheet, '设备类型选项');
  workbook.Workbook = {
    Sheets: [
      { name: 'Assets', Hidden: 0 },
      { name: '说明', Hidden: 0 },
      { name: '设备类型选项', Hidden: 1 },
    ],
  };
  XLSX.writeFile(workbook, 'assessor-blade-assets-template.xlsx');
};
