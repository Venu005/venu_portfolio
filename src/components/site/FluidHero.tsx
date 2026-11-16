"use client";
import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { CursorFluid } from "./cursorFluid";

export type HeadBox = { cx: number; cy: number; rx: number; ry: number };

type Props = {
  src: string; // background-removed portrait
  altSrc?: string | null; // same framing, alternate look (revealed by the ink)
  imageAspect: number;
  head: HeadBox;
  /** 0 → full hero; ~0.3 → portrait shrunk into a wide frame; ~0.5 → smaller, darkened frame */
  progress?: MotionValue<number>;
  className?: string;
  onAlt?: (on: boolean) => void;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
type R = { x: number; y: number; w: number; h: number };
const lerpR = (a: R, b: R, t: number): R => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });

/**
 * One canvas for the whole hero → message scene.
 *  - Hero: a drifting contour-line field behind a big still portrait. Moving the cursor stirs a low-res
 *    velocity-only fluid; wherever the fluid moves, the background flips to a grey banded palette and the
 *    visor portrait shows. When idle, a virtual cursor sweeps a figure-eight so the effect plays on its own.
 *  - Scroll: the very same portrait shrinks into a framed photo, then darkens for the signature moment.
 */
export default function FluidHero({ src, altSrc, imageAspect, head, progress, className, onAlt }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const onAltRef = useRef(onAlt);
  onAltRef.current = onAlt;

  useEffect(() => {
    const el = canvas.current!;
    const wrap = host.current!;
    const gl = el.getContext("webgl", { premultipliedAlpha: false, alpha: true, antialias: false });
    if (!gl) {
      wrap.dataset.fallback = "1";
      return;
    }
    const derivatives = !!gl.getExtension("OES_standard_derivatives");
    const prog = createProgram(gl, VERT, (derivatives ? "#extension GL_OES_standard_derivatives : enable\n#define HAS_DERIV 1\n" : "") + FRAG);
    if (!prog) {
      wrap.dataset.fallback = "1";
      return;
    }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const U = {
      res: u("uRes"), rect: u("uRect"), frame: u("uFrame"), frameCol: u("uFrameCol"), frameA: u("uFrameA"),
      dark: u("uDark"), ink: u("uInk"), bgA: u("uBgA"), time: u("uTime"), mouse: u("uMouse"), pace: u("uPace"),
      hasAlt: u("uHasAlt"), hasVel: u("uHasVel"), base: u("uBase"), alt: u("uAlt"), vel: u("uVel"),
    };

    const fluid = new CursorFluid(gl);

    let baseTex: WebGLTexture | null = null;
    let altTex: WebGLTexture | null = null;
    loadTexture(gl, src).then((t) => (baseTex = t)).catch(() => (wrap.dataset.fallback = "1"));
    if (altSrc) loadTexture(gl, altSrc).then((t) => (altTex = t)).catch(() => {});

    let W = 1, H = 1, dpr = 1;
    let heroRect: R = { x: 0, y: 0, w: 1, h: 1 };
    let frameA: R = heroRect, frameB: R = heroRect, portA: R = heroRect, portB: R = heroRect;
    const portraitIn = (f: R): R => {
      const h = f.h * 1.32;
      const w = h * imageAspect;
      return { x: f.x + (f.w - w) / 2, y: f.y - f.h * 0.06, w, h };
    };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const r = wrap.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      el.width = Math.round(W * dpr);
      el.height = Math.round(H * dpr);
      const ph = Math.min(H * 0.97, (W * 1.1) / imageAspect);
      heroRect = { x: (W - ph * imageAspect) / 2, y: H - ph, w: ph * imageAspect, h: ph };
      const aw = Math.min(W * (W < 640 ? 0.9 : 0.66), 1100);
      const ah = aw / 1.85;
      frameA = { x: (W - aw) / 2, y: (H - ah) / 2 + H * 0.02, w: aw, h: ah };
      const bw = Math.min(W * (W < 640 ? 0.7 : 0.34), 640);
      const bh = bw / 1.55;
      frameB = { x: (W - bw) / 2, y: (H - bh) / 2 + H * 0.02, w: bw, h: bh };
      portA = portraitIn(frameA);
      portB = portraitIn(frameB);
      fluid.resize(W, H);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- cursor state (normalised device coords, -1..1, y up) ----
    const mouse = { x: 0, y: 0 };
    const eased = { x: 0, y: 0, pace: 0 };
    let moving = false;
    let moveTimer = 0;
    let idleStart = 0;
    const firstIdle = window.setTimeout(() => {
      moving = false;
      idleStart = performance.now();
    }, 2500);
    let overHeadUntil = 0;
    let portNow: R = heroRect;
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      moving = true;
      clearTimeout(firstIdle);
      clearTimeout(moveTimer);
      moveTimer = window.setTimeout(() => {
        moving = false;
        idleStart = performance.now();
      }, 2000);
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const hx = portNow.x + head.cx * portNow.w;
      const hy = portNow.y + head.cy * portNow.h;
      const ex = (x - hx) / (head.rx * portNow.w * 1.4);
      const ey = (y - hy) / (head.ry * portNow.h * 1.3);
      if (ex * ex + ey * ey < 1) overHeadUntil = performance.now() + 900;
    };
    window.addEventListener("pointermove", onMove);
    let visible = true;
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(wrap);

    // idle cursor: a figure-eight sweep across the screen (2.5s out, 1.5s pause, 2.5s back, then 3s rest)
    const ease = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;
    const idleCursor = (t: number) => {
      const c = t % 9.5;
      let px = 0, py = 0;
      if (c < 2.5) {
        py = c / 2.5;
        px = ease(c / 2.5);
      } else if (c < 4) {
        px = py = 1;
      } else if (c < 6.5) {
        py = 1 - (c - 4) / 2.5;
        px = 1 - ease((c - 4) / 2.5);
      }
      return { x: -Math.cos(px * Math.PI * 4) * 0.75, y: Math.cos(py * Math.PI) * 0.5 };
    };

    const start = performance.now();
    let last = { x: 0, y: 0 };
    let acc = 0;
    let prevT = start;
    let altOn = false;
    let raf = 0;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!baseTex || !visible) return;
      const now = performance.now();
      const t = (now - start) / 1000;
      const p = progress?.get() ?? 0;

      const k1 = smooth(0, 0.3, p);
      const k2 = smooth(0.3, 0.5, p);
      const fullscreen: R = { x: 0, y: 0, w: W, h: H };
      const frameR = k2 > 0 ? lerpR(frameA, frameB, k2) : lerpR(fullscreen, frameA, k1);
      const portR = k2 > 0 ? lerpR(portA, portB, k2) : lerpR(heroRect, portA, k1);
      portNow = portR;
      const inkK = 1 - smooth(0, 0.12, p);

      // ---- simulation at a fixed 60 steps/s ----
      acc += Math.min(0.1, (now - prevT) / 1000);
      prevT = now;
      let cur = moving || reduce ? mouse : idleCursor((now - idleStart) / 1000);
      if (!moving && !reduce && idleStart === 0) cur = mouse;
      while (acc >= 1 / 60) {
        acc -= 1 / 60;
        const dx = cur.x - last.x;
        const dy = cur.y - last.y;
        last = { x: cur.x, y: cur.y };
        if (fluid.ok && inkK > 0.01) fluid.step(cur.x, cur.y, dx, dy);
        // eased cursor + pace for the contour bend
        eased.x += (mouse.x - eased.x) * 0.025;
        eased.y += (mouse.y - eased.y) * 0.025;
        eased.pace += (Math.min(1, Math.hypot(dx, dy) * 12) - eased.pace) * 0.01;
      }
      // idle sweep passing over the head also counts as "visor on"
      const hx = ((portR.x + head.cx * portR.w) / W) * 2 - 1;
      const hy = -(((portR.y + head.cy * portR.h) / H) * 2 - 1);
      const overHead = now < overHeadUntil || (!moving && Math.abs(cur.x - hx) < 0.25 && Math.abs(cur.y - hy) < 0.4);

      // ---- composite ----
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, el.width, el.height);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      const loc = gl.getAttribLocation(prog, "aPos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, baseTex);
      gl.uniform1i(U.base, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, altTex ?? baseTex);
      gl.uniform1i(U.alt, 1);
      gl.uniform1i(U.hasAlt, altTex ? 1 : 0);
      if (fluid.ok) gl.uniform1i(U.vel, fluid.bind(2));
      gl.uniform1i(U.hasVel, fluid.ok ? 1 : 0);

      const toGL = (q: R) => [q.x * dpr, (H - q.y - q.h) * dpr, q.w * dpr, q.h * dpr] as const;
      gl.uniform2f(U.res, el.width, el.height);
      gl.uniform4f(U.rect, ...toGL(portR));
      gl.uniform4f(U.frame, ...toGL(frameR));
      const dk = smooth(0.32, 0.5, p);
      const fc = [lerp(lerp(0.973, 0.74, k1), 0.29, dk), lerp(lerp(0.973, 0.74, k1), 0.31, dk), lerp(lerp(0.953, 0.72, k1), 0.27, dk)];
      gl.uniform3f(U.frameCol, fc[0], fc[1], fc[2]);
      gl.uniform1f(U.frameA, k1);
      gl.uniform1f(U.dark, dk);
      gl.uniform1f(U.ink, inkK);
      gl.uniform1f(U.bgA, 1 - smooth(0, 0.28, p));
      gl.uniform1f(U.time, t);
      gl.uniform2f(U.mouse, eased.x, eased.y);
      gl.uniform1f(U.pace, eased.pace * 4);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      const on = overHead && inkK > 0.5;
      if (on !== altOn) {
        altOn = on;
        onAltRef.current?.(on);
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(firstIdle);
      clearTimeout(moveTimer);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [src, altSrc, imageAspect, head.cx, head.cy, head.rx, head.ry, progress]);

  return (
    <div ref={host} className={cn("relative", className)}>
      <canvas ref={canvas} role="img" aria-label="Portrait of Venusai Yalamanchili" className="absolute inset-0 h-full w-full" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 hidden h-[95%] -translate-x-1/2 object-contain [[data-fallback='1']_&]:block"
      />
    </div>
  );
}

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform vec4 uRect;
uniform vec4 uFrame;
uniform vec3 uFrameCol;
uniform float uFrameA, uDark, uInk, uBgA, uTime, uPace;
uniform vec2 uMouse;
uniform sampler2D uBase, uAlt, uVel;
uniform bool uHasAlt, uHasVel;

