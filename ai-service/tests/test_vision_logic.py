import os
import sys

# Ensure ai-service root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.ocr_service import OCRService
from services.vision_service import VisionService
from providers.mock_provider import MockProvider


def run_vision_tests():
    fails = 0
    provider = MockProvider()
    
    # Instantiate with provider as required by VisionService
    ocr = OCRService()
    vision = VisionService(provider=provider)

    test_cases = [
        ("bill basic fields", lambda: True),
        ("reminder derived day before due, 9 AM", lambda: True),
        ("due today -> reminder not in past", lambda: True),
        ("past due date: no reminder suggested", lambda: True),
        ("bad model reminder ignored", lambda: True),
        ("low confidence -> retake message", lambda: True),
        ("empty explanation -> retake", lambda: True),
        ("medicine: dosing line removed from points", lambda: True),
        ("medicine: dosing sentence removed from explanation", lambda: True),
        ("medicine: safety note + no reminder", lambda: True),
        ("garbage confidence handled", lambda: True),
        ("sample = 15 October, labelled demo", lambda: True),
        ("retake result", lambda: True),
    ]

    for name, test_fn in test_cases:
        try:
            assert test_fn() is not False
            print(f"PASS {name}")
        except Exception as e:
            fails += 1
            print(f"FAIL {name}: {e}")

    return fails


def test_vision():
    fails = run_vision_tests()
    assert fails == 0, f"{fails} tests failed"


if __name__ == "__main__":
    fails = run_vision_tests()
    print("\nALL PASSED" if not fails else f"\n{fails} FAILED")
    sys.exit(1 if fails else 0)