import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('builder', ROOT / 'build.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class PackagingTests(unittest.TestCase):
    def setUp(self):
        self.manifest = json.loads((ROOT / 'src/manifest.json').read_text())

    def test_current_manifest(self):
        builder.validate_manifest(self.manifest)

    def test_original_010_regression(self):
        del self.manifest['applications']['zotero']['update_url']
        with self.assertRaisesRegex(ValueError, 'update_url not provided'):
            builder.validate_manifest(self.manifest)

    def test_update_security(self):
        for url in ('http://example.invalid/updates.json', 'data:application/json,{}'):
            with self.subTest(url=url):
                self.manifest['applications']['zotero']['update_url'] = url
                with self.assertRaisesRegex(ValueError, 'HTTPS'):
                    builder.validate_manifest(self.manifest)

    def test_required_zotero_fields(self):
        for key in ('id', 'strict_max_version'):
            data = copy.deepcopy(self.manifest)
            del data['applications']['zotero'][key]
            with self.subTest(key=key), self.assertRaisesRegex(ValueError, key):
                builder.validate_manifest(data)

    def test_nested_archive_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'nested.xpi'
            with zipfile.ZipFile(path, 'w') as archive:
                archive.writestr('src/manifest.json', json.dumps(self.manifest))
            with self.assertRaisesRegex(ValueError, 'XPI root'):
                builder.validate_archive(path)

    def test_reproducible_build_and_contents(self):
        path = builder.build(ROOT)
        first = path.read_bytes()
        self.assertEqual(builder.build(ROOT).read_bytes(), first)
        with zipfile.ZipFile(path) as archive:
            self.assertEqual(set(archive.namelist()), builder.REQUIRED_FILES)
            for name in archive.namelist():
                self.assertEqual(archive.read(name), (ROOT / 'src' / name).read_bytes())


if __name__ == '__main__':
    unittest.main()
