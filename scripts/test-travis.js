#!/usr/bin/env node
/**
 * @license
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

const fetch = require('node-fetch');
const {exec} = require('./test-util');
const shell = require('shelljs');

process.on('unhandledRejection', e => {
  throw e;
});

exec(
    'git clone --depth=1 --single-branch ' +
    'https://github.com/tensorflow/tfjs-node clone');
const commitSha = process.env.COMMIT_SHA;

console.log('got commit', commitSha);

shell.cd('clone');
console.log('current working dir', shell.pwd());
exec(`git fetch origin ${commitSha}`);
exec(`git checkout -b ${commitSha} ${commitSha}`);
exec(`git push --set-upstream origin ${commitSha}`);


// const API_URL = 'https://api.travis-ci.org/repo/tensorflow%2Ftfjs-node';
// const SUBMIT_BUILD_URL = `${API_URL}/requests`;
// const GET_BUILD_INFO_URL = `${API_URL}/request`;
// const HEADERS = {
//   'Content-Type': 'application/json',
//   'Accept': 'application/json',
//   'Travis-API-Version': '3',
//   'Authorization': 'token INKvoqirQIBD805HgU3Gew'
// };

// async function submitBuild() {
//   const body = {
//     request: {
//       branch: process.env.BRANCH_NAME,
//     }
//   };
//   console.log('sending body', body);
//   const response = await fetch(SUBMIT_BUILD_URL, {
//     method: 'post',
//     body: JSON.stringify(body),
//     headers: HEADERS,
//   });
//   return response.json();
// }

// async function getBuildInfo(requestId) {
//   console.log('Getting request info for', requestId);
//   const response = await fetch(`${GET_BUILD_INFO_URL}/${requestId}`, {
//     method: 'get',
//     headers: HEADERS,
//   });
//   return response.json();
// }

// async function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

// async function run() {
//   const requestInfo = await submitBuild();
//   console.log(requestInfo);
//   console.log('=======================================');
//   await sleep(30000);
//   const buildInfo = await getBuildInfo(requestInfo.request.id);
//   console.log(buildInfo);
//   const buildId = buildInfo.builds[0].id;
//   const slug = buildInfo.repository.slug;
//   const buildUrl = `https://travis-ci.org/${slug}/builds/${buildId}`;
//   console.log(`See build at: ${buildUrl}`);
// }

// run();
