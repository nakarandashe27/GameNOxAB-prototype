"""Две вёрстки наборов промптов — каждая своя, не по шаблону чек-листа.

improve_html — «Улучшение визуализаций»: горизонтальная презентация студии A4, тёмный фон, по промпту на слайд.
fly_html     — «Пролёты из одного кадра»: вертикальные сторис 9:16 на бумаге с плёнкой и схемой движения камеры.
"""
import html

e = html.escape
LIME, INK, PAPER = '#DBFC3B', '#2A2A2A', '#F5F5F0'


def logo(src_dir, color):
    s = open(f'{src_dir}/img/logo-lockup-dark.svg', encoding='utf-8').read()
    return s.replace('fill="#2A2A2A"', f'fill="{color}"').replace('<svg ', '<svg class="logo" ', 1)


def chain(r, items, cls):
    return f'<span class="{cls}-to">→</span>'.join(
        f'<span class="{cls}"><b>{n:02d}</b> {e(items[n - 1]["title"])}</span>' for n in r['steps'])


CHANNEL = '''<div class="qr"><img src="img/qr-channel.svg" alt="QR-код канала"></div>'''


# ─────────────────────────── улучшение: презентация ───────────────────────────
DECK_CSS = '''
@page { size: 297mm 210mm; margin: 0; }
.slide { position: relative; width: 297mm; height: 210mm; padding: 52px 64px 56px; overflow: hidden; page-break-after: always; background: #2A2A2A; color: #F5F5F0; display: grid; }
.slide:last-child { page-break-after: auto; }
.slide .logo { position: absolute; left: 64px; top: 34px; height: 17px; width: auto; }
.slide .mark { position: absolute; right: 56px; bottom: 30px; height: 15px; }
.slide .pg { position: absolute; left: 64px; bottom: 30px; font: 300 11px/1 "Kica", sans-serif; color: #8E8E88; letter-spacing: .04em; }
.rule { height: 3px; width: 96px; background: #DBFC3B; border-radius: 2px; }
.d-eyebrow { font: 600 11px/1 "Inter Tight", sans-serif; letter-spacing: .16em; text-transform: uppercase; color: #A9A9A2; }
.d-tag { display: inline-block; padding: 6px 13px 5px; border-radius: 999px; background: #DBFC3B; color: #2A2A2A; font: 700 11px/1 "Kica", sans-serif; }
.d-tag.ghost { background: none; color: #F5F5F0; border: 1.5px solid #5A5A55; }
/* обложка */
.d-cover { grid-template-columns: 1.05fr 1fr; gap: 48px; align-items: center; padding-top: 80px; }
.d-cover h1 { margin: 16px 0 0; font: 700 70px/.92 "Kica", sans-serif; letter-spacing: -.02em; }
.d-cover h1 span { display: block; color: transparent; -webkit-text-stroke: 1.6px #DBFC3B; }
.d-cover p { margin: 22px 0 22px; max-width: 430px; font-size: 15px; line-height: 1.5; color: #D9D9D2; }
.split { position: relative; height: 470px; border-radius: 18px; overflow: hidden; border: 1.5px solid #4A4A46; }
.split img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.split .after { clip-path: inset(0 0 0 50%); }
.split .bar { position: absolute; left: 50%; top: 0; bottom: 0; width: 4px; margin-left: -2px; background: #DBFC3B; }
.split .knob { position: absolute; left: 50%; top: 50%; width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 50%; background: #DBFC3B; color: #2A2A2A; font: 700 16px/46px "Kica", sans-serif; text-align: center; }
.split .lb { position: absolute; bottom: 14px; padding: 6px 12px 5px; border-radius: 999px; background: rgba(42,42,42,.85); font: 700 11px/1 "Kica", sans-serif; }
.split .lb.l { left: 14px; } .split .lb.r { right: 14px; background: #DBFC3B; color: #2A2A2A; }
/* как пользоваться */
.d-how { grid-template-columns: 1fr 1.25fr 1fr; gap: 26px; align-content: center; padding-top: 86px; }
.d-how h2 { grid-column: 1 / -1; margin: 0 0 6px; font: 700 40px/1 "Kica", sans-serif; }
.col { border-top: 3px solid #DBFC3B; padding-top: 16px; font-size: 13.5px; line-height: 1.5; color: #E4E4DD; }
.col h3 { margin: 0 0 12px; font: 700 15px/1.1 "Kica", sans-serif; color: #DBFC3B; }
.col ol { margin: 0; padding-left: 18px; display: grid; gap: 8px; }
.col ol.idx { list-style: none; padding: 0; gap: 5px; counter-reset: i; }
.col ol.idx li { counter-increment: i; display: grid; grid-template-columns: 30px 1fr; }
.col ol.idx li::before { content: counter(i, decimal-leading-zero); font: 700 13px/1.4 "Kica", sans-serif; color: #8E8E88; }
/* слайд промпта */
.d-prompt { grid-template-columns: 0.9fr 1.25fr; gap: 54px; padding-top: 86px; }
.d-left { display: grid; align-content: start; gap: 14px; }
.big-n { font: 700 150px/.78 "Kica", sans-serif; color: transparent; -webkit-text-stroke: 1.6px #DBFC3B; letter-spacing: -.03em; margin-bottom: 8px; }
.d-left h2 { margin: 0; font: 700 34px/1.02 "Kica", sans-serif; letter-spacing: -.01em; }
.d-tip { margin-top: auto; padding-top: 16px; border-top: 1.5px solid #4A4A46; font-size: 13.5px; line-height: 1.5; color: #D9D9D2; }
.d-tip b { display: block; margin-bottom: 6px; font: 700 12px/1 "Kica", sans-serif; color: #DBFC3B; }
.d-left { grid-template-rows: auto auto auto 1fr; }
.paper { align-self: start; position: relative; padding: 30px 32px 28px; border-radius: 6px; background: #F5F5F0; color: #2A2A2A; }
.paper::before { content: "PROMPT · EN"; position: absolute; left: 32px; top: -11px; padding: 5px 10px 4px; border-radius: 999px; background: #DBFC3B; font: 700 10.5px/1 "Kica", sans-serif; }
.paper p { margin: 0; font: 400 17px/1.55 "Inter Tight", sans-serif; }
.paper small { display: block; margin-top: 16px; font: 300 11px/1.3 "Kica", sans-serif; color: #77776F; }
/* финал */
.d-end { grid-template-columns: 1fr; align-content: center; gap: 22px; padding-top: 70px; }
.d-end h2 { margin: 0; font: 700 40px/1 "Kica", sans-serif; }
.d-chain { display: flex; flex-wrap: wrap; gap: 10px 8px; align-items: center; max-width: 900px; }
.d-ck { padding: 8px 14px 7px; border-radius: 999px; border: 1.5px solid #DBFC3B; font-size: 13px; }
.d-ck b { font-family: "Kica", sans-serif; color: #DBFC3B; margin-right: 4px; }
.d-ck-to { color: #8E8E88; }
.d-end .note { max-width: 760px; color: #C9C9C2; font-size: 14px; line-height: 1.5; }
.d-channel { display: flex; gap: 24px; align-items: center; margin-top: 14px; padding-top: 22px; border-top: 1.5px solid #4A4A46; }
.d-channel p { margin: 0; font: 700 18px/1.4 "Kica", sans-serif; color: #DBFC3B; }
.d-channel small { display: block; font: 400 13px/1.5 "Inter Tight", sans-serif; color: #C9C9C2; margin-bottom: 6px; }
.qr { width: 104px; height: 104px; border-radius: 12px; padding: 7px; background: #F5F5F0; flex: none; }
.qr img { width: 100%; height: 100%; display: block; }
'''


