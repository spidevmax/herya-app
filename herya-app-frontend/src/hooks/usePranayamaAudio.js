import { useRef, useCallback, useEffect } from "react";

/**
 * Web Audio API engine for pranayama.
 *
 * Plays phase-specific sounds defined in technique profiles with smooth
 * envelopes (no clicks/pops). Supports independent volume controls for
 * guide tones and phase-change cues, plus a global mute.
 *
 * Audio descriptors come from techniqueProfiles.js:
 *   { type: "sine"|"square"|"noise", freq, gain, attack, release, sustain? }
 *
 * The hook respects `prefers-reduced-motion` by defaulting to lower volume.
 */
export default function usePranayamaAudio({
	enabled = true,
	guideVolume = 1, // 0–1 multiplier for breathing guide tones
	cueVolume = 1, // 0–1 multiplier for phase-change bells
} = {}) {
	const ctxRef = useRef(null);
	const activeNodesRef = useRef([]);
	const reducedMotion =
		typeof window !== "undefined" &&
		window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

	// Lazy-init AudioContext (must be triggered by user gesture)
	const getCtx = useCallback(() => {
		if (!ctxRef.current) {
			try {
				ctxRef.current = new AudioContext();
			} catch {
				return null;
			}
		}
		if (ctxRef.current.state === "suspended") {
			ctxRef.current.resume().catch(() => {});
		}
		return ctxRef.current;
	}, []);

	// Stop all currently playing nodes
	const stopAll = useCallback(() => {
		for (const { osc, gain, ctx } of activeNodesRef.current) {
			try {
				gain.gain.cancelScheduledValues(ctx.currentTime);
				gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
				gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
				osc.stop(ctx.currentTime + 0.06);
			} catch {
				// Already stopped
			}
		}
		activeNodesRef.current = [];
	}, []);

	/**
	 * Play a sound descriptor.
	 * @param {object|null} descriptor - Audio descriptor from profile
	 * @param {"guide"|"cue"} category - Which volume control to use
	 * @param {number} [durationSec] - Override duration (for sustain sounds)
	 */
	const play = useCallback(
		(descriptor, category = "guide", durationSec) => {
			if (!enabled || !descriptor) return;
			const ctx = getCtx();
			if (!ctx) return;

			const vol =
				category === "cue" ? cueVolume : guideVolume;
			const baseGain = descriptor.gain * vol * (reducedMotion ? 0.5 : 1);
			if (baseGain <= 0.001) return;

			const { type, freq, attack, release, sustain } = descriptor;

			// Create oscillator or noise source
			let source;
			if (type === "noise") {
				// White noise via buffer
				const bufferSize = ctx.sampleRate * Math.max(release, durationSec || 1);
				const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
				const data = buffer.getChannelData(0);
				for (let i = 0; i < bufferSize; i++) {
					data[i] = (Math.random() * 2 - 1) * 0.3; // lower amplitude noise
				}
				source = ctx.createBufferSource();
				source.buffer = buffer;
				source.loop = false;
			} else {
				source = ctx.createOscillator();
				source.type = type || "sine";
				source.frequency.value = freq || 440;
			}

			const gainNode = ctx.createGain();
			source.connect(gainNode);
			gainNode.connect(ctx.destination);

			const now = ctx.currentTime;
			const attackEnd = now + (attack || 0.01);
			const totalDur = sustain && durationSec
				? durationSec
				: (attack || 0.01) + (release || 0.3);

			// Envelope
			gainNode.gain.setValueAtTime(0.001, now);
			gainNode.gain.linearRampToValueAtTime(baseGain, attackEnd);

			if (sustain && durationSec) {
				// Hold gain until near the end, then release
				const releaseStart = now + durationSec - (release || 0.3);
				gainNode.gain.setValueAtTime(baseGain, Math.max(attackEnd, releaseStart));
				gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
			} else {
				gainNode.gain.exponentialRampToValueAtTime(0.001, now + totalDur);
			}

			source.start(now);
			source.stop(now + totalDur + 0.05);

			const node = { osc: source, gain: gainNode, ctx };
			activeNodesRef.current.push(node);
			source.onended = () => {
				activeNodesRef.current = activeNodesRef.current.filter(
					(n) => n !== node,
				);
			};
		},
		[enabled, guideVolume, cueVolume, reducedMotion, getCtx],
	);

	/**
	 * Play a phase-change cue from the profile's audio config.
	 */
	const playPhaseChange = useCallback(
		(profileAudio) => {
			if (!profileAudio) return;
			play(profileAudio.phaseChange, "cue");
		},
		[play],
	);

	/**
	 * Play a round-change cue (for Kapalabhati/Bhastrika).
	 */
	const playRoundChange = useCallback(
		(profileAudio) => {
			if (!profileAudio) return;
			play(profileAudio.roundChange || profileAudio.phaseChange, "cue");
		},
		[play],
	);

	/**
	 * Play the phase-specific guide sound.
	 * @param {string} phase - "inhale" | "hold" | "exhale" | "holdAfterExhale"
	 * @param {object} profileAudio - audio config from profile
	 * @param {number} [durationSec] - phase duration for sustain sounds
	 */
	const playPhaseGuide = useCallback(
		(phase, profileAudio, durationSec) => {
			if (!profileAudio) return;
			stopAll(); // stop previous guide sound
			const descriptor = profileAudio[phase];
			if (descriptor) {
				play(descriptor, "guide", descriptor.sustain ? durationSec : undefined);
			}
		},
		[play, stopAll],
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stopAll();
			if (ctxRef.current) {
				ctxRef.current.close().catch(() => {});
				ctxRef.current = null;
			}
		};
	}, [stopAll]);

	return {
		play,
		playPhaseChange,
		playRoundChange,
		playPhaseGuide,
		stopAll,
		getCtx,
	};
}
