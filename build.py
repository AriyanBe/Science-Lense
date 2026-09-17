"""Build a Zotero XPI; Python standard library only."""
from pathlib import Path
import json
import zipfile
base = Path(__file__).resolve().parent
manifest = json.loads((base / 'src/manifest.json').read_text())
(base / "dist").mkdir(exist_ok=True)
output = base / "dist" / f"science-lens-{manifest['version']}.xpi"
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as z:
    for path in sorted((base / 'src').rglob('*')):
        if path.is_file():
            z.write(path, path.relative_to(base / 'src'))
with zipfile.ZipFile(output) as z:
    assert z.testzip() is None
    assert {'manifest.json', 'bootstrap.js', 'core.js'} <= set(z.namelist())
print(output)