def improve_html(s, src):
    items, n = s['items'], 0
    L = logo(src, LIME)
    total = 3 + len(items)

    def chrome(i):
        return f'{L}<img class="mark" src="img/glasses-lime.svg" alt=""><span class="pg">{e(s["title"])} {e(s["title_outline"])} · {i:02d} / {total:02d}</span>'

    slides = [f'''<section class="slide d-cover">{chrome(1)}
  <div>
    <div class="d-eyebrow">{e(s["eyebrow"])}</div>
    <h1>{e(s["title"])}<span>{e(s["title_outline"])}</span></h1>
    <p>{e(s["lead"])}</p>
    <div style="display:flex;gap:10px"><span class="d-tag">Приз игры «Собери проект»</span><span class="d-tag ghost">10 промптов</span></div>
  </div>
  <div class="split"><img src="img/curve-before.jpg" alt=""><img class="after" src="img/curve-after.jpg" alt=""><i class="bar"></i><span class="knob">⇆</span><span class="lb l">До</span><span class="lb r">После</span></div>
</section>''']
    rules = ''.join(f'<li>{e(r)}</li>' for r in s['rules'])
    index = ''.join(f'<li>{e(it["title"])}</li>' for it in items)
    slides.append(f'''<section class="slide d-how">{chrome(2)}
  <h2>Как пользоваться</h2>
  <div class="col"><h3>Где запускать</h3><p>{e(s["where"])}</p><p style="margin-top:12px">Выделите промпт в PDF, скопируйте целиком, замените [вставки] на свои — и запускайте.</p></div>
  <div class="col"><h3>Правила</h3><ol>{rules}</ol></div>
  <div class="col"><h3>Внутри</h3><ol class="idx">{index}</ol></div>
</section>''')
    for i, it in enumerate(items, 1):
        slides.append(f'''<section class="slide d-prompt">{chrome(i + 2)}
  <div class="d-left">
    <div class="big-n">{i:02d}</div>
    <h2>{e(it["title"])}</h2>
    <div><span class="d-tag">{e(it["when"])}</span></div>
    <div class="d-tip"><b>Совет</b>{e(it["tip"])}</div>
  </div>
  <div class="paper"><p>{e(it["prompt"])}</p><small>Скопируйте целиком · держите исходный рендер приложенным</small></div>
</section>''')
    r = s['recipe']
    slides.append(f'''<section class="slide d-end">{chrome(total)}
  <div class="rule"></div>
  <h2>{e(r["title"])}</h2>
  <p class="note">{e(r["lead"])}</p>
  <div class="d-chain">{chain(r, items, "d-ck")}</div>
  <p class="note">{e(r["note"])}</p>
  <div class="d-channel">{CHANNEL}<div><small>Ещё больше разборов и «до/после» — в канале студии</small><p>t.me/NeuroOtlichnikArch<br>neurootlichnik.ru</p></div></div>
</section>''')
    return page_doc(f'{s["title"]} {s["title_outline"]}', DECK_CSS, slides)


