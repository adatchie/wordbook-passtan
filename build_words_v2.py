import json
import re

# === 1. 既存の3級データを読み込み ===
with open('/home/adatc/wordbook-passtan/web-prototype/words.json', 'r', encoding='utf-8') as f:
    existing = json.load(f)

grade3_words = existing['words']
print(f"Grade 3 (existing): {len(grade3_words)} words")

# タグを確認（既に eiken-grade3, set1〜set13 がついているはず）
for w in grade3_words:
    if 'eiken-grade3' not in w.get('tags', []):
        w['tags'].insert(0, 'eiken-grade3')

# === 2. 準2級データをパース ===
with open('/home/adatc/wordbook-passtan/passtan-grade2pre.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# パターン: 番号. word : 意味
pattern = re.compile(r'^(\d+)\.\s*(.+?)\s*:\s*(.+)$')

pre2_raw = []
for line in text.split('\n'):
    line = line.strip()
    if not line:
        continue
    m = pattern.match(line)
    if m:
        word = m.group(2).strip()
        meaning = m.group(3).strip()
        if word and meaning:
            pre2_raw.append({'word': word, 'meaning': meaning})

print(f"Pre-2 (parsed): {len(pre2_raw)} words")

# 重複排除
seen = set()
pre2_unique = []
for entry in pre2_raw:
    key = entry['word'].lower()
    if key not in seen:
        seen.add(key)
        pre2_unique.append(entry)

print(f"Pre-2 (unique): {len(pre2_unique)} words")

# === 3. 100語ずつのブロックに分割 ===
pre2_words = []
for i, entry in enumerate(pre2_unique):
    block = (i // 100) + 1
    word_id = f"pre2-{i+1:04d}"
    pre2_words.append({
        'id': word_id,
        'word': entry['word'],
        'meaningJa': entry['meaning'],
        'enabled': True,
        'tags': ['eiken-pre2', f'set{block}']
    })

print(f"Pre-2 blocks: set1〜set{(len(pre2_unique)-1)//100+1}")

# === 4. 統合して words.json に出力 ===
all_words = grade3_words + pre2_words

output = {
    'version': '2026-07-22',
    'source': 'Eiken Grade 3 (OCR) + Pre-2 (text) passtan wordbook',
    'words': all_words
}

for path in [
    '/home/adatc/wordbook-passtan/web-prototype/words.json',
    '/home/adatc/wordbook-passtan/docs/words.json'
]:
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"Written: {path}")

# ブロック別統計
from collections import Counter
grade3_blocks = Counter()
pre2_blocks = Counter()
for w in grade3_words:
    for t in w.get('tags', []):
        if t.startswith('set'):
            grade3_blocks[t] += 1
for w in pre2_words:
    for t in w.get('tags', []):
        if t.startswith('set'):
            pre2_blocks[t] += 1

print(f"\n=== Grade 3 ===")
for k in sorted(grade3_blocks.keys(), key=lambda x: int(x[3:])):
    print(f"  {k}: {grade3_blocks[k]} words")
print(f"  Total: {sum(grade3_blocks.values())} words")

print(f"\n=== Pre-2 ===")
for k in sorted(pre2_blocks.keys(), key=lambda x: int(x[3:])):
    print(f"  {k}: {pre2_blocks[k]} words")
print(f"  Total: {sum(pre2_blocks.values())} words")

print(f"\n=== Grand Total: {len(all_words)} words ===")
