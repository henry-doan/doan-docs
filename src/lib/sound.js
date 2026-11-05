/**
 * Paper sounds for the book intro, and Sir Pounce's purr, made with Web Audio
 * rather than recorded: a page turn is a short burst of filtered noise that
 * sweeps up as the page lifts. The audio context is created on the first
 * sound, which always follows a click, so browsers allow it to play.
 */

let context = null
let noise = null

const getContext = () => {
  if (!context) {
    const AudioContext = window.AudioContext ?? window.webkitAudioContext
    if (!AudioContext) return null
    context = new AudioContext()
    // One second of white noise, reused by every sound.
    noise = context.createBuffer(1, context.sampleRate, context.sampleRate)
    const samples = noise.getChannelData(0)
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1
  }
  if (context.state === 'suspended') context.resume()
  return context
}

/** A burst of noise through a band-pass filter, swept from `from` to `to` Hz. */
const burst = (audio, start, { duration, from, to, volume, q = 0.9 }) => {
  const source = audio.createBufferSource()
  source.buffer = noise
  const filter = audio.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = q
  filter.frequency.setValueAtTime(from, start)
  filter.frequency.exponentialRampToValueAtTime(to, start + duration)
  const gain = audio.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + duration * 0.25)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  source.connect(filter).connect(gain).connect(audio.destination)
  // Start somewhere different in the noise each time so turns don't sound identical.
  source.start(start, Math.random() * 0.5, duration)
}

/** One page turning, `delay` milliseconds from now. */
export const playPageTurn = (delay = 0) => {
  const audio = getContext()
  if (!audio) return
  const start = audio.currentTime + delay / 1000
  const pitch = 0.85 + Math.random() * 0.3
  burst(audio, start, { duration: 0.32, from: 1400 * pitch, to: 3600 * pitch, volume: 0.22 })
  // The page settling on the other side.
  burst(audio, start + 0.3, { duration: 0.12, from: 900 * pitch, to: 500 * pitch, volume: 0.1, q: 0.6 })
}

/** The heavy front board swinging open and landing. */
export const playCoverOpen = (delay = 0) => {
  const audio = getContext()
  if (!audio) return
  const start = audio.currentTime + delay / 1000
  burst(audio, start, { duration: 0.6, from: 500, to: 1600, volume: 0.16, q: 0.7 })
  burst(audio, start + 0.62, { duration: 0.22, from: 260, to: 120, volume: 0.35, q: 0.5 })
}

/**
 * A cat's purr: low rumbling noise whose loudness pulses about 26 times a
 * second, swelling in and fading out over a couple of seconds.
 */
export const playPurr = () => {
  const audio = getContext()
  if (!audio) return
  const start = audio.currentTime
  const duration = 2.2

  const source = audio.createBufferSource()
  source.buffer = noise
  source.loop = true
  const rumble = audio.createBiquadFilter()
  rumble.type = 'lowpass'
  rumble.frequency.value = 260

  // The pulse: a 26 Hz wave swings this gain between 0.1 and 1.
  const pulse = audio.createGain()
  pulse.gain.value = 0.55
  const rate = audio.createOscillator()
  rate.frequency.value = 26
  const depth = audio.createGain()
  depth.gain.value = 0.45
  rate.connect(depth).connect(pulse.gain)

  const volume = audio.createGain()
  volume.gain.setValueAtTime(0.0001, start)
  volume.gain.exponentialRampToValueAtTime(0.5, start + 0.35)
  volume.gain.setValueAtTime(0.5, start + duration - 0.6)
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  source.connect(rumble).connect(pulse).connect(volume).connect(audio.destination)
  source.start(start)
  rate.start(start)
  source.stop(start + duration)
  rate.stop(start + duration)
}

/** A soft rising rush of air, for the castle filling the screen. */
export const playWhoosh = () => {
  const audio = getContext()
  if (!audio) return
  const start = audio.currentTime
  burst(audio, start, { duration: 2.6, from: 220, to: 1900, volume: 0.22, q: 0.6 })
  burst(audio, start + 0.3, { duration: 2.2, from: 120, to: 420, volume: 0.14, q: 0.5 })
}
