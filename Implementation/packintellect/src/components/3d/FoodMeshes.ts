import * as THREE from 'three';
import { FoodId } from '../../types/packaging';

export function normalizeFoodId(foodId: string): string {
  const s = (foodId || '').toLowerCase().replace(/_/g, '-');
  if (s.includes('mango')) return 'mango';
  if (s.includes('cake')) return 'cake';
  if (s.includes('ghee') || s.includes('pickle') || s.includes('bottle') || s.includes('oil')) return 'bottle';
  if (s.includes('tomato')) return 'tomato';
  if (s.includes('apple')) return 'apple';
  if (s.includes('biscuit') || s.includes('cookie')) return 'biscuits';
  if (s.includes('strawberr')) return s.includes('frozen') ? 'strawberry-frozen' : 'strawberry';
  if (s.includes('banana')) return 'banana';
  if (s.includes('mushroom')) return 'mushroom';
  if (s.includes('egg')) return 'eggs';
  if (s.includes('salmon') || s.includes('fish')) return s.includes('frozen') ? 'salmon-frozen' : 'salmon';
  if (s.includes('avocado')) return 'avocado';
  if (s.includes('orange') || s.includes('citrus')) return 'orange';
  if (s.includes('date')) return 'dates-dried';
  if (s.includes('bread') || s.includes('sourdough')) return 'bread';
  if (s.includes('rice') || s.includes('poha')) return 'rice';
  if (s.includes('almond') || s.includes('nut') || s.includes('cashew') || s.includes('kaju')) return 'almonds';
  if (s.includes('dal') || s.includes('pulse') || s.includes('pea') || s.includes('lentil')) return 'dal';
  if (s.includes('atta') || s.includes('flour') || s.includes('wheat') || s.includes('powder') || s.includes('haldi')) return 'atta';
  if (s.includes('chip') || s.includes('namkeen')) return 'chips';
  if (s.includes('milk')) return 'milk';
  if (s.includes('paneer') || s.includes('cheese') || s.includes('tofu')) return 'paneer';
  if (s.includes('samosa')) return 'samosa';
  if (s.includes('chicken') || s.includes('meat') || s.includes('prawn')) return 'chicken';
  if (s.includes('pomegranate')) return 'pomegranate';
  if (s.includes('grape')) return 'grapes';
  if (s.includes('onion') || s.includes('potato') || s.includes('alu') || s.includes('bhindi')) return 'onion';
  if (s.includes('laddu') || s.includes('gulab') || s.includes('sweet')) return 'sweets';
  if (s.includes('coconut')) return 'coconut';
  return s;
}

