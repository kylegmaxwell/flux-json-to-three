# To use this repo clone it and install the dependencies.
npm install
npm run build

You can run the test with npm. This uses a stubbed version of three.js.
npm test

Extended Developer Setup

To setup gerrit for code review run

# Update remotes
git remote rename origin bitbucket
git remote add gerrit ssh://${USER}@cr.flux.io:29418/flux-json-to-three

# Add Commit hook
curl https://cr.flux.io/tools/hooks/commit-msg > `git rev-parse --git-dir`/hooks/commit-msg
chmod +x `git rev-parse --git-dir`/hooks/commit-msg

If you are working in Flux genie follow the instructions here:
https://docs.google.com/document/d/1qf6PGJN54buSGFcrcRCZnruY4yTAsNRzoMtEpyE2VFY/edit#heading=h.owqmh4p4ruch

# Testing
You can run tests locally on any computer that has a graphics card and OpenGL drivers.
For other headless systems like cloud machines or CI you will need to use npm run-headless which
relies on xvfb-run. This can be installed on linux using apt-get.
For more information see https://github.com/stackgl/headless-gl#how-can-headless-gl-be-used-on-a-headless-linux-machine
and apt-get these packages.
    - mesa-utils
    - xvfb
    - libgl1-mesa-dri
    - libglapi-mesa
    - libosmesa6
