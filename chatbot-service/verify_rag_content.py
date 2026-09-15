import sys
import logging
import requests

sys.stdout.reconfigure(encoding='utf-8')
logging.basicConfig(level=logging.INFO)

# 1. Kiểm tra số lượng và mẫu documents trong Qdrant
res = requests.post(
    'http://localhost:6333/collections/movie_knowledge/points/scroll',
    json={'limit': 6, 'with_payload': True, 'with_vector': False}
).json()

print("\n=== CÁC TÀI LIỆU MẪU ĐÃ ĐƯỢC EMBED VÀO QDRANT ===")
for p in res['result']['points']:
    payload = p['payload']
    print(f"- ID: {payload.get('id')} | Loại: {payload.get('type')} | Tiêu đề: {payload.get('title')}")

# 2. Thống kê theo loại tài liệu
all_points = requests.post(
    'http://localhost:6333/collections/movie_knowledge/points/scroll',
    json={'limit': 1000, 'with_payload': True, 'with_vector': False}
).json()['result']['points']

type_counts = {}
for p in all_points:
    t = p['payload'].get('type', 'unknown')
    type_counts[t] = type_counts.get(t, 0) + 1

print("\n=== THỐNG KÊ PHÂN LOẠI TRONG QDRANT ===")
for t, count in type_counts.items():
    print(f"- {t}: {count} tài liệu")
print(f"Tổng cộng đã lưu trữ: {len(all_points)} tài liệu")
