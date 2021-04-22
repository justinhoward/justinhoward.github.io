---
layout: post
title: Avoid Ruby Hash Defaults
date: 2021-04-22
---

In Ruby, like most languages the default value for a hash is `nil` or empty. You
can override this behavior with your own default. Here are some reasons to avoid
using this feature.

The Basics
---------------------

You can create a ruby Hash with the literal `{}` syntax, or with `Hash.new`.
If you use `Hash.new`, you can specify a default with an argument

```ruby
Hash.new(0)
```

Now, any time you access a key that is not present on the hash, it will return
your custom default instead of the stored value.

```ruby
h = Hash.new(0)
h[:a] # => 0
h # => {}
```

Already, we see some potential traps. Here's a example:

```ruby
h = Hash.new(0)
h[:a] = 1 unless h[:a]
h # => {}
```

Here, the author makes the mistake of assuming that the default of `h` is `nil`,
but it's actually `0`, so we can't check for presence with `if/unless` like we
usually can. Okay, we can probably handle that and just make sure to use `key?`
when we want to check key presence, so let's look at some more complex and
dangerous examples.

With Mutable Objects
-------------------------

Probably the most common use of hash defaults is to make the default another
hash or array.

```ruby
h = Hash.new([])
h[:a] << 'foo' # => ['foo']
h # => {}
h[:b] # => ['foo']
```

Wait, what happened? Where did `'foo'` go, and why is it in `:b`? Well you
probably guessed it. When we mutate with `<<`, we actually mutated the default
array. Not only did we not add the `:a` key, but we also changed the value we
get when we request an unset key.

We can solve this problem by using a block to create a new array whenever we
request a default. This solves a problem and creates new ones.

With Dynamic Default
----------------------------

We can pass a block (Ruby's closures) to `Hash.new` that will get called every
time we need the default value. Let's see how that works.

```ruby
h = Hash.new { [] }
h[:a] << 'foo' # => ['foo']
h # => {}
h[:b] # => []
```

Okay, so that didn't fix it. We're no longer mutating the default array, but our
changes still aren't sticking. Let's look at the `<<` line and break it down
into its components.

```ruby
# Equivalent of h[:a] << 'foo'
# First get the default value, so our block is called and returns []
# and we store it in a
a = h[:a]
# Now we append 'foo' to our new array
a << 'foo'
```

You can see that our array with `'foo'` in it never gets assigned back to `h`.
Let's try to solve that problem.

```ruby
h = Hash.new { |hash, key| hash[key] = [] }
h[:a] << 'foo' # => ['foo']
h # => { a: ['foo'] }
```

Nice! We solved all our problems. Or did we? There are still a couple more
pitfalls because we now assign hash keys whenever they are accessed.

Access as Assignment
---------------------

Let's look at how you might use our solution so far in your application. We'll
see how it can cause issues.

```ruby
class RequestHeader
  def initialize
    @fields = Hash.new { |hash, key| hash[key] = {} }
  end

  def [](field)
    @fields[field]
  end

  def content_type=(value)
    @fields[:content_type] = value
  end

  def add_cookie(cookie)
    @fields[:cookie] = [] unless @fields.key?(:cookie)
    @fields[:cookie] << cookie
  end
end
```

We created a class to store request headers, and added a helper method to add
cookies individually. Did you spot the error? Let's look closer.

```ruby
header = RequestHeader.new
header.add_cookie('cookie')
header[:cookie] # => ['cookie']
```

Looks fine so far, let's look at how this breaks.

```ruby
header = RequestHeader.new
header[:cookie] # => {}
```

Oops, we expected an array, but it returned us a hash. This is a contrived
example, but a very similar bug caused a major issue in production for an app
that I worked on. Let's look at one more trap before wrapping up.

```ruby
h = Hash.new { |hash, key| hash[key] = [] }
h[:a] ||= ['foo'] # => []
h # => { a: [] }
```

I Avoid Hash Defaults
----------------------

Did you catch all these mistakes? If you did, good job, you're a very
knowledgeable Ruby developer. However, I'd prefer to just avoid these issues
altogether. Imagine if you initialize a hash in one file, and pass it somewhere
else in the application. It would be a nightmare to anticipate or track down
this type of bug.

In general, I now completely avoid overriding Hash defaults, and I suggest you
carefully consider your own uses of them.
