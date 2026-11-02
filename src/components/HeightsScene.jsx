import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, useTexture } from '@react-three/drei'
import * as THREE from 'three'

// ════════════════════════════════════════════════════════════════════
//  HeightsScene: the logo as a neon sign, hung in a dark room full of
//  chrome.
//
//    · the THL mark on a plane, with the magenta outline pulsing like a
//      real neon tube (a flicker on power-up, then a slow breathe)
//    · a soft halo behind it: the same texture, tinted pink, sampled in
//      a cheap 5-tap blur and drawn additively, plus a radial glow
//    · a cloud of chrome spheres, the dreads of the logo, lit only by a
//      pink and white HDRI built from light formers, so every reflection
//      carries the brand. They drift on their own, flee the cursor, and
//      scatter as the page scrolls
//    · chrome drips hanging off the top edge, nodding to the paint
//
//  No post-processing: every glow is additive geometry or CSS, which keeps
//  it smooth on integrated GPUs. The render loop pauses off-screen.
// ════════════════════════════════════════════════════════════════════

const PINK = new THREE.Color('#ff14a0')

const GLOW_FRAG = /* glsl */ `
  uniform vec3 uPink;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * vec2(1.0, 1.25);
    float d = length(p);
    float a = exp(-d * 5.5) * 0.42;
    gl_FragColor = vec4(uPink * a, a);
    #include <colorspace_fragment>
  }
`

/** Shared clock that respects prefers-reduced-motion. */
function useSceneTime(speed) {
  const time = useRef(0)
  useFrame((_, delta) => {
    time.current += Math.min(delta, 0.05) * speed
  })
  return time
}

/* ─────────────── Chrome field ─────────────── */

function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function ChromeField({ time, count, scrollRef }) {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const { pointer, viewport, camera, size } = useThree()

  // Deterministic layout: same cloud on every load, no popping.
  const bodies = useMemo(() => {
    const rnd = seeded(20261102)
    const list = []
    for (let i = 0; i < count; i++) {
      // Polar placement around the logo, with a hole in the middle so the
      // mark is never covered. Radius biased outward.
      const a = rnd() * Math.PI * 2
      const r = 2.1 + Math.pow(rnd(), 0.8) * 4.6
      const depth = (rnd() - 0.5) * 5
      // Big ones are rare and sit further back so they read as scale, not clutter.
      const big = rnd() < 0.14
      const radius = big ? 0.42 + rnd() * 0.3 : 0.09 + Math.pow(rnd(), 1.6) * 0.26
      list.push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r * 0.78,
        z: big ? depth - 1.5 : depth,
        radius,
        phase: rnd() * Math.PI * 2,
        freq: 0.25 + rnd() * 0.45,
        amp: 0.12 + rnd() * 0.3,
        ox: 0,
        oy: 0,
      })
    }
    return list
  }, [count])

  useFrame((_, delta) => {
    const m = mesh.current
    if (!m) return
    const t = time.current
    const dt = Math.min(delta, 0.05)
    const scroll = scrollRef.current

    // Pointer in world units on the z=0 plane.
    const vp = viewport.getCurrentViewport(camera, [0, 0, 0])
    const px = (pointer.x * vp.width) / 2
    const py = (pointer.y * vp.height) / 2
    const narrow = size.width < 1024
    // The cloud is laid out for a wide room; on a phone it is squeezed so the
    // spheres stay in frame instead of drifting off both edges.
    const fit = narrow ? Math.min(1, vp.width / 8) : 1

    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i]
      const driftX = Math.sin(t * b.freq + b.phase) * b.amp
      const driftY = Math.cos(t * b.freq * 0.8 + b.phase * 1.3) * b.amp * 0.8

      // Cursor repulsion: spheres within reach get pushed away, then ease back.
      const dx = b.x + driftX - px
      const dy = b.y + driftY - py
      const dist = Math.hypot(dx, dy) || 0.001
      const reach = 2.4
      let tx = 0
      let ty = 0
      if (dist < reach && !narrow) {
        const push = ((reach - dist) / reach) * 1.1
        tx = (dx / dist) * push
        ty = (dy / dist) * push
      }
      b.ox = THREE.MathUtils.damp(b.ox, tx, 4, dt)
      b.oy = THREE.MathUtils.damp(b.oy, ty, 4, dt)

      // Scroll scatters the cloud outward and lifts it, like leaving the room.
      const spread = 1 + scroll * 0.9
      dummy.position.set((b.x + driftX + b.ox) * spread * fit, (b.y + driftY + b.oy) * spread + scroll * 2.2, b.z - scroll * 2)
      const s = b.radius * (1 - scroll * 0.35)
      dummy.scale.setScalar(Math.max(s, 0.001))
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 40, 40]} />
      <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.08} envMapIntensity={1.35} />
    </instancedMesh>
  )
}

