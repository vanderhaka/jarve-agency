import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'

const BASE_URL = process.env.PLAYWRITER_BASE_URL || 'http://localhost:3000'

const child = spawn('npx', ['-y', 'playwriter@latest'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: process.env,
})

child.stderr.on('data', (chunk) => {
  process.stderr.write(chunk)
})

const rl = createInterface({ input: child.stdout })
let idCounter = 0
const pending = new Map()

function send(method, params) {
  const id = ++idCounter
  const message = { jsonrpc: '2.0', id, method, params }
  child.stdin.write(`${JSON.stringify(message)}\n`)
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id)
        reject(new Error(`Timeout waiting for ${method}`))
      }
    }, 20000)
  })
}

function notify(method, params) {
  const message = { jsonrpc: '2.0', method, params }
  child.stdin.write(`${JSON.stringify(message)}\n`)
}

rl.on('line', (line) => {
  if (!line.trim()) return
  let message
  try {
    message = JSON.parse(line)
  } catch {
    return
  }

  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) {
      reject(new Error(message.error.message || 'Unknown error'))
    } else {
      resolve(message.result)
    }
  }
})

async function callTool(name, args) {
  return send('tools/call', { name, arguments: args })
}

async function main() {
  try {
    await send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'jarve-playwriter', version: '0.1.0' },
    })
    notify('initialized', {})

    await callTool('reset', {})

    const inspectPagesCode = `const pages = context.pages(); console.log('pages:', pages.map(p => ({ url: p.url(), closed: p.isClosed() })));`

    const openLoginCode = `const targetPage = await context.newPage(); state.targetPage = targetPage; await targetPage.goto('${BASE_URL}/login', { waitUntil: 'domcontentloaded' }); await waitForPageLoad({ page: targetPage, timeout: 8000 }); console.log('login-url:', targetPage.url()); console.log('login-title:', await targetPage.title()); console.log(await accessibilitySnapshot({ page: targetPage, search: /Login to JARVE CRM|Email|Password/i })); targetPage.removeAllListeners();`

    const adminRedirectCode = `const targetPage = state.targetPage; await targetPage.goto('${BASE_URL}/admin', { waitUntil: 'domcontentloaded' }); await waitForPageLoad({ page: targetPage, timeout: 8000 }); console.log('admin-url:', targetPage.url()); console.log(await accessibilitySnapshot({ page: targetPage, search: /Login to JARVE CRM|Admin Dashboard/i })); targetPage.removeAllListeners();`

    const revokedCode = `const targetPage = state.targetPage; await targetPage.goto('${BASE_URL}/revoked', { waitUntil: 'domcontentloaded' }); await waitForPageLoad({ page: targetPage, timeout: 8000 }); console.log('revoked-url:', targetPage.url()); console.log(await accessibilitySnapshot({ page: targetPage, search: /Access revoked/i })); targetPage.removeAllListeners();`

    const unauthenticatedAdminCode = `const browser = context.browser(); if (!browser) throw new Error('No browser available'); const freshContext = await browser.newContext(); state.freshContext = freshContext; const freshPage = await freshContext.newPage(); state.freshPage = freshPage; await freshPage.goto('${BASE_URL}/admin', { waitUntil: 'domcontentloaded' }); await waitForPageLoad({ page: freshPage, timeout: 8000 }); console.log('unauth-admin-url:', freshPage.url()); console.log(await accessibilitySnapshot({ page: freshPage, search: /Login to JARVE CRM|Admin Dashboard/i })); freshPage.removeAllListeners();`

    const inspectResult = await callTool('execute', { code: inspectPagesCode, timeout: 20000 })
    console.log('PAGES_RESULT', JSON.stringify(inspectResult))

    const loginResult = await callTool('execute', { code: openLoginCode, timeout: 20000 })
    console.log('LOGIN_RESULT', JSON.stringify(loginResult))

    const adminResult = await callTool('execute', { code: adminRedirectCode, timeout: 20000 })
    console.log('ADMIN_RESULT', JSON.stringify(adminResult))

    const revokedResult = await callTool('execute', { code: revokedCode, timeout: 20000 })
    console.log('REVOKED_RESULT', JSON.stringify(revokedResult))

    const unauthResult = await callTool('execute', { code: unauthenticatedAdminCode, timeout: 20000 })
    console.log('UNAUTH_ADMIN_RESULT', JSON.stringify(unauthResult))
  } catch (error) {
    console.error(error)
  } finally {
    child.kill('SIGTERM')
  }
}

main()
