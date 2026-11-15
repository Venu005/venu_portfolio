"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type HeadBox = { cx: number; cy: number; rx: number; ry: number };

type Props = {
  src: string; // background-removed portrait
  altSrc?: string | null; // same framing, alternate look (revealed by the fluid)
  imageAspect: number;
  head: HeadBox;
  className?: string;
  onAlt?: (on: boolean) => void;
};

const MAX = 48; // blobs passed to the shader

type Blob = { x: number; y: number; vx: number; vy: number; r: number; age: number; life: number; ambient?: number };

/**
 * Full-hero canvas, inspired by fluid "ink" reveals:
 *  - liquid blobs trail behind the cursor and merge (metaballs with a slowly warping edge)
 *  - on the background they read as soft grey ink; where they cover the portrait they reveal the alternate image
 *  - a few ambient blobs drift on their own, so the page is alive even without a mouse
 * The portrait itself never distorts.
 */
export default function FluidHero({ src, altSrc, imageAspect, head, className, onAlt }: Props) {
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
    const U = { res: u("uRes"), rect: u("uRect"), blobs: u("uBlobs"), count: u("uCount"), time: u("uTime"), hasAlt: u("uHasAlt") };
    gl.uniform1i(u("uBase"), 0);
    gl.uniform1i(u("uAlt"), 1);
    gl.uniform1i(U.hasAlt, 0);

    let ready = false;
    loadTexture(gl, src, 0).then(() => (ready = true)).catch(() => (wrap.dataset.fallback = "1"));
    if (altSrc) loadTexture(gl, altSrc, 1).then(() => gl.uniform1i(U.hasAlt, 1)).catch(() => {});

    // sizes in CSS px
    let W = 1, H = 1, dpr = 1;
    const rect = { x: 0, y: 0, w: 1, h: 1 }; // portrait rect, CSS px, y from top
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const r = wrap.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      el.width = Math.round(W * dpr);
      el.height = Math.round(H * dpr);
      gl.viewport(0, 0, el.width, el.height);
      // portrait: bottom-anchored, centred, ~90% of the height (smaller share on very wide screens)
      const ph = Math.min(H * 0.9, (W * 0.62) / imageAspect);
      rect.h = ph;
      rect.w = ph * imageAspect;
      rect.x = (W - rect.w) / 2;
      rect.y = H - ph;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const blobs: Blob[] = [];
    const scale = () => Math.min(W, H) / 900;
    // ambient drifting blobs
    for (let i = 0; i < 6; i++) blobs.push({ x: 0, y: 0, vx: 0, vy: 0, r: 0, age: 0, life: Infinity, ambient: i + 1 });

    let last: { x: number; y: number; t: number } | null = null;
    let lastActive = -1e9;
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (y < 0 || y > H) {
        last = null;
        return;
      }
      const t = performance.now();
      lastActive = t;
      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        const dist = Math.hypot(dx, dy);
        const steps = Math.min(6, Math.floor(dist / 14));
        const dt = Math.max(8, t - last.t);
        for (let s = 1; s <= steps; s++) {
          const k = s / steps;
          spawn(last.x + dx * k, last.y + dy * k, (dx / dt) * 6, (dy / dt) * 6, Math.min(1, dist / 60));
        }
        if (steps === 0) return;
      }
      last = { x, y, t };
    };
    const spawn = (x: number, y: number, vx: number, vy: number, energy: number) => {
      const sc = scale();
      blobs.push({ x, y, vx, vy, r: (34 + Math.random() * 30) * sc * (0.7 + energy * 0.5), age: 0, life: 1.4 + Math.random() * 1.1 });
      // keep the newest trail blobs, ambient ones first
      const trail = blobs.filter((b) => !b.ambient);
      if (trail.length > MAX - 6) blobs.splice(blobs.indexOf(trail[0]), 1);
    };
    window.addEventListener("pointermove", onMove);
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(wrap);
    let visible = true;

    const data = new Float32Array(MAX * 4);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      const sc = scale();
      const idle = now - lastActive > 2500;

      // update blobs
      for (let i = blobs.length - 1; i >= 0; i--) {
        const b = blobs[i];
        if (b.ambient) {
          const k = b.ambient;
          // slow Lissajous drift; blob #1 regularly passes over the head
          if (k === 1) {
            const hx = rect.x + head.cx * rect.w;
            const hy = rect.y + head.cy * rect.h;
            const phase = (t * 0.16) % 1;
            b.x = hx + Math.cos(t * 0.5) * rect.w * 0.35 + (phase - 0.5) * W * 0.1;
            b.y = hy + Math.sin(t * 0.8) * rect.h * 0.18;
            const pulse = Math.max(0, Math.sin(t * 0.9));
            b.r = (idle && !reduce ? 70 + pulse * 120 : 0) * sc;
          } else {
            b.x = W * (0.5 + 0.48 * Math.sin(t * (0.05 + k * 0.013) + k * 1.7));
            b.y = H * (0.5 + 0.45 * Math.cos(t * (0.04 + k * 0.011) + k * 2.3));
            b.r = (110 + 70 * Math.sin(t * 0.3 + k)) * sc * (reduce ? 0 : 1);
          }
          continue;
        }
        b.age += dt;
        if (b.age > b.life) {
          blobs.splice(i, 1);
          continue;
        }
        b.x += b.vx * dt * 60 * 0.4;
        b.y += b.vy * dt * 60 * 0.4;
        b.vx *= 0.94;
        b.vy *= 0.94;
      }

      // pack uniforms
      let n = 0;
      let headField = 0;
      const hx = rect.x + head.cx * rect.w;
      const hy = rect.y + head.cy * rect.h;
      for (const b of blobs) {
        if (n >= MAX) break;
        let s = 1;
        if (!b.ambient) {
          const a = b.age / b.life;
          s = a < 0.15 ? a / 0.15 : 1 - (a - 0.15) / 0.85; // grow quickly, shrink slowly
          s = Math.max(0, s);
        }
        const r = b.r * (b.ambient ? 1 : 0.55 + 0.45 * s) * Math.sqrt(s);
        data[n * 4] = b.x * dpr;
        data[n * 4 + 1] = (H - b.y) * dpr;
        data[n * 4 + 2] = r * dpr;
        data[n * 4 + 3] = b.ambient && b.ambient > 1 ? 0 : 1; // 1 = reveals the alt image, 0 = background-only ink
        const d2 = (b.x - hx) ** 2 + (b.y - hy) ** 2;
        if (data[n * 4 + 3] > 0) headField += (r * r) / Math.max(d2, 1);
        n++;
      }
      gl.uniform2f(U.res, el.width, el.height);
      gl.uniform4f(U.rect, rect.x * dpr, (H - rect.y - rect.h) * dpr, rect.w * dpr, rect.h * dpr);
      gl.uniform4fv(U.blobs, data);
      gl.uniform1i(U.count, n);
      gl.uniform1f(U.time, t);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      const on = headField > 1;
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
  }, [src, altSrc, imageAspect, head.cx, head.cy, head.rx, head.ry]);

  return (
    <div ref={host} className={cn("relative", className)}>
      <canvas ref={canvas} role="img" aria-label="Portrait of Venusai Yalamanchili" className="absolute inset-0 h-full w-full" />
      {/* no-WebGL fallback */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 hidden h-[90%] -translate-x-1/2 object-contain [[data-fallback='1']_&]:block"
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
uniform vec4 uRect;          // portrait rect in device px (x, y from bottom, w, h)
uniform vec4 uBlobs[${MAX}]; // x, y (device px, y up), radius, revealsAlt
uniform int uCount;
uniform float uTime;
uniform sampler2D uBase;
uniform sampler2D uAlt;
uniform bool uHasAlt;

// value noise for a slowly warping, liquid edge
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
  vec2 w = vec2(noise(p / (140.0 * s) + uTime * 0.25), noise(p / (140.0 * s) - uTime * 0.21 + 7.3)) - 0.5;
  vec2 q = p + w * 46.0 * s;

  float fieldAll = 0.0;
  float fieldAlt = 0.0;
  for (int i = 0; i < ${MAX}; i++) {
    if (i >= uCount) break;
    vec4 b = uBlobs[i];
    vec2 d = q - b.xy;
    float v = (b.z * b.z) / max(dot(d, d), 1.0);
    fieldAll += v;
    fieldAlt += v * b.w;
  }
  float inkAll = smoothstep(0.96, 1.04, fieldAll);
  float inkAlt = smoothstep(0.96, 1.04, fieldAlt);

  // background ink: soft warm grey
  vec4 col = vec4(0.86, 0.865, 0.83, 0.42 * inkAll);

  // portrait
  vec2 uv = (p - uRect.xy) / uRect.zw;
  vec4 base = img(uBase, uv);
  vec4 alt = uHasAlt ? img(uAlt, uv) : base;
  vec4 face = mix(base, alt, inkAlt);
  // fade the photo's cropped side/bottom edges
  face.a *= smoothstep(0.0, 0.16, uv.x) * smoothstep(1.0, 0.84, uv.x) * smoothstep(0.0, 0.07, uv.y);

  col.rgb = mix(col.rgb, face.rgb, face.a);
  col.a = max(col.a, face.a);
  gl_FragColor = col;
}`;

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string) {
  const sh = (type: number, s: string) => {
    const x = gl.createShader(type)!;
    gl.shaderSource(x, s);
    gl.compileShader(x);
    if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(x));
      return null;
    }
    return x;
  };
  const v = sh(gl.VERTEX_SHADER, vs);
  const f = sh(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram()!;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
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
