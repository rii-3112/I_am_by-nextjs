'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { viewCenterZ } from './metrics';
import type { FlagRef } from './refs';

type Season = 'spring' | 'autumn';

type Bounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

type Flake = {
  x: number;
  z: number;
  phase: number;
  speed: number;
  drift: number;
  spin: number;
  scale: number;
  yaw: number;
  mesh: THREE.Mesh | null;
};

type Pose = {
  q: THREE.Quaternion;
  yaw: THREE.Quaternion;
  flat: THREE.Quaternion;
  rock: THREE.Quaternion;
  axis: THREE.Vector3;
  up: THREE.Vector3;
};

function createFlake(): Flake {
  return {
    x: 0,
    z: 0,
    phase: 0,
    speed: 0.1,
    drift: 0.04,
    spin: 0,
    scale: 0.1,
    yaw: 0,
    mesh: null,
  };
}

function createPose(): Pose {
  return {
    q: new THREE.Quaternion(),
    yaw: new THREE.Quaternion(),
    flat: new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      -Math.PI / 2
    ),
    rock: new THREE.Quaternion(),
    axis: new THREE.Vector3(1, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
  };
}

const COUNT: Record<Season, number> = {
  spring: 8,
  autumn: 6,
};

function seasonOf(date: Date): Season | null {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 9 && month <= 11) return 'autumn';
  return null;
}

function canvas2d() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  return ctx;
}

function drawPetal(ctx: CanvasRenderingContext2D, color: string) {
  ctx.save();
  ctx.translate(64, 62);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.bezierCurveTo(-30, 16, -28, -16, -9, -38);
  ctx.bezierCurveTo(-3, -24, 3, -24, 9, -38);
  ctx.bezierCurveTo(28, -16, 30, 16, 0, 40);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 28);
  ctx.quadraticCurveTo(2, 0, 0, -22);
  ctx.stroke();
  ctx.restore();
}

function drawMaple(ctx: CanvasRenderingContext2D, color: string) {
  ctx.save();
  ctx.translate(64, 58);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -46);
  ctx.bezierCurveTo(6, -34, 16, -40, 18, -26);
  ctx.bezierCurveTo(24, -34, 38, -28, 30, -14);
  ctx.bezierCurveTo(42, -10, 40, 4, 26, 2);
  ctx.bezierCurveTo(32, 14, 18, 16, 14, 6);
  ctx.bezierCurveTo(12, 22, 2, 16, 0, 8);
  ctx.bezierCurveTo(-2, 16, -12, 22, -14, 6);
  ctx.bezierCurveTo(-18, 16, -32, 14, -26, 2);
  ctx.bezierCurveTo(-40, 4, -42, -10, -30, -14);
  ctx.bezierCurveTo(-38, -28, -24, -34, -18, -26);
  ctx.bezierCurveTo(-16, -40, -6, -34, 0, -46);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(110, 36, 16, 0.4)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(1, 46);
  ctx.moveTo(0, 2);
  ctx.lineTo(0, -24);
  ctx.moveTo(-1, -6);
  ctx.lineTo(-14, -20);
  ctx.moveTo(1, -6);
  ctx.lineTo(14, -20);
  ctx.stroke();
  ctx.restore();
}

