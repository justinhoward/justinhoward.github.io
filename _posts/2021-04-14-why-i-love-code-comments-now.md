---
layout: post
title: Why I Love Code Comments (Now)
date: 2021-04-14
---

Should I add comments to my code? It turns out this is a controversial topic
that has much more nuance than you'd think at first glance. Here are the various
approaches I've used and why I now write a lot of comments.

A Beginner Approach
---------------------

As a junior developer I wrote code without a good understanding of how it would
be maintained or how it would stand up to continual changes. Then as my
experience grew, that code went from an unreadable mess to organized and (for
the most part) clear. At this point I rarely used code comments and I didn't see
the need for them.

As my skills improved, my team was able to understand _how_ my code worked. This
was a big improvement, but it's not nearly enough.

Code as Documentation
-----------------------

As I became an intermediate developer, I came across some blog posts that
described "self-documenting" code. The concept is that if you write clear enough
code, and name your variables and functions well, comments are unnecessary. They
often claim that if you need comments, your code needs to be fixed.

Here is an example in Ruby

```ruby
def user_is_valid?(user)
  return false if user.full_name.nil?
  return false if user.email.nil? ^ user.phone.nil?
  true
end
```

The line with email and phone is not readable at first glance since we're
abusing the `^` operator to be XOR (one or the other but not both). We could add
a comment, or we could just extract a method to document that.

```ruby
def user_is_valid?(user)
  return false if user.full_name.nil?
  return false unless user_has_email_xor_phone?(user)
  true
end

def user_has_email_xor_phone?(user)
  user.email.nil? ^ user.phone.nil?
end
```

This is much more readable. I started following this approach, fanatically
refactoring all my functions into self-documenting bits. Today I take a slightly
more pragmatic approach, but I still use similar strategies.

However, even this is not enough. A reader can easily understand that we're
validating that a user has an email XOR phone, but why? Why can't our user have
both?

Communicating Intent
----------------------

The next step of documentation is communicating intent. Intent expresses not
only _how_ your code works, but _why_ it is designed that way. All applications
are designed to work a specific way, but unless you document intent, that design
can be lost.

Let's say the product manager wants to add support for both email and phone on
user accounts. As a developer of this application, I would encounter the
validation rule above. I would wonder whether it's safe to remove this. Is
anything downstream depending on this rule? Will the front-end UI behave
correctly?

Let's add clarifying intent comments to our example above.

```ruby
# The given user has an email or phone but not both
#
# A user must have at least one way to contact them. That can be either email
# or phone. However, users cannot have both an email and phone because that
# would break the NotificationSender module which currently does not support
# users with both contact methods. If we fix NotificationSender to support both,
# this validation rule can be removed.
def user_has_email_xor_phone?(user)
  user.email.nil? ^ user.phone.nil?
end
```

We now know _why_ this validation rule was created. Later if we want to remove
this rule, we have better information and can approach change with the full
history in mind.

Much of the code I write now has comments like this. Especially as application
logic becomes more complex, intent documentation is invaluable.
