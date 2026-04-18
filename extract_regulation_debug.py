import fitz  # PyMuPDF
import os

def extract_pdf_text(file_path):
    print(f"Opening file: {file_path}")
    if not os.path.exists(file_path):
        print("Error: File not found!")
        return

    try:
        doc = fitz.open(file_path)
        full_text = ""
        
        print(f"Total pages: {len(doc)}")
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text("text")
            full_text += f"\n--- PAGE {page_num + 1} ---\n"
            full_text += text
            print(f"Page {page_num + 1} extracted. Length so far: {len(full_text)}")
            
        output_file = "extracted_debug_result.txt"
        with open(output_file, "w", encoding="utf-8") as f:
            with open("extracted_debug_result.json", "w", encoding="utf-8") as fj:
                import json
                fj.write(json.dumps({"content": full_text}))
            f.write(full_text)
            
        print(f"\nSUCCESS!")
        print(f"Total characters extracted: {len(full_text)}")
        print(f"Result saved to: {output_file}")
        
        # Preview first 500 chars
        print("\n--- PREVIEW (First 500 chars) ---")
        print(full_text[:500])
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    pdf_path = "docs/2024peraturan tk eselon i005.pdf"
    extract_pdf_text(pdf_path)
