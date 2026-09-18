'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { Center, Environment, OrbitControls, useGLTF, useTexture } from '@react-three/drei'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from 'lucide-react'

const SHIRT_MODEL_URL = 'https://res.cloudinary.com/dtkluxukm/image/upload/v1787995625/Shirt_nep9xf.glb'
const COLORS = [
  { name: 'Red', value: '#c9362b', ink: 'bg-[#c9362b]' },
  { name: 'Black', value: '#17231f', ink: 'bg-[#17231f]' },
  { name: 'Green', value: '#16804b', ink: 'bg-[#16804b]' },
  { name: 'Blue', value: '#2c62a8', ink: 'bg-[#2c62a8]' },
]

type Stamp = {
  id: number
  textImage: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

function StampDecal({ stamp }: { stamp: Stamp }) {
  const texture = useTexture(stamp.textImage)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true

  return (
    <mesh position={stamp.position} rotation={stamp.rotation} scale={stamp.scale} renderOrder={2}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent={true}
        opacity={1}
        depthWrite={false}
        depthTest={true}
        polygonOffset={true}
        polygonOffsetFactor={-4}
        polygonOffsetUnits={-4}
        alphaTest={0.01}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  )
}

function ShirtMesh({ groupRef, isPlacingStamp, stampMessage, stampColor, onStampPlaced, stamps = [], onStampCreate }: { groupRef: React.RefObject<THREE.Group | null>; isPlacingStamp: boolean; stampMessage: string; stampColor: string; onStampPlaced: () => void; stamps?: Stamp[]; onStampCreate: (point: THREE.Vector3, rotation: THREE.Euler) => void }) {
  const { scene } = useGLTF(SHIRT_MODEL_URL)
  const shirt = useMemo(() => scene.clone(true), [scene])
  useEffect(() => {
    shirt.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.castShadow = true
      object.receiveShadow = true
      object.renderOrder = 1
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => {
        material.transparent = false
        material.opacity = 1
        material.depthWrite = true
        material.depthTest = true
        material.needsUpdate = true
      })
    })
  }, [shirt])
  const handlePointerDown = (e: any) => {
    e.stopPropagation()
    if (!isPlacingStamp || !stampMessage.trim() || !groupRef.current || !e.normal) return
    const localPoint = groupRef.current.worldToLocal(e.point.clone())
    const worldNormal = e.normal.clone().transformDirection(e.object.matrixWorld).normalize()
    const localNormal = worldNormal.clone().applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(groupRef.current.matrixWorld).invert()).normalize()
    const rotation = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), localNormal)
    )
    localPoint.addScaledVector(localNormal, 0.01)
    onStampCreate(localPoint, rotation)
    onStampPlaced()
  }
  return <group ref={groupRef} rotation={[0.02, 0, 0]} scale={[0.42, 0.42, 0.42]}><primitive object={shirt} onPointerDown={handlePointerDown} />{stamps.map((stamp) => <StampDecal key={stamp.id} stamp={stamp} />)}</group>
}
function CameraController({ zoomLevel, controlsRef }: { zoomLevel: number; controlsRef: React.RefObject<any> }) {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(camera.position.x, camera.position.y, zoomLevel)
    camera.updateProjectionMatrix()
    controlsRef.current?.update()
  }, [camera, controlsRef, zoomLevel])
  return null
}

function Scene({ zoomLevel, groupRef, isPlacingStamp, stampMessage, stampColor, onStampPlaced, stamps, onStampCreate }: { zoomLevel: number; groupRef: React.RefObject<THREE.Group | null>; isPlacingStamp: boolean; stampMessage: string; stampColor: string; onStampPlaced: () => void; stamps: Stamp[]; onStampCreate: (point: THREE.Vector3, rotation: THREE.Euler) => void }) {
  const controlsRef = useRef<any>(null)
  return <Canvas shadows camera={{ position: [0, 0, zoomLevel], fov: 45 }}><color attach="background" args={['#0eb0ab']} /><ambientLight intensity={1.5} /><directionalLight castShadow position={[4, 6, 5]} intensity={2} /><Environment preset="studio" /><CameraController zoomLevel={zoomLevel} controlsRef={controlsRef} /><Suspense fallback={null}><Center disableY={false} disableX={false} disableZ={false}><ShirtMesh groupRef={groupRef} isPlacingStamp={isPlacingStamp} stampMessage={stampMessage} stampColor={stampColor} onStampPlaced={onStampPlaced} stamps={stamps} onStampCreate={onStampCreate} /></Center></Suspense><OrbitControls ref={controlsRef} makeDefault enabled={!isPlacingStamp} enablePan={false} minDistance={1.5} maxDistance={8} enableDamping dampingFactor={0.08} /></Canvas>
}

