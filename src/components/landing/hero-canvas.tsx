"use client";
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Aurora GLSL shaders ──────────────────────────────────────────────────────

const AURORA_VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const AURORA_FRAG = /* glsl */`
uniform float uTime;
varying vec2 vUv;

// Simplex 3D noise — Gustavson / McEwan (MIT)
vec3 mod289v3(vec3 x) { return x - floor(x*(1./289.))*289.; }
vec4 mod289v4(vec4 x) { return x - floor(x*(1./289.))*289.; }
vec4 permute(vec4 x){ return mod289v4(((x*34.)+1.)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314*r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1./6., 1./3.);
  const vec4 D = vec4(0., 0.5, 1., 2.);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g  = step(x0.yzx, x0.xyz);
  vec3 l  = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289v3(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.,i1.z,i2.z,1.))
    + i.y + vec4(0.,i1.y,i2.y,1.))
    + i.x + vec4(0.,i1.x,i2.x,1.));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j  = p - 49. * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7. * x_);
  vec4 x  = x_ * ns.x + ns.yyyy;
  vec4 y  = y_ * ns.x + ns.yyyy;
  vec4 h  = 1. - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2. + 1.;
  vec4 s1 = floor(b1)*2. + 1.;
  vec4 sh = -step(h, vec4(0.));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.);
  m = m * m;
  return 42. * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

// Fractal Brownian Motion — 4 octaves
float fbm(vec3 p) {
  float v = 0., a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * snoise(p);
    p  = p * 2.1 + vec3(5.2, 1.3, 7.9);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.12;

  // Domain warping — sample fBm at a fBm-displaced position
  vec3 q = vec3(uv + vec2(0.1, 0.9), t);
  float f = fbm(q + fbm(q + fbm(q)));

  // Brand palette: saffron #f59e0b, teal #14b8a6, indigo #6366f1
  vec3 saffron = vec3(0.96, 0.62, 0.04);
  vec3 teal    = vec3(0.08, 0.72, 0.65);
  vec3 indigo  = vec3(0.39, 0.40, 0.95);

  vec3 col = mix(saffron, teal,   clamp(f * 1.5,         0.0, 1.0));
  col       = mix(col,    indigo, clamp((f - 0.15) * 2.0, 0.0, 1.0));

  // Dark base — aurora is a subtle glow, not a full takeover
  col = mix(vec3(0.04, 0.04, 0.06), col, 0.45);

  gl_FragColor = vec4(col, 1.0);
}
`;

// ── Aurora plane — full-screen quad behind particle net ──────────────────────

function AuroraBackground() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh position={[0, 0, -3]}>
      <planeGeometry args={[24, 16]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={AURORA_VERT}
        fragmentShader={AURORA_FRAG}
        uniforms={uniforms}
      />
    </mesh>
  );
}

// ── Particle network (kept as foreground layer) ───────────────────────────────

const NODE_COUNT = 55;
const CONNECT_DIST_SQ = 2.2 * 2.2;

function ParticleNet() {
  const groupRef = useRef<THREE.Group>(null);

  const { nodeGeo, lineGeo } = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      pts.push(
        (Math.random() - 0.5) * 9,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 2,
      );
    }

    const lines: number[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const dx = pts[i * 3] - pts[j * 3];
        const dy = pts[i * 3 + 1] - pts[j * 3 + 1];
        const dz = pts[i * 3 + 2] - pts[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < CONNECT_DIST_SQ) {
          lines.push(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]);
          lines.push(pts[j * 3], pts[j * 3 + 1], pts[j * 3 + 2]);
        }
      }
    }

    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));

    const lineGeo = new THREE.BufferGeometry();
    if (lines.length > 0) {
      lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(lines), 3));
    }

    return { nodeGeo, lineGeo };
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.elapsedTime * 0.035;
    groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.022) * 0.08;
  });

  const hasLines = lineGeo.attributes.position !== undefined;

  return (
    <group ref={groupRef}>
      <points geometry={nodeGeo}>
        <pointsMaterial size={0.065} color="#f59e0b" transparent opacity={0.55} sizeAttenuation />
      </points>
      {hasLines && (
        <lineSegments geometry={lineGeo}>
          <lineBasicMaterial color="#14b8a6" transparent opacity={0.1} />
        </lineSegments>
      )}
    </group>
  );
}

export function HeroCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 55 }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true }}
      aria-hidden="true"
    >
      <AuroraBackground />
      <ParticleNet />
    </Canvas>
  );
}