# ─────────────────────────── пролёты: сторис 9:16 ───────────────────────────
STORY_CSS = '''
@page { size: 108mm 192mm; margin: 0; }
.story { position: relative; width: 108mm; height: 192mm; padding: 54px 26px 50px; overflow: hidden; page-break-after: always; background: #F5F5F0; color: #2A2A2A; display: flex; flex-direction: column; gap: 14px; }
.story:last-child { page-break-after: auto; }
.film { position: absolute; left: 0; right: 0; height: 30px; background: #2A2A2A; }
.film::before { content: ""; position: absolute; inset: 9px 6px; background: radial-gradient(circle at 6px 6px, #F5F5F0 0 4px, transparent 4.5px) 0 0 / 18px 12px repeat-x; }
.film.top { top: 0; } .film.bottom { bottom: 0; }
.s-head { display: flex; justify-content: space-between; align-items: center; font: 300 11px/1 "Kica", sans-serif; letter-spacing: .04em; color: #6E6E6A; }
.s-head b { font-weight: 700; color: #2A2A2A; }
.tc { padding: 5px 9px 4px; border-radius: 999px; background: #2A2A2A; color: #DBFC3B; font: 700 10px/1 "Kica", sans-serif; }
.cam { flex: none; height: 168px; border: 1.5px solid #2A2A2A; border-radius: 14px; background: #fff; overflow: hidden; }
.cam svg { display: block; width: 100%; height: 100%; }
.s-title { margin: 0; font: 700 25px/1.02 "Kica", sans-serif; letter-spacing: -.01em; }
.s-when { align-self: flex-start; padding: 5px 10px 4px; border-radius: 999px; background: #DBFC3B; font: 700 10px/1 "Kica", sans-serif; }
.s-prompt { padding: 14px 15px; border-radius: 12px; background: #2A2A2A; color: #F5F5F0; font: 400 11.6px/1.5 "Inter Tight", sans-serif; }
.s-tip { margin-top: auto; display: grid; grid-template-columns: 26px 1fr; gap: 8px; align-items: start; font-size: 11.5px; line-height: 1.45; color: #4A4A46; }
.s-tip i { width: 26px; height: 26px; border-radius: 50%; background: #DBFC3B; display: grid; place-items: center; font: 700 13px/1 "Kica", sans-serif; font-style: normal; color: #2A2A2A; }
/* обложка */
.s-cover { padding-top: 64px; }
.s-cover .logo { height: 15px; width: auto; }
.s-cover h1 { margin: 6px 0 0; font: 700 50px/.9 "Kica", sans-serif; letter-spacing: -.02em; }
.s-cover h1 span { display: block; color: transparent; -webkit-text-stroke: 1.4px #2A2A2A; font-size: 31px; line-height: 1.05; }
.s-cover .frame { position: relative; flex: 1 1 auto; min-height: 0; border-radius: 16px; overflow: hidden; border: 1.5px solid #2A2A2A; }
.s-cover .frame img { width: 100%; height: 100%; object-fit: cover; object-position: center 62%; display: block; }
.s-cover .play { position: absolute; left: 50%; top: 50%; width: 66px; height: 66px; margin: -33px 0 0 -33px; border-radius: 50%; background: #DBFC3B; border: 2.5px solid #2A2A2A; }
.s-cover .play::after { content: ""; position: absolute; left: 25px; top: 19px; border-style: solid; border-width: 13px 0 13px 21px; border-color: transparent transparent transparent #2A2A2A; }
.s-cover .rec { position: absolute; left: 12px; top: 12px; padding: 5px 9px 4px; border-radius: 999px; background: #2A2A2A; color: #F5F5F0; font: 700 10px/1 "Kica", sans-serif; }
.s-cover .rec::before { content: ""; display: inline-block; width: 7px; height: 7px; margin-right: 6px; border-radius: 50%; background: #F74C2E; }
.s-lead { font-size: 13px; line-height: 1.45; }
/* как пользоваться */
.s-h2 { margin: 0; font: 700 30px/1 "Kica", sans-serif; }
.s-box { border: 1.5px solid #2A2A2A; border-radius: 14px; padding: 14px 15px; font-size: 12px; line-height: 1.45; background: #fff; }
.s-box h3 { margin: 0 0 8px; font: 700 12px/1 "Kica", sans-serif; }
.s-box ol { margin: 0; padding-left: 16px; display: grid; gap: 7px; }
/* таймлайн ролика */
.timeline { display: grid; gap: 8px; }
.tl { display: grid; grid-template-columns: 56px 1fr; gap: 10px; align-items: center; }
.tl .t { font: 700 10px/1 "Kica", sans-serif; color: #6E6E6A; }
.tl .seg { padding: 10px 12px 9px; border-radius: 10px; background: #2A2A2A; color: #F5F5F0; font-size: 12px; }
.tl .seg b { font-family: "Kica", sans-serif; color: #DBFC3B; margin-right: 6px; }
.qr { width: 96px; height: 96px; border-radius: 12px; padding: 6px; background: #fff; border: 1.5px solid #2A2A2A; flex: none; }
.qr img { width: 100%; height: 100%; display: block; }
.s-channel { display: flex; gap: 14px; align-items: center; padding: 14px; border-radius: 14px; background: #2A2A2A; color: #F5F5F0; }
.s-channel > div:last-child { min-width: 0; }
.s-channel p { margin: 0; font: 700 10.5px/1.5 "Kica", sans-serif; color: #DBFC3B; overflow-wrap: anywhere; }
.s-channel small { display: block; margin-bottom: 4px; font: 400 11px/1.4 "Inter Tight", sans-serif; color: #C9C9C2; }
'''

