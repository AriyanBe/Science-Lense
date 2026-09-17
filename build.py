"""Validate Zotero metadata and build a reproducible XPI (Python standard library)."""
from pathlib import Path
import json
import re
from urllib.parse import urlparse
import zipfile

REQUIRED_FILES = {'manifest.json', 'bootstrap.js', 'core.js'}


def validate_manifest(manifest):
    if manifest.get('manifest_version') != 2:
        raise ValueError('Expected a Zotero manifest_version 2 plugin')
    for key in ('name', 'version'):
        if not isinstance(manifest.get(key), str) or not manifest[key].strip():
            raise ValueError(f'Missing {key}')
    if not re.fullmatch(r'\d+\.\d+\.\d+', manifest['version']):
        raise ValueError('Use a three-part numeric plugin version')
    target = manifest.get('applications', {}).get('zotero', {})
    # These are enforced in Zotero 10.0.2 ExtensionData.parseManifest().
    for key in ('id', 'update_url', 'strict_max_version'):
        if not isinstance(target.get(key), str) or not target[key].strip():
            raise ValueError(f'applications.zotero.{key} not provided')
    # XPIDatabase.providesUpdatesSecurely requires HTTPS under default settings.
    url = urlparse(target['update_url'])
    if url.scheme != 'https' or not url.hostname or url.username or url.password:
        raise ValueError('Zotero requires an HTTPS update_url')
    if target.get('strict_min_version') != '10.0' or target['strict_max_version'] != '10.0.*':
        raise ValueError('This release is validated only for Zotero 10.0.x')


def validate_archive(path):
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
        if len(names) != len(set(names)):
            raise ValueError('Duplicate ZIP entries')
        if not REQUIRED_FILES <= set(names):
            raise ValueError('Plugin files must be at the XPI root, not inside a folder')
        if archive.testzip() is not None:
            raise ValueError('ZIP CRC validation failed')
        for name in names:
            if name.startswith('/') or '..' in Path(name).parts or '\\' in name:
                raise ValueError('Unsafe ZIP path')
            if not archive.read(name):
                raise ValueError(f'Empty plugin file: {name}')
        validate_manifest(json.loads(archive.read('manifest.json')))


def build(base=None):
    base = Path(base) if base else Path(__file__).resolve().parent
    source = base / 'src'
    manifest = json.loads((source / 'manifest.json').read_text(encoding='utf-8'))
    validate_manifest(manifest)
    if not all((source / name).is_file() for name in REQUIRED_FILES):
        raise ValueError('Missing required plugin source files')
    output_dir = base / 'dist'
    output_dir.mkdir(exist_ok=True)
    output = output_dir / f"science-lens-{manifest['version']}.xpi"
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(source.rglob('*')):
            if path.is_symlink():
                raise ValueError('Symlinks are not allowed in plugin source')
            if path.is_file():
                info = zipfile.ZipInfo(path.relative_to(source).as_posix(), (1980, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                archive.writestr(info, path.read_bytes())
    validate_archive(output)
    return output


if __name__ == '__main__':
    print(build())
