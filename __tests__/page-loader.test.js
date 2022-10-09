import {
  test, expect, beforeEach, beforeAll,
} from '@jest/globals';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import nock from 'nock';
import os from 'os';
import { readFile, mkdtemp } from 'fs/promises';
import downloadPage from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const getFixturePath = (filename) => join(__dirname, '..', '__fixtures__', filename);
const pageBefore = await readFile(getFixturePath('page-before.html'), 'utf-8');
const imgSrc = await readFile(getFixturePath('files/nodejs.png'), 'utf-8');
const scriptSrc = await readFile(getFixturePath('files/script.js'), 'utf-8');
const cssSrc = await readFile(getFixturePath('files/app.css'), 'utf-8');
const pageAfter = await readFile(getFixturePath('page-after.html'), 'utf-8');

beforeAll(async () => {
  const nockUrl = 'https://ru.hexlet.io';
  nock.disableNetConnect();
  nock(nockUrl)
    .persist()
    .get('/courses')
    .reply(200, pageBefore)
    .get('/assets/professions/nodejs.png')
    .reply(200, imgSrc)
    .get('/packs/js/runtime.js')
    .reply(200, scriptSrc)
    .get('/assets/application.css')
    .reply(200, cssSrc)
    .get('/wrong')
    .replyWithError('404 Not found');
});

let tempPath = '';
beforeEach(async () => {
  tempPath = await mkdtemp(join(os.tmpdir(), 'page-loader-'));
});

test('Checking page load with images', async () => {
  const url = 'https://ru.hexlet.io/courses';
  const receivedPath = await downloadPage(url, tempPath);
  const receivedResult = await readFile(receivedPath, 'utf-8');
  expect(pageAfter).toEqual(receivedResult);
});

test('Checking page load in wrong directory', async () => {
  const url = 'https://ru.hexlet.io/courses';
  const wrongPath = 'wrong';
  await expect(downloadPage(url, wrongPath))
    .rejects.toThrow('ENOENT: no such file or directory');
});

test('Checking for not found page', async () => {
  const wrongUrl = 'https://ru.hexlet.io/wrong';
  await expect(downloadPage(wrongUrl, tempPath))
    .rejects.toThrow('404 Not found');
});