function Marker({ item, active, onClick }: { item: typeof COLORS[number]; active: boolean; onClick: () => void }) { return <button type="button" aria-label={`Use ${item.name} marker`} aria-pressed={active} onClick={onClick} className={`group relative flex h-10 w-8 shrink-0 items-center justify-center rounded-lg transition-all ${active ? 'bg-white/20 ring-1 ring-white ring-offset-2 ring-offset-[#087f7b]' : 'hover:bg-white/10'}`}><span className={`relative h-9 w-2.5 rounded-b-full rounded-t-sm ${item.ink} shadow-[2px_4px_0_rgba(0,0,0,.18)]`}><span className="absolute -top-1 left-0 h-2 w-3 rounded-t-sm bg-white/50" /><span className="absolute -bottom-2 left-[3px] h-2 w-1.5 border-x-[3px] border-t-4 border-transparent border-t-current" /></span><span className="sr-only">{item.name}</span></button> }

const ABOUT_STORY = [
  { title: 'Introduction', image: 'https://res.cloudinary.com/dtkluxukm/image/upload/v1789663440/front_i5fh0m.jpg', text: "Hi I'm Great, and yes I have officially GRADUADA (siri said it's Spanish for graduated) and I am officially an Engineer (against my will) so, you MUST call me Engr. Great. my favorite food is beans and literally any other combination except corn and seafood. My favorite color is sparkle blue. I'm a pop and R&B music lover... Favorite artists are unlimited, but a few are Ain't Afraid, Zinnydmore, D'lait, Efue, Jazzworld (amapiano will not be the end of me IJN), Sia, Gaise Baba, AEO, BOYFROMEDEN, and plenty others. I am an award-winning Web Designer and developer, DevOps engineer, entrepreneur, builder and songwriter (just on random Thursdays). I am obsessed with anime and ice cream." },
  { title: '100 LVL', image: 'https://res.cloudinary.com/dtkluxukm/image/upload/v1789663438/100lvl_oelgon.jpg', text: "I never wanted to come here in the first place. Was I forced? ehhnnn something like that. But, I didn't really have a choice cause I wasn't the one paying the school fees. So far university has been a blur. I was super stressed out, super out of touch with humanity (cause my school is in the bush), and most importantly, I was fainting emotionally and mentally almost every 2 hours. Nothing really memorable in 100lvl, cause. I was literally the most boring individual. Oh I met Davidson in 100lvl and yeah that part was cool." },
  { title: '200 LVL', image: 'https://res.cloudinary.com/dtkluxukm/image/upload/v1789663433/200lvl_litb9v.jpg', text: "I began questioning my entire life choices here, not that I wasn't already questioning them, but I questioned them loudly. I remember reading for an exam and I was literally crying asking myself who sent me. Same story, blur... To love or to be seen? Omo to not do engineering. NEVER AGAIN (in Anthony kani's voice). Oh this was the season Seyi and I became friends. (Worth it like maddd)." },
  { title: '300 LVL', image: 'https://res.cloudinary.com/dtkluxukm/image/upload/v1789663438/300lvl_za9cuj.jpg', text: "I began to loathe every single thing that existed within that entire obinze axis not that I wasn't already loathing everything before this moment, but I began to loathe it loudly. In this season, I ate more egg rolls, and ate more noodles. Oh and did I mention that since I entered that school till now, I haven't tried meshai? I sha think I took more pics. In this season, John Paul and I became oddly close (yazzzzz)." },
  { title: '400 LVL', image: 'https://res.cloudinary.com/dtkluxukm/image/upload/v1789663434/400lvl_awe5jh.jpg', text: "This season pushed me beyond measure in a good way. I tried new things, I pitched, I built startups and apps, and digital projects and I failed a lot. And I also added weight, I was very inconsistent with working out, and traveled on my own. Did IT, met cool Yoruba people, my spark was now shining. But even though! I began to detest the idea of the course I was studying. Not that I hadn't detested it since, I just began to detest it loudly." },
  { title: '500 LVL', image: 'https://res.cloudinary.com/dtkluxukm/image/upload/v1789663441/500lvl_mczsix.jpg', text: "The story sha long. Became so unmotivated, coded more, worked away my social life, began my career in DevOps, participated in 3 hackathons, won none. Had a full circle moment and realized that I actually have amazing people in my circle... Exams killed me 26 different times, became extremely grateful yet super anxious cause I have really bad anxiety. Became more opinionated. And that's the gist for now sha." },
] as const

