# @neupgroup/mapper

Core library for Neup.Mapper. Provides simple schema registration utilities that can be expanded over time.

## Install

```bash
npm install @neupgroup/mapper
```

## Usage

```ts
import Mapper from '@neupgroup/mapper';

const mapper = new Mapper();

mapper.register({
  name: 'User',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'email', type: 'string' },
    { name: 'createdAt', type: 'date' },
  ],
});

console.log(mapper.list());
```

## Build

```bash
npx tsc -p ./tsconfig.json
```

Outputs are generated to `dist/` with type declarations.

