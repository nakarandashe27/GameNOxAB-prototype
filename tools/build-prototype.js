/*
 * Собирает прототип в один HTML-файл (ядро core.js и 3D-домик house3d.js встраиваются в страницу, three.js — с cdnjs).
 * Запуск: node tools/build-prototype.js
 *   prototype/dist/soberi-proekt.html — самостоятельный файл, можно переслать сторонам и открыть двойным кликом
 *   prototype/dist/artifact.html      — то же без <head>, для публикации ссылкой (обёртку добавляет хостинг)
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'prototype');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const core = fs.readFileSync(path.join(root, 'core.js'), 'utf8');

const tag = '<script src="core.js"></script>';
if (!html.includes(tag)) throw new Error('В index.html не найден тег подключения core.js');

const house = fs.readFileSync(path.join(root, 'house3d.js'), 'utf8');
const houseTag = '<script src="house3d.js"></script>';
if (!html.includes(houseTag)) throw new Error('В index.html не найден тег подключения house3d.js');

// three.js остаётся внешним скриптом с cdnjs; ядро и 3D-домик встраиваются в страницу
// Наборы промптов студии — из prizes/src/prompts.json, тот же текст, что в PDF
const sets = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'prizes', 'src', 'prompts.json'), 'utf8'));
const pick = (s) => ({ title: s.title + ' ' + s.title_outline, items: s.items.map(({ title, when, prompt, tip }) => ({ title, when, prompt, tip })) });
const marker = /\/\*@prompts\*\/ \{[^\n]*\};/;
if (!marker.test(html)) throw new Error('В index.html не найдена метка /*@prompts*/');
const withPrompts = html.replace(marker, () => 'JSON.parse(' + JSON.stringify(JSON.stringify({ improve: pick(sets.improve), fly: pick(sets.flythrough) })) + ');');

const body = withPrompts.replace(houseTag, () => '<script>\n' + house + '\n</script>').replace(tag, () => '<script>\n' + core + '\n</script>');
const standalone =
  '<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
  '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect width=%2232%22 height=%2232%22 fill=%22%23FF8562%22/%3E%3Cpath d=%22M9 23V9h8a4 4 0 010 8H9%22 fill=%22none%22 stroke=%22%2317110E%22 stroke-width=%223%22/%3E%3C/svg%3E">\n' +
  body.replace('<meta name="description"', '</head>\n<body>\n<meta name="description"') + '\n</body>\n</html>\n';

// <title>, <link> и <style> должны оказаться в <head>: переносим границу head/body после </style>
const fixed = standalone.replace('</head>\n<body>\n', '').replace('</style>\n', '</style>\n</head>\n<body>\n');

const dist = path.join(root, 'dist');
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'soberi-proekt.html'), fixed);
fs.writeFileSync(path.join(dist, 'artifact.html'), body);
console.log('Собрано: dist/soberi-proekt.html', (fixed.length / 1024).toFixed(1), 'КБ; dist/artifact.html', (body.length / 1024).toFixed(1), 'КБ');
