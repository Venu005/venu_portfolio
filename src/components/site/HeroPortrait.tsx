"use client";
import { useEffect, useRef, useState } from "react";
import type { MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

/** Head position inside the cutout image, as fractions of the image size (y from the top). */
export type HeadBox = { cx: number; cy: number; rx: number; ry: number };

type Props = {
  /** Background-removed portrait (transparent PNG/WebP). */
  src: string;
  /** Same framing, wearing the helmet (or any alternate look). Optional: falls back to a lime "x-ray" of `src`. */
  altSrc?: string | null;
  imageAspect: number;
  head: HeadBox;
  scrollProgress?: MotionValue<number>;
  className?: string;
  onAlt?: (on: boolean) => void;
};

/**
 * Hero portrait with two looks.
 *  - Depth parallax: the head turns slightly toward the cursor.
 *  - Hover the head: a wobbly circle under the cursor reveals the alternate image.
 *  - Scroll (and every few seconds on its own): the alternate image wipes in from the top over the whole portrait.
 */
export default function HeroPortrait({ src, altSrc, imageAspect, head, scrollProgress, className, onAlt }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);
  const onAltRef = useRef(onAlt);
  onAltRef.current = onAlt;

  useEffect(() => {
    const el = canvas.current!;
    const host = wrap.current!;
    const gl = el.getContext("webgl", { premultipliedAlpha: false, alpha: true, antialias: true });
    const prog = gl && createProgram(gl, VERT, FRAG);
    if (!gl || !prog) {
      setFallback(true);
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
      rect: u("uRect"),
      res: u("uRes"),
      mouse: u("uMouse"),
      pointer: u("uPointer"),
      hover: u("uHover"),
      full: u("uFull"),
      time: u("uTime"),
      hasAlt: u("uHasAlt"),
      head: u("uHead"),
    };
    gl.uniform1i(u("uBase"), 0);
    gl.uniform1i(u("uAlt"), 1);
    gl.uniform1i(U.hasAlt, 0);
    gl.uniform4f(U.head, head.cx, 1 - head.cy, head.rx, head.ry);

    let ready = false;
    loadTexture(gl, src, 0)
      .then(() => (ready = true))
      .catch(() => setFallback(true));
    if (altSrc) loadTexture(gl, altSrc, 1).then(() => gl.uniform1i(U.hasAlt, 1)).catch(() => {});

    // image rectangle inside the canvas ("contain", bottom-anchored, with headroom)
    const rect = { x: 0, y: 0, w: 1, h: 1 };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = host.getBoundingClientRect();
      el.width = Math.max(1, Math.round(r.width * dpr));
      el.height = Math.max(1, Math.round(r.height * dpr));
      gl.viewport(0, 0, el.width, el.height);
      const h = Math.min(r.height / 1.04, r.width / imageAspect);
      const w = h * imageAspect;
      rect.w = w / r.width;
      rect.h = h / r.height;
      rect.x = (1 - rect.w) / 2;
      rect.y = 0;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const target = { mx: 0, my: 0, px: 0.5, py: 0.5, hover: 0 };
    const cur = { mx: 0, my: 0, px: 0.5, py: 0.5, hover: 0, full: 0 };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastActive = performance.now();
    let visible = true;
    let altOn = false;

    const onMove = (e: PointerEvent) => {
      target.mx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1));
      target.my = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1));
      const r = host.getBoundingClientRect();
      target.px = (e.clientX - r.left) / r.width;
      target.py = 1 - (e.clientY - r.top) / r.height;
      // over the head?
      const hx = rect.x + head.cx * rect.w;
      const hy = rect.y + (1 - head.cy) * rect.h;
      const dx = (target.px - hx) / (head.rx * rect.w * 1.35);
      const dy = (target.py - hy) / (head.ry * rect.h * 1.3);
      target.hover = e.pointerType === "mouse" && dx * dx + dy * dy < 1 ? 1 : 0;
      if (target.hover) lastActive = performance.now();
    };
    const onLeave = () => (target.hover = 0);
    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(host);

    const start = performance.now();
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!ready || !visible) return;
      const now = performance.now();
      const t = (now - start) / 1000;

      // auto-play every ~7s when idle
      let auto = 0;
      if (!reduce) {
        const idle = now - lastActive;
        const phase = (idle % 7000) / 7000;
        auto = idle > 3000 && phase > 0.5 && phase < 0.88 ? 1 : 0;
      }
      const sp = scrollProgress?.get() ?? 0;
      const scroll = Math.min(1, Math.max(0, (sp - 0.06) / 0.4));
      const fullGoal = Math.max(auto, scroll);

      const k = reduce ? 1 : 0.075;
      cur.mx += (target.mx - cur.mx) * k;
      cur.my += (target.my - cur.my) * k;
      cur.px += (target.px - cur.px) * (reduce ? 1 : 0.2);
      cur.py += (target.py - cur.py) * (reduce ? 1 : 0.2);
      cur.hover += (target.hover - cur.hover) * (reduce ? 1 : 0.12);
      cur.full += (fullGoal - cur.full) * (reduce ? 1 : fullGoal > cur.full ? 0.05 : 0.04);

      gl.uniform4f(U.rect, rect.x, rect.y, rect.w, rect.h);
      gl.uniform2f(U.res, el.width, el.height);
      gl.uniform2f(U.mouse, cur.mx, -cur.my);
      gl.uniform2f(U.pointer, cur.px, cur.py);
      gl.uniform1f(U.hover, cur.hover);
      gl.uniform1f(U.full, cur.full);
      gl.uniform1f(U.time, t);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      const on = cur.full > 0.6 || cur.hover > 0.6;
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
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [src, altSrc, imageAspect, head.cx, head.cy, head.rx, head.ry, scrollProgress]);

  return (
    <div ref={wrap} className={cn("relative", className)}>
      {fallback ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Portrait of Venusai Yalamanchili" className="absolute bottom-0 left-1/2 h-[96%] -translate-x-1/2 object-contain" />
      ) : (
        <canvas ref={canvas} role="img" aria-label="Portrait of Venusai Yalamanchili" className="absolute inset-0 h-full w-full" />
      )}
    </div>
  );
}

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uBase;
uniform sampler2D uAlt;
uniform bool uHasAlt;
uniform vec4 uRect;   // image rect in canvas uv: x, y, w, h
uniform vec2 uRes;
uniform vec2 uMouse;
uniform vec2 uPointer;
uniform float uHover;
uniform float uFull;
uniform float uTime;
uniform vec4 uHead;   // cx, cy (y up), rx, ry in image uv

