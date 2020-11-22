---
layout: post
title: Start Thinking About Connection Timeouts
date: 2020-11-22
---

When I make an HTTP request from my application to another service, I give that
service control of my application performance. If it takes 10 seconds to
respond, my application waits for 10 seconds. As developers we're responsible
for defending against these problems.

Do you know what would happen to your application if one of your HTTP
integrations started hanging? In any application of sufficient size, this will
happen eventually. Make sure you are prepared.

## How do HTTP clients handle timeouts?

Here are the default timeouts for `Net::HTTP`, Ruby's standard library HTTP
client.


```ruby
@open_timeout = 60
@read_timeout = 60
@write_timeout = 60
```
([source](https://github.com/ruby/ruby/blob/b2d96abb42abbe2e01f010ffc9ac51f0f9a50002/lib/net/http.rb#L688-L690))

The default for each of these is 60 seconds! Imagine if one of your third-party
integrations started taking 60 seconds for each call. How would that affect your
application? Notice that there are three timeouts here.

- Open timeout: The maximum time allowed to open a TCP connection to the host
- Read timeout: The maximum time to wait for an HTTP response
- Write timeout: The maximum time to send your HTTP request

At a low level, this is how timeouts are implemented for most HTTP clients. For
example, here is OkHttp for Java/Kotlin, which default to 10 seconds.

```kotlin
internal var connectTimeout = 10_000
internal var readTimeout = 10_000
internal var writeTimeout = 10_000
```
([source](https://github.com/square/okhttp/blob/cd722373281202492043f4294fccfe6f691ddc01/okhttp/src/main/kotlin/okhttp3/OkHttpClient.kt#L494-L496))

Regardless of the defaults for your HTTP client, they will likely not match the
usage pattern for your request. You need to be aware of each of these and adjust
them appropriately.

## Be Explicit

Whether you expect an HTTP request to take a long or short time, you should be
explicit about that expectation. Set your timeouts to match your usage.

```ruby
res = Net::HTTP.start(
  host,
  port,
  open_timeout: 1,
  read_timeout: 3,
  write_timeout: 2
)
```

Some HTTP clients try to abstract away the complexity of the three different
timeouts. For example, here is [HTTParty](https://github.com/jnunemaker/httparty)
for Ruby.

```ruby
if add_timeout?(options[:timeout])
  http.open_timeout = options[:timeout]
  http.read_timeout = options[:timeout]

  from_ruby_version('2.6.0', option: :write_timeout, warn: false) do
    http.write_timeout = options[:timeout]
  end
end
```
([source](https://github.com/jnunemaker/httparty/blob/b9a54d8f73a9a94863bf83a1ba559b557c68b4c8/lib/httparty/connection_adapter.rb#L117-L124))

It lets you write this

```ruby
HTTParty.get(url, timeout: 3)
```

But this is very deceptive API and usually a mistake. By reading this, you'd
expect that the whole request can take up to 3 seconds. However, the actual
effect is that each individual timeout is set to 3 seconds, adding up to a
worst-case request time of 9 seconds (it's more complicated than that, but
outside the scope of this post).

## Base Your Timeouts on Data

At [ParentSquare](https://www.parentsquare.com), we use Datadog's APM product to
trace applications. It provides us with the samples of each outgoing HTTP
request along with the total request time. We can use this data as a baseline
for choosing timeout values.

[Timing Details With cURL](https://blog.josephscott.org/2011/10/14/timing-details-with-curl/)
