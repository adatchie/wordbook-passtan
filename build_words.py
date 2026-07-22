import json

# OCRデータを読み込み
with open('/home/adatc/wordbook-passtan/wordbook_all_raw.json', 'r', encoding='utf-8') as f:
    raw = json.load(f)

print(f"Raw entries: {len(raw)}")

# 重複排除（同じwordの最初の出現を優先）
seen_words = set()
unique = []
for entry in raw:
    word = entry['word'].strip().lower()
    if word and word not in seen_words:
        seen_words.add(word)
        unique.append({
            'word': entry['word'].strip(),
            'meaning': entry['meaning'].strip()
        })

print(f"Unique entries: {len(unique)}")

# 100語ずつのブロックに分割（set 1〜13）
words_json = []
for i, entry in enumerate(unique):
    block = (i // 100) + 1  # 1-indexed
    word_id = f"word-{i+1:04d}"
    words_json.append({
        'id': word_id,
        'word': entry['word'],
        'meaningJa': entry['meaning'],
        'enabled': True,
        'tags': ['eiken-grade3', f'set{block}']
    })

# words.json 形式で出力
output = {
    'version': '2026-07-13',
    'source': 'Eiken Grade 3 passtan wordbook (OCR scanned)',
    'words': words_json
}

# web-prototype と docs 両方に配置
for path in [
    '/home/adatc/wordbook-passtan/web-prototype/words.json',
    '/home/adatc/wordbook-passtan/docs/words.json'
]:
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"Written: {path}")

# ブロック別の統計
from collections import Counter
blocks = Counter(w['tags'][1] for w in words_json)
for k in sorted(blocks.keys()):
    print(f"  {k}: {blocks[k]} words")
print(f"Total: {len(words_json)} words")
