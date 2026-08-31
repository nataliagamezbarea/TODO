#!/usr/bin/env python3
"""
Compilador HTML estático modular.
- Resuelve <!-- @include: ruta/archivo.html -->
- Sustituye tokens {{NOMBRE}}
- No necesita servidor, Node ni librerías externas.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / "plantillas"
INCLUDE = re.compile(r"<!--\s*@include:\s*([^>]+?)\s*-->")
TOKEN = re.compile(r"\{\{([A-Z0-9_]+)\}\}")

def render(text, values=None, stack=()):
    values = values or {}
    def inc(match):
        rel = match.group(1).strip()
        if rel in stack:
            raise RuntimeError("Include circular: " + " -> ".join((*stack, rel)))
        p = ROOT / rel
        if not p.exists():
            raise FileNotFoundError(f"No existe el componente: {rel}")
        return render(p.read_text(encoding="utf-8"), values, (*stack, rel))
    text = INCLUDE.sub(inc, text)
    return TOKEN.sub(lambda m: values.get(m.group(1), m.group(0)), text)

def main():
    for source in TEMPLATES.rglob("*.html"):
        rel = source.relative_to(TEMPLATES)
        depth = len(rel.parts) - 1
        values = {"INICIO_HREF": "../" * depth + "inicio.html"}
        output = render(source.read_text(encoding="utf-8"), values)
        target = ROOT / rel
        target.write_text(output, encoding="utf-8")
        print(f"[OK] {rel}")

if __name__ == "__main__":
    main()
