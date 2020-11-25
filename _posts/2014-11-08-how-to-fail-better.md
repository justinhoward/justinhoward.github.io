---
layout: post
title:  How to Fail Better
date:   2014-11-08 10:00
---

Software development is like an art. Every project starts with a concept, an
idea that organically unfolds into something beautiful. That is the creative
process that makes my work worthwhile. However, for every masterpiece there are
a thousand failures. How should software developers deal with failure?

Fail Early
-----------------

Failures are unavoidable. Rather than fighting against failure, software
developers should embrace them as a useful part of the craft. In order to profit
from failure, it needs to be expected.

This last week I was building a JavaScript library for managing data in a single
page application. I began the project with the goal of keeping it simple. It
turned out anything but simple. As the week went by I would come across a
problem and solve it by adding a bit to the scope of my library. By Tuesday, the
library had a dependency graph of all the tracked entities, and was managing
object relationships. I was building an [ORM][orm]. I recognized the warning
signs, but I was committed. I had already spent two days working on it. By
Thursday, it became obvious that my project had long ago missed my goal of
simplicity and was headed nowhere. I had failed.

Why did I wait so long before admitting failure? I don't think it was pride or
fear. It just caught me off guard. I wasn't expecting to fail. This blind spot
is a dangerous one. This mistake cost my company four days of work. It could
have been much more. Had I been watching for failure and heeded the warning
signs, I could have caught my mistake much earlier.

In order to fail profitably, mistakes need to be caught early. The later they
happen, the more they cost. There are two ways to do that. First, continually
evaluate your work. Have benchmarks for success and failure. Are you meeting
your original goals? Are you fulfilling user requirements with your work?
Second, be accountable to someone. Often we cannot see our own blind spots. Be
completely transparent about what you are working on with your co-workers. If
you are self-employed, have a mentor or partner that you can share your work
with.

Don't Feed a Failure
-----------------------

In economics, [sunk costs][sunk-costs] are costs that are already incurred. The
time you have already spent on a project is a sunk cost. You cannot get that
time back. The sunk cost fallacy is making a choice based on what you have
already paid rather than objectively evaluating the current situation. When I
saw the warning signs that my JavaScript project was not working, I rationalized
it by saying that "I had already spent two days working on it". That is a
fallacy. Instead, I should have objectively evaluated my project and seen that
it was not worth spending any more time on. Instead, I spent two _more_ days on
it before conceding. If a project or task has failed, kill it immediately and
spend your time on a better solution.

Don't Repeat Yourself
------------------------

Failures are rich with useful information that often goes to waste. [DRY][dry]
(Don't Repeat Yourself) is a principle used in software development to minimize
duplicated code and redundant systems, but it can be extended even further to
the development process. When I make a mistake, I evaluate it, find out why it
happened, then take steps to prevent it.

After recovering from the failure of my project this week, I identified two
reasons for the failure. I didn't identify the problem soon enough, and my
original design was too complex. To solve the early identification problem, I am
using daily stand up meetings and more frequent code reviews to be as
transparent as possible about my work. To improve my designs, I plan to
collaborate more with co-workers during design stage.

No one enjoys their failures, but when we harness their power, failures can
become a useful tool in the software developer's toolbox. We use them to improve
ourselves. If software development is an art, then our failures are just the
road to creating a masterpiece.

[orm]: http://en.wikipedia.org/wiki/Object-relational_mapping
[sunk-costs]: http://en.wikipedia.org/wiki/Sunk_costs
[dry]: http://en.wikipedia.org/wiki/Don't_repeat_yourself
