import os
import re
import pathlib
import json

# Configuration
BASE_DIR = r"d:\\Ummy_Dev_Live"
ARTIFACT_ROOT = r"C:\\Users\\HP\\.gemini\\antigravity\\brain\\b4912832-7494-47ec-84c3-9f044464852c"
REPORT_DIR = os.path.join(ARTIFACT_ROOT, "analysis_reports")
os.makedirs(REPORT_DIR, exist_ok=True)

# Simple set of extensions considered plain‑text source files
TEXT_EXTS = {
    ".js", ".jsx", ".ts", ".tsx", ".json", ".md", ".py", ".java", ".kt",
    ".html", ".css", ".scss", ".txt", ".gradle", ".properties", ".xml",
    ".sh", ".ps1", ".c", ".cpp", ".h", ".hpp",
}

# Helper to decide if a file is text based on extension
def is_text_file(path: str) -> bool:
    return pathlib.Path(path).suffix.lower() in TEXT_EXTS

# Helper to extract a short description from the file (first comment block or docstring)
def extract_description(lines: list[str]) -> str:
    # Look for leading comment lines (//#, //, /*, #, """")
    desc_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("#") or stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
            # remove comment markers
            cleaned = re.sub(r"^[#\/\*]+", "", stripped).strip()
            if cleaned:
                desc_lines.append(cleaned)
        elif stripped.startswith('"""') or stripped.startswith("'''"):
            # start of docstring – capture until closing triple quotes
            doc = []
            start_index = lines.index(line) + 1
            for doc_line in lines[start_index:]:
                if doc_line.strip().endswith('"""') or doc_line.strip().endswith("'''"):
                    break
                doc.append(doc_line.rstrip())
            return " ".join(doc).strip()
        else:
            # stop at first non‑comment line
            break
    return " ".join(desc_lines).strip()

# Helper to find TODO/FIXME markers
def find_todos(lines: list[str]) -> list[str]:
    todos = []
    for i, line in enumerate(lines, start=1):
        if "TODO" in line or "FIXME" in line:
            todos.append(f"Line {i}: {line.strip()}")
    return todos

# Simple regex to capture function / class definitions for common languages
FUNC_REGEX = re.compile(r"^(def|function|class|public|private|protected|static|async|export)\s+([A-Za-z0-9_]+)")

def find_defs(lines: list[str]) -> list[str]:
    defs = []
    for i, line in enumerate(lines, start=1):
        m = FUNC_REGEX.search(line)
        if m:
            defs.append(f"Line {i}: {m.group(0).strip()}")
    return defs

# Prepare master index file
index_path = os.path.join(REPORT_DIR, "analysis_report.md")
with open(index_path, "w", encoding="utf-8") as idx:
    idx.write("# Codebase Analysis Report\n\n")
    idx.write("This document links to detailed analyses of each folder in the repository.\n\n")

# Walk the repository
for root, dirs, files in os.walk(BASE_DIR):
    rel_root = os.path.relpath(root, BASE_DIR)
    # Skip hidden directories like .git, .next, node_modules, etc.
    if any(part.startswith('.') for part in pathlib.Path(rel_root).parts):
        continue
    if "node_modules" in dirs:
        dirs.remove("node_modules")
    if ".git" in dirs:
        dirs.remove(".git")

    # Determine the report file for this folder
    safe_folder = rel_root.replace(os.sep, "_").replace("..", "parent")
    if safe_folder == ".":
        safe_folder = "root"
    report_path = os.path.join(REPORT_DIR, f"{safe_folder}_report.md")
    with open(report_path, "w", encoding="utf-8") as rpt:
        rpt.write(f"# Analysis of {rel_root}\n\n")
        for file_name in files:
            file_path = os.path.join(root, file_name)
            if not is_text_file(file_path):
                continue
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.readlines()
            except Exception:
                continue
            rel_path = os.path.relpath(file_path, BASE_DIR)
            rpt.write(f"## {rel_path}\n\n")
            # Description
            desc = extract_description(content)
            if desc:
                rpt.write(f"**Description:** {desc}\n\n")
            # TODO/FIXME
            todos = find_todos(content)
            if todos:
                rpt.write("**TODO / FIXME:**\n\n")
                for t in todos:
                    rpt.write(f"- {t}\n")
                rpt.write("\n")
            # Definitions
            defs = find_defs(content)
            if defs:
                rpt.write("**Definitions (functions / classes):**\n\n")
                for d in defs:
                    rpt.write(f"- {d}\n")
                rpt.write("\n")
        rpt.write("---\n\n")

    # Add link to index
    with open(index_path, "a", encoding="utf-8") as idx:
        idx.write(f"- [{rel_root}]({os.path.relpath(report_path, REPORT_DIR)})\n")

print("Analysis complete. Reports written to", REPORT_DIR)