/* ─────────────── Chrome drips ─────────────── */

function Drips({ time, scrollRef }) {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const { viewport, camera } = useThree()

  const drips = useMemo(() => {
    const rnd = seeded(777)
    return Array.from({ length: 11 }, () => ({
      u: rnd(), // horizontal position as a fraction of the viewport
      len: 0.5 + rnd() * 1.6,
      r: 0.05 + rnd() * 0.07,
      phase: rnd() * 10,
      speed: 0.12 + rnd() * 0.2,
      z: -2 - rnd() * 3,
    }))
  }, [])

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const t = time.current
    const vp = viewport.getCurrentViewport(camera, [0, 0, drips[0].z])
    const scroll = scrollRef.current
    drips.forEach((d, i) => {
      // Each drip slowly lengthens, then snaps back, like paint letting go.
      const cycle = (t * d.speed + d.phase) % 1
      const grow = 1 - Math.pow(1 - cycle, 3)
      const len = d.len * (0.35 + grow * 0.65)
      const x = (d.u - 0.5) * vp.width
      const top = vp.height / 2 + 0.3 + scroll * 3
      dummy.position.set(x, top - len / 2, d.z)
      dummy.scale.set(d.r, len, d.r)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, drips.length]} frustumCulled={false}>
      <capsuleGeometry args={[1, 1, 6, 16]} />
      <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.1} envMapIntensity={1.2} />
    </instancedMesh>
  )
}

/* ─────────────── Neon logo ─────────────── */

function Logo({ time, reducedMotion }) {
  const texture = useTexture('/brand/logo-hd.webp')
  const group = useRef()

  const { sign, halo, width, height } = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    const aspect = texture.image ? texture.image.width / texture.image.height : 0.92
    const w = 3.4
    const common = {
      transparent: true,
      depthWrite: false,
      uniforms: { uMap: { value: texture }, uTime: { value: 0 }, uPink: { value: PINK.clone() } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
    }
    return {
      width: w,
      height: w / aspect,
      sign: new THREE.ShaderMaterial({
        ...common,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap;
          uniform float uTime;
          uniform vec3 uPink;
          varying vec2 vUv;

          // A neon tube: a hard stutter in the first second, then a slow breathe.
          float power(float t) {
            float boot = step(t, 1.4);
            float stutter = step(0.5, fract(sin(floor(t * 28.0) * 91.7) * 43758.5453));
            float breathe = 0.9 + 0.1 * sin(t * 1.6);
            return mix(breathe, stutter * 0.9 + 0.1, boot);
          }

          void main() {
            vec4 c = texture2D(uMap, vUv);
            // Pinkness of this texel: red high, green low. That is the tube.
            float pinkness = clamp((c.r - c.g) * 1.6, 0.0, 1.0) * c.a;
            float p = power(uTime);
            // Lift the pink toward white-hot at the core, like a real tube.
            vec3 lit = mix(c.rgb, uPink * 1.35 + vec3(0.25), pinkness * 0.55 * p);
            // Diagonal light sweep over the chrome parts every few seconds.
            float band = vUv.x * 0.8 + vUv.y * 0.5;
            float head = mod(uTime * 0.35, 4.0) - 0.8;
            float sweep = smoothstep(0.05, 0.0, abs(band - head));
            lit += vec3(1.0) * sweep * 0.35 * c.a * (1.0 - pinkness);
            gl_FragColor = vec4(lit, c.a);
            #include <colorspace_fragment>
          }
        `,
      }),
      halo: new THREE.ShaderMaterial({
        ...common,
        blending: THREE.AdditiveBlending,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap;
          uniform float uTime;
          uniform vec3 uPink;
          varying vec2 vUv;

          float power(float t) {
            float boot = step(t, 1.4);
            float stutter = step(0.5, fract(sin(floor(t * 28.0) * 91.7) * 43758.5453));
            float breathe = 0.9 + 0.1 * sin(t * 1.6);
            return mix(breathe, stutter * 0.9 + 0.1, boot);
          }

          void main() {
            // Five taps spread wide: a cheap, soft blur of the sign's alpha.
            float o = 0.022;
            float a = texture2D(uMap, vUv).a;
            a += texture2D(uMap, vUv + vec2(o, 0.0)).a;
            a += texture2D(uMap, vUv - vec2(o, 0.0)).a;
            a += texture2D(uMap, vUv + vec2(0.0, o)).a;
            a += texture2D(uMap, vUv - vec2(0.0, o)).a;
            a /= 5.0;
            float glow = smoothstep(0.0, 0.9, a) * 0.55 * power(uTime);
            gl_FragColor = vec4(uPink * glow, glow);
            #include <colorspace_fragment>
          }
        `,
      }),
    }
  }, [texture])

  useFrame(() => {
    const t = reducedMotion ? 10 : time.current
    sign.uniforms.uTime.value = t
    halo.uniforms.uTime.value = t
    if (group.current) {
      group.current.position.y = Math.sin(time.current * 0.7) * 0.08
      group.current.rotation.z = Math.sin(time.current * 0.45) * 0.012
    }
  })

  return (
    <group ref={group}>
      {/* Radial glow bleeding onto the wall behind the sign */}
      <mesh position={[0, -0.1, -0.6]}>
        <planeGeometry args={[width * 2.6, height * 2.2]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{ uPink: { value: PINK.clone() } }}
          vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
          fragmentShader={GLOW_FRAG}
        />
      </mesh>
      <mesh material={halo} position={[0, 0, -0.08]} scale={[1.08, 1.08, 1]}>
        <planeGeometry args={[width, height]} />
      </mesh>
      <mesh material={sign}>
        <planeGeometry args={[width, height]} />
      </mesh>
      {/* The sign is a light source: it tints the chrome around it. */}
      <pointLight position={[0, 0, 1.6]} intensity={14} distance={9} color="#ff14a0" />
    </group>
  )
}

