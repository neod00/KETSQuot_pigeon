// Local-only preview. Never provisions real intake credentials or privacy terms.
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const environment = { ...process.env, NAVIGATOR_SESSION_SECRET: randomBytes(32).toString('hex'), NAVIGATOR_LOCAL_PREVIEW: '1' };
for (const key of ['NETLIFY','NETLIFY_SITE_ID','NETLIFY_BLOBS_CONTEXT','NAVIGATOR_INTAKE_URL','NAVIGATOR_INTAKE_SECRET','NAVIGATOR_PRIVACY_RETENTION','NAVIGATOR_PRIVACY_PROCESSORS','NAVIGATOR_PRIVACY_CONTACT','OPENAI_API_KEY','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN']) delete environment[key];
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next','start','--hostname','localhost','--port','3100'], { cwd: root, env: environment, windowsHide: true, stdio: 'inherit' });
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => child.kill());
child.on('exit', code => process.exit(code ?? 0));
