#!/bin/bash

# Runs workflows locally using https://github.com/nektos/act

npm install
npm run build

act \
--platform ubuntu-latest=nektos/act-environments-ubuntu:18.04 \
--platform ubuntu-18.04=nektos/act-environments-ubuntu:18.04 \
"$@"
