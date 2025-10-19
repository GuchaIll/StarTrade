declare module 'three/examples/jsm/postprocessing/EffectComposer' {
  import { WebGLRenderer, Scene, Camera, WebGLRenderTarget } from 'three';
  export class EffectComposer {
    constructor(renderer: WebGLRenderer);
    addPass(pass: any): void;
    render(delta?: number): void;
    setSize(width: number, height: number): void;
    dispose(): void;
  }
  export default EffectComposer;
}

declare module 'three/examples/jsm/postprocessing/RenderPass' {
  import { Scene, Camera } from 'three';
  export class RenderPass {
    constructor(scene: Scene, camera: Camera);
  }
  export default RenderPass;
}

declare module 'three/examples/jsm/postprocessing/UnrealBloomPass' {
  import { Vector2 } from 'three';
  export class UnrealBloomPass {
    constructor(resolution: Vector2, strength?: number, radius?: number, threshold?: number);
  }
  export default UnrealBloomPass;
}
