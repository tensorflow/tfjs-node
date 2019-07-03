# TensorFlow.js Node.js bindings development.

The @tensorflow/tfjs-node repo support npm package @tensorflow/tfjs-node and @tensorflow/tfjs-node-gpu on Windows/Mac/Linux. This guide lists commands to development the tfjs-node package.

## Install

#### Install dependencies and addon module

```sh
yarn
```

This command installs all dependencies and devDependencies listed in package.json. It also download the download the TensorFlow C library and native node addon.

#### Compile native addon from source binary

```sh
yarn install-from-source
```

This command clear local binary and addon resources, then download the TensorFlow C library and compile native node addon from source binary.

#### Switch to developing GPU

```sh
yarn enable-gpu
```

This command clear local binary and addon resources, then download then TensorFlow C library for GPU and compile native node addon from source binary.

## Build and test

#### Compile javascript files from typescript

```sh
yarn build
```

#### Publish local to test this package in another repo

```sh
yarn publish-local
```

This command pack the tfjs-node package and publish to other repos through yalc. Note this repo must have been installed through yalc in other repos.

#### Run tests

```sh
yarn test
```

## Prepare and publish

#### Build and upload node addon to Google Cloud Platform

```sh
yarn build-addon upload
```

This command compile a new node addon, then compress and upload it to GCP

#### Build NPM package

```sh
yarn build-npm
```

This command clear existing resources and compile new node addon from source, then pack a npm package. NOTE: this command does not update the node addon in GCP.

#### Build NPM package and upload node addon

```sh
yarn build-npm upload
```

This command combines the above two commands

#### Publish NPM package

```sh
yarn publish-npm
```

This command compile a new node addon, upload it to GCP, then build and publish a new npm package. Please read instruction in [publish-npm.sh](./scripts/publish.sh) before publishing.

#### Build and upload node addon in Windows

Please see instructions in [build-and-upload-addon.sh](./scripts/build-and-upload-addon.sh) to build and upload node addon in Windows.