/* ─────────────── Layout + pointer rig ─────────────── */

function Rig({ children, scrollRef }) {
  const group = useRef()
  const tilt = useRef()

  useFrame((state, delta) => {
    const g = group.current
    const t = tilt.current
    if (!g || !t) return
    const dt = Math.min(delta, 0.05)
    const vp = state.viewport.getCurrentViewport(state.camera, [0, 0, 0])
    const wide = state.size.width >= 1024

    const scroll = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1.2)
    scrollRef.current = scroll

    // Desktop: the sign hangs right of the copy. Narrow: above it, scaled to fit.
    const tight = wide && state.size.width < 1280
    const targetX = wide ? vp.width * (tight ? 0.27 : 0.22) : 0
    const targetY = (wide ? 0.1 : vp.height * 0.26) + scroll * 1.8
    const targetScale = (wide ? (tight ? 0.8 : 1) : Math.min(0.78, vp.width / 7.6)) * (1 - scroll * 0.15)

    g.position.x = THREE.MathUtils.damp(g.position.x, targetX, 3.5, dt)
    g.position.y = THREE.MathUtils.damp(g.position.y, targetY, 3.5, dt)
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, targetScale, 3.5, dt))

    t.rotation.y = THREE.MathUtils.damp(t.rotation.y, state.pointer.x * 0.22, 2.6, dt)
    t.rotation.x = THREE.MathUtils.damp(t.rotation.x, -state.pointer.y * 0.14, 2.6, dt)
  })

  return (
    <group ref={group}>
      <group ref={tilt}>{children}</group>
    </group>
  )
}

function Scene({ lite, reducedMotion }) {
  const time = useSceneTime(reducedMotion ? 0.25 : 1)
  const scrollRef = useRef(0)

  return (
    <>
      <color attach="background" args={['#06030a']} />
      <fog attach="fog" args={['#06030a', 9, 20]} />

      {/* The only light the chrome sees: a magenta wall and a white key. */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={9} color="#ff14a0" position={[-6, 3, -4]} scale={[8, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={7} color="#ffffff" position={[6, 5, 2]} scale={[2.5, 10, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={4} color="#ffffff" position={[-2, 8, 4]} scale={[10, 1.2, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={2.2} color="#ff6cc8" position={[0, -6, 2]} scale={6} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#9a7cff" position={[0, 7, -3]} scale={[12, 2, 1]} target={[0, 0, 0]} />
      </Environment>

      <ambientLight intensity={0.15} color="#ff9edb" />
      <directionalLight position={[5, 6, 4]} intensity={1.2} color="#ffffff" />

      <Rig scrollRef={scrollRef}>
        <Suspense fallback={null}>
          <Logo time={time} reducedMotion={reducedMotion} />
        </Suspense>
      </Rig>
      <ChromeField time={time} count={lite ? 26 : 54} scrollRef={scrollRef} />
      {!lite && <Drips time={time} scrollRef={scrollRef} />}
    </>
  )
}

export default function HeightsScene({ className = '' }) {
  const container = useRef(null)
  const [visible, setVisible] = useState(true)
  const [lite] = useState(() => window.matchMedia('(max-width: 767px)').matches || (navigator.hardwareConcurrency || 8) <= 4)
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  // Stop rendering entirely once the hero is off screen.
  useEffect(() => {
    const el = container.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={container} className={`absolute inset-0 ${className}`}>
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        camera={{ position: [0, 0, 9], fov: 40, near: 0.1, far: 60 }}
        // Track the pointer over the whole page: the hero copy sits on top of the canvas.
        eventSource={document.getElementById('root')}
        eventPrefix="client"
      >
        <Scene lite={lite} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  )
}
