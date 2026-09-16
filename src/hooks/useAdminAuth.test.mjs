import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('./useAdminAuth.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
})
const flush = () => new Promise(resolve => setImmediate(resolve))
function deferred() {
  let resolve
  const promise = new Promise(yes => { resolve = yes })
  return { promise, resolve }
}
const user = id => ({ id, aud: 'authenticated', role: 'authenticated', email: `${id}@example.invalid`,
  app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [], created_at: '2026-09-01T00:00:00Z' })
const profile = (id, role = 'admin') => ({ data: { id, role, email: `${id}@example.invalid`,
  created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z' }, error: null })

// Execute the real hook. Only React scheduling and the external auth/profile boundary are controlled.
function mountHook({ configured = true } = {}) {
  let state, listener, cleanup, unsubscribed = 0
  const effects = [], history = [], profiles = [], initial = deferred()
  const dependencies = {
    react: {
      useState(value) { state = value; return [state, next => { state = typeof next === 'function' ? next(state) : next; history.push(state) }] },
      useEffect(effect) { effects.push(effect) },
    },
    '../lib/auth': {
      SUPABASE_SETUP_MESSAGE: '설정 필요',
      getCurrentUser: () => initial.promise,
      getProfile(id) { const request = { id, ...deferred() }; profiles.push(request); return request.promise },
    },
    '../lib/supabase': { hasSupabaseConfig: configured, supabase: configured ? {
      auth: { onAuthStateChange(callback) { listener = callback; return { data: { subscription: { unsubscribe() { unsubscribed += 1 } } } } } },
    } : null },
  }
  const module = { exports: {} }
  new Function('require', 'module', 'exports', outputText)(name => {
    assert.ok(Object.hasOwn(dependencies, name), `unexpected dependency ${name}`)
    return dependencies[name]
  }, module, module.exports)
  module.exports.useAdminAuth()
  for (const effect of effects) cleanup = effect()
  return {
    get state() { return state }, get unsubscribed() { return unsubscribed }, history, profiles, initial,
    emit(event, nextUser = null) { listener(event, nextUser ? { user: nextUser } : null) },
    cleanup() { cleanup?.() },
  }
}
async function verifiedHook() {
  const hook = mountHook()
  hook.initial.resolve({ data: user('admin-a'), error: null })
  await flush()
  hook.profiles[0].resolve(profile('admin-a'))
  await flush()
  assert.equal(hook.state.isAdmin, true)
  return hook
}

for (const event of ['SIGNED_IN', 'TOKEN_REFRESHED']) {
  test(`${event} for the verified user revalidates without a blocking loading state`, async () => {
    const hook = await verifiedHook()
    const from = hook.history.length
    hook.emit(event, user('admin-a'))
    assert.equal(hook.state.isLoading, false)
    assert.equal(hook.state.isAdmin, true)
    assert.equal(hook.profiles[1].id, 'admin-a')
    hook.profiles[1].resolve(profile('admin-a'))
    await flush()
    assert.ok(hook.history.slice(from).every(state => !state.isLoading))
    hook.cleanup()
  })
}

test('initial and different-user checks block access until the new profile is verified', async () => {
  const hook = mountHook()
  assert.equal(hook.state.isLoading, true)
  assert.equal(hook.state.isAdmin, false)
  hook.initial.resolve({ data: user('admin-a'), error: null })
  await flush()
  assert.equal(hook.state.isLoading, true)
  hook.profiles[0].resolve(profile('admin-a'))
  await flush()
  hook.emit('SIGNED_IN', user('admin-b'))
  assert.equal(hook.state.isLoading, true)
  assert.equal(hook.state.isAdmin, false)
  assert.equal(hook.state.profile, null)
  hook.profiles[1].resolve(profile('admin-b', 'viewer'))
  await flush()
  assert.equal(hook.state.user.id, 'admin-b')
  assert.equal(hook.state.isAdmin, false)
  hook.cleanup()
})

test('signout is immediate and an older profile response cannot sign the user back in', async () => {
  const hook = await verifiedHook()
  hook.emit('TOKEN_REFRESHED', user('admin-a'))
  hook.emit('SIGNED_OUT')
  assert.equal(hook.state.isAuthenticated, false)
  assert.equal(hook.state.isAdmin, false)
  assert.equal(hook.state.user, null)
  assert.equal(hook.state.isLoading, false)
  hook.profiles[1].resolve(profile('admin-a'))
  await flush()
  assert.equal(hook.state.isAuthenticated, false)
  assert.equal(hook.state.user, null)
  hook.cleanup()
})

for (const outcome of ['viewer', 'missing', 'error']) {
  test(`background ${outcome} profile result revokes access`, async () => {
    const hook = await verifiedHook()
    hook.emit('TOKEN_REFRESHED', user('admin-a'))
    hook.profiles[1].resolve(outcome === 'viewer' ? profile('admin-a', 'viewer')
      : { data: null, error: outcome === 'error' ? '권한 확인 실패' : null })
    await flush()
    assert.equal(hook.state.isAdmin, false)
    assert.equal(hook.state.isLoading, false)
    if (outcome === 'error') assert.ok(hook.state.error)
    hook.cleanup()
  })
}

test('late initial user and initial errors cannot overwrite a newer auth event', async () => {
  for (const initialResult of [{ data: null, error: null }, { data: user('old-user'), error: null },
    { data: null, error: 'old initial error' }]) {
    const hook = mountHook()
    hook.emit('SIGNED_IN', user('admin-a'))
    hook.profiles[0].resolve(profile('admin-a'))
    await flush()
    hook.initial.resolve(initialResult)
    await flush()
    assert.equal(hook.state.user?.id, 'admin-a')
    assert.equal(hook.state.isLoading, false)
    assert.equal(hook.state.error, null)
    assert.equal(hook.profiles.length, 1)
    hook.cleanup()
  }
})

test('late profile results cannot overwrite a newer user or a newer revalidation', async () => {
  const hook = await verifiedHook()
  hook.emit('SIGNED_IN', user('admin-a'))
  hook.emit('SIGNED_IN', user('admin-b'))
  hook.profiles[2].resolve(profile('admin-b'))
  await flush()
  hook.profiles[1].resolve(profile('admin-a'))
  await flush()
  assert.equal(hook.state.user.id, 'admin-b')
  hook.emit('TOKEN_REFRESHED', user('admin-b'))
  hook.emit('SIGNED_IN', user('admin-b'))
  hook.profiles[4].resolve(profile('admin-b', 'viewer'))
  await flush()
  hook.profiles[3].resolve(profile('admin-b'))
  await flush()
  assert.equal(hook.state.isAdmin, false)
  hook.cleanup()
})

test('cleanup unsubscribes and ignores late initial, profile and event callbacks', async () => {
  const initialHook = mountHook()
  initialHook.cleanup()
  initialHook.initial.resolve({ data: user('admin-a'), error: null })
  await flush()
  assert.equal(initialHook.history.length, 0)
  assert.equal(initialHook.profiles.length, 0)
  assert.equal(initialHook.unsubscribed, 1)
  const hook = await verifiedHook()
  hook.emit('TOKEN_REFRESHED', user('admin-a'))
  hook.cleanup()
  const count = hook.history.length
  hook.profiles[1].resolve(profile('admin-a', 'viewer'))
  hook.emit('SIGNED_OUT')
  await flush()
  assert.equal(hook.history.length, count)
  assert.equal(hook.unsubscribed, 1)
})

test('initial errors fail closed and absent configuration does not subscribe', async () => {
  const hook = mountHook()
  hook.initial.resolve({ data: null, error: '인증 확인 실패' })
  await flush()
  assert.equal(hook.state.isLoading, false)
  assert.equal(hook.state.isAuthenticated, false)
  assert.ok(hook.state.error)
  hook.cleanup()
  const missing = mountHook({ configured: false })
  assert.equal(missing.state.isLoading, false)
  assert.equal(missing.state.isSupabaseConfigured, false)
  assert.equal(missing.state.isAdmin, false)
  assert.equal(missing.state.error, '설정 필요')
})
