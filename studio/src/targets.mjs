const clean = text => text.replace(/^#{1,6}\s+/, '').replaceAll('**', '').replaceAll('`', '').trim();
export function findEditorTarget(doc, { anchor, assetPath } = {}) {
  const quote = clean(anchor?.quote || '');
  const found = [];
  doc.descendants((node, pos) => {
    if (assetPath && node.type.name === 'image' && node.attrs.src === assetPath) found.push({ pos, from: pos, to: pos });
    else if (node.type.name === 'academyScreenshot' && quote.includes(node.attrs.id)) found.push({ pos, from: pos, to: pos });
    else if (quote && node.type.name === 'academyBox' && clean(node.attrs.title || '') === quote) found.push({ pos, from: pos + 1, to: pos + 1 });
    else if (quote && node.isTextblock && clean(node.textContent).includes(quote)) found.push({ pos, from: pos + 1, to: pos + node.nodeSize - 1 });
  });
  return found.length === 1 ? found[0] : null;
}
export function validateImageFile(file) {
  if (!file || !['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('Bitte ein PNG-, JPEG- oder WebP-Bild verwenden.');
  if (file.size > 2 * 1024 * 1024) throw new Error('Das Bild ist zu groß. Maximal 2 MB.');
  return file;
}
