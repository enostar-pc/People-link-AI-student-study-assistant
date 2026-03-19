
def try_read(filename):
    for enc in ['utf-8', 'utf-16', 'utf-16-le', 'cp1252']:
        try:
            with open(filename, 'r', encoding=enc) as f:
                content = f.read()
                print(f"--- Decoded with {enc} ---")
                print(content[:500])
                return
        except Exception:
            continue
    print("Failed to decode")

try_read('debug_output.txt')
