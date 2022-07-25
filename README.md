# ProseMirror DevTool

## Prerequisites
Create a copy of `.env.template` whose name is `.env.local.<user>` in the root folder. Replace all `__fillin__` entries.

Ensure the correct version of NodeJS (and corresponding NPM version)

```
nvm install --latest-npm
```

Set up dependencies
```
npm install
```

## Dev Environment

Watch (start) web:     `npx env-cmd -f .env.local.<user> npm run start`

There should be no errors or warning seen.
Defaults to `localhost:3000`

### Clean

```
rm -rf node_modules
```
