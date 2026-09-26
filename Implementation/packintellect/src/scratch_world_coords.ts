import * as THREE from 'three';
import { buildPackageAssembly } from '../src/components/3d/PackageAssemblyEngine';
import { foodKnowledgeService } from '../src/services/foodKnowledgeService';

const spec = foodKnowledgeService.getPackagingSpecs('mango').v1;

const assembly = buildPackageAssembly({
  foodId: 'mango',
  spec,
  isV2: false,
  viewMode: 'cutaway',
  cutawayFactor: 1.0,
  openFactor: 0,
  explodedOffset: 0,
});

assembly.rootGroup.updateMatrixWorld(true);

assembly.rootGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    const worldBox = new THREE.Box3().setFromObject(child);
    const sz = new THREE.Vector3();
    worldBox.getSize(sz);
    const center = new THREE.Vector3();
    worldBox.getCenter(center);
    const mat = child.material as THREE.MeshStandardMaterial;
    console.log(`MESH [${child.name || 'unnamed'}]`);
    console.log(`  geom: ${child.geometry.type}`);
    console.log(`  visible: ${child.visible}, transparent: ${mat?.transparent}, opacity: ${mat?.opacity}`);
    console.log(`  color: 0x${mat?.color?.getHexString?.()}`);
    console.log(`  worldCenter: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`);
    console.log(`  worldSize:   (${sz.x.toFixed(2)}, ${sz.y.toFixed(2)}, ${sz.z.toFixed(2)})`);
    console.log(`  worldMin:    (${worldBox.min.x.toFixed(2)}, ${worldBox.min.y.toFixed(2)}, ${worldBox.min.z.toFixed(2)})`);
    console.log(`  worldMax:    (${worldBox.max.x.toFixed(2)}, ${worldBox.max.y.toFixed(2)}, ${worldBox.max.z.toFixed(2)})`);
    console.log('---');
  }
});