export function SignoutStudio() {
  const [isMounted, setIsMounted] = useState(false)
  const [active, setActive] = useState(COLORS[0]); const [drawing, setDrawing] = useState(false); const [zoomLevel, setZoomLevel] = useState(4); const [modalOpen, setModalOpen] = useState(false); const [isPlacingStamp, setIsPlacingStamp] = useState(false); const [stampMessage, setStampMessage] = useState(''); const [stampColor, setStampColor] = useState(COLORS[0].value); const [stamps, setStamps] = useState<Stamp[]>([]); const [activeStampMessage, setActiveStampMessage] = useState(''); const [pointer, setPointer] = useState({ x: 0, y: 0 }); const [markerTrayOpen, setMarkerTrayOpen] = useState(false); const groupRef = useRef<THREE.Group>(null)
  useEffect(() => {
    setIsMounted(true)
    const fontLink = document.createElement('link')
    fontLink.rel = 'stylesheet'
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Nunito:ital,wght@1,700;1,800&family=Rubik:ital,wght@1,700;1,800&display=swap'
    document.head.appendChild(fontLink)
    return () => fontLink.remove()
  }, [])
  const rotate = (axis: 'x' | 'y', amount: number) => { if (groupRef.current) groupRef.current.rotation[axis] += amount }
  const chooseMarker = (item: typeof COLORS[number]) => { setActive(item); setStampColor(item.value); setMarkerTrayOpen(false) }
  const closeModal = () => { setModalOpen(false); setStampMessage('') }
  const handleStripePayment = () => { /* Stripe integration will be wired here later. */ }
  const handleStampPlaced = () => { setIsPlacingStamp(false); setActiveStampMessage(''); setStampMessage('') }
  const handleTextReset = () => { setStampMessage('') }
  const handleStampCreate = (point: THREE.Vector3, rotation: THREE.Euler) => {
    const textCanvas = document.createElement('canvas')
    textCanvas.width = 1024
    textCanvas.height = 1024
    const context = textCanvas.getContext('2d')
    if (!context) return
    context.clearRect(0, 0, 1024, 1024)
    context.fillStyle = stampColor
    context.font = "italic bold 100px 'Nunito', 'Rubik', sans-serif"
    context.textAlign = 'center'
    context.textBaseline = 'middle'

    const maxWordsPerLine = 5
    const lineHeight = 130
    const lines: string[] = []
    stampMessage.trim().split(/\r?\n/).forEach((paragraph) => {
      const words = paragraph.trim().split(/\s+/).filter(Boolean)
      if (words.length === 0) {
        lines.push('')
        return
      }
      for (let index = 0; index < words.length; index += maxWordsPerLine) {
        lines.push(words.slice(index, index + maxWordsPerLine).join(' '))
      }
    })

    const startY = 512 - ((lines.length - 1) * lineHeight) / 2
    lines.forEach((line, index) => {
      context.fillText(line, 512, startY + index * lineHeight)
    })
    setStamps((current) => [...current, { id: Date.now(), textImage: textCanvas.toDataURL('image/png'), position: [point.x, point.y, point.z], rotation: [rotation.x, rotation.y, rotation.z], scale: [1.8, 1.8, 0.1] }])
  }
  const handleSign = () => { const message = stampMessage.trim(); if (!message) return; setActiveStampMessage(message); setStampMessage(''); setModalOpen(false); setIsPlacingStamp(true) }
  return <main className="relative h-dvh w-full overflow-hidden bg-[#0eb0ab]"><div className="absolute inset-0">{isMounted ? (<Scene zoomLevel={zoomLevel} groupRef={groupRef} isPlacingStamp={isPlacingStamp} stampMessage={activeStampMessage} stampColor={stampColor} onStampPlaced={handleStampPlaced} stamps={stamps} onStampCreate={handleStampCreate} />) : (<div className="fixed inset-0 bg-[#0eb0ab]" />)}</div>{isPlacingStamp && <div className="pointer-events-none absolute bottom-6 left-1/2 z-30 -translate-x-1/2 animate-pulse whitespace-nowrap rounded-full border border-white/30 bg-[#087f7b]/90 px-4 py-2 text-xs font-medium text-white shadow-xl backdrop-blur-xl">Tap anywhere on the white shirt to place your signature!</div>}{modalOpen && <div className="absolute inset-0 z-40 grid place-items-center bg-black/20 p-5 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-labelledby="signature-title" className="w-full max-w-md rounded-3xl border border-white/30 bg-[#087f7b]/95 p-5 text-white shadow-2xl"><div className="mb-4 flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.24em] text-white/60">Leave your mark</p><h2 id="signature-title" className="mt-1 text-xl font-semibold">Sign the shirt</h2></div><button type="button" aria-label="Close signature modal" onClick={closeModal} className="text-2xl text-white/70">×</button></div><textarea maxLength={20} value={stampMessage} onChange={(e) => setStampMessage(e.target.value)} placeholder="Enter your first name, nickname, or initials..." className="min-h-32 w-full resize-none rounded-2xl border border-white/20 bg-white/10 p-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-white/60" /><p className="mt-2 text-right text-xs text-white/60">{stampMessage.length} / 15</p><div className="mt-4 grid grid-cols-4 gap-2">{COLORS.map((item) => <button key={item.name} type="button" onClick={() => chooseMarker(item)} className={`rounded-xl border p-2 text-xs ${stampColor === item.value ? 'border-white bg-white/20' : 'border-white/20 bg-white/5'}`}><span className={`mx-auto mb-1 block h-7 w-2.5 rounded-full ${item.ink}`} />{item.name}</button>)}</div><div className="mt-5 flex gap-2"><button type="button" onClick={handleSign} disabled={!stampMessage.trim()} className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#087f7b] disabled:opacity-40">Sign Shirt</button><button type="button" onClick={closeModal} className="rounded-xl border border-white/30 px-4 py-3 text-sm">Cancel</button></div></section></div>}<aside className="absolute right-3 top-1/2 z-10 flex w-12 -translate-y-1/2 flex-col items-center gap-1 rounded-2xl border border-white/30 bg-[#087f7b]/70 p-1 shadow-2xl backdrop-blur-xl"><div className={`${markerTrayOpen ? 'flex' : 'hidden'} absolute right-0 bottom-full mb-2 w-12 flex-col items-center justify-center gap-3 rounded-xl border border-white/25 bg-[#087f7b]/95 p-1 shadow-xl backdrop-blur-xl md:hidden`}>{COLORS.map((item) => <Marker key={item.name} item={item} active={active.name === item.name} onClick={() => chooseMarker(item)} />)}</div><button type="button" aria-label="Open signature modal" onClick={() => setModalOpen(true)} className="studio-control"><span className="-rotate-45 text-xl">✎</span></button><div className="h-px w-8 bg-white/30" /><div className="flex flex-col gap-1"><button type="button" aria-label="Rotate left" onClick={() => rotate('y', -0.22)} className="studio-control"><ArrowLeft size={15} /></button><button type="button" aria-label="Rotate right" onClick={() => rotate('y', 0.22)} className="studio-control"><ArrowRight size={15} /></button><button type="button" aria-label="Rotate up" onClick={() => rotate('x', -0.16)} className="studio-control"><ArrowUp size={15} /></button><button type="button" aria-label="Rotate down" onClick={() => rotate('x', 0.16)} className="studio-control"><ArrowDown size={15} /></button><button type="button" aria-label="Reset rotation" onClick={() => groupRef.current?.rotation.set(0.02, 0, 0)} className="studio-control"><RotateCcw size={14} /></button></div><div className="h-px w-8 bg-white/30" /><div className="flex flex-col gap-1"><button type="button" aria-label="Zoom out" onClick={() => setZoomLevel((v) => Math.min(8, v + 0.5))} className="studio-control text-lg">−</button><button type="button" aria-label="Zoom in" onClick={() => setZoomLevel((v) => Math.max(1.5, v - 0.5))} className="studio-control text-lg">+</button></div></aside><div className="absolute bottom-3 left-3 z-20 flex flex-col gap-1 rounded-xl border border-white/25 bg-[#087f7b]/70 p-1 backdrop-blur-xl sm:flex-row"><button type="button" onClick={() => {}} className="rounded-lg px-3 py-2 text-xs font-medium text-white transition hover:bg-white/15"><a href="about.jsx">About Me</a></button><button type="button" onClick={handleStripePayment} className="rounded-lg px-3 py-2 text-xs font-medium text-white transition hover:bg-white/15">Buy Me Coffee</button></div></main> }
export default SignoutStudio