# Схемы движения камеры: план (вид сверху) или разрез. Дом — прямоугольник с коньком, камера — кружок с конусом обзора.
def _cam(x, y, ang, fov=34):
    import math
    a1, a2 = math.radians(ang - fov / 2), math.radians(ang + fov / 2)
    r = 40
    return (f'<path d="M{x} {y} L{x + r * math.cos(a1):.1f} {y + r * math.sin(a1):.1f} L{x + r * math.cos(a2):.1f} {y + r * math.sin(a2):.1f} Z" fill="#DBFC3B" fill-opacity=".45" stroke="none"/>'
            f'<circle cx="{x}" cy="{y}" r="9" fill="#2A2A2A"/><circle cx="{x}" cy="{y}" r="3.5" fill="#DBFC3B"/>')

HOUSE = '<rect x="150" y="28" width="100" height="56" fill="#F5F5F0" stroke="#2A2A2A" stroke-width="2"/><line x1="150" y1="56" x2="250" y2="56" stroke="#2A2A2A" stroke-width="1.2" stroke-dasharray="4 3"/>'
ARROW = '<defs><marker id="ar" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#2A2A2A"/></marker></defs>'
PATH = 'fill="none" stroke="#2A2A2A" stroke-width="2.5" stroke-linecap="round" marker-end="url(#ar)"'
TREE = lambda x, y, r=13: f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff" stroke="#2A2A2A" stroke-width="1.5"/><circle cx="{x}" cy="{y}" r="{r * .45:.1f}" fill="none" stroke="#2A2A2A" stroke-width="1"/>'
GROUND = '<line x1="20" y1="140" x2="380" y2="140" stroke="#2A2A2A" stroke-width="2"/>'
SIDE_HOUSE = '<path d="M170 140 V96 L215 62 L260 96 V140 Z" fill="#F5F5F0" stroke="#2A2A2A" stroke-width="2"/>'
LBL = lambda t, x=16, y=22: f'<text x="{x}" y="{y}" font-family="Kica" font-weight="700" font-size="10" fill="#6E6E6A">{t}</text>'

