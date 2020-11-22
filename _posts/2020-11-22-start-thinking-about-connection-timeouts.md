---
layout: post
title: Start Thinking About Connection Timeouts
date: 2020-11-22
---

When an application makes an HTTP request to another service, the application
surrenders control of its performance to that external service. If it takes 10
seconds to respond, the application waits for 10 seconds. To stay healthy the
application needs to set appropriate timeouts to limit the impact of flaky
external services.

## Why Bother With Timeouts?

Timeouts are an often overlooked setting when making network requests. We'll be
talking in terms of HTTP in this post, but timeouts apply to all network
requests. But why should we care about setting timeout values?

Consider an application that makes an API call to an external service to translate
some text. When a user clicks a translate button, the client does an AJAX
request to our server, and our server calls the translation service. The API
call takes an average of 200ms to return, so we're able to return translated
text to the user within around 400ms total.

Suddenly, the translation service performance degrades, and starts taking 5
seconds to return instead of 200ms. Requests to our AJAX endpoint start piling
up, and now our web server starts to run out of available connections. Now our
users start to see errors that the site is down! We can quickly try to restart
servers, but the requests keep piling up because the translation service keeps
taking our available connections.

How do we avoid this nightmare scenario? The first step is to set timeouts on
all your HTTP requests. Yes, in this scenario, that means that users would see
an error when they click the translate button, but the whole site wouldn't
crash.

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

At a low level, this is how timeouts are implemented for most HTTP client
libraries. For example, here is OkHttp for Java/Kotlin, whose timeouts default
to 10 seconds.

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
  open_timeout: 1.0,
  read_timeout: 2.5,
  write_timeout: 1.5
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

But this is a deceptive API and easily causes mistakes. When reading this, you'd
expect that the whole request can take up to 3 seconds. However, the actual
effect is that each individual timeout is set to 3 seconds, adding up to a
worst-case request time of 9 seconds (there's actually more that contributes to
total request time).

## Base Your Timeouts on Data

