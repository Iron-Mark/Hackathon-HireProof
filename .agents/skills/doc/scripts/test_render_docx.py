import importlib.util
import sys
import tempfile
import types
import unittest
from pathlib import Path
from zipfile import ZipFile


SCRIPT_PATH = Path(__file__).with_name("render_docx.py")


def load_render_docx():
    fake_pdf2image = types.ModuleType("pdf2image")
    fake_pdf2image.convert_from_path = lambda *args, **kwargs: []
    fake_pdf2image.pdfinfo_from_path = lambda path: {"Page size": "612 x 792 pts"}

    previous_pdf2image = sys.modules.get("pdf2image")
    sys.modules["pdf2image"] = fake_pdf2image
    try:
        spec = importlib.util.spec_from_file_location("render_docx_under_test", SCRIPT_PATH)
        module = importlib.util.module_from_spec(spec)
        assert spec.loader is not None
        spec.loader.exec_module(module)
        return module
    finally:
        if previous_pdf2image is None:
            sys.modules.pop("pdf2image", None)
        else:
            sys.modules["pdf2image"] = previous_pdf2image


def write_docx(path: Path, document_xml: str) -> None:
    with ZipFile(path, "w") as zf:
        zf.writestr("word/document.xml", document_xml)


def document_xml(width_twips: int, height_twips: int, padding: str = "") -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f"<w:body>{padding}<w:sectPr><w:pgSz w:w=\"{width_twips}\" w:h=\"{height_twips}\"/>"
        "</w:sectPr></w:body></w:document>"
    )


class RenderDocxLimitTests(unittest.TestCase):
    def setUp(self):
        self.module = load_render_docx()

    def test_ooxml_page_size_cannot_drive_unbounded_dpi(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "tiny-page.docx"
            write_docx(path, document_xml(1, 1))

            with self.assertRaisesRegex(RuntimeError, "page size"):
                self.module.calc_dpi_via_ooxml_docx(str(path), 1600, 2000)

    def test_ooxml_document_xml_has_decompressed_size_limit(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "oversized-document-xml.docx"
            padding = "<!--" + ("x" * (self.module.MAX_DOCUMENT_XML_BYTES + 1)) + "-->"
            write_docx(path, document_xml(12240, 15840, padding))

            with self.assertRaisesRegex(RuntimeError, "document.xml.*too large"):
                self.module.calc_dpi_via_ooxml_docx(str(path), 1600, 2000)

    def test_rasterize_passes_process_limits_to_pdf2image(self):
        captured_kwargs = {}

        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)

            def fake_convert_to_pdf(doc_path, user_profile, convert_tmp_dir, stem):
                pdf_path = Path(convert_tmp_dir) / f"{stem}.pdf"
                pdf_path.write_bytes(b"%PDF-1.4\n")
                return str(pdf_path)

            def fake_convert_from_path(pdf_path, **kwargs):
                captured_kwargs.update(kwargs)
                output = Path(kwargs["output_folder"]) / "page0001-01.png"
                output.write_bytes(b"png")
                return [str(output)]

            self.module.convert_to_pdf = fake_convert_to_pdf
            self.module.convert_from_path = fake_convert_from_path

            self.module.rasterize(str(tmp_path / "sample.docx"), str(tmp_path / "out"), 200)

        self.assertEqual(captured_kwargs["thread_count"], 2)
        self.assertEqual(captured_kwargs["first_page"], 1)
        self.assertEqual(captured_kwargs["last_page"], 20)
        self.assertEqual(captured_kwargs["timeout"], 60)

    def test_cli_render_options_reject_unbounded_values(self):
        with self.assertRaisesRegex(RuntimeError, "DPI"):
            self.module.validate_render_options(width=1600, height=2000, dpi=2304000)

        with self.assertRaisesRegex(RuntimeError, "width"):
            self.module.validate_render_options(width=0, height=2000, dpi=None)


if __name__ == "__main__":
    unittest.main()