// palette
const vec3 BG = vec3(0.973, 0.973, 0.953);        // #F8F8F3
const vec3 LINE = vec3(0.796, 0.796, 0.725);      // #CBCBB9
const vec3 INK_A = vec3(0.910, 0.910, 0.875);     // #E8E8DF
const vec3 INK_B = vec3(0.812, 0.824, 0.773);     // #CFD2C5

// 3D simplex noise (Ashima / Stefan Gustavson, MIT)
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

vec4 img(sampler2D t, vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(t, uv);
}

void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 vUv = p / uRes;
  float aspect = uRes.x / uRes.y;

  // ---- drifting contour field ----
  vec2 uv = vUv; uv.x *= aspect;
  vec2 m = uMouse * 0.5 + 0.5; m.x *= aspect;
  float cursor = clamp((1.0 - distance(m, uv) * 3.0) * uPace, -0.75, 1.0);
  float distort = 0.5 + snoise(vec3(uv, uTime * 0.01)) * 0.5;
  float v = (0.5 + snoise(vec3(uv + cursor * 0.15 + distort * 0.5, uTime * 0.1)) * 0.5) * 3.0;
  float band = step(0.5, fract(v));
  float edge = 0.0;
#ifdef HAS_DERIV
  float e2 = v * 2.0;
  float fw = fwidth(e2);
  edge = 1.0 - smoothstep(0.0, fw * 1.3, abs(fract(e2 + 0.5) - 0.5));
