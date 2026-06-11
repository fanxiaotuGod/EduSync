#!/usr/bin/env python3
"""Convert EduSync learning guide Markdown to a styled PDF via Chrome headless."""

import re
import subprocess
import sys
from pathlib import Path

import markdown
from markdown.extensions.tables import TableExtension
from markdown.extensions.fenced_code import FencedCodeExtension
from markdown.extensions.toc import TocExtension


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>{title}</title>
<style>
  @page {{
    size: A4;
    margin: 20mm 18mm 22mm 18mm;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    font-family: -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    font-size: 10.5pt;
    line-height: 1.65;
    color: #1a1a1a;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }}
  .cover {{
    page-break-after: always;
    min-height: 90vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 2rem 0;
    border-bottom: 4px solid #2563eb;
  }}
  .cover h1 {{
    font-size: 28pt;
    color: #1e3a8a;
    margin: 0 0 0.5rem;
    line-height: 1.25;
  }}
  .cover .subtitle {{
    font-size: 14pt;
    color: #475569;
    margin-bottom: 2rem;
  }}
  .cover .meta {{
    font-size: 10pt;
    color: #64748b;
    line-height: 1.8;
  }}
  .cover .meta strong {{ color: #334155; }}
  h1 {{
    font-size: 18pt;
    color: #1e40af;
    border-bottom: 2px solid #dbeafe;
    padding-bottom: 0.35rem;
    margin-top: 1.8rem;
    page-break-after: avoid;
  }}
  h2 {{
    font-size: 13pt;
    color: #1d4ed8;
    margin-top: 1.4rem;
    page-break-after: avoid;
  }}
  h3 {{
    font-size: 11pt;
    color: #2563eb;
    margin-top: 1rem;
    page-break-after: avoid;
  }}
  p {{ margin: 0.5rem 0; }}
  ul, ol {{ margin: 0.4rem 0 0.8rem 1.2rem; padding-left: 0.5rem; }}
  li {{ margin: 0.25rem 0; }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 0.8rem 0 1.2rem;
    font-size: 9pt;
    page-break-inside: avoid;
  }}
  th {{
    background: #eff6ff;
    color: #1e40af;
    font-weight: 600;
    text-align: left;
    padding: 8px 10px;
    border: 1px solid #bfdbfe;
  }}
  td {{
    padding: 7px 10px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }}
  tr:nth-child(even) td {{ background: #f8fafc; }}
  code {{
    font-family: "SF Mono", Menlo, Monaco, monospace;
    font-size: 8.5pt;
    background: #f1f5f9;
    padding: 0.1em 0.35em;
    border-radius: 3px;
    color: #0f172a;
  }}
  pre {{
    background: #0f172a;
    color: #e2e8f0;
    padding: 12px 14px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 8pt;
    line-height: 1.5;
    page-break-inside: avoid;
    margin: 0.8rem 0;
  }}
  pre code {{
    background: transparent;
    color: inherit;
    padding: 0;
  }}
  blockquote {{
    border-left: 4px solid #3b82f6;
    margin: 1rem 0;
    padding: 0.5rem 1rem;
    background: #f0f9ff;
    color: #1e3a8a;
    page-break-inside: avoid;
  }}
  hr {{
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 1.5rem 0;
  }}
  a {{ color: #2563eb; text-decoration: none; }}
  .toc {{
    page-break-after: always;
    padding-bottom: 1rem;
  }}
  .toc h2 {{ margin-top: 0; }}
  .toc ul {{ list-style: none; margin-left: 0; padding-left: 0; }}
  .toc li {{ margin: 0.35rem 0; }}
  .toc a {{ color: #334155; }}
  .footer-note {{
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
    font-size: 9pt;
    color: #64748b;
    text-align: center;
  }}
</style>
</head>
<body>
<div class="cover">
  <h1>EduSync 阶段学习总结</h1>
  <div class="subtitle">Google 一键登录 + 全栈部署实战知识手册</div>
  <div class="meta">
    <strong>项目：</strong>EduSync（React/Vite + Flask + Supabase）<br>
    <strong>日期：</strong>2026年6月10日<br>
    <strong>前端：</strong>https://edu-sync-gamma.vercel.app<br>
    <strong>后端：</strong>https://edusync-production-6d33.up.railway.app/api<br>
    <strong>用途：</strong>复盘今日 OAuth / 部署踩坑，作为下次上线的检查清单
  </div>
</div>
{toc_block}
<div class="content">
{body}
</div>
<div class="footer-note">EduSync Learning Guide · Generated 2026-06-10 · 保存此 PDF 供 Apple/GitHub 登录与换域名时复用</div>
</body>
</html>
"""


def strip_leading_title(md: str) -> str:
    lines = md.splitlines()
    if lines and lines[0].startswith("# "):
        lines = lines[1:]
    return "\n".join(lines).lstrip()


def build_toc_html(md: str) -> str:
    items = []
    for line in md.splitlines():
        m = re.match(r"^## (\d+)\.\s+(.+)$", line)
        if m:
            num, title = m.groups()
            anchor = f"section-{num}"
            items.append(f'<li><a href="#{anchor}">{num}. {title}</a></li>')
    if not items:
        return ""
    return '<div class="toc"><h2>目录</h2><ul>' + "".join(items) + "</ul></div>"


def add_section_anchors(html: str) -> str:
    def repl(match):
        num = match.group(1)
        title = match.group(2)
        return f'<h2 id="section-{num}">{num}. {title}</h2>'

    return re.sub(r"<h2>(\d+)\.\s+([^<]+)</h2>", repl, html)


def main() -> int:
    if len(sys.argv) < 3:
        print("Usage: md_to_pdf.py <input.md> <output.pdf>")
        return 1

    md_path = Path(sys.argv[1]).resolve()
    pdf_path = Path(sys.argv[2]).resolve()
    html_path = pdf_path.with_suffix(".html")

    md_text = md_path.read_text(encoding="utf-8")
    body_md = strip_leading_title(md_text)

    body_html = markdown.markdown(
        body_md,
        extensions=[
            TableExtension(),
            FencedCodeExtension(),
            TocExtension(permalink=False),
            "nl2br",
        ],
    )
    body_html = add_section_anchors(body_html)

    toc_block = build_toc_html(md_text)
    title = "EduSync 阶段学习总结"
    html = HTML_TEMPLATE.format(title=title, toc_block=toc_block, body=body_html)
    html_path.write_text(html, encoding="utf-8")

    chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    cmd = [
        chrome,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        html_path.as_uri(),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stderr or result.stdout)
        return result.returncode

    if not pdf_path.exists():
        print("PDF was not created")
        return 1

    print(f"PDF: {pdf_path}")
    print(f"HTML: {html_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
