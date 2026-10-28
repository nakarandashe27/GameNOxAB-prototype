"""Собирает PDF призов студии: чек-лист визуализации и два набора промптов.

Вёрстка — HTML по брендбуку «Нейро Отличник», печать — headless Chrome, галочки — поля PDF (PyMuPDF).
Шрифты Kica и Inter Tight в репозиторий не входят: берутся из проекта neuro-maket.

Запуск (нужны Google Chrome и `pip install pymupdf`):
  python3 prizes/src/build.py [--brand ~/Developer/neuro-maket]
Результат: prizes/*.pdf и prizes/*.md (тексты промптов для копирования).
"""
import argparse, glob, html, json, os, shutil, subprocess, sys, tempfile
import pymupdf

SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(SRC)
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
CHECKBOX = 'https://checkbox.invalid/'
e = html.escape


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


def foot(label, right):
    return (f'<div class="foot"><span class="brand"><img src="img/glasses-lime.svg" alt="">Нейро Отличник · {label}</span>'
            f'<span>{right}</span></div>')


def prompt_card(i, it):
    return f'''<div class="card prompt">
  <div class="n">{i:02d}</div>
  <div>
    <div class="head"><h3>{e(it["title"])}</h3><span class="pill line">{e(it["when"])}</span></div>
    <div class="text">{e(it["prompt"])}</div>
    <div class="tip"><span class="pill">Совет</span><p>{e(it["tip"])}</p></div>
  </div>
</div>'''


def recipe(r, items):
    chain = '<span class="to">→</span>'.join(
        f'<span class="k">{n:02d}<small>{e(items[n - 1]["title"])}</small></span>' for n in r['steps'])
    return f'''<div class="card">
  <span class="pill lime">{e(r["title"])}</span>
  <p style="margin-bottom:12px">{e(r["lead"])}</p>
  <div class="chain">{chain}</div>
  <p class="muted" style="margin-top:12px">{e(r["note"])}</p>
</div>'''