DIAGRAMS = [
    LBL('ПЛАН') + HOUSE + _cam(200, 150, -90) + f'<path d="M200 140 L200 108" {PATH}/>' + '<text x="214" y="128" font-family="Kica" font-size="10" fill="#2A2A2A">2 м · 5 с</text>',
    LBL('ПЛАН') + HOUSE + _cam(120, 140, -40) + f'<path d="M126 132 A95 95 0 0 1 268 128" {PATH}/>' + '<text x="276" y="140" font-family="Kica" font-size="10" fill="#2A2A2A">20–30°</text>',
    LBL('РАЗРЕЗ') + GROUND + SIDE_HOUSE + _cam(90, 128, -20) + f'<path d="M90 118 L90 44" {PATH}/>' + _cam(90, 36, 25).replace('fill-opacity=".45"', 'fill-opacity=".25"'),
    LBL('ПЛАН') + HOUSE + TREE(140, 150) + TREE(268, 152) + _cam(200, 104, -90) + f'<path d="M200 116 L200 152" {PATH}/>',
    LBL('ПЛАН') + HOUSE + TREE(178, 116, 10) + TREE(236, 120, 10) + _cam(110, 150, -70) + f'<path d="M122 152 L290 152" {PATH}/>' + _cam(300, 150, -110).replace('fill-opacity=".45"', 'fill-opacity=".25"'),
    LBL('ПЛАН') + HOUSE + TREE(186, 112, 12) + TREE(214, 108, 11) + TREE(200, 124, 10) + _cam(200, 160, -90) + f'<path d="M200 150 L200 96" {PATH} stroke-dasharray="6 4"/>',
    LBL('РАЗРЕЗ · ВРЕМЯ') + GROUND + SIDE_HOUSE + '<rect x="200" y="112" width="14" height="14" fill="#DBFC3B" stroke="#2A2A2A" stroke-width="1.2"/>' + _cam(60, 128, -10)
    + '<path d="M120 60 A110 70 0 0 1 340 80" fill="none" stroke="#2A2A2A" stroke-width="1.5" stroke-dasharray="3 4"/><circle cx="120" cy="60" r="11" fill="#DBFC3B" stroke="#2A2A2A" stroke-width="1.5"/><circle cx="338" cy="80" r="9" fill="#2A2A2A"/>'
    + '<text x="104" y="40" font-family="Kica" font-size="9" fill="#2A2A2A">день</text><text x="318" y="62" font-family="Kica" font-size="9" fill="#2A2A2A">вечер</text>',
    LBL('ПЛАН · КАМЕРА НЕ ДВИГАЕТСЯ') + HOUSE + TREE(120, 70) + TREE(290, 66) + _cam(200, 150, -90)
    + ''.join(f'<path d="M{x} {y} q6 -6 12 0 t12 0" fill="none" stroke="#2A2A2A" stroke-width="1.4"/>' for x, y in [(96, 98), (268, 94), (110, 112), (282, 108)]),
    LBL('ПЛАН КОМНАТЫ') + '<rect x="110" y="30" width="180" height="120" fill="#F5F5F0" stroke="#2A2A2A" stroke-width="2.5"/><line x1="110" y1="70" x2="110" y2="112" stroke="#DBFC3B" stroke-width="6"/>'
    + '<rect x="230" y="40" width="50" height="22" fill="#fff" stroke="#2A2A2A" stroke-width="1.2"/><text x="236" y="55" font-family="Kica" font-size="8" fill="#2A2A2A">кухня</text>'
    + _cam(170, 120, -150) + f'<path d="M140 104 A40 40 0 0 1 206 92" {PATH}/>' + '<text x="118" y="164" font-family="Kica" font-size="9" fill="#6E6E6A">окно</text>',
    LBL('ПЛАН') + HOUSE + '<rect x="190" y="80" width="20" height="6" fill="#DBFC3B" stroke="#2A2A2A" stroke-width="1.2"/>' + _cam(160, 160, -70)
    + f'<path d="M166 150 Q176 124 196 100" {PATH} stroke-dasharray="5 5"/>' + TREE(140, 118, 9) + TREE(240, 120, 9),
]


