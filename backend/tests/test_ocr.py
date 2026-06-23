import io
import unittest
from PIL import Image
from app.services.ocr_service import OCRService

class TestOCRService(unittest.TestCase):
    def test_unsupported_format(self):
        # Create a synthetic GIF image (unsupported)
        f = io.BytesIO()
        img = Image.new("RGB", (100, 100), color="white")
        img.save(f, format="GIF")
        gif_bytes = f.getvalue()

        with self.assertRaises(ValueError) as context:
            OCRService.extract_text_from_image(gif_bytes)
        self.assertIn("Unsupported image format", str(context.exception))

    def test_corrupted_image(self):
        # Pass random bytes that cannot be parsed as an image
        bad_bytes = b"not-a-real-image-payload-corrupted"
        with self.assertRaises(ValueError) as context:
            OCRService.extract_text_from_image(bad_bytes)
        self.assertIn("Corrupted or invalid", str(context.exception))

    def test_empty_image(self):
        with self.assertRaises(ValueError) as context:
            OCRService.extract_text_from_image(b"")
        self.assertIn("Empty image files", str(context.exception))

    def test_valid_image_fallback(self):
        # Create a synthetic PNG image (supported)
        f = io.BytesIO()
        img = Image.new("RGB", (200, 100), color="white")
        img.save(f, format="PNG")
        png_bytes = f.getvalue()

        # Should successfully parse (or trigger mock fallback if Tesseract isn't installed)
        result = OCRService.extract_text_from_image(png_bytes)
        self.assertIsInstance(result, dict)
        self.assertIn("ocr_confidence", result)
        self.assertIn("extracted_text", result)
        self.assertIsInstance(result["ocr_confidence"], float)
        self.assertIsInstance(result["extracted_text"], str)

if __name__ == "__main__":
    unittest.main()
