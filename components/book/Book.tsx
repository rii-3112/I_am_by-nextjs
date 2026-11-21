'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { buildPageGeometry, deformPage, stackHeight } from './deform';
import {
  COVER_H,
  COVER_W,
  LEAF_COUNT,
  PAGE_H,
  PAGE_W,
  viewCenterZ,
} from './metrics';
import type { FlagRef, NumberRef } from './refs';
import SeasonFall from './SeasonFall';
import type { BookTextures, LineHit } from './textures';

export type { FlagRef, NumberRef };

type SceneProps = {
  textures: BookTextures;
  targetRef: NumberRef;
  reduceRef: FlagRef;
  narrowRef: FlagRef;
  linkLayerRef: { current: HTMLDivElement | null };
  onSpread: (index: number) => void;
};

function fitCamera(
  camera: THREE.Camera,
  width: number,
  height: number,
  narrow: boolean
) {
  if (!(camera instanceof THREE.OrthographicCamera)) return;
  const padX = narrow ? 0.22 : 0.36;
  const padY = narrow ? 0.28 : 0.7;
  camera.zoom = Math.min(
    width / (COVER_W * 2 + padX),
    height / (COVER_H + padY)
  );
  camera.up.set(0, 0, -1);
  camera.position.set(0, 12, 0);
  camera.lookAt(0, 0, viewCenterZ(narrow));
  camera.updateProjectionMatrix();
}

function CameraRig({ narrowRef }: { narrowRef: FlagRef }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  useLayoutEffect(() => {
    fitCamera(camera, size.width, size.height, narrowRef.current);
  }, [camera, narrowRef, size.height, size.width]);

  useFrame((state) => {
    fitCamera(
      state.camera,
      state.size.width,
      state.size.height,
      narrowRef.current
    );
  });

  return null;
}

function TuneTextures({ textures }: { textures: BookTextures }) {
  const gl = useThree((state) => state.gl);

  useLayoutEffect(() => {
    const max = gl.capabilities.getMaxAnisotropy();
    const maps = [
      textures.wood,
      textures.shadow,
      textures.last,
      ...textures.leaves.flatMap((leaf) => [leaf.front, leaf.back]),
    ];
    for (const map of maps) map.anisotropy = max;
  }, [gl, textures]);

  return null;
}

function Leaf({
  index,
  front,
  back,
  width,
  height,
  curl,
  smoothRef,
  reduceRef,
}: {
  index: number;
  front: THREE.Texture;
  back: THREE.Texture;
  width: number;
  height: number;
  curl: number;
  smoothRef: NumberRef;
  reduceRef: FlagRef;
}) {
  const geom = useMemo(() => buildPageGeometry(width, height), [width, height]);
  const frontMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: front,
        roughness: index === 0 ? 0.74 : 0.96,
        metalness: 0,
        side: THREE.FrontSide,
      }),
    [front, index]
  );
  const backMat = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      map: back,
      roughness: 0.96,
      metalness: 0,
      side: THREE.BackSide,
    });
    material.polygonOffset = true;
    material.polygonOffsetFactor = 1;
    material.polygonOffsetUnits = 1;
    return material;
  }, [back]);

  useLayoutEffect(() => {
    return () => {
      geom.dispose();
      frontMat.dispose();
      backMat.dispose();
    };
  }, [backMat, frontMat, geom]);

  useFrame(() => {
    const progress = THREE.MathUtils.clamp(smoothRef.current - index, 0, 1);
    const strength = curl * (reduceRef.current ? 0.18 : 1);
    deformPage(
      geom,
      width,
      progress,
      strength,
      stackHeight(index, progress, LEAF_COUNT)
    );
  });

  return (
    <group>
      <mesh geometry={geom} material={frontMat} frustumCulled={false} />
      <mesh geometry={geom} material={backMat} frustumCulled={false} />
    </group>
  );
}