export function createFoodMesh(foodId: FoodId): THREE.Group {
  const normKey = normalizeFoodId(foodId);
  const group = new THREE.Group();
  group.name = `food-${foodId}`;

  switch (normKey) {
    case 'mango': {
      // Ratnagiri Alphonso Mango: organic curved ellipsoid with characteristic taper & stem
      const geom = new THREE.SphereGeometry(1.0, 32, 32);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        // Elongate along Y
        y *= 1.45;
        // Asymmetric curve / hook at bottom
        if (y < 0) {
          x += Math.sin(-y * 0.9) * 0.35;
          const factor = 1 - (-y / 1.5) * 0.4;
          x *= factor;
          z *= factor;
        } else {
          // Broad shoulders
          x *= 1.05;
          z *= 0.95;
        }
        // Slight flattening on lateral side
        z *= 0.85;

        pos.setXYZ(i, x, y, z);
      }
      geom.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: 0xF59E0B, // Golden Alphonso
        roughness: 0.32,
        metalness: 0.05,
      });
      const mangoMesh = new THREE.Mesh(geom, mat);
      mangoMesh.castShadow = true;
      mangoMesh.receiveShadow = true;
      group.add(mangoMesh);

      // Mango reddish-orange blush patch on sunny side
      const blushGeom = new THREE.SphereGeometry(0.7, 24, 24);
      blushGeom.scale(0.8, 1.2, 0.4);
      const blushMat = new THREE.MeshStandardMaterial({
        color: 0xEA580C,
        transparent: true,
        opacity: 0.45,
        roughness: 0.4,
      });
      const blush = new THREE.Mesh(blushGeom, blushMat);
      blush.position.set(0.35, 0.3, 0.45);
      group.add(blush);

      // Mango stem
      const stemGeom = new THREE.CylinderGeometry(0.04, 0.06, 0.35, 12);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x4A3728, roughness: 0.8 });
      const stem = new THREE.Mesh(stemGeom, stemMat);
      stem.position.set(0, 1.45, 0);
      stem.rotation.z = -0.2;
      group.add(stem);

      // Tiny green leaf at stem
      const leafGeom = new THREE.ConeGeometry(0.12, 0.45, 8);
      leafGeom.scale(1, 1, 0.15);
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x2D5A27, roughness: 0.5 });
      const leaf = new THREE.Mesh(leafGeom, leafMat);
      leaf.position.set(0.1, 1.4, 0.05);
      leaf.rotation.z = 0.8;
      group.add(leaf);

      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'cake': {
      // Multi-layer artisan celebration cake with frosting and strawberry
      const cakeBaseGeom = new THREE.CylinderGeometry(1.2, 1.2, 1.1, 36);
      const cakeBaseMat = new THREE.MeshStandardMaterial({
        color: 0xFFFBEB, // Vanilla cream coating
        roughness: 0.45,
        metalness: 0.02,
      });
      const cakeBase = new THREE.Mesh(cakeBaseGeom, cakeBaseMat);
      cakeBase.position.y = 0.55;
      cakeBase.castShadow = true;
      group.add(cakeBase);

      // Middle berry jam seam
      const seamGeom = new THREE.CylinderGeometry(1.21, 1.21, 0.08, 36);
      const seamMat = new THREE.MeshStandardMaterial({ color: 0x9F1239, roughness: 0.3 });
      const seam = new THREE.Mesh(seamGeom, seamMat);
      seam.position.y = 0.55;
      group.add(seam);

      // Whipped cream decorative swirls around the top perimeter
      const swirlCount = 8;
      const swirlMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.25 });
      for (let i = 0; i < swirlCount; i++) {
        const angle = (i / swirlCount) * Math.PI * 2;
        const swirl = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.25, 12), swirlMat);
        swirl.position.set(Math.cos(angle) * 0.95, 1.15, Math.sin(angle) * 0.95);
        swirl.rotation.y = angle;
        group.add(swirl);
      }

      // Centerpiece glossy strawberry
      const berryGeom = new THREE.ConeGeometry(0.3, 0.5, 16);
      berryGeom.scale(1, 1, 0.8);
      const berryMat = new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.15, metalness: 0.1 });
      const berry = new THREE.Mesh(berryGeom, berryMat);
      berry.position.set(0, 1.35, 0);
      berry.rotation.x = Math.PI;
      group.add(berry);

      // Strawberry green leaves
      const starGeom = new THREE.CircleGeometry(0.22, 5);
      const starMat = new THREE.MeshStandardMaterial({ color: 0x15803D, side: THREE.DoubleSide });
      const star = new THREE.Mesh(starGeom, starMat);
      star.position.set(0, 1.36, 0);
      star.rotation.x = Math.PI / 2;
      group.add(star);

      // Cake gold board base
      const boardGeom = new THREE.CylinderGeometry(1.35, 1.35, 0.05, 36);
      const boardMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.7, roughness: 0.3 });
      const board = new THREE.Mesh(boardGeom, boardMat);
      board.position.y = 0.025;
      group.add(board);

      group.scale.set(0.75, 0.75, 0.75);
      group.position.y = -0.4;
      break;
    }

    case 'bottle': {
      // Artisanal flint glass bottle with virgin oil & label
      // Bottle body
      const bodyGeom = new THREE.CylinderGeometry(0.65, 0.65, 1.6, 28);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x86EFAC, // Pale sage glass
        transparent: true,
        opacity: 0.75,
        roughness: 0.05,
        metalness: 0.1,
      });
      const body = new THREE.Mesh(bodyGeom, glassMat);
      body.position.y = 0.8;
      body.castShadow = true;
      group.add(body);

      // Golden olive oil fluid inside
      const oilGeom = new THREE.CylinderGeometry(0.58, 0.58, 1.4, 24);
      const oilMat = new THREE.MeshStandardMaterial({
        color: 0xD97706,
        roughness: 0.2,
      });
      const oil = new THREE.Mesh(oilGeom, oilMat);
      oil.position.y = 0.75;
      group.add(oil);

      // Bottle shoulder
      const shoulderGeom = new THREE.ConeGeometry(0.65, 0.6, 28, 1, true);
      const shoulder = new THREE.Mesh(shoulderGeom, glassMat);
      shoulder.position.y = 1.9;
      group.add(shoulder);

      // Bottle neck
      const neckGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.7, 24);
      const neck = new THREE.Mesh(neckGeom, glassMat);
      neck.position.y = 2.45;
      group.add(neck);

      // Lip collar
      const collarGeom = new THREE.TorusGeometry(0.25, 0.05, 12, 24);
      const collar = new THREE.Mesh(collarGeom, glassMat);
      collar.position.y = 2.78;
      collar.rotation.x = Math.PI / 2;
      group.add(collar);

      // Cap / cork
      const capGeom = new THREE.CylinderGeometry(0.22, 0.22, 0.25, 20);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.7 });
      const cap = new THREE.Mesh(capGeom, capMat);
      cap.position.y = 2.9;
      group.add(cap);

      // Brand paper label on front
      const labelGeom = new THREE.CylinderGeometry(0.66, 0.66, 0.9, 28, 1, true, -Math.PI / 3, (2 * Math.PI) / 3);
      const labelMat = new THREE.MeshStandardMaterial({
        color: 0xFDFBF7,
        roughness: 0.6,
        side: THREE.DoubleSide,
      });
      const label = new THREE.Mesh(labelGeom, labelMat);
      label.position.y = 0.8;
      group.add(label);

      group.scale.set(0.65, 0.65, 0.65);
      group.position.y = -0.9;
      break;
    }

    case 'tomato': {
      // Vine Heirloom Tomato: ribbed oblate sphere with calyx & stem
      const geom = new THREE.SphereGeometry(1.0, 32, 32);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        // Oblate flattening along Y
        y *= 0.78;

        // 6 subtle lobe ribs
        const angle = Math.atan2(z, x);
        const rib = Math.sin(angle * 6) * 0.05;
        x += x * rib;
        z += z * rib;

        // Top stem indentation
        const distFromCenter = Math.sqrt(x * x + z * z);
        if (y > 0 && distFromCenter < 0.45) {
          y -= (0.45 - distFromCenter) * 0.4;
        }

        pos.setXYZ(i, x, y, z);
      }
      geom.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: 0xDC2626, // Ripe tomato crimson
        roughness: 0.18,
        metalness: 0.05,
      });
      const tomatoMesh = new THREE.Mesh(geom, mat);
      tomatoMesh.castShadow = true;
      group.add(tomatoMesh);

      // 5-Point star calyx (green leafy star on top)
      const calyxMat = new THREE.MeshStandardMaterial({ color: 0x15803D, roughness: 0.4, side: THREE.DoubleSide });
      for (let i = 0; i < 5; i++) {
        const sepalGeom = new THREE.ConeGeometry(0.12, 0.55, 6);
        sepalGeom.scale(1, 1, 0.2);
        const sepal = new THREE.Mesh(sepalGeom, calyxMat);
        const angle = (i / 5) * Math.PI * 2;
        sepal.position.set(Math.cos(angle) * 0.25, 0.65, Math.sin(angle) * 0.25);
        sepal.rotation.y = angle;
        sepal.rotation.x = Math.PI / 2 + 0.35;
        group.add(sepal);
      }

      // Curved vine stalk
      const stalkGeom = new THREE.CylinderGeometry(0.045, 0.05, 0.45, 10);
      const stalk = new THREE.Mesh(stalkGeom, calyxMat);
      stalk.position.set(0.05, 0.85, 0);
      stalk.rotation.z = -0.3;
      group.add(stalk);

      group.scale.set(0.9, 0.9, 0.9);
      break;
    }

    case 'apple': {
      // Honeycrisp Apple: indented top & bottom, crisp red blush
      const geom = new THREE.SphereGeometry(1.0, 32, 32);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        // Apple proportions (wider shoulders, tapering toward base)
        if (y < 0) {
          x *= 1.0 - (-y * 0.18);
          z *= 1.0 - (-y * 0.18);
        } else {
          x *= 1.08;
          z *= 1.08;
        }

        // Top stem indentation
        const rTop = Math.sqrt(x * x + z * z);
        if (y > 0.4 && rTop < 0.6) {
          y -= (0.6 - rTop) * 0.5;
        }

        // Bottom calyx indentation
        if (y < -0.4 && rTop < 0.5) {
          y += (0.5 - rTop) * 0.35;
        }

        pos.setXYZ(i, x, y, z);
      }
      geom.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: 0xDC2626, // Crisp Honeycrisp red
        roughness: 0.25,
        metalness: 0.03,
      });
      const appleMesh = new THREE.Mesh(geom, mat);
      appleMesh.castShadow = true;
      group.add(appleMesh);

      // Yellow-green gradient speckle on apple cheek
      const cheekGeom = new THREE.SphereGeometry(0.7, 20, 20);
      cheekGeom.scale(0.8, 1.1, 0.3);
      const cheekMat = new THREE.MeshStandardMaterial({
        color: 0xEAB308,
        transparent: true,
        opacity: 0.45,
        roughness: 0.3,
      });
      const cheek = new THREE.Mesh(cheekGeom, cheekMat);
      cheek.position.set(-0.4, 0.1, 0.45);
      group.add(cheek);

      // Wooden apple stem
      const stemGeom = new THREE.CylinderGeometry(0.03, 0.04, 0.5, 10);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x3E2723, roughness: 0.8 });
      const stem = new THREE.Mesh(stemGeom, stemMat);
      stem.position.set(0.02, 0.95, 0);
      stem.rotation.z = -0.15;
      group.add(stem);

      // Leaf
      const leafGeom = new THREE.ConeGeometry(0.12, 0.4, 8);
      leafGeom.scale(1, 1, 0.2);
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x16A34A, roughness: 0.5 });
      const leaf = new THREE.Mesh(leafGeom, leafMat);
      leaf.position.set(0.15, 0.95, 0.05);
      leaf.rotation.z = 0.9;
      group.add(leaf);

      group.scale.set(0.88, 0.88, 0.88);
      break;
    }

    case 'biscuits': {
      // Stack of 3 buttery shortbread biscuits with perforated holes
      const biscuitCount = 3;
      const biscuitGeom = new THREE.CylinderGeometry(1.0, 1.0, 0.22, 32);
      const biscuitMat = new THREE.MeshStandardMaterial({
        color: 0xE2A860, // Baked golden butter
        roughness: 0.8,
        metalness: 0.02,
      });

      for (let b = 0; b < biscuitCount; b++) {
        const bMesh = new THREE.Mesh(biscuitGeom, biscuitMat);
        bMesh.position.y = b * 0.26 - 0.26;
        bMesh.rotation.y = b * 0.4;
        bMesh.castShadow = true;
        group.add(bMesh);

        // Perforated stamp holes on top face of each biscuit
        const holeMat = new THREE.MeshBasicMaterial({ color: 0x78350F });
        for (let h = 0; h < 6; h++) {
          const angle = (h / 6) * Math.PI * 2;
          const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8), holeMat);
          hole.position.set(
            Math.cos(angle) * 0.55,
            b * 0.26 - 0.26 + 0.115,
            Math.sin(angle) * 0.55
          );
          group.add(hole);
        }
      }

      // Protective glassine paper base liner
      const paperGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.02, 28);
      const paperMat = new THREE.MeshStandardMaterial({
        color: 0xFAF8F5,
        roughness: 0.9,
      });
      const paper = new THREE.Mesh(paperGeom, paperMat);
      paper.position.y = -0.4;
      group.add(paper);

      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'strawberry': {
      // Conical strawberry with green leaves and yellow achene seeds
      const berryGeom = new THREE.ConeGeometry(0.85, 1.4, 32);
      // Round the cone top
      const bPos = berryGeom.attributes.position;
      for (let i = 0; i < bPos.count; i++) {
        let x = bPos.getX(i);
        let y = bPos.getY(i);
        let z = bPos.getZ(i);
        if (y < 0) {
          const factor = Math.cos((-y / 0.7) * 0.5);
          x *= factor;
          z *= factor;
        }
        bPos.setXYZ(i, x, y, z);
      }
      berryGeom.computeVertexNormals();
      const berryMat = new THREE.MeshStandardMaterial({
        color: 0xDC2626,
        roughness: 0.28,
        metalness: 0.05,
      });
      const berry = new THREE.Mesh(berryGeom, berryMat);
      berry.rotation.x = Math.PI; // point down
      berry.position.y = 0.2;
      group.add(berry);

      // Calyx green leaves
      const leafCount = 6;
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.45 });
      for (let i = 0; i < leafCount; i++) {
        const angle = (i / leafCount) * Math.PI * 2;
        const lGeom = new THREE.ConeGeometry(0.18, 0.65, 8);
        lGeom.scale(1, 1, 0.2);
        const leaf = new THREE.Mesh(lGeom, leafMat);
        leaf.position.set(Math.cos(angle) * 0.45, 0.92, Math.sin(angle) * 0.45);
        leaf.rotation.z = Math.cos(angle) * 0.7;
        leaf.rotation.x = Math.sin(angle) * 0.7;
        group.add(leaf);
      }
      // Stem
      const sGeom = new THREE.CylinderGeometry(0.05, 0.06, 0.35, 8);
      const sMat = new THREE.MeshStandardMaterial({ color: 0x14532D, roughness: 0.7 });
      const stem = new THREE.Mesh(sGeom, sMat);
      stem.position.y = 1.08;
      group.add(stem);

      group.scale.set(0.9, 0.9, 0.9);
      break;
    }

    case 'banana': {
      // Curved yellow banana cluster
      const banMat = new THREE.MeshStandardMaterial({ color: 0xFBBF24, roughness: 0.35 });
      const tipMat = new THREE.MeshStandardMaterial({ color: 0x451A03, roughness: 0.8 });

      // Create 3 curved banana fingers
      [-0.4, 0, 0.4].forEach((xOff, idx) => {
        const finger = new THREE.Group();
        const curve = new THREE.CubicBezierCurve3(
          new THREE.Vector3(0, -0.9, -0.2),
          new THREE.Vector3(0.15, -0.1, 0.4),
          new THREE.Vector3(-0.05, 0.6, 0.3),
          new THREE.Vector3(0, 1.1, -0.1)
        );
        const tubeGeom = new THREE.TubeGeometry(curve, 24, 0.22, 10, false);
        const tube = new THREE.Mesh(tubeGeom, banMat);
        finger.add(tube);

        // Brown tip
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), tipMat);
        tip.position.set(0, -0.92, -0.2);
        finger.add(tip);

        finger.position.set(xOff, 0, (idx === 1 ? 0.15 : 0));
        finger.rotation.z = (idx - 1) * -0.22;
        group.add(finger);
      });

      // Crown base connecting fingers
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.3, 16), tipMat);
      crown.position.set(0, 1.15, -0.05);
      group.add(crown);

      group.scale.set(0.75, 0.75, 0.75);
      break;
    }

    case 'mushroom': {
      // Portobello mushroom cap with gills & trimmed stem
      const capGeom = new THREE.SphereGeometry(1.2, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.55);
      capGeom.scale(1.15, 0.42, 1.15);
      const capMat = new THREE.MeshStandardMaterial({
        color: 0x78350F,
        roughness: 0.75,
      });
      const cap = new THREE.Mesh(capGeom, capMat);
      cap.position.y = 0.35;
      group.add(cap);

      // Underside gills
      const gillGeom = new THREE.CylinderGeometry(1.2, 0.5, 0.12, 32);
      const gillMat = new THREE.MeshStandardMaterial({ color: 0x451A03, roughness: 0.9 });
      const gills = new THREE.Mesh(gillGeom, gillMat);
      gills.position.y = 0.32;
      group.add(gills);

      // Thick stalk/stem
      const stemGeom = new THREE.CylinderGeometry(0.32, 0.38, 0.65, 16);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0xF5F5F4, roughness: 0.6 });
      const stem = new THREE.Mesh(stemGeom, stemMat);
      stem.position.y = 0.05;
      group.add(stem);

      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'eggs': {
      // Molded egg tray holding 6 eggs
      const trayGeom = new THREE.BoxGeometry(2.1, 0.35, 1.4);
      const trayMat = new THREE.MeshStandardMaterial({ color: 0xD6D3D1, roughness: 0.95 });
      const tray = new THREE.Mesh(trayGeom, trayMat);
      tray.position.y = -0.3;
      group.add(tray);

      const eggMat = new THREE.MeshStandardMaterial({ color: 0xFDE68A, roughness: 0.4 });
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
          const eggGeom = new THREE.SphereGeometry(0.32, 24, 24);
          eggGeom.scale(1, 1.35, 1);
          const egg = new THREE.Mesh(eggGeom, eggMat);
          egg.position.set((c - 1) * 0.65, 0.05, (r - 0.5) * 0.65);
          group.add(egg);
        }
      }

      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'salmon': {
      // Atlantic salmon fillet steak with fat striations
      const salmonGeom = new THREE.BoxGeometry(2.2, 0.32, 0.95);
      const salmonMat = new THREE.MeshStandardMaterial({
        color: 0xFB7185, // Coral pink salmon
        roughness: 0.38,
        metalness: 0.05,
      });
      const steak = new THREE.Mesh(salmonGeom, salmonMat);
      group.add(steak);

      // Silver skin on underside
      const skinGeom = new THREE.BoxGeometry(2.21, 0.04, 0.96);
      const skinMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.6, roughness: 0.3 });
      const skin = new THREE.Mesh(skinGeom, skinMat);
      skin.position.y = -0.16;
      group.add(skin);

      // Fat striation bands
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.5 });
      for (let i = -3; i <= 3; i++) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.33, 0.96), stripeMat);
        stripe.position.set(i * 0.28, 0, 0);
        group.add(stripe);
      }

      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'strawberry-frozen': {
      // Frozen IQF strawberries with frosty crystalline coating
      const geom = new THREE.ConeGeometry(0.85, 1.4, 24);
      geom.rotateX(Math.PI);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);
        if (y < 0) {
          x *= 1.25;
          z *= 1.25;
        }
        pos.setXYZ(i, x, y, z);
      }
      geom.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: 0xE11D48, // Deep cryo red
        roughness: 0.25,
        metalness: 0.15,
      });
      const berry = new THREE.Mesh(geom, mat);
      group.add(berry);

      // Frosty ice crystal glaze overlay
      const frostMat = new THREE.MeshStandardMaterial({
        color: 0xE0F2FE,
        roughness: 0.1,
        metalness: 0.3,
        transparent: true,
        opacity: 0.45,
      });
      const frost = new THREE.Mesh(geom.clone(), frostMat);
      frost.scale.set(1.04, 1.04, 1.04);
      group.add(frost);
      group.scale.set(0.9, 0.9, 0.9);
      break;
    }

    case 'salmon-frozen': {
      // Blast-frozen Atlantic salmon fillet with icy frosted seal
      const salmonGeom = new THREE.BoxGeometry(2.2, 0.32, 0.95);
      const salmonMat = new THREE.MeshStandardMaterial({
        color: 0xF43F5E,
        roughness: 0.2,
        metalness: 0.1,
      });
      const steak = new THREE.Mesh(salmonGeom, salmonMat);
      group.add(steak);

      // Frost sheen
      const frostMat = new THREE.MeshStandardMaterial({
        color: 0xF0FDF4,
        transparent: true,
        opacity: 0.35,
        roughness: 0.15,
      });
      const frostMesh = new THREE.Mesh(new THREE.BoxGeometry(2.23, 0.34, 0.98), frostMat);
      group.add(frostMesh);
      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'avocado': {
      // Hass Avocado: organic pear shape with dark green pebbled skin
      const geom = new THREE.SphereGeometry(1.0, 32, 32);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);
        if (y > 0) {
          x *= 1 - (y / 1.0) * 0.35;
          z *= 1 - (y / 1.0) * 0.35;
          y *= 1.35;
        } else {
          x *= 1.1;
          z *= 1.1;
        }
        pos.setXYZ(i, x, y, z);
      }
      geom.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({
        color: 0x14532D,
        roughness: 0.65,
        metalness: 0.05,
      });
      const avo = new THREE.Mesh(geom, mat);
      group.add(avo);
      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'orange': {
      // Sicilian Blood Orange: sphere with dimpled texture
      const geom = new THREE.SphereGeometry(1.05, 32, 32);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xEA580C,
        roughness: 0.42,
        metalness: 0.05,
      });
      const orangeMesh = new THREE.Mesh(geom, mat);
      group.add(orangeMesh);

      // Green stem button / calyx
      const calyxGeom = new THREE.CylinderGeometry(0.08, 0.04, 0.15, 8);
      const calyxMat = new THREE.MeshStandardMaterial({ color: 0x15803D, roughness: 0.6 });
      const calyx = new THREE.Mesh(calyxGeom, calyxMat);
      calyx.position.y = 1.05;
      group.add(calyx);
      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'dates-dried': {
      // Medjool date: elongated wrinkly glossy amber fruit
      const geom = new THREE.CylinderGeometry(0.48, 0.52, 1.4, 20);
      geom.scale(1.0, 1.0, 0.85);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x78350F,
        roughness: 0.28,
        metalness: 0.1,
      });
      const dateMesh = new THREE.Mesh(geom, mat);
      group.add(dateMesh);
      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'bread': {
      // Artisanal sourdough boule: rounded domed loaf with scored crust
      const geom = new THREE.SphereGeometry(1.25, 32, 24);
      geom.scale(1.1, 0.65, 1.1);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xB45309,
        roughness: 0.75,
      });
      const loaf = new THREE.Mesh(geom, mat);
      group.add(loaf);

      // Score mark
      const scoreGeom = new THREE.TorusGeometry(0.65, 0.05, 8, 24, Math.PI);
      scoreGeom.rotateX(Math.PI / 2);
      const scoreMat = new THREE.MeshStandardMaterial({ color: 0xFDE68A, roughness: 0.9 });
      const score = new THREE.Mesh(scoreGeom, scoreMat);
      score.position.y = 0.68;
      group.add(score);
      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'rice': {
      // Aged Basmati Rice: vacuum brick pack
      const brickGeom = new THREE.BoxGeometry(1.6, 0.8, 1.2);
      const brickMat = new THREE.MeshStandardMaterial({
        color: 0xFEF08A,
        roughness: 0.5,
      });
      const brick = new THREE.Mesh(brickGeom, brickMat);
      group.add(brick);
      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'almonds': {
      // California Almonds: cluster of almond kernels
      const nutGeom = new THREE.SphereGeometry(0.4, 16, 16);
      nutGeom.scale(1.6, 0.6, 1.0);
      const nutMat = new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.5 });
      for (let i = 0; i < 5; i++) {
        const nut = new THREE.Mesh(nutGeom, nutMat);
        nut.position.set(((i % 3) - 1) * 0.45, Math.floor(i / 3) * 0.25, (((i * 2) % 3) - 1) * 0.35);
        nut.rotation.y = (i * Math.PI) / 4;
        group.add(nut);
      }
      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'chips':
    case 'potato_chips':
    case 'namkeen': {
      // Golden curved crisps
      const crispMat = new THREE.MeshStandardMaterial({
        color: 0xFBBF24,
        roughness: 0.55,
        side: THREE.DoubleSide,
      });
      for (let i = 0; i < 6; i++) {
        const crispGeom = new THREE.CylinderGeometry(0.45, 0.45, 0.04, 16, 1, false, 0, Math.PI);
        crispGeom.scale(1.2, 0.7, 1.0);
        const crisp = new THREE.Mesh(crispGeom, crispMat);
        crisp.position.set((i - 2.5) * 0.12, (i - 2.5) * 0.15, ((i % 2) - 0.5) * 0.18);
        crisp.rotation.set((i * 0.3), (i * 0.4), (i * 0.2));
        crisp.castShadow = true;
        group.add(crisp);
      }
      group.scale.set(0.88, 0.88, 0.88);
      break;
    }

    case 'milk': {
      // Fluid dairy column
      const milkMat = new THREE.MeshStandardMaterial({
        color: 0xFAFAFA,
        roughness: 0.2,
      });
      const milkGeom = new THREE.CylinderGeometry(0.55, 0.55, 1.4, 24);
      const milkMesh = new THREE.Mesh(milkGeom, milkMat);
      milkMesh.castShadow = true;
      group.add(milkMesh);
      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'paneer': {
      // Fresh dairy paneer cube
      const paneerMat = new THREE.MeshStandardMaterial({
        color: 0xF8FAFC,
        roughness: 0.6,
      });
      const paneerGeom = new THREE.BoxGeometry(1.2, 0.75, 1.2);
      const paneerMesh = new THREE.Mesh(paneerGeom, paneerMat);
      paneerMesh.castShadow = true;
      group.add(paneerMesh);
      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'chicken':
    case 'prawns': {
      // Fresh protein piece
      const meatMat = new THREE.MeshStandardMaterial({
        color: 0xFCA5A5,
        roughness: 0.45,
      });
      const meatGeom = new THREE.SphereGeometry(0.7, 24, 16);
      meatGeom.scale(1.4, 0.8, 0.9);
      const meatMesh = new THREE.Mesh(meatGeom, meatMat);
      meatMesh.castShadow = true;
      group.add(meatMesh);
      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'pomegranate': {
      // Bhagwa Pomegranate with ruby skin and calyx crown
      const pomMat = new THREE.MeshStandardMaterial({
        color: 0x991B1B,
        roughness: 0.35,
      });
      const pomGeom = new THREE.SphereGeometry(0.75, 24, 24);
      const pomMesh = new THREE.Mesh(pomGeom, pomMat);
      pomMesh.castShadow = true;
      group.add(pomMesh);
      // Calyx crown
      const crownGeom = new THREE.ConeGeometry(0.18, 0.25, 6);
      const crown = new THREE.Mesh(crownGeom, pomMat);
      crown.position.set(0, 0.82, 0);
      group.add(crown);
      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'grapes': {
      // Cluster of fresh spherical grapes
      const grapeMat = new THREE.MeshPhysicalMaterial({
        color: 0x84CC16,
        roughness: 0.15,
        transmission: 0.6,
        transparent: true,
        opacity: 0.9,
      });
      const grapeGeom = new THREE.SphereGeometry(0.22, 16, 16);
      for (let i = 0; i < 14; i++) {
        const grape = new THREE.Mesh(grapeGeom, grapeMat);
        const theta = (i / 14) * Math.PI * 4;
        const radius = 0.35 * (1 - i / 18);
        grape.position.set(Math.cos(theta) * radius, -0.4 + (i / 14) * 0.9, Math.sin(theta) * radius);
        grape.castShadow = true;
        group.add(grape);
      }
      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'onion': {
      // Red onion with papery outer peel
      const onionMat = new THREE.MeshStandardMaterial({
        color: 0x831843,
        roughness: 0.4,
      });
      const onionGeom = new THREE.SphereGeometry(0.72, 24, 24);
      onionGeom.scale(1.1, 0.9, 1.1);
      const onion = new THREE.Mesh(onionGeom, onionMat);
      onion.castShadow = true;
      group.add(onion);
      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'laddu':
    case 'sweets': {
      // Golden spherical confection
      const ladduMat = new THREE.MeshStandardMaterial({
        color: 0xF59E0B,
        roughness: 0.7,
      });
      for (let i = 0; i < 4; i++) {
        const laddu = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), ladduMat);
        laddu.position.set(((i % 2) - 0.5) * 0.75, 0, (Math.floor(i / 2) - 0.5) * 0.75);
        laddu.castShadow = true;
        group.add(laddu);
      }
      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'dal': {
      // Split Pigeon Pea / Pulses: sealed granular pouch with view window
      const pouchGeom = new THREE.BoxGeometry(1.2, 1.4, 0.7);
      const pouchMat = new THREE.MeshStandardMaterial({
        color: 0xE8A838, // Warm split dal yellow-amber
        roughness: 0.6,
      });
      const pouch = new THREE.Mesh(pouchGeom, pouchMat);
      pouch.castShadow = true;
      group.add(pouch);

      // Top sealed crimp
      const crimpGeom = new THREE.BoxGeometry(1.24, 0.12, 0.2);
      const crimpMat = new THREE.MeshStandardMaterial({ color: 0xB45309, roughness: 0.8 });
      const crimp = new THREE.Mesh(crimpGeom, crimpMat);
      crimp.position.set(0, 0.74, 0);
      group.add(crimp);

      // Transparent dal grain window showing yellow lentils inside
      const winGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.05, 16);
      winGeom.rotateX(Math.PI / 2);
      const winMat = new THREE.MeshStandardMaterial({
        color: 0xFDE047, // Golden split dal grains
        roughness: 0.3,
      });
      const windowMesh = new THREE.Mesh(winGeom, winMat);
      windowMesh.position.set(0, 0, 0.36);
      group.add(windowMesh);

      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'atta': {
      // Chakki Fresh Atta: sealed paper flour pack with folded top
      const sackGeom = new THREE.BoxGeometry(1.15, 1.35, 0.75);
      const sackMat = new THREE.MeshStandardMaterial({
        color: 0xF3E8D2, // Natural wheat flour paper sack
        roughness: 0.75,
      });
      const sack = new THREE.Mesh(sackGeom, sackMat);
      sack.castShadow = true;
      group.add(sack);

      // Top crimp seal
      const topSealGeom = new THREE.BoxGeometry(1.18, 0.15, 0.25);
      const topSealMat = new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.8 });
      const topSeal = new THREE.Mesh(topSealGeom, topSealMat);
      topSeal.position.set(0, 0.72, 0);
      group.add(topSeal);

      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'samosa': {
      // Golden fried crispy triangular pastry
      const coneGeom = new THREE.ConeGeometry(0.8, 0.9, 3);
      const pastryMat = new THREE.MeshStandardMaterial({
        color: 0xD97706, // Crispy golden pastry
        roughness: 0.65,
      });
      const samosa = new THREE.Mesh(coneGeom, pastryMat);
      samosa.rotation.x = Math.PI;
      samosa.castShadow = true;
      group.add(samosa);
      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    case 'coconut': {
      // Tender Green Shaved Coconut
      const cocoGeom = new THREE.CylinderGeometry(0.55, 0.75, 1.2, 16);
      const cocoMat = new THREE.MeshStandardMaterial({
        color: 0x65A30D, // Fresh green coconut husk
        roughness: 0.55,
      });
      const coco = new THREE.Mesh(cocoGeom, cocoMat);
      coco.castShadow = true;
      group.add(coco);

      // Trimmed conical cap
      const capGeom = new THREE.ConeGeometry(0.55, 0.45, 16);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xFDFBF7, roughness: 0.7 });
      const cap = new THREE.Mesh(capGeom, capMat);
      cap.position.set(0, 0.8, 0);
      group.add(cap);

      group.scale.set(0.85, 0.85, 0.85);
      break;
    }

    default: {
      // Procedural organic fallback geometry for any dynamic food
      const baseGeom = new THREE.SphereGeometry(0.9, 32, 32);
      baseGeom.scale(1.0, 1.15, 0.95);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0xF59E0B,
        roughness: 0.45,
      });
      const mesh = new THREE.Mesh(baseGeom, baseMat);
      mesh.castShadow = true;
      group.add(mesh);
      group.scale.set(0.85, 0.85, 0.85);
      break;
    }
  }

  return group;
}

