# assertMatches

Simple helper to check a string with placeholders (changing values) you don't care


## Examples
```
import assertMatches from 'assertmatches'
assertMatches('Today is 121212', `Today is ${/.*/}`) // ok
assertMatches('Today is 121212', `Today is ${/[a-z]+/}`) // ko
assertMatches('Today is 121212', `Today is ${/\d+/)}`) // ok
assertMatches('<div class="bX58f2">randm', `<div class="${/\w+/}">randm`) // ok
```

## Api

### any

Matches anything matched by the regexp. No need to specify `^`.

```
const A = any(/\d/)
assertMatches('1 + 2 + 3 = 6')`${A} + ${A} + ${A} = ${A}`// ok
assertMatches('1 + 2 + 3 = s')`${A} + ${A} + ${A} = ${A}`// ko
assertMatches('1')`${any(/^\d/)}`// ok but ^ useless.
assertMatches('a1')`${any(/\d/)}`// ko does not start with digit
```

Directly supplying a regExp is a shorthand for any

```
const A = /\d/
assertMatches('1 + 2 + 3 = 6')`${A} + ${A} + ${A} = ${A}`// ok
```

### match

Matches anything matched by the regexp.
However, will fail if two matches are not equal

```
const A = match(/\d/)
assertMatches('Draw ended as 3-3')`Draw ended as ${A}-${A}`// ok
assertMatches('Draw ended as 3-4')`Draw ended as ${A}-${A}`// ko
```

### unique

Will throw if exists an other unique with same value.

```
const A = unique(/\d/)
const B = unique(/\d/)
assertMatches('3 = 6')`${A} = ${B}`// ok
assertMatches('3 = 3')`${A} = ${B}`// ko
```

### assertMatches

If API is too shitty, you may want to apply rules on the captures yourself

```
const A = any(/\d/)
const [a, b] = assertMatches('3 = 6')`${A} = ${A}`// ok
assertIs(a * 2, +b)
```

`assertMatches` handles custom function as long as they return the matched string

```
const A = str => parseInt(str, 10) % 2 === 0 && parseInt(str, 10)+''
assertMatches('3 = 6')`3 = ${A}`// ok, 6 is odd...
assertMatches('3 = 5')`3 = ${A}`// ko
```

### assertHtml

Like `assertMatches` but ignores indentation

```
assertHtml(`<t>
 </t>`)`<t></t>` // ok
assertHtml('<t></t>')`<t>
 </t>` // ok
```

### Tricks

When regex match, but assertion is still failing, supply a custom function logging the matched part

```
const A = match(/\w+/)
assertMatches('a_stuff')`${A}_stuff`// whoops, A matches _stuff already.

const debugA = s => (console.log('matched!', A(s)), A(s))
assertMatches('a_stuff')`${debugA}_stuff`// still ko but "logs matched! a_stuff"
```

