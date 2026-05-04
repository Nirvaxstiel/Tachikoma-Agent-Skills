import json
import re
from typing import Any, Dict

COMPRESSIBLE_EXTENSIONS = {".md", ".txt", ".markdown", ".rst"}

SKIP_EXTENSIONS = {
    ".py",
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".json",
    ".yaml",
    ".yml",
    ".toml",
    ".env",
    ".lock",
    ".css",
    ".scss",
    ".html",
    ".xml",
    ".sql",
    ".sh",
    ".bash",
    ".zsh",
    ".go",
    ".rs",
    ".java",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".rb",
    ".php",
    ".swift",
    ".kt",
    ".lua",
    ".dockerfile",
    ".makefile",
    ".csv",
    ".ini",
    ".cfg",
}

CODE_PATTERNS = [
    re.compile(r"^\s*(import |from .+ import |require\(|const |let |var )"),
    re.compile(r"^\s*(def |class |function |async function |export )"),
    re.compile(r"^\s*(if\s*\(|for\s*\(|while\s*\(|switch\s*\(|try\s*\{)"),
    re.compile(r"^\s*[\}\]\);]+\s*$"),
    re.compile(r"^\s*@\w+"),
    re.compile(r'^\s*"[^"]+"\s*:\s*'),
    re.compile(r"^\s*\w+\s*=\s*[{\[(\"']"),
]

URL_REGEX = re.compile(r"https?://[^\s)]+")
CODE_BLOCK_REGEX = re.compile(r"```.*?```", re.DOTALL)
HEADING_REGEX = re.compile(r"^(#{1,6})\s+(.*)", re.MULTILINE)
BULLET_REGEX = re.compile(r"^\s*[-*+]\s+", re.MULTILINE)
PATH_REGEX = re.compile(
    r"(?:\./|\.\./|/|[A-Za-z]:\\)[\w\-/\\\.]+|[\w\-\.]+[/\\][\w\-/\\\.]+"
)

COMPRESS_PROMPT = """Compress the following text into caveman format.

STRICT RULES:
- Do NOT modify anything inside ``` code blocks
- Do NOT modify anything inside inline backticks
- Preserve ALL URLs exactly as-is
- Preserve ALL headings (## etc) exactly
- Preserve file paths and commands
- Use short, direct phrases
- Drop filler words (the, a, an, is, are, was, were, etc)
- Keep technical terms precise
- Use caveman speak: noun-verb, short punchy sentences
- Keep bullet structure but compress bullet text

Only compress natural language. Leave code/URLs/paths untouched."""


def _is_code_line(line: str) -> bool:
    return any(p.match(line) for p in CODE_PATTERNS)


def _is_json_content(text: str) -> bool:
    try:
        import json as _json

        _json.loads(text)
        return True
    except (ValueError, Exception):
        return False


def _is_yaml_content(lines: list) -> bool:
    yaml_indicators = 0
    for line in lines[:30]:
        stripped = line.strip()
        if stripped.startswith("---"):
            yaml_indicators += 1
        elif re.match(r"^\w[\w\s]*:\s", stripped):
            yaml_indicators += 1
        elif stripped.startswith("- ") and ":" in stripped:
            yaml_indicators += 1
    non_empty = sum(1 for l in lines[:30] if l.strip())
    return non_empty > 0 and yaml_indicators / non_empty > 0.6