At [ParentSquare](https://www.parentsquare.com), we use Datadog's APM product to
trace applications. Tools like this or NewRelic's APM product provide samples
of each outgoing HTTP request along with the total request time. We can use this
data as a baseline for choosing timeout values.

For example, if we know that the average request time for a certain endpoint is
100ms, and the max known request time is 300ms, we might choose 600ms for each
of the connect, read, and write timeout values to give us plenty of buffer.
It's a good idea to build in some buffer in case the service quality of the
endpoint degrades. However, you don't want too much buffer since that could
start to cause cascading failures in your application.

As you might have noticed, this requires some amount of educated guessing, since
so far, we have no data that tells us how much of the request is taken by
connect/reads/writes. Can we do a better job of choosing more accurate values?

While I'm certainly not an expert at this, I found this feature of cURL
described by Joseph Scott in "[Timing Details With cURL](https://blog.josephscott.org/2011/10/14/timing-details-with-curl/)".

First create a format file we'll call `curl-format.txt`.

```plain
time_namelookup: %{time_namelookup}\n
time_connect: %{time_connect}\n
time_appconnect: %{time_appconnect}\n
time_pretransfer: %{time_pretransfer}\n
time_redirect: %{time_redirect}\n
time_starttransfer: %{time_starttransfer}\n
———\n
time_total: %{time_total}\n
```

Then run cURL with the `-w` or `--write-out` option, passing in our format
file. Let's just run it on the ParentSquare home page.

```sh
curl -L -w "@curl-format.txt" -o /dev/null -s  https://parentsquare.com

time_namelookup: 0.004379
time_connect: 0.072605
time_appconnect: 0.223555
time_pretransfer: 0.223701
time_redirect: 0.291480
time_starttransfer: 0.294933
———
time_total: 0.821796
```

This actually gives us a pretty good idea of the timings. The
[cURL manpage](https://curl.se/docs/manpage.html) gives us a good description of
each of these values:


> **time_namelookup** The time, in seconds, it took from the start until the
> name resolving was completed.

Name resolution took 4ms, so we know that the DNS lookup portion of this request
was negligible.

> **time_connect** The time, in seconds, it took from the start until the TCP
> connect to the remote host (or proxy) was completed.

It took 72ms to complete the TCP connection. This would be included in
`open_timeout` in our Ruby example above.

> **time_appconnect** The time, in seconds, it took from the start until the
> SSL/SSH/etc connect/handshake to the remote host was completed. (Added in
> 7.19.0)

It took 223ms to open a TCP connection and complete the SSL/TLS handshake.

> **time_pretransfer** The time, in seconds, it took from the start until the
> file transfer was just about to begin. This includes all pre-transfer commands
> and negotiations that are specific to the particular protocol(s) involved.

In this test the request took 223ms before starting any data transfer. So far
we've just opened a TCP connection and completed the TLS handshake. We haven't
sent our HTTP request yet.

> **time_redirect** The time, in seconds, it took for all redirection steps
> including name lookup, connect, pretransfer and transfer before the final
> transaction was started. time_redirect shows the complete execution time for
> multiple redirections. (Added in 7.12.3)

In this case, we did follow a redirect, and so far, after negotiating the
redirect, 291ms have elapsed in total

> **time_starttransfer** The time, in seconds, it took from the start until the
> first byte was just about to be transferred. This includes time_pretransfer
> and also the time the server needed to calculate the result.

At the 294ms point, we're starting to transfer our first byte. After that, the
rest of the time is spend writing our request and reading the response. As far
as I know, cURL has no way to differentiate between those times.

> **time_total** The total time, in seconds, that the full operation lasted.

The total time for this request was 821ms after we received our response.

What does all this tell us? If we strip away the extra information, we see that
we can get the information we need from cURL with two metrics,
`time_pretransfer` and `time_total`, so let's rerun the command. We don't even
need the format file now.

```sh
curl -L -w "Pre: %{time_pretransfer}\nTotal: %{time_total}\n" -o /dev/null -s  https://parentsquare.com

Pre: 0.223701
Total: 0.821796
```

Now we can make better educated guesses about our `open_timeout`,
`read_timeout`, and `write_timeout` values.

### Open Timeout

Our test data shows 223ms, so an open timeout of 1 second should give the
endpoint more than enough room to occasionally respond slowly without timing
out. Depending on your use-case, you may want to be more or less strict with
this.

### Read Timeout

If we subtract our pretransfer time from the total, we get 598ms. This includes
both write and read time. In most real-world use-cases, your read time is going
to take the most time, since it includes the entire time from when the server
receives your request, to when you receive a response back. This will include
time for the remote server to process your request and send the response. So we
can assume that most of this 598ms was included in the read wait time. If you
know of a better way of measuring this, let me know.

### Write Timeout

In this case, we can set this to a fairly low value, since we're assuming that
most of the request time is taken by the read. However, in cases where you're
writing a lot of data (for example file uploads), you'll need to allow time for
that data to be transferred.

## Experiment

Ultimately, the performance of your external dependencies may vary, and you
might need to do what amounts to "guess and check" to tune in the right timeout
values. Your application should be able to tolerate some timeouts without
causing usability issues for your users. If it can't, you will also need to add
other forms of fault-tolerance (like retries) to make sure that your application
can recover from a temporary service interruption in its dependencies.

## Going Further

Even with our timeouts, we still might worry about cascading failures. Consider
if we're processing a job 10,000 times a minute, and each of those makes an HTTP
request. That request normally takes 300ms, and we have our timeouts set around
1 second. If that request starts timing out, suddenly that job is taking 3 times
longer than normal! This application likely won't behave well if that happens.

To solve this problem, we need something like circuit breakers, as described by
Michael T. Nygard in his book "Release It!: Design and Deploy Production-Ready
Software". I highly recommend reading it for great examples of catastrophic
software failures and ways to avoid them.

I also wrote a library called [Faulty](https://github.com/parentsquare/faulty)
that implements circuit breakers for Ruby.

Timeouts are an important first step to ensure your application is safe from
failing HTTP endpoints. They are often overlooked by even seasoned developers.
Make sure you think about them before it causes a problem.
