"""
Prepare Maison Dorée logo assets:
1. White-background JPEG → for the webpage sidebar (public/logo-maison-doree.jpg)
2. Transparent PNG composited on black rounded-square → for PDFs (public/logo-pdf.png)
3. Favicon from white JPEG → public/favicon.ico
"""
from PIL import Image, ImageDraw
import os

SRC_WHITE = '/home/z/my-project/upload/Photoroom-20261006_205006495.jpg'
SRC_TRANSPARENT = '/home/z/my-project/upload/IMG-20260901-WA0006.png'

OUT_DIR = '/home/z/my-project/public'

# ========= 1. White-background logo for the webpage =========
img_white = Image.open(SRC_WHITE).convert('RGB')
# Crop to content (remove uniform white border)
# Use a simple approach: find non-white bounding box
import numpy as np
arr = np.array(img_white)
# Pixels that are "not white" (below 230 in any channel)
mask = (arr < 230).any(axis=2)
if mask.any():
    ys, xs = np.where(mask)
    bbox = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    # Add a small padding
    pad = 20
    w, h = img_white.size
    bbox = (
        max(0, bbox[0] - pad),
        max(0, bbox[1] - pad),
        min(w, bbox[2] + pad),
        min(h, bbox[3] + pad),
    )
    img_white_cropped = img_white.crop(bbox)
else:
    img_white_cropped = img_white

# Resize to a reasonable size (keep aspect, max 512px)
img_white_cropped.thumbnail((512, 512), Image.LANCZOS)
out_white = os.path.join(OUT_DIR, 'logo-maison-doree.jpg')
img_white_cropped.save(out_white, 'JPEG', quality=95)
print(f'✓ White logo saved: {out_white} ({img_white_cropped.size})')

# ========= 2. Transparent PNG composited on black rounded background for PDFs =========
img_transparent = Image.open(SRC_TRANSPARENT).convert('RGBA')
# Crop to content bounding box
bbox = img_transparent.getbbox()
if bbox:
    # Add a small padding so the logo isn't flush against the edge
    pad = 30
    w, h = img_transparent.size
    bbox = (
        max(0, bbox[0] - pad),
        max(0, bbox[1] - pad),
        min(w, bbox[2] + pad),
        min(h, bbox[3] + pad),
    )
    img_cropped = img_transparent.crop(bbox)
else:
    img_cropped = img_transparent

# Make it square (pad with transparency to the shorter side)
w, h = img_cropped.size
side = max(w, h)
square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
offset = ((side - w) // 2, (side - h) // 2)
square.paste(img_cropped, offset, img_cropped)
img_square = square

# Resize to 512x512 for the PDF
img_square = img_square.resize((512, 512), Image.LANCZOS)

# Create a black rounded-square background and composite the logo on top
bg_size = 512
bg = Image.new('RGB', (bg_size, bg_size), (0, 0, 0))
# Draw a rounded rectangle mask
mask = Image.new('L', (bg_size, bg_size), 0)
mask_draw = ImageDraw.Draw(mask)
radius = bg_size // 2  # circle
mask_draw.ellipse([0, 0, bg_size - 1, bg_size - 1], fill=255)
# Composite black onto a transparent base using the circle mask
bg_composite = Image.new('RGBA', (bg_size, bg_size), (0, 0, 0, 0))
black_layer = Image.new('RGBA', (bg_size, bg_size), (0, 0, 0, 255))
bg_composite.paste(black_layer, (0, 0), mask)

# Composite the logo on top
final = Image.new('RGBA', (bg_size, bg_size), (0, 0, 0, 0))
final.paste(bg_composite, (0, 0))
final.paste(img_square, (0, 0), img_square)

# Save as PNG (keeps the black circle with transparent corners)
out_pdf = os.path.join(OUT_DIR, 'logo-pdf.png')
final.save(out_pdf, 'PNG')
print(f'✓ PDF logo (black rounded bg) saved: {out_pdf} ({final.size})')

# ========= 3. Favicon from white JPEG =========
img_fav = Image.open(SRC_WHITE).convert('RGB')
# Crop to content
arr2 = np.array(img_fav)
mask2 = (arr2 < 230).any(axis=2)
if mask2.any():
    ys, xs = np.where(mask2)
    bbox2 = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    img_fav = img_fav.crop(bbox2)
# Make square
w, h = img_fav.size
side = max(w, h)
sq = Image.new('RGB', (side, side), (255, 255, 255))
sq.paste(img_fav, ((side - w) // 2, (side - h) // 2))
sq = sq.resize((64, 64), Image.LANCZOS)
out_ico = os.path.join(OUT_DIR, 'favicon.ico')
sq.save(out_ico, format='ICO')
print(f'✓ Favicon saved: {out_ico} ({sq.size})')

print('\nAll assets prepared successfully.')
