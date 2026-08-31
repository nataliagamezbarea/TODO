#!/usr/bin/env python3
"""Compilador HTML estático modular.

Fuente canónica:
  templates/html/componentes/  -> piezas reutilizables
  templates/html/modales/      -> modales aislados
  templates/html/paginas/      -> páginas fuente

Salida:
  Los archivos bajo templates/html/paginas/ se publican desde la raíz,
  conservando su estructura (paginas/modulos/X.html -> modulos/X.html).

Sintaxis:
  <!-- @include: templates/html/componentes/navbar.html -->
  {{INICIO_HREF}}

No necesita Node ni servidor de componentes.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "templates" / "html" / "paginas"
LEGACY_SOURCE = ROOT / "plantillas"
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


def compile_tree(source_root: Path, output_prefix: Path = Path("")):
    for source in sorted(source_root.rglob("*.html")):
        rel = source.relative_to(source_root)
        # depth is based on the PUBLIC output path, not on templates/html/paginas.
        depth = len(rel.parts) - 1
        values = {"INICIO_HREF": "/inicio"}
        output = render(source.read_text(encoding="utf-8"), values)
        target = ROOT / output_prefix / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(output, encoding="utf-8")
        print(f"[OK] {target.relative_to(ROOT)}")


def main():
    if SOURCE.exists():
        compile_tree(SOURCE)
    else:
        # Compatibilidad con V7/V8 si alguien borra la nueva fuente.
        compile_tree(LEGACY_SOURCE)


if __name__ == "__main__":
    main()