export interface FoodCargoFit {
  scale: number;
  baseY: number;
  insertType: 'cradle' | 'collar' | 'bottle-bracket' | 'tomato-nest' | 'cell' | 'partition';
  cushionClearanceRadius: number;
  insertLabel: string;
}

export function getFoodCargoFit(foodId: FoodId, bottomSurfaceY: number = 0.155): FoodCargoFit {
  const normKey = normalizeFoodId(foodId);
  switch (normKey) {
    case 'mango':
      return {
        scale: 0.22,
        baseY: bottomSurfaceY + 0.275,
        insertType: 'cradle',
        cushionClearanceRadius: 0.32,
        insertLabel: 'Molded Pulp Bio-Cradle Tray',
      };
    case 'cake':
      return {
        scale: 0.31,
        baseY: bottomSurfaceY + 0.088,
        insertType: 'collar',
        cushionClearanceRadius: 0.38,
        insertLabel: 'Perimeter Cake Collar & Corner Dampers',
      };
    case 'bottle':
      return {
        scale: 0.36,
        baseY: bottomSurfaceY + 0.215,
        insertType: 'bottle-bracket',
        cushionClearanceRadius: 0.24,
        insertLabel: 'Dual-Tier Vertical Stabilizer Bracket',
      };
    case 'tomato':
      return {
        scale: 0.26,
        baseY: bottomSurfaceY + 0.185,
        insertType: 'tomato-nest',
        cushionClearanceRadius: 0.30,
        insertLabel: 'Molded Fiber Nested Cradle',
      };
    case 'apple':
      return {
        scale: 0.25,
        baseY: bottomSurfaceY + 0.225,
        insertType: 'cell',
        cushionClearanceRadius: 0.30,
        insertLabel: 'Cellular Pulp Depression Cup',
      };
    case 'biscuits':
      return {
        scale: 0.29,
        baseY: bottomSurfaceY + 0.100,
        insertType: 'partition',
        cushionClearanceRadius: 0.35,
        insertLabel: 'Rigid Buffer Partition Tray',
      };
    case 'strawberry':
      return {
        scale: 0.28,
        baseY: bottomSurfaceY + 0.180,
        insertType: 'tomato-nest',
        cushionClearanceRadius: 0.28,
        insertLabel: 'Vented Clamshell Soft Bio-Cushion',
      };
    case 'banana':
      return {
        scale: 0.24,
        baseY: bottomSurfaceY + 0.150,
        insertType: 'cradle',
        cushionClearanceRadius: 0.35,
        insertLabel: 'Contoured Cluster Suspension Cradle',
      };
    case 'mushroom':
      return {
        scale: 0.26,
        baseY: bottomSurfaceY + 0.140,
        insertType: 'cell',
        cushionClearanceRadius: 0.32,
        insertLabel: 'Breathable Hyphal Cap Depression Cup',
      };
    case 'eggs':
      return {
        scale: 0.27,
        baseY: bottomSurfaceY + 0.120,
        insertType: 'cell',
        cushionClearanceRadius: 0.34,
        insertLabel: 'Hex-Suspension Molded Pulp Egg Tray',
      };
    case 'salmon':
      return {
        scale: 0.28,
        baseY: bottomSurfaceY + 0.110,
        insertType: 'partition',
        cushionClearanceRadius: 0.34,
        insertLabel: 'Vacuum Skin Sealed Cryo-Gel Tray',
      };
    case 'salmon-frozen':
      return {
        scale: 0.28,
        baseY: bottomSurfaceY + 0.110,
        insertType: 'partition',
        cushionClearanceRadius: 0.34,
        insertLabel: 'Vacuum-Insulated Cryo-Gel Deep Freeze Tray',
      };
    case 'strawberry-frozen':
      return {
        scale: 0.28,
        baseY: bottomSurfaceY + 0.180,
        insertType: 'tomato-nest',
        cushionClearanceRadius: 0.28,
        insertLabel: 'Vacuum-Insulated Cryo-Cell Tray',
      };
    case 'avocado':
      return {
        scale: 0.24,
        baseY: bottomSurfaceY + 0.220,
        insertType: 'cradle',
        cushionClearanceRadius: 0.30,
        insertLabel: 'Contoured Molded Bio-Pulp Cradle',
      };
    case 'orange':
      return {
        scale: 0.24,
        baseY: bottomSurfaceY + 0.220,
        insertType: 'cell',
        cushionClearanceRadius: 0.30,
        insertLabel: 'Vented Micro-Flute Spherical Cup',
      };
    case 'dates-dried':
      return {
        scale: 0.26,
        baseY: bottomSurfaceY + 0.160,
        insertType: 'partition',
        cushionClearanceRadius: 0.32,
        insertLabel: 'Hermetic MVTR Barrier Pocket',
      };
    case 'bread':
      return {
        scale: 0.22,
        baseY: bottomSurfaceY + 0.180,
        insertType: 'cradle',
        cushionClearanceRadius: 0.35,
        insertLabel: 'Breathable Micro-Perforated Boule Cradle',
      };
    case 'rice':
    case 'almonds':
    case 'chips':
    case 'potato_chips':
    case 'namkeen':
      return {
        scale: 0.26,
        baseY: bottomSurfaceY + 0.150,
        insertType: 'partition',
        cushionClearanceRadius: 0.32,
        insertLabel: 'Barrier Pouch Stabilizer',
      };
    case 'milk':
      return {
        scale: 0.28,
        baseY: bottomSurfaceY + 0.180,
        insertType: 'bottle-bracket',
        cushionClearanceRadius: 0.35,
        insertLabel: 'Aseptic Carton Collar',
      };
    case 'paneer':
    case 'chicken':
    case 'prawns':
      return {
        scale: 0.25,
        baseY: bottomSurfaceY + 0.160,
        insertType: 'cradle',
        cushionClearanceRadius: 0.30,
        insertLabel: 'Insulated Cold-Chain Pocket',
      };
    case 'pomegranate':
    case 'grapes':
    case 'onion':
      return {
        scale: 0.26,
        baseY: bottomSurfaceY + 0.160,
        insertType: 'cradle',
        cushionClearanceRadius: 0.30,
        insertLabel: 'Ventilated Cell Pocket',
      };
    case 'laddu':
    case 'sweets':
      return {
        scale: 0.24,
        baseY: bottomSurfaceY + 0.140,
        insertType: 'cell',
        cushionClearanceRadius: 0.28,
        insertLabel: 'Molded Sweet Cavity Tray',
      };
    case 'dal':
      return {
        scale: 0.28,
        baseY: bottomSurfaceY + 0.160,
        insertType: 'partition',
        cushionClearanceRadius: 0.30,
        insertLabel: 'Dry Pulse Barrier Pouch Stabilizer',
      };
    case 'atta':
      return {
        scale: 0.28,
        baseY: bottomSurfaceY + 0.160,
        insertType: 'partition',
        cushionClearanceRadius: 0.32,
        insertLabel: 'Flour Pack Compression Buffer',
      };
    case 'samosa':
      return {
        scale: 0.25,
        baseY: bottomSurfaceY + 0.140,
        insertType: 'cradle',
        cushionClearanceRadius: 0.28,
        insertLabel: 'Molded Fiber Nested Cradle',
      };
    case 'coconut':
      return {
        scale: 0.26,
        baseY: bottomSurfaceY + 0.180,
        insertType: 'cell',
        cushionClearanceRadius: 0.32,
        insertLabel: 'Tender Coconut Cell Pocket',
      };
    default:
      return {
        scale: 0.25,
        baseY: bottomSurfaceY + 0.200,
        insertType: 'cradle',
        cushionClearanceRadius: 0.30,
        insertLabel: 'Molded Protective Insert',
      };
  }
}
