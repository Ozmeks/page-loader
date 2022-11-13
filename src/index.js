import 'axios-debug-log';
import axios from 'axios';
import fsp from 'fs/promises';
import { createWriteStream } from 'fs';
import { resolve, parse, join } from 'path';
import { load } from 'cheerio';
import { format } from 'prettier';
import debug from 'debug';
import Listr from 'listr';

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
  log(`Output path: ${outputPath}`);

  const { host: inputHost, pathname: inputPathName } = new URL(inputUrl);
  const inputPathNameSlash = (inputPathName === '/') ? '' : inputPathName;
  const mainName = join(inputHost, inputPathNameSlash);
  const pageName = makeFileName(mainName);
  const prefixFileName = makeName(inputHost);
  const dirName = `${makeName(mainName)}_files`;

  const outputFilePath = resolve(outputPath, pageName);
  log(`File path: ${outputFilePath}`);
  const filesPath = resolve(outputPath, dirName);

  let $;
  const promises = [];
  const promise = axios.get(inputUrl)
    .then(({ data }) => {
      logHttp(`Received html by url: ${inputUrl}`);
      $ = load(data);

      $('script, img, link').each((i, el) => {
        const src = ($(el).prop('tagName') === 'LINK') ? $(el).attr('href') : $(el).attr('src');
        if (typeof src !== 'undefined' && src !== false) {
          const { href, pathname, host } = new URL(src, inputUrl);
          const isLocal = (host === inputHost);
          if (isLocal) {
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
        }
      });
      return (promises.length > 0) ? fsp.mkdir(filesPath) : null;
    })
    .then(() => {
      const sourceCount = promises.length;
      if (sourceCount === 0) {
        return null;
      }

      logHttp(`Started downloading ${sourceCount} html sources to: ${filesPath}`);
      const tasks = promises.map(({ url, path }) => ({
        title: `Download source ${url}`,
        task: () => axios
          .get(url, { responseType: 'stream' })
          .then(({ data }) => {
            data.pipe(createWriteStream(path));
            return new Promise((resolvePromise, rejectPromise) => {
              data.on('end', () => {
                logHttp(`Downloaded source ${url}`);
                resolvePromise();
              });

              data.on('error', (err) => {
                logHttp(`Error downloading source ${url}: ${err}`);
                rejectPromise(err);
              });
            });
          }),
      }));

      return new Listr(tasks, { concurrent: true, exitOnError: false })
        .run();
    })
    .then(() => {
      logHttp('Finished downloading html sources');
      const outputHtml = format($.html(), { parser: 'html' });
      const task = new Listr([
        {
          title: `Saved html page ${inputUrl}`,
          task: () => fsp.writeFile(outputFilePath, outputHtml),
        },
      ]);
      return task.run();
    })
    .then(() => {
      log(`Saved html to ${outputFilePath}`);
      return outputFilePath;
    });

  return promise;
};

export default downloadPage;