function BookModel({
  textures,
  smoothRef,
  reduceRef,
}: {
  textures: BookTextures;
  smoothRef: NumberRef;
  reduceRef: FlagRef;
}) {
  const group = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const edge = useRef<THREE.MeshBasicMaterial>(null);
  const lastGeom = useMemo(() => buildPageGeometry(PAGE_W, PAGE_H), []);
  const lastMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: textures.last,
        roughness: 0.96,
        metalness: 0,
      }),
    [textures.last]
  );

  useLayoutEffect(() => {
    return () => {
      lastGeom.dispose();
      lastMat.dispose();
    };
  }, [lastGeom, lastMat]);

  useFrame(() => {
    const open = THREE.MathUtils.smoothstep(smoothRef.current, 0, 1);
    if (group.current) {
      group.current.position.x = THREE.MathUtils.lerp(-COVER_W / 2, 0, open);
    }
    if (shadow.current) {
      shadow.current.position.set(
        THREE.MathUtils.lerp(COVER_W / 2, 0, open),
        0.004,
        0
      );
      shadow.current.scale.x = THREE.MathUtils.lerp(1, 1.92, open);
    }
    if (edge.current) {
      edge.current.opacity =
        1 - THREE.MathUtils.smoothstep(smoothRef.current, 0.02, 0.2);
    }
  });

  return (
    <group ref={group}>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.85, 2.35]} />
        <meshBasicMaterial
          map={textures.shadow}
          transparent
          depthWrite={false}
        />
      </mesh>
      <mesh position={[COVER_W + 0.012, 0.03, 0]}>
        <boxGeometry args={[0.02, 0.014, PAGE_H * 0.98]} />
        <meshBasicMaterial ref={edge} color="#f4efe4" transparent />
      </mesh>
      <mesh position={[-0.022, 0.02, 0]}>
        <boxGeometry args={[0.04, 0.016, COVER_H]} />
        <meshStandardMaterial color="#143028" roughness={0.8} />
      </mesh>
      <mesh
        geometry={lastGeom}
        material={lastMat}
        position={[0, 0.012, 0]}
        frustumCulled={false}
      />
      {textures.leaves.map((leaf, index) => (
        <Leaf
          key={leaf.id}
          index={index}
          front={leaf.front}
          back={leaf.back}
          width={index === 0 ? COVER_W : PAGE_W}
          height={index === 0 ? COVER_H : PAGE_H}
          curl={index === 0 ? 0.12 : 0.34}
          smoothRef={smoothRef}
          reduceRef={reduceRef}
        />
      ))}
    </group>
  );
}

function WorkLinkLayer({
  hits,
  smoothRef,
  linkLayerRef,
}: {
  hits: LineHit[];
  smoothRef: NumberRef;
  linkLayerRef: { current: HTMLDivElement | null };
}) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const point = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const layer = linkLayerRef.current;
    if (!layer) return;
    const progress = THREE.MathUtils.clamp(
      smoothRef.current - (LEAF_COUNT - 1),
      0,
      1
    );
    const show = progress > 0.92;
    const open = THREE.MathUtils.smoothstep(smoothRef.current, 0, 1);
    const originX = THREE.MathUtils.lerp(-COVER_W / 2, 0, open);
    const angle = Math.PI * progress;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (const child of layer.children) {
      if (!(child instanceof HTMLAnchorElement)) continue;
      const hit = hits.find((item) => item.href === child.getAttribute('href'));
      if (!show || !hit) {
        child.style.display = 'none';
        continue;
      }
      const xOuter = (1 - hit.x) * PAGE_W;
      const xInner = (1 - (hit.x + hit.w)) * PAGE_W;
      const zTop = -PAGE_H / 2 + hit.y * PAGE_H;
      const zBottom = -PAGE_H / 2 + (hit.y + hit.h) * PAGE_H;
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      for (const x0 of [xOuter, xInner]) {
        for (const z0 of [zTop, zBottom]) {
          point.set(x0 * cos + originX, x0 * sin, z0);
          point.project(camera);
          const px = (point.x * 0.5 + 0.5) * size.width;
          const py = (-point.y * 0.5 + 0.5) * size.height;
          minX = Math.min(minX, px);
          minY = Math.min(minY, py);
          maxX = Math.max(maxX, px);
          maxY = Math.max(maxY, py);
        }
      }
      child.style.display = 'block';
      child.style.left = `${minX}px`;
      child.style.top = `${minY}px`;
      child.style.width = `${Math.max(0, maxX - minX)}px`;
      child.style.height = `${Math.max(0, maxY - minY)}px`;
    }
  });

  return null;
}

export default function BookScene({
  textures,
  targetRef,
  reduceRef,
  narrowRef,
  linkLayerRef,
  onSpread,
}: SceneProps) {
  const smoothRef = useRef(0);
  const spreadRef = useRef(-1);

  useFrame((_, delta) => {
    const target = targetRef.current;
    smoothRef.current = reduceRef.current
      ? target
      : THREE.MathUtils.damp(smoothRef.current, target, 3.5, delta);
    if (Math.abs(smoothRef.current - target) < 0.0006) {
      smoothRef.current = target;
    }
    const spread = THREE.MathUtils.clamp(
      Math.round(smoothRef.current),
      0,
      LEAF_COUNT
    );
    if (spread !== spreadRef.current) {
      spreadRef.current = spread;
      onSpread(spread);
    }
  });

  return (
    <>
      <CameraRig narrowRef={narrowRef} />
      <WorkLinkLayer
        hits={textures.workHits}
        smoothRef={smoothRef}
        linkLayerRef={linkLayerRef}
      />
      <TuneTextures textures={textures} />
      <color attach="background" args={['#d4aa6c']} />
      <ambientLight intensity={0.88} color="#fff4e6" />
      <directionalLight
        position={[1.4, 9, 1.1]}
        intensity={1.05}
        color="#fffaf2"
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial
          map={textures.wood}
          roughness={0.92}
          metalness={0}
        />
      </mesh>
      <BookModel
        textures={textures}
        smoothRef={smoothRef}
        reduceRef={reduceRef}
      />
      <SeasonFall reduceRef={reduceRef} narrowRef={narrowRef} />
    </>
  );
}
