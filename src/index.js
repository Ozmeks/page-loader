import axios from 'axios';
import fsp from 'fs/promises';
import { resolve } from 'path';

const makeFileName = (href) => {
  const url = new URL(href);
  const { protocol } = url;
  const fileNameWithSymbols = href.slice((`${protocol}//`).length);
  const fileName = fileNameWithSymbols.replaceAll(/[^A-Za-z0-9]/g, '-');
  return `${fileName}.html`;
};

const downloadPage = (url, path = 'default') => {
  const fileName = makeFileName(url);
  const outputPath = (path === 'default') ? process.cwd() : path;
  const filePath = resolve(outputPath, fileName);

  const promise = axios.get(url)
    .then(({ data }) => fsp.writeFile(filePath, data))
    .then(() => filePath);

  return promise;
};

export default downloadPage;