float ell(vec2 p, vec2 c, vec2 r) { vec2 d = (p - c) / r; return 1.0 - smoothstep(0.0, 1.0, dot(d, d)); }
float depthAt(vec2 uv) {
  float h = ell(uv, uHead.xy, uHead.zw);
  float n = ell(uv, uHead.xy + vec2(0.0, -uHead.w * 0.1), uHead.zw * vec2(0.25, 0.3)) * 0.3;
  float b = ell(uv, vec2(0.5, 0.0), vec2(0.62, 0.38)) * 0.6;
  return clamp(max(h + n, b), 0.0, 1.0);
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec4 sampleImg(sampler2D tex, vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(tex, uv);
}

void main() {
  vec2 iuv = (vUv - uRect.xy) / uRect.zw;          // image uv
  float d = depthAt(iuv);
  vec2 off = uMouse * (d - 0.3) * 0.03;
  d = depthAt(iuv - off);
  off = uMouse * (d - 0.3) * 0.03;
  vec2 suv = iuv - off;

  vec4 base = sampleImg(uBase, suv);

  // reveal mask: circle under the cursor + a wavy wipe from the top
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  vec2 p = (vUv - uPointer) * asp;
  float ang = atan(p.y, p.x);
  float wob = 0.018 * sin(ang * 5.0 + uTime * 2.2) + 0.012 * sin(ang * 9.0 - uTime * 3.1);
  float radius = uHover * (0.2 + wob);
  float circle = 1.0 - smoothstep(radius - 0.01, radius, length(p));
  float edge = 1.0 - iuv.y + 0.03 * sin(iuv.x * 14.0 + uTime * 2.0);
  float wipeLine = uFull * 1.15;
  float wipe = 1.0 - smoothstep(wipeLine - 0.02, wipeLine, edge);
  float mask = max(circle, wipe);

  vec4 alt;
  if (uHasAlt) {
    alt = sampleImg(uAlt, iuv - off * 1.3);
  } else {
    // fallback look: lime duotone "x-ray" with scanlines
    vec2 a = iuv - off * 1.6;
    float r = sampleImg(uBase, a + vec2(0.003, 0.0)).r;
    float g = sampleImg(uBase, a).g;
    float b = sampleImg(uBase, a - vec2(0.003, 0.0)).b;
    float l = smoothstep(0.06, 0.8, dot(vec3(r, g, b), vec3(0.299, 0.587, 0.114)));
    vec3 duo = mix(vec3(0.09, 0.1, 0.07), vec3(0.824, 1.0, 0.0), l);
    duo *= 0.9 + 0.1 * sin(vUv.y * uRes.y * 0.9 - uTime * 6.0);
    duo += (hash(vUv * uRes + uTime) - 0.5) * 0.06;
    alt = vec4(duo, sampleImg(uBase, a).a);
  }

  vec4 col = mix(base, alt, mask);
  // lime rim on the reveal edges
  float ring = (smoothstep(radius - 0.012, radius - 0.003, length(p)) * circle)
             + (smoothstep(wipeLine - 0.025, wipeLine - 0.006, edge) * wipe * step(0.001, uFull) * step(uFull, 0.98));
  col.rgb = mix(col.rgb, vec3(0.824, 1.0, 0.0), clamp(ring, 0.0, 1.0) * col.a);
  // soften the photo's cropped side and bottom edges
  col.a *= smoothstep(0.0, 0.1, iuv.x) * smoothstep(1.0, 0.9, iuv.x) * smoothstep(0.0, 0.06, iuv.y);
  gl_FragColor = col;
}`;

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string) {
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
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
}

function loadTexture(gl: WebGLRenderingContext, url: string, unit: number) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      resolve();
    };
    img.onerror = reject;
    img.src = url;
  });
}
