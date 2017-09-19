---
layout: post
title: Controlling an Interactive Process With Bash
date: 2017-07-31
---

Recently, I needed to write a utility to automate some commands via SFTP.
Anytime I want to automate something on the command line, I think of Bash first.
Of the programming languages I've used, it is the best suited for calling and
orchestrating command line utilities. That said, this task was a particular
challenge for me. Let's walk through my process.

## First Attempts

The `stfp` command line utility is generally controlled by interactive commands
via STDIN. When you start it up, it displays a prompt. You enter a command like
`put <file>` and it responds by displaying the results on STDOUT. In Bash, you
can easily pipe commands to STDIN. That means I can control SFTP with a pipe.

```sh
echo 'put file.txt' | sftp user@server.com
```

Great! But I want to issue multiple commands to `sftp` dynamically. Now it
starts to get a bit more advanced. Bash supports what's called "process
substitution". One of the things it allows you to do is put a subshell in place
of a filename in a pipe.

```sh
sftp user@server.com < <(echo 'put file.txt')
```

This command is equivalent to the first command above. By itself,
that's not interesting, but let's take it one step further.

## Getting Fancy

```sh
sftp user@server.com < <(
  echo 'put file.txt'
  if [ -n "$list" ]; then
    echo 'ls -1'
  fi
)
```

Now we have a subshell whose output is piped to `sftp`! We can issue commands,
perform logic and then perform other commands. This is great is all you want to
do is issue commands, but what if you wanted to make decisions based on the
output of `sftp`? We don't have access to STDOUT from the subshell. The simplest
method would be to record the output of `sftp` in a variable.

```sh
ls=$(sftp user@server.com < <(
  echo 'ls -1'
))

if [[ "$ls" != *file.txt* ]]; then
  sftp user@server.com < (
    echo 'put file.txt'
  )
fi
```

But now we have to invoke the `sftp` command multiple times which is slow and
resource intensive. How can we read and write to the `sftp` command without
stopping it? My answer was to look beyond subshells and explore the exciting and
scary world of fifos.

## Exploring FIFOs

A FIFO (first-in-first-out) is a special type of file that
acts like a queue or buffer. When you write to it, the input is buffered until
another process reads it. Data passing through a FIFO can only be read once.
Think of it like a data pipeline. FIFOs can be written by one process and read
by another. Here's a quick demonstration.

```sh
mkfifo myfifo
echo 'Hello, world!' > myfifo
cat < myfifo
# Hello, world!
```

We're going to use FIFOs to read and write to the `sftp` process. First, let's
set up a FIFO to write.

```sh
mkfifo cmd_fifo
sftp user@server.com < cmd_fifo
```

The `sftp` command is now reading from `cmd_fifo`. Anytime something writes to
the FIFO, `sftp` will execute it as a command. The problem is, if you execute
this script it will wait forever for a command and never exit. We need to send
a command.


```sh
mkfifo cmd_fifo
sftp user@server.com < cmd_fifo &
echo 'put file.txt' > cmd_fifo
```

Nice! Now we background the `sftp` process with `&` then later write a command
to the FIFO. Let's try two commands.

```sh
mkfifo cmd_fifo
sftp user@server.com < cmd_fifo &
echo 'put file.txt' > cmd_fifo
echo 'put file2.txt' > cmd_fifo
```

It doesn't work. The problem is that when we write `put file.txt` to the FIFO
with echo, bash opens the file, writes to it, then closes it. The `sftp` command
sees the closed FIFO and thinks we're done issuing commands. Then when we
write `put file2.txt`, `sftp` has already exited. We need a way to hold `sftp`
open until we're done issuing commands.

## Another FIFO

We're going to add a second writer to the command FIFO. This second writer will
keep the FIFO open until we're done with it and the `sftp` command will not
exit.

```sh
mkfifo cmd_fifo ctrl_fifo

cat > cmd_fifo < ctrl_fifo" &
sftp user@server.com < cmd_fifo &

echo 'put file.txt' > cmd_fifo
echo 'put file2.txt' > cmd_fifo
```

What we actually did here is create a second FIFO. We'll call it the control
FIFO. Using `cat`, we read from the control FIFO and pipe it into the command
FIFO. This `cat` serves as our second writer. Since we background the process
with `&`, it holds the command FIFO open until we're done with it. Now when we
write to `cmd_fifo` with echo, `sftp` does not exit.

Now we have another problem though. When our script exits, it leaves both
background processes running. To signal that we're done, we need to close both
FIFOs.

```sh
mkfifo cmd_fifo ctrl_fifo

cat > cmd_fifo < ctrl_fifo" &
sftp user@server.com < cmd_fifo &

echo 'put file.txt' > cmd_fifo
echo 'put file2.txt' > cmd_fifo

echo > ctrl_fifo
wait
```

All we did here is add a single echo at the end. When the echo writes to
`ctrl_fifo`, since it's the only writer, it closes `ctrl_fifo`. Then, when
`ctrl_fifo` closes, the `cat` command exits. Since the `cat` is the only writer
to `cmd_fifo`, it closes. When `cmd_fifo` closes, `sftp` exits.

The `wait` at the end tells bash to wait for background processes to exit. We do
this to ensure that everything cleans up correctly before stopping the script.

## Reading from SFTP

So now we can write to a background process, but what we were trying to do is
read from it. If you guessed more FIFOs, you'd be right!

```sh
mkfifo cmd_fifo read_fifo ctrl_fifo

cat > cmd_fifo < ctrl_fifo &
sftp user@server.com < cmd_fifo > read_fifo 2>/dev/null &

echo 'ls -1' > cmd_fifo
read -r < read_fifo
# Create an empty prompt line to look for later
echo > cmd_fifo

while read -r file < read_fifo; do
  # look for the empty prompt
  [ "$file" = 'sftp>' ] && break
  echo "get '${file}'" > cmd_fifo
done
# Create another emtpy prompt. We'll stop once we get there
echo > cmd_fifo

# Read the output of sftp until we get to our emtpy prompt
# Allows blocking "write" calls from sftp to continue
# Otherwise sftp will hang
while read -r line < read_fifo; do
  [ "$line" = 'sftp>' ] && break
done

echo > ctrl_fifo
wait
```

## Cleaning Up
