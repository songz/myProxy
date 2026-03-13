#!/bin/bash

# Helper functions
command_exists() {
	command -v "$@" > /dev/null 2>&1
}

user_exists() {
  id "$1" &> /dev/null
}

if ! command_exists node; then
  echo "Installing node"
  sudo apt-get install curl
  curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command_exists pm2; then
  echo "Installing pm2"
  npm install pm2 -g
fi

npm install

if [ ! -d "./acme.sh" ] ; then
  git clone https://github.com/Neilpang/acme.sh.git
  cd ./acme.sh
  ./acme.sh --install
  ./acme.sh --upgrade --auto-upgrade
  cd ../
fi

npm run build

if [ ! -f "./data.db" ] ; then
  touch data.db
fi