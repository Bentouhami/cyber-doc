import importlib.util
import pathlib
import sys
import unittest
from unittest.mock import patch


def _load_module():
    script_path = (
        pathlib.Path(__file__).resolve().parents[1] / "scripts" / "detect_task_overlap.py"
    )
    spec = importlib.util.spec_from_file_location("detect_task_overlap", script_path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load detect_task_overlap module")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class DetectTaskOverlapDevFallbackTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mod = _load_module()

    def test_falls_back_to_origin_dev_when_local_dev_is_missing(self):
        responses = iter(
            [
                ([], "fatal: ambiguous argument 'dev': unknown revision", 128),
                (["abc123 fix: TASKKEY"], None, 0),
            ]
        )

        def fake_collect_lines(_cmd, _max_lines):
            return next(responses)

        with patch.object(self.mod, "collect_lines", side_effect=fake_collect_lines):
            hits, warnings = self.mod.collect_dev_history_hits("TASKKEY", 8)

        self.assertEqual(hits, ["abc123 fix: TASKKEY"])
        self.assertIn("Git ref 'dev' not available; trying fallback.", warnings)

    def test_returns_empty_hits_with_warning_when_both_refs_are_missing(self):
        responses = iter(
            [
                ([], "fatal: bad revision 'dev'", 128),
                ([], "fatal: bad revision 'origin/dev'", 128),
            ]
        )

        def fake_collect_lines(_cmd, _max_lines):
            return next(responses)

        with patch.object(self.mod, "collect_lines", side_effect=fake_collect_lines):
            hits, warnings = self.mod.collect_dev_history_hits("TASKKEY", 8)

        self.assertEqual(hits, [])
        self.assertIn(
            "Neither 'dev' nor 'origin/dev' is available locally; dev-history evidence skipped.",
            warnings,
        )

    def test_raises_when_git_command_is_missing(self):
        responses = iter(
            [
                ([], "Executable not found for command 'git'", 127),
            ]
        )

        def fake_collect_lines(_cmd, _max_lines):
            return next(responses)

        with patch.object(self.mod, "collect_lines", side_effect=fake_collect_lines):
            with self.assertRaises(RuntimeError):
                self.mod.collect_dev_history_hits("TASKKEY", 8)


if __name__ == "__main__":
    unittest.main()
