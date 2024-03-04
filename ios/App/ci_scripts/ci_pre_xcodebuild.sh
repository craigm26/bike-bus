#!/bin/bash -x
env
export PATH="$PATH:/usr/bin/gem"
which pod
pod install

ls /usr/local/bin
ls /usr/bin