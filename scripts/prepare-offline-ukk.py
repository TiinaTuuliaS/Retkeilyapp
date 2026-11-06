"""Prepare a bounded MML raster pilot; never fetch OSM tile-server images.
Run with .tools/offline-python/Scripts/python.exe scripts/prepare-offline-ukk.py.
Dependencies: pillow, numpy, pyproj, rasterio (project-local environment).
"""
import hashlib
import json
from pathlib import Path
import urllib.request
import os
import pyproj
# Isolate from a system PostGIS PROJ_DATA setting; no system settings change.
os.environ['PROJ_DATA'] = pyproj.datadir.get_data_dir()
os.environ['PROJ_LIB'] = pyproj.datadir.get_data_dir()
import numpy as np
from PIL import Image
from rasterio.transform import from_bounds, from_origin
from rasterio.warp import reproject, Resampling, transform_bounds

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://www.nic.funet.fi/index/geodata/mml/peruskartta/2025/V5/V52/V5211R.png'
BOUNDS = [27.38, 68.32, 27.56, 68.40]  # west, south, east, north; Kiilopää–Luulampi pilot
work = ROOT / '.tools/offline-map'
work.mkdir(parents=True, exist_ok=True)
source = work / 'V5211R.png'
if not source.exists():
    urllib.request.urlretrieve(SOURCE, source)
Image.MAX_IMAGE_PIXELS = 200_000_000
im = Image.open(source)
assert im.size == (12000, 12000), im.size
# World file: 1 m pixels, top-left pixel centre 512000.5, 7589999.5.
dst_bounds = transform_bounds('EPSG:4326', 'EPSG:3857', *BOUNDS)
dst_transform = from_bounds(*dst_bounds, 2000, 2400)
result = np.zeros((3, 2400, 2000), dtype=np.uint8)
rgb = np.array(im.convert('RGB'))
for band in range(3):
    reproject(rgb[:, :, band], result[band], src_transform=from_origin(512000, 7590000, 1, 1),
              src_crs='EPSG:3067', dst_transform=dst_transform, dst_crs='EPSG:3857',
              resampling=Resampling.bilinear)
output = ROOT / 'frontend/public/offline'
output.mkdir(parents=True, exist_ok=True)
target = output / 'ukk-kiilopaa.webp'
Image.fromarray(np.moveaxis(result, 0, -1)).save(target, 'WEBP', lossless=True)
payload = target.read_bytes()
manifest = dict(id='ukk-kiilopaa-v1', parkSlug='ukk', name='UKK · Kiilopää–Luulampi',
    bounds=BOUNDS, image='/offline/ukk-kiilopaa.webp', bytes=len(payload),
    sha256=hashlib.sha256(payload).hexdigest(), dataYear=2025, source=SOURCE,
    attribution='Maastotiedot © Maanmittauslaitos 2025 · CC BY 4.0 · jakelu CSC/Paituli',
    licenseUrl='https://creativecommons.org/licenses/by/4.0/')
(output / 'ukk.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(manifest, ensure_ascii=False))