def prompts_html(key, s):
    label = f'Промпты · {s["part"]}'
    items = s['items']
    if key == 'improve':
        cover_photo = '<div class="ph" style="position:absolute;left:56px;bottom:56px;width:380px;height:400px"><img src="img/chalet-after.jpg" alt="" style="object-position:center 40%"><span class="pill lime">После</span></div>'
        example = '''<div class="grid2">
    <div class="ph" style="height:160px"><img src="img/curve-before.jpg" alt=""><span class="pill">До</span></div>
    <div class="ph" style="height:160px"><img src="img/curve-after.jpg" alt=""><span class="pill lime">После</span></div>
  </div>
  <p class="cap">Рендер студии до и после улучшения: геометрия и ракурс не изменились, появились передний план, цветы и глубина.</p>'''
    else:
        cover_photo = '''<div class="ph" style="position:absolute;left:56px;bottom:56px;width:380px;height:400px"><img src="img/street-eve.jpg" alt="" style="object-position:center 60%"><span class="pill lime">1 кадр → 10 клипов</span>
    <span style="position:absolute;left:50%;top:50%;width:74px;height:74px;margin:-37px 0 0 -37px;border-radius:50%;background:var(--lime);border:3px solid var(--ink)"></span>
    <span style="position:absolute;left:50%;top:50%;margin:-14px 0 0 -8px;border-style:solid;border-width:14px 0 14px 24px;border-color:transparent transparent transparent var(--ink)"></span></div>'''
        example = '''<div class="grid2">
    <div class="ph" style="height:160px"><img src="img/street-day.jpg" alt="" style="object-position:center 62%"><span class="pill">Первый кадр</span></div>
    <div class="ph" style="height:160px"><img src="img/street-eve.jpg" alt="" style="object-position:center 62%"><span class="pill lime">Последний кадр</span></div>
  </div>
  <p class="cap">Пара «день и вечер» из одного ракурса — готовый таймлапс (промпт 07): загрузите кадры первым и последним.</p>'''
    index = ''.join(f'<li>{e(it["title"])}</li>' for it in items)
    rules = ''.join(f'<li>{e(r)}</li>' for r in s['rules'])
    pages = [f'''<section class="page paper cover">
  <span class="plus" style="left:22px;top:22px"></span><span class="plus" style="right:22px;top:22px"></span>
  <div class="top"><img class="logo" src="img/logo-lockup-dark.svg" alt="Нейро Отличник"><div class="ver"><span>I</span><i></i><span>V.1 · 2026</span></div></div>
  <img class="doodle" src="img/mark-spiral.svg" style="left:56px;top:118px;width:58px" alt="">
  <div style="margin-top:118px"><div class="eyebrow">{e(s["eyebrow"])}</div>
    <h1>{e(s["title"])}<span class="out">{e(s["title_outline"])}</span></h1></div>
  <p class="lead">{e(s["lead"])}</p>
  <div style="display:flex;gap:10px;flex-wrap:wrap"><span class="pill">Приз игры «Собери проект»</span><span class="pill line">10 промптов</span></div>
  {cover_photo}
  <img class="doodle" src="img/mark-arrow-curl.svg" style="left:455px;bottom:400px;width:50px" alt="">
  <img src="img/neuro-present.png" alt="" style="position:absolute;right:30px;bottom:0;height:470px">
</section>''', f'''<section class="page">
  <div class="sec"><div class="num">00</div><h2>Как пользоваться</h2><p>Выделите промпт в PDF, скопируйте целиком, замените [вставки] на свои — и запускайте.</p></div>
  <div class="card"><span class="pill">Где запускать</span><p>{e(s["where"])}</p></div>
  <div class="card"><span class="pill">Правила</span><ol class="steps">{rules}</ol></div>
  {example}
  <div class="card"><span class="pill lime">Внутри</span><ol class="steps" style="grid-template-columns:1fr 1fr;column-gap:22px">{index}</ol></div>
  {foot(label, "Как пользоваться · 2")}
</section>''']
    for p, start in enumerate((0, 3, 6)):
        cards = ''.join(prompt_card(start + j + 1, it) for j, it in enumerate(items[start:start + 3]))
        pages.append(f'''<section class="page">
  <div><span class="pill line">{e(s["title"])} {e(s["title_outline"])} · {start + 1:02d}–{start + 3:02d}</span></div>
  {cards}
  {foot(label, f"Промпты {start + 1:02d}–{start + 3:02d} · {p + 3}")}
</section>''')
    pages.append(f'''<section class="page">
  <div><span class="pill line">{e(s["title"])} {e(s["title_outline"])} · 10</span></div>
  {prompt_card(10, items[9])}
  {recipe(s["recipe"], items)}
  <div class="card dark" style="margin-top:auto;display:grid;grid-template-columns:1fr auto;gap:22px;align-items:center;padding:24px">
    <div>
      <h3 style="font-size:22px">Ещё больше разборов — в канале</h3>
      <p class="muted" style="margin-top:8px">Нейросети в архитектуре без воды: гайды, примеры «до/после» и новые инструменты. Канал ведёт студия «Нейро Отличник».</p>
      <p style="margin-top:14px;font:700 13px/1.5 'Kica',sans-serif;color:var(--lime)">t.me/NeuroOtlichnikArch<br>neurootlichnik.ru</p>
    </div>
    <div class="qr"><img src="img/qr-channel.svg" alt="QR-код канала"></div>
  </div>
  <img src="img/neuro-lying.png" alt="" style="position:absolute;right:70px;bottom:268px;width:330px">
  {foot(label, "Промпт 10 · 6")}
</section>''')
    return f'''<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>{e(s["title"])} {e(s["title_outline"])}: 10 промптов — Нейро Отличник</title>
<link rel="stylesheet" href="styles.css"></head><body>
{"".join(pages)}
</body></html>'''


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
    shutil.copytree(SRC, tmp, ignore=shutil.ignore_patterns('build.py', '*.json', '__pycache__'))
    fonts(a.brand, f'{tmp}/fonts')
    data = json.load(open(f'{SRC}/prompts.json', encoding='utf-8'))
    jobs = [('checklist.html', 'chek-list-vizualizatsii', 'Чек-лист: визуализация для подачи')]
    for key, s in data.items():
        open(f'{tmp}/{s["file"]}.html', 'w', encoding='utf-8').write(prompts_html(key, s))
        open(f'{OUT}/{s["file"]}.md', 'w', encoding='utf-8').write(prompts_md(s))
        jobs.append((f'{s["file"]}.html', s['file'], f'{s["title"]} {s["title_outline"]}: 10 промптов'))
    for page, name, title in jobs:
        raw = f'{tmp}/{name}.raw.pdf'
        print_pdf(f'{tmp}/{page}', raw)
        finish(raw, f'{OUT}/{name}.pdf', title)


if __name__ == '__main__':
    main()
