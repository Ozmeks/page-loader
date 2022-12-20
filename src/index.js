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
  log('Logging started');

  const outputPath = (inputPath === 'default') ? process.cwd() : inputPath;
  log(`Output path: ${outputPath}`);

  const { host: inputHost, pathname: inputPathName } = new URL(inputUrl);
  const inputPathNameSlash = (inputPathName === '/') ? '' : inputPathName;
  const mainName = join(inputHost, inputPathNameSlash);
  
  const pageNameWithoutExt = makeFileName(mainName);
  const { ext } = parse(pageNameWithoutExt);
  const pageName = (ext === '.html') ? pageNameWithoutExt : `${pageNameWithoutExt}.html`
  
  const prefixFileName = makeName(inputHost);
  const dirName = `${makeName(mainName)}_files`;

  const outputFilePath = resolve(outputPath, pageName);
  log(`File path: ${outputFilePath}`);
  const filesPath = resolve(outputPath, dirName);

  const isLocal = (src) => {
    const { host } = new URL(src, inputUrl);
    return (host === inputHost);
  };

  let $;
  const promises = [];
  const promise = axios.get(inputUrl)
    .then(({ data }) => {
      logHttp(`Received html by url: ${inputUrl}`);

      $ = load(data);
      $('script, img, link').each((_i, el) => {
        const isLink = $(el).prop('tagName') === 'LINK';
        const src = isLink ? $(el).attr('href') : $(el).attr('src');
        if (!(src && isLocal(src))) {
          return;
        }

        const { href, pathname } = new URL(src, inputUrl);
        const fileName = makeFileName(`${prefixFileName}${pathname}`);
        const localLink = join(dirName, fileName);

        log(`Created local link: ${localLink}`);
        if (isLink) {
          $(el).attr('href', localLink);
        } else {
          $(el).attr('src', localLink);
        }

        const path = resolve(filesPath, fileName);
        promises.push({ url: href, path });
      });

      if (promises.length === 0) {
        return null;
      }

      log(`Started to create dir for assets: ${filesPath}`);
      return fsp.mkdir(filesPath);
    })
    .then(() => {
      log('Prepared assets');
      const outputHtml = format($.html(), { parser: 'html' });
      const task = new Listr([
        {
          title: `Download html page ${inputUrl}`,
          task: () => fsp.writeFile(outputFilePath, outputHtml),
        },
      ]);
      return task.run();
    })
    .then(() => {
      logHttp(`Downloaded html to ${outputFilePath}`);
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
      logHttp(`Page was successfully downloaded into '${outputFilePath}'`);
      log('Logging successfully ended');
      return outputFilePath;
    });

  return promise;
};

export default downloadPage;
