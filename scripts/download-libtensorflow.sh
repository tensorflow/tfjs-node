#!/bin/sh

CPU_DARWIN="http://ci.tensorflow.org/view/Nightly/job/nightly-libtensorflow/TYPE=mac-slave/lastSuccessfulBuild/artifact/lib_package/libtensorflow-cpu-darwin-x86_64.tar.gz"
GPU_LINUX="http://ci.tensorflow.org/view/Nightly/job/nightly-libtensorflow/TYPE=gpu-linux/lastSuccessfulBuild/artifact/lib_package/libtensorflow-gpu-linux-x86_64.tar.gz"
CPU_LINUX="http://ci.tensorflow.org/view/Nightly/job/nightly-libtensorflow/TYPE=cpu-slave/lastSuccessfulBuild/artifact/lib_package/libtensorflow-cpu-linux-x86_64.tar.gz"

TARGET_DIRECTORY="deps/tensorflow/"

curl -L \
  $CPU_LINUX |
  tar -C $TARGET_DIRECTORY -xz
