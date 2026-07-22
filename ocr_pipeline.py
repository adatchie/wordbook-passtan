#!/usr/bin/env python3
"""
Eiken Grade 3 Vocabulary Book OCR Pipeline
Scans all pages from the vocabulary book, extracts word|meaning pairs
using Gemini 2.5 Flash API, and outputs a consolidated JSON file.
"""
import os, sys, json, time, base64, glob
import urllib.request, urllib.error

# Load API key
GEMINI_KEY = None
with open(os.path.expanduser("~/.hermes/.env"), "r") as f:
    for line in f:
        if line.strip().startswith("GEMINI_API_KEY="):
            GEMINI_KEY = line.strip().split("=",1)[1]
            break

if not GEMINI_KEY:
    print("ERROR: GEMINI_API_KEY not found in ~/.hermes/.env")
    sys.exit(1)

API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_KEY}"

SCANS_DIR = "/home/adatc/wordbook-passtan/scans"
OUTPUT_JSON = "/home/adatc/wordbook-passtan/wordbook_all_raw.json"

PROMPT = """This is a page from a Japanese English vocabulary book for Eiken Grade 3.
Transcribe ALL vocabulary entries on this page.
For each entry output exactly one line in this format:
word | japanese_meaning

Rules:
- word = the English word or phrase exactly as printed (preserve hyphens, spaces)
- japanese_meaning = the Japanese meaning(s) exactly as printed
- Do NOT include entry numbers, IPA, katakana pronunciation, or example sentences
- Do NOT include any headers, footers, page numbers, or commentary
- If there are conversation expressions (会話表現), include those too
- Output ONLY the word | meaning lines, nothing else
"""

def image_to_base64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

def call_gemini(image_b64):
    payload = {
        "contents": [{
            "parts": [
                {"text": PROMPT},
                {"inline_data": {"mime_type": "image/jpeg", "data": image_b64}}
            ]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 4096
        }
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(API_URL, data=data, headers={"Content-Type": "application/json"})
    
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                result = json.loads(resp.read())
                text = result["candidates"][0]["content"]["parts"][0]["text"]
                return text.strip()
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 30 * (attempt + 1)
                print(f"  429 rate limited, waiting {wait}s...")
                time.sleep(wait)
            else:
                print(f"  HTTP {e.code}: {e.read().decode()[:200]}")
                return None
        except Exception as e:
            print(f"  Error: {e}")
            if attempt < 2:
                time.sleep(10)
    return None

def parse_entries(text):
    entries = []
    for line in text.split("\n"):
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("---"):
            continue
        if "|" in line:
            parts = line.split("|", 1)
            word = parts[0].strip()
            meaning = parts[1].strip()
            if word and meaning:
                entries.append({"word": word, "meaning": meaning})
    return entries

def main():
    # Get sorted list of scan files
    files = sorted(glob.glob(os.path.join(SCANS_DIR, "*.jpg")))
    print(f"Found {len(files)} scan files")
    
    all_entries = []
    raw_outputs = {}
    
    # Check for existing progress
    progress_file = OUTPUT_JSON.replace(".json", "_progress.json")
    if os.path.exists(progress_file):
        with open(progress_file, "r") as f:
            progress = json.load(f)
        all_entries = progress.get("entries", [])
        raw_outputs = progress.get("raw", {})
        processed = set(progress.get("processed", []))
        print(f"Resuming: {len(processed)} pages already done, {len(all_entries)} entries so far")
    else:
        processed = set()
    
    for i, filepath in enumerate(files):
        fname = os.path.basename(filepath)
        if fname in processed:
            continue
            
        print(f"[{i+1}/{len(files)}] Processing {fname}...")
        
        img_b64 = image_to_base64(filepath)
        result = call_gemini(img_b64)
        
        if result:
            entries = parse_entries(result)
            all_entries.extend(entries)
            raw_outputs[fname] = result
            processed.add(fname)
            print(f"  Extracted {len(entries)} entries")
        else:
            print(f"  FAILED - will retry next run")
        
        # Save progress every 5 pages
        if (i + 1) % 5 == 0:
            with open(progress_file, "w") as f:
                json.dump({"entries": all_entries, "raw": raw_outputs, "processed": list(processed)}, f, ensure_ascii=False)
            print(f"  Progress saved: {len(all_entries)} total entries")
        
        # Rate limit: wait between pages
        time.sleep(2)
    
    # Save final output
    with open(progress_file, "w") as f:
        json.dump({"entries": all_entries, "raw": raw_outputs, "processed": list(processed)}, f, ensure_ascii=False)
    
    with open(OUTPUT_JSON, "w") as f:
        json.dump(all_entries, f, ensure_ascii=False, indent=2)
    
    print(f"\n=== DONE ===")
    print(f"Total pages processed: {len(processed)}/{len(files)}")
    print(f"Total entries: {len(all_entries)}")
    print(f"Output: {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
