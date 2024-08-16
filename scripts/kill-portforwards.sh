#!/bin/bash
export $(egrep -v '^#' .env | xargs)
WORKING_DIR=`pwd`
GREEN="\e[32m"
RED="\e[31m"
ENDCOLOR="\e[0m"
ENV_FOLDER="$WORKING_DIR/build/scripts"
PORT_FORWARDS_PID="$(ps -ef|grep kubectl | grep port-forward | awk '{print $2}' | tr '\n' ' ')"

if [ -z "$PORT_FORWARDS_PID" ]; then
  printf "\n${GREEN}No port forwards active${ENDCOLOR}\n"
else
  for pid in $PORT_FORWARDS_PID
  do
    printf "Killing process ${RED}$pid${ENDCOLOR}\n"
    kill -9 "$pid"
  done
fi

printf "\n"