def _diag(i):
    return f'<div class="cam"><svg viewBox="0 0 400 176" role="img" aria-label="Схема движения камеры">{ARROW}{DIAGRAMS[i]}</svg></div>'


def fly_html(s, src):
    items = s['items']
    total = len(items) + 4

    def head(left, right):
        return f'<i class="film top"></i><i class="film bottom"></i><div class="s-head"><span>{left}</span>{right}</div>'

    stories = [f'''<section class="story s-cover">{head(logo(src, INK), '<span class="tc">10 клипов</span>')}
  <div class="frame"><img src="img/street-eve.jpg" alt=""><span class="rec">REC · 00:05</span><span class="play"></span></div>
  <div><div class="s-head" style="margin-bottom:6px"><span>{e(s["eyebrow"])}</span></div><h1>{e(s["title"])}<span>{e(s["title_outline"])}</span></h1></div>
  <p class="s-lead">{e(s["lead"])}</p>
  <span class="s-when">Приз игры «Собери проект»</span>
</section>''']
    rules = ''.join(f'<li>{e(r)}</li>' for r in s['rules'])
    stories.append(f'''<section class="story">{head('<b>Перед съёмкой</b>', f'<span class="tc">02 / {total:02d}</span>')}
  <h2 class="s-h2">Как пользоваться</h2>
  <div class="s-box"><h3>Где запускать</h3>{e(s["where"])}</div>
  <div class="s-box"><h3>Правила</h3><ol>{rules}</ol></div>
  <p class="s-lead" style="margin-top:auto">Схема над каждым промптом показывает, куда едет камера. Лаймовый конус — что она видит.</p>
</section>''')
    for i, it in enumerate(items, 1):
        stories.append(f'''<section class="story">{head(f'<b>Клип {i:02d}</b> · из 10', '<span class="tc">00:00 → 00:05</span>')}
  {_diag(i - 1)}
  <h2 class="s-title">{e(it["title"])}</h2>
  <span class="s-when">{e(it["when"])}</span>
  <div class="s-prompt">{e(it["prompt"])}</div>
  <div class="s-tip"><i>!</i><span>{e(it["tip"])}</span></div>
</section>''')
    r = s['recipe']
    tl = ''.join(f'<div class="tl"><span class="t">00:{k * 5:02d}–00:{k * 5 + 5:02d}</span><span class="seg"><b>{n:02d}</b>{e(items[n - 1]["title"])}</span></div>' for k, n in enumerate(r['steps']))
    stories.append(f'''<section class="story">{head('<b>Монтаж</b>', f'<span class="tc">{total - 1:02d} / {total:02d}</span>')}
  <h2 class="s-h2">{e(r["title"])}</h2>
  <p class="s-lead">{e(r["lead"])}</p>
  <div class="timeline">{tl}</div>
  <p class="s-lead" style="margin-top:auto;color:#4A4A46">{e(r["note"])}</p>
</section>''')
    stories.append(f'''<section class="story">{head('<b>Нейро Отличник</b>', f'<span class="tc">{total:02d} / {total:02d}</span>')}
  <h2 class="s-h2">Снято. Что дальше?</h2>
  <p class="s-lead">Покажите ролик на защите и выложите в портфолио. Больше схем камеры и разборов — в канале студии.</p>
  <img src="img/neuro-lying.png" alt="" style="width:100%;margin-top:auto">
  <div class="s-channel">{CHANNEL}<div><small>Канал студии</small><p>t.me/NeuroOtlichnikArch<br>neurootlichnik.ru</p></div></div>
</section>''')
    return page_doc(f'{s["title"]} {s["title_outline"]}', STORY_CSS, stories)


def page_doc(title, css, pages):
    return f'''<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>{e(title)}: 10 промптов — Нейро Отличник</title>
<link rel="stylesheet" href="styles.css"><style>{css}</style></head><body>
{"".join(pages)}
</body></html>'''
