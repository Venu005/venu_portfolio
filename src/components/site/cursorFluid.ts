/**
 * Low-resolution, velocity-only "stable fluids" simulation driven by the cursor.
 * The resulting velocity field is used as a hard-edged mask: wherever the fluid is moving,
 * the hero switches palette and reveals the alternate portrait.
 *
 * Pipeline per step: BFECC advection (with dissipation) → additive cursor force →
 * divergence → a few Jacobi pressure iterations → pressure-gradient subtraction.
 */

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer };

const VERT = `
precision highp float;
attribute vec2 aPos;
varying vec2 uv;
void main() { uv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FORCE_VERT = `
precision highp float;
attribute vec2 aPos;
uniform vec2 center;
uniform vec2 size;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos * size + center, 0.0, 1.0); }`;

const ADVECT = `
precision highp float;
uniform sampler2D velocity;
uniform float dt, dissipation;
uniform vec2 ratio;
varying vec2 uv;
void main() {
  vec2 v0 = texture2D(velocity, uv).xy;
  vec2 back = uv - v0 * dt * ratio;
  vec2 v1 = texture2D(velocity, back).xy;
  vec2 fwd = back + v1 * dt * ratio;
  vec2 corrected = uv - (fwd - uv) * 0.5;
  vec2 v2 = texture2D(velocity, corrected).xy;
  vec2 back2 = corrected - v2 * dt * ratio;
  gl_FragColor = vec4(texture2D(velocity, back2).xy * dissipation, 0.0, 1.0);
}`;

const FORCE = `
precision highp float;
uniform vec2 force;
varying vec2 vUv;
void main() {
  float d = 1.0 - min(length((vUv - 0.5) * 2.0), 1.0);
  gl_FragColor = vec4(force * d * d, 0.0, 1.0);
}`;

const DIVERGENCE = `
precision highp float;
uniform sampler2D velocity;
uniform vec2 px;
uniform float dt;
varying vec2 uv;
void main() {
  float x0 = texture2D(velocity, uv - vec2(px.x, 0.0)).x;
  float x1 = texture2D(velocity, uv + vec2(px.x, 0.0)).x;
  float y0 = texture2D(velocity, uv - vec2(0.0, px.y)).y;
  float y1 = texture2D(velocity, uv + vec2(0.0, px.y)).y;
  gl_FragColor = vec4((x1 - x0 + y1 - y0) / 2.0 / dt);
}`;

const POISSON = `
precision highp float;
uniform sampler2D pressure, divergence;
uniform vec2 px;
varying vec2 uv;
void main() {
  float p0 = texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r;
  float p1 = texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r;
  float p2 = texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r;
  float p3 = texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r;
  gl_FragColor = vec4((p0 + p1 + p2 + p3) / 5.0 - texture2D(divergence, uv).r);
}`;

const GRADIENT = `
precision highp float;
uniform sampler2D pressure, velocity;
uniform vec2 px;
uniform float dt;
varying vec2 uv;
void main() {
  float p0 = texture2D(pressure, uv + vec2(px.x, 0.0)).r;
  float p1 = texture2D(pressure, uv - vec2(px.x, 0.0)).r;
  float p2 = texture2D(pressure, uv + vec2(0.0, px.y)).r;
  float p3 = texture2D(pressure, uv - vec2(0.0, px.y)).r;
  vec2 v = texture2D(velocity, uv).xy - vec2(p0 - p1, p2 - p3) * 0.5 * dt;
  gl_FragColor = vec4(v, 0.0, 1.0);
}`;

type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };

export class CursorFluid {
  ok = false;
  private gl: WebGLRenderingContext;
  private buf!: WebGLBuffer;
  private type = 0;
  private filter = 0;
  private w = 1;
  private h = 1;
  private px: [number, number] = [1, 1];
  private vel0!: Target;
  private vel1!: Target;
  private div!: Target;
  private p0!: Target;
  private p1!: Target;
  private progs: Record<string, Prog> = {};

  // tuning (screen-size independent)
  readonly dt = 0.014;
  readonly dissipation = 0.96;
  readonly mouseForce = 50;
  readonly cursorSize = 18; // in cells
  readonly iterations = 4;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    const half = gl.getExtension("OES_texture_half_float");
    const halfLin = gl.getExtension("OES_texture_half_float_linear");
    const flt = gl.getExtension("OES_texture_float");
    const fltLin = gl.getExtension("OES_texture_float_linear");
    // iOS is happiest with half floats; elsewhere prefer full floats when linear filtering is available
    if (flt && fltLin && !/(iPad|iPhone|iPod)/.test(navigator.userAgent)) {
      this.type = gl.FLOAT;
      this.filter = gl.LINEAR;
    } else if (half) {
      this.type = half.HALF_FLOAT_OES;
      this.filter = halfLin ? gl.LINEAR : gl.NEAREST;
    } else return;

    this.buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const defs: [string, string, string][] = [
      ["advect", VERT, ADVECT],
      ["force", FORCE_VERT, FORCE],
      ["div", VERT, DIVERGENCE],
      ["poisson", VERT, POISSON],
      ["grad", VERT, GRADIENT],
    ];
    for (const [k, vs, fs] of defs) {
      const p = compile(gl, vs, fs);
      if (!p) return;
      this.progs[k] = p;
    }
    this.ok = true;
  }

  /** viewport size in CSS px */
  resize(width: number, height: number) {
    if (!this.ok) return;
    this.w = Math.max(8, Math.round(width * 0.1));
    this.h = Math.max(8, Math.round(height * 0.1));
    // cell scale normalised to a 1100px-wide reference, so the cursor size feels the same on every screen
    const s = this.w / 110;
    this.px = [s / this.w, s / this.h];
    try {
      this.vel0 = this.target();
      this.vel1 = this.target();
      this.div = this.target();
      this.p0 = this.target();
      this.p1 = this.target();
    } catch {
      this.ok = false;
    }
  }

  /** Velocity texture bound to `unit`. */
  bind(unit: number) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, this.vel0.tex);
    return unit;
  }

  /**
   * One simulation step.
   * @param cx,cy cursor in normalised device coords (-1..1, y up)
   * @param dx,dy cursor movement since the last step, in the same units
   */
  step(cx: number, cy: number, dx: number, dy: number) {
    if (!this.ok) return;
    const gl = this.gl;
    gl.disable(gl.BLEND);
    gl.viewport(0, 0, this.w, this.h);
    const ratioMax = Math.max(this.w, this.h);

    // advection → vel1
    let p = this.use("advect");
    this.tex(0, this.vel0.tex);
    gl.uniform1i(p.u.velocity, 0);
    gl.uniform1f(p.u.dt, this.dt);
    gl.uniform1f(p.u.dissipation, this.dissipation);
    gl.uniform2f(p.u.ratio, ratioMax / this.w, ratioMax / this.h);
    this.draw(this.vel1);

    // cursor force, additively into vel1
    const fx = (dx / 2) * this.mouseForce;
    const fy = (dy / 2) * this.mouseForce;
    if (fx !== 0 || fy !== 0) {
      p = this.use("force");
      const sx = this.cursorSize * this.px[0];
      const sy = this.cursorSize * this.px[1];
      const ccx = Math.min(Math.max(cx, -1 + sx + this.px[0] * 2), 1 - sx - this.px[0] * 2);
      const ccy = Math.min(Math.max(cy, -1 + sy + this.px[1] * 2), 1 - sy - this.px[1] * 2);
      gl.uniform2f(p.u.center, ccx, ccy);
      gl.uniform2f(p.u.size, sx, sy);
      gl.uniform2f(p.u.force, fx, fy);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      this.draw(this.vel1, false);
      gl.disable(gl.BLEND);
    }

    // divergence
    p = this.use("div");
    this.tex(0, this.vel1.tex);
    gl.uniform1i(p.u.velocity, 0);
    gl.uniform2f(p.u.px, this.px[0], this.px[1]);
    gl.uniform1f(p.u.dt, this.dt);
    this.draw(this.div);

    // pressure (Jacobi)
    p = this.use("poisson");
    gl.uniform2f(p.u.px, this.px[0], this.px[1]);
    this.tex(1, this.div.tex);
    gl.uniform1i(p.u.divergence, 1);
    let src = this.p0;
    let dst = this.p1;
    for (let i = 0; i < this.iterations; i++) {
      this.tex(0, src.tex);
      gl.uniform1i(p.u.pressure, 0);
      this.draw(dst);
      const t = src;
      src = dst;
      dst = t;
    }

    // subtract gradient → vel0
    p = this.use("grad");
    this.tex(0, src.tex);
    gl.uniform1i(p.u.pressure, 0);
    this.tex(1, this.vel1.tex);
    gl.uniform1i(p.u.velocity, 1);
    gl.uniform2f(p.u.px, this.px[0], this.px[1]);
    gl.uniform1f(p.u.dt, this.dt);
    this.draw(this.vel0);
  }

  // ---- helpers ----
  private use(name: string) {
    const gl = this.gl;
    const p = this.progs[name];
    gl.useProgram(p.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    const loc = gl.getAttribLocation(p.p, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    return p;
  }
  private tex(unit: number, t: WebGLTexture) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, t);
  }
  private draw(t: Target, clear = true) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    if (clear) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  private target(): Target {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.w, this.h, 0, gl.RGBA, this.type, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("fbo");
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fbo };
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