function makeTexture(season: Season, variant: number) {
  const ctx = canvas2d();
  if (season === 'spring') {
    const colors = ['#f0a9bf', '#e98aaa', '#f6d0db'];
    drawPetal(ctx, colors[variant] ?? colors[0]);
  } else {
    const colors = ['#c44732', '#d86a2e', '#c9842e'];
    drawMaple(ctx, colors[variant] ?? colors[0]);
  }
  const texture = new THREE.CanvasTexture(ctx.canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = true;
  texture.needsUpdate = true;
  return texture;
}

function viewBounds(camera: THREE.Camera, narrow: boolean): Bounds {
  const centerZ = viewCenterZ(narrow);
  if (!(camera instanceof THREE.OrthographicCamera)) {
    return {
      left: -1.7,
      right: 1.7,
      top: centerZ - 1.5,
      bottom: centerZ + 1.5,
    };
  }
  const halfW = (camera.right - camera.left) / (2 * camera.zoom);
  const halfH = (camera.top - camera.bottom) / (2 * camera.zoom);
  return {
    left: -halfW,
    right: halfW,
    top: centerZ - halfH,
    bottom: centerZ + halfH,
  };
}

function resetFlake(
  flake: Flake,
  bounds: Bounds,
  season: Season,
  fromWindow: boolean
) {
  const spring = season === 'spring';
  flake.speed = spring
    ? 0.15 + Math.random() * 0.07
    : 0.09 + Math.random() * 0.05;
  flake.drift = 0.03 + Math.random() * 0.035;
  flake.spin = (Math.random() - 0.5) * (spring ? 0.7 : 0.28);
  flake.scale = spring
    ? 0.09 + Math.random() * 0.035
    : 0.22 + Math.random() * 0.08;
  flake.phase = Math.random() * Math.PI * 2;
  flake.yaw = Math.random() * Math.PI * 2;
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  flake.x = bounds.left + width * (0.04 + Math.random() * 0.52);
  flake.z = fromWindow
    ? bounds.top - (0.08 + Math.random() * 0.45)
    : bounds.top + Math.random() * height;
}

function Drift({
  season,
  reduceRef,
  narrowRef,
}: {
  season: Season;
  reduceRef: FlagRef;
  narrowRef: FlagRef;
}) {
  const camera = useThree((state) => state.camera);
  const elapsed = useRef(0);
  const seeded = useRef(false);
  const pose = useRef<Pose>(createPose());
  const flakes = useRef<Flake[]>(
    Array.from({ length: COUNT[season] }, createFlake)
  );
  const textures = useMemo(
    () => [0, 1, 2].map((variant) => makeTexture(season, variant)),
    [season]
  );
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const leaves = useMemo(
    () =>
      Array.from({ length: COUNT[season] }, (_, index) => ({
        id: `${season}-${index}`,
        variant: index % 3,
      })),
    [season]
  );

  useLayoutEffect(() => {
    return () => {
      geometry.dispose();
      for (const texture of textures) texture.dispose();
    };
  }, [geometry, textures]);

  useFrame((_, delta) => {
    const items = flakes.current;
    const rig = pose.current;
    if (reduceRef.current) {
      for (const flake of items) {
        if (flake.mesh) flake.mesh.visible = false;
      }
      return;
    }
    const step = Math.min(delta, 0.05);
    elapsed.current += step;
    const bounds = viewBounds(camera, narrowRef.current);
    const time = elapsed.current;
    for (const flake of items) {
      const mesh = flake.mesh;
      if (!mesh) continue;
      if (!seeded.current) resetFlake(flake, bounds, season, false);
      mesh.visible = true;
      flake.z += flake.speed * step;
      flake.x += flake.drift * step;
      flake.yaw += flake.spin * step;
      if (flake.z > bounds.bottom + 0.2) {
        resetFlake(flake, bounds, season, true);
      }
      const sway = Math.sin(time * 0.75 + flake.phase) * 0.16;
      mesh.position.set(flake.x + sway, 0.48, flake.z);
      mesh.scale.setScalar(flake.scale);
      const rock = Math.sin(time * 1.1 + flake.phase) * 0.42;
      rig.yaw.setFromAxisAngle(rig.up, flake.yaw);
      rig.rock.setFromAxisAngle(rig.axis, rock);
      rig.q.copy(rig.yaw).multiply(rig.flat).multiply(rig.rock);
      mesh.quaternion.copy(rig.q);
      const enter = THREE.MathUtils.smoothstep(
        flake.z,
        bounds.top - 0.02,
        bounds.top + 0.32
      );
      const exit =
        1 -
        THREE.MathUtils.smoothstep(
          flake.z,
          bounds.bottom - 0.34,
          bounds.bottom + 0.06
        );
      const material = mesh.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = 0.9 * enter * exit;
      }
    }
    seeded.current = true;
  });

  return (
    <group>
      {leaves.map((leaf, index) => (
        <mesh
          key={leaf.id}
          geometry={geometry}
          renderOrder={3}
          ref={(mesh) => {
            const flake = flakes.current[index];
            if (!flake) return;
            flake.mesh = mesh;
            if (mesh) mesh.raycast = () => {};
          }}
        >
          <meshBasicMaterial
            map={textures[leaf.variant]}
            transparent
            depthWrite={false}
            toneMapped={false}
            opacity={0}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function SeasonFall({
  reduceRef,
  narrowRef,
}: {
  reduceRef: FlagRef;
  narrowRef: FlagRef;
}) {
  const season = useMemo(() => seasonOf(new Date()), []);
  if (!season) return null;
  return <Drift season={season} reduceRef={reduceRef} narrowRef={narrowRef} />;
}
