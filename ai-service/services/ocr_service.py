"""Optional local OCR (Tesseract). Everything works without it: the vision model reads
images directly. Used (a) as a hint when OCR_HINTS=true, (b) as the text source if a
non-vision provider is plugged in."""
import io
import shutil


class OCRService:
    def available(self) -> bool:
        try:
            import pytesseract  # noqa: F401
        except ImportError:
            return False
        return shutil.which("tesseract") is not None

    def extract_text(self, jpeg_bytes: bytes) -> str:
        if not self.available():
            return ""
        import pytesseract
        from PIL import Image
        try:
            return pytesseract.image_to_string(Image.open(io.BytesIO(jpeg_bytes))).strip()[:4000]
        except Exception:
            return ""
