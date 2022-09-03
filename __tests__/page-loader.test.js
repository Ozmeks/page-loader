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
const imgNode = await readFile(getFixturePath('files/nodejs.png'), 'utf-8');
const imgLogo = await readFile(getFixturePath('files/logo.svg'), 'utf-8');
const pageAfter = await readFile(getFixturePath('page-after.html'), 'utf-8');

beforeAll(async () => {
  nock.disableNetConnect();
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, pageBefore);
  nock('https://ru.hexlet.io')
    .get('/assets/professions/nodejs.png')
    .reply(200, imgNode);
  nock('https://cdn2.hexlet.io')
    .get('/assets/logo_ru-495f05850e0095ea722a2b583565d492719579c02b0ce61d924e4f895fabf781.svg')
    .reply(200, imgLogo);
});

let tempPath = '';
beforeEach(async () => {
  tempPath = await mkdtemp(join(os.tmpdir(), 'page-loader-'));
});

test('download html with images', async () => {
  const url = 'https://ru.hexlet.io/courses';
  const receivedPath = await downloadPage(url, tempPath);
  const receivedResult = await readFile(receivedPath, 'utf-8');
  expect(pageAfter).toEqual(receivedResult);
});
