
import chardet
with open('debug_output.txt', 'rb') as f:
    rawdata = f.read()
    result = chardet.detect(rawdata)
    encoding = result['encoding']
    print(f"Detected encoding: {encoding}")
    print(rawdata.decode(encoding))
