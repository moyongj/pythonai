import { createServer } from 'http';
import { parse } from 'url';
import path from 'path';
import next from 'next';
import dotenv from 'dotenv';
import { initDb } from '@/lib/db';

const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading .env from:', envPath);

dotenv.config({ path: envPath });

console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? '已加载' : '未加载');

const dev = process.env.COZE_PROJECT_ENV !== 'PROD';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  await initDb();
  
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  server.once('error', err => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(
      `> Server listening at http://${hostname}:${port} as ${
        dev ? 'development' : process.env.COZE_PROJECT_ENV
      }`,
    );
  });
}

startServer().catch(console.error);