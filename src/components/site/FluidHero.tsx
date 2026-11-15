"use client";
import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

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

const MAX = 56;
type Blob = { x: number; y: number; vx: number; vy: number; r: number; age: number; life: number; ambient?: number; alt?: boolean };

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
 *  - Hero: big still portrait; small, quick liquid ink blobs trail the cursor (grey on the background,
 *    the visor wherever they cross the head) and a few drift around the edges.
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
    const prog = gl && createProgram(gl, VERT, FRAG);
    if (!gl || !prog) {
      wrap.dataset.fallback = "1";
      return;
    }
    gl.useProgram(prog);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const U = {
      res: u("uRes"),
      rect: u("uRect"),
      frame: u("uFrame"),
      frameCol: u("uFrameCol"),
      frameA: u("uFrameA"),
      dark: u("uDark"),
      ink: u("uInk"),
      blobs: u("uBlobs"),
      count: u("uCount"),
      time: u("uTime"),
      hasAlt: u("uHasAlt"),
    };
    gl.uniform1i(u("uBase"), 0);
    gl.uniform1i(u("uAlt"), 1);
    gl.uniform1i(U.hasAlt, 0);

    let ready = false;
    loadTexture(gl, src, 0).then(() => (ready = true)).catch(() => (wrap.dataset.fallback = "1"));
    if (altSrc) loadTexture(gl, altSrc, 1).then(() => gl.uniform1i(U.hasAlt, 1)).catch(() => {});

    let W = 1, H = 1, dpr = 1;
    let heroRect: R = { x: 0, y: 0, w: 1, h: 1 };
    let frameA: R = heroRect, frameB: R = heroRect, portA: R = heroRect, portB: R = heroRect;
    const portraitIn = (f: R): R => {
      // head fills the frame: portrait taller than the frame, cropped at the shoulders
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
      gl.viewport(0, 0, el.width, el.height);
      const ph = Math.min(H * 0.97, (W * 0.92) / imageAspect);
      heroRect = { x: (W - ph * imageAspect) / 2, y: H - ph, w: ph * imageAspect, h: ph };
      const aw = Math.min(W * (W < 640 ? 0.9 : 0.66), 1100);
      const ah = aw / 1.85;
      frameA = { x: (W - aw) / 2, y: (H - ah) / 2 + H * 0.02, w: aw, h: ah };
      const bw = Math.min(W * (W < 640 ? 0.7 : 0.34), 640);
      const bh = bw / 1.55;
      frameB = { x: (W - bw) / 2, y: (H - bh) / 2 + H * 0.02, w: bw, h: bh };
      portA = portraitIn(frameA);
      portB = portraitIn(frameB);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const blobs: Blob[] = [];
    const sc = () => Math.min(W, H) / 900;
    // ambient blobs live in the margins left and right of the portrait
    for (let i = 0; i < 6; i++) blobs.push({ x: 0, y: 0, vx: 0, vy: 0, r: 0, age: 0, life: Infinity, ambient: i + 1 });

    let last: { x: number; y: number; t: number } | null = null;
    let lastActive = -1e9;
    const spawn = (x: number, y: number, vx: number, vy: number, energy: number) => {
      const s = sc();
      blobs.push({ x, y, vx, vy, r: (16 + Math.random() * 20) * s * (0.75 + energy * 0.6), age: 0, life: 0.65 + Math.random() * 0.55 });
      let trail = 0;
      for (const b of blobs) if (!b.ambient) trail++;
      while (trail > MAX - 8) {
        const i = blobs.findIndex((b) => !b.ambient);
        blobs.splice(i, 1);
        trail--;
      }
    };
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const t = performance.now();
      if (y < 0 || y > H) {
        last = null;
        return;
      }
      lastActive = t;
      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        const dist = Math.hypot(dx, dy);
        const steps = Math.min(8, Math.floor(dist / 9));
        if (steps === 0) return;
        const dt = Math.max(8, t - last.t);
        for (let s = 1; s <= steps; s++) {
          const k = s / steps;
          // throw the ink forward along the cursor's direction, with a little spread
          const spread = (Math.random() - 0.5) * 1.6;
          spawn(last.x + dx * k, last.y + dy * k, (dx / dt) * 9 + spread, (dy / dt) * 9 - spread, Math.min(1, dist / 50));
        }
      }
      last = { x, y, t };
    };
    window.addEventListener("pointermove", onMove);
    let visible = true;
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(wrap);

    const data = new Float32Array(MAX * 4);
    const start = performance.now();
    let prev = start;
    let altOn = false;
    let raf = 0;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!ready || !visible) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const t = (now - start) / 1000;
      const s = sc();
      const p = progress?.get() ?? 0;

      // scene geometry for this scroll position
      const k1 = smooth(0, 0.3, p);
      const k2 = smooth(0.3, 0.5, p);
      const fullscreen: R = { x: 0, y: 0, w: W, h: H };
      const frameR = k2 > 0 ? lerpR(frameA, frameB, k2) : lerpR(fullscreen, frameA, k1);
      const portR = k2 > 0 ? lerpR(portA, portB, k2) : lerpR(heroRect, portA, k1);
      const inkK = 1 - smooth(0, 0.12, p);

      // blobs
      const margin = (W - heroRect.w * 0.7) / 2; // keep ambient ink off the photo
      for (let i = blobs.length - 1; i >= 0; i--) {
        const b = blobs[i];
        if (b.ambient) {
          const k = b.ambient;
          const left = k % 2 === 0;
          const band = Math.max(margin, W * 0.12);
          b.x = (left ? 0 : W - band) + band * (0.5 + 0.42 * Math.sin(t * (0.35 + k * 0.07) + k * 1.9));
          b.y = H * (0.5 + 0.46 * Math.cos(t * (0.28 + k * 0.05) + k * 2.7));
          b.r = (48 + 26 * Math.sin(t * 1.1 + k)) * s * (reduce ? 0 : 1);
          b.alt = false;
          continue;
        }
        b.age += dt;
        if (b.age > b.life) {
          blobs.splice(i, 1);
          continue;
        }
        b.x += b.vx * dt * 60 * 0.5;
        b.y += b.vy * dt * 60 * 0.5;
        b.vx *= 0.9;
        b.vy *= 0.9;
      }
      // touch screens: an occasional quick ink burst over the head so the visor still appears
      if (coarse && !reduce && now - lastActive > 2500 && Math.random() < 0.06) {
        const hx = portR.x + head.cx * portR.w + (Math.random() - 0.5) * portR.w * 0.25;
        const hy = portR.y + head.cy * portR.h + (Math.random() - 0.5) * portR.h * 0.2;
        spawn(hx, hy, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, 1);
      }

      let n = 0;
      let headField = 0;
      const hx = portR.x + head.cx * portR.w;
      const hy = portR.y + head.cy * portR.h;
      for (const b of blobs) {
        if (n >= MAX) break;
        let life = 1;
        if (!b.ambient) {
          const a = b.age / b.life;
          life = a < 0.12 ? a / 0.12 : 1 - (a - 0.12) / 0.88;
        }
        const r = b.r * Math.sqrt(Math.max(0, life)) * inkK;
        data[n * 4] = b.x * dpr;
        data[n * 4 + 1] = (H - b.y) * dpr;
        data[n * 4 + 2] = r * dpr;
        data[n * 4 + 3] = b.ambient ? 0 : 1;
        if (!b.ambient) headField += (r * r) / Math.max((b.x - hx) ** 2 + (b.y - hy) ** 2, 1);
        n++;
      }

      const toGL = (q: R) => [q.x * dpr, (H - q.y - q.h) * dpr, q.w * dpr, q.h * dpr] as const;
      gl.uniform2f(U.res, el.width, el.height);
      gl.uniform4f(U.rect, ...toGL(portR));
      gl.uniform4f(U.frame, ...toGL(frameR));
      const dk = smooth(0.32, 0.5, p);
      // frame: cream (invisible against the hero) → light grey → dark olive-grey
      const fc = [lerp(lerp(0.957, 0.74, k1), 0.29, dk), lerp(lerp(0.957, 0.74, k1), 0.31, dk), lerp(lerp(0.929, 0.72, k1), 0.27, dk)];
      gl.uniform3f(U.frameCol, fc[0], fc[1], fc[2]);
      gl.uniform1f(U.frameA, k1);
      gl.uniform1f(U.dark, dk);
      gl.uniform1f(U.ink, inkK);
      gl.uniform4fv(U.blobs, data);
      gl.uniform1i(U.count, n);
      gl.uniform1f(U.time, t);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      const on = headField > 1 && inkK > 0.5;
      if (on !== altOn) {
        altOn = on;
        onAltRef.current?.(on);
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
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
uniform vec4 uRect;   // portrait rect (device px, origin bottom-left): x, y, w, h
uniform vec4 uFrame;  // clipping frame
uniform vec3 uFrameCol;
uniform float uFrameA;
uniform float uDark;
uniform float uInk;
uniform vec4 uBlobs[${MAX}];
uniform int uCount;
uniform float uTime;
uniform sampler2D uBase;
uniform sampler2D uAlt;
uniform bool uHasAlt;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
vec4 img(sampler2D t, vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(t, uv);
}

void main() {
  vec2 p = gl_FragCoord.xy;
  float s = uRes.y / 900.0;

  // liquid ink field (metaballs with a quickly churning edge)
  vec2 w = vec2(noise(p / (90.0 * s) + uTime * 0.9), noise(p / (90.0 * s) - uTime * 0.8 + 7.3)) - 0.5;
  vec2 q = p + w * 26.0 * s;
  float fieldAll = 0.0, fieldAlt = 0.0;
  for (int i = 0; i < ${MAX}; i++) {
    if (i >= uCount) break;
    vec4 b = uBlobs[i];
    vec2 d = q - b.xy;
    float v = (b.z * b.z) / max(dot(d, d), 1.0);
    fieldAll += v;
    fieldAlt += v * b.w;
  }
  float inkAll = smoothstep(0.97, 1.03, fieldAll);
  float inkAlt = smoothstep(0.97, 1.03, fieldAlt);

  vec4 col = vec4(0.86, 0.865, 0.83, 0.42 * inkAll * uInk);

  // frame (clips the portrait once it starts shrinking)
  bool inFrame = p.x >= uFrame.x && p.x <= uFrame.x + uFrame.z && p.y >= uFrame.y && p.y <= uFrame.y + uFrame.w;
  if (inFrame && uFrameA > 0.0) {
    col.rgb = mix(col.rgb, uFrameCol, uFrameA);
    col.a = max(col.a, uFrameA);
  }

  vec2 uv = (p - uRect.xy) / uRect.zw;
  vec4 base = img(uBase, uv);
  vec4 alt = uHasAlt ? img(uAlt, uv) : base;
  vec4 face = mix(base, alt, inkAlt * uInk);
  // soften the photo's cropped side/bottom edges
  float edge = smoothstep(0.0, 0.14, uv.x) * smoothstep(1.0, 0.86, uv.x) * smoothstep(0.0, 0.06, uv.y);
  face.a *= edge;
  if (!inFrame) face.a = 0.0;
  // darken + desaturate for the signature moment
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

function loadTexture(gl: WebGLRenderingContext, url: string, unit: number) {
  return new Promise<void>((resolve, reject) => {
    const im = new Image();
    im.decoding = "async";
    im.onload = () => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      resolve();
    };
    im.onerror = reject;
    im.src = url;
  });
}
