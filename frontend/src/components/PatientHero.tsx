/**
 * PatientHero — "Dr. Cosmo" cartoon 3D character hero banner.
 *
 * Scene:
 *  • Dr. Cosmo — cartoon doctor built from Three.js primitives:
 *    head, hair, eyes, cheeks, smile, ears, neck, white coat, belt,
 *    scrub pants, legs, shoes, two arms (right waves), stethoscope
 *  • MeshToonMaterial + 4-band DataTexture → cel shading
 *  • Back-face outline trick on every body part
 *  • Floating crystal diamonds + medical plus signs
 *  • Background dust particles
 *  • Mouse parallax on camera
 *  • Theme-aware: reads --accent / --accent2 / --bg / --is-dark
 *  • Rebuilds when data-theme changes
 *  • Full GPU + event cleanup on unmount
 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Props {
  firstName?: string;
  progress?: number; // 0–1
  unread?: number;
}

const H = 320;
type Mode = 'dark' | 'light';

function detectMode(): Mode {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--is-dark').trim() === '1' ? 'dark' : 'light';
}

function getCSSColor(prop: string, fallback: number): THREE.Color {
  const c = new THREE.Color();
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
    if (v) c.set(v); else c.setHex(fallback);
  } catch { c.setHex(fallback); }
  return c;
}

export default function PatientHero({ firstName, progress = 0, unread = 0 }: Props) {
  const wrapRef     = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const [mode, setMode] = useState<Mode>(detectMode);

  useEffect(() => {
    const mo = new MutationObserver(() => setMode(detectMode()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const isDark = mode === 'dark';

    // ── Theme colors ──────────────────────────────────────────────
    const accentColor  = getCSSColor('--accent',  isDark ? 0xc084fc : 0x6366f1);
    const accent2Color = getCSSColor('--accent2', isDark ? 0x7c3aed : 0x818cf8);
    const bgColor      = getCSSColor('--bg',      isDark ? 0x07080f : 0xf0f4ff);

    const SKIN   = 0xffd5b0;
    const HAIR   = isDark ? 0x160d06 : 0x2e1a0e;
    const COAT   = isDark ? 0xe4eaff : 0xfafaff;
    const SCRUB  = accentColor.getHex();
    const BELT   = accent2Color.getHex();
    const SHOE   = 0x1c1c30;
    const CROSS  = 0xdc2626;
    const CHEEK  = 0xffaabb;
    const OL     = isDark ? 0x000005 : 0x080818;

    // ── Renderer (opaque) ─────────────────────────────────────────
    const W = wrap.clientWidth || 900;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(bgColor, 1);
    wrap.appendChild(renderer.domElement);

    // ── Scene / Camera ────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, W / H, 0.01, 100);
    camera.position.set(0, 0.4, 5.8);
    camera.lookAt(1.4, 0.1, 0);

    // ── Lights ────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, isDark ? 0.55 : 0.70));
    const key = new THREE.DirectionalLight(0xffffff, isDark ? 1.10 : 0.95);
    key.position.set(4, 7, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(isDark ? 0x3344ee : 0xffccff, 0.35);
    fill.position.set(-4, 2, -2);
    scene.add(fill);

    // ── Cel gradient ──────────────────────────────────────────────
    const gd = new Uint8Array([56, 120, 185, 255]);
    const gradMap = new THREE.DataTexture(gd, 4, 1, THREE.RedFormat);
    gradMap.minFilter = gradMap.magFilter = THREE.NearestFilter;
    gradMap.needsUpdate = true;

    // ── Disposal registry ─────────────────────────────────────────
    const toDispose: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [gradMap];
    const rg = <T extends THREE.BufferGeometry>(g: T): T => { toDispose.push(g); return g; };

    // Named materials (reused)
    const makeMat = (col: THREE.ColorRepresentation) => {
      const m = new THREE.MeshToonMaterial({ color: col, gradientMap: gradMap });
      toDispose.push(m);
      return m;
    };
    const mats = {
      skin:   makeMat(SKIN),
      hair:   makeMat(HAIR),
      coat:   makeMat(COAT),
      scrub:  makeMat(SCRUB),
      belt:   makeMat(BELT),
      shoe:   makeMat(SHOE),
      cross:  makeMat(CROSS),
      cheek:  makeMat(CHEEK),
      eyeW:   makeMat(0xffffff),
      eyeD:   makeMat(0x080820),
      shine:  makeMat(0xffffff),
      nose:   makeMat(0xf5aa80),
      smile:  makeMat(0xcc4444),
      steth:  makeMat(0x2d3748),
      stdisc: makeMat(0x718096),
      btn:    makeMat(isDark ? 0x8899cc : 0x99aadd),
      dia3:   makeMat(0xfbbf24),
      dia4:   makeMat(CROSS),
    };

    // Outline: back-face child of mesh
    const outlined = (mesh: THREE.Mesh, sc = 1.09): THREE.Mesh => {
      const om = new THREE.MeshBasicMaterial({ color: OL, side: THREE.BackSide });
      toDispose.push(om);
      const o = new THREE.Mesh(mesh.geometry, om);
      o.scale.setScalar(sc);
      mesh.add(o);
      return mesh;
    };

    // ═══════════════════════════════════════════════════════════════
    //  CHARACTER — Dr. Cosmo
    // ═══════════════════════════════════════════════════════════════
    const charGroup = new THREE.Group();
    charGroup.position.set(2.2, -0.1, 0);
    scene.add(charGroup);

    // ▸ TORSO (white coat)
    const torsoGeo = rg(new THREE.CylinderGeometry(0.30, 0.35, 0.90, 16));
    const torso = outlined(new THREE.Mesh(torsoGeo, mats.coat));
    torso.position.y = -0.08;
    charGroup.add(torso);

    // Coat center button strip
    const btnG = rg(new THREE.CylinderGeometry(0.018, 0.018, 0.62, 8));
    const btnMesh = new THREE.Mesh(btnG, mats.btn);
    btnMesh.position.set(0, -0.08, 0.31);
    charGroup.add(btnMesh);

    // Medical cross on chest
    const cxVG = rg(new THREE.BoxGeometry(0.075, 0.23, 0.04));
    const cxHG = rg(new THREE.BoxGeometry(0.23, 0.075, 0.04));
    const cxV = new THREE.Mesh(cxVG, mats.cross);
    const cxH = new THREE.Mesh(cxHG, mats.cross);
    cxV.position.set(-0.10, -0.03, 0.33);
    cxH.position.set(-0.10, -0.03, 0.33);
    charGroup.add(cxV, cxH);

    // Belt accent
    const beltG = rg(new THREE.CylinderGeometry(0.355, 0.355, 0.07, 16));
    const belt = outlined(new THREE.Mesh(beltG, mats.belt), 1.07);
    belt.position.y = -0.52;
    charGroup.add(belt);

    // Scrub pants (lower torso)
    const pantsG = rg(new THREE.CylinderGeometry(0.345, 0.31, 0.27, 16));
    const pants = outlined(new THREE.Mesh(pantsG, mats.scrub), 1.07);
    pants.position.y = -0.77;
    charGroup.add(pants);

    // ▸ LEGS
    const legG = rg(new THREE.CapsuleGeometry(0.115, 0.50, 6, 14));
    const lLeg = outlined(new THREE.Mesh(legG, mats.scrub));
    lLeg.position.set(-0.17, -1.14, 0);
    charGroup.add(lLeg);

    const rLeg = outlined(new THREE.Mesh(legG, mats.scrub));
    rLeg.position.set(0.17, -1.14, 0);
    charGroup.add(rLeg);

    // Shoes
    const shoeG = rg(new THREE.CapsuleGeometry(0.115, 0.22, 6, 10));
    const lShoe = outlined(new THREE.Mesh(shoeG, mats.shoe));
    lShoe.rotation.x = Math.PI / 2;
    lShoe.position.set(-0.17, -1.52, 0.12);
    charGroup.add(lShoe);

    const rShoe = outlined(new THREE.Mesh(shoeG, mats.shoe));
    rShoe.rotation.x = Math.PI / 2;
    rShoe.position.set(0.17, -1.52, 0.12);
    charGroup.add(rShoe);

    // ▸ NECK
    const neckG = rg(new THREE.CylinderGeometry(0.12, 0.14, 0.20, 12));
    const neck = outlined(new THREE.Mesh(neckG, mats.skin));
    neck.position.y = 0.30;
    charGroup.add(neck);

    // ▸ LEFT ARM (hanging, gentle sway)
    const lArmG = new THREE.Group();
    lArmG.position.set(-0.44, 0.12, 0);
    lArmG.rotation.z = 0.22;
    charGroup.add(lArmG);

    const uArmG = rg(new THREE.CapsuleGeometry(0.098, 0.30, 6, 10));
    const fArmG = rg(new THREE.CapsuleGeometry(0.088, 0.26, 6, 10));
    const handG = rg(new THREE.SphereGeometry(0.115, 14, 14));

    const lUA = outlined(new THREE.Mesh(uArmG, mats.coat)); lUA.position.y = -0.22; lArmG.add(lUA);
    const lFA = outlined(new THREE.Mesh(fArmG, mats.skin)); lFA.position.y = -0.56; lArmG.add(lFA);
    const lH  = outlined(new THREE.Mesh(handG, mats.skin), 1.11); lH.position.y  = -0.74; lArmG.add(lH);

    // ▸ RIGHT ARM (waving)
    const rArmG = new THREE.Group();
    rArmG.position.set(0.44, 0.12, 0);
    rArmG.rotation.set(-0.30, 0, -0.90);
    charGroup.add(rArmG);

    const rUA = outlined(new THREE.Mesh(uArmG, mats.coat)); rUA.position.y = -0.22; rArmG.add(rUA);
    const rFA = outlined(new THREE.Mesh(fArmG, mats.skin)); rFA.position.y = -0.56; rArmG.add(rFA);
    const rH  = outlined(new THREE.Mesh(handG, mats.skin), 1.11); rH.position.y  = -0.74; rArmG.add(rH);

    // ▸ HEAD GROUP
    const headG = new THREE.Group();
    headG.position.y = 0.68;
    charGroup.add(headG);

    // Head sphere
    const hSphG = rg(new THREE.SphereGeometry(0.50, 28, 28));
    headG.add(outlined(new THREE.Mesh(hSphG, mats.skin), 1.07));

    // Hair cap (top hemisphere, slightly larger)
    const hairCapG = rg(new THREE.SphereGeometry(0.52, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.58));
    const hairCap = new THREE.Mesh(hairCapG, mats.hair);
    hairCap.position.y = 0;
    headG.add(hairCap);

    // Hair bumps
    const hbG = rg(new THREE.SphereGeometry(0.22, 14, 14));
    const hairBumps: [number, number, number][] = [[-0.18, 0.48, -0.04], [0, 0.52, 0], [0.18, 0.48, -0.04]];
    hairBumps.forEach(([x, y, z]) => {
      const hb = new THREE.Mesh(hbG, mats.hair);
      hb.position.set(x, y, z);
      headG.add(hb);
    });

    // Ears
    const earG = rg(new THREE.SphereGeometry(0.10, 10, 10));
    const lEar = outlined(new THREE.Mesh(earG, mats.skin)); lEar.position.set(-0.50, 0.04, 0); headG.add(lEar);
    const rEar = outlined(new THREE.Mesh(earG, mats.skin)); rEar.position.set( 0.50, 0.04, 0); headG.add(rEar);

    // Eyes (white + pupil + shine)
    const eyeWG  = rg(new THREE.SphereGeometry(0.108, 14, 14));
    const pupilG = rg(new THREE.SphereGeometry(0.065, 12, 12));
    const shineG = rg(new THREE.SphereGeometry(0.025, 8, 8));

    const lEyeW = outlined(new THREE.Mesh(eyeWG, mats.eyeW), 1.13);  lEyeW.position.set(-0.175, 0.10, 0.44); headG.add(lEyeW);
    const lPup  = new THREE.Mesh(pupilG, mats.eyeD);                  lPup.position.set(-0.162, 0.10, 0.50);  headG.add(lPup);
    const lSh   = new THREE.Mesh(shineG, mats.shine);                 lSh.position.set(-0.145, 0.125, 0.53);  headG.add(lSh);

    const rEyeW = outlined(new THREE.Mesh(eyeWG, mats.eyeW), 1.13);  rEyeW.position.set( 0.175, 0.10, 0.44); headG.add(rEyeW);
    const rPup  = new THREE.Mesh(pupilG, mats.eyeD);                  rPup.position.set( 0.162, 0.10, 0.50);  headG.add(rPup);
    const rSh   = new THREE.Mesh(shineG, mats.shine);                 rSh.position.set(  0.178, 0.125, 0.53); headG.add(rSh);

    // Nose
    const noseG = rg(new THREE.SphereGeometry(0.058, 10, 10));
    const noseMesh = new THREE.Mesh(noseG, mats.nose);
    noseMesh.position.set(0, -0.02, 0.49);
    headG.add(noseMesh);

    // Cheeks
    const cheekG = rg(new THREE.SphereGeometry(0.09, 10, 10));
    const lCheek = new THREE.Mesh(cheekG, mats.cheek); lCheek.scale.z = 0.30; lCheek.position.set(-0.28, -0.07, 0.44); headG.add(lCheek);
    const rCheek = new THREE.Mesh(cheekG, mats.cheek); rCheek.scale.z = 0.30; rCheek.position.set( 0.28, -0.07, 0.44); headG.add(rCheek);

    // Smile
    const smileG = rg(new THREE.TorusGeometry(0.115, 0.024, 8, 18, Math.PI));
    const smileMesh = new THREE.Mesh(smileG, mats.smile);
    smileMesh.position.set(0, -0.18, 0.47);
    smileMesh.rotation.z = Math.PI;
    headG.add(smileMesh);

    // ▸ STETHOSCOPE
    const stPts = [
      new THREE.Vector3(-0.24, 0.46, 0.30),
      new THREE.Vector3(-0.32, 0.24, 0.32),
      new THREE.Vector3(-0.28, -0.02, 0.34),
      new THREE.Vector3(-0.08, -0.18, 0.36),
      new THREE.Vector3( 0.00, -0.20, 0.37),
      new THREE.Vector3( 0.08, -0.18, 0.36),
      new THREE.Vector3( 0.28, -0.02, 0.34),
      new THREE.Vector3( 0.32, 0.24, 0.32),
      new THREE.Vector3( 0.24, 0.46, 0.30),
    ];
    const stGeo = rg(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stPts), 40, 0.024, 8, false));
    charGroup.add(new THREE.Mesh(stGeo, mats.steth));

    const stDiscG = rg(new THREE.CylinderGeometry(0.058, 0.058, 0.018, 12));
    const stDisc = new THREE.Mesh(stDiscG, mats.stdisc);
    stDisc.rotation.x = Math.PI / 2;
    stDisc.position.set(0, -0.20, 0.40);
    charGroup.add(stDisc);

    // ═══════════════════════════════════════════════════════════════
    //  FLOATING DECORATIVE ELEMENTS
    // ═══════════════════════════════════════════════════════════════
    const diaGeo = rg(new THREE.OctahedronGeometry(0.20, 0));
    const diaMats = [mats.scrub, mats.belt, mats.dia3, mats.dia4];
    const diaPos: [number, number, number][] = [
      [-1.8,  1.2, -0.4],
      [-1.2, -0.9,  0.5],
      [ 1.5,  1.6, -0.3],
      [-2.1,  0.2,  0.3],
    ];
    const sparkles: THREE.Mesh[] = [];
    diaPos.forEach(([x, y, z], i) => {
      const d = outlined(new THREE.Mesh(diaGeo, diaMats[i % diaMats.length]), 1.15);
      d.position.set(x, y, z);
      d.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      scene.add(d);
      sparkles.push(d);
    });

    // Floating medical plus signs
    const plusVG  = rg(new THREE.BoxGeometry(0.06, 0.22, 0.06));
    const plusHG  = rg(new THREE.BoxGeometry(0.22, 0.06, 0.06));
    const plusPos: [number, number, number][] = [[-2.4, -0.5, 0.2], [0.6, 1.8, -0.5]];
    const plusGroups: THREE.Group[] = [];
    plusPos.forEach(([x, y, z]) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.add(new THREE.Mesh(plusVG, mats.cross));
      g.add(new THREE.Mesh(plusHG, mats.cross));
      scene.add(g);
      plusGroups.push(g);
    });

    // Background dust
    const DUST = 280;
    const dArr = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      dArr[i*3]   = (Math.random() - 0.5) * 20;
      dArr[i*3+1] = (Math.random() - 0.5) * 10;
      dArr[i*3+2] = -2 - Math.random() * 5;
    }
    const dGeo = rg(new THREE.BufferGeometry());
    dGeo.setAttribute('position', new THREE.BufferAttribute(dArr, 3));
    const dMat = new THREE.PointsMaterial({ color: isDark ? 0x6677cc : 0x8899bb, size: 0.045, transparent: true, opacity: isDark ? 0.40 : 0.22, sizeAttenuation: true });
    toDispose.push(dMat);
    scene.add(new THREE.Points(dGeo, dMat));

    // ── Mouse parallax ────────────────────────────────────────────
    let tx = 0, ty = 0;
    const outer = wrap.parentElement;
    const onMouse = (e: MouseEvent) => {
      const r = wrap.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width  - 0.5) * 1.2;
      ty = ((e.clientY - r.top)  / r.height - 0.5) * 0.7;
    };
    outer?.addEventListener('mousemove', onMouse);

    // ── Render loop ───────────────────────────────────────────────
    let t = 0, rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      t += 0.011;

      // Float + sway
      charGroup.position.y = -0.1 + Math.sin(t * 0.85) * 0.13;
      charGroup.rotation.y = Math.sin(t * 0.25) * 0.07;

      // Head bobble
      headG.rotation.z = Math.sin(t * 0.65) * 0.055;
      headG.rotation.x = Math.sin(t * 0.45) * 0.035;

      // Right arm wave
      rArmG.rotation.z = -0.9 + Math.sin(t * 2.8) * 0.55;
      rArmG.rotation.x = -0.3 + Math.sin(t * 2.0 + 0.5) * 0.18;

      // Left arm sway
      lArmG.rotation.z = 0.22 + Math.sin(t * 0.55) * 0.07;

      // Sparkle spin + bob
      sparkles.forEach((s, i) => {
        s.rotation.x += 0.012 * (i % 2 === 0 ? 1 : -0.85);
        s.rotation.y += 0.018;
        s.position.y += Math.sin(t * 0.65 + i * 1.3) * 0.003;
      });

      // Plus sign float + spin
      plusGroups.forEach((g, i) => {
        g.rotation.z = Math.sin(t * 0.4 + i) * 0.3;
        g.position.y += Math.sin(t * 0.5 + i * 2) * 0.002;
      });

      // Camera parallax
      camera.position.x += (tx * 0.35 - camera.position.x) * 0.04;
      camera.position.y += (-ty * 0.22 + 0.4 - camera.position.y) * 0.04;
      camera.lookAt(1.4, 0.1, 0);

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = wrap.clientWidth; if (!w) return;
      renderer.setSize(w, H); camera.aspect = w / H; camera.updateProjectionMatrix();
    });
    ro.observe(wrap);

    // ── Cleanup ───────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      outer?.removeEventListener('mousemove', onMouse);
      toDispose.forEach(r => r.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === wrap) wrap.removeChild(renderer.domElement);
    };
  }, [mode]);

  const isDark = mode === 'dark';
  const pct    = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const SVG_R  = 44;
  const arc    = +(2 * Math.PI * SVG_R).toFixed(1);

  return (
    <div style={{
      position: 'relative', width: '100%', height: H,
      borderRadius: 18, overflow: 'hidden',
      background: 'var(--bg, #07080f)',
      marginBottom: 24, userSelect: 'none',
    }}>
      <div ref={wrapRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

      {/* Text overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 10,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 44px',
        background: isDark
          ? 'linear-gradient(95deg, rgba(3,6,24,0.76) 34%, transparent 60%)'
          : 'linear-gradient(95deg, rgba(228,234,255,0.88) 34%, transparent 60%)',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', fontWeight: 700, marginBottom: 8,
          color: isDark ? 'rgba(180,200,255,0.65)' : 'rgba(70,90,200,0.80)',
        }}>Your Care Journey</span>

        <h1 style={{
          margin: '0 0 10px', fontWeight: 800, lineHeight: 1.2, fontSize: 30,
          color: isDark ? '#ffffff' : '#1a246e',
          textShadow: isDark ? '0 2px 20px rgba(0,0,0,0.8)' : undefined,
        }}>
          Hello, {firstName || 'there'} 👋
        </h1>

        <p style={{
          maxWidth: 370, margin: '0 0 20px', fontSize: 14, lineHeight: 1.7,
          color: isDark ? 'rgba(190,215,255,0.72)' : 'rgba(40,60,160,0.78)',
        }}>
          Your treatment schedule, health records, and progress — all in one place.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', pointerEvents: 'auto' }}>
          {pct > 0 && (
            <span style={{
              padding: '6px 16px', borderRadius: 24, color: '#fff', fontSize: 13, fontWeight: 700,
              background: pct === 100
                ? 'linear-gradient(90deg,#f59e0b,#f7931a)'
                : 'linear-gradient(90deg,var(--accent2,#7c3aed),var(--accent,#c084fc))',
              boxShadow: '0 2px 14px rgba(0,0,0,0.22)',
            }}>
              {pct === 100 ? '🎉 All sessions complete!' : `${pct}% complete`}
            </span>
          )}
          {unread > 0 && (
            <span className="badge badge-warning" style={{ fontSize: 13, padding: '5px 14px' }}>
              {unread} unread notification{unread !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Progress arc */}
      {pct > 0 && (
        <svg width={110} height={110}
          style={{ position: 'absolute', top: 22, right: 28, zIndex: 11, pointerEvents: 'none' }}
          viewBox="0 0 110 110">
          <circle cx={55} cy={55} r={SVG_R} fill="none"
            stroke={isDark ? 'rgba(255,255,255,0.10)' : 'rgba(80,100,200,0.18)'} strokeWidth={6} />
          <circle cx={55} cy={55} r={SVG_R} fill="none"
            stroke={pct === 100 ? '#f59e0b' : 'var(--accent,#6366f1)'}
            strokeWidth={6} strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * arc} ${arc}`}
            transform="rotate(-90 55 55)"
            style={{ filter: 'drop-shadow(0 0 6px var(--accent-glow,rgba(192,132,252,0.45)))' }} />
          <text x={55} y={51} textAnchor="middle" fill={isDark ? '#fff' : '#1a246e'}
            fontSize={18} fontWeight={800} style={{ fontFamily: 'inherit' }}>{pct}%</text>
          <text x={55} y={68} textAnchor="middle"
            fill={isDark ? 'rgba(180,210,255,0.6)' : 'rgba(70,90,200,0.65)'}
            fontSize={10} fontWeight={600}>DONE</text>
        </svg>
      )}
    </div>
  );
}
