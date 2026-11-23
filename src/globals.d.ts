interface TurboWarpExtension {
  getInfo(): Record<string, unknown>;
}

interface ScratchApi {
  extensions: {
    unsandboxed: boolean;
    register(extension: TurboWarpExtension): void;
  };
  vm?: {runtime: import('./extension.js').TestRuntime};
  BlockType: Record<'HAT' | 'COMMAND', string>;
  ArgumentType: Record<'STRING' | 'NUMBER' | 'BOOLEAN', string>;
  Cast: {
    toString(value: unknown): string;
    toNumber(value: unknown): number;
    toBoolean(value: unknown): boolean;
    compare(left: unknown, right: unknown): number;
  };
  translate: {
    (message: string): string;
    setup(translations: Record<string, Record<string, string>>): void;
  };
}

declare const Scratch: ScratchApi;
