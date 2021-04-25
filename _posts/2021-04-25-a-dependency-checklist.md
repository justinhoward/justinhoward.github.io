---
layout: post
title: A Dependency Checklist
date: 2021-04-25
---

Unless you're working for a large corporation with strict security guidelines,
you may not think too much about adding a new third-party dependency to your
project. However, even if you're the sole developer or working on a small team,
choosing dependencies should not be taken lightly.

This checklist explains what I consider when considering adding a dependency
like a third-party library.

Activity
----------------

Is this software actively maintained? How friendly is the author to outside
contributions? Are there many outstanding bugs? What was the last time a bug
was fixed? If the project has dependencies of its own, is it compatible with the
latest versions of those?

I typically will not add a dependency unless I'm confident that issues that I
discover can be fixed. I don't mind fixing it myself, as long as my time isn't
wasted on a pull request that will never be reviewed.

License
----------------

For the most part, I look for open-source dependencies with few exceptions. I
prefer simple, permissive licenses like MIT, BSD-3, ISC, and Apache 2.0.
Depending on the project, GPL may also be acceptable. A project with a missing
license is a no-go.

Maturity
----------------

For the most part, maturity comes down to how long a project has been used in
production. I consider overall age, but also things like performance,
configurability, and stability.

A newer project is less likely to stand up to heavy production use where its
limits are tested. I prefer not to be a beta tester in these cases.

Documentation
----------------

A piece of code can be the most revolutionary, perfect piece of software ever
written, but it's worth very little without good documentation. This comes in
the form of guides, API docs, and release notes.

Guides are intended to address the most common use-cases for a piece of
software, things like setup and configuration. API docs should dig deep into the
full public API for a library and document the details of each class or
function. The release notes, or changelog should document all significant
changes in each version and specifically call out breaking changes.

Reputation
---------------

Who is the maintainer or maintainers of the project? Is it backed by a company,
or an individual? If it is an individual, are they known in the community? Can
they be trusted? Are they vulnerable to coercion by a malicious party? How
likely is it that the project will be abandoned?

Without knowing the reputation of the maintainers, it is very risky to use their
code in your application.

Code Quality
---------------

When I scan the code, does it have a consistent, readable style? Would I feel
comfortable writing a patch for it? Does it have good test coverage? What kind
of bugs are in the issue tracker, and do those demonstrate commitment to
quality?

Code quality can be an indicator of stability and usability, but it's also
important for maintenance. Code that is a spaghetti mess is likely to become
difficult to maintain or have unfixable bugs.

Popularity
---------------

How many other users are there of this software? Although popularity isn't
critical, it does make it more likely that the project will continue to be
maintained. Especially if the project has a permissive license, a popular
project is likely to be maintained even after the current maintainers abandon
it.

Popularity also makes it more likely that common bugs will have already been
found and fixed.

Transitive Dependencies
--------------------------

Don't forget to check the dependencies that the project itself has. Transitive
dependencies are just dependencies of your dependencies. You depend on these
just as much as your direct dependencies, so it's important to apply the same
rigor to them.

Overall Risk
--------

Considering all the other points, what is the risk of introducing this
dependency? How easy will it be to replace in my application if necessary? What
would be the impact of a bug or security vulnerability if there was one?

Adding third party code to your application is risky, but almost always
necessary. Make sure to do your due diligence.
