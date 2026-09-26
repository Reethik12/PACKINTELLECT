import * as THREE from 'three';
import { buildPackageAssembly } from '../src/components/3d/PackageAssemblyEngine';
import { V1_DEFAULT_SPEC } from '../src/data/mockData';
import { foodKnowledgeService } from '../src/services/foodKnowledgeService';

const spec = foodKnowledgeService.getPackagingSpecs('mango').v1;
console.log('SPEC:', {
  primary: spec.primaryPackagingType,
  secondary: spec.secondaryPackagingType,
  cushion: spec.cushionMaterial,
});

const assembly = buildPackageAssembly({
  foodId: 'mango',
  spec,
  isV2: false,
  viewMode: 'cutaway',
  cutawayFactor: 1.0,
  openFactor: 0,
  explodedOffset: 0,
});

function printGroup(name: string, grp: THREE.Group, indent = '  ') {
  console.log(`${indent}[Group: ${name}] pos: y=${grp.position.y.toFixed(3)}, children: ${grp.children.length}`);
  grp.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const mat = child.material as THREE.MeshStandardMaterial;
      const box = new THREE.Box3().setFromObject(child);
      const sz = new THREE.Vector3();
      box.getSize(sz);
      console.log(
        `${indent}  Mesh: name="${child.name}", geom=${child.geometry.type}, pos=(${child.position.x.toFixed(2)},${child.position.y.toFixed(2)},${child.position.z.toFixed(2)}), sz=(${sz.x.toFixed(2)},${sz.y.toFixed(2)},${sz.z.toFixed(2)}), color=0x${mat?.color?.getHexString?.()}`
      );
    }
  });
}

printGroup('primaryGroup', assembly.primaryGroup);
printGroup('cushionGroup', assembly.cushionGroup);
printGroup('secondaryGroup', assembly.secondaryGroup);
if (assembly.lidGroup) printGroup('lidGroup', assembly.lidGroup);
printGroup('foodGroup', assembly.foodGroup);
