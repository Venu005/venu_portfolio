"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Interactive "3D" portrait.
 *  - Depth parallax: the subject turns toward the cursor. Uses `depthSrc` (a grayscale depth map, white = near)
 *    when provided, otherwise a procedural head-and-shoulders depth that works well for centred portraits.
 *  - X-ray reveal: a wobbly circle under the cursor shows a lime duotone/scanline version of the photo.
 *  - Falls back to a plain <img> if WebGL is unavailable.
 */
export default function Photo3D({
  src,
  depthSrc,
  alt,
  className,
  strength = 1,
}: {
  src: string;
  depthSrc?: string;
  alt: string;
  className?: string;
  strength?: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const el = canvas.current!;
    const host = wrap.current!;
    const gl = el.getContext("webgl", { premultipliedAlpha: false, antialias: true });
    if (!gl) {
      setFallback(true);
      return;
    }

    const prog = createProgram(gl, VERT, FRAG);
    if (!prog) {
      setFallback(true);
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes"), uImgRes = u("uImgRes"), uMouse = u("uMouse"), uPointer = u("uPointer");
    const uReveal = u("uReveal"), uTime = u("uTime"), uHasDepth = u("uHasDepth"), uStrength = u("uStrength");
    gl.uniform1i(u("uImg"), 0);
    gl.uniform1i(u("uDepth"), 1);
    gl.uniform1f(uStrength, strength);
    gl.uniform1i(uHasDepth, 0);

    let imgW = 1, imgH = 1, ready = false;
    loadTexture(gl, src, 0).then(({ w, h }) => {
      imgW = w;
      imgH = h;
      ready = true;
    }).catch(() => setFallback(true));
    if (depthSrc) loadTexture(gl, depthSrc, 1).then(() => gl.uniform1i(uHasDepth, 1)).catch(() => {});

    // state, smoothed every frame
    const target = { mx: 0, my: 0, px: 0.5, py: 0.5, reveal: 0 };
    const cur = { mx: 0, my: 0, px: 0.5, py: 0.5, reveal: 0 };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    let raf = 0;
    const start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = host.getBoundingClientRect();
      el.width = Math.max(1, Math.round(r.width * dpr));
      el.height = Math.max(1, Math.round(r.height * dpr));
      gl.viewport(0, 0, el.width, el.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      // whole-window parallax so the head "looks" at the cursor wherever it is
      target.mx = Math.max(-1, Math.min(1, ((e.clientX - (r.left + r.width / 2)) / window.innerWidth) * 2));
      target.my = Math.max(-1, Math.min(1, ((e.clientY - (r.top + r.height / 2)) / window.innerHeight) * 2));
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      target.px = (e.clientX - r.left) / r.width;
      target.py = (e.clientY - r.top) / r.height;
      target.reveal = inside && e.pointerType === "mouse" ? 1 : 0;
    };
    const onLeave = () => (target.reveal = 0);
    window.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);

    // on touch devices, tilt with device orientation when available, else idle sway
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      target.mx = Math.max(-1, Math.min(1, e.gamma / 30));
      target.my = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
    };
    window.addEventListener("deviceorientation", onTilt);
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(host);

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!ready || !visible) return;
      const t = (performance.now() - start) / 1000;
      if (coarse && !reduce) {
        target.mx = target.mx * 0.98 + Math.sin(t * 0.6) * 0.5 * 0.02;
        target.my = target.my * 0.98 + Math.cos(t * 0.45) * 0.3 * 0.02;
      }
      const k = reduce ? 1 : 0.07;
      cur.mx += (target.mx - cur.mx) * k;
      cur.my += (target.my - cur.my) * k;
      cur.px += (target.px - cur.px) * (reduce ? 1 : 0.18);
      cur.py += (target.py - cur.py) * (reduce ? 1 : 0.18);
      cur.reveal += (target.reveal - cur.reveal) * (reduce ? 1 : 0.1);

      gl.uniform2f(uRes, el.width, el.height);
      gl.uniform2f(uImgRes, imgW, imgH);
      gl.uniform2f(uMouse, cur.mx, cur.my);
      gl.uniform2f(uPointer, cur.px, 1 - cur.py);
      gl.uniform1f(uReveal, cur.reveal);
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("deviceorientation", onTilt);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [src, depthSrc, strength]);

  return (
    <div ref={wrap} className={cn("relative overflow-hidden", className)} data-cursor="">
      {fallback ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <canvas ref={canvas} role="img" aria-label={alt} className="absolute inset-0 h-full w-full" />
      )}
    </div>
  );
}

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uImg;
uniform sampler2D uDepth;
uniform bool uHasDepth;
uniform vec2 uRes;
uniform vec2 uImgRes;
uniform vec2 uMouse;
uniform vec2 uPointer;
uniform float uReveal;
uniform float uTime;
uniform float uStrength;

