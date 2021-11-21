import { suite } from 'uvu'
import { is as assertIs, throws as assertThrows, match as assertMatch } from 'uvu/assert'
import assertMatches, { match, unique } from '../index.js'

const testMatch = suite('match')
testMatch('matches whole str', () => {
  const m = match(/.*/)
  assertIs(m('test'), 'test')
})
testMatch('matches partial str', () => {
  const m = match(/[^_]+/)
  assertIs(m('test_noname'), 'test')
})
testMatch('throws if no match', () => {
  const m = match(/middle/)
  assertThrows(() => m('ok?'), err => {
    assertMatch(err.message, 'regex did not match ok? /middle/')
    return true
  })
})
testMatch('does not match in mddle str', () => {
  const m = match(/middle/)
  assertThrows(() => m('a_middle_b'), err => {
    assertMatch(err.message, 'regex did not match at start a_middle_b /middle/')
    return true
  })
})
testMatch.run()

const testAssertMatches = suite('assertMatches')
testAssertMatches('matches whole str', () => {
  assertMatches('abc')`a${match(/b/)}c`
})
testAssertMatches('does not match', () => {
  assertThrows(() => assertMatches('abc')`a${match(/c/)}c`)
})
testAssertMatches('matches similar match', () => {
  const b = match(/b/)
  assertMatches('abcb')`a${b}c${b}`
})
testAssertMatches('throws if not same match matched', () => {
  const b = match(/./)
  assertThrows(() => assertMatches('abcd')`a${b}c${b}`, e => {
    assertMatch(e.message, 'match /./ failed (b vs d)')
    return true
  })
})
testAssertMatches('rejects on last capturing', () => {
  assertThrows(() => assertMatches('abcd')`a`, e => {
    assertMatch(e.message, "'abcd' !== 'a'")
    return true
  })
})
testAssertMatches('rejects if not matching between caps', () => {
  const m = match(/./)
  assertThrows(() => assertMatches('aXBXc')`a${m}b${m}c`, e => {
    assertMatch(e.message, "'B' !== 'b'")
    return true
  })
})
testAssertMatches('allowes standard interpolated values', () => {
  assertMatches('aassertOk')`a${'assertOk'}`
  assertMatches('a23')`a${23}`
})
testAssertMatches('rejects if interpolated values not equal', () => {
  assertThrows(() => assertMatches('a11')`a${12}`, e => {
    assertMatch(e.message, "'11' !== '12'")
    return true
  })
})
testAssertMatches('should match', () => {
  const A = match(/.+?(?=_)/)
  const B = match(/.+?(?=["{])/)
  const s = `<x class="cc2417530138_noname c2c420bfc" theme="[object Object]">test</x><style>.c2c420bfc{color:blue;}</style>`
  assertMatches(s)`<x class="${A}_noname ${B}" theme="[object Object]">test</x><style>.${B}{color:blue;}</style>`
})

testAssertMatches('unique should throw if same value already matched', () => {
  const A = unique(/./, { id: 'a' })
  const B = unique(/./, { id: 'b' })
  const s = `x B x B`
  assertThrows(() =>assertMatches(s)`x ${A} x ${B}`, e => {
    assertMatch(e.message, "expect 'B' value (id: b) to be unique. Matched by id: a")
    return true
  })
})
testAssertMatches.run()
