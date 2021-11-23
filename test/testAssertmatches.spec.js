import { suite } from 'uvu'
import { is as assertIs, throws as assertThrows, match as assertMatch } from 'uvu/assert'
import assertMatches, { any, match, unique, assertHtml } from '../index.js'

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
testMatch('matches similar match', () => {
  const b = match(/b/)
  assertMatches('abcb')`a${b}c${b}`
})
testMatch('throws if not same match matched', () => {
  const b = match(/./)
  assertThrows(() => assertMatches('abcd')`a${b}c${b}`, e => {
    assertMatch(e.message, 'match /./ failed (b vs d)')
    return true
  })
})

const testAssertMatches = suite('assertMatches')
testAssertMatches('matches whole str', () => {
  assertMatches('abc')`a${match(/b/)}c`
})
testAssertMatches('does not match', () => {
  assertThrows(() => assertMatches('abc')`a${match(/c/)}c`)
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
testAssertMatches('allows standard interpolated values', () => {
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
  const s = '<x class="cc2417530138_noname c2c420bfc" theme="[object Object]">test</x><style>.c2c420bfc{color:blue;}</style>'
  assertMatches(s)`<x class="${A}_noname ${B}" theme="[object Object]">test</x><style>.${B}{color:blue;}</style>`
})
testAssertMatches('matches does not throw if same regex but different value', () => {
  const A = match(/[0-9a-z_-]+/)
  const B = match(/[0-9a-z_]+/)
  const s = '<x class="cc2417530138_noname c2c420bfc" theme="[object Object]">test</x><style>.c2c420bfc{color:blue;}</style>'
  assertMatches(s)`<x class="${A} ${B}" theme="[object Object]">test</x><style>.${B}{color:blue;}</style>`
})

const testUnique = suite('testUnique')
testUnique('unique should throw if same value already matched', () => {
  const A = unique(/./, { id: 'a' })
  const B = unique(/./, { id: 'b' })
  const s = 'x B x B'
  assertThrows(() => assertMatches(s)`x ${A} x ${B}`, e => {
    assertMatch(e.message, "expect 'B' value (id: b) to be unique. Matched by id: a")
    return true
  })
})

const testAny = suite('testAny')
testAny('any should not throw if same value already matched', () => {
  const A = any(/./)
  assertMatches('x B x B')`x ${A} x ${A}`
})
testAny('accepts regExp as shorthand', () => {
  const A = /./
  const [a, b, c, d] = assertMatches('a b c d')`${A} ${A} ${A} ${A}`
  assertIs(a, 'a')
  assertIs(b, 'b')
  assertIs(c, 'c')
  assertIs(d, 'd')
})

const testCustomFunc = suite('testCustomFunc')
testCustomFunc('accepts a random func', () => {
  assertMatches('s 5 b')`s ${s => '' + parseInt(s, 10)} b`
})
testCustomFunc('exemple debugging', () => {
  const A = match(/./)
  let captured
  const withLog = matcher => s => {
    captured = matcher(s)
    return matcher(s)
  }
  const logA = withLog(A)
  assertMatches('s 5 b')`s ${logA} b`
  assertIs(captured, '5')
})
testCustomFunc('throws from random func', () => {
  assertThrows(() => assertMatches('b')`${s => { throw new Error('nope') }}`, e => {
    assertMatch(e.message, 'nope')
    return true
  })
})
testCustomFunc('throws from random func if no returned string', () => {
  assertThrows(() => assertMatches(' ')`${() => 5}`, e => {
    assertMatch(e.message, 'matching func should return the matched string')
    return true
  })
})

const testIgnore = suite('testIgnore')
testIgnore('ignores ws on left side', () => {
  assertMatches('XaX').ignore('X')`aX`
  assertMatches('aX').ignore('X')`XaX`
})
testIgnore('ignores ws on right side', () => {
  assertMatches('XaX').ignore('X')`Xa`
  assertMatches('Xa').ignore('X')`XaX`
})
testIgnore('ignores ws on both side', () => {
  assertMatches('XaX').ignore('X')`a`
  assertMatches('a').ignore('X')`XaX`
})
testIgnore('ignores ws on multiline', () => {
  assertMatches('<a>ident me plz</a>').ignore(/\s*\n\s*/g)`
  <a>
    ident me plz
  </a>`
})
testIgnore('real case', () => {
  const str = '<x class="cc1357433655_noname c39490774" mycolor="pink"><y class="cc3621825932_noname c5ac6afa3" mycolor="brown"></y><style>.c5ac6afa3{color:red;color:brown;}</style></x><style>.c39490774{color:green;color:pink;}</style>'
  const A = match(/.+?(?=[_])/)
  const C = match(/.+?(?=[_])/)
  const B = match(/.+?(?=["{])/)
  const D = match(/.+?(?=["{])/)
  assertMatches(str).ignore(/\s*\n\s*/g)`
    <x class="${A}_noname ${B}" mycolor="pink">
      <y class="${C}_noname ${D}" mycolor="brown">
      </y>
      <style>.${D}{color:red;color:brown;}</style>
    </x>
    <style>.${B}{color:green;color:pink;}</style>`
})
testIgnore('throws if invalid on multiline', () => {
  assertThrows(() => assertMatches('<a>ident me plz</a>').ignore(/\s*\n\s*/g)`
  <a>f
    ident me plz
  </a>`, e => {
    assertMatch(e.message, "<a>ident me plz</a>' !== '<a>fident me plz</a>")
    return true
  })
})

const testHtml = suite('testHtml')
testHtml('throws if invalid on multiline', () => {
  const str = '<x class="cc1357433655_noname c39490774" mycolor="pink"><y class="cc3621825932_noname c5ac6afa3" mycolor="brown"></y><style>.c5ac6afa3{color:red;color:brown;}</style></x><style>.c39490774{color:green;color:pink;}</style>'
  const A = any(/.+?(?=[_])/)
  const B = match(/.+?(?=["{])/)
  const C = match(/.+?(?=["{])/)
  assertHtml(str)`
    <x class="${A}_noname ${B}" mycolor="pink">
      <y class="${A}_noname ${C}" mycolor="brown">
      </y>
      <style>.${C}{color:red;color:brown;}</style>
    </x>
    <style>.${B}{color:green;color:pink;}</style>`
})

const testReadme = suite('testReadme')
testReadme('all the tests', () => {
  {
    const A = match(/\d/)
    assertMatches('Draw ended as 3-3')`Draw ended as ${A}-${A}`// ok
    assertThrows(() =>
      assertMatches('Draw ended as 3-4')`Draw ended as ${A}-${A}`// ko
    )
  }
  {
    const A = unique(/\d/)
    const B = unique(/\d/)
    assertMatches('3 = 6')`${A} = ${B}`// ok
    assertThrows(() =>
      assertMatches('3 = 3')`${A} = ${B}`// ko
    )
  }
  {
    const A = any(/\d/)
    const [a, b] = assertMatches('3 = 6')`${A} = ${A}`// ok
    assertIs(a * 2, +b)
  }
  {
    const A = str => parseInt(str, 10) % 2 === 0 && parseInt(str, 10) + ''
    assertMatches('3 = 6')`3 = ${A}`// ok, 6 is odd...
    assertThrows(() => assertMatches('3 = 5')`3 = ${A}`) // ko
  }
  {
    const withCr = `<t>
     </t>`
    assertHtml(withCr)`<t></t>` // ok
    assertHtml('<t></t>')`<t>
     </t>` // ok
  }
  {
    const A = match(/\w+/)
    assertThrows(() =>
      assertMatches('a_stuff')`${A}_stuff`// whoops, A matches _stuff already.
    )

    const debugA = s => {
      console.log('matched!', A(s))
      return A(s)
    }
    assertThrows(() =>
      assertMatches('a_stuff')`${debugA}_stuff`// still ko but "logs matched! a_stuff"
    )
  }
})
testAny.run()
testMatch.run()
testUnique.run()
testCustomFunc.run()
testAssertMatches.run()
testIgnore.run()
testHtml.run()
testReadme.run()
