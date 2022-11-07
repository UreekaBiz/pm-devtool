# ProseMirror DevTool

[![Total alerts](https://img.shields.io/lgtm/alerts/g/UreekaBiz/pm-devtool.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/UreekaBiz/pm-devtool/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/UreekaBiz/pm-devtool.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/UreekaBiz/pm-devtool/context:javascript)

## Prerequisites
Create a copy of `.env.template` whose name is `.env.local.<user>` in the root folder. Replace all `__fillin__` entries.

Ensure the correct version of NodeJS (and corresponding NPM version)

```bash
nvm install --latest-npm
```

Set up dependencies
```bash
npm install
```

## Dev Environment

Watch (start) web:     `npx env-cmd -f .env.local.<user> npm run start`

There should be no errors or warning seen.
Defaults to `localhost:3000`

## Testing

Run tests:             `npm test`

### Clean

```bash
rm -rf node_modules
```

#### Super Clean

```bash
rm -f package-lock.json
```
