/**
 * Compact GPU fluid simulation (semi-Lagrangian advection, vorticity confinement, Jacobi pressure solve)
 * running on its own framebuffers. The dye texture has two channels:
 *   R = ink from the cursor (also reveals the alternate portrait)
 *   G = ambient ink (background only)
 */

type FBO = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number; attach: (unit: number) => number };
type DoubleFBO = { read: FBO; write: FBO; swap: () => void; w: number; h: number };

const BASE_VERT = `
precision highp float;
attribute vec2 aPos;
varying vec2 vUv, vL, vR, vT, vB;
uniform vec2 texel;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vL = vUv - vec2(texel.x, 0.0); vR = vUv + vec2(texel.x, 0.0);
  vT = vUv + vec2(0.0, texel.y); vB = vUv - vec2(0.0, texel.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const SPLAT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTarget;
uniform float aspect, radius;
uniform vec3 color;
uniform vec2 point;
void main() {
  vec2 p = vUv - point; p.x *= aspect;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + splat, 1.0);
}`;

const ADVECT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uVelocity, uSource;
uniform vec2 texel;
uniform float dt, dissipation;
void main() {
  vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texel;
  gl_FragColor = texture2D(uSource, coord) / (1.0 + dissipation * dt);
}`;

const DIVERGENCE = `
precision mediump float;
varying vec2 vUv, vL, vR, vT, vB;
uniform sampler2D uVelocity;
void main() {
  float L = texture2D(uVelocity, vL).x, R = texture2D(uVelocity, vR).x;
  float T = texture2D(uVelocity, vT).y, B = texture2D(uVelocity, vB).y;
  vec2 C = texture2D(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x; if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y; if (vB.y < 0.0) B = -C.y;
  gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const CURL = `
precision mediump float;
varying vec2 vUv, vL, vR, vT, vB;
uniform sampler2D uVelocity;
void main() {
  float L = texture2D(uVelocity, vL).y, R = texture2D(uVelocity, vR).y;
  float T = texture2D(uVelocity, vT).x, B = texture2D(uVelocity, vB).x;
  gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`;

const VORTICITY = `
precision highp float;
varying vec2 vUv, vL, vR, vT, vB;
uniform sampler2D uVelocity, uCurl;
uniform float curl, dt;
void main() {
  float L = texture2D(uCurl, vL).x, R = texture2D(uCurl, vR).x;
  float T = texture2D(uCurl, vT).x, B = texture2D(uCurl, vB).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C; force.y *= -1.0;
  vec2 v = texture2D(uVelocity, vUv).xy + force * dt;
  gl_FragColor = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
}`;

const PRESSURE = `
precision mediump float;
varying vec2 vUv, vL, vR, vT, vB;
uniform sampler2D uPressure, uDivergence;
void main() {
  float L = texture2D(uPressure, vL).x, R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x, B = texture2D(uPressure, vB).x;
  float div = texture2D(uDivergence, vUv).x;
  gl_FragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
}`;

const GRADIENT = `
precision mediump float;
varying vec2 vUv, vL, vR, vT, vB;
uniform sampler2D uPressure, uVelocity;
void main() {
  float L = texture2D(uPressure, vL).x, R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x, B = texture2D(uPressure, vB).x;
  vec2 v = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B);
  gl_FragColor = vec4(v, 0.0, 1.0);
}`;

const CLEAR = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float value;
void main() { gl_FragColor = value * texture2D(uTexture, vUv); }`;

type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };

export class FluidSim {
  private gl: WebGLRenderingContext;
  private buf: WebGLBuffer;
  private progs: Record<string, Prog> = {};
  private velocity!: DoubleFBO;
  private dye!: DoubleFBO;
  private pressure!: DoubleFBO;
  private divergence!: FBO;
  private curlFbo!: FBO;
  private type: number;
  private linear: boolean;
  aspect = 1;
  ok = false;

  constructor(gl: WebGLRenderingContext, private simRes = 128, private dyeRes = 512) {
    this.gl = gl;
    const half = gl.getExtension("OES_texture_half_float");
    const halfLinear = gl.getExtension("OES_texture_half_float_linear");
    const flt = gl.getExtension("OES_texture_float");
    const fltLinear = gl.getExtension("OES_texture_float_linear");
    if (half) {
      this.type = half.HALF_FLOAT_OES;
      this.linear = !!halfLinear;
    } else if (flt) {
      this.type = gl.FLOAT;
      this.linear = !!fltLinear;
    } else {
      this.type = 0;
      this.linear = false;
      this.buf = gl.createBuffer()!;
      return;
    }
    this.buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const defs: Record<string, string> = { SPLAT, ADVECT, DIVERGENCE, CURL, VORTICITY, PRESSURE, GRADIENT, CLEAR };
    for (const [k, fs] of Object.entries(defs)) {
      const p = compile(gl, BASE_VERT, fs);
      if (!p) return;
      this.progs[k] = p;
    }
    this.ok = this.resize(1);
  }

  /** (re)allocate buffers for a canvas aspect ratio (width / height). Returns false if render targets fail. */
  resize(aspect: number) {
    this.aspect = aspect;
    const res = (r: number) => (aspect >= 1 ? { w: Math.round(r * aspect), h: r } : { w: r, h: Math.round(r / aspect) });
    const s = res(this.simRes);
    const d = res(this.dyeRes);
    const filter = this.linear ? this.gl.LINEAR : this.gl.NEAREST;
    try {
      this.velocity = this.double(s.w, s.h, filter);
      this.dye = this.double(d.w, d.h, filter);
      this.pressure = this.double(s.w, s.h, this.gl.NEAREST);
      this.divergence = this.fbo(s.w, s.h, this.gl.NEAREST);
      this.curlFbo = this.fbo(s.w, s.h, this.gl.NEAREST);
    } catch {
      return false;
    }
    return true;
  }

  /** The dye texture bound to `unit` (R = cursor ink, G = ambient ink). */
  bindDye(unit: number) {
    return this.dye.read.attach(unit);
  }

  /** x, y in 0..1 (y up), dx, dy velocity in uv/s, channel 0 = cursor ink, 1 = ambient ink */
  splat(x: number, y: number, dx: number, dy: number, channel: 0 | 1, radius = 0.0016, amount = 1) {
    if (!this.ok) return;
    const gl = this.gl;
    const p = this.use("SPLAT");
    gl.uniform1f(p.u.aspect, this.aspect);
    gl.uniform2f(p.u.point, x, y);
    gl.uniform1f(p.u.radius, radius);
    gl.uniform1i(p.u.uTarget, this.velocity.read.attach(0));
    gl.uniform3f(p.u.color, dx, dy, 0);
    this.blit(this.velocity.write);
    this.velocity.swap();
    gl.uniform1i(p.u.uTarget, this.dye.read.attach(0));
    gl.uniform1f(p.u.radius, radius * 1.2);
    gl.uniform3f(p.u.color, channel === 0 ? amount : 0, channel === 1 ? amount : 0, 0);
    this.blit(this.dye.write);
    this.dye.swap();
  }

  step(dt: number, opts: { curl?: number; velocityDissipation?: number; dyeDissipation?: number; pressureIters?: number } = {}) {
    if (!this.ok) return;
    const gl = this.gl;
    const { curl = 28, velocityDissipation = 0.6, dyeDissipation = 1.6, pressureIters = 18 } = opts;
    const vt = [1 / this.velocity.w, 1 / this.velocity.h];
    gl.disable(gl.BLEND);

    let p = this.use("CURL", vt);
    gl.uniform1i(p.u.uVelocity, this.velocity.read.attach(0));
    this.blit(this.curlFbo);

    p = this.use("VORTICITY", vt);
    gl.uniform1i(p.u.uVelocity, this.velocity.read.attach(0));
    gl.uniform1i(p.u.uCurl, this.curlFbo.attach(1));
    gl.uniform1f(p.u.curl, curl);
    gl.uniform1f(p.u.dt, dt);
    this.blit(this.velocity.write);
    this.velocity.swap();

    p = this.use("DIVERGENCE", vt);
    gl.uniform1i(p.u.uVelocity, this.velocity.read.attach(0));
    this.blit(this.divergence);

    p = this.use("CLEAR", vt);
    gl.uniform1i(p.u.uTexture, this.pressure.read.attach(0));
    gl.uniform1f(p.u.value, 0.8);
    this.blit(this.pressure.write);
    this.pressure.swap();

    p = this.use("PRESSURE", vt);
    gl.uniform1i(p.u.uDivergence, this.divergence.attach(0));
    for (let i = 0; i < pressureIters; i++) {
      gl.uniform1i(p.u.uPressure, this.pressure.read.attach(1));
      this.blit(this.pressure.write);
      this.pressure.swap();
    }

    p = this.use("GRADIENT", vt);
    gl.uniform1i(p.u.uPressure, this.pressure.read.attach(0));
    gl.uniform1i(p.u.uVelocity, this.velocity.read.attach(1));
    this.blit(this.velocity.write);
    this.velocity.swap();

    p = this.use("ADVECT", vt);
    gl.uniform1i(p.u.uVelocity, this.velocity.read.attach(0));
    gl.uniform1i(p.u.uSource, this.velocity.read.attach(0));
    gl.uniform1f(p.u.dt, dt);
    gl.uniform1f(p.u.dissipation, velocityDissipation);
    this.blit(this.velocity.write);
    this.velocity.swap();

    gl.uniform1i(p.u.uVelocity, this.velocity.read.attach(0));
    gl.uniform1i(p.u.uSource, this.dye.read.attach(1));
    gl.uniform1f(p.u.dissipation, dyeDissipation);
    this.blit(this.dye.write);
    this.dye.swap();
  }

  // ---- helpers ----
  private use(name: string, texel?: number[]) {
    const gl = this.gl;
    const p = this.progs[name];
    gl.useProgram(p.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    const loc = gl.getAttribLocation(p.p, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    if (texel) gl.uniform2f(p.u.texel, texel[0], texel[1]);
    return p;
  }

  private blit(target: FBO) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    gl.viewport(0, 0, target.w, target.h);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private fbo(w: number, h: number, filter: number): FBO {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, this.type, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("fbo");
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {
      tex,
      fbo,
      w,
      h,
      attach(unit: number) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        return unit;
      },
    };
  }

  private double(w: number, h: number, filter: number): DoubleFBO {
    let a = this.fbo(w, h, filter);
    let b = this.fbo(w, h, filter);
    return {
      w,
      h,
      get read() {
        return a;
      },
      get write() {
        return b;
      },
      swap() {
        const t = a;
        a = b;
        b = t;
      },
    } as DoubleFBO;
  }
}

function compile(gl: WebGLRenderingContext, vs: string, fs: string): Prog | null {
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const v = sh(gl.VERTEX_SHADER, vs);
  const f = sh(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram()!;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
  const u: Record<string, WebGLUniformLocation | null> = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i)!;
    u[info.name] = gl.getUniformLocation(p, info.name);
  }
  return { p, u };
}