def detect_file_type(content: str, file_path: str = "") -> str:
    if file_path:
        from pathlib import PurePosixPath, PureWindowsPath

        try:
            ext = PurePosixPath(file_path).suffix.lower()
            if not ext:
                try:
                    ext = PureWindowsPath(file_path).suffix.lower()
                except Exception:
                    ext = ""
        except Exception:
            ext = ""

        if ext in COMPRESSIBLE_EXTENSIONS:
            return "natural_language"
        if ext in SKIP_EXTENSIONS:
            config_exts = {".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".env"}
            return "config" if ext in config_exts else "code"

    if _is_json_content(content[:10000]):
        return "config"

    lines = content.splitlines()[:50]

    if _is_yaml_content(lines):
        return "config"

    code_lines = sum(1 for l in lines if l.strip() and _is_code_line(l))
    non_empty = sum(1 for l in lines if l.strip())
    if non_empty > 0 and code_lines / non_empty > 0.4:
        return "code"

    return "natural_language"


def _extract_headings(text):
    return [(level, title.strip()) for level, title in HEADING_REGEX.findall(text)]


def _extract_code_blocks(text):
    return CODE_BLOCK_REGEX.findall(text)


def _extract_urls(text):
    return set(URL_REGEX.findall(text))


def _extract_paths(text):
    return set(PATH_REGEX.findall(text))


def _count_bullets(text):
    return len(BULLET_REGEX.findall(text))


def _validate_content(original: str, compressed: str) -> Dict[str, Any]:
    errors = []
    warnings = []

    h1 = _extract_headings(original)
    h2 = _extract_headings(compressed)
    if len(h1) != len(h2):
        errors.append(f"Heading count mismatch: {len(h1)} vs {len(h2)}")
    if h1 != h2:
        warnings.append("Heading text/order changed")

    c1 = _extract_code_blocks(original)
    c2 = _extract_code_blocks(compressed)
    if c1 != c2:
        errors.append("Code blocks not preserved exactly")

    u1 = _extract_urls(original)
    u2 = _extract_urls(compressed)
    if u1 != u2:
        errors.append(f"URL mismatch: lost={u1 - u2}, added={u2 - u1}")

    p1 = _extract_paths(original)
    p2 = _extract_paths(compressed)
    if p1 != p2:
        warnings.append(f"Path mismatch: lost={p1 - p2}, added={p2 - p1}")

    b1 = _count_bullets(original)
    b2 = _count_bullets(compressed)
    if b1 > 0:
        diff = abs(b1 - b2) / b1
        if diff > 0.15:
            warnings.append(f"Bullet count changed too much: {b1} -> {b2}")

    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "stats": {
            "original_chars": len(original),
            "compressed_chars": len(compressed),
            "compression_ratio": round(len(compressed) / max(len(original), 1), 2),
            "headings_preserved": len(h1) == len(h2) and h1 == h2,
            "code_blocks_preserved": c1 == c2,
            "urls_preserved": u1 == u2,
        },
    }


async def caveman_compress(arguments: Dict[str, Any]) -> str:
    content = arguments.get("content", "")
    file_path = arguments.get("file_path", "")

    if not content:
        return json.dumps({"error": "No content provided", "is_valid": False})

    file_type = detect_file_type(content, file_path)

    if file_type != "natural_language":
        return json.dumps(
            {
                "compressible": False,
                "file_type": file_type,
                "message": f"File detected as '{file_type}' - not compressible. Only natural language text can be compressed.",
            }
        )

    return json.dumps(
        {
            "compressible": True,
            "file_type": file_type,
            "instructions": COMPRESS_PROMPT,
            "content": content,
            "validation_rules": [
                "All code blocks (```) must be preserved exactly",
                "All URLs must be preserved exactly",
                "All headings must be preserved exactly",
                "All file paths must be preserved",
                "Bullet count must not change by more than 15%",
            ],
            "next_step": "Compress the content following the instructions, then call caveman_validate with original + compressed to verify.",
        },
        ensure_ascii=False,
    )


async def caveman_validate(arguments: Dict[str, Any]) -> str:
    original = arguments.get("original", "")
    compressed = arguments.get("compressed", "")

    if not original or not compressed:
        return json.dumps(
            {
                "error": "Both 'original' and 'compressed' content are required",
                "is_valid": False,
            }
        )

    result = _validate_content(original, compressed)
    return json.dumps(result, ensure_ascii=False)
