import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'

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
    }, 10000)
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
  } catch (error) {
    console.error('Failed to parse JSON:', line)
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

async function main() {
  try {
    const initResult = await send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'jarve-playwriter', version: '0.1.0' },
    })

    notify('initialized', {})

    const tools = await send('tools/list', {})
    console.log(JSON.stringify(tools, null, 2))
  } catch (error) {
    console.error(error)
  } finally {
    child.kill('SIGTERM')
  }
}

main()
