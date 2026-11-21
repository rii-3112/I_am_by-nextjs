import * as THREE from 'three';

const SEGMENTS_X = 40;
const SEGMENTS_Y = 6;

export function buildPageGeometry(width: number, height: number) {
  const geom = new THREE.PlaneGeometry(width, height, SEGMENTS_X, SEGMENTS_Y);
  geom.rotateX(-Math.PI / 2);
  geom.translate(width / 2, 0, 0);
  geom.userData.base = new Float32Array(geom.attributes.position.array);
  return geom;
}

export function deformPage(
  geom: THREE.BufferGeometry,
  width: number,
  progress: number,
  curlStrength: number,
  yBias: number
) {
  const base = geom.userData.base as Float32Array;
  const pos = geom.attributes.position as THREE.BufferAttribute;
  const arr = pos.array as Float32Array;
  const p = THREE.MathUtils.clamp(progress, 0, 1);
  const wave = Math.sin(p * Math.PI);
  const lead = wave * curlStrength;

  for (let i = 0; i < pos.count; i++) {
    const x0 = base[i * 3];
    const z0 = base[i * 3 + 2];
    const u = width > 0 ? x0 / width : 0;
    const angle = Math.PI * p + lead * u * u;
    const lift = Math.sin(u * Math.PI) * wave * curlStrength * 0.08;
    arr[i * 3] = Math.cos(angle) * x0;
    arr[i * 3 + 1] = Math.sin(angle) * x0 + lift + yBias;
    arr[i * 3 + 2] = z0;
  }

  pos.needsUpdate = true;
  geom.computeVertexNormals();
}

export function stackHeight(index: number, progress: number, count: number) {
  const p = THREE.MathUtils.clamp(progress, 0, 1);
  const right = 0.02 + (count - index) * 0.012;
  const left = 0.02 + (index + 1) * 0.012;
  return THREE.MathUtils.lerp(right, left, p);
}
