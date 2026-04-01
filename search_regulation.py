import re

keywords = ["remediasi", "tindak lanjut", "kekurangan", "lampiran 10", "lampiran 11"]
pattern = re.compile("|".join(keywords), re.IGNORECASE)

with open("regulation_text.txt", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if pattern.search(line):
            print(f"L{i+1}: {line.strip()}")
