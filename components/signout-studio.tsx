'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { Center, Environment, Html, OrbitControls, useGLTF, useProgress, useTexture } from '@react-three/drei'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Copy, RotateCcw, Undo2, X } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gijgksznrzwdifatjthg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpamdrc3pucnp3ZGlmYXRqdGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MjE5MDcsImV4cCI6MjEwNTQ5NzkwN30.5SGBatC9Zy93C2nZjYM1LKirWlgDvmlmbbRBkBBhCgo'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const SHIRT_MODEL_URL = 'https://res.cloudinary.com/dtkluxukm/image/upload/v1787995625/Shirt_nep9xf.glb'
const COLORS = [
  { name: 'Red', value: '#c9362b', ink: 'bg-[#c9362b]' },
  { name: 'Black', value: '#17231f', ink: 'bg-[#17231f]' },
  { name: 'Green', value: '#16804b', ink: 'bg-[#16804b]' },
  { name: 'Blue', value: '#2c62a8', ink: 'bg-[#2c62a8]' },
]

const SEED_CAMPUS_STAMPS = [
  { id: 'seed-1', text: 'Davidson', color: '#17231f', position: [0.1, 0.5, 0.3] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
  { id: 'seed-2', text: 'Seyi', color: '#c9362b', position: [-0.35, 0.15, 0.45] as [number, number, number], rotation: [0.05, -0.2, 0.04] as [number, number, number] },
  { id: 'seed-3', text: 'John Paul', color: '#16804b', position: [0.25, -0.25, 0.42] as [number, number, number], rotation: [-0.04, 0.18, -0.05] as [number, number, number] },
  { id: 'seed-4', text: 'Great', color: '#2c62a8', position: [-0.2, -0.5, 0.28] as [number, number, number], rotation: [0.08, 0.1, 0] as [number, number, number] },
] as const

const DEFAULT_STAMP_SCALE: [number, number, number] = [1.8, 1.8, 0.1]

function asVec3(value: unknown): [number, number, number] {
  if (Array.isArray(value)) {
    return [Number(value[0]) || 0, Number(value[1]) || 0, Number(value[2]) || 0]
  }
  if (typeof value === 'string') {
    const parts = value.replace(/^[{\[]/, '').replace(/[}\]]$/, '').split(',').map((part) => Number(part.trim()))
    if (parts.length >= 3) return [parts[0] || 0, parts[1] || 0, parts[2] || 0]
  }
  if (value && typeof value === 'object') {
    const vector = value as { x?: number; y?: number; z?: number }
    return [Number(vector.x) || 0, Number(vector.y) || 0, Number(vector.z) || 0]
  }
  return [0, 0, 0]
}

function toPlainTriple(value: { x: number; y: number; z: number }): [number, number, number] {
  return [Number(value.x) || 0, Number(value.y) || 0, Number(value.z) || 0]
}

function createStampImage(text: string, color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const context = canvas.getContext('2d')
  if (!context) return ''
  context.clearRect(0, 0, 1024, 1024)
  context.fillStyle = color
  context.font = "italic bold 100px 'Nunito', 'Rubik', sans-serif"
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  const maxWordsPerLine = 5
  const lineHeight = 130
  const lines: string[] = []
  text.trim().split(/\r?\n/).forEach((paragraph) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      lines.push('')
      return
    }
    for (let index = 0; index < words.length; index += maxWordsPerLine) {
      lines.push(words.slice(index, index + maxWordsPerLine).join(' '))
    }
  })
  const startY = 512 - ((Math.max(lines.length, 1) - 1) * lineHeight) / 2
  if (lines.length === 0) {
    context.fillText(text, 512, 512)
  } else {
    lines.forEach((line, index) => {
      context.fillText(line, 512, startY + index * lineHeight)
    })
  }
  return canvas.toDataURL('image/png')
}

