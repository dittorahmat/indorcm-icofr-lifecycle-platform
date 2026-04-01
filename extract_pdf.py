from pypdf import PdfReader

reader = PdfReader("2024peraturan tk eselon i005.pdf")
text = ""
for page in reader.pages:
    text += page.extract_text() + "\n"

with open("regulation_text.txt", "w", encoding="utf-8") as f:
    f.write(text)
