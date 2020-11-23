---
layout: post
title: 'Rails Service Objects: We can do Better'
date: 2020-11-23
---

Rails developers have long advocated for the use of "Service Objects" in Rails
applications to clean up code in bloated models and controllers. While this is
often helpful, we can do better by putting a bit more thought into our designs.

The Service Object Pattern
---------------------------

First, what do we mean by a service object? Essentially, it's a command we can
call to execute a single action. For example, we might want a service object to
send a message to a user.

```ruby
module ServiceObject
  def call(*args)
    new(*args).call
  end
end

class SendDirectMessage
  extend ServiceObject

  def initialize(sender, recipients, content)
    @sender = sender
    @recipients = recipients
    @content = content
  end

  def call
    @message = DirectMessage.create!(
      sender: @sender,
      recipients: @recipients
      content: @content
    )

    send_email
    @message.update!(status: :sent)
  end

  def send_email
    @recipients.each do |recipient|
      DirectMessageMailer
      .with(sender: @sender, recipient: @recipient)
      .deliver_later
    end
  end
end
```

Then we call our service object like this

```ruby
SendMessageToUser.call(user, message)
```

When using service objects, we're not intended to initialize the service
directly. Instead, the intended use is to use the class method `::call` to both
instantiate the object and run the instance `#call` method.

{: .callout}
The service pattern is similar to the [Command Pattern](https://en.wikipedia.org/wiki/Command_pattern),
but it's not since we never intend to pass a service to a generic invoker. It's
not really an OOP pattern at all as we'll see later.

Why This is Better
-----------------------

I think most Rails developers would acknowledge that this immediately solves
some problems. Let's break down why this is better.

### Makes Our Classes Smaller

(models and controllers)

### Code Reuse

### Spans Cross-Cutting Concerns

### Creates Boundary Between Classes

(models and controllers)

### Creates a Self-Contained Scope

What Are We Losing?
-----------------------

(object oriented programming)

### Constructor

### Message Passing

(we can't call methods on our object)

### Extendability

(open-closed principle)

### Single Responsibility

(we're encouraged to put lots of logic in one class)

How Do We Continue Improving?
------------------------------

### Objects are Things, not Actions

(nouns, not verbs, not "er")

### Decompose Complex Objects
