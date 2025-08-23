import fs from 'fs';
import path from 'path';
import type { VelundComponentDescriptor } from '@velund/core';

export function generatePrepareRegistry(
  outDir: string,
  components: VelundComponentDescriptor<any, any>[]
) {
  fs.mkdirSync(outDir, { recursive: true });

  const registryPy = `from typing import Any, Callable, Dict, Optional

# Тип функции подготовки: принимает props, возвращает context (синхронно или асинхронно)
PrepareFn = Callable[[Any], Any]

_registry: Dict[str, PrepareFn] = {}

def register(name: str, fn: PrepareFn) -> None:
    _registry[name] = fn

def get(name: str) -> Optional[PrepareFn]:
    return _registry.get(name)
`;

  fs.writeFileSync(
    path.join(outDir, 'PrepareRegistry.py'),
    registryPy,
    'utf-8'
  );
}