type Stamp = {
  id: string | number
  text: string
  color: string
  textImage: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

function hydrateStoredStamps(raw: unknown): Stamp[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((stamp: any) => {
    const text = typeof stamp?.text === 'string' ? stamp.text : String(stamp?.text ?? '')
    const color = typeof stamp?.color === 'string' ? stamp.color : String(stamp?.color ?? COLORS[1].value)
    const textImage = text
      ? createStampImage(text, color)
      : typeof stamp?.textImage === 'string'
        ? stamp.textImage
        : ''
    if (!textImage) return []
    return [{
      id: stamp.id ?? Date.now(),
      text,
      color,
      textImage,
      position: asVec3(stamp.position),
      rotation: asVec3(stamp.rotation),
      scale: DEFAULT_STAMP_SCALE,
    }]
  })
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

function CanvasLoader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="flex w-48 select-none flex-col items-center justify-center pointer-events-none text-center">
        <span className="mb-3 text-xs font-semibold uppercase tracking-widest text-white">
          Loading Studio
        </span>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full border border-white/40 bg-white/10">
          <div
            className="h-full bg-white transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="mt-1.5 font-mono text-[10px] text-white/70">
          {Math.round(progress)}%
        </span>
      </div>
    </Html>
  )
}

function Scene({ zoomLevel, groupRef, isPlacingStamp, stampMessage, stampColor, onStampPlaced, stamps, onStampCreate }: { zoomLevel: number; groupRef: React.RefObject<THREE.Group | null>; isPlacingStamp: boolean; stampMessage: string; stampColor: string; onStampPlaced: () => void; stamps: Stamp[]; onStampCreate: (point: THREE.Vector3, rotation: THREE.Euler) => void }) {
  const controlsRef = useRef<any>(null)
  return <Canvas shadows camera={{ position: [0, 0, zoomLevel], fov: 45 }}><color attach="background" args={['#0eb0ab']} /><ambientLight intensity={1.5} /><directionalLight castShadow position={[4, 6, 5]} intensity={2} /><Environment preset="studio" /><CameraController zoomLevel={zoomLevel} controlsRef={controlsRef} /><Suspense fallback={<CanvasLoader />}><Center disableY={false} disableX={false} disableZ={false}><ShirtMesh groupRef={groupRef} isPlacingStamp={isPlacingStamp} stampMessage={stampMessage} stampColor={stampColor} onStampPlaced={onStampPlaced} stamps={stamps} onStampCreate={onStampCreate} /></Center></Suspense><OrbitControls ref={controlsRef} makeDefault enabled={!isPlacingStamp} enablePan={false} minDistance={1.5} maxDistance={8} enableDamping dampingFactor={0.08} /></Canvas>
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

function isSamePlacement(left: Stamp, right: Stamp) {
  return left.text === right.text
    && left.position.every((value, index) => Math.abs(value - right.position[index]) < 1e-5)
    && left.rotation.every((value, index) => Math.abs(value - right.rotation[index]) < 1e-5)
}

function appendHydratedStamps(current: Stamp[], incoming: unknown) {
  const hydrated = hydrateStoredStamps(Array.isArray(incoming) ? incoming : [incoming])
  if (hydrated.length === 0) return current
  const ids = new Set(current.map((stamp) => String(stamp.id)))
  const next = hydrated.filter((stamp) => (
    !ids.has(String(stamp.id))
    && !current.some((existing) => isSamePlacement(existing, stamp))
  ))
  return next.length === 0 ? current : [...current, ...next]
}

export function SignoutStudio() {
  const [isMounted, setIsMounted] = useState(false)
  const [stamps, setStamps] = useState<Stamp[]>([])
  const [mySessionStampIds, setMySessionStampIds] = useState<string[]>([])
  const [active, setActive] = useState(COLORS[0]); const [drawing, setDrawing] = useState(false); const [zoomLevel, setZoomLevel] = useState(4); const [modalOpen, setModalOpen] = useState(false); const [isPlacingStamp, setIsPlacingStamp] = useState(false); const [stampMessage, setStampMessage] = useState(''); const [stampColor, setStampColor] = useState(COLORS[0].value); const [pointer, setPointer] = useState({ x: 0, y: 0 }); const [supportOpen, setSupportOpen] = useState(false); const [copiedAccount, setCopiedAccount] = useState<string | null>(null); const [markerTrayOpen, setMarkerTrayOpen] = useState(false); const [showGuide, setShowGuide] = useState(true); const groupRef = useRef<THREE.Group>(null)
  useEffect(() => {
    setIsMounted(true)
    const fontLink = document.createElement('link')
    fontLink.rel = 'stylesheet'
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Nunito:ital,wght@1,700;1,800&family=Rubik:ital,wght@1,700;1,800&display=swap'
    document.head.appendChild(fontLink)
    return () => fontLink.remove()
  }, [])
  useEffect(() => {
    const fetchStamps = async () => {
      const { data, error } = await supabase.from('stamps').select('*')
      if (error) {
        console.error('Failed to load stamps from Supabase', error.message)
        return
      }
      if (data) setStamps(hydrateStoredStamps(data))
    }
    fetchStamps()
  }, [])
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stamps' }, (payload) => {
        setStamps((current) => appendHydratedStamps(current, payload.new))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'stamps' }, (payload) => {
        const removedId = (payload.old as { id?: string | number } | undefined)?.id
        if (removedId == null) return
        setStamps((current) => current.filter((stamp) => String(stamp.id) !== String(removedId)))
        setMySessionStampIds((current) => current.filter((id) => id !== String(removedId)))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])
  const rotate = (axis: 'x' | 'y', amount: number) => { if (groupRef.current) groupRef.current.rotation[axis] += amount }
  const chooseMarker = (item: typeof COLORS[number]) => { setActive(item); setStampColor(item.value); setMarkerTrayOpen(false) }
  const closeModal = () => { setModalOpen(false); setStampMessage('') }
  const handleStripePayment = () => { /* Stripe integration will be wired here later. */ }
  const copyAccount = async (account: string) => { await navigator.clipboard.writeText(account); setCopiedAccount(account); window.setTimeout(() => setCopiedAccount(null), 1600) }
  const handleStampPlaced = () => { setIsPlacingStamp(false); setStampMessage('') }
  const handleTextReset = () => { setStampMessage('') }
  const handleUndoStamp = async () => {
    if (mySessionStampIds.length === 0) return
    const lastStampId = mySessionStampIds[mySessionStampIds.length - 1]
    if (!lastStampId.startsWith('local-')) {
      const { error } = await supabase.from('stamps').delete().eq('id', lastStampId)
      if (error) {
        console.error('Failed to undo stamp in Supabase', error.message, error.code)
        return
      }
    }
    setMySessionStampIds((prev) => prev.slice(0, -1))
    setStamps((current) => current.filter((stamp) => String(stamp.id) !== String(lastStampId)))
  }
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.shiftKey || event.key.toLowerCase() !== 'z') return
      if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return
      event.preventDefault()
      void handleUndoStamp()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mySessionStampIds])
  const handleStampCreate = async (point: THREE.Vector3, rotation: THREE.Euler) => {
    const activeStampMessage = stampMessage.trim()
    const activeColor = stampColor
    if (!activeStampMessage) return
    const position = toPlainTriple(point)
    const rotationTriple = toPlainTriple(rotation)
    const localId = `local-${Date.now()}`
    const localStamp: Stamp = {
      id: localId,
      text: activeStampMessage,
      color: activeColor,
      textImage: createStampImage(activeStampMessage, activeColor),
      position,
      rotation: rotationTriple,
      scale: DEFAULT_STAMP_SCALE,
    }
    setStamps((current) => [...current, localStamp])
    setMySessionStampIds((current) => [...current, localId])
    const { data, error } = await supabase.from('stamps').insert([{
      text: activeStampMessage,
      color: activeColor,
      position,
      rotation: rotationTriple,
    }]).select()
    if (error) {
      console.error('Failed to insert stamp into Supabase', error.message, error.code)
      return
    }
    const serverStamp = data?.[0]
    if (!serverStamp?.id) return
    const serverId = String(serverStamp.id)
    setStamps((current) => current.map((stamp) => (
      stamp.id === localId ? { ...stamp, id: serverId } : stamp
    )))
    setMySessionStampIds((current) => current.map((id) => (id === localId ? serverId : id)))
  }
  const handleSign = () => { if (!stampMessage.trim()) return; setModalOpen(false); setIsPlacingStamp(true) }
  return <main className="relative h-dvh w-full overflow-hidden bg-[#0eb0ab]"><div className="absolute inset-0">{isMounted ? (<Scene zoomLevel={zoomLevel} groupRef={groupRef} isPlacingStamp={isPlacingStamp} stampMessage={stampMessage} stampColor={stampColor} onStampPlaced={handleStampPlaced} stamps={stamps} onStampCreate={handleStampCreate} />) : (<div className="fixed inset-0 bg-[#0eb0ab]" />)}</div>{isPlacingStamp && <div className="pointer-events-none absolute bottom-6 left-1/2 z-30 -translate-x-1/2 animate-pulse whitespace-nowrap rounded-full border border-white/30 bg-[#087f7b]/90 px-4 py-2 text-xs font-medium text-white shadow-xl backdrop-blur-xl">Tap anywhere on the white shirt to place your signature!</div>}{showGuide && <div className="absolute inset-0 z-50 grid place-items-center bg-black/25 p-5 backdrop-blur-md"><section role="dialog" aria-modal="true" aria-labelledby="guide-title" className="relative w-full max-w-md rounded-2xl bg-white p-5 text-[#183b38] shadow-2xl md:p-6"><button type="button" onClick={() => setShowGuide(false)} aria-label="Close welcome guide" className="absolute right-3 top-3 rounded-full p-1.5 text-[#41635f] transition hover:bg-[#e9f7f5] hover:text-[#0eb0ab]"><X aria-hidden="true" /></button><div className="mb-5 pr-8"><h1 id="guide-title" className="text-xl font-black tracking-tight text-[#0eb0ab] md:text-2xl">Welcome to My Shirt Canvas</h1><p className="mt-2 text-sm text-[#41635f]">Digital university sign-out culture.</p></div><ol className="flex flex-col gap-3 text-sm leading-5 text-[#41635f]"><li>1. Click the Sign Pen Icon on the left toolbar to open the signature drawer.</li><li>2. Input your first name, initials, or nickname (maximum 15 characters) and choose an ink color.</li><li>3. Click &apos;sign your name&apos; and tap anywhere on the 3D shirt fabric to stamp it.</li><li>4. Drag to rotate the shirt, use +/- to zoom, or tap &apos;Buy Me Coffee&apos; to support.</li></ol><button type="button" onClick={() => setShowGuide(false)} className="mt-6 w-full rounded-xl bg-[#0eb0ab] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#087f7b]">Get Started</button></section></div>}{modalOpen && <div className="absolute inset-0 z-40 grid place-items-center bg-black/20 p-5 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-labelledby="signature-title" className="w-full max-w-md rounded-3xl border border-white/30 bg-[#087f7b]/95 p-5 text-white shadow-2xl"><div className="mb-4 flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.24em] text-white/60">Leave your mark</p><h2 id="signature-title" className="mt-1 text-xl font-semibold">Sign my shirt</h2></div><button type="button" aria-label="Close signature modal" onClick={closeModal} className="text-2xl text-white/70">X</button></div><textarea maxLength={50} value={stampMessage} onChange={(e) => setStampMessage(e.target.value)} placeholder="Input your first name, nickname or intials" className="min-h-32 w-full resize-none rounded-2xl border border-white/20 bg-white/10 p-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-white/60" /><p className="mt-2 text-right text-xs text-white/60">{stampMessage.length} / 50</p><div className="mt-4 grid grid-cols-4 gap-2">{COLORS.map((item) => <button key={item.name} type="button" onClick={() => chooseMarker(item)} className={`rounded-xl border p-2 text-xs ${stampColor === item.value ? 'border-white bg-white/20' : 'border-white/20 bg-white/5'}`}><span className={`mx-auto mb-1 block h-7 w-2.5 rounded-full ${item.ink}`} />{item.name}</button>)}</div><div className="mt-5 flex gap-2"><button type="button" onClick={handleSign} disabled={!stampMessage.trim()} className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#087f7b] disabled:opacity-40">Sign Shirt</button><button type="button" onClick={closeModal} className="rounded-xl border border-white/30 px-4 py-3 text-sm">Cancel</button></div></section></div>}<aside className="absolute right-3 top-1/2 z-10 flex w-12 -translate-y-1/2 flex-col items-center gap-1 rounded-2xl border border-white/30 bg-[#087f7b]/70 p-1 shadow-2xl backdrop-blur-xl"><div className={`${markerTrayOpen ? 'flex' : 'hidden'} absolute right-0 bottom-full mb-2 w-12 flex-col items-center justify-center gap-3 rounded-xl border border-white/25 bg-[#087f7b]/95 p-1 shadow-xl backdrop-blur-xl md:hidden`}>{COLORS.map((item) => <Marker key={item.name} item={item} active={active.name === item.name} onClick={() => chooseMarker(item)} />)}</div><button type="button" aria-label="Open signature modal" onClick={() => setModalOpen(true)} className="studio-control"><span className="-rotate-45 text-xl">✎</span></button><div className="h-px w-8 bg-white/30" /><div className="flex flex-col gap-1"><button type="button" aria-label="Rotate left" onClick={() => rotate('y', -0.22)} className="studio-control"><ArrowLeft size={15} /></button><button type="button" aria-label="Rotate right" onClick={() => rotate('y', 0.22)} className="studio-control"><ArrowRight size={15} /></button><button type="button" aria-label="Rotate up" onClick={() => rotate('x', -0.16)} className="studio-control"><ArrowUp size={15} /></button><button type="button" aria-label="Rotate down" onClick={() => rotate('x', 0.16)} className="studio-control"><ArrowDown size={15} /></button><button type="button" aria-label="Reset rotation" onClick={() => groupRef.current?.rotation.set(0.02, 0, 0)} className="studio-control"><RotateCcw size={14} /></button><button type="button" aria-label="Undo last stamp" disabled={mySessionStampIds.length === 0} onClick={handleUndoStamp} className="studio-control disabled:opacity-40"><Undo2 size={14} /></button></div><div className="h-px w-8 bg-white/30" /><div className="flex flex-col gap-1"><button type="button" aria-label="Zoom out" onClick={() => setZoomLevel((v) => Math.min(8, v + 0.5))} className="studio-control text-lg">−</button><button type="button" aria-label="Zoom in" onClick={() => setZoomLevel((v) => Math.max(1.5, v - 0.5))} className="studio-control text-lg">+</button></div></aside><div className="absolute bottom-3 left-3 z-20 flex flex-col gap-1 rounded-xl border border-white/25 bg-[#087f7b]/70 p-1 backdrop-blur-xl sm:flex-row"><button type="button" onClick={() => {}} className="rounded-lg px-3 py-2 text-xs font-medium text-white transition hover:bg-white/15"><a href="https://www.webdesignking.online">My Portfolio</a></button></div><button type="button" onClick={() => setSupportOpen(true)} className="absolute bottom-5 right-5 z-30 rounded-full border border-white/30 bg-[#087f7b]/85 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur transition hover:bg-[#087f7b]">Buy Me Coffee</button>{supportOpen && <div className="absolute inset-0 z-50 grid place-items-center bg-black/25 p-5 backdrop-blur-md"><section role="dialog" aria-modal="true" aria-labelledby="support-title" className="w-full max-w-lg rounded-[2rem] border border-white/50 bg-white/90 p-6 text-[#183b38] shadow-2xl"><div className="mb-6 text-center"><h2 id="support-title" className="text-2xl font-black">Support My Next Chapter</h2><p className="mt-2 text-sm text-[#41635f]">Gifts are entirely optional but highly appreciated!</p></div><div className="space-y-3"><div className="rounded-2xl border border-[#0e8f89]/15 bg-[#e9f7f5] p-4"><p className="text-[11px] font-bold tracking-[0.16em] text-[#0e8f89]">NAIRA TRANSFER</p><p className="mt-2 font-bold">Opay</p><div className="mt-2 flex items-center justify-between gap-3"><span className="text-lg font-black tracking-wide">9157632234</span><button type="button" aria-label="Copy Naira account number" onClick={() => copyAccount('9157632234')} className="rounded-xl bg-[#0e8f89] p-2 text-white hover:bg-[#087f7b]">{copiedAccount === '9157632234' ? <Check size={16} /> : <Copy size={16} />}</button></div><p className="mt-1 text-xs text-[#41635f]">Great Chukwuebuka Ibewuike</p></div><div className="rounded-2xl border border-[#0e8f89]/15 bg-[#f1f2f8] p-4"><p className="text-[11px] font-bold tracking-[0.16em] text-[#4d5ca8]">DOLLAR TRANSFER</p><p className="mt-2 font-bold">Lead Bank</p><div className="mt-2 flex items-center justify-between gap-3"><span className="text-lg font-black tracking-wide">214271831502</span><button type="button" aria-label="Copy Dollar account number" onClick={() => copyAccount('214271831502')} className="rounded-xl bg-[#4d5ca8] p-2 text-white hover:bg-[#39498f]">{copiedAccount === '214271831502' ? <Check size={16} /> : <Copy size={16} />}</button></div><p className="mt-1 text-xs text-[#41635f]">Great Chukwuebuka Ibewuike</p></div></div><button type="button" onClick={() => setSupportOpen(false)} className="mt-6 w-full rounded-xl border border-[#183b38]/15 px-4 py-3 text-sm font-semibold hover:bg-[#183b38] hover:text-white">Close</button></section></div>}</main> }
export default SignoutStudio
