"""Собирает PDF призов студии: чек-лист визуализации и два набора промптов.

Три разные вёрстки по брендбуку «Нейро Отличник»: чек-лист — чертёжный лист A4 (checklist.html, sheet.css),
улучшение — презентация A4 альбомом, пролёты — сторис 9:16 (layouts.py). Печать — headless Chrome, галочки — поля PDF (PyMuPDF).
Шрифты Kica и Inter Tight в репозиторий не входят: берутся из проекта neuro-maket.

Запуск (нужны Google Chrome и `pip install pymupdf`):
  python3 prizes/src/build.py [--brand ~/Developer/neuro-maket]
Результат: prizes/*.pdf и prizes/*.md (тексты промптов для копирования).
"""
import argparse, glob, json, os, shutil, subprocess, sys, tempfile
import pymupdf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from layouts import improve_html, fly_html  # noqa: E402  — у каждого набора своя вёрстка

SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(SRC)
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
CHECKBOX = 'https://checkbox.invalid/'


def fonts(brand, dst):
    os.makedirs(dst)
    for w in ('Bold', 'Light'):
        shutil.copy(f'{brand}/public/fonts/Kica-{w}.woff2', f'{dst}/Kica-{w}.woff2')
    for sub in ('cyrillic', 'latin'):
        for w in ('400', '600'):
            src = glob.glob(f'{brand}/dist/assets/inter-tight-{sub}-{w}-normal-*.woff2')
            if not src:
                sys.exit(f'нет Inter Tight {sub} {w} в {brand}/dist/assets — соберите neuro-maket (npm run build)')
            shutil.copy(src[0], f'{dst}/inter-tight-{sub}-{w}.woff2')
    for w in ('Regular', 'SemiBold'):  # стрелки и знаки, которых нет в подмножествах Inter Tight
        shutil.copy(f'{brand}/public/fonts/Inter-{w}-symbols.woff2', f'{dst}/Inter-{w}-symbols.woff2')


def prompts_md(s):
    out = [f'# {s["title"]} {s["title_outline"]}: 10 промптов студии «Нейро Отличник»', '', s['lead'], '',
           f'**Где запускать.** {s["where"]}', '', '**Правила**', '']
    out += [f'{i}. {r}' for i, r in enumerate(s['rules'], 1)] + ['']
    for i, it in enumerate(s['items'], 1):
        out += [f'## {i:02d}. {it["title"]}', '', f'*Когда:* {it["when"]}', '', '```text', it['prompt'], '```', '', f'*Совет:* {it["tip"]}', '']
    r = s['recipe']
    chain = ' → '.join(f'{n:02d} {s["items"][n - 1]["title"]}' for n in r['steps'])
    out += [f'## {r["title"]}', '', r['lead'], '', chain, '', r['note'], '']
    return '\n'.join(out)


def print_pdf(page, pdf):
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--no-pdf-header-footer',
                    '--virtual-time-budget=15000', '--run-all-compositor-stages-before-draw', f'--print-to-pdf={pdf}',
                    'file://' + page], check=True, capture_output=True)


def finish(pdf, dst, title):
    """Метки-ссылки галочек → кликабельные поля PDF; метаданные; сжатие."""
    doc = pymupdf.open(pdf)
    n = 0
    for page in doc:
        for link in page.get_links():
            if not link.get('uri', '').startswith(CHECKBOX):
                continue
            w = pymupdf.Widget()
            w.field_type = pymupdf.PDF_WIDGET_TYPE_CHECKBOX
            w.field_name = link['uri'][len(CHECKBOX):]
            w.rect = link['from']
            w.border_width = 0
            w.border_color = None
            w.fill_color = None
            w.text_color = (42 / 255, 42 / 255, 42 / 255)
            w.field_value = False
            page.add_widget(w)
            page.delete_link(link)
            n += 1
    doc.set_metadata({'title': title, 'author': 'Нейро Отличник', 'subject': 'Приз игры «Собери проект»',
                      'creator': 'neurootlichnik.ru', 'producer': 'Нейро Отличник'})
    doc.save(dst, garbage=4, deflate=True, deflate_images=True)
    print(f'{os.path.basename(dst)}: {doc.page_count} стр., галочек {n}, {os.path.getsize(dst) // 1024} КБ')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--brand', default=os.path.expanduser('~/Developer/neuro-maket'))
    ap.add_argument('--keep', help='папка, куда сложить HTML сборки для просмотра')
    a = ap.parse_args()
    tmp = a.keep or os.path.join(tempfile.mkdtemp(prefix='prizes-'), 'build')
    if a.keep and os.path.exists(tmp):
        shutil.rmtree(tmp)
    shutil.copytree(SRC, tmp, ignore=shutil.ignore_patterns('*.py', '*.json', '__pycache__'))
    fonts(a.brand, f'{tmp}/fonts')
    data = json.load(open(f'{SRC}/prompts.json', encoding='utf-8'))
    jobs = [('checklist.html', 'chek-list-vizualizatsii', 'Чек-лист: визуализация для подачи')]
    for key, s in data.items():
        page = (improve_html if key == 'improve' else fly_html)(s, SRC)
        open(f'{tmp}/{s["file"]}.html', 'w', encoding='utf-8').write(page)
        open(f'{OUT}/{s["file"]}.md', 'w', encoding='utf-8').write(prompts_md(s))
        jobs.append((f'{s["file"]}.html', s['file'], f'{s["title"]} {s["title_outline"]}: 10 промптов'))
    for page, name, title in jobs:
        raw = f'{tmp}/{name}.raw.pdf'
        print_pdf(f'{tmp}/{page}', raw)
        finish(raw, f'{OUT}/{name}.pdf', title)


if __name__ == '__main__':
    main()
