"use client";
import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { FluidSim } from "./fluid";

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
 *  - Hero: big still portrait. A real-time fluid simulation turns cursor movement into flowing ink:
 *    grey on the background, and the visor portrait wherever the ink crosses the head.
 *    Small puffs of ink drift in the margins on their own.
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
    const gl = el.getContext("webgl", { premultipliedAlpha: false, alpha: true, antialias: false, preserveDrawingBuffer: false });
    const prog = gl && createProgram(gl, VERT, FRAG);
    if (!gl || !prog) {
      wrap.dataset.fallback = "1";
      return;
    }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const U = {
      res: u("uRes"),
      rect: u("uRect"),
      frame: u("uFrame"),
      frameCol: u("uFrameCol"),
      frameA: u("uFrameA"),
      dark: u("uDark"),
      ink: u("uInk"),
      hasAlt: u("uHasAlt"),
      hasDye: u("uHasDye"),
      base: u("uBase"),
      alt: u("uAlt"),
      dye: u("uDye"),
    };

    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const sim = new FluidSim(gl, mobile ? 96 : 128, mobile ? 320 : 512);

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
      if (sim.ok) sim.resize(W / H);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // pointer → splats (queued, applied in the frame loop)
    const queue: { x: number; y: number; dx: number; dy: number; ch: 0 | 1; r?: number; a?: number }[] = [];
    let last: { x: number; y: number } | null = null;
    let lastActive = -1e9;
    let overHeadUntil = 0;
    let portNow: R = heroRect;
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (y < 0 || y > H || x < 0 || x > W) {
        last = null;
        return;
      }
      const now = performance.now();
      lastActive = now;
      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        if (dx * dx + dy * dy > 1) queue.push({ x: x / W, y: 1 - y / H, dx: (dx / W) * 5200, dy: (-dy / H) * 5200, ch: 0 });
      }
      last = { x, y };
      // is the cursor over the head?
      const hx = portNow.x + head.cx * portNow.w;
      const hy = portNow.y + head.cy * portNow.h;
      const ex = (x - hx) / (head.rx * portNow.w * 1.4);
      const ey = (y - hy) / (head.ry * portNow.h * 1.3);
      if (ex * ex + ey * ey < 1) overHeadUntil = now + 700;
    };
    window.addEventListener("pointermove", onMove);
    let visible = true;
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(wrap);

    let prev = performance.now();
    let nextAmbient = 0;
    let altOn = false;
    let raf = 0;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!baseTex || !visible) return;
      const now = performance.now();
      const dt = Math.min(0.033, (now - prev) / 1000);
      prev = now;
      const p = progress?.get() ?? 0;

      const k1 = smooth(0, 0.3, p);
      const k2 = smooth(0.3, 0.5, p);
      const fullscreen: R = { x: 0, y: 0, w: W, h: H };
      const frameR = k2 > 0 ? lerpR(frameA, frameB, k2) : lerpR(fullscreen, frameA, k1);
      const portR = k2 > 0 ? lerpR(portA, portB, k2) : lerpR(heroRect, portA, k1);
      portNow = portR;
      const inkK = 1 - smooth(0, 0.12, p);

      // ---- fluid ----
      if (sim.ok && inkK > 0.01) {
        // ambient puffs in the left/right margins, off the photo
        if (!reduce && now > nextAmbient) {
          nextAmbient = now + 260 + Math.random() * 260;
          const left = Math.random() < 0.5;
          const band = Math.max(0.08, (W - heroRect.w * 0.62) / 2 / W);
          const ax = left ? Math.random() * band : 1 - Math.random() * band;
          const ay = 0.1 + Math.random() * 0.8;
          const ang = Math.random() * Math.PI * 2;
          const sp = 260 + Math.random() * 420;
          queue.push({ x: ax, y: ay, dx: Math.cos(ang) * sp, dy: Math.sin(ang) * sp, ch: 1, r: 0.0006 + Math.random() * 0.0008, a: 0.5 });
        }
        // touch screens: occasional burst over the head so the visor still shows
        if (coarse && !reduce && now - lastActive > 2500 && Math.random() < 0.025) {
          const hx = (portR.x + head.cx * portR.w) / W;
          const hy = 1 - (portR.y + head.cy * portR.h) / H;
          const ang = Math.random() * Math.PI * 2;
          queue.push({ x: hx + (Math.random() - 0.5) * 0.06, y: hy + (Math.random() - 0.5) * 0.08, dx: Math.cos(ang) * 600, dy: Math.sin(ang) * 600, ch: 0, r: 0.0022 });
        }
        for (const s of queue.splice(0, 24)) sim.splat(s.x, s.y, s.dx, s.dy, s.ch, s.r ?? 0.0009, s.a ?? 1);
        sim.step(dt, { curl: 34, velocityDissipation: 1.2, dyeDissipation: 3.2, pressureIters: mobile ? 12 : 18 });
      } else {
        queue.length = 0;
      }

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
      if (sim.ok) gl.uniform1i(U.dye, sim.bindDye(2));
      gl.uniform1i(U.hasDye, sim.ok ? 1 : 0);

      const toGL = (q: R) => [q.x * dpr, (H - q.y - q.h) * dpr, q.w * dpr, q.h * dpr] as const;
      gl.uniform2f(U.res, el.width, el.height);
      gl.uniform4f(U.rect, ...toGL(portR));
      gl.uniform4f(U.frame, ...toGL(frameR));
      const dk = smooth(0.32, 0.5, p);
      const fc = [lerp(lerp(0.957, 0.74, k1), 0.29, dk), lerp(lerp(0.957, 0.74, k1), 0.31, dk), lerp(lerp(0.929, 0.72, k1), 0.27, dk)];
      gl.uniform3f(U.frameCol, fc[0], fc[1], fc[2]);
      gl.uniform1f(U.frameA, k1);
      gl.uniform1f(U.dark, dk);
      gl.uniform1f(U.ink, inkK);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      const on = now < overHeadUntil && inkK > 0.5;
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
uniform sampler2D uBase;
uniform sampler2D uAlt;
uniform sampler2D uDye;
uniform bool uHasAlt;
uniform bool uHasDye;

vec4 img(sampler2D t, vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(t, uv);
}

void main() {
  vec2 p = gl_FragCoord.xy;

  // fluid ink, thresholded into crisp liquid shapes
  float inkAll = 0.0, inkAlt = 0.0;
  if (uHasDye) {
    vec2 d = texture2D(uDye, p / uRes).rg;
    inkAll = smoothstep(0.14, 0.3, d.r + d.g) * uInk;
    inkAlt = smoothstep(0.14, 0.3, d.r) * uInk;
  }
  vec4 col = vec4(0.86, 0.865, 0.83, 0.5 * inkAll);

  bool inFrame = p.x >= uFrame.x && p.x <= uFrame.x + uFrame.z && p.y >= uFrame.y && p.y <= uFrame.y + uFrame.w;
  if (inFrame && uFrameA > 0.0) {
    col.rgb = mix(col.rgb, uFrameCol, uFrameA);
    col.a = max(col.a, uFrameA);
  }

  vec2 uv = (p - uRect.xy) / uRect.zw;
  vec4 base = img(uBase, uv);
  vec4 alt = uHasAlt ? img(uAlt, uv) : base;
  vec4 face = mix(base, alt, inkAlt);
  face.a *= smoothstep(0.0, 0.015, uv.y);
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
