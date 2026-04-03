import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, ImageRun, HeadingLevel, PageBreak } from 'docx';
import { toPng } from 'html-to-image';
import { Node } from '@xyflow/react';
import { Asset } from '../types';

export const exportWordByZones = async (
  canvasElement: HTMLElement,
  zones: Node[],
  assets: Asset[]
): Promise<void> => {
  const paragraphs: Paragraph[] = [];

  for (let i = 0; i < zones.length; i += 1) {
    const zone = zones[i];
    const zoneName = (zone.data as { title?: string } | undefined)?.title ?? `Zone ${i + 1}`;

    // 基础实现：当前版本先截取整个画布，后续可按 zone 坐标裁剪。
    const dataUrl = await toPng(canvasElement, { cacheBust: true, pixelRatio: 2 });
    const bytes = Uint8Array.from(atob(dataUrl.split(',')[1]), (ch) => ch.charCodeAt(0));

    const zoneAssets = assets.filter((asset) => asset.zone === zoneName);
    const rows = [
      new TableRow({
        children: ['名称', 'IP', '类型', '型号'].map(
          (header) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })] })
        )
      }),
      ...zoneAssets.map(
        (asset) =>
          new TableRow({
            children: [asset.name, asset.ip, asset.type, asset.model ?? '-'].map(
              (value) => new TableCell({ children: [new Paragraph(value)] })
            )
          })
      )
    ];

    paragraphs.push(
      new Paragraph({ text: zoneName, heading: HeadingLevel.HEADING_1 }),
      new Paragraph({
        children: [
          new ImageRun({
            data: bytes,
            transformation: { width: 620, height: 320 }
          })
        ]
      }),
      new Paragraph({ text: '资产明细', heading: HeadingLevel.HEADING_2 })
    );

    const table = new Table({ rows, width: { size: 100, type: 'pct' } });
    paragraphs.push(new Paragraph({ children: [new TextRun('')] }));
    // docx 当前版本类型定义限制，借助 any 插入 table。
    (paragraphs as unknown as Array<Paragraph | Table>).push(table);

    if (i !== zones.length - 1) {
      paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  const doc = new Document({ sections: [{ children: paragraphs as any }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'assessor-report.docx';
  anchor.click();
  URL.revokeObjectURL(url);
};