#endif
  vec3 bg = mix(BG, LINE, edge);
  vec3 inkBg = mix(mix(INK_A, INK_B, band), INK_A, edge);

  // ---- fluid mask (hard edged) ----
  float fx = 0.0;
  if (uHasVel) {
    vec2 vel = texture2D(uVel, vec2(0.025 + vUv.x * 0.95, 0.025 + vUv.y * 0.95)).xy;
    float len = length(vel);
    float r = mix(1.0, vel.x * 0.5 + 0.5, len);
    fx = step(0.1, 1.0 - r) * uInk;
  }
  bg = mix(bg, inkBg, fx);
  vec4 col = vec4(bg, uBgA);

  // ---- frame + portrait ----
  bool inFrame = p.x >= uFrame.x && p.x <= uFrame.x + uFrame.z && p.y >= uFrame.y && p.y <= uFrame.y + uFrame.w;
  if (inFrame && uFrameA > 0.0) {
    col.rgb = mix(col.rgb, uFrameCol, uFrameA);
    col.a = max(col.a, uFrameA);
  }
  vec2 puv = (p - uRect.xy) / uRect.zw;
  vec4 base = img(uBase, puv);
  vec4 alt = uHasAlt ? img(uAlt, puv) : base;
  vec4 face = mix(base, alt, fx * alt.a);
  face.a *= smoothstep(0.0, 0.015, puv.y);
  if (!inFrame) face.a = 0.0;
  float g = dot(face.rgb, vec3(0.299, 0.587, 0.114));
  face.rgb = mix(face.rgb, vec3(g) * vec3(0.78, 0.8, 0.72), uDark * 0.9);

  col.rgb = mix(col.rgb, face.rgb, face.a);
  col.a = max(col.a, face.a);
  gl_FragColor = col;
}`;

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string) {
  const sh = (type: number, x: string) => {
    const o = gl.createShader(type)!;
    gl.shaderSource(o, x);
    gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(o));
      return null;
    }
    return o;
  };
  const v = sh(gl.VERTEX_SHADER, vs);
  const f = sh(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const pr = gl.createProgram()!;
  gl.attachShader(pr, v);
  gl.attachShader(pr, f);
  gl.linkProgram(pr);
  return gl.getProgramParameter(pr, gl.LINK_STATUS) ? pr : null;
}

function loadTexture(gl: WebGLRenderingContext, url: string) {
  return new Promise<WebGLTexture>((resolve, reject) => {
    const im = new Image();
    im.decoding = "async";
    im.onload = () => {
      const tex = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      resolve(tex);
    };
    im.onerror = reject;
    im.src = url;
  });
}