// object-fit: cover
vec2 coverUv(vec2 uv) {
  float rs = uRes.x / uRes.y;
  float ri = uImgRes.x / uImgRes.y;
  vec2 scale = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  return (uv - 0.5) * scale + 0.5;
}

float ellipse(vec2 p, vec2 c, vec2 r) {
  vec2 d = (p - c) / r;
  return 1.0 - smoothstep(0.0, 1.0, dot(d, d));
}

float depthAt(vec2 uv) {
  if (uHasDepth) return texture2D(uDepth, uv).r;
  // procedural head & shoulders (image uv, y up)
  float head = ellipse(uv, vec2(0.5, 0.62), vec2(0.24, 0.30));
  float nose = ellipse(uv, vec2(0.5, 0.58), vec2(0.08, 0.12)) * 0.25;
  float body = ellipse(uv, vec2(0.5, 0.0), vec2(0.62, 0.42)) * 0.75;
  return clamp(max(head + nose, body), 0.0, 1.0);
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  vec2 uv = coverUv(vUv);
  vec2 m = uMouse * vec2(1.0, -1.0);

  // parallax: sample depth at the un-shifted point, then refine once
  float d = depthAt(uv);
  vec2 off = m * (d - 0.35) * 0.035 * uStrength;
  d = depthAt(uv - off);
  off = m * (d - 0.35) * 0.035 * uStrength;
  vec2 suv = clamp(uv - off, 0.001, 0.999);
  vec3 col = texture2D(uImg, suv).rgb;

  // subtle rim light on the side facing the cursor
  float rim = smoothstep(0.15, 0.6, d) * (1.0 - smoothstep(0.6, 1.0, d));
  col += vec3(0.82, 1.0, 0.0) * rim * max(0.0, (uv.x - 0.5) * 2.0 * m.x) * 0.08;

  // x-ray reveal
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  vec2 p = (vUv - uPointer) * asp;
  float ang = atan(p.y, p.x);
  float wob = 0.018 * sin(ang * 5.0 + uTime * 2.2) + 0.012 * sin(ang * 9.0 - uTime * 3.1);
  float radius = uReveal * (0.26 + wob);
  float mask = 1.0 - smoothstep(radius - 0.012, radius, length(p));

  if (mask > 0.0) {
    vec2 ruv = clamp(uv - off * 2.2, 0.001, 0.999);
    float r = texture2D(uImg, ruv + vec2(0.004, 0.0)).r;
    float g = texture2D(uImg, ruv).g;
    float b = texture2D(uImg, ruv - vec2(0.004, 0.0)).b;
    float l = dot(vec3(r, g, b), vec3(0.299, 0.587, 0.114));
    l = smoothstep(0.08, 0.85, l);
    vec3 duo = mix(vec3(0.07, 0.075, 0.06), vec3(0.824, 1.0, 0.0), l);
    float scan = 0.88 + 0.12 * sin(vUv.y * uRes.y * 0.9 - uTime * 6.0);
    float grain = (hash(vUv * uRes + uTime) - 0.5) * 0.08;
    duo = duo * scan + grain;
    float ring = smoothstep(radius - 0.012, radius - 0.004, length(p)) * mask;
    duo = mix(duo, vec3(0.824, 1.0, 0.0), ring);
    col = mix(col, duo, mask);
  }

  // vignette
  float v = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(1.0, 1.15)));
  col *= mix(0.7, 1.0, v);
  gl_FragColor = vec4(col, 1.0);
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
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
  return p;
}

function loadTexture(gl: WebGLRenderingContext, url: string, unit: number) {
  return new Promise<{ w: number; h: number }>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = url;
  });
}
