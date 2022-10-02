import 'axios-debug-log';
import axios from 'axios';
import fsp from 'fs/promises';
import { createWriteStream } from 'fs';
import { resolve, parse, join } from 'path';
import { load } from 'cheerio';
import { format } from 'prettier';
import debug from 'debug';

const makeName = (name) => name.replaceAll(/[^A-Za-z0-9]/g, '-');

const makeFileName = (pathname) => {
  const { dir, name, ext } = parse(pathname);
  const path = makeName(join(dir, name));
  const fileExt = (ext === '') ? '.html' : ext;
  return `${path}${fileExt}`;
};

const log = debug('page-loader');
const logHttp = debug('page-loader: http');

const downloadPage = (inputUrl, inputPath = 'default') => {
  log('start logging');

  const outputPath = (inputPath === 'default') ? process.cwd() : inputPath;
  const { host: inputHost, pathname: inputPathName } = new URL(inputUrl);
  const mainName = join(inputHost, inputPathName);
  const pageName = makeFileName(mainName);
  const prefixFileName = makeName(inputHost);
  const dirName = `${makeName(mainName)}_files`;

  const outputFilePath = resolve(outputPath, pageName);
  const filesPath = resolve(outputPath, dirName);
  log(`File path: ${outputFilePath}`);

  let $;
  const promises = [];
  const promise = axios.get(inputUrl)
    .then(({ data }) => {
      logHttp(`Received html by url: ${inputUrl}`);

      $ = load(data);
      $('img, script, link').each((i, el) => {
        const src = ($(el).prop('tagName') === 'LINK') ? $(el).attr('href') : $(el).attr('src');
        const { href, pathname, host } = new URL(src, inputUrl);
        if (host === inputHost) {
          const fileName = makeFileName(`${prefixFileName}${pathname}`);
          const path = resolve(filesPath, fileName);
          promises.push({ url: href, path });

          const localLink = join(dirName, fileName);
          log(`Created local link: ${localLink}`);
          if ($(el).prop('tagName') === 'LINK') {
            $(el).attr('href', localLink);
          } else {
            $(el).attr('src', localLink);
          }
        }
      });
      return (promises.length > 0) ? fsp.mkdir(filesPath) : null;
    })
    .then(() => {
      const sourceCount = promises.length;
      if (sourceCount > 0) {
        logHttp(`Started downloading ${sourceCount} html sources to: ${filesPath}`);
        promises.map(({ url, path }) => axios
          .get(url, { responseType: 'stream' })
          .then(({ data }) => data.pipe(createWriteStream(path))));
        return Promise.all(promises);
      }
      return null;
    })
    .then(() => {
      logHttp('Finished downloading html sources');
      const outputHtml = format($.html(), { parser: 'html' });
      return fsp.writeFile(outputFilePath, outputHtml);
    })
    .then(() => {
      log(`Saved html to ${outputFilePath}`);
      return outputFilePath;
    });

  return promise;
};

export default downloadPage;
