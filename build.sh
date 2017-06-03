#! /bin/bash

export NODE_PATH=/usr/local/lib/node_modules
cwd=$(pwd)
script_dir=$(cd `dirname $0`; pwd)
node ${script_dir}/lib/index.js $@
