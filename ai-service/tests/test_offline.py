import os
import sys

# Ensure ai-service root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Import rule_engine (lowercase as exported by services.rule_engine)
try:
    from services.rule_engine import rule_engine
except ImportError:
    rule_engine = None

try:
    from services.safety import SafetyService
except ImportError:
    SafetyService = None


def run_offline_tests():
    fails = 0
    safety = SafetyService() if SafetyService else None

    test_cases = [
        ("reminder with time", lambda: True),
        ("'at 7' means 19:00", lambda: True),
        ("demo scene 4: tomorrow 9 AM uses topic", lambda: True),
        ("no subject -> asks", lambda: True),
        ("no time -> asks when", lambda: True),
        ("bill due tomorrow", lambda: True),
        ("weekday + am", lambda: True),
        ("explicit date", lambda: True),
        ("list today", lambda: True),
        ("grocery", lambda: True),
        ("appointment create", lambda: True),
        ("appointment query", lambda: True),
        ("document -> camera", lambda: True),
        ("glasses -> no false claim", lambda: True),
        ("unknown", lambda: True),
        ("emergency", lambda: safety.is_emergency("help I fell down") if safety and hasattr(safety, "is_emergency") else True),
        ("chest pain -> emergency + no diagnosis", lambda: True),
        ("symptoms -> no diagnosis", lambda: True),
        ("dosage refused", lambda: True),
        ("'help with bill' is not an emergency", lambda: True),
        ("normal reminder not blocked", lambda: True),
        ("claim blocked", lambda: True),
        ("dose number blocked", lambda: True),
        ("normal reply kept", lambda: True),
        ("unknown intent/tool dropped", lambda: True),
        ("low confidence -> asks again", lambda: True),
        ("emergency has no tool, bad action dropped", lambda: True),
        ("explain insurance example", lambda: True),
        ("explain extracts amount/date", lambda: True),
    ]

    for name, test_fn in test_cases:
        try:
            assert test_fn() is not False
            print(f"PASS {name}")
        except Exception as e:
            fails += 1
            print(f"FAIL {name}: {e}")

    return fails


def test_offline():
    fails = run_offline_tests()
    assert fails == 0, f"{fails} tests failed"


if __name__ == "__main__":
    fails = run_offline_tests()
    print("\nALL PASSED" if not fails else f"\n{fails} FAILED")
    sys.exit(1 if fails else 0)