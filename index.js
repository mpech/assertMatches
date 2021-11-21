const assertOk = (a, msg, ctx='') => { if (!a) { throw new Error(ctx+msg) } }
const assertIs = (a, b, msg, ctx='') => { if (a !== b) { throw new Error(ctx+(msg || `'${a}' !== '${b}'`)) } }
const assertAndConsume = (s, iAgainst, msg, ctx) => {
  const against = String(iAgainst)
  assertIs(s.substring(0, against.length), against, msg, ctx)
  return against.length
}

const assertMatches = ref => (all, ...caps) => {
  const dic = {}
  let lastIndex = 0
  let s = ref.substring(lastIndex)
  for (let i = 0; i < all.length - 1; ++i) {
    const ctx = `at ${ref.substring(0, lastIndex)}\n`
    lastIndex += assertAndConsume(s, all[i], undefined, ctx)
    s = ref.substring(lastIndex)
    const match = caps[i]
    if (typeof (match) === 'function') {
      const matched = match(s)
      if (dic[match.id]) {
        assertIs(dic[match.id], matched, `match ${match.reg} failed (${dic[match.id]} vs ${matched})`, ctx)
      } else {
        dic[match.id] = matched
      }
      if (match.unique) {
        Object.entries(dic).forEach(([id, val]) => {
          if (id === match.id) { return }
          assertOk(val !== matched, `expect '${val}' value (id: ${match.id}) to be unique. Matched by id: ${id}`)
        })
      }
      lastIndex += matched.length
      s = ref.substring(lastIndex)
    } else {
      lastIndex += assertAndConsume(s, match, undefined, ctx)
      s = ref.substring(lastIndex)
    }
  }
  const ctx = `at ${ref.substring(0, lastIndex)}\n`
  assertIs(s, String(all[all.length - 1]), undefined, ctx)
}

export const unique = (reg, options = {}) => match(reg, { ...options, unique: true })
export const match = (reg, options = {}) => {
  const f = s => {
    const res = s.match(new RegExp(reg))
    assertOk(res, `regex did not match ${s} ${reg.toString()}`)
    assertIs(res.index, 0, `regex did not match at start ${s} ${reg.toString()}`)
    return res[0]
  }
  f.id = options?.id || reg.toString() + '_' + Math.random()
  f.reg = reg
  f.unique = options?.unique
  return f
}

export default assertMatches
