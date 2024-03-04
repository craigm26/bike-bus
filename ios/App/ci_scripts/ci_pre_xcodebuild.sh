#!/bin/bash -x

gem install bundler
bundle install
bundle exec pod install



export PATH="$PATH:/usr/bin/gem"
which pod
pod install

echo $GEM_PATH