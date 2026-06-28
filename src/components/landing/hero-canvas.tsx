"use client";
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const NODE_COUNT = 65;
const CONNECT_DIST_SQ = 2.4 * 2.4;

function ParticleNet() {
  const groupRef = useRef<THREE.Group>(null);

  const { nodeGeo, lineGeo } = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      pts.push(
        (Math.random() - 0.5) * 9,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 3,
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
    groupRef.current.rotation.y = clock.elapsedTime * 0.04;
    groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.025) * 0.09;
  });

  const hasLines = lineGeo.attributes.position !== undefined;

  return (
    <group ref={groupRef}>
      <points geometry={nodeGeo}>
        <pointsMaterial
          size={0.07}
          color="#f59e0b"
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>
      {hasLines && (
        <lineSegments geometry={lineGeo}>
          <lineBasicMaterial color="#14b8a6" transparent opacity={0.13} />
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
      <ParticleNet />
    </Canvas>
  );
}
