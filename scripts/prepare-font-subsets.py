"""Optional asset regeneration: python -m pip install fonttools brotli first.

Run from the repository root after npm ci. Fonts retain their original glyphs,
contextual alternates and variable weight axes; only character coverage changes.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset

common = list(range(0xA0, 0xC0)) + [0xD7, 0xF7] + list(range(0x2000, 0x2070)) + [0x20AC, 0x2122, 0x2191, 0x2193, 0x2212, 0x2215, 0xFEFF, 0xFFFD]
jobs = [
    ('caveat', 'latin', list(range(0x20, 0x41)) + list(range(0x5B, 0x61)) + list(range(0x7B, 0x80)) + common, 'caveat-common'),
    ('nunito-sans', 'latin', list(range(0x20, 0x80)) + [0xA0] + common, 'nunito-common'),
    ('nunito-sans', 'latin-ext', [0x20BD], 'nunito-ruble'),
]
for family, alphabet, characters, name in jobs:
    source = Path(f'node_modules/@fontsource-variable/{family}/files/{family}-{alphabet}-wght-normal.woff2')
    font = TTFont(source)
    cutter = subset.Subsetter()
    cutter.populate(unicodes=characters)
    cutter.subset(font)
    font.flavor = 'woff2'
    destination = Path(f'public/fonts/{name}-wght-v1.woff2')
    font.save(destination)
    print(destination, destination.stat().st_size)
