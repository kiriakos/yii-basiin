#! /bin/env bash

#mergeFiles.sh
fileName=$1
baseDir=$2
pidFile="${baseDir}/incomming/${fileName}.pid"

echo $fileName
echo ${baseDir}
echo $$

#if pid file exists and process exists
if [ -f  "${pidFile}" ] && kill -0 `cat "${pidFile}"` ; then
    echo "$$ mergeFiles ${fileName}: another process is operating on these files"
    exit 1
else
    echo $$ > $pidFile    
fi

#remove all files
rm ${baseDir}/incomming/${fileName}*
rm ${baseDir}/received/${fileName}*

exit 0;
