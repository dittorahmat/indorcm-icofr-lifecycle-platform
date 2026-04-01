import pdfplumber
import json

pdf_path = "2024peraturan tk eselon i005.pdf"

print("=" * 80)
print("ANALISIS PDF: 2024peraturan tk eselon i005.pdf")
print("=" * 80)

with pdfplumber.open(pdf_path) as pdf:
    print(f"\n📊 STATISTIK DOKUMEN:")
    print(f"   Total halaman: {len(pdf.pages)}")
    
    # Extract metadata
    if pdf.metadata:
        print(f"\n📋 METADATA:")
        for key, value in pdf.metadata.items():
            print(f"   {key}: {value}")
    
    print(f"\n📝 EKSTRAKSI TEXT (Sample):")
    print("-" * 80)
    
    total_chars = 0
    sample_pages = []
    
    for i, page in enumerate(pdf.pages[:5]):  # First 5 pages sample
        text = page.extract_text()
        if text:
            total_chars += len(text)
            sample_pages.append({
                'page': i + 1,
                'char_count': len(text),
                'preview': text[:200].replace('\n', ' ')
            })
            print(f"\n[Halaman {i+1}] ({len(text)} characters)")
            print(text[:500])  # First 500 chars per page
            print("...")
    
    print("\n" + "=" * 80)
    print(f"ESTIMASI TOTAL: ~{total_chars * (len(pdf.pages) // 5)} characters ({total_chars * (len(pdf.pages) // 5) / 1000:.1f}K chars)")
    print("=" * 80)
    
    # Structure analysis
    print(f"\n🔍 ANALISIS STRUKTUR DOKUMEN:")
    print("-" * 80)
    
    # Check for common patterns
    all_text = ""
    for page in pdf.pages:
        all_text += page.extract_text() or ""
    
    # Count sections
    bab_count = all_text.count("BAB ")
    pasal_count = all_text.count("Pasal ")
    ayat_markers = all_text.count("(") + all_text.count(")")  # Approximate ayat count
    
    print(f"   Ditemukan:")
    print(f"   - BAB: ~{bab_count}")
    print(f"   - Pasal: ~{pasal_count}")
    print(f"   - Ayat (estimasi): ~{ayat_markers // 2}")
    
    # Check for tables
    table_count = 0
    for page in pdf.pages:
        tables = page.extract_tables()
        if tables:
            table_count += len(tables)
    
    print(f"   - Tabel: {table_count}")
    
    print("\n" + "=" * 80)
    print("KESIMPULAN UNTUK MVP:")
    print("=" * 80)
    
    if len(pdf.pages) <= 50 and total_chars < 500000:
        print("✅ REKOMENDASI: Gunakan pendekatan SIMPLE (Option A)")
        print("   - Extract semua text")
        print("   - Pass sebagai context ke Gemini API")
        print("   - Tidak perlu RAG/vector search")
    else:
        print("⚠️ DOKUMEN TERLALU BESAR")
        print("   Pertimbangkan:")
        print("   - Chunking + RAG")
        print("   - Atau extract hanya bab/pasal relevan")
    
    print("\n" + "=" * 80)
