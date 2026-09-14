/*
 * Собирает прототип в один HTML-файл (ядро core.js встраивается в страницу).
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

const body = html.replace(tag, () => '<script>\n' + core + '\n</script>');
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
