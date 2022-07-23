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
const expectedResult = await readFile(getFixturePath('test.html'), 'utf-8');

beforeAll(async () => {
  nock.disableNetConnect();
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, expectedResult);
});

let tempPath = '';
beforeEach(async () => {
  tempPath = await mkdtemp(join(os.tmpdir(), 'page-loader-'));
});

test('download simple html', async () => {
  const url = 'https://ru.hexlet.io/courses';
  const receivedPath = await downloadPage(url, tempPath);
  const receivedResult = await readFile(receivedPath, 'utf-8');
  expect(expectedResult).toEqual(receivedResult);
});
