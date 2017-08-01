---
layout: post
title: A Portable Shell Script Template
date: 2017-07-31
---

Often write small utility scripts to perform repetitive tasks. More
often than not, throw-away scripts become tools I come back to over and over.
I've started to learn my lesson. Now I spend a bit more time on polish. Then
when I come back to use the script again, it is documented and easy to use.

Most of my scripts are written in portable shell code. I've found
that shell scripts are best for writing small workflow tools. I always start
with the same basic structure.

```sh
#!/usr/bin/env sh

usage() {
  cat >&2 <<EOF
Usage: example-script [OPTIONS] ARG1 ARG2...
Perform an example function

OPTIONS
-h       Help - Show this help message
-n       Dry run - Print debug messaging instead of performing the function
-v       Verbose - Print verbose messaging
EOF
}

# msg(message...)
# Print a message to stderr
msg() {
  printf '%s\n' "$*" >&2
}

# verbose(message...)
# Print a message only in verbose mode
verbose() {
  [ -n "$verbose" ] && msg "$@"
}

# error_exit(message...)
# Print an error, then exit
error_exit() {
  msg "$@"
  exit 1
}

# usage_error(message...)
# Print an error and usage information, then exit
usage_error() {
  [ "$#" -gt 0 ] && printf '%s\n\n' "$*" >&2
  usage
  exit 1
}

while getopts :hnv opt; do
  case "$opt" in
    h) usage && exit ;;
    n) dry_run=1 ;;
    v) verbose=1 ;;
    \?) usage_error "Invalid option -${OPTARG}" ;;
    :) usage_error "Missing value for option -${OPTARG}" ;;
  esac
done
shift $((OPTIND - 1))

[ "$#" -ge 2 ] || usage_error 'At least 2 arguments are required'

# Main script here

verbose 'Prints a message only in verbose mode'

if [ -z "$dry_run" ]; then
  echo 'This will not run if dry run is set'
fi
```

## Step by Step

```sh
#!/usr/bin/env sh
```

This is the "shebang". It tells the operating system to run the script with the
`sh` command. I use POSIX compatible sh rather than bash for
portability, although I sometimes prefer bash for some features (like arrays).

```sh
usage() {
  cat >&2 <<EOF
Usage: example-script [OPTIONS] ARG1 ARG2...
Perform an example function

OPTIONS
-h       Help - Show this help message
-n       Dry run - Print debug messaging instead of performing the function
-v       Verbose - Print verbose messaging
EOF
}
```

This function just prints a block of help text. I've learned not to skip this.
Even for scripts I only use myself, I reference this help block constantly.

```sh
# msg(message...)
# Print a message to stderr
msg() {
  printf '%s\n' "$*" >&2
}
```

This function is basically just echo, but it prints to stderr instead of stdout.
It's always a good idea to print messaging to stderr. This allows the real
output to be parsed by another script if necessary.
