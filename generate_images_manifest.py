# Generador de images.json para el repo "votacions"
# Uso: python generate_images_manifest.py

import os, json

IMAGES_DIR = "images"
EXTS = (".jpg", ".jpeg", ".png", ".webp", ".gif")

manifest = []
for fname in sorted(os.listdir(IMAGES_DIR)):
    if not fname.lower().endswith(EXTS):
        continue
    image_id = os.path.splitext(fname)[0]
    # Título legible: reemplaza guiones/underscores por espacios y capitaliza
    title = image_id.replace("-", " ").replace("_", " ").title()
    manifest.append({
        "id": image_id,
        "url": f"{IMAGES_DIR}/{fname}",
        "titulo": title
    })

with open("images.json", "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"Generadas {len(manifest)} entradas en images.json")
